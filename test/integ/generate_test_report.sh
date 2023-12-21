#!/usr/bin/env bash

# Abort the script if any of the commands below is not executed successfully
set -e

jq \
    '. + { testResultsFilename: input_filename } | { status, message, result, stack, testResultsFilename }' \
    test-results-*.json \
| jq -s > test-results.json

rm test-results-*.json

TEST_REPORTS_DIR="./${TEST_REPORTS_DIR_BASE}/deploy_and_test"
mkdir -p ${TEST_REPORTS_DIR}
./format-as-junit.js > ${TEST_REPORTS_DIR}/results.xml

./detect-failed-tests.js
