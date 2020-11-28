#!/usr/bin/env bash

# alias jq='../../jq'

for sobject in `cat ./triggerable_sobject_list.txt`
do
    echo "Staring tests for ${sobject}"

    # Create webhooks
    echo "Creating webhook for ${sobject}..."
    ./webhooks-cli.js create new \
        -k ../../../server.key \
        -c ../../../server.crt \
        -s ${sobject} \
        -u 'https://example.com' \
        -o ./webhook-data.json
    echo "Webhook for ${sobject} created"

    # Run tests
    echo "Running tests for ${sobject}..."
    sfdx force:apex:test:run -r json -c -u "${HUB_SFDC_USER}" > test-results.json
    EXIT_STATUS=`jq '.status' test-results.json`
    if [[ $EXIT_STATUS != 0 ]]
    then
        echo "Something bad happened when testing ${sobject}"
        cat test-results.json | jq
    else
        TEST_OUTCOME=`jq '.result.summary.outcome' test-results.json`
        TEST_COVERAGE=`jq '.result.summary.testRunCoverage' test-results.json`
        echo "Test results for ${sobject}:"
        echo "      Outcome: ${TEST_OUTCOME}"
        echo "      Coverage: ${TEST_COVERAGE}"
    fi

    # Cleanup
    echo "Deleting webhook for ${sobject}..."
    ./webhooks-cli.js delete \
        -k ../../../server.key \
        -c ../../../server.crt \
        -w ./webhook-data.json
    echo "Webhook for ${sobject} deleted"

    echo "Cleaning up temp files..."
    rm ./webhook-data.json
    rm ./test-results.json

    echo "Tests done for ${sobject}"
done

