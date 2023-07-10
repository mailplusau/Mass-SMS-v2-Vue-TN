import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import http from "@/utils/http";

const baseURL = 'https://' + process.env.VUE_APP_NS_REALM + '.app.netsuite.com';

Vue.use(Vuex)

const state = {
    franchisees: [],
    operators: [],

    form: {
        selectedFranchiseeId: null,
        selectedOperatorId: null,
    }
};

const getters = {
    franchisees : state => state.franchisees,
    operators : state => state.operators,
    form : state => state.form,
};

const mutations = {

};

const actions = {
    init : async context => {
        if (!_checkNetSuiteEnv()) return;

        context.state.franchisees = await http.get('getAllFranchisees');
        context.state.operators = await http.get('getAllOperators');
    }
};

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