import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/styles/main.scss';

// Enable network monitoring in development
if (import.meta.env.DEV) {
  import('./utils/networkMonitor.js');
}

// Create Vue app
const app = createApp(App);

// Use plugins
app.use(createPinia());
app.use(router);

// Mount the app
app.mount('#app');
