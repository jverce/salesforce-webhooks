import { expect } from 'chai';
import { parseXml } from 'libxmljs';
import { describe } from 'mocha';
import * as metadata from '../../../src/utils/metadata';

describe('SOAP request utils', function () {
  it('create remote site request generator should generate a valid request', function () {
    const authToken = 'some-token';
    const endpointUrl = 'https://example.com';
    const { body: requestBody } = metadata.getCreateRemoteSiteBody(
      authToken,
      endpointUrl,
    );
    const result = parseXml(requestBody);
    expect(result.errors.length).to.equal(0);
  });

  it('delete remote site request generator should generate a valid request', function () {
    const authToken = 'some-token';
    const remoteSiteName = 'some-name';
    const { body: requestBody } = metadata.getDeleteRemoteSiteBody(
      authToken,
      remoteSiteName,
    );
    const result = parseXml(requestBody);
    expect(result.errors.length).to.equal(0);
  });
});
