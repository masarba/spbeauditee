import { createStore } from "vuex";
import axios from "axios"; // Import axios
export default createStore({
  state: {
    hideConfigButton: false,
    isPinned: false,
    showConfig: false,
    sidebarType: "bg-white",
    isRTL: false,
    mcolor: "",
    darkMode: false,
    isNavFixed: false,
    isAbsolute: false,
    showNavs: true,
    showSidenav: true,
    showNavbar: true,
    showFooter: true,
    showMain: true,
    isLoggedIn: !!localStorage.getItem("access_token"), // Check if token exists
    token: localStorage.getItem("access_token"), // Load token from localStorage
    google2fa_secret: localStorage.getItem("google2fa_secret") || null,
    role: localStorage.getItem("role") || null, // Load role from localStorage
    isPasswordChanged: false, // Track if password has been changed
    is2FAEnabled: false, // Track if 2FA is enabled
  },
  mutations: {
    toggleConfigurator(state) {
      state.showConfig = !state.showConfig;
    },
    sidebarMinimize(state) {
      let sidenav_show = document.querySelector("#app");
      if (state.isPinned) {
        sidenav_show.classList.add("g-sidenav-hidden");
        sidenav_show.classList.remove("g-sidenav-pinned");
        state.isPinned = false;
      } else {
        sidenav_show.classList.add("g-sidenav-pinned");
        sidenav_show.classList.remove("g-sidenav-hidden");
        state.isPinned = true;
      }
    },
    sidebarType(state, payload) {
      state.sidebarType = payload;
    },
    navbarFixed(state) {
      state.isNavFixed = !state.isNavFixed;
    },
    setLogin(state, { access_token, role, google2fa_secret }) {
      state.isLoggedIn = true;
      state.token = access_token;
      state.role = role;
      state.google2fa_secret = google2fa_secret; 
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("role", role);
      if (google2fa_secret) {
        localStorage.setItem("google2fa_secret", google2fa_secret); // Save 2FA secret to localStorage
      }
    },
    logout(state) {
      state.isLoggedIn = false; // Set login status to false
      state.token = null; // Clear JWT token
      state.role = null; // Clear role
      state.google2fa_secret = null;
      localStorage.removeItem("access_token"); // Remove token from localStorage
      localStorage.removeItem("role"); // Remove role from localStorage
      localStorage.removeItem("google2fa_secret");
    },
    setPasswordChanged(state, value) {
      state.isPasswordChanged = value; // Set password change status
    },
    set2FAEnabled(state, value) {
      state.is2FAEnabled = value; // Set 2FA enable status
    },
  },
  actions: {
    async login({ commit }, { username, email, password }) {
      try {
          const response = await axios.post("${apiBaseUrl}/api/auth/login", { username, email, password });
  
          // Check if the response has the required fields
          if (response.data.access_token) {
              const { access_token, role, google2fa_secret, is_new_user } = response.data;
  
              // Commit the mutation with the received token and role
              commit("setLogin", { access_token, role, google2fa_secret });
  
              // Return the new user status if needed
              return is_new_user; // Return is_new_user for further handling if needed
          } else {
              throw new Error("Login failed: No token received.");
          }
      } catch (error) {
          console.error("Login action error:", error.response?.data || error.message);
          throw new Error(error.response?.data?.message || "An error occurred during login.");
      }
  },
  
    
    logout({ commit }) {
      commit("logout"); // Commit logout mutation
    },
    toggleSidebarColor({ commit }, payload) {
      commit("sidebarType", payload); // Commit sidebar type mutation
    },
    async changePassword({ commit }, { newPassword }) {
      // Implement password change logic here
      // For example, you can make an API call to change the password
      try {
        const response = await axios.post("${apiBaseUrl}/api/auth/change-password", {
          password: newPassword,
        });
        commit("setPasswordChanged", true); // Update the state
        return response.data; // Return response for further handling
      } catch (error) {
        console.error("Password change error:", error);
        throw error; // Re-throw error for handling in the component
      }
    },
    
    async verify2FA({ commit, state }, { otp }) {
      try {
        const google2fa_secret = state.google2fa_secret;
        const response = await axios.post("${apiBaseUrl}/api/auth/verify-2fa", {
          otp,
          google2fa_secret,
        });
        
        // Assuming the response indicates success
        commit("set2FAEnabled", true); // Update state to indicate 2FA is enabled
        return response.data; // Return response for further handling
      } catch (error) {
        console.error("Verify 2FA error:", error);
        throw error; // Re-throw error for handling in the component
      }
    }
  },
  getters: {
    isAuthenticated: (state) => state.isLoggedIn, // Return login status
    userRole: (state) => state.role, // Return the role of the user
    isAdmin: (state) => state.role === "admin", // Check if user is admin
    isUser: (state) => state.role === "user", // Check if user is a regular user
    isPasswordChanged: (state) => state.isPasswordChanged, // Check if password has been changed
    is2FAEnabled: (state) => state.is2FAEnabled, // Check if 2FA is enabled
    hasGoogle2FASecret: (state) => !!state.google2fa_secret,
  },
});
