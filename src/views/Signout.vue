<script setup>
import { ref } from "vue";
import { onBeforeUnmount, onBeforeMount } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import axios from "axios";
import Navbar from "@/examples/PageLayout/Navbar.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import { useQuasar } from "quasar";

const body = document.getElementsByTagName("body")[0];
const store = useStore();
const router = useRouter();
const $q = useQuasar(); // Untuk menggunakan notifikasi Quasar
const apiBaseUrl = import.meta.env.VITE_API_URL;
const isLoading = ref(false); // Untuk mengelola status loading

const signOut = async () => {
  try {
    isLoading.value = true; // Mengatur status loading jadi true
    
    // Panggil endpoint logout
    await axios.post("${apiBaseUrl}/api/auth/logout", {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    // Hapus token dari localStorage
    localStorage.removeItem('token');

    // Notifikasi sukses
    $q.notify({
      message: "Logout berhasil!", // Pesan sukses
      type: "positive",
      timeout: 3000,
      textColor: "white",
      position: "top-right"
    });

    // Redirect ke halaman login
    router.push("/login"); // Ganti '/login' dengan path sesuai router Anda
  } catch (error) {
    console.error("Logout failed:", error);

    // Notifikasi error
    $q.notify({
      message: "Logout gagal. Terjadi kesalahan.",
      type: "negative",
      timeout: 3000,
      textColor: "white",
      position: "top-right"
    });
  } finally {
    isLoading.value = false; // Kembali ke status normal setelah logout selesai
  }
};

onBeforeMount(() => {
  store.state.hideConfigButton = true;
  store.state.showNavbar = false;
  store.state.showSidenav = false;
  store.state.showFooter = false;
  body.classList.remove("bg-gray-100");
});

onBeforeUnmount(() => {
  store.state.hideConfigButton = false;
  store.state.showNavbar = true;
  store.state.showSidenav = true;
  store.state.showFooter = true;
  body.classList.add("bg-gray-100");
});
</script>

<template>
  <div class="container top-0 position-sticky z-index-sticky">
    <div class="row">
      <div class="col-12">
        <navbar
          isBlur="blur border-radius-lg my-3 py-2 start-0 end-0 mx-4 shadow"
          v-bind:darkMode="true"
          isBtn="bg-gradient-success"
        />
      </div>
    </div>
  </div>
  <main class="mt-0 main-content">
    <section>
      <div class="page-header min-vh-100">
        <div class="container">
          <div class="row">
            <div class="mx-auto col-xl-4 col-lg-5 col-md-7 d-flex flex-column mx-lg-0">
              <div class="card card-plain">
                <div class="pb-0 card-header text-start">
                  <h4 class="font-weight-bolder">Dashboard</h4>
                  <p class="mb-0">Selamat datang!</p>
                </div>
                <div class="card-body">
                  <div class="text-center">
                    <argon-button
                      class="mt-4"
                      variant="gradient"
                      color="danger"
                      :loading="isLoading"
                      :disabled="isLoading"
                      @click="signOut"
                      >Sign Out</argon-button
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
