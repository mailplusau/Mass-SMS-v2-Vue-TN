<template>
    <v-dialog
        v-model="dialog"
        max-width="400"
    >
        <template v-slot:activator="{ on, attrs }">
            <v-btn :disabled="buttonDisabled" color="success" block large
                   v-bind="attrs" v-on="on">
                Send sms to all recipients
            </v-btn>
        </template>
        <v-card class="background">
            <v-card-title class="text-h5">
                Send Mass SMS?
            </v-card-title>

            <v-card-text>
                An SMS will be sent to all specified recipients. It might take some times for this process to finish.
            </v-card-text>
            <v-card-text>
                Would you like to proceed?
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="red darken-1" text @click="dialog = false">
                    Cancel
                </v-btn>
                <v-btn color="green darken-1" text @click="proceed">
                    Yes, send it
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: "SendMassSMSDialog",
    data: () => ({
        dialog: false,
    }),
    methods: {
        proceed() {
            this.dialog = false;
            this.$store.dispatch('sendMassSMS');
        }
    },
    computed: {
        form() {
            return this.$store.getters['form'];
        },
        buttonDisabled() {
            return !this.form.recipients.length || !this.form.message ||
                this.form.message.length > 1600 || this.form.message.length < 5;
        }
    }
}
</script>

<style scoped>

</style>