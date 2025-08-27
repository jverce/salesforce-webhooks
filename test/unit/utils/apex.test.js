import {
  BailErrorStrategy,
  CommonTokenStream,
} from "antlr4ts";
import {
  ApexLexer,
  ApexParser,
} from "apex-parser";
import { CaseInsensitiveInputStream } from "apex-parser/lib/CaseInsensitiveInputStream";
import { expect } from "chai";
import { parseXml } from "libxmljs2";
import { describe } from "mocha";
import * as apex from "../../../src/utils/apex";

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

describe("Apex code utils", function () {
  it("webhook callout generator should generate valid Apex code", function () {
    const secretToken = "some-secret-token";
    const { body: result } = apex.getWebhookCallout(secretToken);
    validateApexClass(result);
  });

  it("webhook callout mock generator should generate valid Apex code", function () {
    const { body: result } = apex.getWebhookCalloutMock();
    validateApexClass(result);
  });

  it("SObject factory generator should generate valid Apex code", function () {
    const { body: result } = apex.getSObjectFactory();
    validateApexClass(result);
  });

  it("trigger generator for new objects should generate valid Apex code", function () {
    const template = require("../../../resources/templates/apex/src/NewSObject.trigger.handlebars");
    const endpointUrl = "https://example.com";
    const sObjectType = "SomeType";
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const { body: result } = apex.getWebhookTrigger(
      template,
      webhookCalloutMock,
      {
        endpointUrl,
        sObjectType,
      },
    );
    validateApexTrigger(result);
  });

  it("trigger test generator for new objects should generate valid Apex code", function () {
    const template = require("../../../resources/templates/apex/test/NewSObjectTriggerTest.cls.handlebars");
    const endpointUrl = "https://example.com";
    const sObjectType = "SomeType";
    const sObjectFactory = apex.getSObjectFactory();
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const { body: result } = apex.getWebhookTriggerTest(
      template,
      webhookCalloutMock,
      sObjectFactory,
      {
        endpointUrl,
        sObjectType,
      },
    );
    validateApexClass(result);
  });

  it("trigger generator for new ChangeEvent objects should generate valid Apex code", function () {
    const template = require("../../../resources/templates/apex/src/NewChangeEvent.trigger.handlebars");
    const endpointUrl = "https://example.com";
    const associateParentEntity = "SomeType";
    const sObjectType = `${associateParentEntity}ChangeEvent`;
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const { body: result } = apex.getWebhookTrigger(
      template,
      webhookCalloutMock,
      {
        endpointUrl,
        sObjectType,
        associateParentEntity,
      },
    );
    validateApexTrigger(result);
  });

  it("trigger generator for updated objects should generate valid Apex code", function () {
    const template = require("../../../resources/templates/apex/src/UpdatedSObject.trigger.handlebars");
    const endpointUrl = "https://example.com";
    const sObjectType = "SomeType";
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const { body: result } = apex.getWebhookTrigger(
      template,
      webhookCalloutMock,
      {
        endpointUrl,
        sObjectType,
      },
    );
    validateApexTrigger(result);
  });

  it("trigger test generator for updated objects should generate valid Apex code", function () {
    const template = require("../../../resources/templates/apex/test/UpdatedSObjectTriggerTest.cls.handlebars");
    const endpointUrl = "https://example.com";
    const sObjectType = "SomeType";
    const sObjectFactory = apex.getSObjectFactory();
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const { body: result } = apex.getWebhookTriggerTest(
      template,
      webhookCalloutMock,
      sObjectFactory,
      {
        endpointUrl,
        sObjectType,
      },
    );
    validateApexClass(result);
  });

  it(
    "trigger generator for any of the updated fields in objects should generate valid Apex code",
    function () {
      const template = require("../../../resources/templates/apex/src/UpdatedAnyOfSObjectFields.trigger.handlebars");
      const endpointUrl = "https://example.com";
      const sObjectType = "SomeType";
      const fieldsToCheck = [
        "Name",
        "Email",
      ];
      const webhookCalloutMock = apex.getWebhookCalloutMock();
      const { body: result } = apex.getWebhookTrigger(
        template,
        webhookCalloutMock,
        {
          endpointUrl,
          sObjectType,
          fieldsToCheck,
        },
      );
      validateApexTrigger(result);
    },
  );

  it("trigger test generator for any of the updated fields in objects should generate valid Apex code", function () {
    const template = require("../../../resources/templates/apex/test/UpdatedAnyOfSObjectFieldsTriggerTest.cls.handlebars");
    const endpointUrl = "https://example.com";
    const sObjectType = "SomeType";
    const fieldsToCheck = [
      "Name",
      "Email",
    ];
    const sObjectFactory = apex.getSObjectFactory();
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const { body: result } = apex.getWebhookTriggerTest(
      template,
      webhookCalloutMock,
      sObjectFactory,
      {
        endpointUrl,
        sObjectType,
        fieldsToCheck,
      },
    );
    validateApexClass(result);
  });

  it(
    "trigger generator for all of the updated fields in objects should generate valid Apex code",
    function () {
      const template = require("../../../resources/templates/apex/src/UpdatedAllOfSObjectFields.trigger.handlebars");
      const endpointUrl = "https://example.com";
      const sObjectType = "SomeType";
      const fieldsToCheck = [
        "Name",
        "Email",
      ];
      const webhookCalloutMock = apex.getWebhookCalloutMock();
      const { body: result } = apex.getWebhookTrigger(
        template,
        webhookCalloutMock,
        {
          endpointUrl,
          sObjectType,
          fieldsToCheck,
        },
      );
      validateApexTrigger(result);
    },
  );

  it("trigger test generator for all of the updated fields in objects should generate valid Apex code", function () {
    const template = require("../../../resources/templates/apex/test/UpdatedAllOfSObjectFieldsTriggerTest.cls.handlebars");
    const endpointUrl = "https://example.com";
    const sObjectType = "SomeType";
    const fieldsToCheck = [
      "Name",
      "Email",
    ];
    const sObjectFactory = apex.getSObjectFactory();
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const { body: result } = apex.getWebhookTriggerTest(
      template,
      webhookCalloutMock,
      sObjectFactory,
      {
        endpointUrl,
        sObjectType,
        fieldsToCheck,
      },
    );
    validateApexClass(result);
  });

  it("trigger test generator for deleted objects should generate valid Apex code", function () {
    const template = require("../../../resources/templates/apex/test/DeletedSObjectTriggerTest.cls.handlebars");
    const endpointUrl = "https://example.com";
    const sObjectType = "SomeType";
    const sObjectFactory = apex.getSObjectFactory();
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const { body: result } = apex.getWebhookTriggerTest(
      template,
      webhookCalloutMock,
      sObjectFactory,
      {
        endpointUrl,
        sObjectType,
      },
    );
    validateApexClass(result);
  });

  it("trigger test generator for deleted objects should generate valid Apex code", function () {
    const template = require("../../../resources/templates/apex/test/DeletedSObjectTriggerTest.cls.handlebars");
    const endpointUrl = "https://example.com";
    const sObjectType = "SomeType";
    const sObjectFactory = apex.getSObjectFactory();
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const { body: result } = apex.getWebhookTriggerTest(
      template,
      webhookCalloutMock,
      sObjectFactory,
      {
        endpointUrl,
        sObjectType,
      },
    );
    validateApexClass(result);
  });
});

describe("SOAP request utils", function () {
  it("deploy request generator should generate a valid request", function () {
    const secretToken = "some-secret-token";
    const classes = [
      apex.getWebhookCallout(secretToken),
      apex.getWebhookCalloutMock(),
    ];

    const template = require("../../../resources/templates/apex/src/NewSObject.trigger.handlebars");
    const endpointUrl = "https://example.com";
    const sObjectType = "SomeType";
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const trigger = apex.getWebhookTrigger(
      template,
      webhookCalloutMock,
      {
        endpointUrl,
        sObjectType,
      },
    );
    const triggers = [
      trigger,
    ];
    const authToken = "some-token";

    const { body: requestBody } = apex.getDeployApexCodeBody(
      authToken,
      classes,
      triggers,
    );

    console.log("about to call parseXml 3");
    const result = parseXml(requestBody);
    expect(result.errors.length).to.equal(0);
  });

  it("delete request generator should generate a valid request", function () {
    const secretToken = "some-secret-token";
    const classes = [
      apex.getWebhookCallout(secretToken),
      apex.getWebhookCalloutMock(),
    ];

    const template = require("../../../resources/templates/apex/src/NewSObject.trigger.handlebars");
    const endpointUrl = "https://example.com";
    const sObjectType = "SomeType";
    const webhookCalloutMock = apex.getWebhookCalloutMock();
    const trigger = apex.getWebhookTrigger(
      template,
      webhookCalloutMock,
      {
        endpointUrl,
        sObjectType,
      },
    );
    const triggers = [
      trigger,
    ];
    const authToken = "some-token";

    const { body: requestBody } = apex.getDeployApexCodeBody(
      authToken,
      classes.map((i) => i.name),
      triggers.map((i) => i.name),
    );

    console.log("about to call parseXml 4");
    const result = parseXml(requestBody);
    expect(result.errors.length).to.equal(0);
  });
});
