"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface IdentifikasiRisiko {
  id: string;
  kategori: string;
  besaranRisiko?: number;
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
    
    // Convert to array in specific order
    return [
      { name: "Sangat Rendah", value: counts["Sangat Rendah"] },
      { name: "Rendah", value: counts["Rendah"] },
      { name: "Sedang", value: counts["Sedang"] },
      { name: "Tinggi", value: counts["Tinggi"] },
      { name: "Sangat Tinggi", value: counts["Sangat Tinggi"] }
    ].filter(d => d.value > 0);
  }, [risks]);

  if (risks.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        Belum ada data risiko untuk divisualisasikan pada unit ini.
      </div>
    );
  }

  return (
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
  );
}
