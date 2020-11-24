import { getRandomName } from './common';

export const getCreateRemoteSiteBody = (authToken, endpointUrl) => {
  const name = getRandomName('Endpoint');
  const template = require('../../resources/templates/soap/metadata/CreateRemoteSite.xml.handlebars');
  const body = template({
    authToken,
    endpointUrl,
    name,
  });
  return {
    body,
    name,
  };
};

export const getDeleteRemoteSiteBody = (authToken, name) => {
  const template = require('../../resources/templates/soap/metadata/DeleteRemoteSite.xml.handlebars');
  const body = template({
    authToken,
    name,
  });
  return {
    body,
  };
};
