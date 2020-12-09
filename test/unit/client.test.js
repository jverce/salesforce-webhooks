import axios from 'axios';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { describe } from 'mocha';
import sinon from 'sinon';
import { SalesforceClient } from '../../src/client';

chai.use(chaiAsPromised);

describe('Salesforce client constructor', function () {
  it('should grab settings from environment variables by default', function () {
    const oldEnv = { ...process.env };
    process.env.SALESFORCE_API_VERSION = '1.0';
    process.env.SALESFORCE_AUTH_TOKEN = 'some-auth-token';
    process.env.SALESFORCE_INSTANCE = 'some-instance';

    const client = new SalesforceClient();

    expect(client.authToken).to.equal('some-auth-token');

    // All the URL's should be pointing to the right Salesforce instance and API
    // version
    expect(client.metadataApiUrl)
      .to.match(/some-instance/)
      .match(/1\.0/);
    expect(client.soapApiUrl)
      .to.match(/some-instance/)
      .match(/1\.0/);
    expect(client.sObjectsApiUrl)
      .to.match(/some-instance/)
      .match(/v1\.0/); // This is a REST API URL, so the version has the format vXY.Z

    process.env = { ...oldEnv };
  });

  it('should default the API version to 50.0', function () {
    const oldEnv = { ...process.env };
    process.env.SALESFORCE_AUTH_TOKEN = 'some-auth-token';
    process.env.SALESFORCE_INSTANCE = 'some-instance';

    const client = new SalesforceClient();

    expect(client.authToken).to.equal('some-auth-token');

    // All the URL's should be pointing to the right Salesforce instance and API
    // version
    expect(client.metadataApiUrl)
      .to.match(/some-instance/)
      .match(/50\.0/);
    expect(client.soapApiUrl)
      .to.match(/some-instance/)
      .match(/50\.0/);
    expect(client.sObjectsApiUrl)
      .to.match(/some-instance/)
      .match(/v50\.0/); // This is a REST API URL, so the version has the format vXY.Z

    process.env = { ...oldEnv };
  });

  it('should accept an API version parameter', function () {
    const oldEnv = { ...process.env };
    process.env.SALESFORCE_AUTH_TOKEN = 'some-auth-token';
    process.env.SALESFORCE_INSTANCE = 'some-instance';

    const client = new SalesforceClient({
      apiVersion: '51.0',
    });

    expect(client.authToken).to.equal('some-auth-token');

    // All the URL's should be pointing to the right Salesforce instance and API
    // version
    expect(client.metadataApiUrl)
      .to.match(/some-instance/)
      .match(/51\.0/);
    expect(client.soapApiUrl)
      .to.match(/some-instance/)
      .match(/51\.0/);
    expect(client.sObjectsApiUrl)
      .to.match(/some-instance/)
      .match(/v51\.0/); // This is a REST API URL, so the version has the format vXY.Z

    process.env = { ...oldEnv };
  });

  it('should accept an auth token parameter', function () {
    const oldEnv = { ...process.env };
    process.env.SALESFORCE_INSTANCE = 'some-instance';

    const client = new SalesforceClient({
      authToken: 'some-other-token',
    });

    expect(client.authToken).to.equal('some-other-token');

    // All the URL's should be pointing to the right Salesforce instance and API
    // version
    expect(client.metadataApiUrl)
      .to.match(/some-instance/)
      .match(/50\.0/);
    expect(client.soapApiUrl)
      .to.match(/some-instance/)
      .match(/50\.0/);
    expect(client.sObjectsApiUrl)
      .to.match(/some-instance/)
      .match(/v50\.0/); // This is a REST API URL, so the version has the format vXY.Z

    process.env = { ...oldEnv };
  });

  it('should accept an auth token parameter', function () {
    const oldEnv = { ...process.env };
    process.env.SALESFORCE_AUTH_TOKEN = 'some-auth-token';

    const client = new SalesforceClient({
      instance: 'some-other-instance',
    });

    expect(client.authToken).to.equal('some-auth-token');

    // All the URL's should be pointing to the right Salesforce instance and API
    // version
    expect(client.metadataApiUrl)
      .to.match(/some-other-instance/)
      .match(/50\.0/);
    expect(client.soapApiUrl)
      .to.match(/some-other-instance/)
      .match(/50\.0/);
    expect(client.sObjectsApiUrl)
      .to.match(/some-other-instance/)
      .match(/v50\.0/); // This is a REST API URL, so the version has the format vXY.Z

    process.env = { ...oldEnv };
  });

  it('should reject API versions in an incorrect format', function () {
    expect(
      () =>
        new SalesforceClient({
          apiVersion: 'some-strange-api-version-format',
        }),
    ).to.throws();
  });
});

describe('Salesforce webhook creation', function () {
  let client;
  let sandbox;

  before(function () {
    process.env.SALESFORCE_AUTH_TOKEN = 'some-auth-token';
    process.env.SALESFORCE_INSTANCE = 'some-instance';
    client = new SalesforceClient();
  });

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should reject requests for unsupported SObject types', async function () {
    const opts = {
      sObjectType: 'SomeWeirdType',
      endpointUrl: 'https://example.com',
    };
    await expect(client.createWebhookNew(opts)).to.be.rejected;
    await expect(client.createWebhookUpdated(opts)).to.be.rejected;
    await expect(client.createWebhookDeleted(opts)).to.be.rejected;
  });

  it('should reject requests for unsupported event types', async function () {
    const opts = {
      sObjectType: 'Account',
      endpointUrl: 'https://example.com',
      event: 'some-weird-event',
    };
    await expect(client.createWebhook(opts)).to.be.rejected;
  });

  it('should reject requests if SObject type is not provided', async function () {
    const opts = {
      endpointUrl: 'https://example.com',
      event: 'some-weird-event',
    };
    await expect(client.createWebhook(opts)).to.be.rejected;
  });

  it('should reject requests if endpoint URL is not provided', async function () {
    const opts = {
      sObjectType: 'Account',
      event: 'some-weird-event',
    };
    await expect(client.createWebhook(opts)).to.be.rejected;
  });

  it('should create webhooks for supported types to listen to new objects', async function () {
    const opts = {
      sObjectType: 'Account',
      endpointUrl: 'https://example.com',
    };
    const describeApiUrl = `${client.sObjectsApiUrl}/${opts.sObjectType}/describe`;
    sandbox
      .stub(axios, 'get')
      .withArgs(describeApiUrl, sinon.match.any)
      .resolves({ data: {} });
    const postStub = sandbox.stub(axios, 'post');

    await client.createWebhookNew(opts);
    await client.createWebhook({
      ...opts,
      event: 'new',
    });

    // We make 2 POST requests per webhook:
    // 1. To whitelist the endpoint URL (i.e. RemoteSiteSetting)
    // 2. To deploy the Apex code (i.e. CompileAndTest)
    sinon.assert.callCount(postStub, 4);
  });

  it('should create webhooks for supported types to listen to updated objects', async function () {
    const opts = {
      sObjectType: 'Account',
      endpointUrl: 'https://example.com',
    };
    const describeApiUrl = `${client.sObjectsApiUrl}/${opts.sObjectType}/describe`;
    sandbox
      .stub(axios, 'get')
      .withArgs(describeApiUrl, sinon.match.any)
      .resolves({ data: {} });
    const postStub = sandbox.stub(axios, 'post');

    await client.createWebhookUpdated(opts);
    await client.createWebhook({
      ...opts,
      event: 'updated',
    });

    // We make 2 POST requests per webhook creation call:
    // 1. To whitelist the endpoint URL (i.e. RemoteSiteSetting)
    // 2. To deploy the Apex code (i.e. CompileAndTest)
    sinon.assert.callCount(postStub, 4);
  });

  it('should create webhooks for supported types to listen to deleted objects', async function () {
    const opts = {
      sObjectType: 'Account',
      endpointUrl: 'https://example.com',
    };
    const describeApiUrl = `${client.sObjectsApiUrl}/${opts.sObjectType}/describe`;
    sandbox
      .stub(axios, 'get')
      .withArgs(describeApiUrl, sinon.match.any)
      .resolves({ data: {} });
    const postStub = sandbox.stub(axios, 'post');

    await client.createWebhookDeleted(opts);
    await client.createWebhook({
      ...opts,
      event: 'deleted',
    });

    // We make 2 POST requests per webhook:
    // 1. To whitelist the endpoint URL (i.e. RemoteSiteSetting)
    // 2. To deploy the Apex code (i.e. CompileAndTest)
    sinon.assert.callCount(postStub, 4);
  });

  it.skip('should handle ChangeEvent type when the describe API indicates it', async function () {
    // This test is skipped until change events are supported again. Right now,
    // Salesforce is throwing a 500 HTTP error when trying to create triggers
    // for change event types.
    const opts = {
      sObjectType: 'AccountChangeEvent',
      endpointUrl: 'https://example.com',
    };
    const describeApiUrl = `${client.sObjectsApiUrl}/${opts.sObjectType}/describe`;
    sandbox
      .stub(axios, 'get')
      .withArgs(describeApiUrl, sinon.match.any)
      .resolves({
        associateEntityType: 'ChangeEvent',
        associateParentEntity: 'Account',
      });

    const postSpy = sandbox.spy(axios, 'post');

    await client.createWebhookNew(opts);
  });
});

describe('Salesforce webhook deletion', function () {
  let client;
  let sandbox;

  before(function () {
    process.env.SALESFORCE_AUTH_TOKEN = 'some-auth-token';
    process.env.SALESFORCE_INSTANCE = 'some-instance';
    client = new SalesforceClient();
  });

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should reject requests when class names are not provided as an array', async function () {
    const opts = {
      classNames: 'ClassOne,ClassTwo',
      triggerNames: ['MainTrigger'],
    };
    await expect(client.deleteWebhook(opts)).to.be.rejected;
  });

  it('should reject requests when trigger names are not provided as an array', async function () {
    const opts = {
      classNames: ['ClassOne', 'ClassTwo'],
      triggerNames: 'MainTrigger',
    };
    await expect(client.deleteWebhook(opts)).to.be.rejected;
  });

  it('should delete webhooks when all information is provided', async function () {
    const opts = {
      classNames: ['ClassOne', 'ClassTwo'],
      triggerNames: ['MainTrigger'],
      remoteSiteName: 'SiteName',
    };
    const postStub = sandbox.stub(axios, 'post');

    await client.deleteWebhook(opts);

    // We make 2 POST requests per webhook:
    // 1. To remote the endpoint URL from the whitelist (i.e. RemoteSiteSetting)
    // 2. To delete the Apex code (i.e. CompileAndTest)
    sinon.assert.callCount(postStub, 2);
  });
});
