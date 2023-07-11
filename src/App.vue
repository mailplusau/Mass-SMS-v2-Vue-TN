<template>
    <v-app :style="{background: $vuetify.theme.themes[theme].background}">
        <v-main>
            <MassSMSSender />
        </v-main>

        <GlobalNotificationModal />
    </v-app>
</template>

<script>
import MassSMSSender from "@/views/mass-sms/Main";
import GlobalNotificationModal from "@/components/GlobalNotificationModal";

export default {
    name: 'App',
    components: {
        GlobalNotificationModal,
        MassSMSSender,
    },
    created() {
        this.$store.dispatch('init');
    },
    computed:{
        theme(){
            return (this.$vuetify.theme.dark) ? 'dark' : 'light'
        }
    }
};
</script>
