"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Calculator, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface IdentifikasiRisiko {
  id: string;
  tahun: string;
  unitName: string;
  pernyataanRisiko: string;
  sifatPenyebab: string;
  uraianDampak: string;
  pengendalianAda: string;
  sisaRisiko: string;
  // Fields for Analisis
  levelKemungkinan?: number;
  levelDampak?: number;
  besaranRisiko?: number;
  levelRisiko?: string;
}

const KEMUNGKINAN_OPTIONS = [
  { value: 1, label: "1 - Hampir Tidak Terjadi" },
  { value: 2, label: "2 - Jarang Terjadi" },
  { value: 3, label: "3 - Kadang Terjadi" },
  { value: 4, label: "4 - Sering Terjadi" },
  { value: 5, label: "5 - Hampir Pasti Terjadi" },
];

const DAMPAK_OPTIONS = [
  { value: 1, label: "1 - Tidak Signifikan" },
  { value: 2, label: "2 - Minor" },
  { value: 3, label: "3 - Moderat" },
  { value: 4, label: "4 - Signifikan" },
  { value: 5, label: "5 - Sangat Signifikan" },
];

const RISK_MATRIX: Record<number, Record<number, number>> = {
  5: { 1: 7, 2: 12, 3: 17, 4: 22, 5: 25 },
  4: { 1: 4, 2: 9, 3: 14, 4: 19, 5: 24 },
  3: { 1: 3, 2: 8, 3: 13, 4: 18, 5: 23 },
  2: { 1: 2, 2: 6, 3: 11, 4: 16, 5: 21 },
  1: { 1: 1, 2: 5, 3: 10, 4: 15, 5: 20 },
};

export function getRiskLevelInfo(score: number) {
  if (score >= 20) return { label: 'Sangat Tinggi', color: 'bg-red-500 text-white border-red-600' };
  if (score >= 16) return { label: 'Tinggi', color: 'bg-orange-500 text-white border-orange-600' };
  if (score >= 12) return { label: 'Sedang', color: 'bg-yellow-400 text-slate-800 border-yellow-500' };
  if (score >= 6) return { label: 'Rendah', color: 'bg-green-500 text-white border-green-600' };
  if (score >= 1) return { label: 'Sangat Rendah', color: 'bg-blue-500 text-white border-blue-600' };
  return { label: 'Belum Dianalisis', color: 'bg-slate-100 text-slate-500 border-slate-200' };
}

export default function AnalisisRisikoPage() {
  const { user, loading: authLoading, activeYear } = useAuth();
  
  const [risikoList, setRisikoList] = useState<IdentifikasiRisiko[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRisiko, setSelectedRisiko] = useState<IdentifikasiRisiko | null>(null);

  // Form State
  const [levelKemungkinan, setLevelKemungkinan] = useState<number | "">("");
  const [levelDampak, setLevelDampak] = useState<number | "">("");

  useEffect(() => {
    if (!authLoading && user) {
      fetchRisikoList();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, activeYear]);

  const fetchRisikoList = async () => {
    setIsListLoading(true);
    try {
      if (!user?.unitName) {
        setIsListLoading(false);
        return;
      }
      const safeYear = activeYear || new Date().getFullYear().toString();
      const q = query(
        collection(db, "mr_identifikasi"), 
        where("unitName", "==", user.unitName),
        where("tahun", "==", safeYear)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as IdentifikasiRisiko));
      setRisikoList(data);
    } catch (error: any) {
      console.error("Error fetching list:", error);
      toast.error(`Gagal memuat: ${error?.message || "Kesalahan tidak diketahui"}`);
    } finally {
      setIsListLoading(false);
    }
  };

  const handleEdit = (item: IdentifikasiRisiko) => {
    setSelectedRisiko(item);
    setLevelKemungkinan(item.levelKemungkinan || "");
    setLevelDampak(item.levelDampak || "");
    setIsFormVisible(true);
  };

  const calculateBesaran = (k: number | "", d: number | "") => {
    if (k === "" || d === "") return 0;
    return RISK_MATRIX[k][d];
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.unitName || !selectedRisiko) return toast.error("Data tidak valid.");
    if (levelKemungkinan === "" || levelDampak === "") return toast.error("Pilih level kemungkinan dan dampak.");

    const besaran = calculateBesaran(levelKemungkinan, levelDampak);
    const levelInfo = getRiskLevelInfo(besaran);

    setIsSaving(true);
    try {
      const docRef = doc(db, "mr_identifikasi", selectedRisiko.id);
      await setDoc(docRef, { 
        levelKemungkinan,
        levelDampak,
        besaranRisiko: besaran,
        levelRisiko: levelInfo.label,
        updatedAt: new Date().toISOString(), 
      }, { merge: true });
      
      import('@/lib/logger').then(({ logActivity }) => {
        logActivity(
          user, 
          "Edit", 
          "Analisis Risiko", 
          `Mengatur K=${levelKemungkinan}, D=${levelDampak} (Besaran: ${besaran}) pada risiko: ${selectedRisiko.pernyataanRisiko}`
        );
      });

      toast.success("Analisis Risiko berhasil disimpan!");
      setIsFormVisible(false);
      fetchRisikoList();
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error(`Gagal menyimpan: ${error?.message || "Kesalahan tidak diketahui"}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isListLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const currentBesaran = calculateBesaran(levelKemungkinan, levelDampak);
  const currentLevelInfo = getRiskLevelInfo(currentBesaran);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Analisis Risiko</h2>
          <p className="text-slate-500">Penilaian tingkat kemungkinan dan dampak untuk setiap risiko di Tahun {activeYear}.</p>
        </div>
      </div>

      {/* Tabel Daftar Risiko */}
      {!isFormVisible && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="min-w-[250px]">Pernyataan Risiko</TableHead>
                  <TableHead className="min-w-[150px]">Sisa Risiko</TableHead>
                  <TableHead className="text-center">Kemungkinan</TableHead>
                  <TableHead className="text-center">Dampak</TableHead>
                  <TableHead className="text-center">Besaran</TableHead>
                  <TableHead className="text-center min-w-[150px]">Level Risiko</TableHead>
                  <TableHead className="text-center w-[120px] sticky right-0 bg-slate-100 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)] z-10">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risikoList.length > 0 ? (
                  risikoList.map((item) => {
                    const levelInfo = getRiskLevelInfo(item.besaranRisiko || 0);
                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-800 max-w-[250px] truncate" title={item.pernyataanRisiko}>
                          {item.pernyataanRisiko}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 max-w-[150px] truncate" title={item.sisaRisiko}>
                          {item.sisaRisiko}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-700">
                          {item.levelKemungkinan || "-"}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-700">
                          {item.levelDampak || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.besaranRisiko ? (
                            <span className="font-bold text-lg">{item.besaranRisiko}</span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.besaranRisiko ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${levelInfo.color}`}>
                              {item.levelRisiko}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Belum dinilai</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center sticky right-0 bg-white/95 backdrop-blur-sm shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                            <Calculator className="h-4 w-4 mr-1.5" /> Analisis
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                      Belum ada data identifikasi risiko tahun {activeYear}. Silakan isi di menu Identifikasi Risiko.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Form Analisis Risiko */}
      {isFormVisible && selectedRisiko && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <Calculator className="mr-2 h-5 w-5 text-emerald-600" /> Form Analisis Risiko
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setIsFormVisible(false)} className="text-slate-500">
              <X className="h-4 w-4 mr-2" /> Batal & Tutup
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informasi Risiko (Read-only) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 space-y-4">
                <h4 className="font-semibold text-slate-800 flex items-center mb-4">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" /> Detail Risiko (Hanya Baca)
                </h4>
                
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">Pernyataan Risiko</Label>
                  <p className="font-medium text-slate-800 mt-1">{selectedRisiko.pernyataanRisiko}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label className="text-slate-500 text-xs uppercase tracking-wider">Uraian Dampak</Label>
                    <p className="text-sm text-slate-700 mt-1">{selectedRisiko.uraianDampak || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-xs uppercase tracking-wider">Pengendalian Saat Ini</Label>
                    <p className="text-sm text-slate-700 mt-1">{selectedRisiko.pengendalianAda || "-"}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="levelKemungkinan" className="text-base">Level Kemungkinan *</Label>
                    <Select 
                      value={levelKemungkinan.toString()} 
                      onValueChange={(val) => setLevelKemungkinan(parseInt(val))}
                    >
                      <SelectTrigger id="levelKemungkinan" className="h-12 bg-white">
                        <SelectValue placeholder="Pilih Kemungkinan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {KEMUNGKINAN_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="levelDampak" className="text-base">Level Dampak *</Label>
                    <Select 
                      value={levelDampak.toString()} 
                      onValueChange={(val) => setLevelDampak(parseInt(val))}
                    >
                      <SelectTrigger id="levelDampak" className="h-12 bg-white">
                        <SelectValue placeholder="Pilih Dampak..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DAMPAK_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSaving || levelKemungkinan === "" || levelDampak === ""} className="bg-emerald-600 hover:bg-emerald-700 px-8">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Simpan Analisis
                  </Button>
                </div>
              </form>
            </div>

            {/* Panel Hasil Kalkulasi (Real-time) */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl border-2 border-dashed border-slate-200 h-full flex flex-col justify-center items-center text-center space-y-6 min-h-[300px]">
                <h4 className="font-semibold text-slate-500 uppercase tracking-widest text-sm">Hasil Analisis</h4>
                
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Besaran Risiko</p>
                  <div className="text-7xl font-black text-slate-800">
                    {currentBesaran > 0 ? currentBesaran : "-"}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">
                    {levelKemungkinan && levelDampak ? `(${levelKemungkinan} × ${levelDampak} Matriks)` : "Menunggu input..."}
                  </p>
                </div>

                <div className="w-full h-px bg-slate-100"></div>

                <div className="space-y-2 w-full">
                  <p className="text-sm text-slate-500">Level Risiko</p>
                  <div className={`w-full py-3 rounded-lg border-2 font-bold text-lg transition-colors ${
                    currentBesaran > 0 ? currentLevelInfo.color : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    {currentBesaran > 0 ? currentLevelInfo.label : "Belum Tersedia"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}