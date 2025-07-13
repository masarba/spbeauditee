import { createRouter, createWebHistory } from "vue-router";
import store from "../store";
import Dashboard from "../views/Dashboard.vue";
import DaftarPertanyaan from "../views/Daftar Pertanyaan.vue";
import Questions from "../views/components/Questions.vue"; // Import Questions.vue
import AdditionalQuestionsPage from "../views/components/AdditionalQuestionsPage.vue"; // Import halaman pertanyaan tambahan
import Billing from "../views/Billing.vue";
import VirtualReality from "../views/VirtualReality.vue";
import RTL from "../views/Rtl.vue";
import Profile from "../views/Profile.vue";
import Signup from "../views/Signup.vue";
import Signin from "../views/Signin.vue";
import ChangePassword from "../views/ChangePassword.vue";
import Setup2FA from "../views/Setup2FA.vue";
import Verify2FA from "../views/Verify2FA.vue";
import PanduanTool from "../views/PanduanTool.vue";

// Utility function to check token expiry
function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error("Invalid token format:", error);
    return null;
  }
}

// Define the routes
const routes = [
  {
    path: "/",
    name: "Home",
    redirect: "/dashboard-default",
  },
  {
    path: "/dashboard-default",
    name: "Dashboard",
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: "/questions",
    name: "Daftar Pertanyaan",
    component: DaftarPertanyaan,
    meta: { requiresAuth: true },
  },
  {
    path: "/questions/:id",
    name: "Questions",
    component: Questions,
    meta: { requiresAuth: true },
    props: true, // Mengaktifkan pengiriman parameter id sebagai props ke komponen
  },
  {
    path: "/additional-questions/:id",
    name: "AdditionalQuestions",
    component: AdditionalQuestionsPage,
    meta: { requiresAuth: true },
    props: true, // Mengaktifkan pengiriman parameter id sebagai props ke komponen
  },
  {
    path: "/panduan-tool",
    name: "Panduan Tool",
    component: PanduanTool,
    meta: { requiresAuth: true },
  },
  {
    path: "/billing",
    name: "Billing",
    component: Billing,
    meta: { requiresAuth: true },
  },
  {
    path: "/virtual-reality",
    name: "Virtual Reality",
    component: VirtualReality,
    meta: { requiresAuth: true },
  },
  {
    path: "/rtl-page",
    name: "RTL",
    component: RTL,
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { requiresAuth: true },
  },
  {
    path: "/signin",
    name: "Signin",
    component: Signin,
    meta: { guest: true },
  },
  {
    path: "/signup",
    name: "Signup",
    component: Signup,
    meta: { guest: true },
  },
  {
    path: "/change-password",
    name: "ChangePassword",
    component: ChangePassword,
    meta: { requiresAuth: true },
  },
  {
    path: "/setup-2fa",
    name: "Setup2FA",
    component: Setup2FA,
    meta: { requiresAuth: true },
  },
  {
    path: "/verify-2fa",
    name: "Verify2FA",
    component: Verify2FA,
    meta: { requiresAuth: true },
  },
];

// Create the router instance
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Navigation guard to check authentication and redirect accordingly
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated;
  const token = store.state.token;
  const is_new_user = store.state.user;

  console.log("Navigating to:", to.name);
  console.log("Is Authenticated:", isAuthenticated);
  console.log("Token:", token);

  if (token) {
    const tokenExpiry = getTokenExpiry(token);
    console.log("Token Expiry:", tokenExpiry);

    // Check if the token is expired
    if (tokenExpiry && tokenExpiry < Date.now()) {
      console.log("Token expired, logging out...");
      store.dispatch("logout").then(() => {
        return next("/signin");
      });
      return;
    }
  }

  // Check for authenticated routes
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log("Not authenticated, redirecting to signin...");
    return next("/signin");
  }

  // Redirect authenticated users from guest routes
  if (to.meta.guest && isAuthenticated) {
    console.log("Already authenticated, redirecting to dashboard...");

    // Check if the user needs to change their password or set up 2FA
    if (is_new_user === 1 || is_new_user === true) {
      console.log("Redirecting to change-password page.");
      return router.push('/change-password'); // Redirect to the change password route
    }

    if (!store.getters.is2FAEnabled) {
      return next("/setup-2fa");
    }

    if (store.state.google2fa_secret) {
      return next("/verify-2fa");
    }

    return next("/dashboard-default");
  }

  // Proceed to the next route
  next();
});

export default router;
