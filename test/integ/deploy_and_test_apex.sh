#!/usr/bin/env bash

# Abort the script if any of the commands below is not executed successfully
set -e

#
# Change events
#

# SOBJECT_LIST="../../resources/data/sobjects-new-change-event.json"
# for SOBJECT_TYPE in `jq -c '.[].name' ${SOBJECT_LIST} | sed -r 's/"//g'`
# do
#     TEST_RESULTS_FILE="./test-results-${SOBJECT_TYPE}-new.json"
#     WEBHOOK_DATA_FILE="./webhook-data-${SOBJECT_TYPE}.json"

#     # Enabling the change event listener
#     sed -e "s/CHANGE_EVENT/${SOBJECT_TYPE}/g" metadata/package-template.xml > metadata/package.xml
#     sfdx force:mdapi:deploy -d metadata -w2

#     # Create webhooks
#     echo "Creating webhook for ${SOBJECT_TYPE}..."
#     ./webhooks-cli.js create new \
#         -k ${KEYS_DIR}/server.key \
#         -c ${KEYS_DIR}/server.crt \
#         -s ${SOBJECT_TYPE} \
#         -u 'https://example.com' \
#         -o ${WEBHOOK_DATA_FILE}
#     echo "Webhook for ${SOBJECT_TYPE} created"

#    # Run tests
#    echo "Running tests for ${SOBJECT_TYPE}..."
#    TRIGGER_TEST_CLASS=`grep Test ${WEBHOOK_DATA_FILE}`
#    sfdx force:apex:test:run \
#        -t ${TRIGGER_TEST_CLASS} \
#        -y \
#        -w5 \
#        -r json \
#        -c \
#        --target-org "${HUB_SFDC_USER}" \
#        > ${TEST_RESULTS_FILE}
#    echo "Tests finished"

#     # Disabling the change event listener
#     cp metadata/package-base.xml metadata/package.xml
#     sed -e "s/CHANGE_EVENT/${SOBJECT_TYPE}/g" metadata/destructiveChanges-template.xml > metadata/destructiveChanges.xml
#     sfdx force:mdapi:deploy -d metadata -w2

#     # Cleanup temp metadata files
#     rm metadata/package.xml
#     rm metadata/destructiveChanges.xml

#     echo "Deleting webhook for ${SOBJECT_TYPE}..."
#     ./webhooks-cli.js delete \
#         -k ${KEYS_DIR}/server.key \
#         -c ${KEYS_DIR}/server.crt \
#         -w ${WEBHOOK_DATA_FILE}
#     echo "Webhook for ${SOBJECT_TYPE} deleted"

#     echo "Cleaning up temp files..."
#     rm ${WEBHOOK_DATA_FILE}
# done


# #
# # Standard
# #

# for EVENT_TYPE in new updated deleted
# do
#     SOBJECT_LIST="../../resources/data/sobjects-${EVENT_TYPE}.json"
#     for SOBJECT_TYPE in `jq -c '.[].name' ${SOBJECT_LIST} | sed -r 's/"//g'`
#     do
#         TEST_RESULTS_FILE="./test-results-${SOBJECT_TYPE}-${EVENT_TYPE}.json"
#         WEBHOOK_DATA_FILE="./webhook-data-${SOBJECT_TYPE}-${EVENT_TYPE}.json"

#         # Create webhooks
#         echo "Creating webhook for ${SOBJECT_TYPE} (event type: ${EVENT_TYPE})..."
#         ./webhooks-cli.js create ${EVENT_TYPE} \
#             -k ${KEYS_DIR}/server.key \
#             -c ${KEYS_DIR}/server.crt \
#             -s ${SOBJECT_TYPE} \
#             -u 'https://example.com' \
#             -o ${WEBHOOK_DATA_FILE}

#         EXIT_CODE=$?
#         if [ ${EXIT_CODE} -ne 0 ]
#         then
#             >&2 echo "Webhook for ${SOBJECT_TYPE} COULD NOT be created (event type: ${EVENT_TYPE})"
#             exit ${EXIT_CODE}
#         fi

#         echo "Webhook for ${SOBJECT_TYPE} created (event type: ${EVENT_TYPE})"

#         # Run tests
#         echo "Running tests for ${SOBJECT_TYPE} (event type: ${EVENT_TYPE})..."
#         TRIGGER_TEST_CLASS=`grep Test ${WEBHOOK_DATA_FILE}`
#         sfdx force:apex:test:run \
#             -t ${TRIGGER_TEST_CLASS} \
#             -y \
#             -w5 \
#             -r json \
#             -c \
#             -u "${HUB_SFDC_USER}" \
#             > ${TEST_RESULTS_FILE}
#         echo "Tests finished"

#         echo "Deleting webhook for ${SOBJECT_TYPE} (event type: ${EVENT_TYPE})..."
#         ./webhooks-cli.js delete \
#             -k ${KEYS_DIR}/server.key \
#             -c ${KEYS_DIR}/server.crt \
#             -w ${WEBHOOK_DATA_FILE}
#         echo "Webhook for ${SOBJECT_TYPE} deleted (event type: ${EVENT_TYPE})"

#         echo "Cleaning up temp files..."
#         rm ${WEBHOOK_DATA_FILE}
#     done
# done


#
# Field-specific updates
#

EVENT_TYPE="updated"
for FIELDS_TO_CHECK_MODE in any all
do
    SOBJECT_LIST="../../resources/data/sobjects-${EVENT_TYPE}.json"
    for SOBJECT_TYPE in `jq -c '.[].name' ${SOBJECT_LIST} | sed -r 's/"//g'`
    do
        TEST_RESULTS_FILE="./test-results-${SOBJECT_TYPE}-${EVENT_TYPE}-${FIELDS_TO_CHECK_MODE}-fields.json"
        WEBHOOK_DATA_FILE="./webhook-data-${SOBJECT_TYPE}-${EVENT_TYPE}-${FIELDS_TO_CHECK_MODE}-fields.json"
        FIELDS_TO_CHECK=$(
            sfdx force:schema:sobject:describe -s ${SOBJECT_TYPE} | \
            jq -r '
                .fields[] |
                select(.updateable) |
                select(.type == "string" or .type == "double") |
                select(.relationshipName == null) |
                .name
            ' | \
            awk '{ printf "--fc %s ", $0 }'
        )

        # Create webhooks
        echo "Creating webhook for ${SOBJECT_TYPE} (event type: ${EVENT_TYPE} ${FIELDS_TO_CHECK_MODE} fields)..."
        echo "Fields to check: ${FIELDS_TO_CHECK}"
        ./webhooks-cli.js create ${EVENT_TYPE} \
            -k ${KEYS_DIR}/server.key \
            -c ${KEYS_DIR}/server.crt \
            -s ${SOBJECT_TYPE} \
            ${FIELDS_TO_CHECK} \
            --fcm ${FIELDS_TO_CHECK_MODE} \
            -u 'https://example.com' \
            -o ${WEBHOOK_DATA_FILE}

        EXIT_CODE=$?
        if [ ${EXIT_CODE} -ne 0 ]
        then
            >&2 echo "\
                Webhook for ${SOBJECT_TYPE} COULD NOT be created \
                (event type: ${EVENT_TYPE} ${FIELDS_TO_CHECK_MODE} fields) \
            "
            exit ${EXIT_CODE}
        fi

        echo "Webhook for ${SOBJECT_TYPE} created (event type: ${EVENT_TYPE} ${FIELDS_TO_CHECK_MODE} fields)"

        # Run tests
        echo "Running tests for ${SOBJECT_TYPE} (event type: ${EVENT_TYPE} ${FIELDS_TO_CHECK_MODE} fields)..."
        TRIGGER_TEST_CLASS=`grep Test ${WEBHOOK_DATA_FILE}`
        sfdx force:apex:test:run \
            -t ${TRIGGER_TEST_CLASS} \
            -y \
            -w5 \
            -r json \
            -c \
            --target-org "${HUB_SFDC_USER}" \
            > ${TEST_RESULTS_FILE}
        echo "Tests finished"

        echo "Deleting webhook for ${SOBJECT_TYPE} (event type: ${EVENT_TYPE} ${FIELDS_TO_CHECK_MODE} fields)..."
        ./webhooks-cli.js delete \
            -k ${KEYS_DIR}/server.key \
            -c ${KEYS_DIR}/server.crt \
            -w ${WEBHOOK_DATA_FILE}
        echo "Webhook for ${SOBJECT_TYPE} deleted (event type: ${EVENT_TYPE} ${FIELDS_TO_CHECK_MODE} fields)"

        echo "Cleaning up temp files..."
        rm ${WEBHOOK_DATA_FILE}
    done
done
