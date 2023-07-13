<template>
    <v-container fluid>
        <v-row class="mx-1" justify="space-between" align="center">
            <v-col cols="auto">
                <h1 class="primary--text">
                    Mass SMS Sender
                </h1>
            </v-col>

            <v-col cols="auto">
                <a @click="$store.dispatch('addShortcut')" class="subtitle-1">Add To Shortcuts <v-icon size="20" color="primary">mdi-open-in-new</v-icon></a>
            </v-col>
        </v-row>
        <v-row class="mx-1">
            <v-col cols="12">
                <RecipientDisplay />
            </v-col>

            <v-col cols="12">
                <v-textarea
                    v-model="form.message"
                    outlined counter :rules="rules"
                    label="Message To Send"
                    placeholder="Put the content of your SMS message here."
                ></v-textarea>
            </v-col>

            <v-col cols="12">
                <SendMassSMSDialog />
            </v-col>
        </v-row>

        <RecipientDeletionDialog />
    </v-container>
</template>

<script>
import RecipientDisplay from "@/views/mass-sms/RecipientDisplay";
import RecipientDeletionDialog from "@/views/mass-sms/RecipientDeletionDialog";
import SendMassSMSDialog from "@/views/mass-sms/SendMassSMSDialog";

function messageRule(msg) {
    if (!msg) return true;

    if (msg.length > 160) return 'SMS should contain no more than 160 characters';

    if (msg.length < 5) return 'SMS should contain no less than 5 characters';

    return true;
}

export default {
    name: "Main",
    components: {SendMassSMSDialog, RecipientDeletionDialog, RecipientDisplay},
    data: () => ({
        rules: [v => messageRule(v)],
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