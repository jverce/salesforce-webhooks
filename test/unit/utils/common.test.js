import { expect } from 'chai';
import { describe } from 'mocha';
import * as common from '../../../src/utils/common';

describe('Random name generator', function () {
  it('should generate different names for the same prefix', function () {
    const prefix = 'SomePrefix';
    const first = common.getRandomName(prefix);
    const second = common.getRandomName(prefix);
    expect(first).to.not.equal(second);
  });

  it('should generate a name that contains the prefix', function () {
    const prefix = 'SomePrefix';
    const randomName = common.getRandomName(prefix);
    expect(randomName).to.contain(prefix);
  });

  it('should generate a name that is shorter than 40 characters', function () {
    const prefix = 'SomePrefix';
    const randomName = common.getRandomName(prefix);
    expect(randomName.length).to.be.lte(40);
  });
});

describe('Soap request success detector', function () {
  it('should be false if at least one item was not successful', function () {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <soapenv:Envelope
        xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns="http://soap.sforce.com/2006/04/metadata"
      >
        <soapenv:Body>
          <createMetadataResponse>
            <result>
              <fullName>some_site_name1</fullName>
              <success>true</success>
            </result>
            <result>
              <fullName>some_site_name2</fullName>
              <success>true</success>
            </result>
            <result>
              <fullName>some_site_name3</fullName>
              <success>false</success>
            </result>
          </createMetadataResponse>
        </soapenv:Body>
      </soapenv:Envelope>
    `;
    const result = common.wasSuccessfulSoapRequest(xml);
    expect(result).to.be.false;
  });

  it('should be true if every item was successful', function () {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <soapenv:Envelope
        xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns="http://soap.sforce.com/2006/04/metadata"
      >
        <soapenv:Body>
          <createMetadataResponse>
            <result>
              <fullName>some_site_name1</fullName>
              <success>true</success>
            </result>
            <result>
              <fullName>some_site_name2</fullName>
              <success>true</success>
            </result>
            <result>
              <fullName>some_site_name3</fullName>
              <success>true</success>
            </result>
          </createMetadataResponse>
        </soapenv:Body>
      </soapenv:Envelope>
    `;
    const result = common.wasSuccessfulSoapRequest(xml);
    expect(result).to.be.true;
  });
});
