import { getRandomName } from './common';

export const getCreateRemoteSiteBody = (endpointUrl, authToken) => {
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
}
