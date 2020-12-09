#!/usr/bin/env node

const { getJunitXml } = require('junit-xml');
const testResults = require('./test-results.json');

const toTestCase = (testResult) => {
  const { status, testResultsFilename } = testResult;
  const { sObjectType, event } = testResultsFilename.match(
    /^test-results-(?<sObjectType>.*)-(?<event>.*)\.json$/,
  ).groups;

  const name = `Event ${event} - SObject ${sObjectType}`;
  const baseObj = {
    name,
  };
  if (status !== 0) {
    const { stack } = testResult;
    const systemErr = stack.split('\n');
    return {
      ...baseObj,
      systemErr,
    };
  }

  const { outcome } = testResult.result.summary;
  if (outcome !== 'Passed') {
    const { tests } = testResult.result;
    const failures = tests.map((t) => ({ message: t.MethodName }));
    return {
      ...baseObj,
      failures,
    };
  }

  return baseObj;
};

const testCases = testResults.map(toTestCase);
const testSuite = {
  name: 'Integration tests',
  testCases,
};
const testSuiteReport = {
  name: 'Tests Report',
  suites: [testSuite],
};

console.log(getJunitXml(testSuiteReport));
