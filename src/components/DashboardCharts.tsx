"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AlertCircle, CheckCircle2, Clock, CalendarX2 } from "lucide-react";

interface RTP {
  id?: string;
  rencana?: string;
  targetWaktu?: string;
  pemantauan?: {
    persentase?: number;
    progres?: string;
  };
}

interface IdentifikasiRisiko {
  id: string;
  kategori: string;
  besaranRisiko?: number;
  rtpList?: RTP[];
}

interface DashboardChartsProps {
  risks: IdentifikasiRisiko[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];
const LEVEL_COLORS: Record<string, string> = {
  "Sangat Rendah": "#3b82f6", // blue-500
  "Rendah": "#10b981", // emerald-500
  "Sedang": "#facc15", // yellow-400
  "Tinggi": "#f97316", // orange-500
  "Sangat Tinggi": "#ef4444" // red-500
};

const RTP_COLORS = {
  "Selesai": "#10b981",
  "Berjalan": "#f59e0b",
  "Belum": "#94a3b8",
  "Terlambat": "#ef4444"
};

export function DashboardCharts({ risks }: DashboardChartsProps) {
  // Aggregate data for Kategori Risiko
  const kategoriData = useMemo(() => {
    const counts: Record<string, number> = {};
    risks.forEach(r => {
      const cat = r.kategori || "Tidak Terkategori";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    })).sort((a, b) => b.value - a.value);
  }, [risks]);

  // Aggregate data for Level Risiko
  const levelData = useMemo(() => {
    const counts = {
      "Sangat Rendah": 0,
      "Rendah": 0,
      "Sedang": 0,
      "Tinggi": 0,
      "Sangat Tinggi": 0,
    };
    risks.forEach(r => {
      const score = r.besaranRisiko || 0;
      if (score >= 20) counts["Sangat Tinggi"]++;
      else if (score >= 16) counts["Tinggi"]++;
      else if (score >= 12) counts["Sedang"]++;
      else if (score >= 6) counts["Rendah"]++;
      else if (score >= 1) counts["Sangat Rendah"]++;
    });
    
    return [
      { name: "Sangat Rendah", value: counts["Sangat Rendah"] },
      { name: "Rendah", value: counts["Rendah"] },
      { name: "Sedang", value: counts["Sedang"] },
      { name: "Tinggi", value: counts["Tinggi"] },
      { name: "Sangat Tinggi", value: counts["Sangat Tinggi"] }
    ].filter(d => d.value > 0);
  }, [risks]);

  // Aggregate data for RTP
  const rtpStats = useMemo(() => {
    let total = 0;
    let selesai = 0;
    let berjalan = 0;
    let belum = 0;
    let terlambat = 0;

    const overdueList: any[] = [];

    risks.forEach(r => {
      if (r.rtpList && Array.isArray(r.rtpList)) {
        r.rtpList.forEach(rtp => {
          total++;
          const p = rtp.pemantauan?.persentase || 0;
          
          if (p === 100) {
            selesai++;
          } else if (p > 0) {
            berjalan++;
          } else {
            belum++;
          }

          // Check targetWaktu if not finished
          if (p < 100 && rtp.targetWaktu) {
             // Simple heuristic: if targetWaktu parses to a valid Date and it's in the past
             const tDate = new Date(rtp.targetWaktu);
             if (!isNaN(tDate.getTime()) && tDate.getTime() < Date.now()) {
                terlambat++;
                overdueList.push(rtp);
             } else {
                // If the target is just a string like "Juli 2024", we could do basic string checking
                // For simplicity, we just rely on valid date parsing, otherwise it's not strictly "terlambat"
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

  if (risks.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        Belum ada data risiko untuk divisualisasikan pada unit ini.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Chart Kategori */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase">Distribusi Kategori Risiko</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kategoriData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {kategoriData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} Risiko`, "Jumlah"]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart Level Risiko */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase">Peta Level Risiko</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={levelData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    formatter={(value: number) => [`${value} Risiko`, "Jumlah"]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {levelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={LEVEL_COLORS[entry.name] || '#ccc'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RTP Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* RTP Status Chart */}
        <Card className="shadow-sm border-slate-200 col-span-1 md:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase">Status Pelaksanaan RTP</CardTitle>
            <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
              Total: {rtpStats.total} RTP
            </div>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-[220px] w-[220px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rtpStats.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {rtpStats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} RTP`, "Jumlah"]}
                    contentStyle={{ borderRadius: '8px', border: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full space-y-4">
               <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                 <div className="flex items-center gap-3">
                   <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                   <span className="font-semibold text-emerald-900">Sudah Selesai (100%)</span>
                 </div>
                 <span className="font-bold text-lg text-emerald-700">{rtpStats.selesai}</span>
               </div>
               
               <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                 <div className="flex items-center gap-3">
                   <Clock className="w-5 h-5 text-amber-600" />
                   <span className="font-semibold text-amber-900">Sedang Berjalan</span>
                 </div>
                 <span className="font-bold text-lg text-amber-700">{rtpStats.berjalan}</span>
               </div>

               <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                 <div className="flex items-center gap-3">
                   <AlertCircle className="w-5 h-5 text-slate-500" />
                   <span className="font-semibold text-slate-700">Belum Dimulai</span>
                 </div>
                 <span className="font-bold text-lg text-slate-600">{rtpStats.belum}</span>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Reminder / Overdue Card */}
        <Card className="shadow-sm border-red-200 bg-red-50/30 col-span-1">
          <CardHeader className="pb-2 border-b border-red-100">
            <CardTitle className="text-sm font-bold text-red-700 uppercase flex items-center gap-2">
              <CalendarX2 className="w-4 h-4" />
              Reminder & Overdue
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
             <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-red-100">
               <span className="block text-4xl font-black text-red-600 mb-1">{rtpStats.terlambat}</span>
               <span className="text-sm font-semibold text-red-800">RTP Melewati Batas Waktu</span>
             </div>
             
             {rtpStats.terlambat > 0 ? (
               <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 leading-relaxed font-medium">
                 Terdapat <b>{rtpStats.terlambat}</b> rencana mitigasi yang target waktunya sudah lewat (jatuh tempo) berdasarkan estimasi tanggal. Harap segera perbarui di menu <b>Pemantauan Risiko</b>.
               </div>
             ) : (
               <div className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100 leading-relaxed font-medium flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 shrink-0" />
                 Tidak ada RTP yang terdeteksi jatuh tempo dari sistem batas waktu.
               </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
