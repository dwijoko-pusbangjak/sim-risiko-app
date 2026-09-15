"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, ShieldCheck, Loader2, Target, BarChart3, AlertOctagon, Building2, ChevronRight, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface IdentifikasiRisiko {
  id: string;
  tahun: string;
  unitName: string;
  pernyataanRisiko: string;
  kategori: string;
  penilaianPengendalian: string;
  besaranRisiko?: number;
  levelRisiko?: string;
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
  
  // State for Regular User
  const [data, setData] = useState<IdentifikasiRisiko[]>([]);
  
  // State for Admin
  const [adminHierarchy, setAdminHierarchy] = useState<any[]>([]);
  const [expandedE1, setExpandedE1] = useState<Record<string, boolean>>({});
  const [adminTotals, setAdminTotals] = useState({ totalRisiko: 0, risikoPrioritas: 0, totalRtp: 0 });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "admin") {
        fetchAdminData();
      } else {
        fetchDashboardData();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, activeYear]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const safeYear = activeYear || new Date().getFullYear().toString();
      
      // Fetch Units
      const snapUnits = await getDocs(collection(db, "units"));
      const allUnits = snapUnits.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
      
      // Fetch ALL Risks for the year
      const qRisks = query(collection(db, "mr_identifikasi"), where("tahun", "==", safeYear));
      const snapRisks = await getDocs(qRisks);
      const allRisks = snapRisks.docs.map(doc => ({ id: doc.id, ...doc.data() } as IdentifikasiRisiko));
      
      // Hitung Grand Total dari sumber asli (semua unit, tanpa peduli hierarki)
      const tRisiko = allRisks.length;
      const tPrioritas = allRisks.filter(r => (r.besaranRisiko || 0) >= 12).length;
      const tRtp = allRisks.reduce((acc, r) => acc + (r.rtpList?.length || 0), 0);
      setAdminTotals({ totalRisiko: tRisiko, risikoPrioritas: tPrioritas, totalRtp: tRtp });

      const risksByUnit: Record<string, IdentifikasiRisiko[]> = {};
      allRisks.forEach(r => {
        const unitNameKey = r.unitName || "Tidak Diketahui";
        if (!risksByUnit[unitNameKey]) risksByUnit[unitNameKey] = [];
        risksByUnit[unitNameKey].push(r);
      });
      
      const eselon1Units = allUnits.filter(u => u.level === "eselon_1");
      const eselon2Units = allUnits.filter(u => u.level === "eselon_2");
      
      const mappedRiskIds = new Set<string>();

      const hierarchy = eselon1Units.map(e1 => {
        const children = eselon2Units.filter(e2 => e2.parentId === e1.id);
        
        const e1Risks = risksByUnit[e1.name] || [];
        e1Risks.forEach(r => mappedRiskIds.add(r.id));
        
        let totalRisiko = e1Risks.length;
        let risikoPrioritas = e1Risks.filter(r => (r.besaranRisiko || 0) >= 12).length;
        let totalRtp = e1Risks.reduce((acc, r) => acc + (r.rtpList?.length || 0), 0);
        
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
          children: childrenData
        };
      });
      
      // Tangani risiko dari unit yang dihapus atau tidak ter-map ke E1/E2 di db units
        const unmappedRisks = allRisks.filter(r => !mappedRiskIds.has(r.id));
        if (unmappedRisks.length > 0) {
          console.log("Menghapus data yatim...", unmappedRisks.length);
          Promise.all(unmappedRisks.map(r => deleteDoc(doc(db, "mr_identifikasi", r.id))))
            .then(() => console.log("Berhasil menghapus data yatim"))
            .catch(e => console.error("Gagal menghapus data yatim", e));
        }
      
      // Auto expand all
      const initialExpand: Record<string, boolean> = {};
      hierarchy.forEach(h => initialExpand[h.id] = true);
      setExpandedE1(initialExpand);
      
      setAdminHierarchy(hierarchy);
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
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
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as IdentifikasiRisiko));
      
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

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-slate-500 animate-pulse">Menghimpun data Manajemen Risiko...</p>
      </div>
    );
  }

  // ==========================================
  // TAMPILAN ADMIN
  // ==========================================
  if (user?.role === "admin") {
    const totalSemuaRisiko = adminTotals.totalRisiko;
    const totalSemuaPrioritas = adminTotals.risikoPrioritas;
    const totalSemuaRtp = adminTotals.totalRtp;

    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Konsolidasi Nasional</h2>
          <p className="text-slate-500 mt-1">Gabungan profil risiko dari seluruh unit kerja Eselon 1 dan Eselon 2 di Tahun {activeYear}.</p>
        </div>

        {/* Kartu Ringkasan Admin */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">Total Risiko Global</CardTitle>
              <Target className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{totalSemuaRisiko}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Akumulasi seluruh unit kerja</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">Risiko Prioritas Global</CardTitle>
              <AlertOctagon className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{totalSemuaPrioritas}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Nilai Sedang - Sangat Tinggi</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">Total RTP Global</CardTitle>
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{totalSemuaRtp}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Akumulasi rencana mitigasi</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabel Hierarki Unit Kerja */}
        <Card className="shadow-sm border-t-4 border-t-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <Building2 className="mr-2 h-5 w-5 text-slate-600" /> Profil Risiko per Unit Kerja
            </CardTitle>
            <CardDescription>Klik nama Eselon 1 untuk memperluas (melihat data per Eselon 2).</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="min-w-[400px]">Nama Unit Kerja</TableHead>
                    <TableHead className="text-center w-[150px]">Total Risiko</TableHead>
                    <TableHead className="text-center w-[150px]">Risiko Prioritas</TableHead>
                    <TableHead className="text-center w-[150px]">Total RTP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminHierarchy.length > 0 ? (
                    adminHierarchy.map((e1) => {
                      const isOpen = expandedE1[e1.id];
                      return (
                        <div key={e1.id} className="contents">
                          {/* Row Eselon 1 */}
                          <TableRow 
                            className="hover:bg-slate-100 cursor-pointer transition-colors bg-slate-50/50"
                            onClick={() => toggleE1(e1.id)}
                          >
                            <TableCell className="font-bold text-slate-800 flex items-center py-4">
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4 mr-2 text-slate-500 shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 mr-2 text-slate-500 shrink-0" />
                              )}
                              <span className="truncate">{e1.name}</span>
                            </TableCell>
                            <TableCell className="text-center font-bold text-lg text-blue-700">{e1.totalRisiko}</TableCell>
                            <TableCell className="text-center font-bold text-lg text-red-600">{e1.risikoPrioritas}</TableCell>
                            <TableCell className="text-center font-bold text-lg text-indigo-600">{e1.totalRtp}</TableCell>
                          </TableRow>
                          
                          {/* Rows Eselon 2 (Children) */}
                          {isOpen && e1.children.map((e2: any) => (
                            <TableRow key={e2.id} className="bg-white hover:bg-slate-50 transition-colors">
                              <TableCell className="pl-12 py-3 text-slate-600 font-medium relative before:absolute before:left-[1.35rem] before:top-0 before:bottom-0 before:w-px before:bg-slate-200">
                                <div className="absolute left-[1.35rem] top-1/2 -translate-y-1/2 w-3 h-px bg-slate-200"></div>
                                <span className="truncate block pr-4">{e2.name}</span>
                              </TableCell>
                              <TableCell className="text-center font-semibold text-slate-700">{e2.totalRisiko}</TableCell>
                              <TableCell className="text-center font-semibold text-slate-700">{e2.risikoPrioritas}</TableCell>
                              <TableCell className="text-center font-semibold text-slate-700">{e2.totalRtp}</TableCell>
                            </TableRow>
                          ))}
                        </div>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                        Belum ada data unit kerja yang berelasi.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==========================================
  // TAMPILAN PENGGUNA (Eselon 1 / 2)
  // ==========================================
  const totalRisiko = data.length;
  const risikoPrioritas = data.filter(r => (r.besaranRisiko || 0) >= 12).length;
  const risikoTerkendali = data.filter(r => r.penilaianPengendalian === "Sudah Memadai").length;
  const totalRtp = data.reduce((acc, r) => acc + (r.rtpList?.length || 0), 0);

  // Kategori Aggregation
  const kategoriCount: Record<string, number> = {};
  data.forEach(r => {
    const kat = r.kategori || "Belum Kategori";
    kategoriCount[kat] = (kategoriCount[kat] || 0) + 1;
  });
  
  const maxKategoriVal = Math.max(0, ...Object.values(kategoriCount));
  const kategoriList = Object.entries(kategoriCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      percentage: maxKategoriVal > 0 ? Math.round((count / maxKategoriVal) * 100) : 0
    }));

  // Level Risiko Aggregation
  const levelCount = [
    { label: "Sangat Tinggi", count: data.filter(r => (r.besaranRisiko || 0) >= 20).length, color: "bg-red-500" },
    { label: "Tinggi", count: data.filter(r => (r.besaranRisiko || 0) >= 16 && (r.besaranRisiko || 0) < 20).length, color: "bg-orange-500" },
    { label: "Sedang", count: data.filter(r => (r.besaranRisiko || 0) >= 12 && (r.besaranRisiko || 0) < 16).length, color: "bg-yellow-400" },
    { label: "Rendah", count: data.filter(r => (r.besaranRisiko || 0) >= 6 && (r.besaranRisiko || 0) < 12).length, color: "bg-emerald-500" },
    { label: "Sangat Rendah", count: data.filter(r => (r.besaranRisiko || 0) >= 1 && (r.besaranRisiko || 0) < 6).length, color: "bg-blue-500" },
    { label: "Belum Dianalisis", count: data.filter(r => !(r.besaranRisiko && r.besaranRisiko > 0)).length, color: "bg-slate-300" },
  ];
  const maxLevelVal = Math.max(0, ...levelCount.map(l => l.count));

  const recentRisks = data.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Eksekutif</h2>
        <p className="text-slate-500 mt-1">Ringkasan profil dan mitigasi risiko {user?.unitName} Tahun {activeYear}.</p>
      </div>

      {/* Kartu Ringkasan (Top Metrics) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">Total Risiko</CardTitle>
            <Target className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{totalRisiko}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Teridentifikasi di Tahun {activeYear}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">Risiko Prioritas</CardTitle>
            <AlertOctagon className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{risikoPrioritas}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Nilai Sedang - Sangat Tinggi</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">Risiko Terkendali</CardTitle>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{risikoTerkendali}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Pengendalian sudah memadai</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">Total RTP</CardTitle>
            <ShieldCheck className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{totalRtp}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Tindakan mitigasi direncanakan</p>
          </CardContent>
        </Card>
      </div>

      {/* Area Konten Tambahan */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Grafik Sebaran Level Risiko */}
        <Card className="shadow-sm lg:col-span-1 border-t-4 border-t-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="mr-2 h-5 w-5 text-slate-600" /> Peta Level Risiko
            </CardTitle>
            <CardDescription>Distribusi berdasarkan hasil Analisis Risiko</CardDescription>
          </CardHeader>
          <CardContent>
            {totalRisiko > 0 ? (
              <div className="space-y-4 pt-2">
                {levelCount.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-slate-700">{item.label}</span>
                      <span className="text-slate-900 font-bold">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                      <div 
                        className={`h-2.5 rounded-full ${item.color} transition-all duration-1000 ease-out`}
                        style={{ width: maxLevelVal > 0 ? `${(item.count / maxLevelVal) * 100}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                Belum ada data risiko.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grafik Sebaran Kategori */}
        <Card className="shadow-sm lg:col-span-1 border-t-4 border-t-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="mr-2 h-5 w-5 text-slate-600" /> Kategori Risiko
            </CardTitle>
            <CardDescription>Klasifikasi risiko berdasarkan kategori</CardDescription>
          </CardHeader>
          <CardContent>
            {kategoriList.length > 0 ? (
              <div className="space-y-4 pt-2">
                {kategoriList.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-slate-700 truncate pr-2">{item.name}</span>
                      <span className="text-slate-900 font-bold">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                      <div 
                        className="bg-indigo-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                Belum ada data risiko.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daftar Risiko Terbaru */}
        <Card className="shadow-sm lg:col-span-1 border-t-4 border-t-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <AlertTriangle className="mr-2 h-5 w-5 text-slate-600" /> Risiko Terkini
            </CardTitle>
            <CardDescription>Data identifikasi risiko terbaru</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRisks.length > 0 ? (
              <div className="space-y-4 pt-2">
                {recentRisks.map((r) => {
                  const styleInfo = getRiskColorInfo(r.besaranRisiko || 0);
                  
                  return (
                    <div key={r.id} className="flex items-start justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-slate-800 line-clamp-2 leading-snug" title={r.pernyataanRisiko}>
                          {r.pernyataanRisiko}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center">
                          <span className="w-2 h-2 rounded-full bg-slate-300 mr-1.5 inline-block"></span>
                          {r.kategori || "Tanpa Kategori"}
                        </p>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <span className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${styleInfo.badge}`}>
                          {r.levelRisiko || "N/A"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                Belum ada data risiko.
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
