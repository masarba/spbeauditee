<template>
  <div class="additional-questions-container">
    <h1 class="page-title">Pertanyaan Tambahan Audit</h1>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Memuat data audit...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="hasError" class="error-container">
      <p class="error-message">{{ errorMessage }}</p>
      <button @click="fetchData" class="retry-btn">
        Coba Lagi
      </button>
    </div>

    <div v-else class="content-container">
      <!-- Header dengan info audit -->
      <div class="audit-info-card">
        <div class="audit-header">
          <h2>Audit #{{ auditId }}</h2>
          <div class="audit-status">
            <span class="badge bg-gradient-success">Disetujui</span>
          </div>
        </div>
        <div class="audit-details">
          <p>{{ auditDetails }}</p>
        </div>
      </div>

      <!-- Ringkasan hasil audit sebelumnya -->
      <div class="previous-results-card" v-if="hasResults">
        <h3>Hasil Audit Sebelumnya</h3>
        
        <!-- Tampilkan skor hanya jika ada skor nyata -->
        <div class="total-score" v-if="totalScore > 0">
          <div class="score-circle">{{ totalScore }}%</div>
          <p>Total Skor</p>
        </div>
        
        <!-- Tampilkan kategori hanya jika ada -->
        <div class="category-scores" v-if="categoryScores && categoryScores.length > 0">
          <h4>Skor per Kategori</h4>
          <div class="category-scores-grid">
            <div v-for="(category, index) in categoryScores" 
                 :key="index"
                 class="category-score-item">
              <div class="category-name">{{ category.category }}</div>
              <div class="score-bar-container">
                <div class="score-bar" :style="{ width: category.score + '%', backgroundColor: getScoreColor(category.score) }"></div>
              </div>
              <div class="score-value">{{ category.score }}%</div>
            </div>
          </div>
        </div>
        
        <!-- Pesan ketika skor tidak tersedia tapi hasil bisa diunduh -->
        <div class="no-score-message" v-if="totalScore === 0">
          <i class="ni ni-notification-70"></i>
          <p>Hasil audit sebelumnya</p>
        </div>

        <!-- Tombol Download Hasil Audit (selalu ditampilkan jika hasResults=true) -->
        <div class="download-result-section">
          <button @click="downloadAuditResult" class="download-result-btn" :disabled="isDownloading">
            <i class="ni ni-cloud-download-95 me-2"></i>
            {{ isDownloading ? 'Mengunduh...' : 'Download Hasil Audit' }}
          </button>
          <p class="download-hint">Klik tombol di atas untuk mengunduh hasil audit sebelumnya dalam format PDF</p>
        </div>
      </div>

      <!-- Pesan jika hasil audit tidak tersedia -->
      <div class="previous-results-card no-results" v-else>
        <h3>Hasil Audit Sebelumnya</h3>
        <div class="no-results-message">
          <i class="ni ni-notification-70"></i>
          <p>Hasil audit sebelumnya tidak tersedia.</p>
        </div>
      </div>

      <!-- Riwayat pertanyaan dan jawaban sebelumnya -->
      <div v-if="previousQuestions.length > 0" class="previous-qa-card">
        <h3>
          <i class="ni ni-check-bold me-2"></i>Riwayat Pertanyaan dan Jawaban
          <button @click="confirmClearHistory" class="clear-history-btn">
            <i class="ni ni-fat-delete me-1"></i>
            Hapus Riwayat
          </button>
        </h3>
        <div class="history-scroll-container">
          <div v-for="(questions, historyIndex) in previousQuestions" :key="historyIndex" class="history-item">
            <div class="history-header">
              <span class="session-badge">Sesi #{{ historyIndex + 1 }}</span>
            </div>
            <div class="history-content">
              <div v-for="(question, qIndex) in questions" :key="qIndex" class="history-qa-item">
                <div class="history-question">
                  <div class="question-number">P{{ qIndex + 1 }}</div>
                  <div class="question-text">{{ question }}</div>
                </div>
                <div class="history-answer">
                  <div class="answer-label">Jawaban:</div>
                  <div class="answer-text">{{ previousAnswers[historyIndex][qIndex] || 'Tidak ada jawaban' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pertanyaan tambahan dari auditor -->
      <div class="additional-questions-card">
        <h3>Pertanyaan Tambahan dari Auditor</h3>
        <div class="questions-list">
          <div v-for="(question, index) in additionalQuestions" :key="index" class="question-item">
            <div class="question-content">
              <p class="question-number">{{ index + 1 }}.</p>
              <p class="question-text">{{ question }}</p>
            </div>
            <div class="answer-area">
              <textarea 
                v-model="additionalAnswers[index]" 
                :placeholder="`Jawaban untuk pertanyaan ${index + 1}...`"
                class="answer-input"
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit and Cancel buttons -->
      <div class="action-buttons">
        <button @click="goBack" class="cancel-btn">
          <i class="ni ni-bold-left me-2"></i>
          Kembali
        </button>
        <button @click="submitAnswers" class="submit-btn" :disabled="isSending">
          <i class="ni ni-send me-2"></i>
          {{ isSending ? 'Mengirim...' : 'Kirim Jawaban' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      // Ambil ID audit dari params URL atau localStorage sebagai fallback
      auditId: this.$route.params.id || localStorage.getItem('selected_audit_id'),
      auditDetails: '',
      additionalQuestions: [],
      additionalAnswers: [],
      totalScore: 0,
      categoryScores: [],
      hasResults: false,
      isLoading: true,
      hasError: false,
      errorMessage: '',
      isSending: false,
      previousAuditFile: null,
      previousAuditFileUrl: null,
      previousAuditFileDate: null,
      isDownloading: false,
      // Data untuk menyimpan riwayat jawaban
      previousQuestions: [],
      previousAnswers: []
    };
  },
  methods: {
    // Get valid token
    getValidToken() {
      const token = localStorage.getItem('access_token');
      if (!token) {
        this.handleSessionExpired();
        return null;
      }
      return token;
    },

    // Handle session expiry
    handleSessionExpired() {
      localStorage.removeItem('access_token');
      this.hasError = true;
      this.errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
      this.$router.push('/login');
    },

    // Fetch audit data and previous results
    async fetchData() {
      this.isLoading = true;
      this.hasError = false;
      this.errorMessage = '';

      // Validasi auditId
      if (!this.auditId || this.auditId === 'null' || this.auditId === 'undefined') {
        console.error('Tidak ada audit ID yang valid');
        this.hasError = true;
        this.errorMessage = 'Tidak dapat menemukan ID audit. Silakan kembali ke halaman sebelumnya.';
        this.isLoading = false;
        return;
      }

      // Simpan auditId ke localStorage untuk referensi di masa mendatang
      localStorage.setItem('selected_audit_id', this.auditId);

      const token = this.getValidToken();
      if (!token) return;

      console.log('Fetching data for audit ID:', this.auditId);

      try {
        // Fetch audit data with additional questions first
        const questionsResponse = await axios.get(
          `${apiBaseUrl}/api/auth/audit-requests/with-additional-questions`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        console.log('Response from with-additional-questions:', questionsResponse.data);

        const auditData = questionsResponse.data.find(
          item => item.id === parseInt(this.auditId)
        );

        if (auditData) {
          console.log('Found audit data:', auditData);
          this.auditDetails = auditData.details || 'Tidak ada detail';
          
          if (auditData.additional_questions) {
            // Simpan pertanyaan saat ini
            const currentQuestions = auditData.additional_questions.split('\n');
            
            // Ambil data jawaban yang disimpan di localStorage
            this.loadPreviousQuestionsAndAnswers();
            
            // Cek apakah pertanyaan sekarang berbeda dengan pertanyaan sebelumnya
            const newQuestions = this.areNewQuestionsAvailable(currentQuestions);
            
            if (newQuestions) {
              console.log('Ada pertanyaan baru dari auditor');
              
              // Simpan pertanyaan dan jawaban sebelumnya
              if (this.additionalQuestions.length > 0) {
                this.savePreviousQuestionsAndAnswers();
              }
              
              // Update pertanyaan dengan yang baru
              this.additionalQuestions = currentQuestions;
              this.additionalAnswers = currentQuestions.map(() => '');
            } else {
              console.log('Pertanyaan sama dengan sebelumnya');
              // Tetap pakai pertanyaan yang sekarang
              this.additionalQuestions = currentQuestions;
              // Muat jawaban yang tersimpan di localStorage
              this.loadSavedAnswers();
            }
          } else {
            this.hasError = true;
            this.errorMessage = 'Tidak ada pertanyaan tambahan untuk audit ini.';
          }
        } else {
          console.error('Audit request not found in with-additional-questions response');
          // Try to get audit by direct ID call as fallback
          try {
            const directResponse = await axios.get(
              `${apiBaseUrl}/api/auth/audit-requests/${this.auditId}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            
            if (directResponse.data) {
              console.log('Found audit data via direct call:', directResponse.data);
              this.auditDetails = directResponse.data.details || 'Tidak ada detail';
              
              if (directResponse.data.additional_questions) {
                const currentQuestions = directResponse.data.additional_questions.split('\n');
                // Process questions as before
                this.loadPreviousQuestionsAndAnswers();
                const newQuestions = this.areNewQuestionsAvailable(currentQuestions);
                
                if (newQuestions) {
                  console.log('Ada pertanyaan baru dari auditor');
                  if (this.additionalQuestions.length > 0) {
                    this.savePreviousQuestionsAndAnswers();
                  }
                  this.additionalQuestions = currentQuestions;
                  this.additionalAnswers = currentQuestions.map(() => '');
                } else {
                  console.log('Pertanyaan sama dengan sebelumnya');
                  this.additionalQuestions = currentQuestions;
                  this.loadSavedAnswers();
                }
              } else {
                this.hasError = true;
                this.errorMessage = 'Tidak ada pertanyaan tambahan untuk audit ini.';
              }
            } else {
              throw new Error('Data audit tidak ditemukan');
            }
          } catch (directError) {
            console.error('Error on direct audit request:', directError);
            throw new Error('Data audit tidak ditemukan');
          }
        }

        // Try to fetch previous audit results using alternative endpoints
        await this.fetchPreviousAuditResults();
      } catch (error) {
        console.error('Error fetching data:', error);
        this.hasError = true;
        
        if (error.response) {
          if (error.response.status === 401) {
            this.handleSessionExpired();
          } else if (error.response.status === 404) {
            this.errorMessage = 'Data audit tidak ditemukan.';
          } else {
            this.errorMessage = error.response.data?.message || 'Terjadi kesalahan saat mengambil data.';
          }
        } else if (error.request) {
          this.errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        } else {
          this.errorMessage = error.message || 'Gagal mengambil data. Silakan coba lagi.';
        }
      } finally {
        this.isLoading = false;
      }
    },

    // Method untuk mendapatkan nama file dari path lengkap
    getFileName(filePath) {
      if (!filePath) return '';
      const parts = filePath.split('/');
      return parts[parts.length - 1];
    },
    
    // Method untuk memformat tanggal
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    // Method untuk mengunduh file hasil audit sebelumnya
    async downloadPreviousAudit() {
      if (!this.previousAuditFile) return;
      
      const token = this.getValidToken();
      if (!token) return;
      
      try {
        const response = await axios.get(
          `${apiBaseUrl}/api/auth/download-audit-file/${this.auditId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            responseType: 'blob'
          }
        );
        
        // Buat URL untuk file dan mulai unduhan
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', this.getFileName(this.previousAuditFile));
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
      } catch (error) {
        console.error('Error downloading file:', error);
        alert('Terjadi kesalahan saat mengunduh file. Silakan coba lagi.');
      }
    },

    // Method untuk mengambil hasil audit sebelumnya dari beberapa endpoint
    async fetchPreviousAuditResults() {
      // Validasi auditId
      if (!this.auditId || this.auditId === 'null' || this.auditId === 'undefined') {
        console.error('Tidak dapat mengambil hasil audit sebelumnya: ID audit tidak valid');
        this.totalScore = 0;
        this.categoryScores = [];
        this.hasResults = false;
        return;
      }

      const token = this.getValidToken();
      if (!token) return;

      try {
        console.log('Mencoba mengambil hasil audit untuk ID:', this.auditId);
        
        // Coba endpoint audit-requests/answered
        try {
          const answeredResponse = await axios.get(
            `${apiBaseUrl}/api/auth/audit-requests/answered`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          console.log('Response dari endpoint answered:', answeredResponse.data);

          if (answeredResponse.data && Array.isArray(answeredResponse.data)) {
            // Cari audit dengan ID yang sesuai
            const auditResult = answeredResponse.data.find(
              item => item.id === parseInt(this.auditId)
            );

            if (auditResult) {
              console.log('Data audit ditemukan:', auditResult);
              
              // Ambil hasil audit dari data yang ditemukan
              this.totalScore = auditResult.score || 0;
              
              // Buat array categoryScores dari data yang tersedia
              if (auditResult.category_scores) {
                // Jika data sudah dalam format yang sesuai
                this.categoryScores = auditResult.category_scores;
              } else if (auditResult.results) {
                // Jika data dalam format berbeda, konversi ke format yang diperlukan
                this.categoryScores = Object.entries(auditResult.results).map(([category, score]) => ({
                  category: category,
                  score: parseFloat(score)
                }));
              } else {
                this.categoryScores = [];
              }
              
              this.hasResults = true;
              console.log('Berhasil mendapatkan hasil audit dari endpoint audit-requests/answered');
              return;
            }
          }
        } catch (error) {
          console.log('Gagal mendapatkan hasil dari endpoint audit-requests/answered:', error);
        }

        // Coba endpoint audit-results/{id}
        try {
          const resultsResponse = await axios.get(
            `${apiBaseUrl}/api/auth/audit-results/${this.auditId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (resultsResponse.data) {
            console.log('Data dari audit-results:', resultsResponse.data);
            this.totalScore = resultsResponse.data.totalScore || 0;
            this.categoryScores = resultsResponse.data.categoryScores || [];
            this.hasResults = true;
            console.log('Berhasil mendapatkan hasil audit dari endpoint audit-results');
            return;
          }
        } catch (error) {
          console.log('Gagal mendapatkan hasil dari endpoint audit-results:', error);
        }

        // Coba endpoint audit/{id}
        try {
          const auditResponse = await axios.get(
            `${apiBaseUrl}/api/auth/audit/${this.auditId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (auditResponse.data) {
            console.log('Data dari audit endpoint:', auditResponse.data);
            const auditData = auditResponse.data;
            
            if (auditData.score || auditData.results) {
              this.totalScore = auditData.score || 0;
              
              if (auditData.results) {
                this.categoryScores = Object.entries(auditData.results).map(([category, score]) => ({
                  category: category,
                  score: parseFloat(score)
                }));
              } else {
                this.categoryScores = [];
              }
              
              this.hasResults = true;
              console.log('Berhasil mendapatkan hasil audit dari endpoint audit');
              return;
            }
          }
        } catch (error) {
          console.log('Gagal mendapatkan hasil dari endpoint audit:', error);
        }
        
        // Jika sudah mencoba semua endpoint dan tidak ada yang berhasil, kita paksa
        // menampilkan skor dan hasil kosong dengan hasResults = true agar user bisa
        // melihat tombol download
        this.totalScore = 0;
        this.categoryScores = [];
        this.hasResults = true; // Tetapkan true agar tetap menampilkan hasil dan tombol download
        console.log('Tidak ada data hasil audit yang ditemukan, menampilkan skor 0 dengan tombol download');
        
      } catch (error) {
        console.error('Error fetching previous audit results:', error);
        this.totalScore = 0;
        this.categoryScores = [];
        this.hasResults = true; // Tetap true agar tombol download tetap tersedia
      }
    },

    // Format file size
    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' bytes';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      else return (bytes / 1048576).toFixed(1) + ' MB';
    },

    // Get score color based on score value
    getScoreColor(score) {
      if (score >= 80) return '#4CAF50'; // Hijau untuk skor tinggi
      if (score >= 60) return '#FFC107'; // Kuning untuk skor menengah
      return '#F44336'; // Merah untuk skor rendah
    },

    // Navigate back
    goBack() {
      this.$router.push('/dashboard-default');
    },

    // Submit answers
    async submitAnswers() {
      // Validasi auditId
      if (!this.auditId || this.auditId === 'null' || this.auditId === 'undefined') {
        alert('Tidak dapat mengirim jawaban: ID audit tidak valid');
        return;
      }

      // Validate that all questions are answered
      const hasEmptyAnswers = this.additionalAnswers.some(answer => !answer.trim());
      if (hasEmptyAnswers) {
        alert('Mohon jawab semua pertanyaan tambahan.');
        return;
      }

      this.isSending = true;
      const token = this.getValidToken();
      if (!token) return;

      try {
        console.log('Submitting answers for audit ID:', this.auditId);
        
        // Siapkan data dengan format yang benar
        const data = {
          answers: this.additionalAnswers.join('|--|'),
          audit_id: parseInt(this.auditId) // Pastikan ID adalah integer
        };

        console.log('Sending data:', data);

        // Submit answers to API
        const response = await axios.post(
          `${apiBaseUrl}/api/auth/save-additional-answers/${this.auditId}`,
          data,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Response from save-additional-answers:', response.data);

        if (response.data && (response.data.status === 'success' || response.data.message)) {
          // Simpan pertanyaan dan jawaban ke riwayat sebelum navigasi
          this.savePreviousQuestionsAndAnswers();
          
          // Hapus draft setelah berhasil submit
          localStorage.removeItem(`audit_${this.auditId}_draft_answers`);
          
          alert('Jawaban berhasil dikirim!');
          this.$router.push('/dashboard-default');
        } else {
          throw new Error(response.data?.message || 'Gagal mengirim jawaban');
        }
      } catch (error) {
        console.error('Error submitting answers:', error);
        console.error('Response data:', error.response?.data);
        
        // Tambahkan logging untuk debugging
        console.log('Current audit ID:', this.auditId);
        console.log('Current answers:', this.additionalAnswers);
        
        let errorMessage = 'Terjadi kesalahan saat mengirim jawaban.';
        
        if (error.response) {
          if (error.response.status === 401) {
            this.handleSessionExpired();
            return;
          } else if (error.response.status === 422) {
            errorMessage = error.response.data?.message || 'Format data tidak valid.';
            if (error.response.data?.errors) {
              const errors = Object.values(error.response.data.errors).flat();
              errorMessage += '\n' + errors.join('\n');
            }
          } else if (error.response.status === 405) {
            // Method Not Allowed, coba dengan metode HTTP lain
            errorMessage = 'Metode pengiriman tidak diizinkan. Silakan hubungi administrator.';
          } else {
            errorMessage = error.response.data?.message || 'Gagal mengirim jawaban.';
          }
        }
        
        alert(errorMessage);
      } finally {
        this.isSending = false;
      }
    },
    
    // Simpan jawaban sementara di localStorage
    saveDraftAnswers() {
      try {
        const answersData = {
          questions: this.additionalQuestions,
          answers: this.additionalAnswers,
          lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem(`audit_${this.auditId}_draft_answers`, JSON.stringify(answersData));
        console.log('Draft jawaban berhasil disimpan');
      } catch (error) {
        console.error('Error saving draft answers:', error);
      }
    },
    
    // Muat jawaban dari localStorage
    loadSavedAnswers() {
      try {
        const savedData = localStorage.getItem(`audit_${this.auditId}_draft_answers`);
        
        if (savedData) {
          const data = JSON.parse(savedData);
          
          // Pastikan pertanyaan masih sama sebelum memuat jawaban
          if (this.additionalQuestions.length === data.questions.length) {
            let match = true;
            
            // Pastikan pertanyaannya sama
            for (let i = 0; i < this.additionalQuestions.length; i++) {
              if (this.additionalQuestions[i] !== data.questions[i]) {
                match = false;
                break;
              }
            }
            
            if (match) {
              this.additionalAnswers = data.answers;
              console.log('Jawaban berhasil dimuat dari draft');
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved answers:', error);
      }
    },
    
    // Simpan pertanyaan dan jawaban sebelumnya
    savePreviousQuestionsAndAnswers() {
      try {
        // Simpan hanya jika ada data yang perlu disimpan
        if (this.additionalQuestions.length === 0 || this.additionalAnswers.length === 0) {
          return;
        }
        
        // Buat objek untuk disimpan
        const historyEntry = {
          date: new Date().toISOString(),
          questions: [...this.additionalQuestions],
          answers: [...this.additionalAnswers]
        };
        
        // Ambil riwayat yang sudah ada
        let history = [];
        const savedHistory = localStorage.getItem(`audit_${this.auditId}_history`);
        
        if (savedHistory) {
          history = JSON.parse(savedHistory);
        }
        
        // Tambahkan riwayat baru
        history.push(historyEntry);
        
        // Simpan kembali ke localStorage
        localStorage.setItem(`audit_${this.auditId}_history`, JSON.stringify(history));
        
        // Update juga data di komponen
        this.previousQuestions = history.map(entry => entry.questions);
        this.previousAnswers = history.map(entry => entry.answers);
        
        console.log('Riwayat pertanyaan dan jawaban berhasil disimpan');
      } catch (error) {
        console.error('Error saving question and answer history:', error);
      }
    },
    
    // Muat pertanyaan dan jawaban sebelumnya
    loadPreviousQuestionsAndAnswers() {
      try {
        const savedHistory = localStorage.getItem(`audit_${this.auditId}_history`);
        
        if (savedHistory) {
          const history = JSON.parse(savedHistory);
          
          // Set data di komponen
          this.previousQuestions = history.map(entry => entry.questions);
          this.previousAnswers = history.map(entry => entry.answers);
          
          console.log('Riwayat pertanyaan dan jawaban berhasil dimuat');
        }
      } catch (error) {
        console.error('Error loading question and answer history:', error);
      }
    },

    // Cek apakah pertanyaan baru tersedia
    areNewQuestionsAvailable(currentQuestions) {
      // Jika belum ada pertanyaan sebelumnya, berarti ini pertanyaan baru
      if (!this.additionalQuestions || this.additionalQuestions.length === 0) {
        return true;
      }
      
      // Jika jumlah pertanyaan berbeda, berarti ada pertanyaan baru
      if (currentQuestions.length !== this.additionalQuestions.length) {
        return true;
      }
      
      // Bandingkan setiap pertanyaan untuk cek apakah ada yang berubah
      for (let i = 0; i < currentQuestions.length; i++) {
        if (currentQuestions[i] !== this.additionalQuestions[i]) {
          return true;
        }
      }
      
      // Jika sampai sini, berarti semua pertanyaan sama
      return false;
    },

    // Method untuk mengunduh hasil audit
    async downloadAuditResult() {
      // Validasi auditId
      if (!this.auditId || this.auditId === 'null' || this.auditId === 'undefined') {
        console.error('Tidak dapat mengunduh hasil audit: ID audit tidak valid');
        return;
      }

      const token = this.getValidToken();
      if (!token) return;
      
      try {
        this.isDownloading = true;
        
        const response = await axios.get(
          `${apiBaseUrl}/api/auth/audits/${this.auditId}/download-result`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            responseType: 'blob'
          }
        );
        
        // Buat URL untuk file dan mulai unduhan
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `hasil_audit_${this.auditId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
      } catch (error) {
        console.error('Error downloading audit result:', error);
      } finally {
        this.isDownloading = false;
      }
    },

    // Method untuk menghapus riwayat pertanyaan dan jawaban
    confirmClearHistory() {
      if (confirm('Apakah Anda yakin ingin menghapus riwayat pertanyaan dan jawaban?')) {
        this.clearHistory();
      }
    },

    // Method untuk menghapus riwayat pertanyaan dan jawaban
    clearHistory() {
      localStorage.removeItem(`audit_${this.auditId}_history`);
      this.previousQuestions = [];
      this.previousAnswers = [];
      console.log('Riwayat pertanyaan dan jawaban berhasil dihapus');
      
      // Menampilkan notifikasi berhasil
      alert('Riwayat pertanyaan dan jawaban berhasil dihapus');
    }
  },
  mounted() {
    // Jika ID tidak ditemukan di URL, coba ambil dari localStorage
    if (!this.auditId || this.auditId === 'null' || this.auditId === 'undefined') {
      this.auditId = localStorage.getItem('selected_audit_id');
      
      // Jika masih tidak ada, redirect ke halaman default
      if (!this.auditId) {
        this.hasError = true;
        this.errorMessage = 'Tidak dapat menemukan ID audit. Silakan kembali ke halaman sebelumnya.';
        // Delay to show the message before redirecting
        setTimeout(() => {
          this.$router.push('/dashboard-default');
        }, 2000);
        return;
      }
    }
    
    this.fetchData();
    
    // Setup auto save draft setiap 30 detik
    this.autoSaveInterval = setInterval(() => {
      if (this.additionalQuestions.length > 0) {
        this.saveDraftAnswers();
      }
    }, 30000);
    
    // Save draft saat user meninggalkan halaman
    window.addEventListener('beforeunload', this.saveDraftAnswers);
  },
  beforeUnmount() {
    // Clear interval saat komponen dihapus
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    // Remove event listener
    window.removeEventListener('beforeunload', this.saveDraftAnswers);
  }
};
</script>

<style scoped>
.additional-questions-container {
  font-family: 'Roboto', sans-serif;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  background: #f4f7fa;
  border-radius: 8px;
}

.page-title {
  font-size: 2.5rem;
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.loading-container {
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  text-align: center;
  padding: 2rem;
  background: #fff3f3;
  border-radius: 8px;
  margin: 1rem 0;
}

.error-message {
  color: #d32f2f;
  margin-bottom: 1rem;
}

.retry-btn {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.retry-btn:hover {
  background-color: #45a049;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.audit-info-card, 
.previous-results-card, 
.additional-questions-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
}

.audit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.audit-status .badge {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.bg-gradient-success {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
}

.audit-details {
  color: #666;
  line-height: 1.5;
}

.previous-results-card h3 {
  margin-bottom: 20px;
  color: #333;
}

.total-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 25px;
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.category-scores h4 {
  margin-bottom: 15px;
  color: #555;
  font-size: 1.1rem;
}

.category-scores-grid {
  display: grid;
  gap: 15px;
}

.category-score-item {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
}

.category-name {
  font-weight: 600;
  margin-bottom: 5px;
  color: #444;
}

.score-bar-container {
  background: #e9ecef;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 5px;
}

.score-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 1s ease-out;
}

.score-value {
  text-align: right;
  font-weight: 500;
  color: #555;
}

.additional-questions-card h3 {
  margin-bottom: 20px;
  color: #333;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.question-content {
  display: flex;
  margin-bottom: 10px;
}

.question-number {
  font-weight: bold;
  margin-right: 10px;
  color: #4CAF50;
}

.question-text {
  flex: 1;
  margin: 0;
  line-height: 1.5;
  color: #333;
}

.answer-area {
  margin-left: 25px;
}

.answer-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.3s;
}

.answer-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.2);
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.cancel-btn, .submit-btn {
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  border: none;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #555;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.submit-btn {
  background-color: #4CAF50;
  color: white;
}

.submit-btn:hover {
  background-color: #45a049;
}

.submit-btn:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column-reverse;
    gap: 15px;
  }
  
  .cancel-btn, .submit-btn {
    width: 100%;
    justify-content: center;
  }
}

.no-results-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  color: #6c757d;
}

.no-results-message i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #adb5bd;
}

.no-results-message p {
  font-size: 1.1rem;
  margin: 0;
}

.previous-results-card.no-results {
  background-color: #f8f9fa;
  border: 1px dashed #dee2e6;
}

.previous-audit-file {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #dee2e6;
}

.previous-audit-file h4 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.file-link-container {
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 12px 15px;
  margin-bottom: 10px;
}

.file-link {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #4CAF50;
  text-decoration: none;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-link i {
  font-size: 1.2rem;
}

.download-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;
}

.download-btn:hover {
  background-color: #45a049;
}

.file-date {
  font-size: 0.8rem;
  color: #6c757d;
  margin: 0;
}

.download-result-section {
  margin-top: 25px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.download-result-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 25px;
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.download-result-btn:hover {
  background-color: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

.download-result-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.download-hint {
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 10px;
  text-align: center;
}

.no-score-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  margin: 20px 0;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #dee2e6;
}

.no-score-message i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #FFC107;
}

.no-score-message p {
  font-size: 1rem;
  text-align: center;
  color: #6c757d;
  max-width: 80%;
  margin: 0;
}

.previous-qa-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  padding: 25px;
  margin-bottom: 30px;
  border-top: 4px solid #4CAF50;
}

.previous-qa-card h3 {
  margin-bottom: 20px;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 15px;
}

.previous-qa-card h3 i {
  color: #4CAF50;
  font-size: 1.2rem;
}

.clear-history-btn {
  background-color: #F44336;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  margin-left: auto;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.clear-history-btn:hover {
  background-color: #D32F2F;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.clear-history-btn i {
  color: white;
  font-size: 1rem;
  margin-right: 5px;
}

.history-item {
  margin-bottom: 25px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
}

.history-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.history-header {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  padding: 12px 20px;
  position: relative;
}

.session-badge {
  color: white;
  font-weight: 600;
  font-size: 1rem;
  display: block;
}

.history-content {
  padding: 20px;
  background-color: #ffffff;
}

.history-qa-item {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eaecef;
}

.history-qa-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.history-question {
  display: flex;
  margin-bottom: 10px;
  align-items: flex-start;
}

.question-number {
  background-color: #4CAF50;
  color: white;
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 4px;
  margin-right: 10px;
  font-size: 0.85rem;
  min-width: 35px;
  text-align: center;
}

.question-text {
  flex: 1;
  color: #333;
  line-height: 1.5;
  padding-top: 3px;
  font-weight: 500;
}

.history-answer {
  margin-left: 45px;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  position: relative;
}

.answer-label {
  font-weight: 600;
  color: #4CAF50;
  margin-bottom: 5px;
}

.answer-text {
  color: #4a4a4a;
  line-height: 1.6;
}

.history-scroll-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 5px;
  scrollbar-width: thin;
  scrollbar-color: #4CAF50 #f5f5f5;
}

.history-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.history-scroll-container::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 10px;
}

.history-scroll-container::-webkit-scrollbar-thumb {
  background: #4CAF50;
  border-radius: 10px;
}

.history-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #45a049;
}
</style> 