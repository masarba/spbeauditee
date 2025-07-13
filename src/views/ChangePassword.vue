<template>
  <div class="change-password-container">
    <div class="form-container">
      <h2>Change Password</h2>
      <form @submit.prevent="handleChangePassword">
        <div class="form-group">
          <input
            type="password"
            v-model="newPassword"
            placeholder="New Password"
            required
          />
        </div>
        <div class="form-group">
          <input
            type="password"
            v-model="confirmPassword"
            placeholder="Confirm New Password"
            required
          />
        </div>
        <button type="submit" :disabled="isLoading">
          Change Password
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeMount, onBeforeUnmount } from "vue";
import { useStore } from "vuex";
import axios from "axios";

const store = useStore();

const newPassword = ref("");
const confirmPassword = ref("");
const isLoading = ref(false);

const handleChangePassword = async () => {
  // Cek apakah token tersedia
  if (!store.state.token) {
      alert("You are not logged in.");
      return this.$router.push('/login'); // Redirect to login page
  }

  // Check if the new passwords match
  if (newPassword.value !== confirmPassword.value) {
      alert("Passwords do not match!");
      return;
  }

  try {
      isLoading.value = true;
      console.log("Current token:", store.state.token); // Debug token

      // Send change password request with password confirmation
      await axios.post("${apiBaseUrl}/api/auth/change-password", {
          password: newPassword.value,
          password_confirmation: confirmPassword.value, // Include confirmation password
      }, {
          headers: {
              Authorization: `Bearer ${store.state.token}`, // Use token from Vuex store
          },
      });

      alert("Password changed successfully!");
  } catch (error) {
      // Improved error handling
      if (error.response) {
          console.error("Error response:", error.response.data);
          alert(`Error: ${error.response.data.message || "Failed to change password."}`);
      } else {
          console.error("Error:", error);
          alert("Failed to change password. Please try again.");
      }
  } finally {
      isLoading.value = false;
  }
};



onBeforeMount(() => {
  store.state.showSidenav = false; // Hide the sidebar
});

onBeforeUnmount(() => {
  store.state.showSidenav = true; // Show the sidebar again when leaving this page
});
</script>

<style scoped>
.change-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh; /* Full viewport height */
  background-color: #f5f5f5; /* Optional: background color */
}

.form-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc; /* Disabled button color */
}
</style>
