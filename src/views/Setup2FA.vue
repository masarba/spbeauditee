<template>
  <div class="setup-2fa-container">
    <h2>Setup Two-Factor Authentication</h2>
    <p>Scan the QR code below with your authenticator app:</p>

    <!-- QR Code Canvas -->
    <canvas ref="qrCanvas" class="qr-code-canvas"></canvas>

    <!-- Verification Code Input -->
    <div class="verification-input" v-if="secret">
      <input
        v-model="verificationCode"
        type="text"
        placeholder="Enter verification code"
        required
        class="verification-code"
      />
    </div>

    <!-- Verify Button -->
    <div v-if="secret" class="verify-button-container">
      <button @click="verify2FA" class="verify-button">
        Verify 2FA
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import QRious from 'qrious';  // Library for generating QR codes
import { useQuasar } from 'quasar'; // Import Quasar
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const verificationCode = ref('');
const qrCanvas = ref(null);
const secret = ref('');
const $q = useQuasar();
const router = useRouter();
const store = useStore();

onMounted(async () => {
  try {
    const response = await axios.post("${apiBaseUrl}/api/auth/setup-2fa", {}, {
      headers: {
        Authorization: `Bearer ${store.state.token}`,
      },
    });

    secret.value = response.data.secret;
    
    // Generate QR code
    new QRious({
      element: qrCanvas.value,
      value: response.data.qr_code_url,
      size: 200,
    });
  } catch (error) {
    console.error("Error detail:", error.response?.data);
    $q.notify({
      message: "Failed to setup 2FA. Please try again.",
      type: "negative",
      position: "top-right",
    });
  }
});
const verify2FA = async () => {
  try {
    // Basic input validation
    if (!verificationCode.value) {
      $q.notify({
        message: "Please enter the verification code.",
        type: "negative",
        position: "top-right",
      });
      return;
    }

    // Check if the secret is available
    if (!secret.value) {
      $q.notify({
        message: "2FA secret is missing.",
        type: "negative",
        position: "top-right",
      });
      return;
    }

    // Make the API call to verify 2FA
    const response = await axios.post("${apiBaseUrl}/api/auth/verify-2fa", {
      otp: verificationCode.value,
      google2fa_secret: secret.value, // Include the google2fa_secret in the request
    }, {
      headers: {
        Authorization: `Bearer ${store.state.token}`, // Use the token from the store
      },
    });

    if (response.status === 200) {
      $q.notify({
        message: "Two-factor authentication setup successfully!",
        type: "positive",
        position: "top-right",
      });
      router.push("/dashboard-default"); // Redirect to the dashboard
    }
  } catch (error) {
    console.error("Error verifying 2FA:", error);
    const errorMessage = error.response?.data?.message || "Failed to verify 2FA.";
    $q.notify({
      message: errorMessage,
      type: "negative",
      position: "top-right",
    });
  }
};

</script>

<style scoped>
.setup-2fa-container {
  max-width: 400px;
  margin: 50px auto;
  text-align: center;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}

h2 {
  font-size: 24px;
  margin-bottom: 20px;
}

.qr-code-canvas {
  margin: 20px auto;
  display: block;
  border: 1px solid #ccc;
  padding: 10px;
  background-color: white;
}

.verification-input {
  margin-top: 20px;
}

.verification-code {
  padding: 10px;
  width: 100%;
  font-size: 16px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.verify-button-container {
  margin-top: 20px;
}

.verify-button {
  background-color: #28a745;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.verify-button:hover {
  background-color: #218838;
}
</style>
