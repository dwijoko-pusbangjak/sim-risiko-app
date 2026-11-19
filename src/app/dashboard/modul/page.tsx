"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BookMarked,
  Printer,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Target,
  ClipboardList,
  FolderTree,
  ShieldCheck,
  SearchCheck,
  BarChart4,
  Users,
  Flame,
  Copy,
  Check,
  FileText,
  Bot,
  Info,
  Layers,
  RotateCcw,
  CheckCircle,
  XCircle,
  GitBranch,
  PlayCircle,
  ExternalLink,
  X
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ModulPanduanPage() {
  const { user, activeYear } = useAuth();
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [activeModalStage, setActiveModalStage] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [copiedFormula, setCopiedFormula] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);

  const handleCopyFormula = () => {
    const formulaText = "[Penyebab / Akar Masalah] (Adanya... / Karena...) -> [Peristiwa Risiko] (Menyebabkan / Berpotensi terjadinya...) -> [Dampak] (Mengakibatkan / Berdampak pada...)";
    navigator.clipboard.writeText(formulaText);
    setCopiedFormula(true);
    toast.success("Formula baku pernyataan risiko berhasil disalin ke clipboard!");
    setTimeout(() => setCopiedFormula(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // 8 Tahapan Alur Lengkap Proses Aplikasi (Serpentine Wave / Zigzag Diagram)
  const stages = [
    {
      step: 1,
      numStr: "01",
      id: "stage-1",
      title: "Penetapan Konteks Risiko",
      subtitle: "Menetapkan parameter dasar sasaran, pemangku kepentingan, dan regulasi acuan",
      menuPath: "/dashboard/mr-konteks",
      menuName: "Menu Penetapan Konteks",
      roles: ["Unit Kerja Eselon 1", "Unit Kerja Eselon 2", "Pengelola Risiko Kementerian"],
      roleFilter: "unit",
      color: "from-emerald-600 to-teal-700",
      accentBg: "bg-emerald-50 border-emerald-200 text-emerald-900",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      borderColor: "border-[#10b981]",
      circleBg: "bg-gradient-to-br from-emerald-500 to-teal-700",
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
      numStr: "02",
      id: "stage-2",
      title: "Identifikasi Risiko",
      subtitle: "Merumuskan seluruh potensi peristiwa risiko menggunakan formula baku wajib",
      menuPath: "/dashboard/mr-identifikasi",
      menuName: "Menu Identifikasi Risiko",
      roles: ["Unit Kerja Eselon 1", "Unit Kerja Eselon 2", "Pengelola Risiko Kementerian"],
      roleFilter: "unit",
      color: "from-rose-500 to-pink-700",
      accentBg: "bg-rose-50 border-rose-200 text-rose-900",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
      borderColor: "border-[#f43f5e]",
      circleBg: "bg-gradient-to-br from-rose-500 to-pink-700",
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
      numStr: "03",
      id: "stage-3",
      title: "Analisis Risiko (Matriks 5×5)",
      subtitle: "Menilai tingkat kemungkinan keterjadian dan keparahan dampak (Permenpan RB 5/2020)",
      menuPath: "/dashboard/mr-analisis",
      menuName: "Menu Analisis Risiko",
      roles: ["Unit Kerja Eselon 1", "Unit Kerja Eselon 2", "Pengelola Risiko Kementerian"],
      roleFilter: "unit",
      color: "from-indigo-600 to-blue-700",
      accentBg: "bg-indigo-50 border-indigo-200 text-indigo-900",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      borderColor: "border-[#6366f1]",
      circleBg: "bg-gradient-to-br from-indigo-500 to-blue-700",
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
      numStr: "04",
      id: "stage-4",
      title: "Rencana Tindak Pengendalian (RTP)",
      subtitle: "Merancang mitigasi konkret, menunjuk PIC penanggung jawab, dan target waktu",
      menuPath: "/dashboard/mr-rtp",
      menuName: "Menu Rencana Tindak Pengendalian",
      roles: ["Unit Kerja Eselon 1", "Unit Kerja Eselon 2", "Pengelola Risiko Kementerian"],
      roleFilter: "unit",
      color: "from-amber-500 to-orange-600",
      accentBg: "bg-amber-50 border-amber-200 text-amber-900",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      borderColor: "border-[#f97316]",
      circleBg: "bg-gradient-to-br from-amber-500 to-orange-600",
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
          nama: "Pilih Target Waktu (Bulan, Rentang Bulan, atau Triwulan)",
          detail: "Pilih opsi target waktu: Bulan (Jan-Des), Rentang Bulan (Dari - Sampai), atau Triwulan 1-4. Sistem otomatis mendeteksi status batas waktu & keterlambatan."
        },
        {
          no: "4.5",
          nama: "Tetapkan Bukti Output & Bentuk Komunikasi",
          detail: "Cantumkan bentuk komunikasi serta dokumen bukti fisik penyelesaian tindakan (contoh: Dokumen SOP, Notulensi Rapat, SK Tim)."
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
      numStr: "05",
      id: "stage-5",
      title: "Pengajuan & Reviu APIP",
      subtitle: "Pengajuan profil risiko ke APIP dan telaah catatan perbaikan (Gate Pengawasan)",
      menuPath: "/dashboard/proses-audit/kirim",
      menuName: "Menu Kirim & Reviu APIP",
      roles: ["Unit Kerja (Pengaju)", "Auditor APIP / Inspektorat Jenderal (Penelaah)"],
      roleFilter: "auditor",
      color: "from-sky-500 to-blue-600",
      accentBg: "bg-sky-50 border-sky-200 text-sky-900",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
      borderColor: "border-[#0284c7]",
      circleBg: "bg-gradient-to-br from-sky-400 to-blue-600",
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
      numStr: "06",
      id: "stage-6",
      title: "Pemantauan RTP & Keterjadian",
      subtitle: "Melaporkan progres mitigasi berkala, mencatat insiden riil, dan menguji efektifitas",
      menuPath: "/dashboard/mr-pemantauan",
      menuName: "Menu Pemantauan & Keterjadian",
      roles: ["Unit Kerja Eselon 1", "Unit Kerja Eselon 2", "Pengelola Risiko Kementerian"],
      roleFilter: "unit",
      color: "from-pink-600 to-rose-700",
      accentBg: "bg-pink-50 border-pink-200 text-pink-900",
      badgeColor: "bg-pink-100 text-pink-800 border-pink-200",
      borderColor: "border-[#e11d48]",
      circleBg: "bg-gradient-to-br from-pink-500 to-rose-700",
      icon: BarChart4,
      tujuan: "Memastikan rencana mitigasi benar-benar diimplementasikan di lapangan dan mengevaluasi apakah risiko residual berhasil diturunkan.",
      langkahTeknis: [
        {
          no: "6.1",
          nama: "Pemantauan Pelaksanaan RTP Berkala",
          detail: "Laporkan status tindakan berkala: persentase progres (0-100%), link eviden, serta deteksi otomatis apakah Dalam Masa Pelaksanaan atau Melebihi Batas Waktu."
        },
        {
          no: "6.2",
          nama: "Pencatatan Keterjadian Risiko Riil",
          detail: "Jika peristiwa risiko terjadi di lapangan, buka menu 'Pencatatan Keterjadian'. Catat tanggal, kronologi singkat, dan nilai kerugian nyata."
        },
        {
          no: "6.3",
          nama: "Uji Efektifitas Rencana Mitigasi",
          detail: "Pada menu 'Efektifitas RTP', lakukan penilaian ulang terhadap skor kemungkinan dan dampak setelah mitigasi dijalankan (Residual Risk)."
        },
        {
          no: "6.4",
          nama: "Analisis Otomatis RTP & Keputusan",
          detail: "Buka menu 'Analisis RTP' untuk melihat seluruh RTP 100% Selesai, klik tombol Analisis untuk telaah otomatis dan penetapan arahan pimpinan."
        }
      ],
      output: "Laporan Pemantauan Triwulanan, Lembar Analisis Keputusan, dan Penurunan Risiko Residual.",
      doAndDont: {
        do: "Laporkan status kemajuan mitigasi secara faktual dan tepat waktu sebelum pergantian triwulan.",
        dont: "Jangan menyembunyikan kejadian risiko riil, karena data keterjadian penting untuk mitigasi tahun depan."
      }
    },
    {
      step: 7,
      numStr: "07",
      id: "stage-7",
      title: "Cetak Laporan & Monitoring",
      subtitle: "Menghasilkan format laporan dinas resmi (PDF & Excel) serta Heat Map interaktif",
      menuPath: "/dashboard/laporan",
      menuName: "Menu Cetak Laporan & Monitoring",
      roles: ["Seluruh Unit Kerja", "Pimpinan Unit Kerja", "Pengelola Risiko Kementerian"],
      roleFilter: "kementerian",
      color: "from-blue-700 to-indigo-900",
      accentBg: "bg-blue-50 border-blue-300 text-blue-900",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      borderColor: "border-[#1e40af]",
      circleBg: "bg-gradient-to-br from-blue-600 to-indigo-950",
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
          detail: "Format cetak otomatis disesuaikan dengan tata letak dokumen resmi dinas lengkap lembar tanda tangan pengesahan pimpinan unit."
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
    },
    {
      step: 8,
      numStr: "08",
      id: "stage-8",
      title: "Siklus Kaji Ulang & SPIP",
      subtitle: "Evaluasi tahunan, pemutakhiran profil risiko baru, dan peningkatan indeks maturitas SPIP",
      menuPath: "/dashboard",
      menuName: "Dashboard Utama SIM-Risiko",
      roles: ["Komite Manajemen Risiko", "Pimpinan Unit Kerja", "Inspektorat Jenderal"],
      roleFilter: "kementerian",
      color: "from-teal-600 to-emerald-800",
      accentBg: "bg-teal-50 border-teal-200 text-teal-900",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
      borderColor: "border-[#059669]",
      circleBg: "bg-gradient-to-br from-teal-500 to-emerald-800",
      icon: RotateCcw,
      tujuan: "Memastikan siklus manajemen risiko berjalan berkelanjutan (PDCA) untuk menjaga continuous improvement dan peningkatan nilai maturitas SPIP serta Indeks MRI.",
      langkahTeknis: [
        {
          no: "8.1",
          nama: "Kaji Ulang Kinerja Pengendalian Tahunan",
          detail: "Mengevaluasi seluruh capaian mitigasi dan dampak residual risk pada penutupan tahun anggaran berjalan."
        },
        {
          no: "8.2",
          nama: "Rekonsiliasi Insiden & Database Kejadian",
          detail: "Menghimpun seluruh catatan insiden riil sebagai referensi utama penyusunan profil risiko tahun berikutnya."
        },
        {
          no: "8.3",
          nama: "Penyusunan Rekomendasi Pimpinan & Komite",
          detail: "Menetapkan arahan strategis pimpinan kementerian terhadap risiko-risiko lintas unit yang persisten."
        },
        {
          no: "8.4",
          nama: "Pergantian Tahun Anggaran Aktif (Loop ke Tahap 01)",
          detail: "Memilih tahun anggaran baru pada pemilih tahun di header aplikasi untuk memulai siklus penetapan konteks baru."
        }
      ],
      output: "Laporan Evaluasi Tahunan Manajemen Risiko dan Piagam Pembaharuan Register Risiko.",
      doAndDont: {
        do: "Jadikan hasil evaluasi tahun ini sebagai dasar perbaikan penetapan konteks di Tahap 01.",
        dont: "Jangan melakukan copy-paste profil risiko lama tanpa pemutakhiran kondisi faktual terkini."
      }
    }
  ];

  const handleStageClick = (st: typeof stages[0]) => {
    setSelectedStage(st.step);
    setActiveModalStage(st);
    setIsDetailModalOpen(true);
  };

  const handleNavigateModal = (targetStep: number) => {
    const found = stages.find((s) => s.step === targetStep);
    if (found) {
      setActiveModalStage(found);
      setSelectedStage(found.step);
    }
  };

  const currentSelectedStageData = stages.find((s) => s.step === selectedStage) || stages[0];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-20 font-sans">
      
      {/* ====================================================================== */}
      {/* 1. HEADER UTAMA (DIPERKECIL & SEWARNA TEMA EXECUTIVE NAVY APLIKASI)     */}
      {/* ====================================================================== */}
      <div className="bg-gradient-to-r from-[#0d2140] via-[#122b54] to-[#183a6d] text-white p-4 sm:p-5 rounded-2xl shadow-md border border-blue-900/50 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-sky-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                <GitBranch className="w-4 h-4 text-sky-400" />
              </span>
              <span className="text-[11px] bg-blue-500/20 text-sky-300 px-2.5 py-0.5 rounded-full border border-blue-400/30 font-bold uppercase tracking-wider">
                Alur Proses Penggunaan Aplikasi
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
              Modul Diagram Alur &amp; Panduan Tahapan SIM-Risiko
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Panduan terstruktur siklus manajemen risiko Kemendesa PDT dari penetapan konteks hingga pelaporan dan kaji ulang berkelanjutan. <strong>Klik pada kotak diagram untuk melihat rincian tahapan</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-2 border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-xs hover:scale-102 active:scale-98"
              title="Cetak modul diagram atau simpan sebagai PDF"
            >
              <Printer className="w-3.5 h-3.5 text-sky-300" />
              <span>Cetak Modul / PDF</span>
            </button>

            <button
              onClick={handleCopyFormula}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-102 active:scale-98"
              title="Salin formula baku pernyataan risiko"
            >
              {copiedFormula ? (
                <>
                  <Check className="w-3.5 h-3.5 text-amber-300" />
                  <span>Formula Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-sky-200" />
                  <span>Salin Rumus Risiko</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* 2. DIAGRAM ALUR PROSES BERGELOMBANG / SERPENTINE (SESUAI GAMBAR)        */}
      {/* ====================================================================== */}
      <Card className="shadow-sm border border-slate-200 overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-blue-700" />
                <CardTitle className="text-base sm:text-lg font-bold text-[#122b54]">
                  Diagram Alur Berkelanjutan Siklus Manajemen Risiko
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Alur bergerak berurutan: <strong>01 ➔ 02</strong> (ke bawah), lalu melingkar naik ke <strong>03 ➔ 04</strong>, ke <strong>05 ➔ 06</strong>, dan ke <strong>07 ➔ 08</strong>. <strong>Klik kotak tahapan</strong> untuk rincian keterangan.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span>Siklus Resmi TA {activeYear}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 bg-gradient-to-b from-sky-50/30 via-white to-slate-50/50">
          
          {/* Petunjuk Interaksi Ringkas */}
          <div className="flex items-center justify-between gap-2 mb-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center gap-1.5 border border-blue-200">
                <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>Titik Masuk: Login TA {activeYear}</span>
              </span>
              <span className="hidden sm:inline text-slate-400">➔ Ikuti alur pipa penghubung berwarna</span>
            </div>
            <div className="text-[11px] font-medium text-slate-400 italic">
              *Tiap kotak dapat diklik untuk membuka panduan teknis
            </div>
          </div>

          {/* AREA KANVAS DIAGRAM DENGAN HORIZONTAL SCROLL PADA LAYAR KECIL */}
          <div className="overflow-x-auto pb-4 pt-1">
            <div className="relative w-[1220px] h-[510px] mx-auto select-none">
              
              {/* ============================================================== */}
              {/* SVG PIPELINE CONNECTORS (PERSIS SESUAI BENTUK ALUR TERLAMPIR)   */}
              {/* ============================================================== */}
              <svg
                className="absolute inset-0 w-[1220px] h-[510px] pointer-events-none"
                viewBox="0 0 1220 510"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Gradien untuk Tiap Sambungan Pipa */}
                  <linearGradient id="pipe-01-02" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>

                  <linearGradient id="pipe-02-03" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>

                  <linearGradient id="pipe-03-04" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>

                  <linearGradient id="pipe-04-05" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ea580c" />
                    <stop offset="50%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>

                  <linearGradient id="pipe-05-06" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#db2777" />
                  </linearGradient>

                  <linearGradient id="pipe-06-07" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#e11d48" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#1e40af" />
                  </linearGradient>

                  <linearGradient id="pipe-07-08" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1e40af" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>

                  {/* Filter Bayangan Pipa 3D */}
                  <filter id="pipe-glow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.12" />
                  </filter>
                </defs>

                {/* 1. KONEKTOR KOLOM 1: TAHAP 01 -> TAHAP 02 (GARIS TEGAK KE BAWAH) */}
                <g filter="url(#pipe-glow)">
                  <path
                    d="M 150 185 V 300"
                    stroke="#f1f5f9"
                    strokeWidth="22"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 150 185 V 300"
                    stroke="url(#pipe-01-02)"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                </g>

                {/* 2. KONEKTOR LENGKUNGAN HURUF U: DARI TAHAP 02 KE TAHAP 03 */}
                <g filter="url(#pipe-glow)">
                  {/* Lapisan Luar Pipa */}
                  <path
                    d="M 150 415 V 445 A 30 30 0 0 0 180 475 H 275 A 30 30 0 0 0 305 445 V 55 A 30 30 0 0 1 335 25 H 430 A 30 30 0 0 1 460 55 V 70"
                    stroke="#f1f5f9"
                    strokeWidth="22"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Lapisan Warna Pipa */}
                  <path
                    d="M 150 415 V 445 A 30 30 0 0 0 180 475 H 275 A 30 30 0 0 0 305 445 V 55 A 30 30 0 0 1 335 25 H 430 A 30 30 0 0 1 460 55 V 70"
                    stroke="url(#pipe-02-03)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                {/* 3. KONEKTOR KOLOM 2: TAHAP 03 -> TAHAP 04 (GARIS TEGAK KE BAWAH) */}
                <g filter="url(#pipe-glow)">
                  <path
                    d="M 460 185 V 300"
                    stroke="#f1f5f9"
                    strokeWidth="22"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 460 185 V 300"
                    stroke="url(#pipe-03-04)"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                </g>

                {/* 4. KONEKTOR LENGKUNGAN HURUF U: DARI TAHAP 04 KE TAHAP 05 */}
                <g filter="url(#pipe-glow)">
                  <path
                    d="M 460 415 V 445 A 30 30 0 0 0 490 475 H 585 A 30 30 0 0 0 615 445 V 55 A 30 30 0 0 1 645 25 H 740 A 30 30 0 0 1 770 55 V 70"
                    stroke="#f1f5f9"
                    strokeWidth="22"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 460 415 V 445 A 30 30 0 0 0 490 475 H 585 A 30 30 0 0 0 615 445 V 55 A 30 30 0 0 1 645 25 H 740 A 30 30 0 0 1 770 55 V 70"
                    stroke="url(#pipe-04-05)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                {/* 5. KONEKTOR KOLOM 3: TAHAP 05 -> TAHAP 06 (GARIS TEGAK KE BAWAH) */}
                <g filter="url(#pipe-glow)">
                  <path
                    d="M 770 185 V 300"
                    stroke="#f1f5f9"
                    strokeWidth="22"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 770 185 V 300"
                    stroke="url(#pipe-05-06)"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                </g>

                {/* 6. KONEKTOR LENGKUNGAN HURUF U: DARI TAHAP 06 KE TAHAP 07 */}
                <g filter="url(#pipe-glow)">
                  <path
                    d="M 770 415 V 445 A 30 30 0 0 0 800 475 H 895 A 30 30 0 0 0 925 445 V 55 A 30 30 0 0 1 955 25 H 1050 A 30 30 0 0 1 1080 55 V 70"
                    stroke="#f1f5f9"
                    strokeWidth="22"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 770 415 V 445 A 30 30 0 0 0 800 475 H 895 A 30 30 0 0 0 925 445 V 55 A 30 30 0 0 1 955 25 H 1050 A 30 30 0 0 1 1080 55 V 70"
                    stroke="url(#pipe-06-07)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                {/* 7. KONEKTOR KOLOM 4: TAHAP 07 -> TAHAP 08 (GARIS TEGAK KE BAWAH) */}
                <g filter="url(#pipe-glow)">
                  <path
                    d="M 1080 185 V 300"
                    stroke="#f1f5f9"
                    strokeWidth="22"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 1080 185 V 300"
                    stroke="url(#pipe-07-08)"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                </g>

                {/* 8. INDIKATOR SIKLUS BERULANG DARI TAHAP 08 KE PERIODE BERIKUTNYA */}
                <g filter="url(#pipe-glow)">
                  <path
                    d="M 1080 415 V 445 A 25 25 0 0 0 1105 470 H 1135 A 15 15 0 0 0 1150 455 V 445"
                    stroke="#e2e8f0"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 1080 415 V 445 A 25 25 0 0 0 1105 470 H 1135 A 15 15 0 0 0 1150 455 V 445"
                    stroke="#059669"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <polygon points="1150,432 1144,446 1156,446" fill="#059669" />
                </g>
              </svg>

              {/* ============================================================== */}
              {/* KOTAK-KOTAK TAHAPAN SESUAI TATA LETAK DIAGRAM                  */}
              {/* Kolom 1: Tahap 01 (Atas) & Tahap 02 (Bawah)                    */}
              {/* Kolom 2: Tahap 03 (Atas) & Tahap 04 (Bawah)                    */}
              {/* Kolom 3: Tahap 05 (Atas) & Tahap 06 (Bawah)                    */}
              {/* Kolom 4: Tahap 07 (Atas) & Tahap 08 (Bawah)                    */}
              {/* ============================================================== */}
              {[
                { stage: stages[0], left: 35, top: 70 },
                { stage: stages[1], left: 35, top: 300 },
                { stage: stages[2], left: 345, top: 70 },
                { stage: stages[3], left: 345, top: 300 },
                { stage: stages[4], left: 655, top: 70 },
                { stage: stages[5], left: 655, top: 300 },
                { stage: stages[6], left: 965, top: 70 },
                { stage: stages[7], left: 965, top: 300 },
              ].map(({ stage, left, top }) => {
                const isSelected = selectedStage === stage.step;

                return (
                  <div
                    key={stage.step}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleStageClick(stage)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleStageClick(stage);
                      }
                    }}
                    style={{ left: `${left}px`, top: `${top}px`, width: "230px", height: "115px" }}
                    className={`absolute z-10 bg-white rounded-2xl border-[3.5px] ${stage.borderColor} shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer p-3 flex items-center gap-3 text-left group hover:scale-[1.02] active:scale-[0.98] ${
                      isSelected ? "ring-4 ring-blue-500/30 scale-[1.02]" : ""
                    }`}
                  >
                    {/* Lingkaran Nomor Menonjol di Sisi Kiri Kotak (Persis Seperti Gambar) */}
                    <div className="shrink-0 -ml-1">
                      <div className={`w-12 h-12 rounded-full ${stage.circleBg} text-white font-extrabold text-base flex items-center justify-center shadow-md border-2 border-white group-hover:scale-105 transition-transform`}>
                        {stage.numStr}
                      </div>
                    </div>

                    {/* Konten Teks di Sisi Kanan Kotak */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Tahap {stage.numStr}
                        </span>
                        <span className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          <Info className="w-2.5 h-2.5" />
                          <span>Detail</span>
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors leading-tight line-clamp-2 mt-0.5">
                        {stage.title}
                      </h4>

                      <p className="text-[10.5px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                        {stage.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Label Mulai di Samping Kiri Kotak 01 */}
              <div className="absolute left-[35px] top-[32px] text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mulai Siklus</span>
              </div>

              {/* Label Siklus Berulang di Kanan Bawah Kotak 08 */}
              <div className="absolute left-[965px] top-[425px] text-[11px] font-extrabold text-teal-800 uppercase tracking-wider flex items-center gap-1.5 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 shadow-2xs">
                <RotateCcw className="w-3.5 h-3.5 text-teal-600 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Siklus Berkelanjutan (PDCA)</span>
              </div>

            </div>
          </div>

          {/* Navigasi Keterangan Singkat & Legend Alur */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-700">Legenda Tahapan:</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> 01 Konteks</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" /> 02 Identifikasi</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" /> 03 Analisis 5×5</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" /> 04 RTP</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" /> 05 Reviu APIP</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" /> 06 Pemantauan</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1e40af]" /> 07 Pelaporan</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#059669]" /> 08 Kaji Ulang</span>
            </div>

            <div className="text-slate-400 text-[11px]">
              Klik pada kotak manapun untuk membuka dialog rincian teknis lengkap
            </div>
          </div>

        </CardContent>
      </Card>

      {/* ====================================================================== */}
      {/* 3. PANEL TAMPILAN DETAIL TAHAPAN YANG SEDANG DIPILIH                   */}
      {/* ====================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <span className={`w-9 h-9 rounded-xl bg-gradient-to-r ${currentSelectedStageData.color} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs`}>
              {currentSelectedStageData.numStr}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Keterangan Tahap {currentSelectedStageData.numStr}: {currentSelectedStageData.title}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${currentSelectedStageData.badgeColor}`}>
                  Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentSelectedStageData.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setActiveModalStage(currentSelectedStageData);
                setIsDetailModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-blue-200 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Buka Pop-up Detail Lengkap</span>
            </button>
            <Link
              href={currentSelectedStageData.menuPath}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka {currentSelectedStageData.menuName}</span>
            </Link>
          </div>
        </div>

        {/* Ringkasan Cepat Tahapan Terpilih */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] block">🎯 Tujuan:</span>
            <p className="text-slate-700 leading-relaxed font-medium">{currentSelectedStageData.tujuan}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] block">👥 Pelaksana:</span>
            <div className="flex flex-wrap gap-1">
              {currentSelectedStageData.roles.map((r, i) => (
                <span key={i} className="bg-white text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1">
            <span className="font-bold text-blue-900 uppercase tracking-wider text-[11px] block">📦 Output:</span>
            <p className="text-blue-950 font-semibold leading-relaxed">{currentSelectedStageData.output}</p>
          </div>
        </div>

        {/* Tombol Toggle Buka Seluruh Panduan Rinci 8 Tahapan */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => setShowAllDetails(!showAllDetails)}
            className="text-xs font-semibold text-slate-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span>{showAllDetails ? "Sembunyikan Seluruh Panduan Lengkap" : "Tampilkan Seluruh Panduan Lengkap (8 Tahapan Sekaligus)"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllDetails ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* 4. PENJELASAN LENGKAP SETIAP TAHAPAN (KONDISIONAL / CETAK)              */}
      {/* ====================================================================== */}
      {showAllDetails && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-blue-600" />
              Penjelasan Rinci Seluruh Alur Tahapan (01 s.d. 08)
            </h2>
            <p className="text-xs text-slate-500">
              Uraian menyeluruh langkah teknis, tujuan, menu aplikasi, dan ketentuan Do &amp; Don't untuk setiap tahapan.
            </p>
          </div>

          <div className="space-y-6">
            {stages.map((st) => (
              <div
                key={st.step}
                id={st.id}
                className={`scroll-mt-24 rounded-2xl border-2 transition-all p-5 sm:p-6 shadow-xs bg-white ${
                  selectedStage === st.step
                    ? "border-blue-600 ring-2 ring-blue-100 shadow-md"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Header Tahapan */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex items-start gap-3.5">
                    <span className={`w-10 h-10 rounded-xl bg-gradient-to-r ${st.color} text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs mt-0.5`}>
                      {st.numStr}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          Tahap {st.numStr}: {st.title}
                        </h3>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${st.badgeColor}`}>
                          Alur {st.numStr}
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
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg font-semibold flex items-center gap-1.5 border border-blue-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka {st.menuName}</span>
                    </Link>
                  </div>
                </div>

                {/* Sub Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
                  <div className="space-y-4 lg:col-span-1">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        🎯 Tujuan Tahapan:
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {st.tujuan}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        👥 Pelaksana Bertanggung Jawab:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {st.roles.map((r, i) => (
                          <span key={i} className="text-[10px] bg-white text-slate-800 font-semibold px-2 py-0.5 rounded border border-slate-200">
                            • {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1">
                      <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                        📦 Output yang Dihasilkan:
                      </span>
                      <p className="text-xs text-blue-950 font-semibold leading-relaxed">
                        {st.output}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 lg:col-span-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Langkah-Langkah Teknis di Aplikasi:
                    </h4>

                    <div className="space-y-2.5">
                      {st.langkahTeknis.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors flex items-start gap-3 shadow-2xs"
                        >
                          <span className="font-mono font-bold text-xs bg-slate-100 text-blue-800 px-2 py-0.5 rounded border border-slate-200 shrink-0 mt-0.5">
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
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 5. MODAL DETAIL TAHAPAN (MUNCUL KETIKA KOTAK DIAGRAM DIKLIK)           */}
      {/* ====================================================================== */}
      {isDetailModalOpen && activeModalStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 p-4 sm:p-6 print:hidden">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className={`p-5 sm:p-6 bg-gradient-to-r ${activeModalStage.color} text-white flex items-start justify-between gap-4 shrink-0 shadow-sm`}>
              <div className="flex items-start gap-3.5">
                <span className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md text-white font-black text-lg flex items-center justify-center shrink-0 border border-white/30 shadow-xs mt-0.5">
                  {activeModalStage.numStr}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[11px] bg-white/25 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-white/30">
                      Tahap {activeModalStage.numStr} dari 08
                    </span>
                    <span className="text-[11px] bg-black/20 text-white/90 px-2.5 py-0.5 rounded-full font-medium border border-white/20">
                      {activeModalStage.menuName}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                    Tahap {activeModalStage.numStr}: {activeModalStage.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 mt-0.5 leading-relaxed">
                    {activeModalStage.subtitle}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all shrink-0 cursor-pointer"
                title="Tutup Modal Detail"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal (Scrollable) */}
            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1 bg-slate-50/40">
              
              {/* Ringkasan: Tujuan, Pelaksana, Output */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-600" />
                    Tujuan Tahapan:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {activeModalStage.tujuan}
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    Pelaksana Bertanggung Jawab:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {activeModalStage.roles.map((r: string, i: number) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-700" />
                    Output yang Dihasilkan:
                  </span>
                  <p className="text-xs text-blue-950 font-semibold leading-relaxed">
                    {activeModalStage.output}
                  </p>
                </div>
              </div>

              {/* Langkah-Langkah Teknis di Aplikasi */}
              <div className="space-y-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Langkah-Langkah Teknis Pengoperasian di Aplikasi:
                </h4>

                <div className="space-y-2.5">
                  {activeModalStage.langkahTeknis.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors flex items-start gap-3"
                    >
                      <span className="font-mono font-bold text-xs bg-white text-blue-700 px-2.5 py-1 rounded-md border border-slate-200 shrink-0 shadow-2xs">
                        {item.no}
                      </span>
                      <div className="space-y-0.5 flex-1">
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
              </div>

              {/* Do's and Don'ts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs shadow-2xs">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1 text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Kriteria Benar (Do):
                  </span>
                  <p className="text-emerald-800 leading-relaxed">
                    {activeModalStage.doAndDont.do}
                  </p>
                </div>

                <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-xs shadow-2xs">
                  <span className="font-bold text-red-900 flex items-center gap-1.5 mb-1 text-xs">
                    <XCircle className="w-4 h-4 text-red-600" /> Hal yang Dilarang (Don't):
                  </span>
                  <p className="text-red-800 leading-relaxed">
                    {activeModalStage.doAndDont.dont}
                  </p>
                </div>
              </div>

            </div>

            {/* Footer Modal dengan Navigasi Sebelumnya / Selanjutnya dan Buka Menu */}
            <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  disabled={activeModalStage.step <= 1}
                  onClick={() => handleNavigateModal(activeModalStage.step - 1)}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Tahap Sebelumnya</span>
                </button>
                <button
                  disabled={activeModalStage.step >= 8}
                  onClick={() => handleNavigateModal(activeModalStage.step + 1)}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Tahap Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <Link
                  href={activeModalStage.menuPath}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka {activeModalStage.menuName}</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 6. ASISTEN AI SI-MARI (BANTUAN KONSULTASI INTERAKTIF)                   */}
      {/* ====================================================================== */}
      <Card className="bg-gradient-to-r from-[#0d2140] via-[#122b54] to-[#183a6d] text-white border-none shadow-md rounded-2xl overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2 text-sky-300 font-bold text-xs uppercase tracking-wider">
              <Bot className="w-4 h-4 text-amber-400" />
              <span>Butuh Bantuan Lebih Lanjut?</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Konsultasikan Alur Pengelolaan dengan Si-MaRi AI
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Jika Anda ragu dalam merumuskan kalimat risiko, menentukan matriks skor 5×5, atau menyusun butir RTP, gunakan asisten cerdas <strong>Si-MaRi AI</strong> pada ikon chatbox di pojok kanan bawah layar untuk konsultasi langsung 24/7!
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md flex items-center gap-3">
              <Bot className="w-7 h-7 text-sky-400 animate-bounce" />
              <div className="text-xs">
                <span className="font-bold text-white block">Si-MaRi AI Online</span>
                <span className="text-[11px] text-sky-300">Klik tombol di kanan bawah</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

    </div>
  );
}
