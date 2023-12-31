/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Mass SMS
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @created 10/07/2023
 */

import {VARS} from '@/utils/utils.mjs';

// This should be the same file as the one built by webpack. Make sure this matches the filename in package.json
let htmlTemplateFile = 'mp_cl_mass_sms_tn_v2_vue.html';
const clientScriptFilename = 'mp_cl_mass_sms_tn_v2_vue.js';
const defaultTitle = 'Mass SMS Sender';
const senderNumber = process.env.VUE_APP_NS_SMS_SENDER_NUMBER;
const processorScriptId = process.env.VUE_APP_NS_PROCESSOR_SCRIPT_ID; // The record id of the script mp_mr_mass_sms_processor_tn_v2.js in NetSuite
const paramFileName = 'mp_pf_mass_sms_tn.json'; // parameter file

let NS_MODULES = {};


define(['N/ui/serverWidget', 'N/render', 'N/search', 'N/file', 'N/log', 'N/record', 'N/email', 'N/runtime', 'N/https', 'N/task', 'N/format', 'N/url'],
    (serverWidget, render, search, file, log, record, email, runtime, https, task, format, url) => {
    NS_MODULES = {serverWidget, render, search, file, log, record, email, runtime, https, task, format, url};
    
    const onRequest = ({request, response}) => {
        if (request.method === "GET") {

            if (!_handleGETRequests(request.parameters['requestData'], response)){
                // Render the page using either inline form or standalone page
                // _getStandalonePage(response)
                _getInlineForm(response)
            }

        } else if (request.method === "POST") { // Request method should be POST (?)
            _handlePOSTRequests(JSON.parse(request.body), response);
            // _writeResponseJson(response, {test: 'test response from post', params: request.parameters, body: request.body});
        } else {
            log.debug({
                title: "request method type",
                details: `method : ${request.method}`,
            });
        }

    }

    return {onRequest};
});

// We use the form to load the Client Script.
function _getInlineForm(response) {
    let {serverWidget} = NS_MODULES;
    
    // Create a NetSuite form
    let form = serverWidget.createForm({ title: defaultTitle });

    // Retrieve client script ID using its file name.
    form.clientScriptFileId = _getHtmlTemplate(clientScriptFilename)[clientScriptFilename].id;

    response.writePage(form);
}

// Render the htmlTemplateFile as a standalone page without any of NetSuite's baggage. However, this also means no
// NetSuite module will be exposed to the Vue app. Thus, an api approach using Axios and structuring this Suitelet as
// a http request handler will be necessary. For reference:
// https://medium.com/@vladimir.aca/how-to-vuetify-your-suitelet-on-netsuite-part-2-axios-http-3e8e731ac07c
function _getStandalonePage(response) {
    let {render, file} = NS_MODULES;

    // Create renderer to render our html template
    const pageRenderer = render.create();

    // Get the id and url of our html template file
    const htmlFileData = _getHtmlTemplate(htmlTemplateFile);

    // Load the  html file and store it in htmlFile
    const htmlFile = file.load({
        id: htmlFileData[htmlTemplateFile].id
    });

    // Load the content of the html file into the renderer
    pageRenderer.templateContent = htmlFile.getContents();

    response.write(pageRenderer.renderAsString());
}

// Search for the ID and URL of a given file name inside the NetSuite file cabinet
function _getHtmlTemplate(htmlPageName) {
    let {search} = NS_MODULES;

    const htmlPageData = {};

    search.create({
        type: 'file',
        filters: ['name', 'is', htmlPageName],
        columns: ['name', 'url']
    }).run().each(resultSet => {
        htmlPageData[resultSet.getValue({ name: 'name' })] = {
            url: resultSet.getValue({ name: 'url' }),
            id: resultSet.id
        };
        return true;
    });

    return htmlPageData;
}


function _handleGETRequests(request, response) {
    if (!request) return false;

    let {log} = NS_MODULES;

    try {
        let {operation, requestParams} = JSON.parse(request);

        if (!operation) throw 'No operation specified.';

        if (!getOperations[operation]) throw `Operation [${operation}] is not supported.`;

        getOperations[operation](response, requestParams);
    } catch (e) {
        log.debug({title: "_handleGETRequests", details: `error: ${e}`});
        _writeResponseJson(response, {error: `${e}`})
    }

    return true;
}

function _handlePOSTRequests({operation, requestParams}, response) {
    let {log} = NS_MODULES;

    try {
        if (!operation) throw 'No operation specified.';

        // _writeResponseJson(response, {source: '_handlePOSTRequests', operation, requestParams});
        postOperations[operation](response, requestParams);
    } catch (e) {
        log.debug({title: "_handlePOSTRequests", details: `error: ${e}`});
        _writeResponseJson(response, {error: `${e}`})
    }
}

function _writeResponseJson(response, body) {
    response.write({ output: JSON.stringify(body) });
    response.addHeader({
        name: 'Content-Type',
        value: 'application/json; charset=utf-8'
    });
}

const getOperations = {
    'getIframeContents' : function (response) { // DO NOT REMOVE. This GET function is essential to load the Vue app
        let {file} = NS_MODULES;

        const htmlFileData = _getHtmlTemplate(htmlTemplateFile);
        const htmlFile = file.load({ id: htmlFileData[htmlTemplateFile].id });

        _writeResponseJson(response, htmlFile.getContents());
    },
    'getAllFranchisees' : function (response) {
        let {search} = NS_MODULES;
        let data = [];

        search.create({
            type: "partner",
            filters:
                [
                    ["isinactive", "is", false],
                    "AND",
                    ["entityid", "doesnotstartwith", "old"]
                ],
            columns:
                [
                    search.createColumn({name: "internalid", label: "Internal ID"}),
                    search.createColumn({name: "entityid", sort: search.Sort.ASC, label: "Name"}),
                    search.createColumn({name: "companyname", label: "Company Name"}),
                    search.createColumn({name: "department", label: "Department"}),
                    search.createColumn({name: "location", label: "Location"}),
                    search.createColumn({name: "mobilephone", label: "Mobile Phone"}),
                    search.createColumn({name: "custentity2", label: "Franchisee Mobile No"})
                ]
        }).run().each(result => {
            data.push({text: result.getValue('companyname'), value: result.getValue('internalid')});

            return true;
        })

        _writeResponseJson(response, data);
    },
    'getAllOperators' : function (response, {franchiseeIds = []} = {}) {
        let {search} = NS_MODULES;
        let data = [];
        let filters = [
            ["isinactive", "is", false],
            "AND",
            ["custrecord_operator_status", "noneof", ["3","5"]], // No Longer Employed or Duplicated
        ];

        if (franchiseeIds && franchiseeIds?.length) {
            filters.push('AND');
            filters.push(['custrecord_operator_franchisee', 'anyof', franchiseeIds])
        }

        search.create({
            type: "customrecord_operator",
            filters,
            columns:
                [
                    search.createColumn({
                        name: "internalid",
                        sort: search.Sort.ASC,
                        label: "Operator Internal ID"
                    }),
                    search.createColumn({name: "custrecord_operator_givennames", label: "Given Names"}),
                    search.createColumn({name: "custrecord_operator_surname", label: "Surname"}),
                    search.createColumn({name: "custrecord_operator_email", label: "Contact Email"}),
                    search.createColumn({name: "custrecord_operator_phone", label: "Contact Phone"}),
                    search.createColumn({
                        name: "internalid",
                        join: "CUSTRECORD_OPERATOR_FRANCHISEE",
                        label: "Franchisee Internal ID"
                    }),
                    search.createColumn({
                        name: "companyname",
                        join: "CUSTRECORD_OPERATOR_FRANCHISEE",
                        label: "Company Name"
                    }),
                    search.createColumn({name: "custrecord_dds_operator", label: "DDS Operator"})
                ]
        }).run().each(result => {
            data.push({
                value: result.getValue('internalid'),
                text: `${result.getValue('custrecord_operator_givennames')} ${result.getValue('custrecord_operator_surname')} (${result.getValue({name: 'companyname', join: 'CUSTRECORD_OPERATOR_FRANCHISEE'})})`,
                franchiseeId: result.getValue({name: 'internalid', join: 'CUSTRECORD_OPERATOR_FRANCHISEE'})
            });

            return true;
        })

        _writeResponseJson(response, data);
    },
    'getSavedSearchOfFranchisees' : function (response) {
        let {search} = NS_MODULES;

        let data = [];
        let columnNames = ['id', 'title', 'recordtype', 'frombundle', 'owner', 'access', 'lastrunby', 'lastrunon'];

        search.create({
            type: search.Type['SAVED_SEARCH'],
            filters: [
                {name: 'recordtype', operator: 'anyof', values: ['Partner']},
            ],
            columns: columnNames.map(item => ({name: item}))
        }).run().each(result => {
            data.push({text: result.getValue('title'), value: result.getValue('id')});

            return true;
        });

        _writeResponseJson(response, data);
    },
    'getProgressStatus' : function (response) {
        let {search, file} = NS_MODULES;
        let progressStatus = {status: null, processedRecipients: 0, totalRecipients: 0, processedNumbers: 0, totalNumbers: 0};
        let fileId = null;

        search.create({
            type: 'file',
            filters: [['name', 'is', paramFileName], 'AND', ['folder', 'is', -15]],
            columns: ['name', 'url']
        }).run().each(resultSet => {fileId = resultSet.id;});

        if (fileId) {
            let fileRecord = file.load({id: fileId});

            try {
                let fileContent = JSON.parse(fileRecord.getContents());

                progressStatus.status = fileContent.status;
                progressStatus.processedRecipients = fileContent.totalRecipientCount - fileContent.recipients.length;
                progressStatus.totalRecipients = fileContent.totalRecipientCount;
                progressStatus.processedNumbers = fileContent.mobileNumberSent;
                progressStatus.totalNumbers = fileContent.mobileNumbers.length;
            } catch (e) {
                //
            }
        }

        _writeResponseJson(response, progressStatus);
    }
}

const postOperations = {
    'sendMassSMS' : function (response, {recipients, message, customSenderNumber} = {}) {
        let {file, task} = NS_MODULES;
        let fileContent = {status: VARS.MR_STATUS.INDEXING, timestamp: Date.now(), recipients: [], mobileNumbers: [],
            totalRecipientCount: 0, mobileNumberSent: 0,
            senderNumber: customSenderNumber || senderNumber, message};

        // We check if the process is already running
        if (_isSendingInProgress()) {
            _writeResponseJson(response, {error: 'Another process is already running. Please try again later.'});
            return;
        }

        // Check if recipients is present and has data
        if (!recipients || !recipients?.length) {
            _writeResponseJson(response, {error: 'No recipient specified.'});
            return;
        }

        // Check if message is present
        if (!message || message.length < 5) {
            _writeResponseJson(response, {error: 'Message is empty or too short'});
            return;
        }

        fileContent.recipients = recipients.map(recipient => ({type: recipient.type, data: recipient.data}));
        fileContent.totalRecipientCount = recipients.length;

        // noinspection JSVoidFunctionReturnValueUsed
        let fileId = file.create({
            name: paramFileName,
            fileType: file.Type['JSON'],
            contents: JSON.stringify(fileContent),
            folder: -15,
        }).save();

        let params = {};
        params[`custscript_${processorScriptId}_exec_timestamp`] = fileContent.timestamp;
        params[`custscript_${processorScriptId}_param_file_id`] = fileId;

        let scriptTask = task.create({
            taskType: task.TaskType['MAP_REDUCE'],
            scriptId: 'customscript_mr_mass_sms_processor_tn_v2',
            deploymentId: 'customdeploy_mr_mass_sms_processor_tn_v2',
            params
        });
        scriptTask.submit();

        _writeResponseJson(response, `The specified recipients will be processed and an SMS will be sent to them shortly.`);
    }
};

function _isSendingInProgress() {
    let {search, file} = NS_MODULES;
    let fileId = null;

    search.create({
        type: 'file',
        filters: [['name', 'is', paramFileName], 'AND', ['folder', 'is', -15]],
        columns: ['name', 'url']
    }).run().each(resultSet => {fileId = resultSet.id;});

    if (!fileId) return false;

    let fileRecord = file.load({id: fileId});

    try {
        let fileContent = JSON.parse(fileRecord.getContents());

        return [VARS.MR_STATUS.STARTING, VARS.MR_STATUS.INDEXING, VARS.MR_STATUS.SENDING].includes(fileContent.status);
    } catch (e) { return false; }
}

function _parseIsoDatetime(dateString) {
    let dt = dateString.split(/[: T-]/).map(parseFloat);
    return new Date(dt[0], dt[1] - 1, dt[2], dt[3] || 0, dt[4] || 0, dt[5] || 0, 0);
}

function _parseISODate(dateString) {
    let dt = dateString.split(/[: T-]/).map(parseFloat);
    return new Date(dt[0], dt[1] - 1, dt[2]);
}

function _getLocalTimeFromOffset(localUTCOffset) {
    let today = new Date();
    let serverUTCOffset = today.getTimezoneOffset();

    let localTime = new Date();
    localTime.setTime(today.getTime() + (serverUTCOffset - parseInt(localUTCOffset)) * 60 * 1000);

    return localTime;
}