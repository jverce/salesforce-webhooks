'use strict';

import { post } from 'axios';

import {
  getSObjectFactory,
  getWebhookCallout,
  getWebhookCalloutMock,
  getWebhookTrigger,
  getWebhookTriggerTest,
} from './utils/apex';
import {
  getCreateRemoteSiteBody,
} from './utils/metadata';

export class SalesforceClient {

  constructor(opts = {}) {
    const {
      apiVersion = process.env.SALESFORCE_API_VERSION || '50.0',
      authToken = process.env.SALESFORCE_AUTH_TOKEN,
      instance = process.env.SALESFORCE_INSTANCE,
    } = opts;
    this.authToken = authToken;
    this.metadataApiUrl = `https://${instance}.salesforce.com/services/Soap/m/${apiVersion}`;
    this.soapApiUrl = `https://${instance}.salesforce.com/services/Soap/s/${apiVersion}`;
  }

  _getApexCode(endpointUrl, sObjectType, event, ) {
    const webhookTrigger = getWebhookTrigger(
      endpointUrl,
      sObjectType,
      events,
      webhookCallout,
    );
    const triggerTest = getTriggerTest(
      endpointUrl,
      sObjectType,
      sobjectFactory,
    );

    return {
      sobjectFactory,
      triggerTest,
      webhookCallout,
      webhookTrigger,
    };
  }

  _baseHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'text/xml',
    };
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

  _getApexComponents(
    endpointUrl,
    sObjectType,
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
      webhookCallout,
    );
    const webhookTriggerTest = getWebhookTriggerTest(
      triggerTestTemplate,
      endpointUrl,
      sObjectType,
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

  _getDeployApexCodeRequest(apexComponents) {
    const {
      classes,
      triggers,
    } = apexComponents;
    const template = require('../resources/templates/soap/apex/DeployApexCode.xml.handlebars');
    const classBodies = classes.map(c => c.body);
    const triggerBodies = triggers.map(t => t.body);
    const body = template({
      authToken: this.authToken,
      classBodies,
      triggerBodies,
    });
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
      name,
      body,
    } = getCreateRemoteSiteBody(endpointUrl, this.authToken);
    const headers = {
      ...this._baseHeaders(),
      'SOAPAction': 'remoteSiteSetting',
    };
    const requestConfig = {
      headers,
    };
    try {
      await post(this.metadataApiUrl, body, requestConfig);
      return {
        remoteSiteName: name,
      };
    } catch(error) {
      console.error(`
        Could not deploy Apex code to Salesforce.
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
      secretToken = '',
    } = opts;

    const apexComponents = this._getApexComponents(
      endpointUrl,
      sObjectType,
      secretToken,
      triggerTemplate,
      triggerTestTemplate,
    );

    const classNames = apexComponents.classes.map(c => c.name);
    const triggerNames = apexComponents.triggers.map(t => t.name);

    const {
      body,
      headers,
    } = this._getDeployApexCodeRequest(apexComponents);
    const requestConfig = {
      headers,
    };
    try {
      await post(this.soapApiUrl, body, requestConfig);
      return {
        classNames,
        triggerNames,
      };
    } catch(error) {
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

  async createWebhookNew(opts) {
    const triggerTemplate = require('../resources/templates/apex/src/NewSObject.trigger.handlebars');
    const triggerTestTemplate = require('../resources/templates/apex/test/NewSObjectTriggerTest.cls.handlebars');
    return this._createWebhookWorkflow(
      triggerTemplate,
      triggerTestTemplate,
      opts,
    );
  }

  async createWebhookUpdated(opts) {
    const triggerTemplate = require('../resources/templates/apex/src/UpdatedSObject.trigger.handlebars');
    const triggerTestTemplate = require('../resources/templates/apex/test/NewSObjectTriggerTest.cls.handlebars');
    return this._createWebhookWorkflow(
      triggerTemplate,
      triggerTestTemplate,
      opts,
    );
  }

  async createWebhookDeleted(opts) {
    const triggerTemplate = require('../resources/templates/apex/src/DeletedSObject.trigger.handlebars');
    const triggerTestTemplate = require('../resources/templates/apex/test/NewSObjectTriggerTest.cls.handlebars');
    return this._createWebhookWorkflow(
      triggerTemplate,
      triggerTestTemplate,
      opts,
    );
  }

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

}
