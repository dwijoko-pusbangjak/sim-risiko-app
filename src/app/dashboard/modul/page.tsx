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
  ArrowRight,
  ShieldAlert,
  FileText,
  BookOpen,
  Bot,
  Sparkles,
  Info
} from "lucide-react";
import { toast } from "sonner";

export default function ModulPanduanPage() {
  const { user, activeYear } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"alur" | "menu" | "role" | "matriks" | "faq">("alur");
  const [copiedFormula, setCopiedFormula] = useState(false);

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

  // 7 Tahapan Utama
  const tahapanList = [
    {
      step: 1,
      title: "Penetapan Konteks",
      menu: "Menu Penetapan Konteks",
      icon: ClipboardList,
      color: "from-blue-600 to-indigo-700",
      bgLight: "bg-blue-50 border-blue-200 text-blue-900",
      desc: "Menetapkan parameter dasar pengelolaan risiko unit kerja, menghubungkan sasaran kinerja, mengidentifikasi pemangku kepentingan (stakeholders), menginventarisir regulasi, serta mengevaluasi insiden/kendala tahun lalu.",
      keyPoints: [
        "Pilih Tahun Anggaran aktif yang sesuai.",
        "Kaitkan dengan Sasaran Strategis / Program / Kegiatan.",
        "Identifikasi Pemangku Kepentingan Internal (pegawai, pimpinan) dan Eksternal (Pemda, Kemenkeu, BPKP, Desa).",
        "Dokumentasikan peraturan perundang-undangan pendukung."
      ]
    },
    {
      step: 2,
      title: "Identifikasi Risiko",
      menu: "Menu Proses MR -> Identifikasi Risiko",
      icon: FolderTree,
      color: "from-emerald-600 to-teal-700",
      bgLight: "bg-emerald-50 border-emerald-200 text-emerald-900",
      desc: "Menggali dan mencatat seluruh peristiwa ketidakpastian potensial yang dapat menghambat pencapaian target output. Wajib menggunakan formula baku: [Penyebab] -> [Peristiwa Risiko] -> [Dampak].",
      keyPoints: [
        "Pernyataan risiko BUKAN sekadar kalimat negasi sasaran.",
        "Uraikan Akar Penyebab (Cause) yang konkret dan faktual.",
        "Deskripsikan Peristiwa Risiko (Event) yang mungkin terjadi di masa depan.",
        "Jelaskan Dampak (Impact) kerugian riil (kinerja, finansial, reputasi, hukum).",
        "Pilih Kategori Risiko: Operasional, Kebijakan, Kepatuhan, Keuangan, atau Reputasi."
      ]
    },
    {
      step: 3,
      title: "Analisis & Matriks 5×5",
      menu: "Menu Proses MR -> Analisis Risiko",
      icon: Flame,
      color: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50 border-amber-200 text-amber-900",
      desc: "Menilai tingkat kemungkinan keterjadian dan tingkat keparahan dampak berdasarkan standar Permenpan RB No. 5/2020 untuk memperoleh Besaran Risiko (Skor 1 s.d. 25) dan Level Risiko.",
      keyPoints: [
        "Skor Kemungkinan (P / 1-5): dari Hampir Tidak Terjadi (<10%) s.d. Hampir Pasti (>80%).",
        "Skor Dampak (D / 1-5): dari Tidak Signifikan s.d. Katastropik/Sangat Berat.",
        "Besaran Risiko = Kemungkinan × Dampak.",
        "Risiko dengan skor >= 12 otomatis masuk kategori Risiko Prioritas."
      ]
    },
    {
      step: 4,
      title: "Rencana Tindak Pengendalian (RTP)",
      menu: "Menu Proses MR -> Rencana Tindak Pengendalian",
      icon: ShieldCheck,
      color: "from-purple-600 to-indigo-700",
      bgLight: "bg-purple-50 border-purple-200 text-purple-900",
      desc: "Merancang tindakan mitigasi konkret dan terukur untuk menurunkan tingkat kemungkinan terjadinya risiko atau memperkecil keparahan dampak jika risiko terjadi.",
      keyPoints: [
        "Uraian Tindakan: Kegiatan nyata perbaikan SOP, sistem, atau pengawasan.",
        "Penanggung Jawab: Nama jabatan struktural/tim kerja (bukan nama pribadi).",
        "Target Waktu: Triwulan penyelesaian yang terukur (Triwulan I, II, III, atau IV).",
        "Indikator Bukti Output: Dokumen fisik bukti penyelesaian (SK, SOP, Notulensi)."
      ]
    },
    {
      step: 5,
      title: "Pengajuan & Reviu Auditor APIP",
      menu: "Menu Proses Audit -> Kirim ke Auditor & Inbox",
      icon: SearchCheck,
      color: "from-rose-600 to-pink-700",
      bgLight: "bg-rose-50 border-rose-200 text-rose-900",
      desc: "Mengajukan daftar risiko yang telah disusun kepada Auditor APIP (Inspektorat Jenderal) untuk ditelaah, diberikan catatan perbaikan, dan disahkan sebagai profil risiko resmi.",
      keyPoints: [
        "Pastikan data konteks, identifikasi, analisis, dan RTP telah terisi lengkap.",
        "Klik tombol 'Kirim ke Auditor APIP' pada menu Kirim ke Auditor.",
        "Pantau catatan telaah dan rekomendasi perbaikan di menu Inbox Hasil Auditor.",
        "Lakukan penyesuaian jika auditor meminta revisi, lalu ajukan kembali."
      ]
    },
    {
      step: 6,
      title: "Pemantauan & Evaluasi Efektifitas",
      menu: "Menu Pemantauan RTP, Keterjadian, & Efektifitas",
      icon: BarChart4,
      color: "from-teal-600 to-emerald-700",
      bgLight: "bg-teal-50 border-teal-200 text-teal-900",
      desc: "Memantau berkala realisasi butir RTP, mencatat peristiwa risiko yang benar-benar terjadi di lapangan, dan menguji apakah tingkat risiko berhasil turun (Residual Risk).",
      keyPoints: [
        "Pemantauan RTP: Laporkan status Belum Dilaksanakan, Dalam Proses, atau Selesai 100%.",
        "Pencatatan Keterjadian: Catat tanggal kejadian dan nilai kerugian nyata jika risiko terwujud.",
        "Efektifitas RTP: Ukur skor sisa risiko (Residual Risk) setelah mitigasi dijalankan."
      ]
    },
    {
      step: 7,
      title: "Cetak Laporan & Dokumentasi",
      menu: "Menu Laporan & Ekspor -> Cetak Laporan",
      icon: FileText,
      color: "from-slate-700 to-slate-900",
      bgLight: "bg-slate-100 border-slate-300 text-slate-900",
      desc: "Mencetak laporan dinas resmi atau mengunduh lembar kerja Excel dinamis untuk dokumentasi akuntabilitas kinerja instansi pemerintah.",
      keyPoints: [
        "Laporan Matriks Register Risiko & Peta Risiko.",
        "Laporan Rencana Tindak Pengendalian (RTP).",
        "Laporan Pemantauan Triwulanan & Keterjadian.",
        "Dukungan format Cetak PDF resmi lengkap lembar pengesahan dan Unduh Excel (.xlsx)."
      ]
    }
  ];

  // Role Guides
  const roleGuides = [
    {
      roleName: "Pengelola Risiko Tingkat Kementerian",
      code: "kementerian",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      summary: "Mengelola risiko strategis makro kementerian, mengawasi konsolidasi peta risiko nasional seluruh unit Eselon 1 dan 2, serta mengelola Katalog Peraturan resmi.",
      tasks: [
        "Menetapkan Sasaran Strategis kementerian pada menu Cascading Kinerja.",
        "Menyusun profil risiko tingkat kementerian (Konteks, Identifikasi, Analisis, RTP).",
        "Memantau Dashboard Konsolidasi Nasional dan beralih ke unit Eselon 1 & 2 via dropdown.",
        "Mengunggah dokumen regulasi dan mengelola status berlaku pada Katalog Peraturan.",
        "Menghasilkan rekapitulasi laporan profil risiko kementerian."
      ]
    },
    {
      roleName: "Unit Kerja Eselon 1",
      code: "eselon_1",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      summary: "Mengelola sasaran program dan risiko strategis unit eselon 1, serta memantau profil risiko unit-unit Eselon 2 di bawah binaannya.",
      tasks: [
        "Menyusun Sasaran Program unit Eselon 1 pada menu Cascading Kinerja.",
        "Menyusun Penetapan Konteks dan Identifikasi Risiko program eselon 1.",
        "Memantau Dashboard Konsolidasi Eselon 1 yang mencakup data unit eselon 2 binaannya.",
        "Mengajukan profil risiko ke Auditor APIP dan memantau status persetujuan.",
        "Memantau realisasi pelaksanaan RTP triwulanan."
      ]
    },
    {
      roleName: "Unit Kerja Eselon 2",
      code: "eselon_2",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      summary: "Ujung tombak pelaksana kegiatan operasional teknis yang mengidentifikasi, menganalisis, memitigasi, dan memantau risiko kegiatan secara detail.",
      tasks: [
        "Menyusun Sasaran Kegiatan teknis pada menu Cascading Kinerja.",
        "Menyusun Penetapan Konteks spesifik unit kerja.",
        "Mengidentifikasi risiko teknis operasional dengan formula baku [Sebab]->[Peristiwa]->[Dampak].",
        "Melakukan analisis skor matriks 5×5 dan menyusun butir RTP terukur.",
        "Mengajukan ke Auditor APIP, merevisi sesuai catatan, dan melaporkan pemantauan berkala."
      ]
    },
    {
      roleName: "Auditor APIP (Inspektorat Jenderal)",
      code: "auditor",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
      summary: "Pengawas intern pemerintah yang bertugas menelaah, menguji kepatuhan metodologi, memberikan rekomendasi perbaikan per butir risiko, dan mengesahkan profil risiko unit.",
      tasks: [
        "Membuka menu Audit Risiko untuk melihat antrean pengajuan unit kerja.",
        "Menelaah kualitas perumusan pernyataan risiko dan kelogisan matriks skor 5×5.",
        "Memberikan Catatan Telaah Umum dan Catatan Detail Per Kolom.",
        "Menetapkan status persetujuan (Disetujui / Dikembalikan untuk Perbaikan).",
        "Memantau hasil pemantauan dan pencatatan keterjadian risiko instansi."
      ]
    },
    {
      roleName: "Pimpinan Unit Kerja",
      code: "pimpinan",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      summary: "Pimpinan eksekutif yang memantau profil risiko unit, mengarahkan prioritas mitigasi, dan menandatangani lembar pengesahan laporan resmi.",
      tasks: [
        "Memantau Dashboard Eksekutif terkait total risiko, risiko prioritas, dan status RTP.",
        "Mengarahkan alokasi sumber daya untuk percepatan butir RTP yang berstatus prioritas/terlambat.",
        "Menandatangani lembar pengesahan profil risiko pada menu Cetak Laporan."
      ]
    },
    {
      roleName: "Administrator Sistem (Admin)",
      code: "admin",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
      summary: "Pengelola teknis aplikasi yang bertanggung jawab atas hierarki master unit kerja, manajemen akun pengguna, backup basis data, dan integritas sistem.",
      tasks: [
        "Mengelola data master unit kerja (Tingkat Kementerian, Eselon 1, Eselon 2) dan relasi induk-anak.",
        "Membuat, mengaktifkan, menonaktifkan, dan mereset kata sandi akun pengguna.",
        "Memantau audit trail pada menu Log Aktivitas.",
        "Melakukan pencadangan (backup) berkala dan pemulihan data (restore).",
        "Mengelola Katalog Peraturan."
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-16 font-sans">
      {/* ====================================================================== */}
      {/* 1. HEADER MODUL & PANDUAN                                              */}
      {/* ====================================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-emerald-900/50 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
                <BookMarked className="w-6 h-6 text-emerald-400" />
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 font-semibold uppercase tracking-wider">
                Buku Saku & Panduan Resmi
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Modul Alur Kerja & Panduan Penggunaan SIM-Risiko
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Petunjuk operasional terpadu Sistem Informasi Manajemen Risiko Kementerian Desa, PDT, dan Transmigrasi untuk seluruh tingkatan unit kerja berdasarkan <strong>PP No. 60 Tahun 2008</strong> dan <strong>Permenpan RB No. 5 Tahun 2020</strong>.
            </p>
          </div>

          {/* Action Buttons Header */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              title="Cetak modul atau simpan sebagai PDF"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span>Cetak / Simpan PDF</span>
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

        {/* Quick Search Bar inside Header */}
        <div className="mt-6 pt-5 border-t border-emerald-900/60 print:hidden">
          <div className="relative max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari topik panduan (contoh: rumus risiko, auditor, matriks 5x5, RTP, kementerian)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-emerald-800/60 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* 2. TAB NAVIGASI MODUL                                                  */}
      {/* ====================================================================== */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-xs print:hidden">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveTab("alur")}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "alur"
                ? "bg-white text-emerald-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <FolderTree className="w-4 h-4 text-emerald-600" />
            <span>Alur Utama (7 Tahap)</span>
          </button>

          <button
            onClick={() => setActiveTab("role")}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "role"
                ? "bg-white text-indigo-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Panduan per Role</span>
          </button>

          <button
            onClick={() => setActiveTab("matriks")}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "matriks"
                ? "bg-white text-amber-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Flame className="w-4 h-4 text-amber-600" />
            <span>Matriks 5×5 & Rumus</span>
          </button>

          <button
            onClick={() => setActiveTab("menu")}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "menu"
                ? "bg-white text-blue-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <span>Panduan Menu Lengkap</span>
          </button>

          <button
            onClick={() => setActiveTab("faq")}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "faq"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <HelpCircle className="w-4 h-4 text-slate-600" />
            <span>FAQ & Kendala</span>
          </button>
        </div>

        <div className="px-3 py-1 text-xs text-slate-500 font-medium hidden lg:block">
          Unit: <strong>{user?.unitName || "Kemendesa PDT"}</strong> • TA {activeYear}
        </div>
      </div>

      {/* ====================================================================== */}
      {/* 3. KONTEN TAB 1: ALUR KERJA UTAMA (7 TAHAPAN)                          */}
      {/* ====================================================================== */}
      {(activeTab === "alur" || searchTerm) && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Siklus Manajemen Risiko Terintegrasi (7 Tahapan Wajib)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Langkah berurutan yang harus dilaksanakan oleh setiap unit kerja dalam siklus tahun anggaran aktif.
              </p>
            </div>
          </div>

          {/* VISUAL FLOWCHART STEP-BY-STEP */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tahapanList
              .filter((t) => 
                !searchTerm || 
                t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                t.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.keyPoints.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
              )
              .map((t) => {
                const IconComponent = t.icon;

                return (
                  <Card key={t.step} className="shadow-sm hover:shadow-md transition-all border-slate-200 overflow-hidden flex flex-col justify-between group">
                    <CardHeader className="p-4 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`w-8 h-8 rounded-xl bg-gradient-to-r ${t.color} text-white font-black text-sm flex items-center justify-center shadow-xs`}>
                          {t.step}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          Tahap {t.step}
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {t.title}
                      </CardTitle>
                      <CardDescription className="text-[11px] text-emerald-700 font-semibold">
                        {t.menu}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {t.desc}
                      </p>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 text-[11px] text-slate-700">
                        <span className="font-bold text-slate-900 block text-[10px] uppercase tracking-wider text-emerald-800">
                          Poin Penting:
                        </span>
                        {t.keyPoints.slice(0, 3).map((pt, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold shrink-0">•</span>
                            <span className="leading-tight">{pt}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 4. KONTEN TAB 2: PANDUAN PER ROLE / PERAN USER                         */}
      {/* ====================================================================== */}
      {(activeTab === "role" || searchTerm) && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Tugas & Wewenang Berdasarkan Peran (Role-Based Guide)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Setiap akun memiliki cakupan akses dan peran tersendiri di dalam aplikasi SIM-Risiko Kemendesa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roleGuides
              .filter((r) =>
                !searchTerm ||
                r.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.tasks.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
              )
              .map((r, idx) => (
                <Card key={idx} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                  <CardHeader className="p-5 pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${r.badgeColor}`}>
                        Role: {r.code}
                      </span>
                      {user?.role === r.code && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Peran Anda
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      {r.roleName}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {r.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Tanggung Jawab Utama:
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {r.tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <span className="leading-relaxed">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 5. KONTEN TAB 3: STANDAR MATRIKS 5x5 & FORMULA BAKU                    */}
      {/* ====================================================================== */}
      {(activeTab === "matriks" || searchTerm) && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              Formula Baku Pernyataan Risiko & Matriks 5×5 (Permenpan RB 5/2020)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Pedoman resmi penulisan kalimat risiko dan metode penetapan skor kemungkinan serta dampak.
            </p>
          </div>

          {/* KOTAK FORMULA BAKU */}
          <Card className="border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-white shadow-sm overflow-hidden">
            <CardHeader className="p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base font-bold text-emerald-950 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-emerald-600" />
                  Formula Baku Pernyataan Risiko:
                </CardTitle>
                <button
                  onClick={handleCopyFormula}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
                >
                  {copiedFormula ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFormula ? "Tersalin!" : "Salin Rumus"}</span>
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-xs text-xs sm:text-sm leading-relaxed font-mono text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <span>[PENYEBAB / CAUSE]</span>
                  <span>$\rightarrow$</span>
                  <span>[PERISTIWA RISIKO / EVENT]</span>
                  <span>$\rightarrow$</span>
                  <span>[DAMPAK / IMPACT]</span>
                </div>
                <p className="font-sans text-xs text-slate-700 italic border-t border-slate-100 pt-2">
                  "Adanya [Akar Masalah/Penyebab] (Sebab), yang berpotensi menyebabkan [Kejadian Buruk Masa Depan] (Peristiwa), sehingga mengakibatkan [Kerugian Nyata Target/Keuangan/Kinerja] (Dampak)."
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="font-bold text-red-900 block mb-1">❌ Contoh Salah (Negasi Sasaran semata):</span>
                  <p className="text-red-700">"Target sosialisasi tidak tercapai" atau "Anggaran tidak terserap 100%".</p>
                  <p className="text-[11px] text-red-600 mt-1 italic">*Salah karena tidak menjelaskan apa penyebabnya dan apa konsekuensi kerugiannya.</p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="font-bold text-emerald-900 block mb-1">✅ Contoh Benar (Memenuhi 3 Unsur):</span>
                  <p className="text-emerald-800">
                    "Adanya keterlambatan petunjuk teknis pelaksanaan dari pusat (Sebab), yang menyebabkan penundaan jadwal bimbingan teknis di daerah (Peristiwa), sehingga realisasi serapan anggaran triwulan mengalami deviasi negatif &gt; 20% (Dampak)."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TABEL SKALA 5x5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skala Kemungkinan */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Skala Kemungkinan (Likelihood / Frekuensi)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-3 bg-blue-50/50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-950 block">5 - Hampir Pasti Terjadi</span>
                      <span className="text-slate-600 text-[11px]">Probabilitas &gt; 80% atau terjadi hampir di setiap kegiatan tahunan.</span>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">4 - Sering Terjadi</span>
                      <span className="text-slate-600 text-[11px]">Probabilitas 50% - 80% atau beberapa kali dalam satu tahun anggaran.</span>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">3 - Kadang Terjadi</span>
                      <span className="text-slate-600 text-[11px]">Probabilitas 30% - 50% atau sekitar 1 kali dalam satu tahun.</span>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">2 - Jarang Terjadi</span>
                      <span className="text-slate-600 text-[11px]">Probabilitas 10% - 30% atau 1 kali dalam 2-3 tahun.</span>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">1 - Hampir Tidak Terjadi</span>
                      <span className="text-slate-600 text-[11px]">Probabilitas &lt; 10% atau maksimal 1 kali dalam 5 tahun.</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skala Dampak */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  Skala Dampak (Consequence / Konsekuensi)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-3 bg-red-50/50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-red-950 block">5 - Katastropik / Sangat Signifikan</span>
                      <span className="text-slate-600 text-[11px]">Kegagalan fatal target strategis nasional, temuan hukum berat, reputasi instansi tercemar.</span>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">4 - Signifikan / Berat</span>
                      <span className="text-slate-600 text-[11px]">Target IKU terganggu signifikan, deviasi penyerapan tinggi, sorotan media massa luas.</span>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">3 - Moderat / Sedang</span>
                      <span className="text-slate-600 text-[11px]">Penundaan capaian output 1 s.d. 3 bulan, kerugian finansial sedang, keluhan stakeholders.</span>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">2 - Minor / Rendah</span>
                      <span className="text-slate-600 text-[11px]">Keterlambatan ringan (&lt; 1 bulan), kerugian finansial kecil, dapat diatasi prosedur rutin.</span>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">1 - Tidak Signifikan</span>
                      <span className="text-slate-600 text-[11px]">Dampak sangat kecil dan tidak mempengaruhi capaian target kinerja maupun anggaran.</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 6. KONTEN TAB 4: PANDUAN TEKNIS PER MENU                                */}
      {/* ====================================================================== */}
      {(activeTab === "menu" || searchTerm) && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Petunjuk Pengoperasian Menu per Menu di SIM-Risiko
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Langkah teknis penggunaan setiap menu di dalam sistem.
            </p>
          </div>

          <div className="space-y-4">
            {/* Menu 1 */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-600" />
                1. Menu Penetapan Konteks
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Di menu ini Anda menetapkan konteks internal dan eksternal unit kerja. Isikan sasaran yang menjadi acuan, inventarisir siapa saja pemangku kepentingan (stakeholder) internal maupun eksternal beserta ekspektasinya, cantumkan peraturan yang relevan, serta dokumentasikan catatan masalah masa lalu.
              </p>
            </div>

            {/* Menu 2 */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-emerald-600" />
                2. Menu Identifikasi Risiko
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Klik tombol <strong>"Tambah Risiko"</strong>. Pilih sasaran dan indikator kinerja terkait, kemudian rumuskan <em>Penyebab</em>, <em>Peristiwa Risiko</em>, dan <em>Dampak</em>. Pilih kategori risiko dan evaluasi apakah sistem pengendalian internal yang ada saat ini sudah memadai atau belum.
              </p>
            </div>

            {/* Menu 3 */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                3. Menu Analisis Risiko
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Pada daftar risiko yang telah diidentifikasi, tentukan <strong>Skor Kemungkinan (1-5)</strong> dan <strong>Skor Dampak (1-5)</strong>. Sistem secara otomatis menghitung Besaran Skor dan mengkategorikan levelnya (Sangat Rendah hingga Sangat Tinggi). Risiko dengan skor $\ge 12$ otomatis ditetapkan sebagai Risiko Prioritas.
              </p>
            </div>

            {/* Menu 4 */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                4. Menu Rencana Tindak Pengendalian (RTP)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Khususnya untuk risiko level Sedang, Tinggi, dan Sangat Tinggi, tambahkan butir-butir tindakan pengendalian mitigasi. Setiap butir wajib memuat uraian tindakan nyata, jabatan penanggung jawab, target triwulan penyelesaian, dan indikator bukti output.
              </p>
            </div>

            {/* Menu 5 */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <SearchCheck className="w-4 h-4 text-rose-600" />
                5. Menu Proses Audit (Kirim & Inbox)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Setelah seluruh data tersusun rapi, buka menu <strong>Kirim ke Auditor</strong> dan klik tombol <strong>"Kirim ke Auditor APIP"</strong>. Status pengajuan Anda akan berubah menjadi <em>Submitted</em>. Cek secara berkala menu <strong>Inbox Hasil Auditor</strong> untuk membaca catatan telaah atau persetujuan resmi dari Inspektorat Jenderal.
              </p>
            </div>

            {/* Menu 6 */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                6. Menu Katalog Peraturan
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Terletak tepat di bawah Dashboard, menu ini adalah repositori regulasi resmi manajemen risiko. Seluruh user dapat mencari, membaca, dan mengunduh peraturan yang berstatus <strong>Berlaku</strong>. Pengguna Admin dan Pengelola Risiko Kementerian memiliki wewenang mengunggah peraturan baru dan mengubah status berlaku/tidak berlaku.
              </p>
            </div>

            {/* Menu 7 */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-600" />
                7. Asisten Kecerdasan Buatan (Si-MaRi AI)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tersedia tombol obrolan mengambang di pojok kanan bawah layar. Anda dapat menanyakan apa saja seputar rumus risiko, meminta contoh risiko tematik khusus unit kerja Anda, panduan scoring matriks 5×5, maupun konsultasi alur pengawasan APIP kapan saja!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 7. KONTEN TAB 5: FAQ & TROUBLESHOOTING                                 */}
      {/* ====================================================================== */}
      {(activeTab === "faq" || searchTerm) && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-slate-600" />
              Pertanyaan yang Sering Diajukan (FAQ & Solusi Kendala)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Jawaban cepat atas kendala teknis dan pertanyaan yang sering dihadapi pengguna.
            </p>
          </div>

          <div className="space-y-3">
            <Card className="shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-emerald-600 font-extrabold">Q:</span>
                  Kenapa tombol "Kirim ke Auditor" tidak bisa diklik atau berwarna abu-abu?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>A:</strong> Tombol pengiriman ke auditor hanya akan aktif jika unit kerja Anda telah menginput minimal 1 identifikasi risiko lengkap dengan skor analisis kemungkinan &amp; dampak serta butir Rencana Tindak Pengendalian (RTP). Pastikan tidak ada data yang kosong.
              </CardContent>
            </Card>

            <Card className="shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-emerald-600 font-extrabold">Q:</span>
                  Bagaimana jika saya perlu mengubah data risiko yang sudah terlanjur dikirim ke Auditor APIP?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>A:</strong> Saat status pengajuan masih <em>Submitted</em>, isian dikunci untuk menjaga integritas telaah auditor. Anda dapat menghubungi tim Auditor APIP Inspektorat Jenderal untuk memberikan catatan atau mengembalikan berkas (<em>request revision</em>) sehingga status kembali menjadi dapat disunting.
              </CardContent>
            </Card>

            <Card className="shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-emerald-600 font-extrabold">Q:</span>
                  Kenapa pada menu Katalog Peraturan saya tidak melihat tombol "Tambah Peraturan"?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>A:</strong> Hak penambahan, penyuntingan, pengunggahan dokumen PDF, dan perubahan status berlaku pada Katalog Peraturan secara khusus diberikan kepada role <strong>Administrator</strong> dan <strong>Pengelola Risiko Kementerian</strong>. User unit kerja lainnya memiliki hak akses membaca dan mengunduh seluruh peraturan yang berlaku.
              </CardContent>
            </Card>

            <Card className="shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-emerald-600 font-extrabold">Q:</span>
                  Bagaimana cara mengganti tahun anggaran kerja?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>A:</strong> Pada bilah atas (*top bar*) aplikasi, terdapat indikator Tahun Anggaran Aktif. Anda dapat memilih tahun anggaran yang ingin dilihat atau dikerjakan melalui selektor tahun tersebut.
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
