<template>
  <div class="audit-container">
    <h1 class="audit-title">Audit Questions</h1>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Memuat pertanyaan audit...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="hasError" class="error-container">
      <p class="error-message">{{ errorMessage }}</p>
      <button @click="fetchQuestions" class="retry-btn">
        Coba Lagi
      </button>
    </div>

    <!-- Jika ada pertanyaan -->
    <div v-else-if="questionGroups.length" class="regular-questions-section">
      <h2>Pertanyaan Audit</h2>
      <p class="info-text">
        Anda dapat menjawab kembali pertanyaan audit sebelumnya, tetapi tidak diwajibkan.
      </p>

      <!-- Form untuk menjawab pertanyaan -->
      <form @submit.prevent="submitAnswers">
        <!-- Iterasi grup pertanyaan berdasarkan kategori -->
        <div
          v-for="(group, groupIndex) in questionGroups"
          :key="groupIndex"
          v-show="currentGroupIndex === groupIndex"
          class="question-group"
        >
          <!-- Tampilkan kategori, jika kosong ganti dengan "Tanpa Kategori" -->
          <h3 class="question-group-title">{{ group.category || "Tanpa Kategori" }}</h3>

          <!-- Iterasi pertanyaan di dalam kategori -->
          <div
            v-for="(question, questionIndex) in group.questions"
            :key="questionIndex"
            class="question-card"
          >
            <label class="question-label">{{ question.question }}</label>
            
            <!-- Input untuk jawaban final -->
            <select v-model="question.answer" class="question-input">
              <option value="">Tidak Dijawab</option>
              <option value="1">Ya</option>
              <option value="0">Tidak</option>
            </select>
          </div>

          <!-- Catatan Sementara untuk satu kelompok -->
          <div class="draft-answer-section">
            <label class="draft-label">Catatan Sementara untuk Kategori {{ group.category || "Tanpa Kategori" }}:</label>
            <textarea
              v-model="group.draft_answer"
              class="draft-input"
              placeholder="Tulis catatan sementara untuk kategori ini..."
              @change="saveDraftForGroup(group, groupIndex)"
            ></textarea>
            <div v-if="group.is_draft" class="draft-status">
              <i class="ni ni-check-bold"></i> Draft tersimpan
            </div>
          </div>

          <!-- File upload untuk kelompok -->
          <div class="file-upload">
            <label :for="'file_' + groupIndex" class="file-upload-label">
              Unggah File Pendukung (Opsional)
            </label>
            <input
              type="file"
              :id="'file_' + groupIndex"
              @change="handleFileUpload(groupIndex, $event)"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.png"
            />
          </div>
        </div>

        <!-- Tambahkan tombol Simpan & Kembali di dalam form -->
        <div class="navigation-buttons">
          <button
            v-if="currentGroupIndex > 0"
            @click="previousGroup"
            class="prev-btn"
          >
            Kembali
          </button>
          <button
            v-if="currentGroupIndex < questionGroups.length - 1"
            @click="nextGroup"
            class="next-btn"
          >
            Berikutnya
          </button>
          <button @click="saveAndReturn" class="save-return-btn">
            <i class="ni ni-check-bold me-2"></i>
            Simpan & Kembali
          </button>
        </div>

        <!-- Tombol submit hanya muncul di grup terakhir -->
        <button 
          v-if="currentGroupIndex === questionGroups.length - 1" 
          type="submit" 
          class="submit-btn"
        >
          Submit Answers
        </button>
      </form>
    </div>

    <!-- Jika tidak ada pertanyaan -->
    <div v-else class="no-questions">
      <p>Tidak ada pertanyaan yang tersedia untuk audit ini.</p>
    </div>

    <!-- Bagian untuk menampilkan hasil audit -->
    <div v-if="showResults" class="audit-results-compact">
      <div class="results-header">
        <h2 class="results-title">Hasil Audit</h2>
        <div class="total-score">{{ totalScore }}%</div>
      </div>
      <p class="mb-2"><strong>Kesimpulan:</strong> {{ kesimpulanTotal }}</p>

      <div class="category-scores-container">
        <h3 class="category-header">Detail per Kategori:</h3>
        <div class="category-list">
          <div v-for="cat in categoryScores" :key="cat.category" class="category-item">
            <div class="category-name">{{ cat.category }}</div>
            <div class="score-bar-container">
              <div class="score-bar" :style="{ width: cat.score + '%', backgroundColor: getScoreColor(cat.score) }"></div>
              <div class="score-value">{{ cat.score }}%</div>
            </div>
            <div class="score-label">({{ cat.kesimpulan }})</div>
          </div>
        </div>
      </div>

      <!-- Rekomendasi dalam format yang lebih compact -->
      <div class="recommendations-compact" v-if="recommendations.length > 0">
        <h3 class="recommendation-header">Rekomendasi:</h3>
        <ul class="recommendations-list">
          <li v-for="(rec, index) in recommendations" :key="index" class="recommendation-item">
            <i class="ni ni-check-bold"></i>
            <span>{{ rec }}</span>
          </li>
        </ul>
      </div>

      <!-- Tombol Aksi -->
      <div class="action-buttons">
        <button @click="downloadPdf" class="btn btn-primary">
          <i class="ni ni-cloud-download-95"></i> Download PDF
        </button>
        <button @click="sendPdfToAuditor" :disabled="isSending" class="btn btn-success">
          <i class="ni ni-send"></i> {{ isSending ? "Mengirim..." : "Kirim ke Auditor" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import {
  Chart,
  LinearScale,
  BarElement,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  BarController,
} from "chart.js";
import html2canvas from "html2canvas";

import { PDFDocument, rgb } from 'pdf-lib';

// Registrasi tipe chart dan semua komponennya
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarController
);

export default {
  data() {
    return {
      auditeeId: localStorage.getItem("auditee_id"),
      questionGroups: [],
      currentGroupIndex: 0,
      uploadedFiles: {},
      hasAdditionalQuestions: false,
      additionalQuestions: [],
      additionalAnswers: [],
      autoSaveInterval: null,
      totalScore: 0,
      categoryScores: [],
      recommendations: [],
      showResults: false,
      isSending: false,
      isLoading: true,
      hasError: false,
      errorMessage: '',
      kesimpulanTotal: '',
    };
  },
  methods: {
    // Metode untuk mendapatkan token yang valid
    getValidToken() {
      const token = localStorage.getItem('access_token');
      if (!token) {
        this.handleSessionExpired();
        return null;
      }
      return token;
    },

    // Metode untuk menangani sesi yang berakhir
    handleSessionExpired() {
      localStorage.removeItem('access_token');
      this.hasError = true;
      this.errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
      this.$router.push('/login');
    },

    // Update method untuk navigasi
    async nextGroup() {
      if (this.currentGroupIndex < this.questionGroups.length - 1) {
        this.currentGroupIndex++;
        await this.saveTemporaryAnswers(); // Simpan progress setiap perpindahan
      }
    },

    async previousGroup() {
      if (this.currentGroupIndex > 0) {
        this.currentGroupIndex--;
        await this.saveTemporaryAnswers(); // Simpan progress setiap perpindahan
      }
    },

    // Metode untuk menyimpan jawaban sementara
    async saveTemporaryAnswers() {
      const token = this.getValidToken();
      if (!token) return;

      try {
        // Simpan ke localStorage
        const tempData = {
          currentGroupIndex: this.currentGroupIndex,
          questionGroups: this.questionGroups.map(group => ({
            ...group,
            questions: group.questions.map(q => ({
              id: q.id,
              question: q.question,
              answer: q.answer
            }))
          })),
          timestamp: new Date().getTime()
        };
        
        localStorage.setItem(`audit_temp_${this.auditeeId}`, JSON.stringify(tempData));

        // Simpan draft untuk setiap grup
        for (const [index, group] of this.questionGroups.entries()) {
          if (group.draft_answer) {
            await this.saveDraft(group.category || `Grup ${index + 1}`, group.draft_answer);
          }
        }

        console.log('Jawaban disimpan sementara:', new Date().toLocaleString());
      } catch (error) {
        console.error('Error saving temporary answers:', error);
      }
    },

    // Metode untuk memuat jawaban sementara
    async loadTemporaryAnswers() {
      const savedData = localStorage.getItem(`audit_temp_${this.auditeeId}`);
      
      if (savedData) {
        try {
          const tempData = JSON.parse(savedData);
          const savedTimestamp = new Date(tempData.timestamp);
          const now = new Date();
          const hoursDiff = (now - savedTimestamp) / (1000 * 60 * 60);

          if (hoursDiff < 24) {
            this.questionGroups.forEach((group, groupIndex) => {
              const savedGroup = tempData.questionGroups[groupIndex];
              if (savedGroup) {
                group.questions.forEach((question, questionIndex) => {
                  const savedQuestion = savedGroup.questions[questionIndex];
                  if (savedQuestion && savedQuestion.id === question.id) {
                    question.answer = savedQuestion.answer;
                  }
                });
                
                group.draft_answer = savedGroup.draft_answer;
                group.is_draft = savedGroup.is_draft;
              }
            });
            
            this.currentGroupIndex = tempData.currentGroupIndex;
            
            if (this.questionGroups.some(group => 
              group.questions.some(q => q.answer) || group.draft_answer
            )) {
              console.log('Memuat jawaban tersimpan sebelumnya');
            }
          } else {
            localStorage.removeItem(`audit_temp_${this.auditeeId}`);
          }
        } catch (error) {
          console.error('Error loading temporary answers:', error);
        }
      }
    },

    // Override metode fetchQuestions yang sudah ada
    async fetchQuestions() {
      this.isLoading = true;
      this.hasError = false;
      this.errorMessage = '';

      const token = this.getValidToken();
      if (!token) return;

      try {
    const response = await axios.get(
      `https://spbebackend-production.up.railway.app/api/auth/questions/${this.auditeeId}`,
      {
        headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.data || response.data.status === 'error') {
          throw new Error(response.data?.message || 'Gagal mengambil data pertanyaan');
        }

        if (Array.isArray(response.data.data)) {
          this.questionGroups = response.data.data;
          
          // Inisialisasi file upload dengan cara Vue 3
          this.uploadedFiles = Object.fromEntries(
            this.questionGroups.map((_, index) => [index, null])
          );

          // Load temporary answers setelah inisialisasi pertanyaan
          await this.loadTemporaryAnswers();

          // Coba ambil pertanyaan tambahan jika ada
          await this.fetchAdditionalQuestions();
        } else {
          throw new Error('Format data tidak valid');
        }
      } catch (error) {
        console.error("Failed to fetch questions:", error);
        this.hasError = true;
        
        if (error.response) {
          if (error.response.status === 401) {
            this.handleSessionExpired();
          } else if (error.response.status === 404) {
            this.errorMessage = 'Data audit tidak ditemukan.';
            this.$router.push('/dashboard-default');
          } else {
            this.errorMessage = error.response.data?.message || 'Terjadi kesalahan saat mengambil data.';
          }
        } else if (error.request) {
          this.errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        } else {
          this.errorMessage = error.message || 'Gagal mengambil data pertanyaan. Silakan coba lagi.';
        }
      } finally {
        this.isLoading = false;
      }
    },

    // Tambahkan method baru untuk mengambil pertanyaan tambahan
    async fetchAdditionalQuestions() {
      try {
        const token = this.getValidToken();
        if (!token) return;

    const additionalResponse = await axios.get(
      `https://spbebackend-production.up.railway.app/api/auth/audit-requests/with-additional-questions`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const additionalData = additionalResponse.data.find(
      (item) => item.id === parseInt(this.auditeeId)
    );

        if (additionalData?.additional_questions) {
          this.hasAdditionalQuestions = true;
      this.additionalQuestions = additionalData.additional_questions.split("\n");
          this.additionalAnswers = this.additionalQuestions.map(() => "");
    }
  } catch (error) {
        console.error("Gagal mengambil pertanyaan tambahan:", error);
        // Tidak perlu menampilkan error ke user karena ini fitur opsional
      }
    },

    // Tambahkan ke mounted
    setupAutoSave() {
      // Autosave setiap 1 menit
      this.autoSaveInterval = setInterval(() => {
        if (this.questionGroups.length > 0) {
          this.saveTemporaryAnswers();
        }
      }, 60000);

      // Simpan saat user akan meninggalkan halaman
      window.addEventListener('beforeunload', () => {
        this.saveTemporaryAnswers();
      });
    },

    // Tambahkan ke beforeDestroy
    cleanupAutoSave() {
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval);
      }
    },

    // Menambahkan method getScoreColor
    getScoreColor(score) {
      if (score >= 80) return '#4CAF50'; // Hijau untuk skor tinggi
      if (score >= 60) return '#FFC107'; // Kuning untuk skor menengah
      return '#F44336'; // Merah untuk skor rendah
    },
    
    // Submit jawaban utama ke backend
    async submitAnswers() {
      try {
        const token = this.getValidToken();
        if (!token) return;

        // Validasi jawaban
        const hasEmptyAnswers = this.questionGroups.some(group => 
          group.questions.some(q => q.answer === undefined || q.answer === null || q.answer === '')
        );

        if (hasEmptyAnswers) {
          alert('Mohon lengkapi semua jawaban sebelum mengirim.');
          return;
        }

        // Format data sesuai dengan yang diharapkan backend
        const formattedData = {
          id: parseInt(this.auditeeId),
          question_groups: this.questionGroups.map(group => ({
            category: group.category,
            questions: group.questions.map(q => ({
              id: parseInt(q.id),
              text: q.question,
              answer: q.answer !== "" && q.answer !== null ? parseInt(q.answer) : null
            }))
          }))
        };

        // Log untuk debugging
        console.log('Detail pengiriman:');
        console.log('URL:', `https://spbebackend-production.up.railway.app/api/auth/save-audit-results/${this.auditeeId}`);
        console.log('Token:', token ? 'Ada' : 'Tidak ada');
        console.log('Auditee ID:', this.auditeeId);
        console.log('Data yang akan dikirim:', formattedData);

    const response = await axios.post(
      `https://spbebackend-production.up.railway.app/api/auth/save-audit-results/${this.auditeeId}`,
          formattedData,
      {
        headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.message === "Audit results saved successfully.") {
          // Update data hasil audit dari respon
    this.totalScore = response.data.totalScore;
    this.kesimpulanTotal = response.data.kesimpulanTotal;
    this.categoryScores = response.data.categoryScores;
    this.recommendations = response.data.recommendations || [];
          
          // Tampilkan hasil
    this.showResults = true;

          // Render chart setelah data siap
    this.$nextTick(() => {
            this.renderChart();
          });

          // Hapus data temporary
          localStorage.removeItem(`audit_temp_${this.auditeeId}`);
          
          // Bersihkan draft answers
          this.questionGroups.forEach(group => {
            group.questions.forEach(question => {
              question.is_draft = false;
              question.draft_answer = null;
            });
          });

          alert('Jawaban berhasil disimpan!');
          
          // Redirect ke dashboard jika ada redirect URL di response
          if (response.data.redirect) {
            this.$router.push(response.data.redirect.replace('/', ''));
          }
        }
      } catch (error) {
        console.error('Error submitting answers:', error);
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        console.error('Response headers:', error.response?.headers);
        
        if (error.response) {
          if (error.response.status === 401) {
            this.handleSessionExpired();
          } else if (error.response.status === 422) {
            const errorMessage = error.response.data?.errors 
              ? Object.values(error.response.data.errors).flat().join('\n')
              : error.response.data?.message || 'Format jawaban tidak valid. Pastikan semua pertanyaan telah dijawab.';
            alert(errorMessage);
          } else if (error.response.status === 404) {
            alert('Terjadi kesalahan:\n1. Pastikan Anda memiliki akses ke pertanyaan ini\n2. Pastikan semua ID pertanyaan valid\n3. Pastikan sesi Anda belum berakhir');
            await this.fetchQuestions();
          } else {
            alert(error.response.data?.message || 'Gagal menyimpan jawaban. Silakan coba lagi.');
          }
        } else {
          alert('Terjadi kesalahan jaringan. Silakan coba lagi.');
        }
      }
    },

  handleFileUpload(groupIndex, event) {
  const files = event.target.files;
  if (files && files.length > 0) {
    if (!this.uploadedFiles[groupIndex]) {
      this.uploadedFiles[groupIndex] = []; // Inisialisasi array jika belum ada
    }
    Array.from(files).forEach((file) => {
      if (file instanceof File) {
        this.uploadedFiles[groupIndex].push(file); // Tambahkan file ke array
      } else {
        console.error("Uploaded file is not a valid File instance.");
      }
    });
  }
},

    // Submit jawaban untuk pertanyaan tambahan ke backend
    async submitAdditionalAnswers() {
      const token = localStorage.getItem("access_token");

      // Gabungkan jawaban menjadi string
      const answersString = this.additionalAnswers.join(",");

      const requestData = {
        id: this.auditeeId, // ID auditee
        answers: answersString, // Gabungan jawaban
      };

      try {
        await axios.post(
          `https://spbebackend-production.up.railway.app/api/auth/save-additional-answers/${this.auditeeId}`,
          requestData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        alert("Jawaban untuk pertanyaan tambahan berhasil dikirim.");
      } catch (error) {
        console.error("Failed to submit additional questions:", error);
      }
    },

    async sendPdfToAuditor() {
  this.isSending = true;

  try {
    const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
    const chartCanvas = document.getElementById("scoreChart");

    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();

    // Header hijau
    page.drawRectangle({
      x: 0,
      y: height - 120,
      width: width,
      height: 120,
      color: rgb(0.298, 0.686, 0.314) // #4CAF50
    });

    // Judul
    page.drawText("Hasil Audit", {
      x: 50,
      y: height - 70,
      size: 32,
      font: helveticaBold,
      color: rgb(1, 1, 1)
    });

    // Total skor kanan atas
    const scoreText = `${this.totalScore}%`;
    const scoreWidth = helveticaBold.widthOfTextAtSize(scoreText, 32);
    page.drawText(scoreText, {
      x: width - scoreWidth - 50,
      y: height - 70,
      size: 32,
      font: helveticaBold,
      color: rgb(1, 1, 1)
    });

    let yOffset = height - 160;

    // Skor Kategori
    page.drawText("Skor Kategori:", {
      x: 50,
      y: yOffset,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0)
    });

    yOffset -= 30;

    for (let i = 0; i < this.categoryScores.length; i++) {
      const item = this.categoryScores[i];
      const label = `${item.category}: ${item.score}% (${item.kesimpulan})`;

      page.drawText(label, {
        x: 50,
        y: yOffset,
        size: 12,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });

      yOffset -= 18;

      let barColor = rgb(0.2, 0.6, 0.2); // Hijau
      if (item.score < 50) barColor = rgb(0.9, 0.2, 0.2); // Merah
      else if (item.score < 75) barColor = rgb(1, 0.8, 0); // Kuning

      // Progress bar
      page.drawRectangle({
        x: 50,
        y: yOffset,
        width: 400,
        height: 8,
        color: rgb(0.9, 0.9, 0.9)
      });
      page.drawRectangle({
        x: 50,
        y: yOffset,
        width: (item.score / 100) * 400,
        height: 8,
        color: barColor
      });

      yOffset -= 25;
    }

    yOffset -= 10;

    // Rekomendasi
    page.drawText("Rekomendasi:", {
      x: 50,
      y: yOffset,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0)
    });

    yOffset -= 30;

    for (let i = 0; i < this.recommendations.length; i++) {
      const text = `${i + 1}. ${this.recommendations[i]}`;
      const lines = this.wrapText(text, helveticaFont, 12, width - 100);

      for (const line of lines) {
        page.drawText(line, {
          x: 50,
          y: yOffset,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        });
        yOffset -= 20;
      }
      yOffset -= 10;
    }

    yOffset -= 20;

   

    yOffset -= 30;

    if (chartCanvas) {
      const chartImage = await html2canvas(chartCanvas);
      const chartDataUrl = chartImage.toDataURL("image/png");
      const chartBytes = await fetch(chartDataUrl).then((res) => res.arrayBuffer());
      const chartImageEmbed = await pdfDoc.embedPng(chartBytes);

      const scaleFactor = (width - 100) / chartImageEmbed.width;
      const scaledWidth = chartImageEmbed.width * scaleFactor;
      const scaledHeight = chartImageEmbed.height * scaleFactor;

      page.drawImage(chartImageEmbed, {
        x: 50,
        y: yOffset - scaledHeight,
        width: scaledWidth,
        height: scaledHeight
      });

      yOffset -= scaledHeight + 40;
    }

    // File Terlampir
    if (Object.keys(this.uploadedFiles).length > 0) {
      page.drawText("File Terlampir:", {
        x: 50,
        y: yOffset,
        size: 14,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });

      yOffset -= 30;

      let fileNumber = 1;
      for (const [groupIndex, files] of Object.entries(this.uploadedFiles)) {
        if (Array.isArray(files)) {
          for (const file of files) {
            if (file instanceof File) {
              try {
                const buffer = await file.arrayBuffer();
                await pdfDoc.attach(buffer, file.name, {
                  mimeType: file.type,
                  description: `File pendukung kategori ${parseInt(groupIndex) + 1}`,
                  creationDate: new Date(),
                  modificationDate: new Date()
                });

                page.drawText(`${fileNumber}. ${file.name}`, {
                  x: 50,
                  y: yOffset,
                  size: 12,
                  font: helveticaFont,
                  color: rgb(0, 0, 0)
                });

                yOffset -= 25;
                fileNumber++;
              } catch (err) {
                console.error(`Gagal melampirkan ${file.name}:`, err);
              }
            }
          }
        }
      }
    }

    // Kirim ke backend
    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("pdf", pdfBlob, `Hasil_Audit_${this.auditeeId}.pdf`);
    formData.append("id", this.auditeeId);

    await axios.post("https://spbebackend-production.up.railway.app/api/auth/audit-results/send-pdf", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    });

    alert("PDF berhasil dikirim ke auditor!");
  } catch (error) {
    console.error("Gagal mengirim PDF:", error);
    alert("Terjadi kesalahan saat mengirim PDF.");
  } finally {
    this.isSending = false;
  }
}, 





 

    // Render chart untuk menampilkan skor
    renderChart() {
  const canvas = document.getElementById("scoreChart");
  if (!canvas) {
    console.error("Canvas element not found in renderChart!");
    return;
  }

      // Hancurkan chart yang ada jika sudah ada
      const existingChart = Chart.getChart(canvas);
      if (existingChart) {
        existingChart.destroy();
  }

  const ctx = canvas.getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: this.categoryScores.map(category => category.category),
      datasets: [
        {
          label: "Skor",
          data: this.categoryScores.map(category => category.score),
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function(tooltipItem) {
              return `Skor: ${tooltipItem.raw}%`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 10,
          },
        },
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
          },
        },
      },
    },
  });
},

    async readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // Tangani jenis file
    if (file.type.includes("text")) {
      // Jika file teks
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    } else if (file.type.includes("image")) {
      // Jika file gambar
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file); // Gambar sebagai base64
    } else if (file.type.includes("pdf")) {
      // Jika file PDF
      resolve("Cannot display full PDF content in jsPDF. Only filenames can be shown."); // Placeholder
    } else {
      reject(new Error("Unsupported file type"));
    }
  });
},

async generateLocalPdf() {
  try {
    const { StandardFonts } = await import('pdf-lib');

    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595, 842]); // Ukuran A4
    const { height, width } = page.getSize();

    // Header hijau
    page.drawRectangle({
      x: 0,
      y: height - 120,
      width: width,
      height: 120,
      color: rgb(0.298, 0.686, 0.314) // #4CAF50
    });

    // Judul "Hasil Audit"
    page.drawText("Hasil Audit", {
      x: 50,
      y: height - 70,
      size: 32,
      font: helveticaBold,
      color: rgb(1, 1, 1)
    });

    // Total skor kanan atas
    const scoreText = `${this.totalScore}%`;
    const scoreWidth = helveticaBold.widthOfTextAtSize(scoreText, 32);
    page.drawText(scoreText, {
      x: width - scoreWidth - 50,
      y: height - 70,
      size: 32,
      font: helveticaBold,
      color: rgb(1, 1, 1)
    });

    let yOffset = height - 160;

    // Skor Kategori
    page.drawText("Skor Kategori:", {
      x: 50,
      y: yOffset,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0)
    });
    yOffset -= 30;

    for (let i = 0; i < this.categoryScores.length; i++) {
      const item = this.categoryScores[i];
      const label = `${item.category}: ${item.score}% (${item.kesimpulan})`;

      page.drawText(label, {
        x: 50,
        y: yOffset,
        size: 12,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });

      yOffset -= 18;

      let barColor = rgb(0.2, 0.6, 0.2); // Hijau
      if (item.score < 50) barColor = rgb(0.9, 0.2, 0.2); // Merah
      else if (item.score < 75) barColor = rgb(1, 0.8, 0); // Kuning

      // Progress bar
      page.drawRectangle({
        x: 50,
        y: yOffset,
        width: 400,
        height: 8,
        color: rgb(0.9, 0.9, 0.9)
      });
      page.drawRectangle({
        x: 50,
        y: yOffset,
        width: (item.score / 100) * 400,
        height: 8,
        color: barColor
      });

      yOffset -= 25;
    }

    yOffset -= 10;

    // Rekomendasi
    page.drawText("Rekomendasi:", {
      x: 50,
      y: yOffset,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0)
    });

    yOffset -= 30;

    for (let i = 0; i < this.recommendations.length; i++) {
      const text = `${i + 1}. ${this.recommendations[i]}`;
      const lines = this.wrapText(text, helveticaFont, 12, width - 100);

      for (const line of lines) {
        page.drawText(line, {
          x: 50,
          y: yOffset,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        });
        yOffset -= 20;
      }
      yOffset -= 10;
    }

    yOffset -= 20;

    

    yOffset -= 30;

    const chartCanvas = document.getElementById("scoreChart");
    if (chartCanvas) {
      const chartImage = await html2canvas(chartCanvas);
      const chartImageData = chartImage.toDataURL("image/png");
      const chartImageBytes = await fetch(chartImageData).then(res => res.arrayBuffer());
      const image = await pdfDoc.embedPng(chartImageBytes);

      const scaleFactor = (width - 100) / image.width;
      const scaledWidth = image.width * scaleFactor;
      const scaledHeight = image.height * scaleFactor;

      page.drawImage(image, {
        x: 50,
        y: yOffset - scaledHeight,
        width: scaledWidth,
        height: scaledHeight
      });

      yOffset -= scaledHeight + 40;
    }

    // File Terlampir
    if (Object.keys(this.uploadedFiles).length > 0) {
      page.drawText("File Terlampir:", {
        x: 50,
        y: yOffset,
        size: 14,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });

      yOffset -= 30;

      let fileNumber = 1;
      for (const [groupIndex, files] of Object.entries(this.uploadedFiles)) {
        if (files && Array.isArray(files)) {
          for (const file of files) {
            if (file instanceof File) {
              try {
                const fileArrayBuffer = await file.arrayBuffer();
                await pdfDoc.attach(fileArrayBuffer, file.name, {
                  mimeType: file.type,
                  description: `File pendukung untuk kategori ${parseInt(groupIndex) + 1}`,
                  creationDate: new Date(),
                  modificationDate: new Date()
                });

                page.drawText(`${fileNumber}. ${file.name}`, {
                  x: 50,
                  y: yOffset,
                  size: 12,
                  font: helveticaFont,
                  color: rgb(0, 0, 0)
                });

                yOffset -= 25;
                fileNumber++;
              } catch (error) {
                console.error(`Error attaching file ${file.name}:`, error);
              }
            }
          }
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}, 


// Fungsi helper untuk word wrap
wrapText(text, font, fontSize, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(`${currentLine} ${word}`, fontSize);
    
    if (width < maxWidth) {
      currentLine += ` ${word}`;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  lines.push(currentLine);
  return lines;
},

    // Method untuk menyimpan jawaban ke backend
    async saveAnswersToBackend() {
      const token = localStorage.getItem("access_token");
      
      try {
        const response = await axios.post(
          `https://spbebackend-production.up.railway.app/api/auth/save-audit-results/${this.auditeeId}`,
          {
            id: this.auditeeId,
            question_groups: this.questionGroups.map(group => ({
              category: group.category,
              questions: group.questions.map(question => ({
                id: question.id,
                answer: question.answer ? parseInt(question.answer) : null
              }))
            }))
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data) {
          console.log("Jawaban berhasil disimpan:", response.data);
          return true;
        }
  } catch (error) {
        console.error("Gagal menyimpan jawaban:", error);
        throw error;
      }
    },

    // Update method saveAndReturn untuk menggunakan saveAnswersToBackend
    async saveAndReturn() {
      try {
        // Simpan jawaban sementara ke localStorage
        await this.saveTemporaryAnswers();
        
        // Simpan jawaban ke backend
        await this.saveAnswersToBackend();

        // Tampilkan notifikasi sukses
        alert("Jawaban berhasil disimpan!");
        
        // Arahkan ke dashboard-default
        this.$router.push('/dashboard-default');
        
      } catch (error) {
        console.error("Gagal menyimpan jawaban:", error);
        alert("Terjadi kesalahan saat menyimpan jawaban. Silakan coba lagi.");
      }
    },

    // Tambahkan metode baru untuk menyimpan draft per grup
    async saveDraftForGroup(group, groupIndex) {
      if (group.draft_answer) {
        const success = await this.saveDraft(
          group.category || `Grup ${groupIndex + 1}`, 
          group.draft_answer
        );
        if (success) {
          group.is_draft = true;
        }
      }
    },

    // Update metode saveDraft untuk menyimpan berdasarkan kategori
    async saveDraft(category, draftAnswer) {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        this.$router.push('/login');
        return;
      }

      try {
        const response = await axios.post(
          `https://spbebackend-production.up.railway.app/api/draft-answers/category/${this.auditeeId}`,
          { 
            category: category,
            draft_answer: draftAnswer 
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.status === 'success') {
          console.log('Draft berhasil disimpan untuk kategori:', category);
          return true;
        } else {
          throw new Error(response.data.message || "Gagal menyimpan draft");
        }

      } catch (error) {
        console.error("Failed to save draft:", error);
        if (error.response) {
          console.error(error.response.data.message || "Gagal menyimpan draft. Silakan coba lagi.");
        }
        return false;
      }
    },

    async downloadPdf() {
      try {
        // Periksa apakah hasil audit sudah ada
        if (!this.showResults) {
          alert('Harap submit jawaban audit terlebih dahulu sebelum mengunduh PDF.');
          return;
        }

        // Tampilkan loading state
        const button = document.querySelector('.btn-primary');
        if (button) {
          button.textContent = 'Generating PDF...';
          button.disabled = true;
        }

        // Generate PDF
        const pdfBlob = await this.generateLocalPdf();
        
        // Buat URL untuk download
        const url = window.URL.createObjectURL(pdfBlob);
        
        // Buat element anchor untuk download
        const link = document.createElement('a');
        link.href = url;
        link.download = `Hasil_Audit_${this.auditeeId}.pdf`;
        
        // Tambahkan ke document dan klik
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Kembalikan state button
        if (button) {
          button.textContent = 'Download PDF';
          button.disabled = false;
        }

      } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Terjadi kesalahan saat mengunduh PDF. Silakan coba lagi.');
        
        // Kembalikan state button jika terjadi error
        const button = document.querySelector('.btn-primary');
        if (button) {
          button.textContent = 'Download PDF';
          button.disabled = false;
        }
      }
    },
  },
  mounted() {
    this.fetchQuestions();
    this.setupAutoSave();
  },
  beforeUnmount() {
    this.cleanupAutoSave();
  },
};
</script>


<style scoped>
/* Container utama */
.audit-container {
  font-family: 'Roboto', sans-serif;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  background: #f4f7fa;
  border-radius: 8px;
}

/* Judul utama */
.audit-title {
  font-size: 2.5rem;
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

/* Subjudul dan informasi */
h2 {
  color: #4CAF50;
  font-size: 1.8rem;
  margin-bottom: 10px;
}

.info-text {
  font-size: 1rem;
  color: #666;
  margin-bottom: 20px;
}

/* Grup pertanyaan */
.question-group-title {
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: #333;
}

/* Card untuk pertanyaan */
.question-card {
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
}

/* Label pertanyaan */
.question-label {
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
  color: #333;
}

/* Input dropdown untuk jawaban */
.question-input {
  width: 100%;
  padding: 10px;
  margin-top: 5px;
  font-size: 1rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  outline: none;
}

.question-input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
}

/* Tombol aksi */
.submit-btn,
.pdf-btn,
.send-btn {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 15px;
  font-size: 1rem;
  display: inline-block;
  transition: background-color 0.3s ease;
}

.submit-btn:hover,
.pdf-btn:hover,
.send-btn:hover {
  background-color: #45a049;
}

.send-btn[disabled] {
  background-color: #bdbdbd;
  cursor: not-allowed;
}

/* Tidak ada pertanyaan */
.no-questions {
  font-size: 1.2rem;
  text-align: center;
  margin-top: 50px;
  color: #666;
}

/* Hasil audit */
.audit-results-section {
  padding: 2rem;
}

.main-score-card {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.score-header {
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-score-circle {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 120px;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
}

.score-value {
  font-size: 2rem;
  font-weight: bold;
}

.score-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.card {
  border: none;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
}

.card-header {
  background-color: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.category-scores-grid {
  display: grid;
  gap: 1rem;
}

.category-score-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 10px;
}

.category-score-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.score-bar-container {
  background: #e9ecef;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.score-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 1s ease-out;
}

.recommendations-list, .improvement-list {
  list-style: none;
  padding: 0;
}

.recommendation-item, .improvement-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chart-card {
  margin-bottom: 2rem;
}

.chart-container {
  position: relative;
  height: 400px;
  padding: 1rem;
  margin: 0 auto;
  max-width: 100%;
}

.chart-container canvas {
  max-height: 100%;
  width: 100% !important;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
  padding: 1rem 0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  min-width: 180px;
  justify-content: center;
}

.btn-primary {
  background-color: #4CAF50;
  border-color: #4CAF50;
}

.btn-success {
  background-color: #45a049;
  border-color: #45a049;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.navigation-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.save-return-btn {
  background-color: #2196F3;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.save-return-btn:hover {
  background-color: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.15);
}

.prev-btn,
.next-btn {
  background-color: #757575;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.prev-btn:hover,
.next-btn:hover {
  background-color: #616161;
}

@media (max-width: 768px) {
  .chart-container {
    height: 300px;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .btn {
    width: 100%;
    max-width: 250px;
  }

  .navigation-buttons {
    flex-direction: column;
    align-items: center;
  }

  .save-return-btn,
  .prev-btn,
  .next-btn {
    width: 100%;
    max-width: 250px;
    justify-content: center;
  }
}

.draft-answer-section {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
}

.draft-label {
  display: block;
  margin-bottom: 0.5rem;
  color: #6c757d;
    font-size: 0.9rem;
}

.draft-input {
  width: 100%;
  min-height: 80px;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  resize: vertical;
  font-size: 0.9rem;
}

.draft-input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
}

.draft-status {
  margin-top: 0.5rem;
  color: #28a745;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.draft-status i {
  font-size: 1rem;
}

/* Animasi untuk status draft */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.draft-status {
  animation: fadeIn 0.3s ease-in-out;
}

/* Loading styles */
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

/* Error styles */
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

/* Compact Audit Results Styles */
.audit-results-compact {
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 1rem;
  margin-top: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #4CAF50;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.results-title {
  font-size: 1.5rem;
  margin: 0;
}

.total-score {
  font-size: 1.5rem;
  font-weight: bold;
}

.category-header, .recommendation-header {
  font-size: 1.2rem;
  margin: 1rem 0 0.5rem 0;
  color: #333;
}

.category-scores-container {
  margin-bottom: 1.5rem;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-item {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 0.25rem 1rem;
  align-items: center;
}

.category-name {
  font-weight: 500;
  grid-column: 1;
  grid-row: 1;
}

.score-bar-container {
  position: relative;
  background: #e9ecef;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  grid-column: 1 / span 2;
  grid-row: 2;
}

.score-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease-out;
}

.score-value {
  position: absolute;
  right: 0;
  top: -16px;
  font-size: 0.8rem;
  font-weight: bold;
}

.score-label {
  font-size: 0.85rem;
  color: #666;
  grid-column: 2;
  grid-row: 1;
  text-align: right;
}

.recommendations-compact {
  margin: 1.5rem 0;
}

.recommendations-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9rem;
  background-color: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  border-left: 3px solid #4CAF50;
}

.recommendation-item i {
  color: #4CAF50;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.action-buttons .btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .category-item {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }
  
  .category-name {
    grid-column: 1;
    grid-row: 1;
  }
  
  .score-bar-container {
    grid-column: 1;
    grid-row: 2;
  }
  
  .score-label {
    grid-column: 1;
    grid-row: 3;
    text-align: left;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>

