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

// Built-in Knowledge Base & Rule-based AI Engine jika tanpa API Key external
function generateKnowledgeBaseResponse(messages: ChatMessage[], context: UserContext): string {
  const lastUserMsg = messages.filter(m => m.role === "user").pop()?.content.toLowerCase() || "";
  const unit = context.unitName || "Unit Kerja Anda";
  const role = context.role || "pegawai";
  const year = context.activeYear || "2026";

  // 1. Formula Pernyataan Risiko / Cara Buat Risiko
  if (
    lastUserMsg.includes("pernyataan risiko") || 
    lastUserMsg.includes("rumus") || 
    lastUserMsg.includes("format") || 
    lastUserMsg.includes("cara membuat risiko") ||
    lastUserMsg.includes("cara merumuskan") ||
    lastUserMsg.includes("menyusun risiko")
  ) {
    return `### 📋 Panduan Perumusan Pernyataan Risiko (Standar Permenpan RB No. 5/2020)

Pernyataan risiko yang baik **bukan sekadar negasi dari sasaran** (misal: "Target tidak tercapai" adalah SALAH). Pernyataan risiko harus memuat 3 elemen utama:

**Formula Baku:**
> **[Penyebab / Akar Masalah]** *(Adanya... / Karena...)*  
> **$\rightarrow$ [Peristiwa Risiko]** *(Menyebabkan / Berpotensi terjadinya...)*  
> **$\rightarrow$ [Dampak]** *(Mengakibatkan / Berdampak pada...)*

---

#### 💡 Contoh Format untuk ${unit}:
1. **Penyebab (Cause):**  
   *Keterlambatan penyampaian laporan pertanggungjawaban dari pelaksana kegiatan di lapangan akibat kendala jaringan komunikasi.*
2. **Peristiwa Risiko (Event):**  
   *Pengajuan berkas pencairan anggaran termin berikutnya terlambat diverifikasi.*
3. **Dampak (Impact):**  
   *Realisasi serapan anggaran triwulan mengalami deviasi negatif $> 20\%$ dan penyelesaian target output fisik terhambat.*

---

#### ⚠️ Tips Penting:
- **Kategori Sebab:** Pisahkan antara penyebab yang dapat dikendalikan (*controllable*) dan di luar kendali (*uncontrollable*).
- **Pemilik Risiko:** Tentukan unit/pejabat yang paling berwenang menangani risiko ini.
- Jangan masukkan dampak sebagai peristiwa risiko.`;
  }

  // 2. Minta Contoh Risiko
  if (
    lastUserMsg.includes("contoh risiko") || 
    lastUserMsg.includes("buatkan risiko") || 
    lastUserMsg.includes("rekomendasi risiko") ||
    lastUserMsg.includes("daftar risiko")
  ) {
    return `### 🎯 Rekomendasi Contoh Risiko untuk **${unit}** (Tahun ${year})

Berikut adalah 3 usulan risiko strategis dan operasional yang dapat Anda jadikan rujukan di SIM-Risiko:

---

#### 1. Risiko Operasional: Keterlambatan Realisasi Output Kegiatan
- **Pernyataan Risiko:**  
  *Adanya penyesuaian jadwal pelaksanaan bimbingan teknis akibat kendala koordinasi lintas daerah, sehingga pelaksanaan kegiatan mundur dari jadwal semula, yang mengakibatkan target capaian output triwulanan tertunda.*
- **Kategori:** Operasional
- **Estimasi Analisis:** Kemungkinan = 3 (Sedang), Dampak = 3 (Sedang) $\rightarrow$ **Besaran = 9 (Level Sedang)**
- **Rencana Tindak Pengendalian (RTP):**  
  Menyusun kalender kerja integratif, menerbitkan surat pemberitahuan H-30, serta menyediakan alternatif pelaksanaan secara *hybrid/online*.

---

#### 2. Risiko Kepatuhan / Keuangan: Kelengkapan Dokumen Pertanggungjawaban
- **Pernyataan Risiko:**  
  *Kurangnya pemahaman pelaksana terkait regulasi perpajakan dan SPJ terbaru, yang berpotensi menghasilkan kelengkapan bukti administrasi yang tidak lengkap, mengakibatkan adanya catatan temuan pengawasan internal/eksternal.*
- **Kategori:** Kepatuhan / Finansial
- **Estimasi Analisis:** Kemungkinan = 2 (Rendah), Dampak = 4 (Berat) $\rightarrow$ **Besaran = 8 (Level Rendah/Sedang)**
- **Rencana Tindak Pengendalian (RTP):**  
  Penyusunan checklist verifikasi SPJ mandiri sebelum diajukan ke bendahara dan mengadakan bimbingan teknis administrasi keuangan berkala.

---

#### 3. Risiko Kebijakan / Transformasi Digital: Kesiapan Sistem & Data
- **Pernyataan Risiko:**  
  *Belum optimalnya integrasi data pelaporan dari unit/daerah ke dalam sistem informasi kementerian, yang menyebabkan validasi data program memerlukan waktu ekstra, berdampak pada keterlambatan penyusunan laporan kinerja semesteran.*
- **Kategori:** Operasional / Reputasi
- **Estimasi Analisis:** Kemungkinan = 3 (Sedang), Dampak = 3 (Sedang) $\rightarrow$ **Besaran = 9 (Level Sedang)**
- **Rencana Tindak Pengendalian (RTP):**  
  Standardisasi format data input, penguatan sosialisasi aplikasi, dan penerapan batas akhir *cut-off* sistem yang tegas.

---
💡 *Anda dapat langsung menginputkan perumusan ini pada menu **Proses Manajemen Risiko $\rightarrow$ Identifikasi Risiko**!*`;
  }

  // 3. Analisis Risiko / Matriks 5x5 / Skala Kemungkinan & Dampak
  if (
    lastUserMsg.includes("analisis") || 
    lastUserMsg.includes("matriks") || 
    lastUserMsg.includes("kemungkinan") || 
    lastUserMsg.includes("dampak") || 
    lastUserMsg.includes("skor") ||
    lastUserMsg.includes("besaran")
  ) {
    return `### 📊 Panduan Analisis Risiko & Matriks 5x5 di SIM-Risiko

Analisis risiko dilakukan untuk menentukan **Tingkat Besaran Risiko** dengan mengalikan frekuensi kemungkinan (*Probability*) dengan keparahan akibat (*Impact*):

$$\\text{Besaran Risiko} = \\text{Kemungkinan (P)} \\times \\text{Dampak (D)}$$

---

#### 1. Skala Kemungkinan (P / 1 s.d. 5):
- **1 - Sangat Rendah:** Kemungkinan terjadi $< 10\\%$ atau 1 kali dalam 5 tahun.
- **2 - Rendah:** Kemungkinan terjadi $10\\% - 30\\%$ atau 1 kali dalam 2-3 tahun.
- **3 - Sedang:** Kemungkinan terjadi $30\\% - 50\\%$ atau 1 kali dalam 1 tahun anggaran.
- **4 - Tinggi:** Kemungkinan terjadi $50\\% - 80\\%$ atau beberapa kali dalam setahun.
- **5 - Sangat Tinggi:** Kemungkinan terjadi $> 80\\%$ atau hampir pasti terjadi di setiap kegiatan.

---

#### 2. Skala Dampak (D / 1 s.d. 5):
- **1 - Tidak Signifikan:** Tidak berdampak signifikan pada target kinerja/anggaran.
- **2 - Minor / Rendah:** Keterlambatan ringan ($< 1$ minggu), kerugian finansial sangat kecil.
- **3 - Moderat / Sedang:** Penundaan target capaian $1$ bulan, sorotan media lokal.
- **4 - Signifikan / Berat:** Target strategis terganggu, potensi temuan kepatuhan, sorotan media regional/nasional.
- **5 - Katastropik / Sangat Berat:** Kegagalan fatal program, pelanggaran hukum berat, reputasi instansi tercemar luas.

---

#### 3. Kategori Level Besaran Risiko:
| Skor (P x D) | Kategori Level | Warna Indikator | Prioritas Tindakan |
| :---: | :---: | :---: | :--- |
| **1 - 5** | Sangat Rendah | Biru | Diterima / Pemantauan rutin |
| **6 - 9** | Rendah | Hijau | Diterima dengan pengendalian eksisting |
| **10 - 14** | Sedang | Kuning | Perlu Rencana Tindak Pengendalian (RTP) |
| **15 - 19** | Tinggi | Oranye | Wajib RTP terukur & pemantauan intensif |
| **20 - 25** | Sangat Tinggi | Merah | **Prioritas Utama**, lapor pimpinan eselon puncak |

*Catatan: Risiko dengan skor $\ge 12$ otomatis masuk ke dalam kategori **Risiko Prioritas** pada dashboard konsolidasi.*`;
  }

  // 4. Rencana Tindak Pengendalian (RTP)
  if (
    lastUserMsg.includes("rtp") || 
    lastUserMsg.includes("tindak pengendalian") || 
    lastUserMsg.includes("mitigasi") || 
    lastUserMsg.includes("pengendalian")
  ) {
    return `### 🛡️ Panduan Penyusunan Rencana Tindak Pengendalian (RTP)

RTP adalah serangkaian tindakan terencana untuk **menurunkan kemungkinan terjadinya risiko** atau **meminimalisir dampak** jika risiko terjadi.

---

#### 4 Unsur Wajib Setiap Butir RTP:
1. **Uraian Tindakan:** Kegiatan konkret perbaikan sistem/SOP (misal: "Penyusunan Surat Edaran Standar Waktu Pengajuan Berkas dan Workshop Aplikasi").
2. **Penanggung Jawab:** Pejabat struktural atau tim kerja spesifik (bukan nama orang, melainkan jabatan, contoh: *Ketua Tim Kerja Keuangan*).
3. **Target Waktu Penyelesaian:** Bulan/Triwulan pelaksanaan yang realistis (contoh: *Triwulan II - Juni ${year}*).
4. **Indikator Output:** Dokumen/bukti fisik yang dihasilkan sebagai bukti tindakan telah selesai (contoh: *Dokumen SOP / Notulensi & Daftar Hadir Sosialisasi*).

---

#### Strategi Respon Risiko:
- **Mengurangi (Mitigate):** Membuat SOP baru, menambah verifikator, pelatihan pegawai.
- **Menghindari (Avoid):** Mengubah metode kegiatan yang berisiko tinggi ke metode yang lebih aman.
- **Membagi (Transfer/Share):** Menjalin kerja sama MoU dengan instansi lain atau asuransi barang milik negara.
- **Menerima (Accept):** Untuk risiko level rendah yang biaya mitigasinya lebih mahal dari dampaknya.

💡 *Di SIM-Risiko, Anda dapat menginput beberapa butir RTP sekaligus untuk satu peristiwa risiko pada menu **Rencana Tindak Pengendalian**.*`;
  }

  // 5. Pemantauan & Keterjadian & Efektifitas
  if (
    lastUserMsg.includes("pemantauan") || 
    lastUserMsg.includes("keterjadian") || 
    lastUserMsg.includes("efektifitas") ||
    lastUserMsg.includes("insiden")
  ) {
    return `### 📈 Pemantauan RTP, Keterjadian Risiko, & Efektifitas

Setelah RTP dirancang dan risiko disahkan, siklus berikutnya adalah pemantauan berkala:

1. **Pemantauan RTP (menu Pemantauan RTP):**
   - Melaporkan status realisasi setiap butir tindakan RTP (Belum Dilaksanakan / Dalam Proses / Selesai).
   - Melampirkan kendala yang dihadapi jika target waktu terlewati.

2. **Pencatatan Keterjadian Risiko (menu Pencatatan Keterjadian):**
   - Jika peristiwa risiko yang diidentifikasi **benar-benar terjadi** di lapangan, catat tanggal kejadian, kronologi singkat, dan besaran kerugian riil (finansial/waktu/kinerja).
   - Data keterjadian menjadi bahan evaluasi penetapan konteks tahun anggaran berikutnya.

3. **Efektifitas RTP (menu Efektifitas RTP):**
   - Mengevaluasi apakah setelah RTP dijalankan, besaran risiko (*Residual Risk*) benar-benar mengalami penurunan.
   - Jika risiko tetap berada di level tinggi, maka tindakan pengendalian dinilai kurang memadai dan perlu diperbarui.`;
  }

  // 6. Alur Audit APIP
  if (
    lastUserMsg.includes("audit") || 
    lastUserMsg.includes("kirim") || 
    lastUserMsg.includes("apip") || 
    lastUserMsg.includes("inspektorat") ||
    lastUserMsg.includes("inbox")
  ) {
    return `### 🔍 Alur Proses Audit APIP di SIM-Risiko

Alur interaksi antara Unit Kerja dan Auditor APIP (Inspektorat Jenderal) berjalan terstruktur:

1. **Penyusunan Mandiri:**  
   Unit Kerja menyelesaikan Penetapan Konteks, Identifikasi Risiko, Analisis, dan RTP untuk tahun aktif (${year}).
2. **Kirim ke Auditor:**  
   Buka menu **Proses Audit $\rightarrow$ Kirim ke Auditor**. Klik tombol **"Kirim ke Auditor APIP"**. Status unit Anda akan berubah menjadi *Diajukan (Submitted)*.
3. **Riviu APIP:**  
   Auditor APIP akan menelaah daftar risiko unit Anda. Auditor dapat memberikan catatan perbaikan umum maupun catatan detail per kolom.
4. **Cek Hasil di Inbox:**  
   Buka menu **Proses Audit $\rightarrow$ Inbox Hasil Auditor**. Jika ada catatan riviu, lakukan penyesuaian di menu Identifikasi Risiko, lalu kirim ulang jika diminta.
5. **Finalisasi:**  
   Setelah disetujui APIP, profil risiko unit Anda resmi menjadi rujukan peta risiko kementerian.`;
  }

  // 7. Penetapan Konteks
  if (lastUserMsg.includes("konteks")) {
    return `### 📑 Panduan Penetapan Konteks Risiko

Penetapan Konteks adalah fondasi awal sebelum melakukan identifikasi risiko. Di menu **Penetapan Konteks**, Anda mendokumentasikan:

1. **Tahun Anggaran & Sumber Data:** Dokumen Renstra, RKT, DIPA/POK, atau LAKIP.
2. **Tujuan/Sasaran Organisasi:** Mengaitkan Sasaran Strategis (Tingkat Kementerian), Sasaran Program (Eselon 1), atau Sasaran Kegiatan (Eselon 2).
3. **Identifikasi Pihak Berkepentingan (Stakeholders):**
   - **Internal:** Pegawai, pimpinan, unit teknis terkait.
   - **Eksternal:** Kementerian Keuangan, BPKP, Pemda, Pemerintah Desa, Masyarakat Penerima Manfaat.
4. **Daftar Peraturan Terkait:** UU Desa, Perpres, Permenpan, dan Permendesa yang menjadi landasan kepatuhan.
5. **Insiden/Temuan Sebelumnya:** Catatan evaluasi tahun lalu agar kesalahan serupa tidak berulang.`;
  }

  // 8. Cetak Laporan
  if (lastUserMsg.includes("laporan") || lastUserMsg.includes("cetak") || lastUserMsg.includes("excel") || lastUserMsg.includes("pdf")) {
    return `### 🖨️ Panduan Cetak Laporan Manajemen Risiko

Di menu **Cetak Laporan**, Anda dapat mencetak pratinjau resmi dan mengunduh format Excel untuk:

1. **Laporan Matriks Peta Risiko:** Berisi tabel identifikasi, analisis kemungkinan & dampak, serta level risiko awal.
2. **Laporan Pemantauan RTP:** Berisi daftar tindakan mitigasi, penanggung jawab, target waktu, dan status pelaksanaannya.
3. **Laporan Keterjadian Risiko:** Rekapitulasi peristiwa risiko yang benar-benar terjadi beserta kerugian riil.
4. **Laporan Efektifitas RTP:** Evaluasi penurunan level risiko setelah pengendalian diimplementasikan.
5. **Laporan Penetapan Konteks:** Format matriks pemangku kepentingan dan peraturan perundang-undangan.

*Tips: Gunakan tombol **"Unduh Excel"** untuk kebutuhan dokumentasi laporan dinas atau tombol **"Cetak / Simpan PDF"** untuk pratinjau cetak bersih.*`;
  }

  // Default Fallback: Konsultasi Terbuka
  return `Halo! Saya **Si-MaRi AI**, asisten kecerdasan buatan untuk Manajemen Risiko di **Kementerian Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi**.

Saya siap membantu Anda dalam:
- ✍️ **Merumuskan Pernyataan Risiko** yang benar dengan formula *[Penyebab] $\rightarrow$ [Peristiwa] $\rightarrow$ [Dampak]*.
- 🎯 **Memberikan rekomendasi ide risiko** khusus untuk unit kerja Anda (*${unit}*).
- 📊 **Menentukan skor kemungkinan dan dampak** berdasarkan matriks 5x5 Permenpan RB No. 5/2020.
- 🛡️ **Menyusun Rencana Tindak Pengendalian (RTP)** yang terukur dan aplikatif.
- 🔍 **Panduan alur pengiriman dan riviu** dengan Auditor APIP Inspektorat Jenderal.
- 📑 **Tata cara pengisian Penetapan Konteks** dan Cetak Laporan dinas.

Silakan ajukan pertanyaan Anda, atau pilih salah satu topik di atas untuk mulai berdiskusi!`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages = [], userContext = {}, apiKey: clientApiKey } = body;

    // Prioritas API Key:
    // 1. Dari client setting (jika user memasukkan custom Gemini API Key di UI)
    // 2. Dari environment variable server GEMINI_API_KEY / NEXT_PUBLIC_GEMINI_API_KEY
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

        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const res = await fetch(geminiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: contents,
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 2048,
            }
          })
        });

        if (res.ok) {
          const geminiData = await res.json();
          const replyText = 
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 
            "Maaf, tidak dapat menghasilkan jawaban saat ini.";
          
          return NextResponse.json({
            reply: replyText,
            source: "gemini",
            model: "gemini-2.0-flash"
          });
        } else {
          const errText = await res.text();
          console.warn("Gemini API call failed, falling back to Knowledge Base Engine:", errText);
        }
      } catch (geminiError) {
        console.warn("Error calling Gemini API, falling back:", geminiError);
      }
    }

    // Fallback: Menggunakan Built-in Expert Knowledge Base Engine
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
