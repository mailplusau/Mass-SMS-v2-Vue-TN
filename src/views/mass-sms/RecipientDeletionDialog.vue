<template>
    <v-dialog
        v-model="dialog"
        max-width="400"
    >
        <v-card class="background">
            <v-card-title class="text-h5">
                Delete Recipient?
            </v-card-title>

            <v-card-text>
                {{getText(entryToDelete.type)}}
            </v-card-text>

            <v-card-subtitle>{{entryToDelete.text || entryToDelete.data}}</v-card-subtitle>

            <v-card-text><b>This cannot be undone. Are you sure?</b></v-card-text>

            <v-card-actions>
                <v-btn
                    color="red darken-1"
                    text
                    @click="deleteRecipient"
                >
                    Yes, Delete
                </v-btn>

                <v-spacer></v-spacer>

                <v-btn
                    color="green darken-1"
                    text
                    @click="dialog = false"
                >
                    Cancel
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import {VARS} from "@/utils/utils";

export default {
    name: "RecipientDeletionDialog",
    data: () => ({
        ...VARS,
    }),
    methods: {
        deleteRecipient() {
            this.$store.commit('deleteRecipient', this.$store.getters['recipientDialog'].indexToDelete)
        },
        getText(type) {
            let lookupTable = {};
            lookupTable[this.PHONE_NUMBERS] = 'the following phone number(s)';
            lookupTable[this.FRANCHISEES] = 'the following franchisee(s)';
            lookupTable[this.FRANCHISEE_SS] = 'the franchisees in the following saved search';
            lookupTable[this.OPERATORS] = 'the following operator(s)';
            lookupTable[this.OPERATORS_BY_FRANCHISEE] = 'the operators associated with the following franchisees'
            return `You are about to delete ${lookupTable[type]} from the list of recipients:`;
        },
    },
    computed: {
        dialog: {
            get() {
                return this.$store.getters['recipientDialog'].indexToDelete !== null;
            },
            set(val) {
                if (!val) this.$store.getters['recipientDialog'].indexToDelete = null;
            }
        },
        entryToDelete() {
            return this.$store.getters['entryToDelete'];
        }
    }
}
</script>

<style scoped>

</style>