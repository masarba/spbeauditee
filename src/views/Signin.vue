<script setup>
import { ref, onBeforeUnmount, onBeforeMount, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from 'vue-router';
import axios from 'axios'; // Import axios
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonSwitch from "@/components/ArgonSwitch.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import { useQuasar } from "quasar";
import logo from "@/assets/img/logopoltek.png";

const body = document.body; // Shorter and cleaner way to access the body
const store = useStore();

const $q = useQuasar();

const username = ref("");
const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const isLoading = ref(false);
const router = useRouter();

// Tambahkan variable untuk tracking refresh state
let isRefreshing = false;
let failedQueue = [];

const processFailedQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Fungsi untuk setup axios interceptor
const setupAxiosInterceptors = () => {
    // Reset interceptors
    axios.interceptors.response.handlers = [];
    axios.interceptors.request.handlers = [];

    // Request interceptor untuk menambahkan token
    axios.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('access_token');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );
    
    // Response interceptor untuk handle token
    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            
            // Jika bukan error token atau request ke refresh/login/logout, langsung reject
            if (!error.response || 
                ![401].includes(error.response.status) ||
                originalRequest.url.includes('refresh') ||
                originalRequest.url.includes('login') ||
                originalRequest.url.includes('logout') ||
                originalRequest._retry) {
                return Promise.reject(error);
            }

            // Jika sedang refresh, queue request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return axios(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const token = localStorage.getItem('access_token');
                const response = await axios.post('https://spbebackend-production.up.railway.app/api/auth/refresh', {}, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const { access_token } = response.data;
                
                localStorage.setItem('access_token', access_token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
                
                processFailedQueue(null, access_token);
                return axios(originalRequest);

            } catch (refreshError) {
                processFailedQueue(refreshError, null);
                clearAuthData();
                router.push('/signin');
                $q.notify({
                    message: "Sesi Anda telah berakhir. Silakan login kembali.",
                    type: "warning",
                    timeout: 3000,
                    textColor: "white",
                    position: "top-right",
                });
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
    );
};

// Fungsi untuk membersihkan semua data autentikasi
const clearAuthData = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('auditee_id');
    delete axios.defaults.headers.common['Authorization'];
    store.commit('clearLogin');
};

const handleSignIn = async () => {
    try {
        isLoading.value = true;
        clearAuthData();
        
        // Validasi input yang lebih lengkap
        const errors = [];
        if (!username.value) errors.push('Username harus diisi');
        if (!email.value) errors.push('Email harus diisi');
        if (!password.value) errors.push('Password harus diisi');
        
        if (errors.length > 0) {
            errors.forEach(error => {
                $q.notify({
                    type: 'negative',
                    message: error,
                    position: 'top-right',
                    timeout: 2000
                });
            });
            return;
        }

        const response = await axios.post('https://spbebackend-production.up.railway.app/api/auth/login', {
            username: username.value,
            email: email.value,
            password: password.value
        });

        const { 
            access_token, 
            role, 
            google2fa_secret, 
            redirect_to,
            auditee_id,
            token_type = 'Bearer'
        } = response.data;

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `${token_type} ${access_token}`;

        // Simpan data ke localStorage
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('role', role);
        if (auditee_id) {
            localStorage.setItem('auditee_id', auditee_id);
        }

        // Update store
        store.commit('setLogin', { 
            access_token, 
            role, 
            google2fa_secret,
            auditee_id 
        });

        // Reset form
        username.value = '';
        email.value = '';
        password.value = '';
        rememberMe.value = false;

        // Notifikasi sukses
        $q.notify({
            type: 'positive',
            message: 'Login berhasil',
            position: 'top-right',
            timeout: 3000,
            textColor: "white",
            actions: [{ label: 'OK', color: 'white' }],
            icon: false,
        });

        // Handle redirect
        if (redirect_to) {
            router.push(redirect_to);
        } else {
            router.push('/dashboard');
        }

    } catch (error) {
        let errorMessage = 'Terjadi kesalahan saat login';
        
        if (error.response) {
            if (error.response.status === 401) {
                errorMessage = 'Username, email atau password salah';
            } else if (error.response.data) {
                if (error.response.data.errors) {
                    // Handle validation errors
                    Object.values(error.response.data.errors).forEach(errors => {
                        errors.forEach(error => {
                            $q.notify({
                                type: 'negative',
                                message: error,
                                position: 'top-right',
                                timeout: 2000
                            });
                        });
                    });
                    return;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }
        }
        
        $q.notify({
            type: 'negative',
            message: errorMessage,
            position: 'top-right',
            timeout: 2000
        });
        
        clearAuthData();
    } finally {
        isLoading.value = false;
    }
};

// Lifecycle hooks
onMounted(() => {
    setupAxiosInterceptors();
});

onBeforeMount(() => {
    store.state.hideConfigButton = true;
    store.state.showNavbar = false;
    store.state.showSidenav = false;
    store.state.showFooter = false;
    body.classList.remove("bg-gray-100");
    // Hapus clearAuthData() dari sini karena tidak perlu membersihkan data saat mounting
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
  <main class="mt-0 main-content">
    <section>
      <div class="page-header min-vh-100">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-xl-4 col-lg-5 col-md-7">
              <div class="card card-plain" style="box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div class="pb-0 card-header text-center">
                  <img :src="logo" alt="Logo Politeknik" class="mb-3" style="max-height: 80px; width: auto;" />
                  <h4 class="font-weight-bolder">SPBE-SCAN</h4>
                  <p class="mb-0">Masukkan username, email dan password untuk login</p>
                </div>
                <div class="card-body">
                  <form @submit.prevent="handleSignIn" class="needs-validation">
                    <div class="mb-3">
                      <ArgonInput
                        v-model="username"
                        id="username"
                        type="text"
                        placeholder="Username"
                        name="username"
                        size="lg"
                        required
                        :class="{ 'is-invalid': !username && isLoading }"
                      />
                      <div class="invalid-feedback" v-if="!username && isLoading">
                        Username harus diisi
                      </div>
                    </div>
                    <div class="mb-3">
                      <ArgonInput
                        v-model="email"
                        id="email"
                        type="email"
                        placeholder="Email"
                        name="email"
                        size="lg"
                        required
                        :class="{ 'is-invalid': !email && isLoading }"
                      />
                      <div class="invalid-feedback" v-if="!email && isLoading">
                        Email harus diisi
                      </div>
                    </div>
                    <div class="mb-3">
                      <ArgonInput
                        v-model="password"
                        id="password"
                        type="password"
                        placeholder="Password"
                        name="password"
                        size="lg"
                        required
                        :class="{ 'is-invalid': !password && isLoading }"
                      />
                      <div class="invalid-feedback" v-if="!password && isLoading">
                        Password harus diisi
                      </div>
                    </div>
                    <ArgonSwitch
                      v-model="rememberMe"
                      id="rememberMe"
                      name="remember-me"
                    >Ingat saya</ArgonSwitch>
                    <div class="text-center">
                      <ArgonButton
                        class="mt-4"
                        variant="gradient"
                        color="success"
                        :loading="isLoading"
                        :disabled="isLoading"
                        size="lg"
                        type="submit"
                      >{{ isLoading ? 'Sedang Login...' : 'Login' }}</ArgonButton>
                    </div>
                  </form>
                </div>
                <div class="px-1 pt-0 text-center card-footer px-lg-2">
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>


