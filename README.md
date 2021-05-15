# Salesforce Webhooks

[![jverce](https://circleci.com/gh/jverce/salesforce-webhooks.svg?style=shield)](https://app.circleci.com/pipelines/github/jverce/salesforce-webhooks)
[![npm](https://img.shields.io/npm/v/salesforce-webhooks)](https://www.npmjs.com/package/salesforce-webhooks)

## Introduction

The purpose of this package is to provide a convenient interface to the
Salesforce API in order to create or delete webhooks in the Salesforce platform.
It offers a simple interface to create basic webhooks for "created", "updated"
or "deleted" events on any
[**SObject**](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_methods_system_sobject.htm)
type (although such types must be _triggerable_, as specified by an [SObject's
metadata](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_describe.htm))

**Please note that this is a Node.js package and hasn't been tested in a
browser-like environment.**

## Getting Started

### Installation

Nothing special here: just a regula NPM/Yarn Node.js package.

#### NPM

```bash
$ npm install --save salesforce-webhooks
```

#### Yarn

```bash
$ yarn add salesforce-webhooks
```

### Usage

This package can be used to either create or delete a webhook from Salesforce.
It just serves as an interface and convenience tool to do all the required
wiring, customization and interaction with Salesforce under the hood. It does
not however keep track of created webhooks, **it's purpose is not to manage
those webhooks beyond creation or deletion of its low-level components**.

#### Instantiation

The interface is exposed through the `SalesforceClient` class. To start, create
a new instance of this class by providing the following information about your
Salesforce organization:

- **Salesforce auth token**: a valid REST API token with write access to the
  Salesforce SOAP API (see for example the [Salesforce REST API Developer
  Guide(https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/quickstart_oauth.htm)])
- **Instance**: the instance identifier where the target organization is
  running. See [this
  page](https://help.salesforce.com/articleView?id=000314281&type=1&mode=1&language=en_US)
  for more information.
- **API Version**: this is an optional parameter. It is set to `50.0` by
  default, and this is the target version for which this package was developed.

The above parameter names are `authToken`, `instance` and `apiVersion`,
respectively. So, to create a new instance of `SalesforceClient` execute the
following code:

```js
const { SalesforceClient } = require("salesforce-webhooks");
const authToken = "a secret API token"; // This is supposed to be secret!
const instance = "na139"; // This is just an example instance.
const client = new SalesforceClient({
  authToken,
  instance,
  apiVersion: "50.0",
});
console.log(client);
// SalesforceClient {
//  authToken: 'a secret token',
//  metadataApiUrl: 'https://na139.salesforce.com/services/Soap/m/50.0',
//  soapApiUrl: 'https://na139.salesforce.com/services/Soap/s/50.0'
//}
```

_Note that the `*ApiUrl` properties contain information about the instance and
the API version._

The client parameters can also be extracted from environment variables if they
are not provided to the constructor:

```bash
$ export SALESFORCE_API_VERSION='50.0'
$ export SALESFORCE_AUTH_TOKEN='a secret API token'
$ export SALESFORCE_INSTANCE='na139'
```

The constructor will resort to the environment variables above if no valid
arguments were provided to it:

```js
const { SalesforceClient } = require("salesforce-webhooks");
const client = new SalesforceClient();
console.log(client);
// SalesforceClient {
//  authToken: 'a secret token',
//  metadataApiUrl: 'https://na139.salesforce.com/services/Soap/m/50.0',
//  soapApiUrl: 'https://na139.salesforce.com/services/Soap/s/50.0'
//}
```

#### Webhook Creation

Every webhook creation interface requires users to provide at least the
following arguments:

- **`endpointUrl`**: the URL of the endpoint that the webhook should call
  whenever it gets triggered
- **`sObjectType`**: the type of SObject that this webhook will react to

The following interfaces serve the purpose of creating webhooks:

- **`createWebhookNew`**: creates a webhook that gets triggers when a new object
  is created
- **`createWebhookUpdated`**: creates a webhook that gets triggers when an
  object is updated
- **`createWebhookDeleted`**: creates a webhook that gets triggers when an
  object is deleted
- **`createWebhook`**: it takes an additional argument `event` whose values can
  be either `new`, `updated` or `deleted`, and it creates a webhook that gets
  triggers when an event of type `event` happens to an object

An optional parameter called `secretToken` can be provided in order to verify
the authenticity of the HTTP calls at the target endpoint. Whenever the endpoint
receives an HTTP call, it can verify that the `X-Webhook-Token` header matches
the secret token provided through the `secretToken` argument.

To create a webhook that will make an HTTP POST call to http://example.com
whenever a new account is created, run the following code:

```js
const client = new SalesforceClient(...);   // See the Instantiation section above.
const webhookOpts = {
    endpointUrl: 'http://example.com',
    sObjectType: 'Account',
    secretToken: 'some secret arbitrary string',
};
const webhookData = await client.createWebhookNew(webhookOpts);
console.log(webhookData);
// {
//   remoteSiteName: 'SW_Endpoint_9c680f2bb526a0fbdc34a2aef7e5',
//   classNames: [
//     'SW_SObjectFactory_3452ca73469dc9c2094f01',
//     'SW_Callout_ae23bd24aa8c2abbc0c78db11e7f',
//     'SW_CalloutMock_6a18a2dfa993157c6574bd7c',
//     'SW_Test_85d9edee3617e831a7fbfe43cb30e084'
//   ],
//   triggerNames: [ 'SW_Trigger_b868fb7dbbcdea44930014e7a585' ]
// }
```

If you don't know the type of event at compile time, you can use the more
flexible interface `createWebhook` which allows you to specify the type of event
at runtime. The output of the following code is equivalent to the one in the
code above:

```js
const client = new SalesforceClient(...);   // See the Instantiation section above.
const webhookOpts = {
    endpointUrl: 'http://example.com',
    sObjectType: 'Account',
    secretToken: 'some secret arbitrary string',
    event: 'new'
};
const webhookData = await client.createWebhook(webhookOpts);
console.log(webhookData);
// {
//   remoteSiteName: 'SW_Endpoint_9c680f2bb526a0fbdc34a2aef7e5',
//   classNames: [
//     'SW_SObjectFactory_3452ca73469dc9c2094f01',
//     'SW_Callout_ae23bd24aa8c2abbc0c78db11e7f',
//     'SW_CalloutMock_6a18a2dfa993157c6574bd7c',
//     'SW_Test_85d9edee3617e831a7fbfe43cb30e084'
//   ],
//   triggerNames: [ 'SW_Trigger_b868fb7dbbcdea44930014e7a585' ]
// }
```

The information returned by these methods is required whenever you wish to
delete the resources created by them.

#### Webhook Deletion

As mentioned in the [previous section](webhook-creation), after creating a
webhook the call returns useful data that can be used to delete all the
resources created before.

So after creating a webhook, we can do this to delete it:

```js
await client.deleteWebhook(webhookData);
```

## Additional Context

The concept of webhooks in Salesforce is a bit blurry: they do not exist
explicitly, but the platform provides enough building blocks for developers to
implement them.

### Apex

This section _briefly_ describes the **Lightning Platform** aspects that this
package leverages to implement webhooks in Salesforce. In a nutshell:

- Salesforce has a runtime environment within the platform (called **Lightning
  Platform**) in which developers can compile, test, deploy and execute
  arbitrary code. This code is written in a special programming language called
  [**Apex**](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_dev_guide.htm)
- Apex is a strongly-typed object-oriented programming language whose main
  building blocks are
  [_classes_](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_classes.htm?search_text=triggerable)
  and
  [_triggers_](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers.htm?search_text=triggerable):
  - **Classes** share the similar semantics as any other object-oriented
    programming language in the sense that they offer inheritance,
    encapsulation and polymorphism.
  - **Triggers** are a particular kind of program that _reacts_ (or gets
    triggered) by a predetermined set of events (e.g. whenever a new account
    is created, or when some contact information is updated). They can
    describe arbitrary logic, however it is usually encouraged to keep such
    logic as simple/thin as possible (think _controllers_ in the MVC model).
- Apex code can be operated under the usual development cycle where code is
  developed locally, compile and tested in the environment, and deployed.
  Depending on the type of environment in which the developer works, there are
  certain requirements that the code must meet in order to make it to production:
  - For **production organizations**, tests are mandatory and they must
    succeed in order for the code to be deployed. Also, overall test coverage
    cannot drop below 75%, so if the new code causes the overall test coverage
    to go below that threshold it won't get deployed.
  - For **developer** or **sandbox** organizations, code just needs to
    compile.
- In order for code to make HTTP calls to 3rd party URL's (i.e. the usual
  webhook case), the organization must be explicitly configured to "whitelist"
  such URL's. This is called [**Remote Site
  Setting**](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_callouts_remote_site_settings.htm).

### Approach

Under the hood, this package performs the following actions when creating a
webhook:

1. Creates a **Remote Site Setting** for the provided endpoint URL. This will
   allow the Apex code to make HTTP calls to such endpoint.
2. Deploys some supporting Apex classes that do not depend on the input
   parameters (e.g. mocking class, factory class, the [HTTP
   callout](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_callouts.htm),
   etc.)
3. Based on the **event type** and **SObject type** parameters, a customized
   trigger is deployed that will get called whenever such an event happens to
   the specified SObject type. This trigger will get executed and will make an
   HTTP call to the provided endpoint URL. Please note that for a single event
   on an SObject instance, _multiple triggers_ can be executed, depending on the
   currently deployed Apex triggers. **If you creat multiple webhooks with the
   same parameters, their endpoint will receive as many HTTP calls as the number
   of equivalent webhooks**.

Upon successful creation of a webhook, the package returns an object with
information relative to all the entities created above. This information must be
stored for future use whenever users which to clean-up those resources. **The
package itself does not keep track of those resources after the call to
`createWebhook*` completes**.

For deletion, the same steps described above is performed in _reverse_ order,
except that instead of creating those resources, they are removed.
