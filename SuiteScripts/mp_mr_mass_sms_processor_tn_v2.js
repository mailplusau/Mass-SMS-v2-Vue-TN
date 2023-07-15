/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Mass SMS Processor.
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @created 10/07/2023
 */

import {VARS} from '@/utils/utils.mjs';

const twilioSecret = process.env.VUE_APP_NS_TWILIO_SECRET;
const twilioEndpoint = process.env.VUE_APP_NS_TWILIO_SMS_ENDPOINT;

let NS_MODULES = {};

const thisScriptId = process.env.VUE_APP_NS_PROCESSOR_SCRIPT_ID; // The id of the record of this script in NetSuite
const moduleNames = ['render', 'file', 'runtime', 'search', 'record', 'url', 'format', 'email', 'task', 'log'];

const paramNames = {
    paramFileId: `custscript_${thisScriptId}_param_file_id`,
    execTimestamp: `custscript_${thisScriptId}_exec_timestamp`
}

// eslint-disable-next-line no-undef
define(moduleNames.map(item => 'N/' + item), (...args) => {
    for (let [index, moduleName] of moduleNames.entries())
        NS_MODULES[moduleName] = args[index];

    function getInputData() {
        let fileContent = _getFileContent();

        if (!fileContent) return null;

        if (fileContent?.status === VARS.MR_STATUS.INDEXING) // If there's recipient, it's Indexing phase
            return _handleRecipient(fileContent.recipients.shift()); // Grab the first recipient
        else if (fileContent?.status === VARS.MR_STATUS.SENDING) // Otherwise, it's Sending phase
            return fileContent.mobileNumbers;
    }

    // function map(context) {
    // }

    function reduce(context) {
        let fileContent = _getFileContent();

        if (!fileContent) return;

        if (fileContent?.status === VARS.MR_STATUS.INDEXING) _indexPhoneNumbers(context);
        else if (fileContent?.status === VARS.MR_STATUS.SENDING) _sendMessage(context, fileContent);
    }

    function summarize(context) {
        let {file, log, task, runtime} = NS_MODULES;

        let fileId = runtime.getCurrentScript().getParameter(paramNames.paramFileId);
        let fileRecord = file.load({id: fileId});
        let fileContent = JSON.parse(fileRecord.getContents());

        if (fileContent?.status === VARS.MR_STATUS.INDEXING) {
            let count = 0;
            let tempSet = new Set();
            let currentRecipient = fileContent.recipients.shift();

            context.output.iterator().each((key, value) => {
                tempSet.add(value);
                count++;
                return true;
            });

            fileContent.status = fileContent.recipients.length ? VARS.MR_STATUS.INDEXING : VARS.MR_STATUS.SENDING;
            fileContent.mobileNumbers = [...fileContent.mobileNumbers, ...tempSet];

            file.create({
                name: fileRecord.name,
                fileType: fileRecord.fileType,
                contents: JSON.stringify(fileContent),
                folder: fileRecord.folder,
            }).save();

            // Run this script again
            let params = {};
            params[paramNames.execTimestamp] = fileContent.timestamp;
            params[paramNames.paramFileId] = fileId;

            let scriptTask = task.create({
                taskType: task.TaskType['MAP_REDUCE'],
                scriptId: 'customscript_mr_mass_sms_processor_tn_v2',
                deploymentId: 'customdeploy_mr_mass_sms_processor_tn_v2',
                params
            });

            scriptTask.submit();

            log.debug({
                title: "summarize()",
                details: `Finished processing recipient of type ${currentRecipient.type}. ${count} entries processed. ${tempSet.size} unique mobile numbers found. ${fileContent.recipients.length} recipients remaining.`,
            });

            if (fileContent.status === VARS.MR_STATUS.SENDING)
                log.debug({
                    title: "summarize()",
                    details: `Indexing stage finishing. Moving on to Sending stage...`,
                });
        } else if (fileContent?.status === VARS.MR_STATUS.SENDING) {
            fileContent.status = VARS.MR_STATUS.COMPLETED;

            file.create({
                name: fileRecord.name,
                fileType: fileRecord.fileType,
                contents: JSON.stringify(fileContent),
                folder: fileRecord.folder,
            }).save();

            log.debug({
                title: "summarize()",
                details: `Finished sending message to ${fileContent.mobileNumbers.length} phone numbers.`,
            });
        }

    }

    return {
        getInputData,
        // map,
        reduce,
        summarize
    };
});

function _handleRecipient(recipient) {
    let {search} = NS_MODULES;
    let handler = {};

    handler[VARS.PHONE_NUMBERS] = recipient => recipient.data;

    handler[VARS.FRANCHISEES] = recipient =>
        search.create({
            type: 'partner',
            filters: ['internalid', 'anyof', ...recipient.data],
            columns: ['internalid', 'custentity2']
        });

    handler[VARS.FRANCHISEE_SS] = recipient => search.load({id: recipient.data[0]})

    handler[VARS.OPERATORS] = recipient =>
        search.create({
            type: 'customrecord_operator',
            filters: ['internalid', 'anyof', ...recipient.data],
            columns: ['internalid', 'custrecord_operator_phone']
        });

    handler[VARS.OPERATORS_BY_FRANCHISEE] = recipient =>
        search.create({
            type: "customrecord_operator",
            filters: ["custrecord_operator_franchisee.internalid", "anyof", ...recipient.data],
            columns: ['internalid', 'custrecord_operator_phone']
        });

    return handler[recipient.type] ? handler[recipient.type](recipient) : [];
}

function _formatMobileNumber(number) {
    // We first remove all none-numerical characters.
    // Then replace leading 0s followed by either 4 or 5, or leading 61 with +61
    return number.replace(/(\D)/gi, '').replace(/^(0(?=4)|0(?=5)|61)/, '+61')
}

function _isMobileNumberValid(number) {
    // return /^(04|05|\+614|\+615)[0-9]{8}$/.test(number);
    return /^(\+614|\+615)[0-9]{8}$/.test(number); // Check if number starts with +614 or +615
}

function _indexPhoneNumbers(context) {
    let {log} = NS_MODULES;

    if (Array.isArray(context.values) && context?.values?.length) {
        let index = 0;

        for (let value of context.values) {
            try {
                let fieldsToCheck = ['custentity2', 'custrecord_operator_phone', 'phone', 'altphone'];
                let searchResult = JSON.parse(value);

                for (let field of fieldsToCheck) {
                    let mobileNumber = searchResult.values[field] ? _formatMobileNumber(searchResult.values[field]) : null;

                    if (_isMobileNumberValid(mobileNumber))
                        context.write({key: context.key + '|' + index, value: mobileNumber});

                }
            } catch (e) {
                let mobileNumber = _formatMobileNumber(value);

                if (_isMobileNumberValid(mobileNumber))
                    context.write({key: context.key + '|' + index, value: mobileNumber});
            }
            index++;
        }
    } else log.debug({title: "reduce/indexPhoneNumbers", details: `key: ${context.key} | values: ${JSON.stringify(context.values)}`});
}

function _sendMessage(context, fileContent) {
    let {log, https} = NS_MODULES;

    if (Array.isArray(context.values) && context?.values?.length) {
        let index = 0;

        for (let value of context.values) {
            if (!_isMobileNumberValid(value)) continue;

            log.debug({title: "reduce/sendMessage", details: `Sending SMS to ${value}`});

            let {code} = https.post({
                url: twilioEndpoint,
                body: {
                    "Body": 'This is a test message',
                    "To": value,
                    "From": fileContent.senderNumber
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${twilioSecret}`
                }
            });

            context.write({key: context.key + '|' + index, value: `Message sent to ${value} with code: ${code}`});

            index++;
        }
    }else log.debug({title: "reduce/indexPhoneNumbers", details: `key: ${context.key} | values: ${JSON.stringify(context.values)}`});
}

function _getFileContent() {
    let {runtime, file, log} = NS_MODULES;
    let fileId = runtime.getCurrentScript().getParameter(paramNames.paramFileId);
    let timestamp = runtime.getCurrentScript().getParameter(paramNames.execTimestamp);
    let fileRecord = file.load({id: fileId});
    let fileContent = JSON.parse(fileRecord.getContents());

    // Check timestamp to make sure this file is intended for this task
    if (parseInt(timestamp) !== parseInt(fileContent.timestamp)) {
        log.debug({
            title: "getInputData()",
            details: `Timestamps mismatched. From params: ${timestamp}. From file: ${fileContent.timestamp}.`,
        });
        return null;
    }

    return fileContent;
}

function _handleErrorsInSummary(context) {
    let {log, file, runtime} = NS_MODULES;

    let errorCount = 0;

    if (context.inputSummary.error) {
        log.error('Input Error', context.inputSummary.error);
        errorCount++;
    }

    context.reduceSummary.errors.iterator().each(function(key, error, executionNo) {
        log.error({
            title: 'Reduce error for key: ' + key + ', execution no. ' + executionNo,
            details: error
        });
        errorCount ++;
        return true;
    });

    if (errorCount) {
        let fileId = runtime.getCurrentScript().getParameter(paramNames.paramFileId);
        let fileRecord = file.load({id: fileId});
        let fileContent = JSON.parse(fileRecord.getContents());

        fileContent.status = VARS.MR_STATUS.ERROR;

        file.create({
            name: fileRecord.name,
            fileType: fileRecord.fileType,
            contents: JSON.stringify(fileContent),
            folder: fileRecord.folder,
        }).save();

        return true;
    }

    return false;
}