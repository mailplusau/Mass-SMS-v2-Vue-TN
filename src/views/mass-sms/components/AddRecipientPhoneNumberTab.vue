<template>
    <v-row class="mx-1 my-4">
        <v-col v-if="!recipientDialog.phoneNumbers.length">
            <v-chip label color="red">
                No phone number added.
            </v-chip>
        </v-col>
        <v-col
            v-for="(selection, i) in recipientDialog.phoneNumbers"
            :key="selection.text"
            class="shrink"
        >
            <v-chip
                close
                label
                color="primary"
                @click:close="recipientDialog.phoneNumbers.splice(i, 1)"
            >
                {{ selection }}
            </v-chip>
        </v-col>


        <v-col cols="12" class="mt-4">
            <v-text-field @click:append-outer="addPhoneNumber"
                          :rules="[validatePhoneNumber]"
                          hide-spin-buttons
                          append-outer-icon="mdi-plus-box"
                          prepend-icon="mdi-phone"
                          filled dense type="number"
                          label="Phone number" v-model="phoneNumber" @keyup.enter="addPhoneNumber"
                          :disabled="recipientDialog.busy"
                          placeholder="Type a phone number and hit [ENTER]. Multiple entries can be added this way."></v-text-field>
        </v-col>
        <v-col cols="12" v-show="recipientDialog.phoneNumbers.length">
            <v-btn color="success" block @click="$store.commit('addPhoneNumbersToRecipients')" :loading="recipientDialog.busy">
                {{ recipientDialog.selectedIndex !== null ? 'Save these changes to recipient list' : 'Add these phone numbers to recipient list' }}
            </v-btn>
        </v-col>
    </v-row>
</template>

<script>
export default {
    name: "AddRecipientPhoneNumberTab",
    data: () => ({
        phoneNumber: '',
    }),
    methods: {
        addPhoneNumber() {
            let testResult = this.validatePhoneNumber(this.phoneNumber);
            if (this.phoneNumber && testResult && typeof testResult === 'boolean') {
                this.recipientDialog.phoneNumbers.push(this.phoneNumber);
                this.phoneNumber = '';
            }
        },
        validatePhoneNumber(value) {
            let australiaPhoneFormat = /^(\+\d{2}[ -]{0,1}){0,1}(((\({0,1}[ -]{0,1})0{0,1}\){0,1}[2|3|7|8]{1}\){0,1}[ -]*(\d{4}[ -]{0,1}\d{4}))|(1[ -]{0,1}(300|800|900|902)[ -]{0,1}((\d{6})|(\d{3}[ -]{0,1}\d{3})))|(13[ -]{0,1}([\d -]{5})|((\({0,1}[ -]{0,1})0{0,1}\){0,1}4{1}[\d -]{8,10})))$/;
            return australiaPhoneFormat.test(value) || !value || 'Must be a valid Australian phone number';
        }
    },
    computed: {
        recipientDialog() {
            return this.$store.getters['recipientDialog'];
        },
    }
}
</script>

<style scoped>

</style>