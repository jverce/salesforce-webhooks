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
  webhookCallout,
) => {
  const { name: webhookCalloutName } = webhookCallout;
  const triggerName = getRandomName('Trigger');
  const body = template({
    triggerName,
    endpointUrl,
    sObjectType,
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
