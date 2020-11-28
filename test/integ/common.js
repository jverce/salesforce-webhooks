const axios = require('axios');
const fs = require('fs/promises');
const jwt = require('jsonwebtoken');
const qs = require('querystring');


const getExpTimestamp = () => {
  return Math.floor(Date.now() / 1000) + 3 * 60;
};

const getJwtToken = (keyFilename, certFilename) => {
  const {
    HUB_CONSUMER_KEY: iss,
    HUB_SFDC_USER: sub,
  } = process.env;

  const payload = {
    aud: 'https://login.salesforce.com',
    exp: getExpTimestamp(),
    iss,
    sub,
  };

  const options = {
    algorithm: 'RS256',
  };

  const privateKey = await fs.readFile(keyFilename);
  const token = jwt.sign(payload, privateKey, options);

  if (certFilename !== undefined) {
    const cert = await fs.readFile(certFilename);
    jwt.verify(token, cert);
  }

  return token;
};

const getAuthToken = async (keyFilename, certFilename) => {
  const assertion = getJwtToken(keyFilename, certFilename);

  const url = 'https://login.salesforce.com/services/oauth2/token';
  const requestData = qs.stringify({
    assertion,
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
  });
  const requestConfig = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  const { data } = await axios.post(url, requestData, requestConfig);
  return data.access_token;
};

module.exports = {
  getAuthToken,
};
