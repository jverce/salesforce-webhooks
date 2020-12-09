import { BailErrorStrategy, CommonTokenStream } from 'antlr4ts';
import { ApexLexer, ApexParser } from 'apex-parser';
import { CaseInsensitiveInputStream } from 'apex-parser/lib/CaseInsensitiveInputStream';
import { expect } from 'chai';
import { readFileSync } from 'fs';
import { parseXml } from 'libxmljs';
import { describe } from 'mocha';
import path from 'path';
import * as apex from '../../../src/utils/apex';

const getApexParser = (apexCode) => {
  const lexer = new ApexLexer(new CaseInsensitiveInputStream(null, apexCode));
  const tokens = new CommonTokenStream(lexer);
  const parser = new ApexParser(tokens);
  parser.errorHandler = new BailErrorStrategy();
  return parser;
};

const validateApexClass = (apexClassCode) => {
  const parser = getApexParser(apexClassCode);
  return parser.compilationUnit();
};

const validateApexTrigger = (apexTriggerCode) => {
  const parser = getApexParser(apexTriggerCode);
  return parser.triggerUnit();
};

describe('Apex code utils', function () {
  it('webhook callout generator should generate valid Apex code', async function () {
    const secretToken = 'some-secret-token';
    const { body: result } = apex.getWebhookCallout(secretToken);
    validateApexClass(result);
  });

  it('webhook callout mock generator should generate valid Apex code', async function () {
    const { body: result } = apex.getWebhookCalloutMock();
    validateApexClass(result);
  });

  it('SObject factory generator should generate valid Apex code', async function () {
    const { body: result } = apex.getSObjectFactory();
    validateApexClass(result);
  });

  it('trigger generator for new objects should generate valid Apex code', async function () {
    const template = require('../../../resources/templates/apex/src/NewSObject.trigger.handlebars');
    const endpointUrl = 'https://example.com';
    const sObjectType = 'SomeType';
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const { body: result } = apex.getWebhookTrigger(
      template,
      endpointUrl,
      sObjectType,
      undefined,
      webhookCalloutMock,
    );
    validateApexTrigger(result);
  });

  it('trigger generator for new ChangeEvent objects should generate valid Apex code', async function () {
    const template = require('../../../resources/templates/apex/src/NewChangeEvent.trigger.handlebars');
    const endpointUrl = 'https://example.com';
    const associateParentEntity = 'SomeType';
    const sObjectType = `${associateParentEntity}ChangeEvent`;
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const { body: result } = apex.getWebhookTrigger(
      template,
      endpointUrl,
      sObjectType,
      associateParentEntity,
      webhookCalloutMock,
    );
    validateApexTrigger(result);
  });

  it('trigger generator for updated objects should generate valid Apex code', async function () {
    const template = require('../../../resources/templates/apex/src/UpdatedSObject.trigger.handlebars');
    const endpointUrl = 'https://example.com';
    const sObjectType = 'SomeType';
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const { body: result } = apex.getWebhookTrigger(
      template,
      endpointUrl,
      sObjectType,
      undefined,
      webhookCalloutMock,
    );
    validateApexTrigger(result);
  });

  it('trigger test generator for deleted objects should generate valid Apex code', async function () {
    const template = require('../../../resources/templates/apex/test/DeletedSObjectTriggerTest.cls.handlebars');
    const endpointUrl = 'https://example.com';
    const sObjectType = 'SomeType';
    const sObjectFactory = apex.getSObjectFactory();
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const { body: result } = apex.getWebhookTriggerTest(
      template,
      endpointUrl,
      sObjectType,
      sObjectFactory,
      webhookCalloutMock,
    );
    validateApexClass(result);
  });

  it('trigger test generator for updated objects should generate valid Apex code', async function () {
    const template = require('../../../resources/templates/apex/test/UpdatedSObjectTriggerTest.cls.handlebars');
    const endpointUrl = 'https://example.com';
    const sObjectType = 'SomeType';
    const sObjectFactory = apex.getSObjectFactory();
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const { body: result } = apex.getWebhookTriggerTest(
      template,
      endpointUrl,
      sObjectType,
      sObjectFactory,
      webhookCalloutMock,
    );
    validateApexClass(result);
  });

  it('trigger test generator for deleted objects should generate valid Apex code', async function () {
    const template = require('../../../resources/templates/apex/test/DeletedSObjectTriggerTest.cls.handlebars');
    const endpointUrl = 'https://example.com';
    const sObjectType = 'SomeType';
    const sObjectFactory = apex.getSObjectFactory();
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const { body: result } = apex.getWebhookTriggerTest(
      template,
      endpointUrl,
      sObjectType,
      sObjectFactory,
      webhookCalloutMock,
    );
    validateApexClass(result);
  });
});

describe('SOAP request utils', function () {
  it('deploy request generator should generate a valid request', function () {
    const secretToken = 'some-secret-token';
    const classes = [
      apex.getWebhookCallout(secretToken),
      apex.getWebhookCalloutMock(),
    ];

    const template = require('../../../resources/templates/apex/src/NewSObject.trigger.handlebars');
    const endpointUrl = 'https://example.com';
    const sObjectType = 'SomeType';
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const trigger = apex.getWebhookTrigger(
      template,
      endpointUrl,
      sObjectType,
      undefined,
      webhookCalloutMock,
    );
    const triggers = [trigger];
    const authToken = 'some-token';

    const { body: requestBody } = apex.getDeployApexCodeBody(
      authToken,
      classes,
      triggers,
    );

    const result = parseXml(requestBody);
    expect(result.errors.length).to.equal(0);
  });

  it('delete request generator should generate a valid request', function () {
    const secretToken = 'some-secret-token';
    const classes = [
      apex.getWebhookCallout(secretToken),
      apex.getWebhookCalloutMock(),
    ];

    const template = require('../../../resources/templates/apex/src/NewSObject.trigger.handlebars');
    const endpointUrl = 'https://example.com';
    const sObjectType = 'SomeType';
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const trigger = apex.getWebhookTrigger(
      template,
      endpointUrl,
      sObjectType,
      undefined,
      webhookCalloutMock,
    );
    const triggers = [trigger];
    const authToken = 'some-token';

    const { body: requestBody } = apex.getDeployApexCodeBody(
      authToken,
      classes.map((i) => i.name),
      triggers.map((i) => i.name),
    );

    const result = parseXml(requestBody);
    expect(result.errors.length).to.equal(0);
  });
});
