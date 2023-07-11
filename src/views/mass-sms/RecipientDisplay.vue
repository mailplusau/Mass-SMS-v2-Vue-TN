<template>
    <v-row class="mx-auto my-3">
        <v-card width="100%" elevation="5">
            <v-toolbar
                color="primary"
                dark
            >
                <v-toolbar-title>Send an SMS to...</v-toolbar-title>

                <v-spacer></v-spacer>

                <AddRecipientDialog />
            </v-toolbar>

            <v-list
                subheader
                two-line
                color="background"
            >
                <v-list-item v-show="!form.recipients.length">
                    <v-list-item-content>
                        <v-list-item-title>There are no recipient in this list</v-list-item-title>
                        <v-list-item-subtitle><i>Click [ADD RECIPIENT] button to start</i></v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>

                <v-list-item v-for="(recipient, index) in form.recipients" :key="'recipient_' + index">
                    <v-list-item-avatar>
                        <v-icon
                            class="green lighten-2"
                            color="accent"
                            dark
                        >
                            {{ getIcon(recipient.type) }}
                        </v-icon>
                    </v-list-item-avatar>

                    <v-list-item-content>
                        <v-list-item-subtitle>{{getText(recipient.type)}}</v-list-item-subtitle>

                        <v-list-item-title>{{recipient.text || recipient.data}}</v-list-item-title>
                    </v-list-item-content>

                    <v-list-item-action>
                        <v-btn icon @click="$store.commit('openRecipientDialog', {index})">
                            <v-icon color="primary">mdi-pencil</v-icon>
                        </v-btn>
                    </v-list-item-action>
                    <v-list-item-action>
                        <v-btn icon @click="$store.commit('setRecipientEntryToDelete', index)">
                            <v-icon color="red">mdi-delete</v-icon>
                        </v-btn>
                    </v-list-item-action>
                </v-list-item>
            </v-list>
        </v-card>
    </v-row>
</template>

<script>
import AddRecipientDialog from "@/views/mass-sms/AddRecipientDialog";
import {VARS} from "@/utils/utils";

export default {
    name: "RecipientDisplay",
    components: {AddRecipientDialog},
    data: () => ({
        ...VARS,
    }),
    methods: {
        getText(type) {
            let lookupTable = {};
            lookupTable[this.PHONE_NUMBERS] = 'The following phone number(s):';
            lookupTable[this.FRANCHISEES] = 'The following franchisee(s):';
            lookupTable[this.FRANCHISEE_SS] = 'Franchisees in the following saved search:';
            lookupTable[this.OPERATORS] = 'The following operator(s):';
            lookupTable[this.OPERATORS_BY_FRANCHISEE] = 'Operators associated with the following franchisees:'
            return lookupTable[type];
        },
        getIcon(type) {
            let lookupTable = {};
            lookupTable[this.PHONE_NUMBERS] = 'mdi-account';
            lookupTable[this.FRANCHISEES] = 'mdi-account-group';
            lookupTable[this.FRANCHISEE_SS] = 'mdi-book-account';
            lookupTable[this.OPERATORS] = 'mdi-access-point';
            lookupTable[this.OPERATORS_BY_FRANCHISEE] = 'mdi-human-greeting-proximity';
            return lookupTable[type];
        }
    },
    computed: {
        form() {
            return this.$store.getters['form']
        },
    }
}
</script>

<style scoped>

</style>