import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Toast from 'vue-toastification';
import App from './App.vue';
import router from './router';
import './assets/styles/main.scss';
import 'vue-toastification/dist/index.css';

// Enable network monitoring in development
if (import.meta.env.DEV) {
  import('./utils/networkMonitor.js');
}

// Create Vue app
const app = createApp(App);

// Use plugins
app.use(createPinia());
app.use(router);
app.use(Toast, {
  position: 'top-right',
  timeout: 3000,
});

// Mount the app
app.mount('#app');
