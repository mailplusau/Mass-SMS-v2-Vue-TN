<template>
    <v-row class="mx-1 my-4">
        <v-col cols="12">
            <v-autocomplete
                v-model="recipientDialog.franchisees"
                :items="$store.getters['franchisees'].data" item-text="text" item-value="value"
                label="SELECT ONE OR MULTIPLE FRANCHISEES"
                outlined multiple clearable persistent-hint
                append-outer-icon="mdi-refresh"
                @click:append-outer="$store.dispatch('getFranchisees')"
                :disabled="selectedEntry.type && selectedEntry.type !== FRANCHISEES"
                :loading="$store.getters['franchisees'].loading"
                :hint="`${$store.getters['franchisees'].data.length} franchisees available`"
            >
                <template v-slot:selection="{ attrs, item, parent, selected }">
                    <v-chip
                        v-if="item === Object(item)"
                        v-bind="attrs"
                        :input-value="selected"
                        label
                        color="primary"
                    >
                        <span class="pr-2">{{ item.text }}</span>
                        <v-icon
                            @click.stop="parent.selectItem(item)"
                            color="red"
                        >
                            mdi-close-circle-outline
                        </v-icon>
                    </v-chip>
                </template>
            </v-autocomplete>
        </v-col>

        <v-col cols="12">
            <v-autocomplete
                v-model="savedSearchId"
                :items="$store.getters['franchiseeSavedSearches'].data" item-text="text" item-value="value"
                label="SELECT A SAVED SEARCH"
                outlined clearable persistent-hint
                append-outer-icon="mdi-refresh"
                @click:append-outer="$store.dispatch('getSavedSearches')"
                :disabled="selectedEntry.type && selectedEntry.type !== FRANCHISEE_SS"
                :loading="$store.getters['franchiseeSavedSearches'].loading"
                :hint="`${$store.getters['franchiseeSavedSearches'].data.length} saved searches available`"
            >
            </v-autocomplete>
        </v-col>

        <v-col cols="12">
            <v-btn color="success" block :loading="recipientDialog.busy" :disabled="!saveButtonText.hasData" @click="save">
                {{ saveButtonText.text }}
            </v-btn>
        </v-col>
    </v-row>
</template>

<script>
import {VARS} from "@/utils/utils";

export default {
    name: "AddRecipientFranchiseeTab",
    data: () => ({
        ...VARS,
    }),
    methods: {
        save() {
            this.$store.commit('addFranchiseesToRecipients');
            this.$store.commit('addSavedSearchToRecipients');
        }
    },
    computed: {
        form() {
            return this.$store.getters['form'];
        },
        recipientDialog() {
            return this.$store.getters['recipientDialog'];
        },
        saveButtonText() {
            let txt = 'Add ';
            let franchiseeCount = this.recipientDialog.franchisees.length;
            let savedSearchId = this.recipientDialog.franchiseeSavedSearches[0];

            txt += franchiseeCount ? `${franchiseeCount} franchisees ` : '';
            txt += franchiseeCount && savedSearchId ? 'and ' : '';
            txt += savedSearchId ? 'the selected search ' : '';
            txt += 'to recipient list'

            return {
                text: (franchiseeCount || savedSearchId) ? txt : 'Please select one or more franchisees and/or a saved search',
                hasData: (!!franchiseeCount || !!savedSearchId)
            };
        },
        savedSearchId: {
            get() {
                return this.recipientDialog.franchiseeSavedSearches[0];
            },
            set(val) {
                this.recipientDialog.franchiseeSavedSearches = [val];
            }
        },
        selectedEntry() {
            return this.$store.getters['selectedEntry'];
        }
    }
}
</script>

<style scoped>

</style>