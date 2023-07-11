
const PHONE_NUMBERS = 'phoneNumbers';
const FRANCHISEES = 'franchisees';
const FRANCHISEE_SS = 'franchiseeSavedSearches';
const OPERATORS = 'operators';
const OPERATORS_BY_FRANCHISEE = 'operatorsByFranchisees';
let tabNames = {};
tabNames[PHONE_NUMBERS] = 'tab-phone-number'
tabNames[FRANCHISEES] = 'tab-franchisees'
tabNames[FRANCHISEE_SS] = 'tab-franchisees'
tabNames[OPERATORS] = 'tab-operators'
tabNames[OPERATORS_BY_FRANCHISEE] = 'tab-operators'

export const VARS = {
    PHONE_NUMBERS,
    FRANCHISEES,
    FRANCHISEE_SS,
    OPERATORS,
    OPERATORS_BY_FRANCHISEE,
    tabNames,
}

export function debounce(fn, wait){
    let timer;
    return function(...args){
        if(timer) {
            clearTimeout(timer); // clear any pre-existing timer
        }
        const context = this; // get the current context
        timer = setTimeout(()=>{
            fn.apply(context, args); // call the function if time expires
        }, wait);
    }
}