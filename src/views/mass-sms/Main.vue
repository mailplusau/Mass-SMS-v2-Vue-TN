<template>
    <v-container fluid>
        <v-row class="mx-1">
            <v-col cols="12" class="mb-4">
                <h1 class="primary--text">
                    Mass SMS Sender
                </h1>
            </v-col>

            <v-col cols="12">
                <RecipientDisplay />
            </v-col>

            <v-col cols="12">
                <v-textarea
                    outlined counter :rules="rules"
                    label="Message To Send"
                    placeholder="Put the content of your SMS message here."
                ></v-textarea>
            </v-col>

            <v-col cols="12">{{form}}</v-col>
            <v-col cols="12">{{$store.getters['recipientDialog']}}</v-col>
        </v-row>

        <RecipientDeletionModal />
    </v-container>
</template>

<script>
import RecipientDisplay from "@/views/mass-sms/RecipientDisplay";
import RecipientDeletionModal from "@/views/mass-sms/RecipientDeletionModal";

export default {
    name: "Main",
    components: {RecipientDeletionModal, RecipientDisplay},
    data: () => ({
        rules: [v => !v || v?.length <= 160 || 'Max 160 characters'],
        items: [
            { text: 'Florida', value: 'FL' },
            { text: 'Georgia', value: 'GA' },
            { text: 'Nebraska', value: 'NE' },
            { text: 'California', value: 'CA' },
            { text: 'New York', value: 'NY' },
        ],
    }),
    computed: {
        form() {
            return this.$store.getters['form'];
        }
    }
}
</script>

<style scoped>

</style>