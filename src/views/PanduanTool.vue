<script setup>
import { onMounted } from "vue";
import { useStore } from "vuex";

const store = useStore();

onMounted(() => {
  store.state.isAbsolute = false;
  store.state.showNavbar = true;
  store.state.showSidenav = true;
  store.state.showFooter = true;
  store.state.hideConfigButton = true;
  store.state.showBreadcrumbs = false;
});
</script>

<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-11">
        <div class="card mb-4">
          <div class="card-header pb-0 p-3">
            <div class="d-flex align-items-center">
              <i class="ni ni-book-bookmark text-success text-lg me-2"></i>
              <h6 class="mb-0">Panduan Penggunaan Tool</h6>
            </div>
          </div>
          <div class="card-body p-3">
            <!-- Pengertian Tool -->
            <div class="mb-4">
              <div class="d-flex align-items-center mb-3">
                <div class="icon icon-shape icon-sm bg-gradient-success shadow text-center border-radius-md">
                  <i class="ni ni-single-copy-04 text-white opacity-10"></i>
                </div>
                <h5 class="mb-0 ms-3">Pengertian Tool</h5>
              </div>
              <div class="card bg-gradient-success">
                <div class="card-body">
                  <p class="text-white mb-0">
                    Tool adalah alat bantu yang digunakan untuk memudahkan proses audit dan evaluasi. 
                    Tool ini dirancang untuk membantu auditor dalam mengumpulkan, menganalisis, dan 
                    menyajikan data secara sistematis dan terstruktur.
                  </p>
                </div>
              </div>
            </div>

            <!-- Tata Cara Penggunaan -->
            <div class="mb-4">
              <div class="d-flex align-items-center mb-3">
                <div class="icon icon-shape icon-sm bg-gradient-warning shadow text-center border-radius-md">
                  <i class="ni ni-settings text-white opacity-10"></i>
                </div>
                <h5 class="mb-0 ms-3">Tata Cara Penggunaan</h5>
              </div>
              <div class="row">
                <div class="col-md-6 mb-4">
                  <div class="card h-100">
                    <div class="card-body">
                      <div class="d-flex align-items-center mb-3">
                        <div class="icon icon-shape icon-sm bg-gradient-warning shadow text-center border-radius-md me-3">
                          <i class="ni ni-circle-08 text-white opacity-10"></i>
                        </div>
                        <h6 class="mb-0">Memulai Audit</h6>
                      </div>
                      <ul class="list-unstyled mb-0">
                        <li class="mb-2">
                          <i class="ni ni-check-bold text-success me-2"></i>
                          Login ke sistem menggunakan akun yang telah terdaftar
                        </li>
                        <li class="mb-2">
                          <i class="ni ni-check-bold text-success me-2"></i>
                          Pilih menu "Daftar Pertanyaan" untuk memulai proses audit
                        </li>
                        <li>
                          <i class="ni ni-check-bold text-success me-2"></i>
                          Isi informasi dasar audit seperti nama auditee dan periode audit
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 mb-4">
                  <div class="card h-100">
                    <div class="card-body">
                      <div class="d-flex align-items-center mb-3">
                        <div class="icon icon-shape icon-sm bg-gradient-warning shadow text-center border-radius-md me-3">
                          <i class="ni ni-single-copy-04 text-white opacity-10"></i>
                        </div>
                        <h6 class="mb-0">Mengisi Kuesioner</h6>
                      </div>
                      <ul class="list-unstyled mb-0">
                        <li class="mb-2">
                          <i class="ni ni-check-bold text-success me-2"></i>
                          Jawab setiap pertanyaan dengan teliti dan objektif
                        </li>
                        <li class="mb-2">
                          <i class="ni ni-check-bold text-success me-2"></i>
                          Lampirkan bukti pendukung jika diperlukan
                        </li>
                        <li>
                          <i class="ni ni-check-bold text-success me-2"></i>
                          Gunakan kolom catatan untuk memberikan penjelasan tambahan
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 mb-4">
                  <div class="card h-100">
                    <div class="card-body">
                      <div class="d-flex align-items-center mb-3">
                        <div class="icon icon-shape icon-sm bg-gradient-warning shadow text-center border-radius-md me-3">
                          <i class="ni ni-send text-white opacity-10"></i>
                        </div>
                        <h6 class="mb-0">Menyimpan dan Mengirim</h6>
                      </div>
                      <ul class="list-unstyled mb-0">
                        <li class="mb-2">
                          <i class="ni ni-check-bold text-success me-2"></i>
                          Simpan jawaban secara berkala untuk menghindari kehilangan data
                        </li>
                        <li class="mb-2">
                          <i class="ni ni-check-bold text-success me-2"></i>
                          Periksa kembali semua jawaban sebelum mengirim
                        </li>
                        <li>
                          <i class="ni ni-check-bold text-success me-2"></i>
                          Klik tombol "Kirim" untuk menyelesaikan proses audit
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 mb-4">
                  <div class="card h-100">
                    <div class="card-body">
                      <div class="d-flex align-items-center mb-3">
                        <div class="icon icon-shape icon-sm bg-gradient-warning shadow text-center border-radius-md me-3">
                          <i class="ni ni-chart-bar-32 text-white opacity-10"></i>
                        </div>
                        <h6 class="mb-0">Melihat Hasil</h6>
                      </div>
                      <ul class="list-unstyled mb-0">
                        <li class="mb-2">
                          <i class="ni ni-check-bold text-success me-2"></i>
                          Setelah audit selesai, hasil dapat dilihat di dashboard
                        </li>
                        <li class="mb-2">
                          <i class="ni ni-check-bold text-success me-2"></i>
                          Download laporan dalam format yang tersedia
                        </li>
                        <li>
                          <i class="ni ni-check-bold text-success me-2"></i>
                          Analisis hasil untuk perbaikan berkelanjutan
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tips Penggunaan -->
            <div class="mb-3">
              <div class="d-flex align-items-center mb-3">
                <div class="icon icon-shape icon-sm bg-gradient-info shadow text-center border-radius-md">
                  <i class="ni ni-light-bulb text-white opacity-10"></i>
                </div>
                <h5 class="mb-0 ms-3">Tips Penggunaan</h5>
              </div>
              <div class="card bg-gradient-info">
                <div class="card-body">
                  <ul class="list-unstyled mb-0">
                    <li class="mb-3">
                      <i class="ni ni-check-bold text-white me-2"></i>
                      Pastikan koneksi internet stabil saat menggunakan tool
                    </li>
                    <li class="mb-3">
                      <i class="ni ni-check-bold text-white me-2"></i>
                      Gunakan browser yang kompatibel (Chrome, Firefox, atau Edge terbaru)
                    </li>
                    <li class="mb-3">
                      <i class="ni ni-check-bold text-white me-2"></i>
                      Simpan data secara berkala untuk menghindari kehilangan informasi
                    </li>
                    <li>
                      <i class="ni ni-check-bold text-white me-2"></i>
                      Hubungi administrator jika mengalami kendala teknis
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 