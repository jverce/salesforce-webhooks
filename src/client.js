'use strict';

import {
  get as httpGet,
  post as httpPost,
} from 'axios';

import {
  getDeleteApexCodeBody,
  getDeployApexCodeBody,
  getSObjectFactory,
  getWebhookCallout,
  getWebhookCalloutMock,
  getWebhookTrigger,
  getWebhookTriggerTest,
} from './utils/apex';
import {
  getCreateRemoteSiteBody,
  getDeleteRemoteSiteBody,
} from './utils/metadata';

export class SalesforceClient {

  /**
   * Creates an instance of this class with the provided parameters.
   *
   * @param {object} opts the options object
   * @param {string} opts.authToken the Salesforce API authentication token
   * @param {string} opts.instance the server instance in which the target
   * Salesforce organization is located (e.g. `NA139`). See
   * [https://help.salesforce.com/articleView?id=000314281&type=1&mode=1&language=en_US](the
   * docs) for more information.
   * @param {string} opts.apiVersion the Salesforce API version (or `50.0` if
   * left unspecified)
   */
  constructor(opts = {}) {
    const {
      apiVersion = process.env.SALESFORCE_API_VERSION || '50.0',
      authToken = process.env.SALESFORCE_AUTH_TOKEN,
      instance = process.env.SALESFORCE_INSTANCE,
    } = opts;
    this._validateConstructorOpts(apiVersion, authToken, instance);
    this.authToken = authToken;
    this.metadataApiUrl = `https://${instance}.salesforce.com/services/Soap/m/${apiVersion}`;
    this.soapApiUrl = `https://${instance}.salesforce.com/services/Soap/s/${apiVersion}`;
    this.sObjectsApiUrl = `https://${instance}.salesforce.com/services/data/v${apiVersion}/sobjects`;
  }

  _validateConstructorOpts(apiVersion, authToken, instance) {
    if (!/^\d+\.0$/.test(apiVersion)) {
      throw new Error(`Invalid API version parameter: ${apiVersion}`);
    }

    if (!authToken) {
      throw new Error(`An authentication token must be provided.`);
    }

    if (!instance) {
      throw new Error('Instance information must be provided');
    }
  }

  async _getSObjectDescription(sObjectType) {
    const url = `${this.sObjectsApiUrl}/${sObjectType}/describe`;
    const headers = this._baseHeaders();
    const requestConfig = {
      headers,
    };
    const { data } = await httpGet(url, requestConfig);
    return data;
  }

  _getCommonApexComponents(secretToken) {
    const sObjectFactory = getSObjectFactory();
    const webhookCallout = getWebhookCallout(secretToken);
    const webhookCalloutMock = getWebhookCalloutMock();
    return {
      sObjectFactory,
      webhookCallout,
      webhookCalloutMock,
    };
  }

  async _getApexComponents(
    endpointUrl,
    sObjectType,
    associateParentEntity,
    secretToken,
    triggerTemplate,
    triggerTestTemplate,
  ) {
    const {
      sObjectFactory,
      webhookCallout,
      webhookCalloutMock,
    } = this._getCommonApexComponents(secretToken);

    const webhookTrigger = getWebhookTrigger(
      triggerTemplate,
      endpointUrl,
      sObjectType,
      associateParentEntity,
      webhookCallout,
    );

    const sObjectUnderTest = associateParentEntity ? associateParentEntity : sObjectType;
    const webhookTriggerTest = getWebhookTriggerTest(
      triggerTestTemplate,
      endpointUrl,
      sObjectUnderTest,
      sObjectFactory,
      webhookCalloutMock,
    );
    const classes = [
      sObjectFactory,
      webhookCallout,
      webhookCalloutMock,
      webhookTriggerTest,
    ];
    const triggers = [
      webhookTrigger,
    ];
    return {
      classes,
      triggers,
    };
  }

  _baseHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'text/xml',
    };
  }

  _getDeployApexCodeRequest(classes, triggers) {
    const { body } = getDeployApexCodeBody(this.authToken, classes, triggers);
    const headers = {
      ...this._baseHeaders(),
      'SOAPAction': 'compileAndTest',
    };
    return {
      body,
      headers,
    };
  }

  async _createRemoteSiteSetting(opts) {
    const { endpointUrl } = opts;
    const {
      body,
      name,
    } = getCreateRemoteSiteBody(this.authToken, endpointUrl);
    const headers = {
      ...this._baseHeaders(),
      'SOAPAction': 'remoteSiteSetting',
    };
    const requestConfig = {
      headers,
    };
    try {
      await httpPost(this.metadataApiUrl, body, requestConfig);
      return {
        remoteSiteName: name,
      };
    } catch(error) {
      console.error(`
        Could not setup remote site in Salesforce.
        - Error message: ${error}
        - Remote Site name: ${name}
      `);
      throw new Error(`${error}`);
    }
  }

  async _deployWebhook(
    triggerTemplate,
    triggerTestTemplate,
    opts,
  ) {
    const {
      endpointUrl,
      sObjectType,
      associateParentEntity,
      secretToken = '',
    } = opts;

    const apexComponents = await this._getApexComponents(
      endpointUrl,
      sObjectType,
      associateParentEntity,
      secretToken,
      triggerTemplate,
      triggerTestTemplate,
    );

    const {
      classes,
      triggers,
    } = apexComponents;
    const classNames = classes.map(c => c.name);
    const triggerNames = triggers.map(t => t.name);
    const {
      body,
      headers,
    } = this._getDeployApexCodeRequest(classes, triggers);
    const requestConfig = {
      headers,
    };
    try {
      await httpPost(this.soapApiUrl, body, requestConfig);
      return {
        classNames,
        triggerNames,
      };
    } catch(error) {
      console.error('############ REQUEST ############')
      console.error(error.request)
      console.error('############ RESPONSE ###########')
      console.error(error.response)
      console.error(`
        Could not deploy Apex code to Salesforce.
        - Error message: ${error}
        - Classes: ${JSON.stringify(classNames, null, 2)}
        - Triggers: ${JSON.stringify(triggerNames, null, 2)}
      `);
      throw new Error(`${error}`);
    }
  }

  async _createWebhookWorkflow(
    triggerTemplate,
    triggerTestTemplate,
    opts,
  ) {
    const { remoteSiteName } = await this._createRemoteSiteSetting(opts);
    const {
      classNames,
      triggerNames,
    } = await this._deployWebhook(
      triggerTemplate,
      triggerTestTemplate,
      opts,
    );
    return {
      remoteSiteName,
      classNames,
      triggerNames,
    };
  }

  _getDeleteApexCodeRequest(classNames, triggerNames) {
    const { body } = getDeleteApexCodeBody(this.authToken, classNames, triggerNames);
    const headers = {
      ...this._baseHeaders(),
      'SOAPAction': 'compileAndTest',
    };
    return {
      body,
      headers,
    };
  }

  async _deleteApexCode(classNames, triggerNames) {
    const {
      body,
      headers,
    } = this._getDeleteApexCodeRequest(classNames, triggerNames);
    const requestConfig = {
      headers,
    };
    try {
      await httpPost(this.soapApiUrl, body, requestConfig);
    } catch (error) {
      console.error(`
        Could not delete Apex code from Salesforce.
        - Error message: ${error}
        - Classes: ${JSON.stringify(classNames, null, 2)}
        - Triggers: ${JSON.stringify(triggerNames, null, 2)}
      `);
      throw new Error(`${error}`);
    }
  }

  _getDeleteRemoteSiteSettingRequest(remoteSiteName) {
    const { body } = getDeleteRemoteSiteBody(this.authToken, remoteSiteName);
    const headers = {
      ...this._baseHeaders(),
      'SOAPAction': 'remoteSiteSetting',
    };
    return {
      body,
      headers,
    };
  }

  async _deleteRemoteSiteSetting(remoteSiteName) {
    const {
      body,
      headers,
    } = this._getDeleteRemoteSiteSettingRequest(remoteSiteName);
    const requestConfig = {
      headers,
    };
    try {
      await httpPost(this.metadataApiUrl, body, requestConfig);
    } catch(error) {
      console.error(`
        Could not delete remote site setting from Salesforce.
        - Error message: ${error}
        - Remote Site name: ${remoteSiteName}
      `);
      throw new Error(`${error}`);
    }
  }

  async _deleteWebhookWorkflow(
    remoteSiteName,
    classNames,
    triggerNames,
  ) {
    await this._deleteApexCode(classNames, triggerNames);
    await this._deleteRemoteSiteSetting(remoteSiteName);
  }

  _validateCreateWebhookOpts({
    endpointUrl,
    event,
    sObjectType,
  }) {
    if (!endpointUrl) {
      throw new Error('Parameter "endpointUrl" is required.')
    }
    if (!sObjectType) {
      throw new Error('Parameter "sObjectType" is required.')
    }
    const allowedSObjectTypes = SalesforceClient.getAllowedSObjects(event);
    if (!allowedSObjectTypes.includes(sObjectType)) {
      throw new Error(`${sObjectType} is not supported for events of type "${event}".`);
    }
  }

  static _getAllowedSObjectsNew() {
    const basicSObjects = require('../resources/data/sobjects-new.json');
    const changeEvents = require('../resources/data/sobjects-new-change-event.json');
    return [
      ...basicSObjects,
      ...changeEvents
    ].sort();
  }

  static _getAllowedSObjectsUpdated() {
    return require('../resources/data/sobjects-updated.json');
  }

  static _getAllowedSObjectsDeleted() {
    return require('../resources/data/sobjects-deleted.json');
  }

  static getAllowedSObjects(event) {
    if (event === 'new') {
      return this._getAllowedSObjectsNew();
    } else if (event === 'updated') {
      return this._getAllowedSObjectsUpdated();
    } else if (event === 'deleted') {
      return this._getAllowedSObjectsDeleted();
    }
    return [];
  }

  /**
   * Create a new webhook in a Salesforce org that gets triggered whenever a new
   * SObject is created.
   *
   * @param {object} opts the options object
   * @param {string} opts.endpointUrl the endpoint's URL to call whenever the
   * webhook gets triggered
   * @param {string} opts.sObjectType the type of SObject for which the webhook
   * will listen to events
   * @param {string} opts.secretToken optional (but recommended), this is an
   * arbitrary key that will be provided by each webhook call in its headers
   * under the tag `X-Webhook-Token`. This allows for the receiving end of the
   * HTTP call to verify the identity of the caller.
   * @return {object} the result of the operation, which is composed of the
   * names of the new entities created in the Salesforce organization. Use this
   * object to keep track of such entities, or as an argument to
   * `deleteWebhook`.
   */
  async createWebhookNew(opts) {
    this._validateCreateWebhookOpts({
      ...opts,
      event: 'new',
    });

    // Change events should be treated differently as they are special objects
    // that get triggered asynchronously whenever their associated entity is
    // mutated. See
    // https://developer.salesforce.com/docs/atlas.en-us.change_data_capture.meta/change_data_capture/cdc_trigger_intro.htm
    const sObjectDescription = await this._getSObjectDescription(opts.sObjectType);

    let triggerTemplate;
    if (sObjectDescription.associateEntityType === 'ChangeEvent') {
      opts.associateParentEntity = sObjectDescription.associateParentEntity;
      triggerTemplate = require('../resources/templates/apex/src/NewChangeEvent.trigger.handlebars');
    } else {
      triggerTemplate = require('../resources/templates/apex/src/NewSObject.trigger.handlebars');
    }

    const triggerTestTemplate = require('../resources/templates/apex/test/NewSObjectTriggerTest.cls.handlebars');
    return this._createWebhookWorkflow(
      triggerTemplate,
      triggerTestTemplate,
      opts,
    );
  }


  /**
   * Create a new webhook in a Salesforce org that gets triggered whenever an
   * SObject is updated.
   *
   * @param {object} opts the options object
   * @param {string} opts.endpointUrl the endpoint's URL to call whenever the
   * webhook gets triggered
   * @param {string} opts.sObjectType the type of SObject for which the webhook
   * will listen to events
   * @param {string} opts.secretToken optional (but recommended), this is an
   * arbitrary key that will be provided by each webhook call in its headers
   * under the tag `X-Webhook-Token`. This allows for the receiving end of the
   * HTTP call to verify the identity of the caller.
   * @return {object} the result of the operation, which is composed of the
   * names of the new entities created in the Salesforce organization. Use this
   * object to keep track of such entities, or as an argument to
   * `deleteWebhook`.
   */
  async createWebhookUpdated(opts) {
    this._validateCreateWebhookOpts({
      ...opts,
      event: 'updated',
    });

    // Change events should be treated differently as they are special objects
    // that get triggered asynchronously whenever their associated entity is
    // mutated. The **DO NOT SUPPORT** events other than `after insert`. See
    // https://developer.salesforce.com/docs/atlas.en-us.change_data_capture.meta/change_data_capture/cdc_trigger_intro.htm
    const sObjectDescription = await this._getSObjectDescription(opts.sObjectType);
    if (sObjectDescription.associateEntityType === 'ChangeEvent') {
      throw new Error(`${sObjectType} does not support "updated" events`);
    }

    const triggerTemplate = require('../resources/templates/apex/src/UpdatedSObject.trigger.handlebars');
    const triggerTestTemplate = require('../resources/templates/apex/test/UpdatedSObjectTriggerTest.cls.handlebars');
    return this._createWebhookWorkflow(
      triggerTemplate,
      triggerTestTemplate,
      opts,
    );
  }

  /**
   * Create a new webhook in a Salesforce org that gets triggered whenever an
   * SObject is deleted.
   *
   * @param {object} opts the options object
   * @param {string} opts.endpointUrl the endpoint's URL to call whenever the
   * webhook gets triggered
   * @param {string} opts.sObjectType the type of SObject for which the webhook
   * will listen to events
   * @param {string} opts.secretToken optional (but recommended), this is an
   * arbitrary key that will be provided by each webhook call in its headers
   * under the tag `X-Webhook-Token`. This allows for the receiving end of the
   * HTTP call to verify the identity of the caller.
   * @return {object} the result of the operation, which is composed of the
   * names of the new entities created in the Salesforce organization. Use this
   * object to keep track of such entities, or as an argument to
   * `deleteWebhook`.
   */
  async createWebhookDeleted(opts) {
    this._validateCreateWebhookOpts({
      ...opts,
      event: 'deleted',
    });

    // Change events should be treated differently as they are special objects
    // that get triggered asynchronously whenever their associated entity is
    // mutated. The **DO NOT SUPPORT** events other than `after insert`. See
    // https://developer.salesforce.com/docs/atlas.en-us.change_data_capture.meta/change_data_capture/cdc_trigger_intro.htm
    const sObjectDescription = await this._getSObjectDescription(opts.sObjectType);
    if (sObjectDescription.associateEntityType === 'ChangeEvent') {
      throw new Error(`${sObjectType} does not support "deleted" events`);
    }

    const triggerTemplate = require('../resources/templates/apex/src/DeletedSObject.trigger.handlebars');
    const triggerTestTemplate = require('../resources/templates/apex/test/DeletedSObjectTriggerTest.cls.handlebars');
    return this._createWebhookWorkflow(
      triggerTemplate,
      triggerTestTemplate,
      opts,
    );
  }

  /**
   * Create a new webhook in a Salesforce org that gets triggered whenever a
   * specific event happens to an SObject.
   *
   * @param {object} opts the options object
   * @param {string} opts.endpointUrl the endpoint's URL to call whenever the
   * webhook gets triggered
   * @param {string} opts.sObjectType the type of SObject for which the webhook
   * will listen to events
   * @param {string} opts.event the type of SObject event to listen. These can
   * be `new` (a new SObject is created), `updated` (an SObject is updated) or
   * `deleted` (an SObject is deleted).
   * @param {string} opts.secretToken optional (but recommended), this is an
   * arbitrary key that will be provided by each webhook call in its headers
   * under the tag `X-Webhook-Token`. This allows for the receiving end of the
   * HTTP call to verify the identity of the caller.
   * @return {object} the result of the operation, which is composed of the
   * names of the new entities created in the Salesforce organization. Use this
   * object to keep track of such entities, or as an argument to
   * `deleteWebhook`.
   */
  async createWebhook(opts) {
    const { event } = opts;
    if (event === 'new') {
      return this.createWebhookNew(opts);
    } else if (event === 'updated') {
      return this.createWebhookUpdated(opts);
    } else if (event === 'deleted') {
      return this.createWebhookDeleted(opts);
    } else {
      const errorMessage = `Invalid event type: ${event}`;
      throw new Error(errorMessage);
    }
  }

  _validateDeleteWebhookOpts(remoteSiteName, classNames, triggerNames) {
    if (!remoteSiteName) {
      console.warn('Parameter "remoteSiteName" is empty.');
    }

    if (!Array.isArray(classNames)) {
      throw new Error('Parameter "classNames" must be an array of strings.');
    }
    if (classNames.length <= 0) {
      console.warn('Parameter "classNames" is empty.');
    }

    if (!Array.isArray(triggerNames)) {
      throw new Error('Parameter "triggerNames" must be an array of strings.');
    }
    if (triggerNames.length <= 0) {
      console.warn('Parameter "triggerNames" is empty.');
    }
  }

  /**
   * Delete an existing webhook entities. This interface expects the webhook
   * data as provided by the output of any of the `createWebhook*` methods.
   *
   * @param {object} opts the options object
   * @param {string} opts.remoteSiteName the remote site setting name
   * @param {string[]} opts.classNames the names of the webhook classes
   * @param {string[]} opts.triggerNames the names of the webhook triggers
   */
  async deleteWebhook(opts) {
    const {
      remoteSiteName,
      classNames,
      triggerNames,
    } = opts;
    this._validateDeleteWebhookOpts(remoteSiteName, classNames, triggerNames);
    return this._deleteWebhookWorkflow(
      remoteSiteName,
      classNames,
      triggerNames,
    );
  }

}
