"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BookMarked,
  Printer,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Target,
  ClipboardList,
  FolderTree,
  ShieldCheck,
  SearchCheck,
  BarChart4,
  Building2,
  Users,
  Flame,
  HelpCircle,
  Copy,
  Check,
  ArrowDown,
  ArrowRight,
  ShieldAlert,
  FileText,
  BookOpen,
  Bot,
  Sparkles,
  Info,
  Layers,
  RotateCcw,
  CheckCircle,
  XCircle,
  GitBranch,
  PlayCircle,
  Flag,
  CornerDownRight,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ModulPanduanPage() {
  const { user, activeYear } = useAuth();
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [copiedFormula, setCopiedFormula] = useState(false);
  const [filterRole, setFilterRole] = useState<"all" | "unit" | "auditor" | "kementerian">("all");

  const handleCopyFormula = () => {
    const formulaText = "[Penyebab / Akar Masalah] (Adanya... / Karena...) -> [Peristiwa Risiko] (Menyebabkan / Berpotensi terjadinya...) -> [Dampak] (Mengakibatkan / Berdampak pada...)";
    navigator.clipboard.writeText(formulaText);
    setCopiedFormula(true);
    toast.success("Formula baku pernyataan risiko berhasil disalin ke clipboard!");
    setTimeout(() => setCopiedFormula(false), 2500);
  };

  const scrollToStage = (stageNumber: number) => {
    setSelectedStage(stageNumber);
    const element = document.getElementById(`stage-${stageNumber}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // 8 Tahapan Alur Lengkap Proses Aplikasi
  const stages = [
    {
      step: 1,
      id: "stage-1",
      title: "Penetapan Konteks Risiko",
      subtitle: "Menetapkan parameter dasar sasaran, pemangku kepentingan, dan regulasi acuan",
      menuPath: "/dashboard/mr-konteks",
      menuName: "Menu Penetapan Konteks",
      roles: ["Unit Kerja Eselon 1", "Unit Kerja Eselon 2", "Pengelola Risiko Kementerian"],
      roleFilter: "unit",
      color: "from-blue-600 to-indigo-700",
      accentBg: "bg-blue-50 border-blue-200 text-blue-900",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      icon: ClipboardList,
      tujuan: "Mendokumentasikan ruang lingkup dan batasan pengelolaan risiko unit kerja agar selaras dengan sasaran strategis, program, atau kegiatan yang ditetapkan dalam Renstra dan DIPA.",
      langkahTeknis: [
        {
          no: "1.1",
          nama: "Pilih Tahun Anggaran",
          detail: "Pastikan tahun anggaran aktif di bar atas telah sesuai (misal: Tahun 2026)."
        },
        {
          no: "1.2",
          nama: "Kaitkan Sasaran Organisasi",
          detail: "Pilih sasaran yang menjadi acuan: Sasaran Strategis (Tingkat Kementerian), Sasaran Program (Eselon 1), atau Sasaran Kegiatan (Eselon 2)."
        },
        {
          no: "1.3",
          nama: "Identifikasi Pemangku Kepentingan (Stakeholders)",
          detail: "Masukkan daftar pihak internal (pimpinan, staf unit) dan eksternal (Kemenkeu, BPKP, Pemda, Pemerintah Desa) beserta ekspektasi dan kepentingannya."
        },
        {
          no: "1.4",
          nama: "Inventarisasi Regulasi Terkait",
          detail: "Pilih peraturan perundang-undangan pendukung yang menjadi dasar kepatuhan operasional."
        },
        {
          no: "1.5",
          nama: "Dokumentasikan Insiden Masa Lalu",
          detail: "Catat kendala atau temuan tahun sebelumnya agar tidak berulang di tahun anggaran berjalan."
        }
      ],
      output: "Dokumen Penetapan Konteks Risiko Unit Kerja yang disahkan.",
      doAndDont: {
        do: "Pastikan seluruh stakeholder utama telah terpetakan ekspektasinya.",
        dont: "Jangan mengosongkan sasaran kinerja, karena risiko wajib menginduk pada sasaran organisasi."
      }
    },
    {
      step: 2,
      id: "stage-2",
      title: "Identifikasi Risiko",
      subtitle: "Merumuskan seluruh potensi peristiwa risiko menggunakan formula baku wajib",
      menuPath: "/dashboard/mr-identifikasi",
      menuName: "Proses Manajemen Risiko -> Identifikasi Risiko",
      roles: ["Unit Kerja Eselon 1", "Unit Kerja Eselon 2", "Pengelola Risiko Kementerian"],
      roleFilter: "unit",
      color: "from-emerald-600 to-teal-700",
      accentBg: "bg-emerald-50 border-emerald-200 text-emerald-900",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: FolderTree,
      tujuan: "Menggali seluruh peristiwa ketidakpastian yang dapat mengancam pencapaian target kinerja dengan formula logis Sebab -> Peristiwa -> Dampak.",
      langkahTeknis: [
        {
          no: "2.1",
          nama: "Klik Tombol 'Tambah Risiko'",
          detail: "Buka formulir input risiko baru pada tabel Identifikasi Risiko."
        },
        {
          no: "2.2",
          nama: "Pilih Sasaran & Indikator Kinerja",
          detail: "Pilih IKU/IKP/IKK yang menjadi sasaran terdampak dari risiko yang akan dirumuskan."
        },
        {
          no: "2.3",
          nama: "Tuliskan Pernyataan Risiko Baku",
          detail: "Gunakan formula wajib: [Penyebab / Cause] -> [Peristiwa Risiko / Event] -> [Dampak / Impact]."
        },
        {
          no: "2.4",
          nama: "Tentukan Kategori Risiko",
          detail: "Pilih dari 5 kategori resmi: Operasional, Kebijakan/Strategis, Kepatuhan, Keuangan, atau Reputasi."
        },
        {
          no: "2.5",
          nama: "Evaluasi Pengendalian yang Ada Saat Ini",
          detail: "Pilih apakah sistem pengendalian eksisting 'Sudah Memadai' atau 'Belum Memadai'."
        }
      ],
      output: "Daftar Register Risiko Murni (Inherent Risk Register).",
      doAndDont: {
        do: "Gunakan kalimat sebab-akibat yang nyata dan terukur kerugiannya.",
        dont: "JANGAN menuliskan kalimat negasi sasaran semata (misal: 'Target tidak tercapai' adalah SALAH)."
      }
    },
    {
      step: 3,
      id: "stage-3",
      title: "Analisis Risiko (Matriks 5×5)",
      subtitle: "Menilai tingkat kemungkinan keterjadian dan keparahan dampak (Permenpan RB 5/2020)",
      menuPath: "/dashboard/mr-analisis",
      menuName: "Proses Manajemen Risiko -> Analisis Risiko",
      roles: ["Unit Kerja Eselon 1", "Unit Kerja Eselon 2", "Pengelola Risiko Kementerian"],
      roleFilter: "unit",
      color: "from-amber-500 to-orange-600",
      accentBg: "bg-amber-50 border-amber-200 text-amber-900",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      icon: Flame,
      tujuan: "Menghitung nilai besaran risiko secara objektif untuk menentukan level keparahan dan menyaring risiko yang wajib diprioritaskan.",
      langkahTeknis: [
        {
          no: "3.1",
          nama: "Pilih Risiko yang Akan Dinilai",
          detail: "Buka menu Analisis Risiko, klik aksi penetapan skor pada baris risiko bersangkutan."
        },
        {
          no: "3.2",
          nama: "Tentukan Tingkat Kemungkinan (Skala 1 s.d. 5)",
          detail: "Pilih dari skala 1 (Hampir Tidak Terjadi <10%) sampai skala 5 (Hampir Pasti Terjadi >80%)."
        },
        {
          no: "3.3",
          nama: "Tentukan Tingkat Dampak (Skala 1 s.d. 5)",
          detail: "Pilih dari skala 1 (Tidak Signifikan) sampai skala 5 (Katastropik / Sangat Berat)."
        },
        {
          no: "3.4",
          nama: "Perhitungan Otomatis Besaran & Level Risiko",
          detail: "Sistem otomatis menghitung Besaran = Kemungkinan × Dampak (Skor 1-25) dan menetapkan warna level (Biru, Hijau, Kuning, Oranye, Merah)."
        },
        {
          no: "3.5",
          nama: "Penetapan Status Risiko Prioritas",
          detail: "Seluruh risiko dengan skor Besaran >= 12 otomatis masuk ke dalam kategori Risiko Prioritas kementerian."
        }
      ],
      output: "Peta Peringkat Besaran Risiko dan Daftar Risiko Prioritas Unit Kerja.",
      doAndDont: {
        do: "Gunakan data historis dan frekuensi keterjadian riil sebagai dasar penentuan skor.",
        dont: "Hindari menilai semua risiko pada skor maksimum (5×5) tanpa bukti atau justifikasi memadai."
      }
    },
    {
      step: 4,
      id: "stage-4",
      title: "Rencana Tindak Pengendalian (RTP)",
      subtitle: "Merancang tindakan mitigasi konkret, menunjuk penanggung jawab, dan menetapkan target waktu",
      menuPath: "/dashboard/mr-rtp",
      menuName: "Proses Manajemen Risiko -> Rencana Tindak Pengendalian",
      roles: ["Unit Kerja Eselon 1", "Unit Kerja Eselon 2", "Pengelola Risiko Kementerian"],
      roleFilter: "unit",
      color: "from-purple-600 to-indigo-700",
      accentBg: "bg-purple-50 border-purple-200 text-purple-900",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      icon: ShieldCheck,
      tujuan: "Menyusun skenario mitigasi yang aplikatif untuk menurunkan kemungkinan keterjadian risiko atau meminimalisir dampak kerugian.",
      langkahTeknis: [
        {
          no: "4.1",
          nama: "Pilih Risiko yang Memerlukan Mitigasi",
          detail: "Fokus utama diberikan pada risiko level Sedang, Tinggi, dan Sangat Tinggi (Skor >= 12)."
        },
        {
          no: "4.2",
          nama: "Rumuskan Uraian Tindakan Mitigasi",
          detail: "Tuliskan kegiatan konkret perbaikan sistem, penyusunan SOP baru, penambahan verifikator, atau pelatihan."
        },
        {
          no: "4.3",
          nama: "Tunjuk Penanggung Jawab (Owner)",
          detail: "Tuliskan nama jabatan struktural atau koordinator tim kerja spesifik (bukan nama orang)."
        },
        {
          no: "4.4",
          nama: "Tentukan Target Waktu Penyelesaian",
          detail: "Pilih periode penyelesaian realistis: Triwulan I, Triwulan II, Triwulan III, atau Triwulan IV."
        },
        {
          no: "4.5",
          nama: "Tetapkan Indikator Bukti Output",
          detail: "Cantumkan dokumen bukti fisik penyelesaian tindakan (contoh: Dokumen SOP, Notulensi Rapat, SK Tim)."
        }
      ],
      output: "Matriks Rencana Tindak Pengendalian (RTP) terukur per peristiwa risiko.",
      doAndDont: {
        do: "Buat butir tindakan yang realistis dapat diselesaikan dalam tahun anggaran berjalan.",
        dont: "Jangan menunjuk penanggung jawab di luar kewenangan unit kerja Anda."
      }
    },
    {
      step: 5,
      id: "stage-5",
      title: "Pengajuan & Reviu Auditor APIP",
      subtitle: "Unit kerja mengajukan profil risiko ke APIP dan menerima catatan perbaikan (Gate Pengawasan)",
      menuPath: "/dashboard/proses-audit/kirim",
      menuName: "Proses Riviu -> Kirim ke Auditor & Inbox Hasil Auditor",
      roles: ["Unit Kerja (Pengaju)", "Auditor APIP / Inspektorat Jenderal (Penelaah)"],
      roleFilter: "auditor",
      color: "from-rose-600 to-pink-700",
      accentBg: "bg-rose-50 border-rose-200 text-rose-900",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
      icon: SearchCheck,
      tujuan: "Memastikan profil risiko yang disusun memenuhi standar regulasi, logis, dan mendapat validasi formal dari pengawas intern pemerintah.",
      langkahTeknis: [
        {
          no: "5.1",
          nama: "Pemeriksaan Kelengkapan Data Mandiri",
          detail: "Unit Kerja memastikan Konteks, Identifikasi, Analisis, dan RTP telah terisi lengkap."
        },
        {
          no: "5.2",
          nama: "Klik Tombol 'Kirim ke Auditor APIP'",
          detail: "Buka menu Kirim ke Auditor, lalu klik ajukan. Status unit berubah menjadi 'Submitted'."
        },
        {
          no: "5.3",
          nama: "Auditor APIP Melakukan Telaah",
          detail: "Auditor membuka menu 'Audit Risiko', menelaah rumusan risiko dan skor, serta memberikan Catatan Umum maupun Catatan Detail Per Kolom."
        },
        {
          no: "5.4",
          nama: "Percabangan Hasil Reviu APIP (Decision Gate)",
          detail: "Jika auditor menyetujui, status menjadi 'Disetujui'. Jika ada catatan perbaikan, auditor mengembalikan berkas (status 'Revisi')."
        },
        {
          no: "5.5",
          nama: "Pemeriksaan Catatan di 'Inbox Hasil Auditor'",
          detail: "Unit Kerja membaca catatan perbaikan di Inbox, menyunting risiko di menu Identifikasi/Analisis/RTP, lalu mengajukan kembali."
        }
      ],
      output: "Profil Risiko Terverifikasi Resmi oleh APIP Inspektorat Jenderal.",
      doAndDont: {
        do: "Segera lakukan revisi sesuai rekomendasi catatan auditor pada menu Inbox.",
        dont: "Jangan mengubah data secara sepihak saat proses reviu sedang berjalan."
      }
    },
    {
      step: 6,
      id: "stage-6",
      title: "Pemantauan RTP, Keterjadian, & Efektifitas",
      subtitle: "Melaporkan progres mitigasi berkala, mencatat insiden riil, dan menguji penurunan residual risk",
      menuPath: "/dashboard/mr-pemantauan",
      menuName: "Menu Pemantauan RTP, Pencatatan Keterjadian, & Efektifitas",
      roles: ["Unit Kerja Eselon 1", "Unit Kerja Eselon 2", "Pengelola Risiko Kementerian"],
      roleFilter: "unit",
      color: "from-teal-600 to-emerald-700",
      accentBg: "bg-teal-50 border-teal-200 text-teal-900",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
      icon: BarChart4,
      tujuan: "Memastikan rencana mitigasi benar-benar diimplementasikan di lapangan dan mengevaluasi apakah risiko residual berhasil diturunkan.",
      langkahTeknis: [
        {
          no: "6.1",
          nama: "Pemantauan Pelaksanaan RTP Triwulanan",
          detail: "Setiap akhir triwulan, laporkan status tindakan: Belum Dilaksanakan (0%), Dalam Proses (1%-99%), atau Selesai (100%)."
        },
        {
          no: "6.2",
          nama: "Pencatatan Keterjadian Risiko Riil",
          detail: "Jika peristiwa risiko benar-benar terjadi di lapangan, buka menu 'Pencatatan Keterjadian'. Catat tanggal, kronologi singkat, dan nilai kerugian nyata (finansial/keterlambatan waktu)."
        },
        {
          no: "6.3",
          nama: "Uji Efektifitas Rencana Mitigasi",
          detail: "Pada menu 'Efektifitas RTP', lakukan penilaian ulang terhadap skor kemungkinan dan dampak setelah mitigasi dijalankan (Residual Risk)."
        },
        {
          no: "6.4",
          nama: "Evaluasi Pengendalian Lanjutan",
          detail: "Jika risiko residual masih berada di level tinggi, susun pengendalian tambahan agar target tidak gagal."
        }
      ],
      output: "Laporan Pemantauan Triwulanan, Rekapitulasi Insiden Riil, dan Tingkat Penurunan Risiko Residual.",
      doAndDont: {
        do: "Laporkan status kemajuan mitigasi secara faktual dan tepat waktu sebelum pergantian triwulan.",
        dont: "Jangan menyembunyikan kejadian risiko riil, karena data keterjadian penting untuk mitigasi tahun depan."
      }
    },
    {
      step: 7,
      id: "stage-7",
      title: "Cetak Laporan & Monitoring Dashboard",
      subtitle: "Menghasilkan format laporan dinas resmi (PDF & Excel) serta memantau Heat Map interaktif",
      menuPath: "/dashboard/laporan",
      menuName: "Menu Cetak Laporan & Dashboard Infografis",
      roles: ["Seluruh Unit Kerja", "Pimpinan Unit Kerja", "Pengelola Risiko Kementerian"],
      roleFilter: "kementerian",
      color: "from-slate-800 to-slate-950",
      accentBg: "bg-slate-100 border-slate-300 text-slate-900",
      badgeColor: "bg-slate-200 text-slate-800 border-slate-300",
      icon: FileText,
      tujuan: "Mendokumentasikan seluruh siklus manajemen risiko ke dalam format laporan resmi dinas yang siap ditandatangani pimpinan dan diarsipkan.",
      langkahTeknis: [
        {
          no: "7.1",
          nama: "Buka Menu 'Cetak Laporan'",
          detail: "Pilih jenis laporan yang diinginkan: Laporan Matriks Peta Risiko, Laporan Pemantauan RTP, Laporan Keterjadian, atau Laporan Efektifitas."
        },
        {
          no: "7.2",
          nama: "Pilih Opsi Cetak PDF Resmi",
          detail: "Format cetak otomatis disesuaikan dengan tata letak dokumen resmi lengkap dengan lembar tanda tangan pengesahan pimpinan unit."
        },
        {
          no: "7.3",
          nama: "Unduh Berkas Excel (.xlsx)",
          detail: "Klik tombol 'Unduh Excel' untuk mendapatkan lembar kerja siap olah untuk arsip laporan dinas."
        },
        {
          no: "7.4",
          nama: "Pantau Dashboard & Heat Map 5×5",
          detail: "Buka menu Dashboard untuk melihat konsolidasi nasional, sebaran kategori, grafik progres RTP, serta klik kotak pada Heat Map 5×5 untuk inspeksi risiko."
        }
      ],
      output: "Laporan Profil Risiko Resmi Dinas Bertandatangan Pimpinan dan Berkas Arsip Excel.",
      doAndDont: {
        do: "Pastikan pimpinan unit kerja menandatangani lembar pengesahan profil risiko.",
        dont: "Jangan mencetak laporan sebelum seluruh butir risiko disetujui auditor APIP."
      }
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20 font-sans">
      {/* ====================================================================== */}
      {/* 1. HEADER UTAMA                                                        */}
      {/* ====================================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-900/50 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
                <GitBranch className="w-6 h-6 text-emerald-400" />
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 font-bold uppercase tracking-wider">
                Alur Proses Penggunaan Aplikasi
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Modul Diagram Alur & Panduan Tahapan SIM-Risiko
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Panduan terstruktur alur proses operasional Sistem Informasi Manajemen Risiko Kemendesa PDT dari tahap awal login hingga pelaporan dinas, disajikan dalam bentuk <strong>diagram alur terpadu</strong> dan <strong>penjelasan detail setiap tahapan</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              title="Cetak modul diagram atau simpan sebagai PDF"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span>Cetak Modul / PDF</span>
            </button>

            <button
              onClick={handleCopyFormula}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Salin formula baku pernyataan risiko"
            >
              {copiedFormula ? (
                <>
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>Formula Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-emerald-200" />
                  <span>Salin Rumus Risiko</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* 2. DIAGRAM ALUR PROSES PENGGUNAAN APLIKASI (VISUAL FLOWCHART)         */}
      {/* ====================================================================== */}
      <Card className="shadow-lg border-2 border-emerald-600/30 overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b border-slate-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-emerald-700" />
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Diagram Alur Proses Penggunaan Aplikasi (Workflow Diagram)
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Bagan visual langkah demi langkah siklus manajemen risiko. Klik pada kotak tahapan untuk langsung menuju penjelasan detailnya di bawah.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Siklus Resmi TA {activeYear}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* FLOWCHART CONTAINER */}
          <div className="max-w-4xl mx-auto space-y-3">
            
            {/* NODE 0: START */}
            <div className="flex flex-col items-center">
              <div className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-extrabold text-xs tracking-wider uppercase shadow-md flex items-center gap-2 border-2 border-slate-700">
                <PlayCircle className="w-4 h-4 text-emerald-400" />
                <span>MULAI: Login Pengguna &amp; Pilih Tahun Anggaran</span>
              </div>
              <div className="w-0.5 h-6 bg-slate-300 my-1" />
              <ArrowDown className="w-4 h-4 text-slate-400 -mt-2" />
            </div>

            {/* NODE 1: PENETAPAN KONTEKS */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => scrollToStage(1)}
                className={`w-full max-w-xl p-4 rounded-2xl border-2 transition-all cursor-pointer text-left shadow-xs hover:shadow-md hover:scale-[1.01] ${
                  selectedStage === 1
                    ? "border-blue-600 bg-blue-50/80 ring-4 ring-blue-100"
                    : "border-blue-200 bg-white hover:border-blue-400"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      1
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        Tahap 1: Penetapan Konteks Risiko
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                          Konteks
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Sasaran Strategis/Program/Kegiatan • Analisis Stakeholders • Regulasi Acuan • Insiden Lalu
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-600 shrink-0" />
                </div>
              </button>
              <div className="w-0.5 h-6 bg-slate-300 my-1" />
              <ArrowDown className="w-4 h-4 text-slate-400 -mt-2" />
            </div>

            {/* NODE 2: IDENTIFIKASI RISIKO */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => scrollToStage(2)}
                className={`w-full max-w-xl p-4 rounded-2xl border-2 transition-all cursor-pointer text-left shadow-xs hover:shadow-md hover:scale-[1.01] ${
                  selectedStage === 2
                    ? "border-emerald-600 bg-emerald-50/80 ring-4 ring-emerald-100"
                    : "border-emerald-200 bg-white hover:border-emerald-400"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      2
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        Tahap 2: Identifikasi Risiko
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Identifikasi
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Formula Wajib: <strong>[Penyebab] $\rightarrow$ [Peristiwa] $\rightarrow$ [Dampak]</strong> • 5 Kategori Risiko
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              </button>
              <div className="w-0.5 h-6 bg-slate-300 my-1" />
              <ArrowDown className="w-4 h-4 text-slate-400 -mt-2" />
            </div>

            {/* NODE 3: ANALISIS RISIKO 5x5 */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => scrollToStage(3)}
                className={`w-full max-w-xl p-4 rounded-2xl border-2 transition-all cursor-pointer text-left shadow-xs hover:shadow-md hover:scale-[1.01] ${
                  selectedStage === 3
                    ? "border-amber-600 bg-amber-50/80 ring-4 ring-amber-100"
                    : "border-amber-200 bg-white hover:border-amber-400"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-amber-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      3
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        Tahap 3: Analisis Risiko &amp; Matriks 5×5
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                          Scoring
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Kemungkinan (1-5) × Dampak (1-5) = Besaran Skor • Filter Risiko Prioritas (Skor $\ge 12$)
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-600 shrink-0" />
                </div>
              </button>
              <div className="w-0.5 h-6 bg-slate-300 my-1" />
              <ArrowDown className="w-4 h-4 text-slate-400 -mt-2" />
            </div>

            {/* NODE 4: RENCANA TINDAK PENGENDALIAN (RTP) */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => scrollToStage(4)}
                className={`w-full max-w-xl p-4 rounded-2xl border-2 transition-all cursor-pointer text-left shadow-xs hover:shadow-md hover:scale-[1.01] ${
                  selectedStage === 4
                    ? "border-purple-600 bg-purple-50/80 ring-4 ring-purple-100"
                    : "border-purple-200 bg-white hover:border-purple-400"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      4
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        Tahap 4: Rencana Tindak Pengendalian (RTP)
                        <span className="text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                          Mitigasi
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Uraian Tindakan Konkret • Penanggung Jawab (Jabatan) • Target Triwulan • Bukti Output
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-600 shrink-0" />
                </div>
              </button>
              <div className="w-0.5 h-6 bg-slate-300 my-1" />
              <ArrowDown className="w-4 h-4 text-slate-400 -mt-2" />
            </div>

            {/* NODE 5: PENGAJUAN & GATE AUDITOR APIP (DENGAN CABANG KEPUTUSAN REVIU) */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => scrollToStage(5)}
                className={`w-full max-w-xl p-4 rounded-2xl border-2 transition-all cursor-pointer text-left shadow-xs hover:shadow-md hover:scale-[1.01] ${
                  selectedStage === 5
                    ? "border-rose-600 bg-rose-50/80 ring-4 ring-rose-100"
                    : "border-rose-200 bg-white hover:border-rose-400"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      5
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        Tahap 5: Pengajuan &amp; Reviu Auditor APIP
                        <span className="text-[10px] bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full font-bold">
                          Pengawasan Itjen
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Kirim ke Auditor APIP $\rightarrow$ Telaah Inspektorat Jenderal $\rightarrow$ Catatan Perbaikan di Inbox
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-600 shrink-0" />
                </div>
              </button>

              <div className="w-0.5 h-6 bg-slate-300 my-1" />
              <ArrowDown className="w-4 h-4 text-slate-400 -mt-2" />

              {/* DECISION NODE: HASIL REVIU APIP */}
              <div className="w-full max-w-xl my-2 p-3 bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-md text-xs">
                <div className="flex items-center justify-center gap-2 font-bold text-amber-400 mb-2">
                  <SearchCheck className="w-4 h-4" />
                  <span>Gerbang Keputusan Reviu Auditor APIP:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-rose-950/70 border border-rose-700/60 rounded-xl flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-200 block">Ada Catatan / Perbaikan:</span>
                      <span className="text-rose-300/90 leading-tight block mt-0.5">
                        Unit baca catatan di Inbox $\rightarrow$ Perbaiki di Tahap 2, 3, atau 4 $\rightarrow$ Ajukan ulang.
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-emerald-950/70 border border-emerald-700/60 rounded-xl flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-200 block">Disetujui APIP:</span>
                      <span className="text-emerald-300/90 leading-tight block mt-0.5">
                        Profil risiko disahkan $\rightarrow$ Lanjut ke pelaksanaan mitigasi &amp; pemantauan berkala.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-0.5 h-6 bg-slate-300 my-1" />
              <ArrowDown className="w-4 h-4 text-slate-400 -mt-2" />
            </div>

            {/* NODE 6: PEMANTAUAN & KETERJADIAN */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => scrollToStage(6)}
                className={`w-full max-w-xl p-4 rounded-2xl border-2 transition-all cursor-pointer text-left shadow-xs hover:shadow-md hover:scale-[1.01] ${
                  selectedStage === 6
                    ? "border-teal-600 bg-teal-50/80 ring-4 ring-teal-100"
                    : "border-teal-200 bg-white hover:border-teal-400"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-teal-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      6
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        Tahap 6: Pemantauan, Keterjadian, &amp; Efektifitas
                        <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">
                          Monitoring
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Progres RTP Triwulanan • Catat Insiden Riil Lapangan • Evaluasi Risiko Residual
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-teal-600 shrink-0" />
                </div>
              </button>
              <div className="w-0.5 h-6 bg-slate-300 my-1" />
              <ArrowDown className="w-4 h-4 text-slate-400 -mt-2" />
            </div>

            {/* NODE 7: PELAPORAN RESMI & DASHBOARD */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => scrollToStage(7)}
                className={`w-full max-w-xl p-4 rounded-2xl border-2 transition-all cursor-pointer text-left shadow-xs hover:shadow-md hover:scale-[1.01] ${
                  selectedStage === 7
                    ? "border-slate-800 bg-slate-100 ring-4 ring-slate-200"
                    : "border-slate-300 bg-white hover:border-slate-500"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-slate-800 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      7
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        Tahap 7: Pelaporan Resmi &amp; Monitoring Dashboard
                        <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold">
                          Pelaporan
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Cetak Laporan PDF Resmi (Pengesahan Pimpinan) • Unduh Excel • Peta Panas Heat Map 5×5
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-700 shrink-0" />
                </div>
              </button>
              <div className="w-0.5 h-6 bg-slate-300 my-1" />
              <ArrowDown className="w-4 h-4 text-slate-400 -mt-2" />
            </div>

            {/* NODE END: SELESAI */}
            <div className="flex flex-col items-center">
              <div className="px-6 py-2.5 rounded-full bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md flex items-center gap-2 border-2 border-emerald-500">
                <Flag className="w-4 h-4 text-amber-300" />
                <span>SELESAI: Profil Risiko Sah &amp; Siklus Pengendalian Berjalan</span>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* ====================================================================== */}
      {/* 3. PENJELASAN SETIAP ALUR TAHAPAN SECARA MENYELURUH                    */}
      {/* ====================================================================== */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-emerald-600" />
              Penjelasan Rinci Setiap Alur Tahapan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Pelajari langkah teknis, tujuan, menu aplikasi, dan ketentuan penting untuk masing-masing tahapan alur di atas.
            </p>
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 print:hidden">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Lompat ke:</span>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <button
                key={num}
                onClick={() => scrollToStage(num)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedStage === num
                    ? "bg-emerald-600 text-white shadow-xs scale-105"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* LIST OF STAGES DETAIL CARDS */}
        <div className="space-y-6">
          {stages.map((st) => {
            const IconComp = st.icon;

            return (
              <div
                key={st.step}
                id={st.id}
                className={`scroll-mt-24 rounded-2xl border-2 transition-all p-5 sm:p-6 shadow-sm bg-white ${
                  selectedStage === st.step
                    ? "border-emerald-600 ring-4 ring-emerald-100 shadow-md"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Header Tahapan */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex items-start gap-3.5">
                    <span className={`w-10 h-10 rounded-xl bg-gradient-to-r ${st.color} text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs mt-0.5`}>
                      {st.step}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          Tahap {st.step}: {st.title}
                        </h3>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${st.badgeColor}`}>
                          Alur {st.step}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {st.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Link
                      href={st.menuPath}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-semibold flex items-center gap-1.5 border border-emerald-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka {st.menuName}</span>
                    </Link>
                  </div>
                </div>

                {/* Sub Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
                  {/* Kolom 1: Ringkasan, Pelaksana, & Output */}
                  <div className="space-y-4 lg:col-span-1">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        🎯 Tujuan Tahapan:
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {st.tujuan}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        👥 Pelaksana Bertanggung Jawab:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {st.roles.map((r, i) => (
                          <span key={i} className="text-[11px] bg-white text-slate-800 font-semibold px-2 py-0.5 rounded border border-slate-200">
                            • {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
                      <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                        📦 Output yang Dihasilkan:
                      </span>
                      <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                        {st.output}
                      </p>
                    </div>
                  </div>

                  {/* Kolom 2: Panduan Langkah Teknis di Aplikasi */}
                  <div className="space-y-3 lg:col-span-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Langkah-Langkah Teknis di Aplikasi:
                    </h4>

                    <div className="space-y-2.5">
                      {st.langkahTeknis.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors flex items-start gap-3 shadow-xs"
                        >
                          <span className="font-mono font-bold text-xs bg-slate-100 text-emerald-800 px-2 py-0.5 rounded border border-slate-200 shrink-0 mt-0.5">
                            {item.no}
                          </span>
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                              {item.nama}
                            </span>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {item.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Do's and Don'ts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                        <span className="font-bold text-emerald-900 flex items-center gap-1 mb-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Kriteria Benar (Do):
                        </span>
                        <p className="text-emerald-800 leading-relaxed">
                          {st.doAndDont.do}
                        </p>
                      </div>

                      <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs">
                        <span className="font-bold text-red-900 flex items-center gap-1 mb-1">
                          <XCircle className="w-3.5 h-3.5 text-red-600" /> Hal yang Dilarang (Don't):
                        </span>
                        <p className="text-red-800 leading-relaxed">
                          {st.doAndDont.dont}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================================== */}
      {/* 4. ASISTEN AI SI-MARI (BANTUAN KONSULTASI INTERAKTIF)                   */}
      {/* ====================================================================== */}
      <Card className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-none shadow-xl rounded-3xl overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
              <Bot className="w-4 h-4 text-amber-400" />
              <span>Butuh Bantuan Lebih Lanjut?</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Konsultasikan Pertanyaan Anda dengan Si-MaRi AI
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Jika Anda ragu dalam merumuskan kalimat risiko, menentukan matriks skor 5×5, atau menyusun butir RTP, gunakan asisten cerdas <strong>Si-MaRi AI</strong> pada ikon chatbox di pojok kanan bawah layar untuk konsultasi langsung 24/7!
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md flex items-center gap-3">
              <Bot className="w-8 h-8 text-emerald-400 animate-bounce" />
              <div className="text-xs">
                <span className="font-bold text-white block">Si-MaRi AI Online</span>
                <span className="text-[11px] text-emerald-300">Klik tombol di kanan bawah</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
