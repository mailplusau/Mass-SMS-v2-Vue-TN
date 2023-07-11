<template>
    <v-dialog
        v-model="recipientDialog"
        width="80vw" persistent
    >
        <template v-slot:activator="{ on, attrs }">
            <v-btn color="success" elevation="5"
                   v-bind="attrs"
                   v-on="on">
                + add recipients
            </v-btn>
        </template>
        <v-card color="background">
            <v-toolbar dark color="primary">
                <v-toolbar-title>{{ getDialogTitle() }}</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items>
                    <v-btn
                        text
                        @click="recipientDialog = false"
                        color="red"
                    >
                        Cancel
                    </v-btn>
                </v-toolbar-items>


                <template v-slot:extension>
                    <v-tabs v-model="tab">
                        <v-tab :href="`#${tabNames[PHONE_NUMBERS]}`" :disabled="tabLock && tabNames[PHONE_NUMBERS] !== tabLock">
                            <v-icon left>
                                mdi-account
                            </v-icon>
                            Phone Numbers
                        </v-tab>
                        <v-tab :href="`#${tabNames[FRANCHISEES]}`" :disabled="tabLock && tabNames[FRANCHISEES] !== tabLock">
                            <v-icon left>
                                mdi-account-group
                            </v-icon>
                            Franchisees
                        </v-tab>
                        <v-tab :href="`#${tabNames[OPERATORS]}`" :disabled="tabLock && tabNames[OPERATORS] !== tabLock">
                            <v-icon left>
                                mdi-access-point
                            </v-icon>
                            Operators
                        </v-tab>
                        <v-spacer></v-spacer>
                        <v-tab href="#tab-home" :disabled="tabLock && 'tab-home' !== tabLock">
                            <v-icon left>
                                mdi-home
                            </v-icon>
                        </v-tab>
                    </v-tabs>
                </template>
            </v-toolbar>

            <v-tabs-items v-model="tab" class="background">
                <v-tab-item value="tab-home">
                    <v-card flat  color="background">
                        <v-card-text>
                            In this dialog, you can choose between 3 types of recipients to send the SMS message to:
                            <ul>
                                <li><b>Phone Numbers:</b> You can add 1 or more phone numbers using this tab by hitting [ENTER] after every phone number entered.</li>
                                <li><b>Franchisees:</b> Again, you can add 1 or more franchisees from the dropdown. You can also add in a saved search that contain franchisees to be included in receiver list.</li>
                                <li><b>Operators:</b> As above, you can add 1 or more operators. Additionally, you can also choose 1 or more franchisees whose operators will be included in the recipients.</li>
                            </ul>
                        </v-card-text>
                    </v-card>
                </v-tab-item>
                <v-tab-item :value="tabNames[PHONE_NUMBERS]">
                    <AddRecipientPhoneNumberTab />
                </v-tab-item>
                <v-tab-item :value="tabNames[FRANCHISEES]">
                    <AddRecipientFranchiseeTab />
                </v-tab-item>
                <v-tab-item :value="tabNames[OPERATORS]">
                    <AddRecipientOperatorTab />
                </v-tab-item>
            </v-tabs-items>
        </v-card>
    </v-dialog>
</template>

<script>
import AddRecipientPhoneNumberTab from "@/views/mass-sms/components/AddRecipientPhoneNumberTab";
import {VARS} from "@/utils/utils";
import AddRecipientFranchiseeTab from "@/views/mass-sms/components/AddRecipientFranchiseeTab";
import AddRecipientOperatorTab from "@/views/mass-sms/components/AddRecipientOperatorTab";

export default {
    name: "AddRecipientDialog",
    components: {AddRecipientOperatorTab, AddRecipientFranchiseeTab, AddRecipientPhoneNumberTab},
    data: () => ({
        dialog: false,
        notifications: false,
        sound: true,
        widgets: false,
        ...VARS
    }),
    methods: {
        getDialogTitle() {
            if (!this.selectedEntry.type) return 'Select A Recipient Type';
            let lookupTable = {};
            lookupTable[this.PHONE_NUMBERS] = 'Making changes to phone number list';
            lookupTable[this.FRANCHISEES] = 'Changing the selected franchisees';
            lookupTable[this.FRANCHISEE_SS] = 'Selecting another saved search';
            lookupTable[this.OPERATORS] = 'Altering the list of selected operators';
            lookupTable[this.OPERATORS_BY_FRANCHISEE] = 'Picking franchisees to get operators from'
            return lookupTable[this.selectedEntry.type];
        }
    },
    computed: {
        recipientDialog: {
            get() {
                return this.$store.getters['recipientDialog'].open
            },
            set(val) {
                this.$store.commit('openRecipientDialog', {open: val});
            }
        },
        tab: {
            get() {
                return this.$store.getters['recipientDialog'].tab;
            },
            set(val) {
                this.$store.commit('setRecipientDialogTab', val);
            }
        },
        tabLock() {
            return this.$store.getters['recipientDialog'].tabLock;
        },
        selectedEntry() {
            return this.$store.getters['selectedEntry'];
        }
    }
}
</script>

<style scoped>

</style>