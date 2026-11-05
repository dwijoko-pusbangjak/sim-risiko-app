"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from "recharts";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CalendarX2,
  Flame,
  BarChart3,
  PieChart as PieIcon,
  LayoutGrid,
  Building2,
  Layers,
  Filter,
  Eye,
  X,
  ArrowUpRight,
  ShieldCheck,
  Target,
  Sparkles,
  Info
} from "lucide-react";

interface RTP {
  id?: string;
  rencana?: string;
  targetWaktu?: string;
  penanggungJawab?: string;
  pemantauan?: {
    persentase?: number;
    progres?: string;
  };
}

interface IdentifikasiRisiko {
  id: string;
  tahun?: string;
  unitName?: string;
  pernyataanRisiko?: string;
  kategori: string;
  penilaianPengendalian?: string;
  levelKemungkinan?: number;
  levelDampak?: number;
  besaranRisiko?: number;
  levelRisiko?: string;
  rtpList?: RTP[];
  updatedAt?: string;
}

interface DashboardChartsProps {
  risks: IdentifikasiRisiko[];
}

// Matriks 5x5 Standar Permenpan RB No. 5/2020:
// Baris = Level Kemungkinan (5 down to 1)
// Kolom = Level Dampak (1 up to 5)
const RISK_MATRIX: Record<number, Record<number, number>> = {
  5: { 1: 7, 2: 12, 3: 17, 4: 22, 5: 25 },
  4: { 1: 4, 2: 9, 3: 14, 4: 19, 5: 24 },
  3: { 1: 3, 2: 8, 3: 13, 4: 18, 5: 23 },
  2: { 1: 2, 2: 6, 3: 11, 4: 16, 5: 21 },
  1: { 1: 1, 2: 5, 3: 10, 4: 15, 5: 20 },
};

const KEMUNGKINAN_LABELS: Record<number, { code: string; label: string; desc: string }> = {
  5: { code: "5", label: "Hampir Pasti", desc: "> 80% per tahun" },
  4: { code: "4", label: "Sering Terjadi", desc: "50% - 80% per tahun" },
  3: { code: "3", label: "Kadang Terjadi", desc: "30% - 50% per tahun" },
  2: { code: "2", label: "Jarang Terjadi", desc: "10% - 30% per tahun" },
  1: { code: "1", label: "Hampir Tidak", desc: "< 10% per tahun" },
};

const DAMPAK_LABELS: Record<number, { code: string; label: string }> = {
  1: { code: "1", label: "Tidak Signifikan" },
  2: { code: "2", label: "Minor" },
  3: { code: "3", label: "Moderat" },
  4: { code: "4", label: "Signifikan" },
  5: { code: "5", label: "Sangat Signifikan" },
};

export function getRiskLevelInfo(score: number) {
  if (score >= 20) {
    return {
      label: "Sangat Tinggi",
      color: "bg-red-500 hover:bg-red-600 text-white border-red-600",
      badge: "bg-red-100 text-red-800 border-red-200",
      hex: "#ef4444",
      gradient: "from-red-500 to-rose-600"
    };
  }
  if (score >= 16) {
    return {
      label: "Tinggi",
      color: "bg-orange-500 hover:bg-orange-600 text-white border-orange-600",
      badge: "bg-orange-100 text-orange-800 border-orange-200",
      hex: "#f97316",
      gradient: "from-orange-500 to-amber-600"
    };
  }
  if (score >= 12) {
    return {
      label: "Sedang",
      color: "bg-yellow-400 hover:bg-yellow-500 text-slate-900 border-yellow-500",
      badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
      hex: "#eab308",
      gradient: "from-yellow-400 to-amber-500"
    };
  }
  if (score >= 6) {
    return {
      label: "Rendah",
      color: "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      hex: "#10b981",
      gradient: "from-emerald-500 to-teal-600"
    };
  }
  if (score >= 1) {
    return {
      label: "Sangat Rendah",
      color: "bg-blue-500 hover:bg-blue-600 text-white border-blue-600",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
      hex: "#3b82f6",
      gradient: "from-blue-500 to-indigo-600"
    };
  }
  return {
    label: "Belum Dianalisis",
    color: "bg-slate-200 text-slate-700 border-slate-300",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    hex: "#94a3b8",
    gradient: "from-slate-300 to-slate-400"
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

const RTP_COLORS = {
  "Selesai": "#10b981",
  "Berjalan": "#f59e0b",
  "Belum": "#94a3b8",
  "Terlambat": "#ef4444"
};

export function DashboardCharts({ risks }: DashboardChartsProps) {
  // Option Tab Utama: 'all' | 'heatmap' | 'distribution' | 'rtp' | 'units'
  const [activeTab, setActiveTab] = useState<"all" | "heatmap" | "distribution" | "rtp" | "units">("all");

  // Chart Type Switchers
  const [kategoriChartType, setKategoriChartType] = useState<"donut" | "bar">("donut");
  const [levelChartType, setLevelChartType] = useState<"bar" | "pie">("bar");
  const [rtpChartType, setRtpChartType] = useState<"donut" | "bar">("donut");

  // Heat Map Selected Cell for drilldown
  const [selectedCell, setSelectedCell] = useState<{
    k: number;
    d: number;
    score: number;
    level: ReturnType<typeof getRiskLevelInfo>;
    risks: IdentifikasiRisiko[];
  } | null>(null);

  // 1. DATA HEAT MAP (Peta Panas Matriks 5x5)
  const heatMapData = useMemo(() => {
    const grid: Record<string, IdentifikasiRisiko[]> = {};
    for (let k = 1; k <= 5; k++) {
      for (let d = 1; d <= 5; d++) {
        grid[`${k}-${d}`] = [];
      }
    }

    const unanalyzed: IdentifikasiRisiko[] = [];

    risks.forEach(r => {
      const k = Number(r.levelKemungkinan);
      const d = Number(r.levelDampak);
      if (k >= 1 && k <= 5 && d >= 1 && d <= 5) {
        grid[`${k}-${d}`].push(r);
      } else {
        unanalyzed.push(r);
      }
    });

    return { grid, unanalyzed };
  }, [risks]);

  // 2. DATA KATEGORI RISIKO
  const kategoriData = useMemo(() => {
    const counts: Record<string, number> = {};
    risks.forEach(r => {
      const cat = r.kategori || "Tidak Terkategori";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts)
      .map(key => ({
        name: key,
        value: counts[key]
      }))
      .sort((a, b) => b.value - a.value);
  }, [risks]);

  // 3. DATA LEVEL RISIKO
  const levelData = useMemo(() => {
    const counts = {
      "Sangat Rendah": 0,
      "Rendah": 0,
      "Sedang": 0,
      "Tinggi": 0,
      "Sangat Tinggi": 0,
    };
    risks.forEach(r => {
      const score = Number(r.besaranRisiko || 0);
      if (score >= 20) counts["Sangat Tinggi"]++;
      else if (score >= 16) counts["Tinggi"]++;
      else if (score >= 12) counts["Sedang"]++;
      else if (score >= 6) counts["Rendah"]++;
      else if (score >= 1) counts["Sangat Rendah"]++;
    });

    return [
      { name: "Sangat Rendah", value: counts["Sangat Rendah"], color: "#3b82f6" },
      { name: "Rendah", value: counts["Rendah"], color: "#10b981" },
      { name: "Sedang", value: counts["Sedang"], color: "#eab308" },
      { name: "Tinggi", value: counts["Tinggi"], color: "#f97316" },
      { name: "Sangat Tinggi", value: counts["Sangat Tinggi"], color: "#ef4444" }
    ].filter(d => d.value > 0);
  }, [risks]);

  // 4. DATA RTP
  const rtpStats = useMemo(() => {
    let total = 0;
    let selesai = 0;
    let berjalan = 0;
    let belum = 0;
    let terlambat = 0;
    const overdueList: { rtp: RTP; riskName: string }[] = [];

    risks.forEach(r => {
      if (r.rtpList && Array.isArray(r.rtpList)) {
        r.rtpList.forEach(rtp => {
          total++;
          const p = Number(rtp.pemantauan?.persentase || 0);

          if (p === 100) {
            selesai++;
          } else if (p > 0) {
            berjalan++;
          } else {
            belum++;
          }

          if (p < 100 && rtp.targetWaktu) {
            const tDate = new Date(rtp.targetWaktu);
            if (!isNaN(tDate.getTime()) && tDate.getTime() < Date.now()) {
              terlambat++;
              overdueList.push({ rtp, riskName: r.pernyataanRisiko || "-" });
            }
          }
        });
      }
    });

    const chartData = [
      { name: "Selesai (100%)", value: selesai, fill: RTP_COLORS["Selesai"] },
      { name: "Sedang Berjalan", value: berjalan, fill: RTP_COLORS["Berjalan"] },
      { name: "Belum Dimulai", value: belum, fill: RTP_COLORS["Belum"] },
    ].filter(d => d.value > 0);

    return { total, selesai, berjalan, belum, terlambat, chartData, overdueList };
  }, [risks]);

  // 5. DATA KOMPARASI PER UNIT (untuk admin / konsolidasi)
  const unitComparisonData = useMemo(() => {
    const unitMap: Record<string, { total: number; prioritas: number }> = {};
    risks.forEach(r => {
      const uName = r.unitName || "Tidak Diketahui";
      if (!unitMap[uName]) unitMap[uName] = { total: 0, prioritas: 0 };
      unitMap[uName].total++;
      if (Number(r.besaranRisiko || 0) >= 12) {
        unitMap[uName].prioritas++;
      }
    });

    return Object.entries(unitMap)
      .map(([name, val]) => ({
        name: name.length > 25 ? name.substring(0, 22) + "..." : name,
        fullName: name,
        total: val.total,
        prioritas: val.prioritas
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10
  }, [risks]);

  const hasMultipleUnits = useMemo(() => {
    const unique = new Set(risks.map(r => r.unitName).filter(Boolean));
    return unique.size > 1;
  }, [risks]);

  if (risks.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <Target className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
        <p className="font-semibold text-slate-700">Belum ada data risiko untuk divisualisasikan</p>
        <p className="text-xs text-slate-500 mt-1">Tambahkan identifikasi dan analisis risiko terlebih dahulu.</p>
      </div>
    );
  }

  // ============================================================================
  // RENDER COMPONENT: HEAT MAP 5x5
  // ============================================================================
  const renderHeatMap = (isFullView = false) => {
    return (
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                <CardTitle className="text-base sm:text-lg font-bold tracking-wide">
                  Heat Map Matriks 5×5 (Peta Panas Risiko)
                </CardTitle>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-medium">
                  Permenpan RB No. 5/2020
                </span>
              </div>
              <CardDescription className="text-xs text-slate-300 mt-1">
                Distribusi risiko berdasarkan koordinat Tingkat Kemungkinan (Sumbu Y) vs Tingkat Dampak (Sumbu X). Klik pada kotak untuk melihat rincian risiko.
              </CardDescription>
            </div>

            {/* Quick Summary Pill Counters */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="px-2 py-1 rounded-md bg-red-600/90 text-white font-bold flex items-center gap-1">
                ST: {risks.filter(r => (r.besaranRisiko || 0) >= 20).length}
              </span>
              <span className="px-2 py-1 rounded-md bg-orange-600/90 text-white font-bold flex items-center gap-1">
                T: {risks.filter(r => (r.besaranRisiko || 0) >= 16 && (r.besaranRisiko || 0) < 20).length}
              </span>
              <span className="px-2 py-1 rounded-md bg-yellow-500 text-slate-950 font-bold flex items-center gap-1">
                S: {risks.filter(r => (r.besaranRisiko || 0) >= 12 && (r.besaranRisiko || 0) < 16).length}
              </span>
              <span className="px-2 py-1 rounded-md bg-emerald-600/90 text-white font-bold flex items-center gap-1">
                R: {risks.filter(r => (r.besaranRisiko || 0) >= 6 && (r.besaranRisiko || 0) < 12).length}
              </span>
              <span className="px-2 py-1 rounded-md bg-blue-600/90 text-white font-bold flex items-center gap-1">
                SR: {risks.filter(r => (r.besaranRisiko || 0) >= 1 && (r.besaranRisiko || 0) < 6).length}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Unanalyzed Warning if any */}
          {heatMapData.unanalyzed.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Terdapat <strong>{heatMapData.unanalyzed.length} risiko</strong> yang belum memiliki nilai Kemungkinan atau Dampak lengkap sehingga belum terpetakan di Heat Map. Lengkapi di menu <em>Analisis Risiko</em>.
              </span>
            </div>
          )}

          {/* THE 5x5 INTERACTIVE GRID */}
          <div className="overflow-x-auto pb-2 custom-scrollbar">
            <div className="min-w-[560px]">
              {/* Outer Container with Y-Axis label */}
              <div className="flex items-stretch gap-2">
                {/* Vertical Y-Axis Label */}
                <div className="flex items-center justify-center writing-mode-vertical text-xs font-bold text-slate-500 uppercase tracking-widest px-1 py-4 select-none shrink-0 border-r border-slate-200 rotate-180 [writing-mode:vertical-lr]">
                  Tingkat Kemungkinan (Frekuensi)
                </div>

                {/* Grid Rows (k = 5, 4, 3, 2, 1) */}
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((k) => {
                    const kInfo = KEMUNGKINAN_LABELS[k];

                    return (
                      <div key={k} className="flex items-center gap-2">
                        {/* Row Y Label */}
                        <div className="w-28 sm:w-36 text-right shrink-0 select-none">
                          <span className="font-bold text-xs sm:text-sm text-slate-800 block leading-tight">
                            {kInfo.label}
                          </span>
                          <span className="text-[10px] text-slate-500 hidden sm:block">
                            ({kInfo.desc})
                          </span>
                        </div>

                        {/* 5 Column Cells for this Row (d = 1..5) */}
                        <div className="grid grid-cols-5 gap-2 flex-1">
                          {[1, 2, 3, 4, 5].map((d) => {
                            const score = RISK_MATRIX[k][d];
                            const level = getRiskLevelInfo(score);
                            const matchingRisks = heatMapData.grid[`${k}-${d}`] || [];
                            const isCellSelected = selectedCell?.k === k && selectedCell?.d === d;
                            const hasRisks = matchingRisks.length > 0;

                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => {
                                  if (isCellSelected) {
                                    setSelectedCell(null);
                                  } else {
                                    setSelectedCell({
                                      k,
                                      d,
                                      score,
                                      level,
                                      risks: matchingRisks
                                    });
                                  }
                                }}
                                className={`relative h-16 sm:h-20 rounded-xl p-1.5 flex flex-col justify-between items-center text-center transition-all duration-200 border cursor-pointer select-none group shadow-xs ${
                                  level.color
                                } ${
                                  isCellSelected
                                    ? "ring-4 ring-slate-900 ring-offset-2 scale-102 z-20 shadow-xl"
                                    : "hover:scale-[1.03] hover:shadow-md"
                                }`}
                                title={`K=${k}, D=${d} | Skor ${score} (${level.label}) | ${matchingRisks.length} Risiko`}
                              >
                                {/* Top: Score badge */}
                                <div className="w-full flex items-center justify-between text-[10px] opacity-85 px-0.5">
                                  <span className="font-mono font-bold">{k}×{d}</span>
                                  <span className="font-black bg-black/20 px-1 rounded text-[9px]">
                                    {score}
                                  </span>
                                </div>

                                {/* Center: Risk Count Badge */}
                                <div className="my-auto">
                                  {hasRisks ? (
                                    <div className="inline-flex items-center gap-1 bg-white text-slate-900 font-extrabold text-xs sm:text-sm px-2 py-0.5 rounded-full shadow-sm ring-2 ring-black/10 group-hover:scale-110 transition-transform">
                                      <Target className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>{matchingRisks.length}</span>
                                      <span className="hidden sm:inline text-[10px] font-medium text-slate-600">
                                        Risiko
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs opacity-40 font-mono font-semibold">0</span>
                                  )}
                                </div>

                                {/* Bottom: Level Label mini */}
                                <div className="text-[9px] font-semibold tracking-tight uppercase truncate max-w-full opacity-90">
                                  {level.label}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Horizontal X-Axis Header (Labels for d = 1..5) */}
                  <div className="flex items-start gap-2 pt-1 border-t border-slate-200 mt-2">
                    <div className="w-28 sm:w-36 text-right shrink-0 select-none">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Dampak $\rightarrow$
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 flex-1 text-center select-none">
                      {[1, 2, 3, 4, 5].map((d) => {
                        const dInfo = DAMPAK_LABELS[d];
                        return (
                          <div key={d} className="px-1 py-1">
                            <span className="block font-bold text-xs sm:text-sm text-slate-800 leading-tight">
                              {dInfo.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              Skala {d}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Horizontal X-Axis Main Title */}
                  <div className="text-center pt-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Tingkat Dampak (Konsekuensi)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HEAT MAP LEGEND & INFORMATION */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Legenda Level Besaran Risiko:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Sangat Rendah (1-5)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Rendah (6-11)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-100 text-yellow-800 font-semibold border border-yellow-200">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                Sedang (12-15)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-100 text-orange-800 font-semibold border border-orange-200">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                Tinggi (16-19)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-800 font-semibold border border-red-200">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Sangat Tinggi (20-25)
              </span>
            </div>
          </div>

          {/* DRILLDOWN DETAIL INSPECTOR (Jika user klik sel di matriks) */}
          {selectedCell && (
            <div className="animate-in fade-in slide-in-from-top-3 duration-300 bg-white border-2 border-emerald-600/40 rounded-xl p-4 shadow-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${selectedCell.level.color} shadow-xs`}>
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      Rincian Koordinat: Kemungkinan {selectedCell.k} × Dampak {selectedCell.d}
                      <span className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase ${selectedCell.level.badge}`}>
                        {selectedCell.level.label} (Skor: {selectedCell.score})
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Terdapat <strong>{selectedCell.risks.length} peristiwa risiko</strong> yang terdaftar pada tingkat kombinasi ini.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors self-end sm:self-auto shrink-0"
                >
                  <X className="w-3.5 h-3.5" /> Tutup Rincian
                </button>
              </div>

              {selectedCell.risks.length > 0 ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {selectedCell.risks.map((r, i) => (
                    <div
                      key={r.id || i}
                      className="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-lg border border-slate-200 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">
                            #{i + 1}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium">
                            {r.kategori || "Tanpa Kategori"}
                          </span>
                          {r.unitName && (
                            <span className="text-[11px] font-semibold text-emerald-800">
                              • {r.unitName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                          {r.pernyataanRisiko}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0 pt-1">
                        <span className="text-[11px] text-slate-500">
                          {r.rtpList?.length || 0} Butir RTP
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${selectedCell.level.badge}`}>
                          {selectedCell.level.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Tidak ada peristiwa risiko pada kombinasi kemungkinan {selectedCell.k} dan dampak {selectedCell.d}.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ============================================================================
  // RENDER COMPONENT: KATEGORI & LEVEL CHARTS
  // ============================================================================
  const renderDistributionCharts = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CHART 1: KATEGORI RISIKO */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                Distribusi Kategori Risiko
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Penyebaran risiko berdasarkan bidang tugas
              </CardDescription>
            </div>
            {/* Toggle Donut / Bar */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setKategoriChartType("donut")}
                title="Tampilan Donat"
                className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                  kategoriChartType === "donut"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <PieIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setKategoriChartType("bar")}
                title="Tampilan Batang"
                className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                  kategoriChartType === "bar"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {kategoriChartType === "donut" ? (
                  <PieChart>
                    <Pie
                      data={kategoriData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {kategoriData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} Risiko`, "Jumlah"]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                ) : (
                  <BarChart
                    data={kategoriData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value} Risiko`, "Jumlah"]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {kategoriData.map((_, index) => (
                        <Cell key={`bar-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* CHART 2: LEVEL RISIKO */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Sebaran Level Risiko
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Komposisi risiko menurut tingkat keparahan
              </CardDescription>
            </div>
            {/* Toggle Bar / Pie */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setLevelChartType("bar")}
                title="Tampilan Batang"
                className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                  levelChartType === "bar"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLevelChartType("pie")}
                title="Tampilan Lingkaran"
                className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                  levelChartType === "pie"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <PieIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {levelChartType === "bar" ? (
                  <BarChart
                    data={levelData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      formatter={(value: number) => [`${value} Risiko`, "Jumlah"]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {levelData.map((entry, index) => (
                        <Cell key={`level-bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={levelData}
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {levelData.map((entry, index) => (
                        <Cell key={`level-pie-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} Risiko`, "Jumlah"]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================================
  // RENDER COMPONENT: RTP SECTION
  // ============================================================================
  const renderRtpSection = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* RTP Status Chart */}
        <Card className="shadow-sm border-slate-200 col-span-1 md:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Status Pelaksanaan RTP
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Progres realisasi mitigasi rencana tindak pengendalian
              </CardDescription>
            </div>
            <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-700 border border-slate-200">
              Total: {rtpStats.total} Butir RTP
            </div>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center gap-8 pt-4">
            <div className="h-[220px] w-[220px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rtpStats.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {rtpStats.chartData.map((entry, index) => (
                      <Cell key={`rtp-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} Butir`, "Jumlah"]}
                    contentStyle={{ borderRadius: '8px', border: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100 shadow-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="font-semibold text-emerald-950 text-sm block">Sudah Selesai (100%)</span>
                    <span className="text-[11px] text-emerald-700">Tindakan mitigasi tuntas</span>
                  </div>
                </div>
                <span className="font-black text-xl text-emerald-700">{rtpStats.selesai}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100 shadow-xs">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <div>
                    <span className="font-semibold text-amber-950 text-sm block">Sedang Berjalan</span>
                    <span className="text-[11px] text-amber-700">Progres 1% - 99%</span>
                  </div>
                </div>
                <span className="font-black text-xl text-amber-700">{rtpStats.berjalan}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-slate-500" />
                  <div>
                    <span className="font-semibold text-slate-800 text-sm block">Belum Dimulai</span>
                    <span className="text-[11px] text-slate-500">Progres 0%</span>
                  </div>
                </div>
                <span className="font-black text-xl text-slate-700">{rtpStats.belum}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reminder / Overdue Card */}
        <Card className="shadow-sm border-red-200 bg-red-50/20 col-span-1">
          <CardHeader className="pb-2 border-b border-red-100">
            <CardTitle className="text-sm font-bold text-red-700 uppercase flex items-center gap-2">
              <CalendarX2 className="w-4 h-4" />
              Peringatan Jatuh Tempo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-red-100">
              <span className="block text-4xl font-black text-red-600 mb-1">{rtpStats.terlambat}</span>
              <span className="text-xs font-bold text-red-800 uppercase tracking-wide">
                RTP Melewati Batas Waktu
              </span>
            </div>

            {rtpStats.terlambat > 0 ? (
              <div className="text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-100 leading-relaxed font-medium space-y-2">
                <p>
                  Terdapat <b>{rtpStats.terlambat}</b> rencana mitigasi yang target waktunya terlewati berdasarkan sistem tanggal.
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                  {rtpStats.overdueList.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="p-1.5 bg-white rounded border border-red-200 text-[11px] truncate">
                      • {item.rtp.rencana || item.riskName}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100 leading-relaxed font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Seluruh target waktu rencana mitigasi masih dalam batas waktu normal.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================================
  // RENDER COMPONENT: UNIT COMPARISON (ADMIN ONLY / MULTI-UNIT)
  // ============================================================================
  const renderUnitComparison = () => {
    return (
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Komparasi Risiko Antar Unit Kerja (Top 10 Unit)
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Perbandingan total risiko teridentifikasi dan jumlah risiko prioritas per unit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[340px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={unitComparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="name"
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 10 }}
                  height={60}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number, name: string) => [
                    `${val} Risiko`,
                    name === "total" ? "Total Risiko" : "Risiko Prioritas"
                  ]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px' }}
                />
                <Bar name="Total Risiko" dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar name="Risiko Prioritas" dataKey="prioritas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* ====================================================================== */}
      {/* OPSI PILIHAN DIAGRAM / TAB NAVIGASI INFOGRAFIS                         */}
      {/* ====================================================================== */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-slate-700" />
            <span>Semua Diagram</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("heatmap")}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "heatmap"
                ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${activeTab === "heatmap" ? "text-amber-200" : "text-red-500"}`} />
            <span>Heat Map Matriks 5×5</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("distribution")}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "distribution"
                ? "bg-white text-blue-700 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Kategori & Level</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rtp")}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "rtp"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Status Mitigasi RTP</span>
          </button>

          {hasMultipleUnits && (
            <button
              type="button"
              onClick={() => setActiveTab("units")}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "units"
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Komparasi Unit Kerja</span>
            </button>
          )}
        </div>

        <div className="px-3 py-1 text-[11px] text-slate-500 font-medium">
          Menampilkan <strong className="text-slate-800">{risks.length}</strong> risiko terdaftar
        </div>
      </div>

      {/* ====================================================================== */}
      {/* TAMPILAN SESUAI OPSI TAB YANG DIPILIH                                   */}
      {/* ====================================================================== */}

      {/* TAB 1: ALL-IN-ONE (Ringkasan Lengkap) */}
      {activeTab === "all" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {renderHeatMap(false)}
          {renderDistributionCharts()}
          {renderRtpSection()}
          {hasMultipleUnits && renderUnitComparison()}
        </div>
      )}

      {/* TAB 2: KHUSUS HEAT MAP 5x5 */}
      {activeTab === "heatmap" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {renderHeatMap(true)}
        </div>
      )}

      {/* TAB 3: KHUSUS KATEGORI & LEVEL */}
      {activeTab === "distribution" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {renderDistributionCharts()}
        </div>
      )}

      {/* TAB 4: KHUSUS STATUS RTP */}
      {activeTab === "rtp" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {renderRtpSection()}
        </div>
      )}

      {/* TAB 5: KHUSUS KOMPARASI UNIT */}
      {activeTab === "units" && hasMultipleUnits && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {renderUnitComparison()}
        </div>
      )}
    </div>
  );
}
