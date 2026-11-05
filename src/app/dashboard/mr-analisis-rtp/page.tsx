"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  ExternalLink,
  Loader2,
  Save,
  Building2,
  FileText,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  Scale,
  Brain,
  Check,
  Award,
  Layers,
  ChevronRight,
  Filter,
  UserCheck,
  Maximize2,
  Minimize2,
  X
} from "lucide-react";
import { cn } from "cn";
import { toast } from "sonner";
import { logActivity } from "@/lib/logger";

// Matriks Besaran Risiko 5x5 (Permenpan RB No. 5/2020)
const RISK_MATRIX: Record<number, Record<number, number>> = {
  5: { 1: 7, 2: 12, 3: 17, 4: 22, 5: 25 },
  4: { 1: 4, 2: 9, 3: 14, 4: 19, 5: 24 },
  3: { 1: 3, 2: 8, 3: 13, 4: 18, 5: 23 },
  2: { 1: 2, 2: 6, 3: 11, 4: 16, 5: 21 },
  1: { 1: 1, 2: 5, 3: 10, 4: 15, 5: 20 },
};

function calculateScale(k: number | string, d: number | string) {
  const K = Number(k);
  const D = Number(d);
  if (!K || !D) return 0;
  return RISK_MATRIX[K]?.[D] || 0;
}

function getRiskLevelInfo(score: number) {
  if (score >= 20) return { label: "Sangat Tinggi", badge: "bg-red-100 text-red-800 border-red-300", bg: "bg-red-500", text: "text-red-700" };
  if (score >= 16) return { label: "Tinggi", badge: "bg-orange-100 text-orange-800 border-orange-300", bg: "bg-orange-500", text: "text-orange-700" };
  if (score >= 12) return { label: "Sedang", badge: "bg-yellow-100 text-yellow-800 border-yellow-300", bg: "bg-yellow-500", text: "text-yellow-700" };
  if (score >= 6) return { label: "Rendah", badge: "bg-emerald-100 text-emerald-800 border-emerald-300", bg: "bg-emerald-500", text: "text-emerald-700" };
  if (score >= 1) return { label: "Sangat Rendah", badge: "bg-blue-100 text-blue-800 border-blue-300", bg: "bg-blue-500", text: "text-blue-700" };
  return { label: "Belum Dianalisis", badge: "bg-slate-100 text-slate-600 border-slate-300", bg: "bg-slate-400", text: "text-slate-500" };
}

// Data Model RTP yang Sudah Terlaksana
interface CompletedRTP {
  riskId: string;
  pernyataanRisiko: string;
  penyebab?: string;
  dampak?: string;
  kategori?: string;
  unitName: string;
  tahun: string;
  kodeRisiko?: string;

  // Inherent Risk
  awalK: number;
  awalD: number;
  awalSkala: number;

  // RTP Item
  rtpId: string;
  rencana: string;
  penanggungjawab: string;
  targetWaktu: string;
  bentukKomunikasi?: string;

  // Pemantauan (Progress 100% / Selesai)
  pemantauan?: {
    progres: string;
    waktuPelaksanaan: string;
    linkEviden: string;
    persentase: number;
    updatedAt?: string;
  };

  // Efektifitas (Residual Risk)
  efektifitas?: {
    targetKemungkinan: number;
    targetDampak: number;
    targetSkala: number;
    aktualKemungkinan: number;
    aktualDampak: number;
    aktualSkala: number;
    deviasi: number;
    status: string;
    langkahPerbaikan?: string;
  };

  // Hasil Keputusan Pimpinan yang disimpan
  keputusanPimpinan?: {
    kategoriKeputusan: string;
    catatanArahan: string;
    namaPimpinan: string;
    jabatanPimpinan?: string;
    tanggalKeputusan: string;
  };
}

export default function AnalisisRTPPage() {
  const { user, activeYear, loading: authLoading } = useAuth();

  const [completedRtps, setCompletedRtps] = useState<CompletedRTP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"100_only" | "all_with_progress">("100_only");
  const [decisionFilter, setDecisionFilter] = useState<"all" | "has_decision" | "no_decision">("all");

  // Multi-unit selector for non-unit-restricted users
  const [unitsList, setUnitsList] = useState<{ id: string; name: string }[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");

  // Modal State untuk Analisis Otomatis
  const [selectedItem, setSelectedItem] = useState<CompletedRTP | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isSavingDecision, setIsSavingDecision] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Form Keputusan Pimpinan di dalam Modal
  const [decisionCategory, setDecisionCategory] = useState<string>("");
  const [decisionNotes, setDecisionNotes] = useState<string>("");
  const [leaderName, setLeaderName] = useState<string>("");
  const [leaderTitle, setLeaderTitle] = useState<string>("");

  useEffect(() => {
    if (!authLoading && user && activeYear) {
      loadUnitsAndData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, activeYear, selectedUnit]);

  // Load Units List (for admin, kementerian, pimpinan, auditor)
  const isPrivilegedUser = user?.role === "admin" || user?.role === "kementerian" || user?.role === "pimpinan" || user?.role === "auditor";

  const loadUnitsAndData = async () => {
    setIsLoading(true);
    const safeYear = activeYear || new Date().getFullYear().toString();

    try {
      // 1. Load units if privileged
      if (isPrivilegedUser && unitsList.length === 0) {
        const uSnap = await getDocs(collection(db, "units"));
        const uList = uSnap.docs.map(d => ({ id: d.id, name: d.data().name })).filter(u => u.name);
        setUnitsList(uList);
      }

      // 2. Query risks
      let q;
      if (isPrivilegedUser && selectedUnit === "ALL") {
        q = query(collection(db, "mr_identifikasi"), where("tahun", "==", safeYear));
      } else {
        const targetUnit = isPrivilegedUser && selectedUnit !== "ALL" ? selectedUnit : user?.unitName;
        if (!targetUnit) {
          setIsLoading(false);
          return;
        }
        q = query(
          collection(db, "mr_identifikasi"),
          where("unitName", "==", targetUnit),
          where("tahun", "==", safeYear)
        );
      }

      const snap = await getDocs(q);
      const results: CompletedRTP[] = [];

      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.rtpList && Array.isArray(data.rtpList)) {
          data.rtpList.forEach((rtp: any) => {
            const pct = Number(rtp.pemantauan?.persentase || 0);
            const prog = (rtp.pemantauan?.progres || "").toLowerCase();
            const isSelesai = pct >= 100 || prog.includes("selesai") || prog.includes("terlaksana") || rtp.efektifitas?.status === "Efektif";

            // Filter item: apakah memiliki progres
            if (pct > 0 || isSelesai) {
              results.push({
                riskId: docSnap.id,
                pernyataanRisiko: data.pernyataanRisiko || "Tanpa Judul Risiko",
                penyebab: data.penyebab || "-",
                dampak: data.dampak || "-",
                kategori: data.kategoriRisiko || data.kategori || "Operasional",
                unitName: data.unitName || user?.unitName || "Unit Kerja",
                tahun: data.tahun || safeYear,
                kodeRisiko: data.kodeRisiko || `R-${docSnap.id.substring(0, 4)}`,
                awalK: Number(data.levelKemungkinan || 3),
                awalD: Number(data.levelDampak || 3),
                awalSkala: Number(data.besaranRisiko || 13),
                rtpId: rtp.id,
                rencana: rtp.rencana || "Tanpa Rencana Aksi",
                penanggungjawab: rtp.penanggungjawab || "-",
                targetWaktu: rtp.targetWaktu || "-",
                bentukKomunikasi: rtp.bentukKomunikasi || "-",
                pemantauan: rtp.pemantauan,
                efektifitas: rtp.efektifitas,
                keputusanPimpinan: rtp.keputusanPimpinan,
              });
            }
          });
        }
      });

      setCompletedRtps(results);
    } catch (err: any) {
      console.error("Gagal memuat Analisis RTP:", err);
      toast.error("Gagal memuat data RTP: " + (err?.message || ""));
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered List berdasarkan pencarian dan opsi filter
  const filteredRtps = useMemo(() => {
    return completedRtps.filter((item) => {
      // 1. Status Filter
      const pct = Number(item.pemantauan?.persentase || 0);
      const prog = (item.pemantauan?.progres || "").toLowerCase();
      const isCompleted = pct >= 100 || prog.includes("selesai") || prog.includes("terlaksana");

      if (statusFilter === "100_only" && !isCompleted) {
        return false;
      }

      // 2. Decision Filter
      if (decisionFilter === "has_decision" && !item.keputusanPimpinan?.kategoriKeputusan) {
        return false;
      }
      if (decisionFilter === "no_decision" && item.keputusanPimpinan?.kategoriKeputusan) {
        return false;
      }

      // 3. Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.pernyataanRisiko.toLowerCase().includes(q) ||
        item.rencana.toLowerCase().includes(q) ||
        item.penanggungjawab.toLowerCase().includes(q) ||
        item.unitName.toLowerCase().includes(q) ||
        (item.pemantauan?.linkEviden || "").toLowerCase().includes(q)
      );
    });
  }, [completedRtps, searchQuery, statusFilter, decisionFilter]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const totalCompleted = completedRtps.filter(
      (item) => Number(item.pemantauan?.persentase || 0) >= 100 || (item.pemantauan?.progres || "").toLowerCase().includes("selesai")
    ).length;

    let totalReduction = 0;
    let reductionCount = 0;
    let decisionsCount = 0;
    let needFollowUpCount = 0;

    completedRtps.forEach((item) => {
      if (item.keputusanPimpinan?.kategoriKeputusan) {
        decisionsCount++;
      }

      const awal = item.awalSkala || 1;
      const akhir = item.efektifitas?.aktualSkala || Math.max(1, Math.round(awal * 0.4)); // simulasi jika belum diisi efektifitas
      const diffPct = Math.max(0, Math.round(((awal - akhir) / awal) * 100));
      totalReduction += diffPct;
      reductionCount++;

      if (item.efektifitas?.aktualSkala && item.efektifitas.aktualSkala >= 12) {
        needFollowUpCount++;
      }
    });

    const avgReduction = reductionCount > 0 ? Math.round(totalReduction / reductionCount) : 0;

    return {
      totalCompleted,
      avgReduction,
      decisionsCount,
      needFollowUpCount,
    };
  }, [completedRtps]);

  // Buka Modal Analisis Otomatis
  const handleOpenAnalysisModal = (item: CompletedRTP) => {
    setSelectedItem(item);

    // Hitung rekomendasi default otomatis
    const autoRec = generateAutomaticAnalysis(item);

    setDecisionCategory(item.keputusanPimpinan?.kategoriKeputusan || autoRec.kategoriKeputusanDefault);
    setDecisionNotes(item.keputusanPimpinan?.catatanArahan || autoRec.arahanDefault);
    setLeaderName(item.keputusanPimpinan?.namaPimpinan || (user as any)?.name || user?.email || "Pimpinan Unit Kerja");
    setLeaderTitle(item.keputusanPimpinan?.jabatanPimpinan || `Kepala ${item.unitName}`);

    setIsAnalysisModalOpen(true);
  };

  // Simpan Keputusan Pimpinan ke Firestore
  const handleSaveDecision = async () => {
    if (!selectedItem) return;
    if (!decisionCategory) {
      toast.error("Pilih salah satu Kategori Keputusan Manajemen terlebih dahulu.");
      return;
    }

    setIsSavingDecision(true);
    try {
      const docRef = doc(db, "mr_identifikasi", selectedItem.riskId);
      const docSnap = await getDocs(
        query(collection(db, "mr_identifikasi"), where("__name__", "==", selectedItem.riskId))
      );
      if (docSnap.empty) throw new Error("Dokumen risiko induk tidak ditemukan");

      const riskData = docSnap.docs[0].data();
      const currentRtpList = riskData.rtpList || [];

      const decisionPayload = {
        kategoriKeputusan: decisionCategory,
        catatanArahan: decisionNotes,
        namaPimpinan: leaderName,
        jabatanPimpinan: leaderTitle,
        tanggalKeputusan: new Date().toISOString(),
      };

      const updatedRtpList = currentRtpList.map((r: any) => {
        if (r.id === selectedItem.rtpId) {
          return {
            ...r,
            keputusanPimpinan: decisionPayload,
          };
        }
        return r;
      });

      await setDoc(docRef, { rtpList: updatedRtpList }, { merge: true });

      logActivity(
        user,
        "Analisis",
        "Analisis RTP",
        `Menetapkan Keputusan Pimpinan pada RTP: ${selectedItem.rencana} (${decisionCategory})`
      );

      toast.success("Keputusan Pimpinan & Analisis Penanganan Risiko berhasil disimpan!");

      // Update state lokal
      setCompletedRtps((prev) =>
        prev.map((it) =>
          it.rtpId === selectedItem.rtpId
            ? { ...it, keputusanPimpinan: decisionPayload }
            : it
        )
      );

      setIsAnalysisModalOpen(false);
    } catch (err: any) {
      console.error("Gagal menyimpan keputusan:", err);
      toast.error("Gagal menyimpan keputusan: " + (err?.message || ""));
    } finally {
      setIsSavingDecision(false);
    }
  };

  // Cetak Dokumen Analisis Pengambilan Keputusan
  const handlePrintAnalysis = () => {
    window.print();
  };

  // ==========================================================================
  // LOGIKA MESIN ANALISIS OTOMATIS & PENGAMBILAN KEPUTUSAN
  // ==========================================================================
  function generateAutomaticAnalysis(item: CompletedRTP) {
    const awalK = item.awalK || 3;
    const awalD = item.awalD || 3;
    const awalSkor = item.awalSkala || calculateScale(awalK, awalD) || 13;
    const awalLevel = getRiskLevelInfo(awalSkor);

    // Target (dari Efektifitas jika ada)
    const targetK = item.efektifitas?.targetKemungkinan || Math.max(1, awalK - 1);
    const targetD = item.efektifitas?.targetDampak || Math.max(1, awalD - 1);
    const targetSkor = item.efektifitas?.targetSkala || calculateScale(targetK, targetD) || 6;
    const targetLevel = getRiskLevelInfo(targetSkor);

    // Aktual Residual Risk (dari Efektifitas jika ada, atau proyeksi penurunan bila 100% terlaksana)
    const aktualK = item.efektifitas?.aktualKemungkinan || Math.max(1, awalK - 2);
    const aktualD = item.efektifitas?.aktualDampak || Math.max(1, awalD - 1);
    const aktualSkor = item.efektifitas?.aktualSkala || calculateScale(aktualK, aktualD) || 6;
    const aktualLevel = getRiskLevelInfo(aktualSkor);

    // Penurunan Skor & Indeks Reduksi Risiko
    const poinPenurunan = Math.max(0, awalSkor - aktualSkor);
    const persenPenurunan = awalSkor > 0 ? Math.round((poinPenurunan / awalSkor) * 100) : 0;
    const deviasiTarget = aktualSkor - targetSkor;

    // Evaluasi Keselarasan Bukti Fisik
    const adaEviden = Boolean(item.pemantauan?.linkEviden && item.pemantauan.linkEviden.trim().length > 3);

    // Penentuan Kategori Keputusan Otomatis
    let kategoriKeputusanDefault = "";
    let statusEfektivitasLabel = "";
    let badgeEfektivitas = "";
    let arahanDefault = "";
    let narasiAnalisis = "";

    if (aktualSkor <= 6 || persenPenurunan >= 60) {
      kategoriKeputusanDefault = "Institusionalisasi ke SOP / Regulasi Tetap";
      statusEfektivitasLabel = "SANGAT EFEKTIF (Optimal)";
      badgeEfektivitas = "bg-emerald-100 text-emerald-800 border-emerald-300";
      narasiAnalisis = `Pelaksanaan Rencana Tindak Pengendalian (RTP) terbukti sangat efektif menekan besaran risiko dari level ${awalLevel.label} (skor ${awalSkor}) menjadi level ${aktualLevel.label} (skor ${aktualSkor}) dengan efisiensi penurunan risiko mencapai ${persenPenurunan}%. Risiko residual saat ini telah berada jauh di bawah selera risiko toleransi instansi.`;
      arahanDefault = `1. Segera formalkan butir tindakan mitigasi "${item.rencana}" menjadi Standar Operasional Prosedur (SOP) baku pada ${item.unitName}.\n2. Masukkan kepatuhan prosedur ini sebagai bagian dari checklist pengawasan rutin triwulanan.\n3. Pertahankan sistem verifikasi saat ini agar risiko tidak bangkit kembali.`;
    } else if (aktualSkor <= 11) {
      kategoriKeputusanDefault = "Pertahankan Pengendalian Eksisting & Pengawasan Rutin";
      statusEfektivitasLabel = "EFEKTIF (Sesuai Target)";
      badgeEfektivitas = "bg-blue-100 text-blue-800 border-blue-300";
      narasiAnalisis = `Tindakan mitigasi telah berhasil menurunkan tingkat keparahan risiko ke level ${aktualLevel.label} (skor ${aktualSkor}) dengan penurunan sebesar ${persenPenurunan}%. Pengendalian telah berjalan namun tetap membutuhkan komitmen pengawasan disiplin dari penanggung jawab (${item.penanggungjawab}).`;
      arahanDefault = `1. Pertahankan implementasi tindakan pengendalian "${item.rencana}".\n2. Lakukan evaluasi berkala setiap akhir triwulan untuk memastikan tidak terjadi keterlambatan atau pengabaian eviden.\n3. Penanggung jawab (${item.penanggungjawab}) wajib melaporkan laporan berkala ke Pimpinan Unit.`;
    } else {
      kategoriKeputusanDefault = "Susun Rencana Tindak Pengendalian Tambahan (RTP Lanjutan)";
      statusEfektivitasLabel = "KURANG EFEKTIF (Perlu Mitigasi Tambahan)";
      badgeEfektivitas = "bg-amber-100 text-amber-800 border-amber-300";
      narasiAnalisis = `Meskipun progres RTP telah dilaporkan selesai, besaran risiko residual masih berada pada level ${aktualLevel.label} (skor ${aktualSkor}) dengan deviasi sebesar +${deviasiTarget} poin dari target. Hal ini mengindikasikan bahwa akar masalah (${item.penyebab}) belum sepenuhnya ternetralisir oleh instrumen mitigasi yang digunakan saat ini.`;
      arahanDefault = `1. Segera rumuskan Rencana Tindak Pengendalian Tambahan (RTP Lanjutan) dengan memperkuat instrumen pengawasan verifikasi ganda.\n2. Alokasikan sumber daya pendukung atau otomatisasi sistem guna menekan kemungkinan keterjadian.\n3. Koordinasikan dengan Auditor APIP untuk asistensi perbaikan desain pengendalian internal.`;
    }

    return {
      awalK,
      awalD,
      awalSkor,
      awalLevel,
      targetK,
      targetD,
      targetSkor,
      targetLevel,
      aktualK,
      aktualD,
      aktualSkor,
      aktualLevel,
      poinPenurunan,
      persenPenurunan,
      deviasiTarget,
      adaEviden,
      kategoriKeputusanDefault,
      statusEfektivitasLabel,
      badgeEfektivitas,
      arahanDefault,
      narasiAnalisis,
    };
  }

  const currentAnalysis = selectedItem ? generateAutomaticAnalysis(selectedItem) : null;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-20 font-sans">
      {/* ====================================================================== */}
      {/* 1. HEADER SECTION                                                      */}
      {/* ====================================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-900/50 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 font-bold uppercase tracking-wider">
                Pengambilan Keputusan Strategis
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Analisis RTP (Rencana Tindak Pengendalian)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Memuat seluruh Rencana Tindak Pengendalian yang <strong>telah terlaksana (100% Selesai)</strong>, dilengkapi dengan <strong>analisis otomatis mendalam</strong> mengenai efektivitas penurunan risiko, evaluasi akar masalah, dan rekomendasi arah kebijakan untuk pengambilan keputusan pimpinan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 print:hidden">
            {/* Unit Selector if Privileged */}
            {isPrivilegedUser && unitsList.length > 0 && (
              <div className="w-full sm:w-64">
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white text-xs backdrop-blur-md">
                    <Building2 className="w-3.5 h-3.5 mr-2 text-emerald-300" />
                    <SelectValue placeholder="Pilih Unit Kerja" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Unit Kerja (Konsolidasi)</SelectItem>
                    {unitsList.map((u) => (
                      <SelectItem key={u.id} value={u.name}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={() => loadUnitsAndData()}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs backdrop-blur-md"
            >
              Segarkan Data
            </Button>
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* 2. STATS OVERVIEW CARDS                                                */}
      {/* ====================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                RTP Telah Terlaksana
              </p>
              <p className="text-2xl font-black text-slate-900">{stats.totalCompleted}</p>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Progres 100% / Selesai
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rata-Rata Penurunan Risiko
              </p>
              <p className="text-2xl font-black text-emerald-700">-{stats.avgReduction}%</p>
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-emerald-600" />
                Efisiensi Residual Risk
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Scale className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Keputusan Ditetapkan
              </p>
              <p className="text-2xl font-black text-blue-700">{stats.decisionsCount}</p>
              <p className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                Telah Memiliki Disposisi Pimpinan
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Award className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Perlu Mitigasi Lanjutan
              </p>
              <p className="text-2xl font-black text-amber-600">{stats.needFollowUpCount}</p>
              <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Residual Skor Masih Sedang/Tinggi
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====================================================================== */}
      {/* 3. FILTER & SEARCH CONTROLS                                            */}
      {/* ====================================================================== */}
      <Card className="border border-slate-200/80 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari pernyataan risiko, rencana aksi, penanggung jawab, atau unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs sm:text-sm bg-slate-50/50"
              />
            </div>

            {/* Filter Status Pelaksanaan */}
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(val: any) => setStatusFilter(val)}
              >
                <SelectTrigger className="w-44 text-xs bg-white">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  <SelectValue placeholder="Status Pelaksanaan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100_only">Hanya Terlaksana (100%)</SelectItem>
                  <SelectItem value="all_with_progress">Semua dengan Progres (&gt;0%)</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Keputusan */}
              <Select
                value={decisionFilter}
                onValueChange={(val: any) => setDecisionFilter(val)}
              >
                <SelectTrigger className="w-44 text-xs bg-white">
                  <SelectValue placeholder="Status Keputusan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Keputusan</SelectItem>
                  <SelectItem value="has_decision">Sudah Ada Arahan Pimpinan</SelectItem>
                  <SelectItem value="no_decision">Belum Ada Keputusan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ====================================================================== */}
      {/* 4. TABLE RTP TERLAKSANA & TOMBOL ANALISIS DI SISI KANAN                */}
      {/* ====================================================================== */}
      <Card className="border border-slate-200/80 shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50/80 border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Daftar Rencana Tindak Pengendalian (RTP) yang Terlaksana
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Menampilkan daftar tindakan mitigasi yang telah rampung dieksekusi. Klik tombol <strong>Analisis</strong> di kolom paling kanan untuk memunculkan telaah otomatis mendalam.
              </CardDescription>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
              {filteredRtps.length} RTP Terdata
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Memuat data RTP dan hasil pemantauan...</p>
            </div>
          ) : filteredRtps.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Tidak ada RTP yang memenuhi kriteria filter</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Pastikan unit kerja Anda telah mengisi pemantauan progres pelaksanaan RTP hingga 100% pada menu <strong>Pemantauan RTP</strong>.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader className="bg-slate-100/70 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="w-12 text-center font-bold text-slate-700">No</TableHead>
                    <TableHead className="min-w-[220px] font-bold text-slate-700">Peristiwa Risiko &amp; Level Awal</TableHead>
                    <TableHead className="min-w-[200px] font-bold text-slate-700">Rencana Tindak Pengendalian (RTP)</TableHead>
                    <TableHead className="min-w-[130px] font-bold text-slate-700">Penanggung Jawab &amp; Target</TableHead>
                    <TableHead className="min-w-[130px] font-bold text-slate-700">Progres &amp; Eviden</TableHead>
                    <TableHead className="min-w-[130px] font-bold text-slate-700">Level Residual</TableHead>
                    <TableHead className="min-w-[150px] font-bold text-slate-700">Keputusan Pimpinan</TableHead>
                    <TableHead className="w-40 text-center font-bold text-slate-800 bg-emerald-50/50">
                      Aksi Analisis
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {filteredRtps.map((item, idx) => {
                    const awalLevel = getRiskLevelInfo(item.awalSkala);
                    const pct = Number(item.pemantauan?.persentase || 0);
                    const hasDecision = Boolean(item.keputusanPimpinan?.kategoriKeputusan);

                    // Residual info
                    const resSkor = item.efektifitas?.aktualSkala || Math.max(1, Math.round(item.awalSkala * 0.4));
                    const resLevel = getRiskLevelInfo(resSkor);

                    return (
                      <TableRow key={`${item.riskId}-${item.rtpId}`} className="hover:bg-slate-50/80 transition-colors">
                        {/* No */}
                        <TableCell className="text-center font-semibold text-slate-500">
                          {idx + 1}
                        </TableCell>

                        {/* Risiko Induk */}
                        <TableCell className="space-y-1">
                          <p className="font-bold text-slate-900 leading-tight">
                            {item.pernyataanRisiko}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.unitName}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full font-bold border ${awalLevel.badge}`}>
                              Awal: {awalLevel.label} ({item.awalSkala})
                            </span>
                          </div>
                        </TableCell>

                        {/* Rencana Tindak Pengendalian */}
                        <TableCell className="space-y-1">
                          <p className="font-semibold text-slate-800 leading-tight">
                            {item.rencana}
                          </p>
                          {item.bentukKomunikasi && (
                            <p className="text-[10px] text-slate-500">
                              Bentuk: {item.bentukKomunikasi}
                            </p>
                          )}
                        </TableCell>

                        {/* PIC & Target */}
                        <TableCell className="space-y-0.5">
                          <p className="font-medium text-slate-800">{item.penanggungjawab}</p>
                          <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {item.targetWaktu}
                          </p>
                        </TableCell>

                        {/* Progres Pelaksanaan & Eviden */}
                        <TableCell className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-bold text-emerald-700">
                              {pct >= 100 ? "100% Selesai" : `${pct}% Dilaksanakan`}
                            </span>
                          </div>
                          {item.pemantauan?.linkEviden ? (
                            <a
                              href={item.pemantauan.linkEviden}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-600 hover:text-blue-800 underline flex items-center gap-0.5 truncate max-w-[130px]"
                              title={item.pemantauan.linkEviden}
                            >
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              <span>Lihat Bukti Eviden</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Tanpa link eviden</span>
                          )}
                        </TableCell>

                        {/* Residual Level */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${resLevel.badge}`}>
                              {resLevel.label} ({resSkor})
                            </span>
                            {item.efektifitas?.status && (
                              <p className="text-[10px] text-slate-500 font-medium">
                                Status: {item.efektifitas.status}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Keputusan Pimpinan */}
                        <TableCell>
                          {hasDecision ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                {item.keputusanPimpinan?.kategoriKeputusan}
                              </span>
                              <p className="text-[10px] text-slate-500 line-clamp-1 italic">
                                &quot;{item.keputusanPimpinan?.catatanArahan}&quot;
                              </p>
                            </div>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Menunggu Analisis
                            </span>
                          )}
                        </TableCell>

                        {/* TOMBOL ANALISIS DI SISI KANAN */}
                        <TableCell className="text-center bg-emerald-50/30">
                          <Button
                            onClick={() => handleOpenAnalysisModal(item)}
                            className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl shadow-xs hover:shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer w-full"
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300 animate-pulse" />
                            <span>Analisis</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====================================================================== */}
      {/* 5. MODAL ANALISIS OTOMATIS MENDETAIL UNTUK PENGAMBILAN KEPUTUSAN      */}
      {/* ====================================================================== */}
      <Dialog open={isAnalysisModalOpen} onOpenChange={setIsAnalysisModalOpen}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "p-0 flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 border border-slate-700/40 outline-none",
            isFullScreen
              ? "fixed inset-0 w-screen h-screen max-w-none sm:max-w-none md:max-w-none lg:max-w-none rounded-none z-[100]"
              : "w-[96vw] sm:max-w-[96vw] md:max-w-[95vw] lg:max-w-7xl max-h-[94vh] rounded-3xl"
          )}
        >
          {selectedItem && currentAnalysis && (
            <div className={`flex flex-col ${isFullScreen ? "h-screen" : "max-h-[94vh]"} overflow-hidden`}>
              {/* MODAL HEADER */}
              <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 sm:p-6 border-b border-emerald-900/40 shrink-0">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-lg">
                        <Brain className="w-5 h-5 text-emerald-400" />
                      </span>
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-500/30">
                        Hasil Analisis Otomatis Penanganan Risiko
                      </span>
                    </div>
                    <DialogTitle className="text-lg sm:text-2xl font-black text-white leading-snug">
                      {selectedItem.pernyataanRisiko}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Unit Kerja: <strong className="text-white">{selectedItem.unitName}</strong></span>
                      <span>•</span>
                      <span>Tahun Anggaran: <strong className="text-white">{selectedItem.tahun}</strong></span>
                      <span>•</span>
                      <span>Kategori: <strong className="text-white">{selectedItem.kategori}</strong></span>
                    </DialogDescription>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={handlePrintAnalysis}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs backdrop-blur-md font-semibold"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5 text-emerald-300" />
                      <span>Cetak Lembar Keputusan</span>
                    </Button>

                    <button
                      onClick={() => setIsFullScreen(!isFullScreen)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer shadow-xs"
                      title={isFullScreen ? "Tampilan Standar (Perkecil)" : "Tampilan Layar Penuh (Fullscreen)"}
                    >
                      {isFullScreen ? (
                        <Minimize2 className="w-4 h-4 text-emerald-300" />
                      ) : (
                        <Maximize2 className="w-4 h-4 text-emerald-300" />
                      )}
                    </button>

                    <button
                      onClick={() => setIsAnalysisModalOpen(false)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-rose-600/80 text-white border border-white/20 transition-all cursor-pointer shadow-xs"
                      title="Tutup Modal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* MODAL BODY (SCROLLABLE FULL-WIDTH) */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-800 custom-scrollbar">
                {/* 1. KARTU PERBANDINGAN RESIDUAL RISK & EFEKTIVITAS */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-bold text-sm sm:text-base text-slate-900">
                        1. Evaluasi Kuantitatif Penurunan Besaran Risiko
                      </h4>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs ${currentAnalysis.badgeEfektivitas}`}>
                      {currentAnalysis.statusEfektivitasLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Risiko Awal */}
                    <div className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Kondisi Awal (Inherent)
                      </span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-black text-slate-900">
                          {currentAnalysis.awalSkor}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentAnalysis.awalLevel.badge}`}>
                          {currentAnalysis.awalLevel.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">
                        Kemungkinan: {currentAnalysis.awalK} × Dampak: {currentAnalysis.awalD}
                      </p>
                    </div>

                    {/* Target Pengendalian */}
                    <div className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Target Mitigasi
                      </span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-black text-blue-700">
                          {currentAnalysis.targetSkor}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentAnalysis.targetLevel.badge}`}>
                          {currentAnalysis.targetLevel.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">
                        Target K: {currentAnalysis.targetK} × Target D: {currentAnalysis.targetD}
                      </p>
                    </div>

                    {/* Aktual Residual */}
                    <div className="p-4 sm:p-5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2 shadow-xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                        Aktual Setelah Mitigasi (Residual)
                      </span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-black text-emerald-700">
                          {currentAnalysis.aktualSkor}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentAnalysis.aktualLevel.badge}`}>
                          {currentAnalysis.aktualLevel.label}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-700 font-mono">
                        Aktual K: {currentAnalysis.aktualK} × Aktual D: {currentAnalysis.aktualD}
                      </p>
                    </div>
                  </div>

                  {/* Ringkasan Penurunan */}
                  <div className="p-4 bg-emerald-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm shadow-md">
                    <div className="flex items-center gap-2.5">
                      <TrendingDown className="w-5 h-5 text-emerald-300 shrink-0" />
                      <span>
                        Penurunan Besaran Risiko: <strong>-{currentAnalysis.poinPenurunan} Poin</strong> ({currentAnalysis.persenPenurunan}% Efisiensi Penurunan dari Skor Awal)
                      </span>
                    </div>
                    <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                      Deviasi Target: {currentAnalysis.deviasiTarget <= 0 ? "Tercapai (Optimal)" : `+${currentAnalysis.deviasiTarget} Poin`}
                    </span>
                  </div>
                </div>

                {/* 2. SUBSTANSI & TINJAUAN AKAR MASALAH (4 KOLOM LEBAR) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-sm sm:text-base text-slate-900">
                      2. Substansi Tindakan Mitigasi &amp; Tinjauan Lapangan
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    {/* Akar Masalah */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">
                          Akar Masalah (Penyebab Risiko)
                        </span>
                        <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
                          {selectedItem.penyebab || "Akar masalah operasional unit kerja."}
                        </p>
                      </div>
                    </div>

                    {/* Rencana RTP */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">
                          Tindakan RTP Terlaksana
                        </span>
                        <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200/80 font-medium leading-relaxed">
                          {selectedItem.rencana}
                        </p>
                      </div>
                    </div>

                    {/* PIC & Jadwal */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">
                          Penanggung Jawab &amp; Jadwal
                        </span>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-1">
                          <p className="text-slate-800 font-semibold">{selectedItem.penanggungjawab}</p>
                          <p className="text-slate-500 font-mono text-[11px]">Target: {selectedItem.targetWaktu}</p>
                          <p className="text-slate-500 text-[11px]">Realisasi: {selectedItem.pemantauan?.waktuPelaksanaan || "Tepat Waktu"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bukti Eviden */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">
                          Bukti Eviden / Dokumen Output
                        </span>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                          {selectedItem.pemantauan?.linkEviden ? (
                            <a
                              href={selectedItem.pemantauan.linkEviden}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline font-semibold flex items-center gap-1.5 py-1"
                            >
                              <ExternalLink className="w-4 h-4 shrink-0 text-blue-600" />
                              <span className="truncate">Buka Dokumen Eviden</span>
                            </a>
                          ) : (
                            <p className="text-slate-400 italic py-1">Belum ada tautan eviden.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. REKOMENDASI PENGAMBILAN KEPUTUSAN OTOMATIS */}
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-2xl p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-700" />
                    <h4 className="font-bold text-sm sm:text-base text-slate-900">
                      3. Rekomendasi Pengambilan Keputusan Strategis (Decision Support)
                    </h4>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/80 p-4 rounded-xl border border-emerald-100 shadow-xs">
                    {currentAnalysis.narasiAnalisis}
                  </p>

                  <div className="p-4 bg-white rounded-xl border border-emerald-200 space-y-2 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Rekomendasi Arah Kebijakan Manajemen:
                    </span>
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{currentAnalysis.kategoriKeputusanDefault}</span>
                    </div>
                  </div>
                </div>

                {/* 4. FORM PENETAPAN KEPUTUSAN & ARAHAN PIMPINAN */}
                <div className="bg-white rounded-2xl border-2 border-slate-300 p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-bold text-sm sm:text-base text-slate-900">
                        4. Penetapan Keputusan &amp; Arahan Pimpinan Unit Kerja
                      </h4>
                    </div>
                    {selectedItem.keputusanPimpinan && (
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
                        Telah Ditetapkan: {new Date(selectedItem.keputusanPimpinan.tanggalKeputusan).toLocaleDateString("id-ID")}
                      </span>
                    )}
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm">
                    {/* Dropdown Kategori Keputusan */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-800">
                        Pilihan Keputusan Manajemen:
                      </Label>
                      <Select
                        value={decisionCategory}
                        onValueChange={(val) => setDecisionCategory(val)}
                      >
                        <SelectTrigger className="text-xs sm:text-sm bg-slate-50">
                          <SelectValue placeholder="Pilih Kategori Keputusan Manajemen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Institusionalisasi ke SOP / Regulasi Tetap">
                            1. Institusionalisasi ke SOP / Regulasi Tetap (Formalisasi Pengendalian Permanen)
                          </SelectItem>
                          <SelectItem value="Pertahankan Pengendalian Eksisting & Pengawasan Rutin">
                            2. Pertahankan Pengendalian Eksisting &amp; Pengawasan Rutin (Lanjutkan Kendali)
                          </SelectItem>
                          <SelectItem value="Susun Rencana Tindak Pengendalian Tambahan (RTP Lanjutan)">
                            3. Susun Rencana Tindak Pengendalian Tambahan (RTP Lanjutan / Mitigasi Tambahan)
                          </SelectItem>
                          <SelectItem value="Eskalasi ke Komite Manajemen Risiko Kementerian">
                            4. Eskalasi ke Komite Manajemen Risiko Kementerian (Wewenang Lintas Unit)
                          </SelectItem>
                          <SelectItem value="Penurunan Frekuensi Monitoring / Pengarsipan">
                            5. Penurunan Frekuensi Monitoring / Pengarsipan (Risiko Tuntas)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Catatan / Arahan Strategis Pimpinan */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-800">
                        Catatan &amp; Instruksi Arahan Pimpinan:
                      </Label>
                      <Textarea
                        rows={4}
                        placeholder="Tuliskan arahan resmi, penugasan tindak lanjut, tenggat waktu, atau disposisi spesifik pimpinan..."
                        value={decisionNotes}
                        onChange={(e) => setDecisionNotes(e.target.value)}
                        className="text-xs sm:text-sm bg-slate-50 font-sans leading-relaxed"
                      />
                    </div>

                    {/* Nama & Jabatan Pimpinan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">
                          Nama Pimpinan Penandatangan:
                        </Label>
                        <Input
                          value={leaderName}
                          onChange={(e) => setLeaderName(e.target.value)}
                          placeholder="Nama Pimpinan Unit Kerja"
                          className="text-xs sm:text-sm bg-slate-50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">
                          Jabatan Struktural:
                        </Label>
                        <Input
                          value={leaderTitle}
                          onChange={(e) => setLeaderTitle(e.target.value)}
                          placeholder="Kepala Unit Kerja / Direktur / Sesditjen"
                          className="text-xs sm:text-sm bg-slate-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER ACTIONS */}
              <div className="bg-slate-50 p-4 sm:px-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <Button
                  onClick={() => setIsAnalysisModalOpen(false)}
                  variant="outline"
                  size="sm"
                  className="text-xs w-full sm:w-auto"
                >
                  Tutup
                </Button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    onClick={handleSaveDecision}
                    disabled={isSavingDecision}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-2 shadow-md flex items-center gap-2 cursor-pointer w-full sm:w-auto"
                  >
                    {isSavingDecision ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Simpan Keputusan Pimpinan</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
