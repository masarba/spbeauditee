import { createApp } from "vue"; // Import Vue library
import App from "./App.vue"; // Main App component
import store from "./store"; // Vuex store
import router from "./router"; // Vue Router
import "./assets/css/nucleo-icons.css"; // Custom styles
import "./assets/css/nucleo-svg.css"; // Custom styles
import ArgonDashboard from "./argon-dashboard"; // Dashboard components
import { Quasar, Notify, Loading } from 'quasar'; // Import Quasar components/plugins
import 'quasar/dist/quasar.css'; // Quasar styles
import setupInterceptors from './setupInterceptors'; // Axios interceptor setup

// Set up Axios interceptors globally for handling JWT tokens
setupInterceptors();

// Create Vue app instance
const appInstance = createApp(App);

// Use Vuex store, router, and Argon Dashboard
appInstance.use(store);
appInstance.use(router);
appInstance.use(ArgonDashboard);

// Use Quasar with its plugins (Notify and Loading)
appInstance.use(Quasar, {
  plugins: {
    Notify,    // Quasar Notify plugin for notifications
    Loading    // Quasar Loading plugin for showing loading spinners
  }
});

// Mount the app instance
appInstance.mount("#app");
