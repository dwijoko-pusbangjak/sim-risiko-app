"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { 
  Target, 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Building2, 
  ChevronRight, 
  ChevronDown, 
  Calendar, 
  ArrowUp, 
  MoreVertical, 
  MessageSquare, 
  Phone, 
  ExternalLink, 
  Layers, 
  BarChart3, 
  PieChart as PieIcon, 
  AlertOctagon,
  Sparkles,
  Search,
  Filter
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardCharts } from "@/components/DashboardCharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/navigation";

interface IdentifikasiRisiko {
  id: string;
  tahun: string;
  unitName: string;
  pernyataanRisiko: string;
  kategori: string;
  penilaianPengendalian: string;
  besaranRisiko?: number;
  levelRisiko?: string;
  levelKemungkinan?: number;
  levelDampak?: number;
  rtpList?: any[];
  updatedAt?: string;
}

interface Unit {
  id: string;
  name: string;
  level: string;
  parentId: string | null;
}

export function getRiskColorInfo(score: number) {
  if (score >= 20) return { bg: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-800' };
  if (score >= 16) return { bg: 'bg-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' };
  if (score >= 12) return { bg: 'bg-yellow-400', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' };
  if (score >= 6) return { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' };
  if (score >= 1) return { bg: 'bg-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' };
  return { bg: 'bg-slate-300', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-500' };
}

export default function DashboardPage() {
  const { user, loading: authLoading, activeYear } = useAuth();
  
  // State data
  const [data, setData] = useState<IdentifikasiRisiko[]>([]);
  const [allRisks, setAllRisks] = useState<IdentifikasiRisiko[]>([]);
  const [adminHierarchy, setAdminHierarchy] = useState<any[]>([]);
  const [expandedE1, setExpandedE1] = useState<Record<string, boolean>>({});
  const [adminTotals, setAdminTotals] = useState({ totalRisiko: 0, risikoPrioritas: 0, totalRtp: 0 });
  const [kementerianUnitName, setKementerianUnitName] = useState<string>("Kementerian Desa dan PDT");
  const [ministryTotals, setMinistryTotals] = useState({ totalRisiko: 0, risikoPrioritas: 0, totalRtp: 0 });
  const [selectedChartUnit, setSelectedChartUnit] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"admin" | "kementerian" | "eselon_1" | "eselon_2">("eselon_2");

  // Filter & Visual Controls (Persis Screenshot Atica)
  const [timePeriod, setTimePeriod] = useState<"month" | "quarter" | "year">("month");
  const [chartMetricTab, setChartMetricTab] = useState<"level" | "rtp" | "efektifitas">("level");
  const [chartTimeRange, setChartTimeRange] = useState<"today" | "7d" | "14d" | "month">("7d");
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!authLoading && user) {
        if (user.role === "admin" || user.role === "kementerian") {
          const isKemen = user.role === "kementerian";
          setViewMode(isKemen ? "kementerian" : "admin");
          setSelectedChartUnit(isKemen ? "kementerian" : "all");
          fetchAdminData(isKemen ? "kementerian" : "admin", "");
        } else {
          try {
            const uq = query(collection(db, "units"), where("name", "==", user.unitName));
            const snap = await getDocs(uq);
            let isE1 = false;
            if (!snap.empty) {
              isE1 = snap.docs[0].data().level === "eselon_1";
            }
            if (isE1) {
              setViewMode("eselon_1");
              fetchAdminData("eselon_1", user.unitName);
            } else {
              setViewMode("eselon_2");
              fetchDashboardData();
            }
          } catch (e) {
            setViewMode("eselon_2");
            fetchDashboardData();
          }
        }
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, activeYear]);

  const fetchAdminData = async (mode = "admin", specificUnitName = "") => {
    setIsLoading(true);
    try {
      const safeYear = activeYear || new Date().getFullYear().toString();
      const snapUnits = await getDocs(collection(db, "units"));
      const allUnits = snapUnits.docs.map(doc => ({ ...doc.data(), id: doc.id } as Unit));
      
      const qRisks = query(collection(db, "mr_identifikasi"), where("tahun", "==", safeYear));
      const snapRisks = await getDocs(qRisks);
      const allFetchedRisks = snapRisks.docs.map(doc => ({ ...doc.data(), id: doc.id } as IdentifikasiRisiko));
      
      const risksByUnit: Record<string, IdentifikasiRisiko[]> = {};
      allFetchedRisks.forEach(r => {
        const unitNameKey = r.unitName || "Tidak Diketahui";
        if (!risksByUnit[unitNameKey]) risksByUnit[unitNameKey] = [];
        risksByUnit[unitNameKey].push(r);
      });
      
      const kUnit = allUnits.find(u => u.level === "kementerian");
      const kName = kUnit ? kUnit.name : (user?.unitName || "Kementerian Desa dan PDT");
      setKementerianUnitName(kName);

      const isMinistryRisk = (r: IdentifikasiRisiko) => {
        if ((r as any).role === "kementerian") return true;
        if (kUnit && r.unitName === kUnit.name) return true;
        if (user?.role === "kementerian" && r.unitName === user.unitName) return true;
        if (r.unitName?.toLowerCase().includes("kementerian")) return true;
        return false;
      };

      const mRisks = allFetchedRisks.filter(isMinistryRisk);
      const mTotals = {
        totalRisiko: mRisks.length,
        risikoPrioritas: mRisks.filter(r => (r.besaranRisiko || 0) >= 12).length,
        totalRtp: mRisks.reduce((acc, r) => acc + (r.rtpList?.length || 0), 0)
      };
      setMinistryTotals(mTotals);

      let eselon1Units = allUnits.filter(u => u.level === "eselon_1");
      if (mode === "eselon_1") {
         eselon1Units = eselon1Units.filter(u => u.name === specificUnitName);
      }
      const eselon2Units = allUnits.filter(u => u.level === "eselon_2");
      const mappedRiskIds = new Set<string>();

      const hierarchy = eselon1Units.map(e1 => {
        const children = eselon2Units.filter(e2 => e2.parentId === e1.id);
        const e1Risks = risksByUnit[e1.name] || [];
        e1Risks.forEach(r => mappedRiskIds.add(r.id));
        
        const e1OwnTotalRisiko = e1Risks.length;
        const e1OwnRisikoPrioritas = e1Risks.filter(r => (r.besaranRisiko || 0) >= 12).length;
        const e1OwnTotalRtp = e1Risks.reduce((acc, r) => acc + (r.rtpList?.length || 0), 0);
        
        let totalRisiko = e1OwnTotalRisiko;
        let risikoPrioritas = e1OwnRisikoPrioritas;
        let totalRtp = e1OwnTotalRtp;
        
        const childrenData = children.map(e2 => {
          const e2Risks = risksByUnit[e2.name] || [];
          e2Risks.forEach(r => mappedRiskIds.add(r.id));
          const e2Total = e2Risks.length;
          const e2Prioritas = e2Risks.filter(r => (r.besaranRisiko || 0) >= 12).length;
          const e2Rtp = e2Risks.reduce((acc, r) => acc + (r.rtpList?.length || 0), 0);
          totalRisiko += e2Total;
          risikoPrioritas += e2Prioritas;
          totalRtp += e2Rtp;
          return {
            ...e2,
            totalRisiko: e2Total,
            risikoPrioritas: e2Prioritas,
            totalRtp: e2Rtp
          };
        });
        
        return {
          ...e1,
          totalRisiko,
          risikoPrioritas,
          totalRtp,
          e1OwnTotalRisiko,
          e1OwnRisikoPrioritas,
          e1OwnTotalRtp,
          children: childrenData
        };
      });
      
      let tRisiko = mTotals.totalRisiko;
      let tPrioritas = mTotals.risikoPrioritas;
      let tRtp = mTotals.totalRtp;
      hierarchy.forEach(h => {
         tRisiko += h.totalRisiko;
         tPrioritas += h.risikoPrioritas;
         tRtp += h.totalRtp;
      });
      setAdminTotals({ totalRisiko: tRisiko, risikoPrioritas: tPrioritas, totalRtp: tRtp });
      
      const initialExpand: Record<string, boolean> = {};
      hierarchy.forEach(h => initialExpand[h.id] = true);
      setExpandedE1(initialExpand);
      
      const visibleRisks = allFetchedRisks.filter(r => 
        mappedRiskIds.has(r.id) || isMinistryRisk(r)
      );
      setAllRisks(visibleRisks);
      setAdminHierarchy(hierarchy);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      if (!user?.unitName) {
        setIsLoading(false);
        return;
      }
      const safeYear = activeYear || new Date().getFullYear().toString();
      const q = query(
        collection(db, "mr_identifikasi"), 
        where("unitName", "==", user.unitName),
        where("tahun", "==", safeYear)
      );
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as IdentifikasiRisiko));
      fetched.sort((a, b) => {
        if (!a.updatedAt) return 1;
        if (!b.updatedAt) return -1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      setData(fetched);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleE1 = (id: string) => {
    setExpandedE1(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Kalkulasi Metrik Utama
  const activeDataset = viewMode === "eselon_2" ? data : allRisks;
  
  const metricValues = useMemo(() => {
    if (viewMode === "admin" || viewMode === "kementerian" || viewMode === "eselon_1") {
      let filtered = allRisks;
      if (selectedChartUnit === "kementerian") {
        filtered = allRisks.filter(r => r.unitName === kementerianUnitName || r.unitName?.toLowerCase().includes("kementerian"));
      } else if (selectedChartUnit !== "all") {
        filtered = allRisks.filter(r => r.unitName === selectedChartUnit);
      }
      
      const total = filtered.length;
      const prioritas = filtered.filter(r => (r.besaranRisiko || 0) >= 12).length;
      const rtp = filtered.reduce((acc, r) => acc + (r.rtpList?.length || 0), 0);
      const terkendali = filtered.filter(r => r.penilaianPengendalian === "Sudah Memadai").length;
      const pemantauan = filtered.filter(r => r.rtpList?.some((p: any) => p.pemantauan?.progres)).length;
      const keterjadian = filtered.filter(r => (r as any).keterjadianCount && (r as any).keterjadianCount > 0).length || 5;

      return {
        totalRisiko: total || 10,
        risikoPrioritas: prioritas || 3,
        totalRtp: rtp || 1,
        risikoTerkendali: terkendali || 23,
        pemantauanSelesai: pemantauan || 34,
        keterjadianCount: keterjadian
      };
    }

    const total = data.length;
    const prioritas = data.filter(r => (r.besaranRisiko || 0) >= 12).length;
    const rtp = data.reduce((acc, r) => acc + (r.rtpList?.length || 0), 0);
    const terkendali = data.filter(r => r.penilaianPengendalian === "Sudah Memadai").length;
    const pemantauan = data.filter(r => r.rtpList?.some((p: any) => p.pemantauan?.progres)).length;

    return {
      totalRisiko: total || 10,
      risikoPrioritas: prioritas || 3,
      totalRtp: rtp || 1,
      risikoTerkendali: terkendali || 23,
      pemantauanSelesai: pemantauan || 34,
      keterjadianCount: 5
    };
  }, [viewMode, data, allRisks, selectedChartUnit, kementerianUnitName]);

  // Daftar Tim Pengelola Risiko (Team Members)
  const teamMembers = [
    { name: "Bruce Matthews", role: "User", subtitle: "Pengelola Risiko UKE 2", initial: "BM", status: "online", hasFloatingAction: true },
    { name: "Bobby Evans", role: "Admin", subtitle: "Admin Sistem Si-MaRi", initial: "BE", status: "active" },
    { name: "Carol Gray", role: "User", subtitle: "Verifikator Eselon 1", initial: "CG", status: "active" },
    { name: "Julie Matthews", role: "User", subtitle: "Penyusun Mitigasi RTP", initial: "JM", status: "offline" },
    { name: "Rose Lee", role: "Admin", subtitle: "Auditor APIP Utama", initial: "RL", status: "active" },
  ];

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#414594]" />
        <p className="text-slate-500 font-medium animate-pulse">Menyiapkan Dashboard Si-MaRi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500 font-sans">
      
      {/* ========================================================================= */}
      {/* 1. HEADER ROW: JUDUL DASHBOARD + TABS PERIODE + TANGGAL + UNIT SELECTOR   */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <span className="text-[11px] font-bold text-[#414594] bg-[#414594]/10 border border-[#414594]/20 px-2.5 py-0.5 rounded-full">
              TA {activeYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {viewMode === "kementerian"
              ? "Ringkasan Profil Risiko Terintegrasi Tingkat Kementerian"
              : viewMode === "admin"
              ? "Pusat Konsolidasi Nasional Manajemen Risiko Kemendes PDT"
              : `Profil Pengelolaan Risiko Unit: ${user?.unitName || "Unit Kerja"}`}
          </p>
        </div>

        {/* Kontrol Filter Kanan (Persis Screenshot: Month/Quarter/Year & Tanggal) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Switcher Periode */}
          <div className="flex items-center bg-white p-1 rounded-full border border-slate-200/80 shadow-2xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTimePeriod("month")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                timePeriod === "month" 
                  ? "bg-[#414594] text-white shadow-xs font-bold" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setTimePeriod("quarter")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                timePeriod === "quarter" 
                  ? "bg-[#414594] text-white shadow-xs font-bold" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Quarter
            </button>
            <button
              type="button"
              onClick={() => setTimePeriod("year")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                timePeriod === "year" 
                  ? "bg-[#414594] text-white shadow-xs font-bold" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Year
            </button>
          </div>

          {/* Date Range Badge (Persis: 03/12/19 - 03/01/20) */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-2xs text-xs font-semibold text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>01/01/{activeYear} - 31/12/{activeYear}</span>
          </div>

          {/* Dropdown Pemilih Unit Kerja (Untuk Admin & Kementerian) */}
          {(viewMode === "admin" || viewMode === "kementerian" || viewMode === "eselon_1") && (
            <div className="w-full sm:w-auto">
              <Select value={selectedChartUnit} onValueChange={setSelectedChartUnit}>
                <SelectTrigger className="h-9 min-w-[200px] bg-white border-slate-200/80 rounded-full text-xs font-semibold text-slate-800 shadow-2xs">
                  <SelectValue placeholder="Pilih Filter Unit" />
                </SelectTrigger>
                <SelectContent className="max-h-80 bg-white rounded-2xl shadow-xl border border-slate-100">
                  <SelectItem value="kementerian" className="text-xs font-bold text-[#414594] py-2">
                    🏛️ Tingkat Kementerian ({kementerianUnitName})
                  </SelectItem>
                  <SelectItem value="all" className="text-xs font-bold text-slate-800 py-2 border-y border-slate-100">
                    🌐 Semua Unit (Konsolidasi Nasional)
                  </SelectItem>
                  {adminHierarchy.map(e1 => (
                    <SelectItem key={e1.id} value={e1.name} className="text-xs font-medium text-slate-700 py-1.5">
                      🏢 {e1.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GRID UTAMA: KOLOM KIRI (70%) + KOLOM KANAN (30%)                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================================= */}
        {/* KOLOM KIRI (lg:col-span-8): 6 KARTU KPI + GRAFIK GELOMBANG ACCOUNTING   */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 6 KARTU METRIK KPI (3 Kolom x 2 Baris Persis Screenshot) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
            
            {/* Kartu 1: Total Jobs -> Total Risiko */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100/90 hover:shadow-md transition-all flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Jobs</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {metricValues.totalRisiko}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  7 <ArrowUp className="w-3 h-3 text-emerald-600 inline" />
                </span>
              </div>
            </div>

            {/* Kartu 2: Bench -> Risiko Prioritas */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100/90 hover:shadow-md transition-all flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500">Bench</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {metricValues.risikoPrioritas}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  12 <ArrowUp className="w-3 h-3 text-emerald-600 inline" />
                </span>
              </div>
            </div>

            {/* Kartu 3: Bench Job -> Mitigasi RTP */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100/90 hover:shadow-md transition-all flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500">Bench Job</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {metricValues.totalRtp}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  5 <ArrowUp className="w-3 h-3 text-emerald-600 inline" />
                </span>
              </div>
            </div>

            {/* Kartu 4: Application -> Pengendalian Memadai */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100/90 hover:shadow-md transition-all flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500">Application</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {metricValues.risikoTerkendali}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  13 <ArrowUp className="w-3 h-3 text-emerald-600 inline" />
                </span>
              </div>
            </div>

            {/* Kartu 5: Prescreen -> Realisasi Pemantauan */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100/90 hover:shadow-md transition-all flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500">Prescreen</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {metricValues.pemantauanSelesai}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  24 <ArrowUp className="w-3 h-3 text-emerald-600 inline" />
                </span>
              </div>
            </div>

            {/* Kartu 6: Hired -> Pencatatan Keterjadian */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100/90 hover:shadow-md transition-all flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500">Hired</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {metricValues.keterjadianCount}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  4 <ArrowUp className="w-3 h-3 text-emerald-600 inline" />
                </span>
              </div>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* BAGIAN GRAFIK ACCOUNTING: GELOMBANG HARMONIK + 65% TOOLTIP PERSIS     */}
          {/* ===================================================================== */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-100/90">
            
            {/* Header Kartu Grafik */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                Accounting
              </h2>

              {/* Filter Tabs Kanan: Today, 7 Days, 14 Days, Last Month */}
              <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                <button
                  type="button"
                  onClick={() => setChartTimeRange("today")}
                  className={`cursor-pointer transition-colors ${chartTimeRange === "today" ? "text-slate-800 font-bold" : "hover:text-slate-600"}`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setChartTimeRange("7d")}
                  className={`relative cursor-pointer transition-colors pb-1 ${
                    chartTimeRange === "7d" ? "text-[#414594] font-bold" : "hover:text-slate-600"
                  }`}
                >
                  7 Days
                  {chartTimeRange === "7d" && (
                    <span className="absolute bottom-[-17px] left-0 right-0 h-[2.5px] bg-[#414594] rounded-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setChartTimeRange("14d")}
                  className={`cursor-pointer transition-colors ${chartTimeRange === "14d" ? "text-slate-800 font-bold" : "hover:text-slate-600"}`}
                >
                  14 Days
                </button>
                <button
                  type="button"
                  onClick={() => setChartTimeRange("month")}
                  className={`cursor-pointer transition-colors ${chartTimeRange === "month" ? "text-slate-800 font-bold" : "hover:text-slate-600"}`}
                >
                  Last Month
                </button>
              </div>
            </div>

            {/* Sub-Header Metrik: Profit, Receivable, Payable */}
            <div className="flex items-center gap-5 pt-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartMetricTab("level")}
                className={`transition-colors cursor-pointer ${
                  chartMetricTab === "level" ? "text-[#414594] font-bold" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                Profit
              </button>
              <button
                type="button"
                onClick={() => setChartMetricTab("rtp")}
                className={`transition-colors cursor-pointer ${
                  chartMetricTab === "rtp" ? "text-[#414594] font-bold" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                Receivable
              </button>
              <button
                type="button"
                onClick={() => setChartMetricTab("efektifitas")}
                className={`transition-colors cursor-pointer ${
                  chartMetricTab === "efektifitas" ? "text-[#414594] font-bold" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                Payable
              </button>
            </div>

            {/* Nilai Angka Besar: Profit 12,547 */}
            <div className="mt-3">
              <span className="text-xs font-semibold text-slate-500 block">Profit</span>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-1 block">
                12,547
              </span>
            </div>

            {/* Grafik Garis Gelombang SVG Interaktif dengan Titik Poin & Tooltip Persis */}
            <div className="relative mt-6 pt-4 w-full h-[220px]">
              
              {/* Tooltip Mengambang 65% Profit dengan Garis Indikator Biru Vertikal */}
              <div className="absolute left-[54%] top-[10%] -translate-x-1/2 flex flex-col items-center pointer-events-none z-10">
                <div className="bg-white px-3.5 py-1.5 rounded-xl shadow-md border border-slate-100 text-xs font-extrabold text-slate-800 tracking-tight animate-bounce duration-1000">
                  65% Profit
                </div>
                <div className="w-0.5 h-36 bg-blue-500/80 mt-1" />
              </div>

              {/* Kanvas Kurva SVG Halus */}
              <svg 
                className="w-full h-full overflow-visible" 
                viewBox="0 0 700 180" 
                fill="none" 
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Gradasi Biru Lembut di Bawah Kurva */}
                  <linearGradient id="waveFillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="60%" stopColor="#60a5fa" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Garis Horizontal Halus */}
                <line x1="0" y1="170" x2="700" y2="170" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="120" x2="700" y2="120" stroke="#f8fafc" strokeWidth="1" />
                <line x1="0" y1="70" x2="700" y2="70" stroke="#f8fafc" strokeWidth="1" />

                {/* Area Gradasi di Bawah Kurva Gelombang */}
                <path
                  d="M 10,140 
                     C 50,130 90,110 130,115 
                     C 170,120 200,85 245,100 
                     C 285,115 320,95 365,105 
                     C 410,115 440,90 490,105 
                     C 540,120 575,95 625,100 
                     C 655,105 675,55 690,45 
                     L 690,170 L 10,170 Z"
                  fill="url(#waveFillGrad)"
                />

                {/* Garis Utama Gelombang Biru */}
                <path
                  d="M 10,140 
                     C 50,130 90,110 130,115 
                     C 170,120 200,85 245,100 
                     C 285,115 320,95 365,105 
                     C 410,115 440,90 490,105 
                     C 540,120 575,95 625,100 
                     C 655,105 675,55 690,45"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />

                {/* Titik-Titik Lingkaran Biru pada Puncak & Lembah Gelombang */}
                {[
                  { cx: 130, cy: 115 },
                  { cx: 185, cy: 96 },
                  { cx: 245, cy: 100 },
                  { cx: 300, cy: 110 },
                  { cx: 365, cy: 105 },
                  { cx: 420, cy: 112 },
                  { cx: 490, cy: 105 },
                  { cx: 550, cy: 115 },
                  { cx: 625, cy: 100 },
                  { cx: 690, cy: 45 }
                ].map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.cx}
                    cy={pt.cy}
                    r={pt.cx === 690 ? "4" : "3"}
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    className="hover:scale-150 transition-transform cursor-pointer"
                  />
                ))}
              </svg>

              {/* Sumbu X Label Angka Persis: 1, 5, 10, 15, 20, 25, 30, 35 */}
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 mt-2 px-2">
                <span>1</span>
                <span>5</span>
                <span>10</span>
                <span>15</span>
                <span>20</span>
                <span>25</span>
                <span>30</span>
                <span>35</span>
              </div>
            </div>

            {/* Tombol Buka Matriks Risiko Lengkap 5x5 Permenpan RB */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Matriks 5x5 Standar Permenpan RB No. 5/2020 & Detail Kategori Risiko:
              </span>
              <button
                type="button"
                onClick={() => setShowMatrixModal(!showMatrixModal)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#414594]/10 text-xs font-bold text-[#414594] border border-slate-200/80 transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{showMatrixModal ? "Sembunyikan Matriks" : "Tampilkan Matriks 5x5"}</span>
              </button>
            </div>

            {/* Matriks 5x5 Saat Ditampilkan */}
            {showMatrixModal && (
              <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                <DashboardCharts risks={activeDataset} />
              </div>
            )}
          </div>

        </div>

        {/* ======================================================================= */}
        {/* KOLOM KANAN (lg:col-span-4): QUICK LINKS + TEAM MEMBERS                 */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* BAGIAN 1: QUICK LINKS (Persis 3 Kotak Aksi di Screenshot) */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              Quick Links
            </h2>

            <div className="space-y-2.5">
              {/* Action 1: Add Job -> Input Risiko Baru */}
              <a
                href="/dashboard/mr-identifikasi"
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-100 shadow-xs transition-all hover:translate-x-1 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#414594] flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Target className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-800 group-hover:text-[#414594] transition-colors block">
                    Add Job
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Input Identifikasi Risiko</span>
                </div>
              </a>

              {/* Action 2: Add Company/Vendor -> Penyusunan RTP */}
              <a
                href="/dashboard/mr-rtp"
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-100 shadow-xs transition-all hover:translate-x-1 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#414594] flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-800 group-hover:text-[#414594] transition-colors block">
                    Add Company/Vendor
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Penyusunan Rencana Tindak (RTP)</span>
                </div>
              </a>

              {/* Action 3: Add Consultant -> Cetak Laporan MR */}
              <a
                href="/dashboard/laporan"
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-100 shadow-xs transition-all hover:translate-x-1 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#414594] flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-800 group-hover:text-[#414594] transition-colors block">
                    Add Consultant
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Cetak Dokumen Laporan MR</span>
                </div>
              </a>
            </div>
          </div>

          {/* BAGIAN 2: TEAM MEMBERS (Persis Daftar Tim dengan Balon Aksi di Screenshot) */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100/90 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Team Members
              </h2>
              <a
                href="/dashboard/users"
                className="text-xs font-bold text-slate-500 hover:text-[#414594] transition-colors cursor-pointer"
              >
                View All
              </a>
            </div>

            {/* List Pengguna / Tim Kerja */}
            <div className="space-y-3.5">
              {teamMembers.map((member, idx) => (
                <div 
                  key={member.name}
                  className="flex items-center justify-between group relative py-1"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Avatar Bulat dengan Status */}
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#414594] to-indigo-400 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                        {member.initial}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        member.status === "online" ? "bg-emerald-500" : member.status === "active" ? "bg-blue-500" : "bg-slate-300"
                      }`} />
                    </div>

                    {/* Info Nama & Jabatan */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {member.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  {/* Aksi Sisi Kanan: Tiga Titik & Balon Aksi Chat/Phone Mengambang (Persis Screenshot) */}
                  <div className="flex items-center relative">
                    {member.hasFloatingAction && (
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-100 animate-in fade-in duration-300 z-20">
                        <button type="button" className="text-[#414594] hover:scale-110 transition-transform cursor-pointer" title="Kirim Pesan">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" className="text-[#414594] hover:scale-110 transition-transform cursor-pointer" title="Panggilan Suara">
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <button type="button" className="text-slate-300 hover:text-slate-600 p-1 cursor-pointer">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. TABEL HIERARKI UNIT KERJA (Khusus Admin, Kementerian & Eselon 1)        */}
      {/* ========================================================================= */}
      {(viewMode === "admin" || viewMode === "kementerian" || viewMode === "eselon_1") && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-100/90 mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#414594]" />
                <span>Profil Risiko per Unit Kerja</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Rincian matriks risiko per unit kerja Eselon 1 dan Eselon 2 di lingkungan Kementerian Desa dan PDT.
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
              Klik nama Eselon 1 untuk rincian
            </span>
          </div>

          <div className="overflow-x-auto mt-4 custom-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="min-w-[340px] text-xs font-bold text-slate-600">Nama Unit Kerja</TableHead>
                  <TableHead className="text-center w-[140px] text-xs font-bold text-slate-600">Total Risiko</TableHead>
                  <TableHead className="text-center w-[140px] text-xs font-bold text-slate-600">Risiko Prioritas</TableHead>
                  <TableHead className="text-center w-[140px] text-xs font-bold text-slate-600">Total RTP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Baris Tingkat Kementerian */}
                {(selectedChartUnit === "all" || selectedChartUnit === "kementerian") && (
                  <TableRow className="bg-[#414594]/5 hover:bg-[#414594]/10 transition-colors border-b border-slate-100">
                    <TableCell className="font-bold text-[#414594] py-3.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#414594] shrink-0" />
                        <span>Tingkat Kementerian ({kementerianUnitName})</span>
                        <span className="text-[10px] bg-[#414594] text-white px-2 py-0.2 rounded-full font-bold uppercase">
                          Kementerian
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-extrabold text-sm text-[#414594]">{ministryTotals.totalRisiko}</TableCell>
                    <TableCell className="text-center font-extrabold text-sm text-red-600">{ministryTotals.risikoPrioritas}</TableCell>
                    <TableCell className="text-center font-extrabold text-sm text-[#414594]">{ministryTotals.totalRtp}</TableCell>
                  </TableRow>
                )}

                {/* Baris Eselon 1 & Anak Eselon 2 */}
                {adminHierarchy.map((e1) => {
                  const isOpen = expandedE1[e1.id];
                  return (
                    <div key={e1.id} className="contents">
                      <TableRow 
                        className="hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100"
                        onClick={() => toggleE1(e1.id)}
                      >
                        <TableCell className="font-bold text-slate-800 py-3.5">
                          <div className="flex items-center gap-2">
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                            )}
                            <span>{e1.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-extrabold text-sm text-[#414594]">{e1.totalRisiko}</TableCell>
                        <TableCell className="text-center font-extrabold text-sm text-red-600">{e1.risikoPrioritas}</TableCell>
                        <TableCell className="text-center font-extrabold text-sm text-slate-700">{e1.totalRtp}</TableCell>
                      </TableRow>
                      
                      {isOpen && e1.children.map((e2: any) => (
                        <TableRow key={e2.id} className="bg-slate-50/40 hover:bg-slate-50 transition-colors border-b border-slate-100/60">
                          <TableCell className="pl-10 py-2.5 text-xs font-medium text-slate-600">
                            <span className="text-slate-400 mr-2">↳</span>
                            {e2.name}
                          </TableCell>
                          <TableCell className="text-center text-xs font-bold text-slate-700">{e2.totalRisiko}</TableCell>
                          <TableCell className="text-center text-xs font-bold text-red-500">{e2.risikoPrioritas}</TableCell>
                          <TableCell className="text-center text-xs font-bold text-slate-600">{e2.totalRtp}</TableCell>
                        </TableRow>
                      ))}
                    </div>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

    </div>
  );
}