<template>
  <div class="container-fluid py-4">
    <!-- Header Section -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card bg-gradient-success">
          <div class="card-body p-4">
            <div class="row">
              <div class="col-lg-8">
                <h1 class="text-white mb-3">Selamat Datang di SPBE-SCAN</h1>
                <p class="text-white opacity-8 mb-0">
                  Sistem Audit Keamanan SPBE (Sistem Pemerintahan Berbasis Elektronik)
                </p>
              </div>
              <div class="col-lg-4 text-end">
                <img src="@/assets/img/logopoltek.png" alt="Logo" class="img-fluid" style="max-height: 100px;" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- About Section -->
    <div class="row mb-4">
      <div class="col-lg-6 mb-lg-0 mb-4">
        <div class="card">
          <div class="card-body p-4">
            <div class="icon icon-lg icon-shape bg-gradient-info shadow-info text-center border-radius-xl mt-n4 position-absolute">
              <i class="ni ni-book-bookmark text-white opacity-10"></i>
            </div>
            <div class="text-end pt-1">
              <p class="text-sm mb-0 text-capitalize">Tentang</p>
              <h4 class="mb-3">Apa itu SPBE-SCAN?</h4>
            </div>
            <hr class="horizontal my-3 dark">
            <div class="d-flex align-items-center">
              <p class="mb-0">
                SPBE-SCAN (Security Compliance and Audit Navigator) adalah sistem informasi yang dirancang khusus untuk melakukan audit keamanan pada Sistem Pemerintahan Berbasis Elektronik (SPBE). Sistem ini memungkinkan pelaksanaan audit keamanan secara sistematis, terstruktur, dan terintegrasi untuk memastikan keamanan layanan SPBE.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-6">
        <div class="card">
          <div class="card-body p-4">
            <div class="icon icon-lg icon-shape bg-gradient-warning shadow-warning text-center border-radius-xl mt-n4 position-absolute">
              <i class="ni ni-bulb-61 text-white opacity-10"></i>
            </div>
            <div class="text-end pt-1">
              <p class="text-sm mb-0 text-capitalize">Latar Belakang</p>
              <h4 class="mb-3">Mengapa SPBE-SCAN?</h4>
            </div>
            <hr class="horizontal my-3 dark">
            <div class="d-flex align-items-center">
              <p class="mb-0">
                SPBE-SCAN(Security Compliance and Audit Navigator) dikembangkan untuk menjawab kebutuhan akan sistem audit keamanan yang komprehensif dalam implementasi SPBE. Sistem ini membantu mengidentifikasi potensi kerentanan, mengevaluasi kontrol keamanan, dan memastikan kepatuhan terhadap standar keamanan SPBE yang berlaku.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-0">
            <h5>Fitur Utama SPBE-SCAN</h5>
          </div>
          <div class="card-body p-3">
            <div class="row">
              <div class="col-lg-3 col-md-6 mb-4">
                <div class="card card-body border-0 shadow-sm">
                  <div class="d-flex align-items-center">
                    <div class="icon icon-shape bg-gradient-primary shadow text-center">
                      <i class="ni ni-check-bold text-white opacity-10"></i>
                    </div>
                    <div class="ms-3">
                      <h6 class="mb-0">Audit Keamanan</h6>
                      <p class="text-sm mb-0">Evaluasi sistematis SPBE</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-lg-3 col-md-6 mb-4">
                <div class="card card-body border-0 shadow-sm">
                  <div class="d-flex align-items-center">
                    <div class="icon icon-shape bg-gradient-success shadow text-center">
                      <i class="ni ni-collection text-white opacity-10"></i>
                    </div>
                    <div class="ms-3">
                      <h6 class="mb-0">Manajemen Risiko</h6>
                      <p class="text-sm mb-0">Identifikasi & mitigasi</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-lg-3 col-md-6 mb-4">
                <div class="card card-body border-0 shadow-sm">
                  <div class="d-flex align-items-center">
                    <div class="icon icon-shape bg-gradient-warning shadow text-center">
                      <i class="ni ni-chart-bar-32 text-white opacity-10"></i>
                    </div>
                    <div class="ms-3">
                      <h6 class="mb-0">Monitoring</h6>
                      <p class="text-sm mb-0">Pemantauan keamanan</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-lg-3 col-md-6 mb-4">
                <div class="card card-body border-0 shadow-sm">
                  <div class="d-flex align-items-center">
                    <div class="icon icon-shape bg-gradient-info shadow text-center">
                      <i class="ni ni-single-copy-04 text-white opacity-10"></i>
                    </div>
                    <div class="ms-3">
                      <h6 class="mb-0">Pelaporan</h6>
                      <p class="text-sm mb-0">Dokumentasi komprehensif</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Password Button -->
    <div class="button-container" v-if="isSignedIn">
      <button @click.prevent="goToChangePassword" class="btn btn-warning">
        Change Password
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

const store = useStore();
const router = useRouter();
const isSignedIn = computed(() => store.getters.isAuthenticated);

const goToChangePassword = () => {
  router.push("/change-password");
};
</script>

<style scoped>
.icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
}

.icon i {
  font-size: 1.25rem;
}

.button-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.card {
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
}

.shadow-sm {
  box-shadow: 0 .125rem .25rem rgba(0,0,0,.075)!important;
}
</style>

