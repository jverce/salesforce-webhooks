import { getRandomName } from './common';

export const getWebhookCallout = (secretToken) => {
  const template = require('../../resources/templates/apex/src/WebhookCallout.cls.handlebars');
  const webhookCalloutName = getRandomName('Callout');
  const body = template({
    webhookCalloutName,
    secretToken,
  });
  return {
    body,
    name: webhookCalloutName,
  };
};

export const getWebhookCalloutMock = () => {
  const template = require('../../resources/templates/apex/test/HttpCalloutMock.cls.handlebars');
  const webhookCalloutMockName = getRandomName('CalloutMock');
  const body = template({
    webhookCalloutMockName,
  });
  return {
    body,
    name: webhookCalloutMockName,
  };
};

export const getSObjectFactory = () => {
  const template = require('../../resources/templates/apex/test/SObjectFactory.cls.handlebars');
  const name = getRandomName('SObjectFactory');
  const body = template({
    name,
  });
  return {
    body,
    name,
  };
};

export const getWebhookTrigger = (
  template,
  endpointUrl,
  sObjectType,
  associateParentEntity,
  webhookCallout,
) => {
  const { name: webhookCalloutName } = webhookCallout;
  const triggerName = getRandomName('Trigger');
  const body = template({
    triggerName,
    endpointUrl,
    sObjectType,
    associateParentEntity,
    webhookCalloutName,
  });
  return {
    body,
    name: triggerName,
  };
};

export const getWebhookTriggerTest = (
  template,
  endpointUrl,
  sObjectType,
  sObjectFactory,
  webhookCalloutMock,
) => {
  const { name: sObjectFactoryName } = sObjectFactory;
  const { name: webhookCalloutMockName } = webhookCalloutMock;
  const testClassName = getRandomName('Test');
  const body = template({
    testClassName,
    endpointUrl,
    sObjectType,
    sObjectFactoryName,
    webhookCalloutMockName,
  });
  return {
    body,
    name: testClassName,
  };
};

export const getDeployApexCodeBody = (authToken, classes, triggers) => {
  const template = require('../../resources/templates/soap/apex/DeployApexCode.xml.handlebars');
  const classBodies = classes.map(c => c.body);
  const triggerBodies = triggers.map(t => t.body);
  const body = template({
    authToken,
    classBodies,
    triggerBodies,
  });
  return {
    body,
  };
};

export const getDeleteApexCodeBody = (authToken, classNames, triggerNames) => {
  const template = require('../../resources/templates/soap/apex/DeleteApexCode.xml.handlebars');
  const body = template({
    authToken,
    classNames,
    triggerNames,
  });
  return {
    body,
  };
};
