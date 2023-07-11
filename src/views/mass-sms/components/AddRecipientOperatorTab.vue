<template>
    <v-row class="mx-1 my-4">
        <v-col cols="12">
            <v-autocomplete
                v-model="recipientDialog.operatorFilterByFranchisees"
                :items="$store.getters['franchisees'].data" item-text="text" item-value="value"
                label="Filter the below operators by these franchisees"
                outlined multiple clearable persistent-hint dense hide-details
                append-outer-icon="mdi-refresh"
                @click:append-outer="$store.dispatch('getFranchisees')"
                :disabled="selectedEntry.type && selectedEntry.type !== OPERATORS"
                :loading="$store.getters['franchisees'].loading"
                v-show="filterDialog"
                class="mb-4"
            >
                <template v-slot:selection="{ attrs, item, parent, selected }">
                    <v-chip
                        v-if="item === Object(item)"
                        v-bind="attrs"
                        :input-value="selected"
                        label
                        color="primary"
                        small
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

            <v-autocomplete
                v-model="recipientDialog.operators"
                :items="operators" item-text="text" item-value="value"
                label="SELECT ONE OR MORE OPERATORS"
                outlined clearable multiple persistent-hint
                :disabled="selectedEntry.type && selectedEntry.type !== OPERATORS"
                :loading="$store.getters['operators'].loading"
                :hint="`${$store.getters['operators'].data.length} operators available`"
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

                <template v-slot:append-outer>
                    <v-icon class="mx-1" @click="filterDialog = !filterDialog" :color="filterIconState().color">
                        {{ filterIconState().icon }}
                    </v-icon>
                    <v-icon @click="$store.dispatch('getOperators')" class="mx-1">mdi-refresh</v-icon>
                </template>
            </v-autocomplete>
        </v-col>

        <v-col cols="12">
            <v-autocomplete
                v-model="recipientDialog.operatorsByFranchisees"
                :items="$store.getters['franchisees'].data" item-text="text" item-value="value"
                label="SELECT OPERATORS ASSOCIATED TO THE FOLLOWING FRANCHISEES"
                outlined multiple clearable persistent-hint
                append-outer-icon="mdi-refresh"
                @click:append-outer="$store.dispatch('getFranchisees')"
                :disabled="selectedEntry.type && selectedEntry.type !== OPERATORS_BY_FRANCHISEE"
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
            <v-btn color="success" block :loading="recipientDialog.busy" :disabled="!saveButtonText.hasData" @click="save">
                {{ saveButtonText.text }}
            </v-btn>
        </v-col>
    </v-row>
</template>

<script>
import {VARS} from "@/utils/utils";

export default {
    name: "AddRecipientOperatorTab",
    data: () => ({
        ...VARS,
        filterDialog: false,
    }),
    methods: {
        save() {
            this.$store.commit('addOperatorsToRecipients');
            this.$store.commit('addOperatorsByFranchiseesToRecipients');
        },
        filterIconState() {
            let color = this.recipientDialog.operatorFilterByFranchisees.length ? 'success' : '';
            let icon = this.filterDialog ? 'mdi-filter-check' : 'mdi-filter-plus';
            icon += this.recipientDialog.operatorFilterByFranchisees.length ? '' : '-outline';

            return {icon, color};
        },
    },
    computed: {
        operators() {
            return this.$store.getters['operators'].data
                .filter(item => !this.recipientDialog.operatorFilterByFranchisees.length || this.recipientDialog.operatorFilterByFranchisees.includes(item.franchiseeId))
        },
        form() {
            return this.$store.getters['form'];
        },
        recipientDialog() {
            return this.$store.getters['recipientDialog'];
        },
        saveButtonText() {
            let txt = 'Add the selected operators to recipient list';
            let operatorCount = this.recipientDialog.operators.length;
            let franchiseeCount = this.recipientDialog.operatorsByFranchisees.length;

            return {
                text: (operatorCount || franchiseeCount) ? txt : 'Please select one or more operators and/or franchisees',
                hasData: (!!operatorCount || !!franchiseeCount)
            };
        },
        selectedEntry() {
            return this.$store.getters['selectedEntry'];
        }
    }
}
</script>

<style scoped>

</style>