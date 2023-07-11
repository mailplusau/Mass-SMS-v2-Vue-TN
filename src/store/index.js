import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import http from "@/utils/http";
import {debounce} from "@/utils/utils";
import {VARS} from "@/utils/utils";

const baseURL = 'https://' + process.env.VUE_APP_NS_REALM + '.app.netsuite.com';

Vue.use(Vuex);

const state = {
    franchisees: { loading: false, data: [], },
    franchiseeSavedSearches: { loading: false, data: [], },
    operators: { loading: false, data: [], },

    form: {
        selectedFranchiseeIds: [],
        selectedOperatorIds: [],

        recipients: [],

        operatorSelectorBusy: false,
        franchiseeSelectorBusy: false,
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
};

const getters = {
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
    }
};

const actions = {
    init : async context => {
        context.state.recipientDialog.phoneNumbers =
            ['123342534', '123124143', '123243343', '54634234', '72341513', '3242356234', '231116644', '3474354353', '87345345334', '02343343'];
        context.commit('addPhoneNumbersToRecipients');
        if (!_checkNetSuiteEnv()) return;

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
    handleException : (context, payload) => {
        console.error(payload);
    },
};

let _getOperatorBasedOnFranchisees = debounce(async context => {
    context.state.operators = await http.get('getAllOperators', {
        franchiseeIds: context.state.recipientDialog.operatorFilterByFranchisees
    });
    context.state.form.operatorSelectorBusy = false;
}, 2000)

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