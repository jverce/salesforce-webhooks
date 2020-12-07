#!/usr/bin/env node

const testResults = require('./test-results.json');

const hadErrors = testResults.some((t) => t.status !== 0);
if (hadErrors) {
  console.error('Errors while running integration tests');
  process.exit(1);
}

const hadFailures = testResults.some(
  (t) => t.result.summary.outcome !== 'Passed',
);
if (hadFailures) {
  console.error('Some integration tests failed');
  process.exit(1);
}
