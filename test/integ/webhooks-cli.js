#!/usr/bin/env -S node --enable-source-maps

const fs = require("fs");
const { getAuthToken } = require("./common");

const { SalesforceClient } = require("../../dist");

const initClient = async (argv) => {
  const {
    privateKeyFile,
    certFile,
  } = argv;
  const authToken = await getAuthToken(privateKeyFile, certFile);
  return new SalesforceClient({
    authToken,
  });
};

const outputWebhookData = (argv, webhookData) => {
  const { outputFile } = argv;
  const outputString = JSON.stringify(webhookData, null, 2);
  if (outputFile) {
    console.log(`Writing webhook data to ${outputFile}...`);
    fs.writeFileSync(outputFile, outputString);
  } else {
    console.log(outputString);
  }
};

const createWebhook = async (argv) => {
  const client = await initClient(argv);
  const {
    endpointUrl,
    eventType: event,
    sobjectType: sObjectType,
  } = argv;
  const webhookOpts = {
    endpointUrl,
    event,
    sObjectType,
  };
  const webhookData = await client.createWebhook(webhookOpts);
  outputWebhookData(argv, webhookData);
};

const deleteWebhook = async (argv) => {
  const client = await initClient(argv);
  const webhookData = require(argv.webhookDataFile);
  await client.deleteWebhook(webhookData);
};

require("yargs/yargs")(process.argv.slice(2))
  .command(
    "create <event-type> [options]",
    "Create a new webhook",
    () => {},
    createWebhook,
  )
  .command(
    "delete [options]",
    "Delete an existing webhook",
    () => {},
    deleteWebhook,
  )
  .option("private-key-file", {
    alias: "k",
    type: "string",
    describe: "Path to the key file to authenticate against Salesforce",
    demandOption: true,
  })
  .option("cert-file", {
    alias: "c",
    type: "string",
    describe: "Path to the certificate file to verify the private key",
  })
  .option("endpoint-url", {
    alias: "u",
    type: "url",
    describe: "The URL of the endpoint that the webhook will call",
  })
  .implies("create", "endpoint-url")
  .option("sobject-type", {
    alias: "s",
    type: "string",
    describe: "SObject type (e.g. Account, Lead, etc.)",
  })
  .implies("create", "sobject-type")
  .option("output-file", {
    alias: "o",
    type: "string",
    describe: "Save the output of the command in a file",
  })
  .option("webhook-data-file", {
    alias: "w",
    type: "string",
    describe: "Read data of a previously created webhook from an input file",
  })
  .implies("delete", "webhook-data-file")
  .demandCommand(2)
  .argv;
