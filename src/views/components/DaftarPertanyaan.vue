<template>
  <div class="audit-container">
    <!-- Header Section -->
    <div class="header-section mb-5">
      <div class="card bg-gradient-success">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h1 class="text-white mb-3">Daftar Audit SPBE</h1>
              <p class="text-white opacity-8 mb-0">
                Kelola dan pantau proses audit keamanan SPBE Anda
              </p>
            </div>
            <div class="logo-container">
              <img src="@/assets/logopoltek.png" alt="Logo Politeknik SSN" class="header-logo">
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
    <!-- Approved Audits Section -->
      <div class="col-12 mb-4">
        <div class="card">
          <div class="card-header p-3">
            <div class="row">
              <div class="col-8">
                <h5 class="mb-0">
                  <i class="ni ni-check-bold text-success me-2"></i>
                  Audit yang Disetujui
                </h5>
              </div>
              <div class="col-4 text-end">
                <span class="badge bg-gradient-success" v-if="approvedAudits.length">
                  {{ approvedAudits.length }} Audit
                </span>
              </div>
            </div>
          </div>
          <div class="card-body p-3">
            <div v-if="approvedAudits.length" class="table-responsive">
              <table class="table align-items-center mb-0">
        <thead>
          <tr>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Audit ID</th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Detail</th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Status</th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="audit in approvedAudits" :key="audit.id">
                    <td>
                      <div class="d-flex px-2 py-1">
                        <div class="d-flex flex-column justify-content-center">
                          <h6 class="mb-0 text-sm">#{{ audit.id }}</h6>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p class="text-sm font-weight-bold mb-0">{{ audit.details }}</p>
                    </td>
                    <td>
                      <span class="badge badge-sm bg-gradient-success">Disetujui</span>
                    </td>
                    <td class="align-middle text-center">
                      <button @click="navigateToQuestions(audit.id)" class="btn btn-link text-secondary mb-0">
                        <i class="ni ni-curved-next text-lg"></i>
                        Jawab Pertanyaan
                      </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
            <div v-else class="text-center py-4">
              <i class="ni ni-folder-17 text-warning text-lg mb-3 d-block"></i>
              <p class="text-sm text-secondary mb-0">Tidak ada audit yang disetujui saat ini</p>
            </div>
          </div>
        </div>
    </div>

      <!-- Additional Questions Section -->
      <div class="col-12 mb-4">
        <div class="card">
          <div class="card-header p-3">
            <div class="row">
              <div class="col-8">
                <h5 class="mb-0">
                  <i class="ni ni-chat-round text-warning me-2"></i>
                  Audit dengan Pertanyaan Tambahan
                </h5>
              </div>
              <div class="col-4 text-end">
                <span class="badge bg-gradient-warning" v-if="auditsWithAdditionalQuestions.length">
                  {{ auditsWithAdditionalQuestions.length }} Audit
                </span>
              </div>
            </div>
          </div>
          <div class="card-body p-3">
            <div v-if="auditsWithAdditionalQuestions.length" class="table-responsive">
              <table class="table align-items-center mb-0">
        <thead>
          <tr>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Audit ID</th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Pertanyaan Tambahan</th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Auditee</th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="audit in auditsWithAdditionalQuestions" :key="audit.id">
                    <td>
                      <div class="d-flex px-2 py-1">
                        <div class="d-flex flex-column justify-content-center">
                          <h6 class="mb-0 text-sm">#{{ audit.id }}</h6>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p class="text-sm font-weight-bold mb-0">{{ audit.additional_questions }}</p>
                    </td>
                    <td>
                      <p class="text-sm font-weight-bold mb-0">{{ audit.auditee?.username || 'Tidak Diketahui' }}</p>
                    </td>
                    <td class="align-middle text-center">
                      <button @click="navigateToAdditionalQuestions(audit.id)" class="btn btn-link text-secondary mb-0">
                        <i class="ni ni-curved-next text-lg"></i>
                        Jawab Ulang
                      </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
            <div v-else class="text-center py-4">
              <i class="ni ni-chat-round text-warning text-lg mb-3 d-block"></i>
              <p class="text-sm text-secondary mb-0">Tidak ada audit dengan pertanyaan tambahan</p>
            </div>
          </div>
        </div>
    </div>

    <!-- Audit Request Form -->
      <div class="col-12">
        <div class="card">
          <div class="card-header p-3">
            <h5 class="mb-0">
              <i class="ni ni-send text-info me-2"></i>
              Ajukan Audit Baru
            </h5>
          </div>
          <div class="card-body p-3">
            <form @submit.prevent="submitAuditRequest" class="row g-3">
              <div class="col-md-6">
                <label class="form-label">ID Auditor</label>
                <div class="input-group">
                  <span class="input-group-text">
                    <i class="ni ni-single-02"></i>
                  </span>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="auditRequest.auditor_id" 
                    required 
                    placeholder="Masukkan ID Auditor"
                  >
        </div>
        </div>

              <div class="col-md-12">
                <label class="form-label">Unggah NDA</label>
                <div class="input-group">
                  <span class="input-group-text">
                    <i class="ni ni-collection"></i>
                  </span>
                  <input 
                    type="file" 
                    class="form-control" 
                    @change="uploadNDA" 
                    accept=".pdf"
                    required
                  >
        </div>
                <small class="text-muted">Format PDF, maksimal 2MB</small>
                <p v-if="ndaError" class="text-danger small mt-1">{{ ndaError }}</p>
    </div>
    
              <div class="col-12">
                <button type="submit" class="btn bg-gradient-info w-100 mt-4 mb-0">
                  <i class="ni ni-send me-2"></i>
                  Ajukan Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      approvedAudits: [],
      auditsWithAdditionalQuestions: [],
      auditRequest: {
        auditor_id: "",
        ndaFile: null,
      },
      ndaError: null,
    };
  },
  methods: {
    async fetchApprovedAudits() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        this.$router.push("/signin");
        return;
      }

      try {
        // Ambil data user yang sedang login
        const userResponse = await axios.get(
          "https://spbebackend-production.up.railway.app/api/user",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        const currentUserId = userResponse.data.id;

        // Ambil audit yang disetujui untuk user yang login
        const response = await axios.get(
          `https://spbebackend-production.up.railway.app/api/auth/audit-requests/approved/${currentUserId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Pastikan response.data adalah array
        this.approvedAudits = Array.isArray(response.data) ? response.data : [];

        console.log('Approved Audits:', this.approvedAudits); // Untuk debugging
      } catch (error) {
        console.error("Gagal mengambil daftar audit:", error);
        this.$q.notify({
          type: 'negative',
          message: 'Terjadi kesalahan saat mengambil daftar audit',
          position: 'top-right'
        });
      }
    },

    async fetchAuditsWithAdditionalQuestions() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        this.$router.push("/signin");
        return;
      }

      try {
        // Ambil data user yang sedang login
        const userResponse = await axios.get(
          "https://spbebackend-production.up.railway.app/api/user",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        const currentUserId = userResponse.data.id;

        // Ambil audit dengan pertanyaan tambahan yang hanya sesuai dengan user yang login
        const response = await axios.get(
          "https://spbebackend-production.up.railway.app/api/auth/audit-requests/with-additional-questions",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );

        // Filter audit hanya untuk user yang sedang login
        this.auditsWithAdditionalQuestions = response.data.filter(audit => 
          audit.auditee_id === currentUserId || audit.auditee?.id === currentUserId
        );

      } catch (error) {
        console.error("Gagal mengambil daftar audit dengan pertanyaan tambahan:", error);
        this.$q.notify({
          type: 'negative',
          message: 'Terjadi kesalahan saat mengambil daftar audit dengan pertanyaan tambahan',
          position: 'top-right'
        });
      }
    },

    uploadNDA(event) {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.ndaError = "Ukuran file tidak boleh lebih dari 2MB.";
        this.auditRequest.ndaFile = null;
      } else {
        this.ndaError = null;
        this.auditRequest.ndaFile = file;
      }
    },

    async submitAuditRequest() {
      if (!this.auditRequest.ndaFile) {
        this.ndaError = "Silakan unggah file NDA.";
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        this.$router.push("/signin");
        return;
      }

      const formData = new FormData();
      formData.append("auditor_id", this.auditRequest.auditor_id);
      formData.append("nda_document", this.auditRequest.ndaFile);

      try {
        const response = await axios.post(
          "https://spbebackend-production.up.railway.app/api/auth/audit-requests",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.status === 200 || response.status === 201) {
          this.$q.notify({
            type: 'positive',
            message: 'Permintaan audit berhasil diajukan',
            position: 'top-right'
          });
          this.auditRequest.ndaFile = null;
          this.auditRequest.auditor_id = "";
          this.ndaError = "";
          this.fetchApprovedAudits();
        }
      } catch (error) {
        console.error("Gagal mengajukan audit:", error);
        this.$q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Terjadi kesalahan saat mengajukan audit',
          position: 'top-right'
        });
      }
    },

    async navigateToQuestions(Id) {
      if (!Id) {
        console.error("Audit ID tidak valid.");
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        this.$router.push("/signin");
        return;
      }

      try {
        // Cari audit dari data yang sudah ada di approvedAudits
        const approvedAudit = this.approvedAudits.find(audit => audit.id === Id);
        
        // Cari apakah audit memiliki pertanyaan tambahan
        const additionalAudit = this.auditsWithAdditionalQuestions.find(audit => audit.id === Id);
        
        // Simpan audit ID di localStorage supaya dapat diakses di halaman lain
        localStorage.setItem('selected_audit_id', Id);
        // Simpan juga sebagai auditee_id untuk kompatibilitas dengan Questions.vue
        localStorage.setItem('auditee_id', Id);
        
        if (additionalAudit) {
          // Jika audit memiliki pertanyaan tambahan, navigasi ke halaman pertanyaan tambahan
          console.log('Navigasi ke pertanyaan tambahan untuk audit:', Id);
          this.$router.push(`/additional-questions/${Id}`);
        } else if (approvedAudit && approvedAudit.status === 'approved') {
          // Jika audit ditemukan dan statusnya approved, navigasi ke halaman pertanyaan
          console.log('Navigasi ke pertanyaan reguler untuk audit:', Id);
          this.$router.push({ name: "Questions", params: { id: Id } });
        } else {
          this.$q.notify({
            type: 'negative',
            message: 'Audit ini belum disetujui',
            position: 'top-right'
          });
        }
      } catch (error) {
        console.error("Gagal memverifikasi status audit:", error);
        this.$q.notify({
          type: 'negative',
          message: 'Terjadi kesalahan saat memverifikasi status audit',
          position: 'top-right'
        });
      }
    },

    navigateToAdditionalQuestions(auditId) {
      this.$router.push(`/additional-questions/${auditId}`);
    },
  },
  mounted() {
    this.fetchApprovedAudits();
    this.fetchAuditsWithAdditionalQuestions();
  },
};
</script>

<style scoped>
.audit-container {
  padding: 20px;
}

.header-section {
  margin-bottom: 2rem;
}

.card {
  border: 0;
  box-shadow: 0 0 2rem 0 rgba(136, 152, 170, .15);
  border-radius: 1rem;
}

.card .card-header {
  background-color: transparent;
  border-bottom: 1px solid #eee;
}

.table > :not(caption) > * > * {
  padding: 1rem 1rem;
  background-color: transparent;
  border-bottom-width: 1px;
  box-shadow: inset 0 0 0 9999px transparent;
}

.table thead th {
  font-size: 0.65rem;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  border-bottom: 1px solid #e9ecef;
}

.badge {
  padding: 0.5em 0.75em;
  font-size: 0.75em;
}

.input-group-text {
  background-color: transparent;
}

.form-control:focus {
  border-color: #11cdef;
  box-shadow: 0 0 0 2px rgba(17, 205, 239, 0.25);
}

.btn-link {
  text-decoration: none;
}

.text-lg {
  font-size: 1.25rem;
}

.opacity-7 {
  opacity: 0.7;
}

.table-responsive {
  border-radius: 0.5rem;
}

.header-logo {
  height: 80px;
  width: auto;
  object-fit: contain;
}

.logo-container {
  display: flex;
  align-items: center;
  padding-left: 20px;
}

@media (max-width: 768px) {
  .audit-container {
    padding: 10px;
  }
  
  .card-body {
    padding: 1rem;
  }

  .header-logo {
    height: 60px;
  }
}
</style>
