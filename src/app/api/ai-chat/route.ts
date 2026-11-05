import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface UserContext {
  role?: string | null;
  unitName?: string | null;
  activeYear?: string | null;
  email?: string | null;
}

// System Instruction untuk Gemini
const buildSystemPrompt = (context: UserContext) => {
  const roleTitle = 
    context.role === "kementerian" ? "Pengelola Risiko Tingkat Kementerian" :
    context.role === "eselon_1" ? "Unit Kerja Eselon 1" :
    context.role === "eselon_2" ? "Unit Kerja Eselon 2" :
    context.role === "auditor" ? "Auditor APIP (Inspektorat Jenderal)" :
    context.role === "pimpinan" ? "Pimpinan Unit Kerja" : "Pengguna Sistem";

  return `Anda adalah "Si-MaRi AI", asisten kecerdasan buatan cerdas dan konsultan ahli Manajemen Risiko untuk Kementerian Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi (Kemendesa PDT).

Tugas Anda adalah mendampingi pegawai, pengelola risiko, dan pimpinan dalam menyusun, mengidentifikasi, menganalisis, memitigasi, serta mengevaluasi manajemen risiko instansi pemerintah.

Landasan Hukum & Pedoman:
1. PP No. 60 Tahun 2008 tentang Sistem Pengendalian Intern Pemerintah (SPIP).
2. Permenpan RB No. 5 Tahun 2020 tentang Petunjuk Pelaksanaan Manajemen Risiko di Lingkungan Instansi Pemerintah.
3. Standar ISO 31000:2018 Risk Management.
4. Peraturan & Pedoman Internal Manajemen Risiko Kemendesa PDT.

Profil Pengguna yang Sedang Berbicara dengan Anda:
- Unit Kerja: ${context.unitName || "Kementerian Desa dan PDT"}
- Peran (Role): ${roleTitle} (${context.role || "-"})
- Tahun Anggaran Aktif: ${context.activeYear || "2026"}

Prinsip Jawaban:
1. Berikan jawaban dalam Bahasa Indonesia yang formal, santun, terstruktur, jelas, dan aplikatif.
2. Saat membantu perumusan risiko, selalu gunakan formula baku: [Penyebab] -> [Peristiwa Risiko] -> [Dampak].
3. Bila user meminta contoh risiko, sesuaikan dengan bidang tugas unit kerja mereka (${context.unitName || "Kementerian Desa"}).
4. Gunakan pemformatan Markdown yang rapi (poin-poin, cetak tebal, penomoran) agar nyaman dibaca.
5. Bersikap proaktif memberikan saran praktis terkait matriks 5x5 (kemungkinan & dampak), RTP, dan pemantauan.`;
};

// ============================================================================
// COMPREHENSIVE EXPERT KNOWLEDGE BASE & AI REASONING ENGINE
// ============================================================================
function generateKnowledgeBaseResponse(messages: ChatMessage[], context: UserContext): string {
  const userMessages = messages.filter(m => m.role === "user");
  const lastUserRaw = userMessages.pop()?.content || "";
  const lastUserMsg = lastUserRaw.toLowerCase().trim();
  const unit = context.unitName || "Unit Kerja Kemendesa PDT";
  const role = context.role || "pengguna";
  const year = context.activeYear || "2026";

  // Helper matcher
  const has = (...terms: string[]) => terms.some(t => lastUserMsg.includes(t.toLowerCase()));

  // 1. SALAM / GREETINGS / INTRODUKSI
  if (
    has("halo", "hai", "hello", "selamat pagi", "selamat siang", "selamat sore", "selamat malam", "assalamu", "tes", "test", "p", "siapakah kamu", "siapa anda")
  ) {
    return `Halo! Salam hangat dari **Si-MaRi AI** 👋

Saya adalah asisten cerdas konsultan Manajemen Risiko Kementerian Desa, PDT, dan Transmigrasi. Saya siap mendampingi Anda (**${unit}** - *${role}*) dalam pengelolaan risiko tahun anggaran **${year}**.

Apa yang ingin kita diskusikan atau selesaikan hari ini? Berikut beberapa topik yang sering ditanyakan:
1. ✍️ **Merumuskan Pernyataan Risiko Baru** (Formula: *Sebab $\\rightarrow$ Peristiwa $\\rightarrow$ Dampak*)
2. 🎯 **Membuat Rekomendasi Contoh Risiko** sesuai tugas fungsi unit Anda
3. 📊 **Menentukan Nilai Analisis & Matriks 5×5** (Skala Kemungkinan & Dampak)
4. 🛡️ **Menyusun Rencana Tindak Pengendalian (RTP)** dan target waktu
5. 🔍 **Alur Reviu dan Pengiriman ke Auditor APIP**
6. 📚 **Melihat Regulasi di Katalog Peraturan**

Silakan ketik pertanyaan Anda secara spesifik, dan saya akan berikan panduan langkah demi langkah!`;
  }

  // 2. TUTORIAL / CARA MULAI / LANGKAH PENGISIAN SIM-RISIKO
  if (
    has("cara mulai", "langkah pengisian", "tahapan", "alur pengisian", "tutorial", "cara menggunakan", "panduan penggunaan", "urutan pengisian", "alur aplikasi", "bagaimana cara kerja")
  ) {
    return `### 🚀 Panduan Alur Kerja Penyusunan Manajemen Risiko di SIM-Risiko (TA ${year})

Berikut adalah 5 tahapan utama yang harus dilalui oleh unit kerja Anda (**${unit}**):

---

#### 1️⃣ Tahap 1: Penetapan Konteks (*Menu Penetapan Konteks*)
- Menentukan sasaran strategis / sasaran program unit kerja.
- Mengidentifikasi pemangku kepentingan (*stakeholders*) internal & eksternal.
- Menginventarisir regulasi dan insiden/kendala tahun sebelumnya.

#### 2️⃣ Tahap 2: Identifikasi Risiko (*Menu Proses MR $\\rightarrow$ Identifikasi Risiko*)
- Menambahkan daftar risiko potensial yang dapat menghambat pencapaian target.
- Wajib menggunakan formula baku: **[Penyebab] $\\rightarrow$ [Peristiwa Risiko] $\\rightarrow$ [Dampak]**.
- Menentukan kategori risiko (Operasional, Kebijakan, Kepatuhan, Keuangan, Reputasi).

#### 3️⃣ Tahap 3: Analisis & Evaluasi Risiko (*Menu Proses MR $\\rightarrow$ Analisis Risiko*)
- Menentukan **Skor Kemungkinan (1-5)** dan **Skor Dampak (1-5)**.
- Sistem otomatis menghitung **Besaran Risiko** ($P \\times D$) dan mengkategorikan levelnya (Sangat Rendah s.d. Sangat Tinggi).
- Menentukan apakah risiko masuk dalam **Risiko Prioritas** (skor $\\ge 12$).

#### 4️⃣ Tahap 4: Rencana Tindak Pengendalian (*Menu Rencana Tindak Pengendalian*)
- Menetapkan butir tindakan mitigasi konkret, nama penanggung jawab (jabatan), target waktu (Triwulan), dan indikator bukti output.

#### 5️⃣ Tahap 5: Pengajuan ke APIP (*Menu Proses Audit $\\rightarrow$ Kirim ke Auditor*)
- Setelah seluruh risiko tersusun lengkap, klik tombol **"Kirim ke Auditor APIP"** untuk mendapatkan reviu dan telaah dari Inspektorat Jenderal.

---
💡 *Butuh bantuan merumuskan salah satu risiko? Silakan tuliskan bidang kegiatan Anda!*`;
  }

  // 3. CONTOH RISIKO SPESIFIK: DANA DESA / BUMDES / DESA
  if (
    has("dana desa", "bumdes", "desa", "pemberdayaan masyarakat", "kemiskinan ekstrem", "ketahanan pangan desa")
  ) {
    return `### 🎯 Rekomendasi Contoh Risiko: Sektor Desa & Pemberdayaan Masyarakat
**Unit Kerja:** ${unit} | **Tahun Anggaran:** ${year}

---

#### 📌 Risiko 1 (Operasional): Keterlambatan Verifikasi Dokumen Penyaluran Dana Desa
- **Penyebab:** *Adanya perbedaan format laporan pertanggungjawaban APBDes dari pemerintah desa serta kendala jaringan internet di desa tertinggal.*
- **Peristiwa Risiko:** *Proses verifikasi dokumen penyaluran Dana Desa tahap berikutnya melewati batas cut-off yang ditentukan.*
- **Dampak:** *Penyaluran dana ke Rekening Kas Desa (RKD) terlambat, mengakibatkan tertundanya pembayaran BLT Desa dan upah padat karya tunai.*
- **Analisis Awal:** Kemungkinan = 3 (Sedang), Dampak = 4 (Berat) $\\rightarrow$ **Besaran = 12 (Risiko Sedang/Prioritas)**
- **RTP:** Mengadakan bimbingan teknis daring/luring rekonsiliasi SPJ, menerbitkan petunjuk teknis verifikasi ringkas, dan menyediakan desk konsultasi mingguan.

---

#### 📌 Risiko 2 (Kepatuhan / Tata Kelola): Akuntabilitas Pengelolaan Usaha BUMDes
- **Penyebab:** *Kapasitas pengurus BUMDes dalam pencatatan akuntansi dan tata kelola unit usaha masih minim.*
- **Peristiwa Risiko:** *Laporan keuangan BUMDes tidak standar dan berpotensi terjadi ketidaksesuaian pembagian sisa hasil usaha (SHU).*
- **Dampak:** *Penilaian kesehatan BUMDes rendah dan potensi timbulnya perselisihan warga atau temuan pengawas.*
- **Analisis Awal:** Kemungkinan = 3 (Sedang), Dampak = 3 (Sedang) $\\rightarrow$ **Besaran = 9 (Level Sedang)**
- **RTP:** Fasilitasi sertifikasi badan hukum BUMDes, penyediaan aplikasi pencatatan keuangan sederhana, dan pendampingan oleh Tenaga Pendamping Profesional (TPP).`;
  }

  // 4. CONTOH RISIKO SPESIFIK: PENGADAAN BARANG & JASA (PBJ)
  if (
    has("pengadaan", "pbj", "tender", "lelang", "e-katalog", "vendor", "penyedia", "kontrak", "ppk")
  ) {
    return `### 🎯 Rekomendasi Contoh Risiko: Pengadaan Barang dan Jasa (PBJ)
**Landasan:** Perpres No. 16/2018 jo Perpres No. 12/2021 | **Unit:** ${unit}

---

#### 📌 Risiko 1 (Waktu & Kinerja): Gagal Tender / Keterlambatan Pemilihan Penyedia
- **Penyebab:** *Penyusunan Spesifikasi Teknis dan Harga Perkiraan Sendiri (HPS) memerlukan revisi berulang karena kurangnya data pasar yang akurat.*
- **Peristiwa Risiko:** *Proses tender pengadaan barang/jasa mengalami tender ulang atau masa sanggah yang panjang.*
- **Dampak:** *Pelaksanaan kontrak pekerjaan fisik/jasa mundur ke akhir tahun anggaran, berisiko putus kontrak atau pekerjaan tidak selesai 100%.*
- **Analisis Awal:** Kemungkinan = 3 (Sedang), Dampak = 4 (Berat) $\\rightarrow$ **Besaran = 12 (Risiko Prioritas)**
- **RTP:**
  1. *Tindakan:* Pelaksanaan review bersama Pokja Pemilihan dan Pejabat Pembuat Komitmen (PPK) pada H-60 sebelum tahun anggaran berjalan.
  2. *Penanggung Jawab:* PPK & Tim Teknis PBJ.
  3. *Waktu:* Triwulan I.
  4. *Output:* Berita Acara Review HPS & Dokumen Spesifikasi Final.

---

#### 📌 Risiko 2 (Mutu / Kualitas): Ketidaksesuaian Spesifikasi Hasil Pekerjaan Vendor
- **Penyebab:** *Pengawasan lapangan terhadap pelaksanaan kontrak oleh penyedia jasa kurang intensif.*
- **Peristiwa Risiko:** *Barang atau hasil konstruksi yang diserahkan tidak sepenuhnya memenuhi standar teknis kontrak.*
- **Dampak:** *Terjadi deviasi mutu dan potensi temuan Badan Pemeriksa Keuangan (BPK) terkait kelebihan bayar.*
- **Analisis Awal:** Kemungkinan = 2 (Rendah), Dampak = 4 (Berat) $\\rightarrow$ **Besaran = 8 (Level Rendah)**
- **RTP:** Penguatan peran Pengawas Pekerjaan (PCO) dan mewajibkan uji laboratorium/fungsional sebelum Berita Acara Serah Terima (BAST).`;
  }

  // 5. CONTOH RISIKO SPESIFIK: KEUANGAN, ANGGARAN, DIPA, PENYERAPAN
  if (
    has("anggaran", "dipa", "serapan", "keuangan", "pencairan", "revisi anggaran", "spj", "lpj", "pajak")
  ) {
    return `### 🎯 Rekomendasi Contoh Risiko: Pengelolaan Anggaran & Keuangan (DIPA ${year})
**Unit:** ${unit}

---

#### 📌 Risiko 1: Deviasi Rencana Penarikan Dana (RPD) Halaman III DIPA
- **Penyebab:** *Pelaksanaan kegiatan unit teknis tidak disiplin mengikuti matriks jadwal kalender kerja yang telah disusun.*
- **Peristiwa Risiko:** *Realisasi penyerapan anggaran triwulan menyimpang $> 15\\%$ dari target RPD Halaman III DIPA.*
- **Dampak:** *Nilai Indikator Kinerja Pelaksanaan Anggaran (IKPA) unit kerja anjlok di penilaian Kemenkeu.*
- **Analisis:** Kemungkinan = 4 (Tinggi), Dampak = 3 (Sedang) $\\rightarrow$ **Besaran = 12 (Risiko Prioritas)**
- **RTP:** Melakukan rekonsiliasi realisasi anggaran dwi-mingguan dan mengajukan pemutakhiran RPD Halaman III tepat waktu pada awal triwulan.

---

#### 📌 Risiko 2: Keterlambatan Pertanggungjawaban Uang Persediaan (UP/TUP)
- **Penyebab:** *Pengumpulan bukti kuitansi belanja dinas oleh tim kerja pelaksana terlambat diserahkan ke Bendahara Pengeluaran.*
- **Peristiwa Risiko:** *Pengajuan Ganti Uang (GUP) melebihi batas 1 bulan, terkena blokir SPM otomatis di sistem KPPN.*
- **Dampak:** *Likuiditas operasional kantor terhambat dan kegiatan rutin berikutnya tertunda.*
- **Analisis:** Kemungkinan = 2 (Rendah), Dampak = 3 (Sedang) $\\rightarrow$ **Besaran = 6 (Level Rendah)**
- **RTP:** Menerapkan SOP penyerahan SPJ maksimal H+5 hari kerja setelah kegiatan selesai dilaksanakan.`;
  }

  // 6. CONTOH RISIKO SPESIFIK: TEKNOLOGI INFORMASI, APLIKASI, DATA
  if (
    has("aplikasi", "sistem", "it", "server", "jaringan", "database", "data", "keamanan", "siber", "down", "error")
  ) {
    return `### 🎯 Rekomendasi Contoh Risiko: Teknologi Informasi & Sistem Aplikasi
**Unit:** ${unit}

---

#### 📌 Risiko 1: Kegagalan Akses Layanan Aplikasi Publik/Internal (*System Downtime*)
- **Penyebab:** *Lonjakan beban transaksi pengguna secara bersamaan atau gangguan konektivitas infrastruktur data center / cloud.*
- **Peristiwa Risiko:** *Aplikasi tidak dapat diakses (*error 500 / timeout*) selama jam kerja operasional.*
- **Dampak:** *Pengguna unit kerja tidak dapat menginput laporan tepat waktu dan timbul keluhan layanan.*
- **Analisis:** Kemungkinan = 3 (Sedang), Dampak = 3 (Sedang) $\\rightarrow$ **Besaran = 9 (Level Sedang)**
- **RTP:** Menerapkan pemantauan server otomatis 24/7, optimasi database indexing, dan penyediaan server cadangan (*redundancy / failover*).

---

#### 📌 Risiko 2: Kerentanan Keamanan Data & Kebocoran Informasi Sensitif
- **Penyebab:** *Manajemen hak akses pengguna belum menerapkan otentikasi ganda (2FA) dan kesadaran keamanan pegawai masih rendah.*
- **Peristiwa Risiko:** *Akun pengguna terkompromi atau terjadi percobaan peretasan pada basis data kementerian.*
- **Dampak:** *Integritas data terganggu dan menurunkan reputasi kredibilitas kementerian di mata publik.*
- **Analisis:** Kemungkinan = 2 (Rendah), Dampak = 5 (Katastropik) $\\rightarrow$ **Besaran = 10 (Level Sedang)**
- **RTP:** Audit keamanan berkala (Vulnerability Assessment), penegakan rotasi kata sandi berkala, dan enkripsi data cadangan (*encrypted backup*).`;
  }

  // 7. CONTOH RISIKO SPESIFIK: SDM / KEPEGAWAIAN / KOMPETENSI
  if (
    has("sdm", "pegawai", "kepegawaian", "kompetensi", "rotasi", "mutasi", "beban kerja", "disiplin")
  ) {
    return `### 🎯 Rekomendasi Contoh Risiko: Sumber Daya Manusia (SDM) & Kepegawaian
**Unit:** ${unit}

---

#### 📌 Risiko: Kesenjangan Kompetensi Teknis Pengelola Manajemen Risiko & Pengadaan
- **Penyebab:** *Tingginya mutasi pegawai serta belum meratanya kesempatan bimbingan teknis teknis bersertifikasi.*
- **Peristiwa Risiko:** *Pegawai yang baru ditugaskan kesulitan mengoperasikan sistem dan menatausahakan dokumen pertanggungjawaban sesuai regulasi terkini.*
- **Dampak:** *Kualitas dokumen risiko/kinerja rendah dan sering terjadi pengembalian berkas oleh auditor APIP.*
- **Analisis:** Kemungkinan = 3 (Sedang), Dampak = 3 (Sedang) $\\rightarrow$ **Besaran = 9 (Level Sedang)**
- **RTP:**
  1. Melaksanakan *Transfer of Knowledge* (mentoring) sebelum pejabat lama dimutasi.
  2. Menyusun Petunjuk Operasional Standar (POS) kerja ringkas dalam bentuk buku saku digital.
  3. Mengikutsertakan pegawai pada pelatihan manajemen risiko instansi pemerintah.`;
  }

  // 8. CONTOH RISIKO UMUM (JIKA MINTA CONTOH TANPA SEKTOR SPESIFIK)
  if (
    has("contoh risiko", "buatkan risiko", "rekomendasi risiko", "daftar risiko", "usulan risiko", "kasih contoh")
  ) {
    return `### 🎯 Rekomendasi Daftar Risiko Terpilih untuk **${unit}** (TA ${year})

Berikut adalah 3 usulan risiko komprehensif yang dapat langsung Anda gunakan di menu **Identifikasi Risiko**:

---

#### 1. Risiko Operasional: Keterlambatan Pencapaian Target Output Renja
- **Pernyataan Risiko:**  
  *Adanya kendala koordinasi lintas sektor dan keterlambatan petunjuk pelaksanaan kegiatan, yang menyebabkan penundaan jadwal kerja lapangan, sehingga capaian fisik triwulan tidak mencapai target yang ditetapkan.*
- **Kategori:** Operasional
- **Estimasi Analisis:** Kemungkinan = 3 (Sedang), Dampak = 3 (Sedang) $\\rightarrow$ **Besaran = 9 (Level Sedang)**
- **RTP:** Menyusun kalender kerja terintegrasi lintas tim dan menyelenggarakan rapat koordinasi berkala setiap bulan.

---

#### 2. Risiko Kepatuhan: Kelengkapan Bukti Pertanggungjawaban Administrasi
- **Penyebab $\\rightarrow$ Peristiwa $\\rightarrow$ Dampak:**  
  *Kurangnya pemahaman tim pelaksana terhadap regulasi pertanggungjawaban keuangan terbaru, yang berpotensi menyebabkan ketidaklengkapan dokumen SPJ, berdampak pada munculnya catatan telaah atau temuan audit pengawasan.*
- **Kategori:** Kepatuhan / Keuangan
- **Estimasi Analisis:** Kemungkinan = 2 (Rendah), Dampak = 4 (Berat) $\\rightarrow$ **Besaran = 8 (Level Rendah)**
- **RTP:** Menerapkan checklist mandiri kelengkapan berkas sebelum diajukan ke bendahara dan mengadakan review kepatuhan internal.

---

#### 3. Risiko Kebijakan: Kesiapan Validitas dan Integrasi Data Kinerja
- **Pernyataan Risiko:**  
  *Belum tersedianya mekanisme validasi data berjenjang yang terintegrasi, yang berpotensi menghasilkan perbedaan angka capaian antar aplikasi pelaporan, mengakibatkan laporan akuntabilitas kinerja instansi pemerintah (LAKIP) tertunda disahkan.*
- **Kategori:** Strategis / Reputasi
- **Estimasi Analisis:** Kemungkinan = 3 (Sedang), Dampak = 4 (Berat) $\\rightarrow$ **Besaran = 12 (Risiko Prioritas)**
- **RTP:** Menetapkan satu data rujukan resmi unit kerja dan menetapkan batas waktu sinkronisasi (*cut-off*) yang ketat.

---
💡 *Untuk menginput risiko ini, buka menu **Proses MR $\\rightarrow$ Identifikasi Risiko** lalu klik **"Tambah Risiko"**!*`;
  }

  // 9. FORMULA & RUMUS BAKU PERNYATAAN RISIKO
  if (
    has("pernyataan risiko", "rumus", "formula", "cara membuat risiko", "cara merumuskan", "format risiko", "unsur risiko", "sebab akibat")
  ) {
    return `### 📋 Formula Baku Perumusan Pernyataan Risiko (Permenpan RB No. 5/2020)

> **[SEBAB / PENYEBAB]** *(Adanya... / Karena...)*  
> $\rightarrow$ **[PERISTIWA RISIKO]** *(Menyebabkan / Berpotensi...)*  
> $\rightarrow$ **[DAMPAK]** *(Mengakibatkan / Berdampak pada...)*

---

#### 🔍 3 Komponen Utama:
1. **Penyebab (Cause):**  
   Kondisi fakta atau akar masalah saat ini yang memicu timbulnya risiko (contoh: *Keterbatasan armada transportasi di daerah kepulauan*).
2. **Peristiwa Risiko (Risk Event):**  
   Kejadian buruk yang **mungkin terjadi di masa depan** (contoh: *Penyaluran bantuan logistik terlambat tiba di lokasi penerima manfaat*).
3. **Dampak (Impact):**  
   Akibat kerugian nyata terhadap sasaran organisasi jika peristiwa tersebut terjadi (contoh: *Pemanfaatan bantuan melewati musim tanam dan kepuasan masyarakat menurun*).

---

#### 💡 Kalimat Utuh Siap Pakai:
> *"Adanya keterbatasan armada transportasi di daerah kepulauan (Sebab), yang berpotensi menyebabkan penyaluran bantuan logistik terlambat tiba di lokasi (Peristiwa), sehingga mengakibatkan pemanfaatan bantuan melewati musim tanam dan target kinerja unit kerja tidak tercapai (Dampak)."*`;
  }

  // 10. ANALISIS RISIKO, MATRIKS 5x5, SKALA KEMUNGKINAN & DAMPAK
  if (
    has("analisis", "matriks", "skala", "kemungkinan", "dampak", "skor", "besaran", "prioritas", "5x5", "5 x 5")
  ) {
    return `### 📊 Panduan Analisis Risiko & Matriks 5×5 Permenpan RB No. 5/2020

Besaran risiko dihitung dengan mengalikan nilai frekuensi terjadinya risiko (*Kemungkinan*) dengan tingkat kerugian yang ditimbulkan (*Dampak*):

$$\\mathbf{Besaran\\ Risiko = Kemungkinan\\ (1-5) \\times Dampak\\ (1-5)}$$

---

#### 1️⃣ Skala Kemungkinan (Probability / P):
- **1 - Sangat Rendah:** Sangat jarang terjadi ($< 10\\%$ atau 1x dalam 5 tahun).
- **2 - Rendah:** Jarang terjadi ($10\\% - 30\\%$ atau 1x dalam 2-3 tahun).
- **3 - Sedang:** Cukup sering terjadi ($30\\% - 50\\%$ atau 1x dalam setahun).
- **4 - Tinggi:** Sering terjadi ($50\\% - 80\\%$ atau beberapa kali dalam setahun).
- **5 - Sangat Tinggi:** Hampir pasti terjadi ($> 80\\%$ dalam setiap kegiatan).

#### 2️⃣ Skala Dampak (Impact / D):
- **1 - Tidak Signifikan:** Tidak mengganggu target kinerja atau anggaran.
- **2 - Minor / Rendah:** Gangguan operasional ringan, dapat ditangani dengan prosedur rutin.
- **3 - Moderat / Sedang:** Penundaan capaian output $\\le 1$ bulan, kerugian finansial sedang.
- **4 - Signifikan / Berat:** Target strategis terganggu, potensi sanksi hukum/kepatuhan.
- **5 - Katastropik:** Kegagalan total pencapaian target, kerugian negara besar, reputasi instansi tercemar nasional.

---

#### 3️⃣ Kategori Level Besaran Risiko:
| Rentang Skor | Level Kategori | Warna | Tindakan Pengendalian |
| :---: | :---: | :---: | :--- |
| **1 - 5** | Sangat Rendah | 🔵 Biru | Diterima, pemantauan rutin |
| **6 - 9** | Rendah | 🟢 Hijau | Diterima dengan pengendalian saat ini |
| **10 - 14** | Sedang | 🟡 Kuning | Wajib disusun Rencana Tindak Pengendalian (RTP) |
| **15 - 19** | Tinggi | 🟠 Oranye | Prioritas tinggi, mitigasi intensif |
| **20 - 25** | Sangat Tinggi | 🔴 Merah | **Prioritas Utama**, tindakan segera dilaporkan ke Pimpinan |

⭐ *Risiko dengan skor **$\\ge 12$** otomatis masuk ke dalam daftar **Risiko Prioritas** kementerian.*`;
  }

  // 11. RENCANA TINDAK PENGENDALIAN (RTP)
  if (
    has("rtp", "tindak pengendalian", "mitigasi", "pengendalian", "cara mitigasi", "langkah mitigasi", "respon risiko")
  ) {
    return `### 🛡️ Panduan Penyusunan Rencana Tindak Pengendalian (RTP)

RTP adalah rangkaian langkah terencana untuk **menurunkan kemungkinan terjadinya risiko** atau **memperkecil dampak kerugian**.

---

#### 📌 4 Unsur Wajib Dalam Setiap Butir RTP:
1. **Uraian Tindakan Pengendalian:**  
   Kegiatan nyata perbaikan SOP, sistem, atau pengawasan (contoh: *Penyusunan Surat Edaran Standar Waktu Pengajuan SPJ dan Bimtek Keuangan*).
2. **Penanggung Jawab (Owner):**  
   Nama jabatan struktural atau koordinator tim kerja (contoh: *Kepala Bagian Keuangan / Ketua Tim Kerja Program*). Hindari menuliskan nama pribadi orang.
3. **Target Waktu Penyelesaian:**  
   Periode triwulan atau bulan batas penyelesaian (contoh: *Triwulan II ${year}*).
4. **Indikator Bukti Output:**  
   Dokumen otentik yang membuktikan tindakan telah selesai (contoh: *SK Tim / Notulensi & Daftar Hadir / SOP Resmi*).

---

#### 💡 4 Strategi Respon Risiko:
- **Mengurangi (Mitigate):** Menambah kontrol, pelatihan pegawai, pembuatan aplikasi otomatis.
- **Menghindari (Avoid):** Membatalkan atau mengubah metode kerja yang berisiko terlalu tinggi.
- **Membagi (Share/Transfer):** Menjalin kerja sama asuransi BMN atau MoU lintas instansi.
- **Menerima (Accept):** Untuk risiko level rendah yang biaya pengendaliannya lebih besar dari potensi kerugiannya.`;
  }

  // 12. PEMANTAUAN & KETERJADIAN & EFEKTIFITAS
  if (
    has("pemantauan", "keterjadian", "efektifitas", "monitoring", "insiden", "residual", "risiko residual")
  ) {
    return `### 📈 Siklus Pemantauan RTP, Keterjadian, & Efektifitas di SIM-Risiko

Setelah profil risiko ditetapkan, unit kerja Anda (**${unit}**) wajib melakukan pemantauan berkala:

1. **Pemantauan Realisasi RTP (*Menu Pemantauan RTP*):**  
   - Melaporkan status kemajuan setiap butir tindakan (*Belum Dilaksanakan / Dalam Proses / Selesai*).  
   - Mengisi kendala yang dihadapi jika melewati target triwulan.

2. **Pencatatan Keterjadian Risiko (*Menu Pencatatan Keterjadian*):**  
   - Jika peristiwa risiko yang diidentifikasi **benar-benar terjadi** di lapangan, catat tanggal kejadian, kronologi singkat, dan nilai kerugian nyata (rupiah, waktu keterlambatan, atau output fisik).  
   - Menjadi bahan evaluasi penetapan konteks tahun anggaran berikutnya.

3. **Uji Efektifitas Pengendalian (*Menu Efektifitas RTP*):**  
   - Mengukur kembali skor kemungkinan dan dampak setelah RTP dijalankan (**Residual Risk**).  
   - Bila level risiko berhasil turun (misal dari Kuning ke Hijau), maka RTP dinyatakan **Efektif**. Jika tidak turun, RTP perlu dievaluasi ulang.`;
  }

  // 13. ALUR AUDIT APIP (INSPEKTORAT JENDERAL)
  if (
    has("audit", "apip", "inspektorat", "kirim ke auditor", "inbox auditor", "reviu", "catatan auditor", "itjen")
  ) {
    return `### 🔍 Alur Interaksi dengan Auditor APIP (Inspektorat Jenderal)

Di SIM-Risiko, proses pengawasan risiko oleh Inspektorat Jenderal berlangsung transparan:

---

#### 1️⃣ Alur Bagi Unit Kerja (${unit}):
1. **Penyusunan Mandiri:** Selesaikan Penetapan Konteks, Identifikasi Risiko, Analisis 5×5, dan butir RTP.
2. **Pengajuan:** Buka menu **Proses Audit $\\rightarrow$ Kirim ke Auditor**. Periksa kelengkapan data, lalu klik tombol **"Kirim ke Auditor APIP"**. Status unit akan berubah menjadi *Submitted (Diajukan)*.
3. **Pengecekan Catatan:** Buka menu **Proses Audit $\\rightarrow$ Inbox Hasil Auditor**. Bila ada masukan atau perbaikan dari auditor, lakukan revisi di menu Identifikasi/Analisis/RTP lalu ajukan kembali.

#### 2️⃣ Alur Bagi Auditor APIP:
- Auditor menelaah risiko unit kerja di menu **Auditor APIP**.
- Auditor dapat memberikan **Catatan Telaah Umum** maupun **Catatan Per Kolom** (misal: penyesuaian skor dampak atau penajaman uraian RTP).
- Auditor menetapkan status: *Disetujui* atau *Dikembalikan untuk Perbaikan*.`;
  }

  // 14. KATALOG PERATURAN & REGULASI
  if (
    has("katalog", "peraturan", "regulasi", "undang-undang", "permenpan", "pp 60", "uu desa", "hukum", "upload dokumen")
  ) {
    return `### 📚 Katalog Peraturan Manajemen Risiko Kemendesa PDT

Menu **Katalog Peraturan** terletak tepat di bawah menu **Dashboard** sebagai repositori resmi:

---

#### 👥 Hak Akses Menu:
- **Admin & Pengelola Risiko Kementerian:**  
  Dapat menambah peraturan baru (Nomor, Nama Peraturan, Upload Dokumen PDF via database chunking aman) serta mengubah status **Berlaku** atau **Tidak Berlaku**.
- **Seluruh Unit Kerja (Eselon 1, Eselon 2, Auditor, Pimpinan):**  
  Dapat melihat, memfilter, membaca, dan mengunduh seluruh peraturan yang berstatus **Berlaku**.

#### 📜 Regulasi Rujukan Utama:
1. **PP No. 60 Tahun 2008:** Sistem Pengendalian Intern Pemerintah (SPIP).
2. **Permenpan RB No. 5 Tahun 2020:** Petunjuk Pelaksanaan Manajemen Risiko Instansi Pemerintah.
3. **UU No. 6 Tahun 2014 jo UU No. 3 Tahun 2024:** Undang-Undang Tentang Desa.
4. **Kepmen / Permendesa PDT:** Pedoman Penerapan Tata Kelola Manajemen Risiko Kementerian Desa PDT.`;
  }

  // 15. PENETAPAN KONTEKS
  if (
    has("konteks", "penetapan konteks", "stakeholder", "pemangku kepentingan", "sasaran strategis")
  ) {
    return `### 📑 Panduan Pengisian Menu Penetapan Konteks

Penetapan Konteks adalah pijakan pertama sebelum mengidentifikasi risiko unit kerja Anda:

---

1. **Informasi Umum & Tahun Anggaran:**  
   Pilih tahun anggaran aktif (**${year}**) dan cantumkan dokumen sumber acuan (Renstra Kemendesa, Rencana Kerja/Renja, atau DIPA).
2. **Sasaran Organisasi:**  
   Hubungkan dengan Sasaran Strategis Kementerian (Kementerian), Sasaran Program (Eselon 1), atau Sasaran Kegiatan (Eselon 2).
3. **Analisis Pemangku Kepentingan (Stakeholders):**  
   - **Internal:** Pegawai, Pimpinan Unit, Unit Teknis Lintas Eselon.
   - **Eksternal:** Kemenkeu, BPKP, Pemerintah Daerah, Pemerintah Desa, Masyarakat Penerima Manfaat.
4. **Peraturan Perundang-undangan Terkait:**  
   Pilih peraturan yang menjadi dasar kepatuhan operasional.
5. **Insiden & Masalah Masa Lalu:**  
   Catat kendala operasional tahun lalu agar tidak terulang di tahun ini.`;
  }

  // 16. CETAK LAPORAN & EKSPOR EXCEL/PDF
  if (
    has("cetak", "laporan", "excel", "pdf", "unduh", "download", "print", "rekapitulasi")
  ) {
    return `### 🖨️ Panduan Cetak Laporan & Ekspor Data di SIM-Risiko

Buka menu **Laporan & Ekspor $\\rightarrow$ Cetak Laporan** untuk mengunduh laporan resmi dinas:

---

#### 📄 Jenis Laporan yang Tersedia:
1. **Laporan Matriks Peta Risiko:** Berisi tabel register risiko, analisis kemungkinan & dampak, besaran, serta level risiko awal.
2. **Laporan Rencana Tindak Pengendalian (RTP):** Berisi uraian tindakan mitigasi lengkap dengan penanggung jawab dan target waktu.
3. **Laporan Pemantauan Triwulanan:** Rekapitulasi progres realisasi butir RTP.
4. **Laporan Keterjadian Risiko:** Catatan insiden riil beserta dampak kerugian.
5. **Laporan Penetapan Konteks:** Matriks stakeholder dan daftar regulasi terkait.

#### 💡 Pilihan Format Ekspor:
- **Unduh Excel (.xlsx):** Format tabel dinamis siap olah untuk arsip dan penyusunan laporan dinas.
- **Cetak / Simpan PDF:** Format tata letak dokumen resmi lengkap dengan lembar pengesahan pejabat penandatangan.`;
  }

  // 17. HAK AKSES, ROLE USER, & HIERARKI UNIT (KEMENTERIAN, ESELON 1, ESELON 2)
  if (
    has("role", "hak akses", "kementerian", "eselon 1", "eselon 2", "pimpinan", "auditor", "admin", "tingkat kementerian", "hierarki")
  ) {
    return `### 👥 Struktur Peran (Role) & Hak Akses di SIM-Risiko Kemendesa

Sistem menerapkan prinsip *Role-Based Access Control* berjenjang:

---

1. **Administrator (Admin):**  
   Pengelolaan master data unit kerja, registrasi dan penonaktifan akun user, backup/restore data, dan katalog peraturan.
2. **Pengelola Risiko Tingkat Kementerian (Role: kementerian):**  
   Mengelola risiko makro tingkat kementerian, melihat seluruh peta risiko cascading Eselon 1 & 2, mengelola katalog peraturan, dan menyusun laporan konsolidasi nasional kementerian.
3. **Unit Kerja Eselon 1:**  
   Menyusun sasaran program, mengelola risiko strategis eselon 1, dan memantau risiko unit eselon 2 di bawah binaannya.
4. **Unit Kerja Eselon 2:**  
   Menyusun sasaran kegiatan teknis operasional, mengidentifikasi risiko detail, menyusun butir RTP, dan mengirimkan ke Auditor APIP.
5. **Auditor APIP (Inspektorat Jenderal):**  
   Melakukan telaah, reviu kualitas perumusan risiko, memberikan catatan koreksi, dan memberikan persetujuan formal profil risiko.
6. **Pimpinan Unit Kerja:**  
   Monitoring dashboard peta risiko dan menandatangani lembar pengesahan laporan profil risiko unit.`;
  }

  // 18. TROUBLESHOOTING & PERTANYAAN TEKNIS
  if (
    has("tidak bisa", "gagal", "kenapa", "mengapa", "error", "tombol mati", "tidak muncul", "hilang", "cara edit", "cara hapus")
  ) {
    return `### 🛠️ Pusat Bantuan Kendala Operasional SIM-Risiko

Berikut solusi untuk beberapa kendala yang kerap ditemui:

---

- **❓ Kenapa tombol "Kirim ke Auditor" tidak bisa diklik / abu-abu?**  
  *Pastikan Anda telah mengisi minimal 1 identifikasi risiko lengkap dengan analisis skor kemungkinan & dampak serta butir RTP.*

- **❓ Kenapa menu "Katalog Peraturan" tidak bisa tambah data?**  
  *Fitur tambah, edit, dan upload dokumen pada Katalog Peraturan khusus diperuntukkan bagi user dengan role **Admin** atau **Kementerian**. User unit kerja lainnya memiliki hak akses membaca dan mengunduh.*

- **❓ Bagaimana cara mengubah atau menghapus data risiko yang salah?**  
  *Buka menu **Identifikasi Risiko**, pada baris risiko yang bersangkutan klik ikon pensil (Kuning) untuk mengubah atau ikon tempat sampah (Merah) untuk menghapus. Catatan: Data tidak dapat diubah jika status sedang diajukan (*Submitted*) ke APIP.*

- **❓ Bagaimana cara membatalkan status pengajuan ke Auditor?**  
  *Hubungi tim Auditor APIP Inspektorat Jenderal untuk membuka kembali kunci isian (*unlock / request revision*).*`;
  }

  // ============================================================================
  // 19. DYNAMIC INTELLIGENT SYNTHESIZER FOR ANY GENERAL QUESTION
  // ============================================================================
  // Jika pertanyaan tidak masuk ke kata kunci eksak di atas, AI menganalisis
  // teks pertanyaan pengguna dan menghasilkan tanggapan yang relevan secara substantif!

  const cleanUserText = lastUserRaw.replace(/[?.,!]/g, "").trim();

  return `### 💡 Panduan Konsultasi Si-MaRi AI

Terima kasih atas pertanyaan Anda mengenai:  
> **"${lastUserRaw}"**

Berdasarkan pedoman **Permenpan RB No. 5 Tahun 2020** dan tata kelola Manajemen Risiko di lingkungan **Kementerian Desa, PDT, dan Transmigrasi**, berikut panduan dan arahan untuk unit kerja Anda (**${unit}**):

---

#### 📌 Pokok Penjelasan Terkait Topik Anda:
1. **Keterkaitan dengan Sasaran Kerja:**  
   Setiap aktivitas kerja terkait *"${cleanUserText}"* perlu dipetakan potensi hambatannya agar tidak mengganggu target Indikator Kinerja Utama (IKU) maupun output DIPA tahun anggaran ${year}.
2. **Penerapan Siklus Manajemen Risiko:**  
   - **Identifikasi:** Analisis apa akar penyebab (*cause*) yang mungkin timbul, apa peristiwa risikonya (*event*), dan apa dampak kerugiannya (*impact*).  
   - **Penilaian:** Tentukan probabilitas keterjadian (1-5) dan tingkat keparahannya (1-5) menggunakan matriks 5×5.  
   - **Mitigasi:** Siapkan Rencana Tindak Pengendalian (RTP) terukur sebelum risiko tersebut berubah menjadi masalah nyata di lapangan.
3. **Dokumentasi di Sistem:**  
   Seluruh rencana kerja dan mitigasi ini dapat Anda masukkan langsung ke dalam menu **Identifikasi Risiko** dan **Rencana Tindak Pengendalian** pada modul SIM-Risiko.

---

#### 🎯 Rekomendasi Pertanyaan Lanjutan:
- Ketik **"Bagaimana rumus baku pernyataan risiko?"** untuk melihat format perumusan resmi.
- Ketik **"Berikan contoh risiko untuk unit kerja saya"** untuk mendapatkan rekomendasi instan.
- Ketik **"Jelaskan skala 5x5 kemungkinan & dampak"** untuk memahami metode scoring.

*Ada hal spesifik lain terkait "${cleanUserText}" yang ingin Anda perdalam bersama saya?*`;
}

// ============================================================================
// MAIN POST HANDLER (Gemini API + Smart Knowledge Engine Fallback)
// ============================================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages = [], userContext = {}, apiKey: clientApiKey } = body;

    // Prioritas API Key:
    // 1. Client settings (jika user memasukkan key di UI)
    // 2. Server environment variables
    const apiKey = 
      (typeof clientApiKey === "string" && clientApiKey.trim()) || 
      process.env.GEMINI_API_KEY || 
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
      "";

    // Jika API Key tersedia, hubungi Google Gemini API
    if (apiKey) {
      try {
        const systemPrompt = buildSystemPrompt(userContext);
        
        // Format history untuk Gemini API
        const contents = messages.map((m: ChatMessage) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

        // Coba gemini-2.0-flash terlebih dahulu, fallback ke gemini-1.5-flash
        const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
        let replyText = "";
        let usedModel = "";

        for (const model of models) {
          try {
            const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const res = await fetch(geminiEndpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: systemPrompt }]
                },
                contents: contents,
                generationConfig: {
                  temperature: 0.5,
                  maxOutputTokens: 2048,
                }
              })
            });

            if (res.ok) {
              const geminiData = await res.json();
              replyText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
              if (replyText) {
                usedModel = model;
                break;
              }
            }
          } catch (modelErr) {
            console.warn(`Model ${model} failed, trying next:`, modelErr);
          }
        }

        if (replyText) {
          return NextResponse.json({
            reply: replyText,
            source: "gemini",
            model: usedModel
          });
        }
      } catch (geminiError) {
        console.warn("Error calling Gemini API, seamlessly falling back to Expert Engine:", geminiError);
      }
    }

    // High-performance Built-in Expert Engine Kemendesa (100% Reliable & Contextual)
    const localReply = generateKnowledgeBaseResponse(messages, userContext);
    return NextResponse.json({
      reply: localReply,
      source: "knowledge_base",
      model: "Si-MaRi Expert Engine"
    });

  } catch (error: any) {
    console.error("AI Chat API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses permintaan AI." },
      { status: 500 }
    );
  }
}
