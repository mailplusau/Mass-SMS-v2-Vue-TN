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
                          @keypress="filterNumbers"
                          hide-spin-buttons filled dense
                          append-outer-icon="mdi-plus-box"
                          prepend-icon="mdi-phone"
                          label="Phone number" v-model="phoneNumber" @keyup.enter="addPhoneNumber"
                          :disabled="recipientDialog.busy"
                          :hint="recipientDialog.phoneNumbers.length ? 'Hit [ENTER] again with an empty field to quickly add these phone numbers to recipient list' : ''"
                          autocomplete="off"
                          placeholder="Type a phone number and hit [ENTER]. Multiple entries can be added this way."></v-text-field>
        </v-col>
        <v-col cols="12">
            <v-btn v-if="!recipientDialog.phoneNumbers.length" color="success" block disabled>
                Please add at least 1 phone number
            </v-btn>
            <v-btn v-else color="success" block @click="$store.commit('addPhoneNumbersToRecipients')" :loading="recipientDialog.busy">
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
                this.recipientDialog.phoneNumbers.push(this.phoneNumber.replaceAll('+61', '0'));
                this.phoneNumber = '';
            }
        },
        validatePhoneNumber(value) {
            // Australian mobile number starting either 04, 05, +614 or +615 and followed by 8 digits
            let australianMobileFormat = /^(04|05|\+614|\+615)[0-9]{8}$/;
            // let australiaPhoneFormat = /^(\+\d{2}[ -]{0,1}){0,1}(((\({0,1}[ -]{0,1})0{0,1}\){0,1}[2|3|7|8]{1}\){0,1}[ -]*(\d{4}[ -]{0,1}\d{4}))|(1[ -]{0,1}(300|800|900|902)[ -]{0,1}((\d{6})|(\d{3}[ -]{0,1}\d{3})))|(13[ -]{0,1}([\d -]{5})|((\({0,1}[ -]{0,1})0{0,1}\){0,1}4{1}[\d -]{8,10})))$/;
            return australianMobileFormat.test(value) || !value || 'Must be a valid Australian mobile phone number';
        },

        filterNumbers: function(evt) {
            // evt = (evt) ? evt : window.event;
            let expect = evt.target.value.toString() + evt.key.toString();

            if (!evt.target.value.toString() && evt.key.toString() === 'Enter') this.$store.commit('addPhoneNumbersToRecipients')

            if (!/^[-+]?[0-9]*?[0-9]*$/.test(expect)) // Allow only 1 leading + sign and numbers
            // if (!/^[0-9]*$/.test(expect)) // Allow only numbers
                evt.preventDefault();
            else return true;
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