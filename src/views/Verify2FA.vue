<template>
  <div class="verify-2fa">
    <h2>Verify 2FA Code</h2>
    <p>Enter the OTP sent to your authenticator app:</p>
    
    <form @submit.prevent="verify2FA">
      <input
        type="text"
        v-model="otp"
        placeholder="Enter OTP"
        required
        maxlength="6"
        pattern="\d{6}"  
      />
      <button type="submit" :disabled="isLoading">
        <span v-if="isLoading">Verifying...</span>
        <span v-else>Verify</span>
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import axios from 'axios';
const apiBaseUrl = import.meta.env.VITE_API_URL;
export default {
  data() {
    return {
      otp: '',
      isLoading: false,
      error: null,
    };
  },
  computed: {
    ...mapState(['token', 'google2fa_secret']), // Assuming google2fa_secret is in the Vuex state
  },
  methods: {
    async verify2FA() {
      this.isLoading = true;
      this.error = null;

      try {
        // Log the values being sent for debugging
        console.log("OTP:", this.otp);
        console.log("Google 2FA Secret:", this.google2fa_secret);

        const payload = {
          otp: this.otp,
          google2fa_secret: this.google2fa_secret || '', // Use empty string if undefined
        };

        console.log("Payload being sent:", payload); // Log the payload

        // Use response to handle success
        const response = await axios.post('${apiBaseUrl}/api/auth/verify-2fa', payload, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        // Handle success response
        this.$store.commit('set2FAEnabled', true); // Update Vuex state
        console.log("Verification successful:", response.data); // Log success response

        // Optionally check a specific property from response.data if needed
        if (response.data && response.data.message) {
          console.log("Server Message:", response.data.message); // Log any message from the server
        }

        this.$router.push('/dashboard-default'); // Redirect to dashboard
        
        // Clear OTP after successful verification
        this.otp = ''; 
      } catch (err) {
        // Handle error response
        this.error = this.getErrorMessage(err);
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
    getErrorMessage(err) {
      if (err.response && err.response.data && err.response.data.message) {
        return err.response.data.message; // Show specific error message
      } else if (err.request) {
        return 'Network error. Please check your connection and try again.';
      } else {
        return 'Invalid OTP. Please try again.'; // Generic error
      }
    },
  },
};
</script>

<style scoped>
.verify-2fa {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.verify-2fa h2 {
  margin-bottom: 10px;
}

.verify-2fa form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.error {
  color: red;
}
</style>
