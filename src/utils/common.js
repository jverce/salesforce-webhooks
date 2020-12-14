import { randomBytes } from 'crypto';
import { parseXmlString } from 'libxmljs';

export const getRandomName = (rawName) => {
  const maxLength = 40;
  const namePrefix = `SW_${rawName}_`;
  const randomComponentLength = Math.floor(
    Math.max(0, maxLength - namePrefix.length) / 2,
  );
  const randomComponent = randomBytes(randomComponentLength).toString('hex');
  return `${namePrefix}${randomComponent}`;
};

export const wasSuccessfulSoapRequest = (responseBody) => {
  const doc = parseXmlString(responseBody, { noblanks: true });
  return !doc
    .find('//*[local-name()="success"]')
    .map((i) => i.text())
    .some((i) => i == 'false');
};
