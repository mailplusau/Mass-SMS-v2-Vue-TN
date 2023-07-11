<template>
    <v-app :style="{background: $vuetify.theme.themes[theme].background}">
        <v-main>
            <MassSMSSender />
        </v-main>
    </v-app>
</template>

<script>
import MassSMSSender from "@/views/mass-sms/Main";

export default {
    name: 'App',
    components: {
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
