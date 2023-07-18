import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import http from "@/utils/http";
import {VARS} from "@/utils/utils";

const baseURL = 'https://' + process.env.VUE_APP_NS_REALM + '.app.netsuite.com';

Vue.use(Vuex);

let progressTimer;
let checkInternal = 3000; // in milliseconds

const state = {
    franchisees: { loading: false, data: [], },
    franchiseeSavedSearches: { loading: false, data: [], },
    operators: { loading: false, data: [], },

    form: {
        selectedFranchiseeIds: [],
        selectedOperatorIds: [],

        recipients: [],
        message: '',
        busy: false,
    },

    recipientDialog: {
        open: false, //
        busy: false,
        tab: 'tab-home',
        tabLock: null,
        selectedIndex: null,

        indexToDelete: null,

        phoneNumbers: [],
        franchisees: [],
        franchiseeSavedSearches: [],
        operators: [],
        operatorsByFranchisees: [],

        operatorFilterByFranchisees: [],
    },

    globalModal: {
        open: false,
        title: 'Default title',
        body: 'This is a global modal that will deliver notification on global level.',
        busy: false,
        progress: -1,
        persistent: true,
        isError: false
    },

    progressStatus: {status: null, processedRecipients: 0, totalRecipients: 0, processedNumbers: 0, totalNumbers: 0, averageProgressRate: 0}
};

const getters = {
    globalModal : state => state.globalModal,
    franchisees : state => state.franchisees,
    franchiseeSavedSearches : state => state.franchiseeSavedSearches,
    operators : state => state.operators,
    form : state => state.form,
    recipientDialog : state => state.recipientDialog,
    selectedEntry : state => state.form.recipients[state.recipientDialog.selectedIndex] || {},
    entryToDelete : state => state.form.recipients[state.recipientDialog.indexToDelete] || {},
};

const mutations = {
    setRecipientDialogTab : (state, tab = 'tab-home') => {state.recipientDialog.tab = tab},
    setRecipientEntryToDelete : (state, index) => {state.recipientDialog.indexToDelete = index},
    addPhoneNumbersToRecipients : state => {
        _addEntryToRecipients(state, VARS.PHONE_NUMBERS, (state) => state.recipientDialog[VARS.PHONE_NUMBERS].join(' | '));
    },
    addFranchiseesToRecipients : state => {
        let type = VARS.FRANCHISEES
        _addEntryToRecipients(state, type, (state) => state.recipientDialog[type].map(id => {
            let index = state.franchisees.data.findIndex(i => i.value === id)
            return state.franchisees.data[index].text;
        }).join(', '));
    },
    addSavedSearchToRecipients : state => {
        let type = VARS.FRANCHISEE_SS
        _addEntryToRecipients(state, type, (state) => state.recipientDialog[type].map(id => {
            let index = state.franchiseeSavedSearches.data.findIndex(i => i.value === id)
            return state.franchiseeSavedSearches.data[index].text;
        }).join(', '));
    },
    addOperatorsToRecipients : state => {
        let type = VARS.OPERATORS
        _addEntryToRecipients(state, type, (state) => state.recipientDialog[type].map(id => {
            let index = state.operators.data.findIndex(i => i.value === id)
            return state.operators.data[index].text;
        }).join(', '));
    },
    addOperatorsByFranchiseesToRecipients : state => {
        let type = VARS.OPERATORS_BY_FRANCHISEE
        _addEntryToRecipients(state, type, (state) => state.recipientDialog[type].map(id => {
            let index = state.franchisees.data.findIndex(i => i.value === id)
            return state.franchisees.data[index].text;
        }).join(', '));
    },
    deleteRecipient : (state, index) => {
        state.recipientDialog.indexToDelete = null;
        state.form.recipients.splice(index, 1)
    },
    openRecipientDialog : (state, {index, open = true} = {}) => {
        if (open && state.form.recipients[index]) {
            state.recipientDialog.tab = VARS.tabNames[state.form.recipients[index].type];
            state.recipientDialog.tabLock = VARS.tabNames[state.form.recipients[index].type];
            state.recipientDialog.selectedIndex = index;
            state.recipientDialog[state.form.recipients[index].type] = [...state.form.recipients[index].data]
        }

        state.recipientDialog.operatorFilterByFranchisees.splice(0);
        state.recipientDialog.open = open;

        if (!open && state.recipientDialog.selectedIndex !== null) { // When dialog is closed, we clear the preloaded data
            state.recipientDialog[state.form.recipients[state.recipientDialog.selectedIndex].type].splice(0);
            state.recipientDialog.tabLock = null;
            state.recipientDialog.selectedIndex = null;
        }
    },

    setGlobalModal: (state, open = true) => {
        state.globalModal.open = open;
    },
    displayErrorGlobalModal: (state, {title, message}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.progress = -1;
        state.globalModal.persistent = true;
        state.globalModal.isError = true;
    },
    displayBusyGlobalModal: (state, {title, message, open = true, progress = -1}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = open;
        state.globalModal.open = open;
        state.globalModal.progress = progress;
        state.globalModal.persistent = true;
        state.globalModal.isError = false;
    },
    displayInfoGlobalModal: (state, {title, message, persistent = false}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.progress = -1;
        state.globalModal.persistent = persistent;
        state.globalModal.isError = false;
    }
};

const actions = {
    addShortcut : () => {
        parent?.window?.addShortcut()
    },
    init : async context => {
        if (!_checkNetSuiteEnv()) return;

        await context.dispatch('checkProgress');
        progressTimer = setInterval(() => {context.dispatch('checkProgress')}, checkInternal);

        context.dispatch('getFranchisees').then();
        context.dispatch('getSavedSearches').then();
        context.dispatch('getOperators').then();
    },
    getFranchisees : async context => {
        context.state.franchisees.loading = true;
        context.state.franchisees.data = await http.get('getAllFranchisees');
        context.state.franchisees.loading = false;
    },
    getOperators : async context => {
        context.state.operators.loading = true;
        context.state.operators.data = await http.get('getAllOperators');
        context.state.operators.loading = false;
    },
    getSavedSearches : async context => {
        context.state.franchiseeSavedSearches.loading = true;
        context.state.franchiseeSavedSearches.data = await http.get('getSavedSearchOfFranchisees');
        context.state.franchiseeSavedSearches.loading = false;
    },
    handleException: (context, {title, message}) => {
        context.commit('displayErrorGlobalModal', {
            title, message
        })
    },
    sendMassSMS : async context => {
        context.commit('displayBusyGlobalModal', {title: 'Sending message', message: 'Please wait while the message is being sent...', open: true});

        await http.post('sendMassSMS', {
            customSenderNumber: '',
            recipients: context.state.form.recipients,
            message: context.state.form.message,
        });
    },
    checkProgress : async context => {
        let {status, processedRecipients, totalRecipients, processedNumbers, totalNumbers} = await http.get('getProgressStatus');
        let currentProgress = context.state.progressStatus;
        let progressText ='(' + processedNumbers + '/' + totalNumbers + ' messages sent)';

        console.log('recipient progress', Math.ceil(parseInt(processedRecipients) / parseInt(totalRecipients)) * 100)
        console.log('number progress', Math.ceil(parseInt(processedNumbers) / parseInt(totalNumbers)) * 100)

        if (status === VARS.MR_STATUS.INDEXING)
            context.commit('displayBusyGlobalModal', {
                title: 'Email sending in progress',
                message: 'Recipients are being processed...',
                progress: Math.ceil(parseInt(processedRecipients) / parseInt(totalRecipients) * 100)
            });
        else if (status === VARS.MR_STATUS.SENDING)
            context.commit('displayBusyGlobalModal', {
                title: 'Email sending in progress',
                message: 'Messages are being sent out... ' + progressText,
                progress: Math.ceil(parseInt(processedNumbers) / parseInt(totalNumbers) * 100)
            });
        else if (currentProgress.status !== null && currentProgress.status !== status && status === VARS.MR_STATUS.COMPLETED)
            context.commit('displayInfoGlobalModal', {title: 'Complete', message: totalNumbers + ' SMS messages were sent out.'});

        context.state.progressStatus.status = status;
        context.state.progressStatus.processedNumbers = parseInt(processedNumbers);
        context.state.progressStatus.totalNumbers = parseInt(totalNumbers);
    },
    stopCheckingProgress : () => {
        clearInterval(progressTimer);
    }
};

function _addEntryToRecipients(state, type, textFunc = null) {
    if (!state.recipientDialog[type].length) return;

    state.recipientDialog.busy = true;
    let text = textFunc ? textFunc(state) : state.recipientDialog[type].join(', ');

    if (state.recipientDialog.selectedIndex !== null) { // If there is an index, it means we're in edit mode
        state.form.recipients[state.recipientDialog.selectedIndex].data = [...state.recipientDialog[type]];
        state.form.recipients[state.recipientDialog.selectedIndex].text = text;
    } else
        state.form.recipients.push({
            type,
            data: [...state.recipientDialog[type]],
            text
        });
    state.recipientDialog[type].splice(0);
    state.recipientDialog.selectedIndex = null;
    state.recipientDialog.tabLock = null;
    state.recipientDialog.busy = false;
    state.recipientDialog.open = false;
}

function _checkNetSuiteEnv() {
    if (parent['getCurrentNetSuiteUrl']) {
        return parent.getCurrentNetSuiteUrl().includes(baseURL);
    } else return false;
}

const store = new Vuex.Store({
    state,
    mutations,
    actions,
    getters,
    modules,
});

export default store;