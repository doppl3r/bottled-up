import { createApp } from 'vue'
import { i18n } from './i18n.js';
import App from '../vue/App.vue'

const app = createApp(App);
app.use(i18n);
app.mount('#app');