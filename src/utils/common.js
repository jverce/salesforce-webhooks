import { randomBytes } from 'crypto';

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
  return !/<success>false<\/success>/.test(responseBody);
};
