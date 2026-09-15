"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Save, Target, ActivitySquare, ArrowRight, ShieldCheck, ShieldAlert, Send } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/logger";

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

interface EfektifitasData {
  targetKemungkinan: number;
  targetDampak: number;
  targetSkala: number;
  aktualKemungkinan: number;
  aktualDampak: number;
  aktualSkala: number;
  deviasi: number;
  status: string;
  langkahPerbaikan?: string;
}

interface FlattenedRTP {
  riskId: string;
  pernyataanRisiko: string;
  awalK: number;
  awalD: number;
  awalSkala: number;
  rtpId: string;
  rencana: string;
  efektifitas?: EfektifitasData;
  isTransferred?: boolean;
}

export default function EfektifitasRTPPage() {
  const { user, activeYear, loading: authLoading } = useAuth();
  
  const [flattenedRtps, setFlattenedRtps] = useState<FlattenedRTP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FlattenedRTP | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    targetK: "",
    targetD: "",
    aktualK: "",
    aktualD: "",
    langkahPerbaikan: ""
  });

  useEffect(() => {
    if (!authLoading && user && activeYear) {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, activeYear]);

  const fetchData = async () => {
    if (!user || !user.unitName) return;
    setIsLoading(true);
    
    try {
      const q = query(
        collection(db, "mr_identifikasi"), 
        where("unitName", "==", user.unitName),
        where("tahun", "==", activeYear)
      );
      const snap = await getDocs(q);
      
      const results: FlattenedRTP[] = [];
      
      snap.docs.forEach(docSnap => {
        const riskData = docSnap.data();
        
        // Hanya ambil risiko yang punya RTP dan sudah dianalisis (ada K dan D)
        if (riskData.rtpList && Array.isArray(riskData.rtpList) && riskData.levelKemungkinan && riskData.levelDampak) {
          riskData.rtpList.forEach((rtp: any) => {
            results.push({
              riskId: docSnap.id,
              pernyataanRisiko: riskData.pernyataanRisiko || "Tanpa Judul",
              awalK: Number(riskData.levelKemungkinan),
              awalD: Number(riskData.levelDampak),
              awalSkala: Number(riskData.besaranRisiko),
              rtpId: rtp.id,
              rencana: rtp.rencana || "Tanpa Nama RTP",
              efektifitas: rtp.efektifitas,
              isTransferred: riskData.isTransferred || false
            });
          });
        }
      });
      
      setFlattenedRtps(results);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      toast.error("Terjadi kesalahan saat memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (item: FlattenedRTP) => {
    setSelectedItem(item);
    setForm({
      targetK: item.efektifitas?.targetKemungkinan.toString() || "",
      targetD: item.efektifitas?.targetDampak.toString() || "",
      aktualK: item.efektifitas?.aktualKemungkinan.toString() || "",
      aktualD: item.efektifitas?.aktualDampak.toString() || "",
      langkahPerbaikan: item.efektifitas?.langkahPerbaikan || ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedItem) return;
    if (!form.targetK || !form.targetD || !form.aktualK || !form.aktualD) {
      toast.error("Mohon lengkapi semua isian Target dan Aktual.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const targetSkala = calculateScale(form.targetK, form.targetD);
      const aktualSkala = calculateScale(form.aktualK, form.aktualD);
      const deviasi = aktualSkala - targetSkala;
      
      // Jika deviasi <= 0 maka Efektif (Aktual lebih kecil/sama dengan target)
      // Jika deviasi > 0 maka Belum Efektif (Aktual lebih besar dari target)
      const status = deviasi <= 0 ? "RTP Efektif" : "RTP Belum Efektif";
      
      const newEfektifitas = {
        targetKemungkinan: Number(form.targetK),
        targetDampak: Number(form.targetD),
        targetSkala,
        aktualKemungkinan: Number(form.aktualK),
        aktualDampak: Number(form.aktualD),
        aktualSkala,
        deviasi,
        status,
        langkahPerbaikan: form.langkahPerbaikan,
        updatedAt: new Date().toISOString()
      };
      
      const docRef = doc(db, "mr_identifikasi", selectedItem.riskId);
      
      // Fetch ulang untuk update atomik sederhana
      const docSnap = await getDocs(query(collection(db, "mr_identifikasi"), where("__name__", "==", selectedItem.riskId)));
      if (docSnap.empty) throw new Error("Dokumen risiko tidak ditemukan");
      
      const riskData = docSnap.docs[0].data();
      const currentRtpList = riskData.rtpList || [];
      
      const updatedRtpList = currentRtpList.map((rtp: any) => {
        if (rtp.id === selectedItem.rtpId) {
          return {
            ...rtp,
            efektifitas: newEfektifitas
          };
        }
        return rtp;
      });
      
      await setDoc(docRef, { rtpList: updatedRtpList }, { merge: true });
      
      logActivity(
        user,
        "Edit",
        "Efektifitas RTP",
        `Update efektifitas RTP: ${selectedItem.rencana}. Status: ${status} (Deviasi: ${deviasi})`
      );
      
      toast.success("Efektifitas RTP berhasil disimpan!");
      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (error: any) {
      console.error("Gagal menyimpan efektifitas:", error);
      toast.error(`Gagal menyimpan: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getRiskLevelLabel = (score: number) => {
    if (score >= 20) return "Sangat Tinggi";
    if (score >= 16) return "Tinggi";
    if (score >= 12) return "Sedang";
    if (score >= 6) return "Rendah";
    if (score >= 1) return "Sangat Rendah";
    return "";
  };

  const handleTransfer = async (item: FlattenedRTP) => {
    try {
      const docSnap = await getDocs(query(collection(db, "mr_identifikasi"), where("__name__", "==", item.riskId)));
      if (docSnap.empty) throw new Error("Dokumen risiko tidak ditemukan");
      
      const riskData = docSnap.docs[0].data();
      const nextYear = String(Number(activeYear) + 1);
      
      const aktualK = item.efektifitas?.aktualKemungkinan || 0;
      const aktualD = item.efektifitas?.aktualDampak || 0;
      const aktualSkala = item.efektifitas?.aktualSkala || 0;
      const newLevelLabel = getRiskLevelLabel(aktualSkala);
      
      const newDocRef = doc(collection(db, "mr_identifikasi"));
      
      const newData = {
        ...riskData,
        id: newDocRef.id,
        tahun: nextYear,
        // Update Analisis Awal di tahun depan dengan nilai Aktual di tahun ini
        levelKemungkinan: aktualK,
        levelDampak: aktualD,
        besaranRisiko: aktualSkala,
        levelRisiko: newLevelLabel,
        
        rtpList: [], 
        keterjadianList: [],
        transferredFrom: item.riskId, 
        isTransferred: false, 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(newDocRef, newData);
      
      await setDoc(doc(db, "mr_identifikasi", item.riskId), { isTransferred: true }, { merge: true });
      
      logActivity(
        user,
        "Transfer",
        "Efektifitas RTP",
        `Mentransfer Risiko "${item.pernyataanRisiko}" ke tahun ${nextYear}`
      );
      
      toast.success(`Risiko berhasil ditransfer ke tahun ${nextYear}!`);
      fetchData();
    } catch (error: any) {
      console.error("Gagal transfer:", error);
      toast.error(`Gagal mentransfer risiko: ${error.message}`);
    }
  };

  // Kalkulasi sementara untuk preview di Modal
  const previewTargetSkala = calculateScale(form.targetK, form.targetD);
  const previewAktualSkala = calculateScale(form.aktualK, form.aktualD);
  const previewDeviasi = previewAktualSkala - previewTargetSkala;
  const previewStatus = (form.targetK && form.targetD && form.aktualK && form.aktualD) 
    ? (previewDeviasi <= 0 ? "RTP Efektif" : "RTP Belum Efektif") 
    : "-";

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Efektifitas RTP</h2>
          <p className="text-slate-500">
            Nilai dan evaluasi apakah Rencana Tindak Pengendalian (RTP) yang dijalankan efektif menurunkan skala risiko.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[15%]">Risiko</TableHead>
                <TableHead className="w-[15%]">RTP Dilaksanakan</TableHead>
                <TableHead className="w-[12%] text-center bg-slate-100/50">Risiko Awal (K / D / S)</TableHead>
                <TableHead className="w-[12%] text-center bg-blue-50/50">Target (K / D / S)</TableHead>
                <TableHead className="w-[12%] text-center bg-emerald-50/50">Aktual (K / D / S)</TableHead>
                <TableHead className="w-[10%] text-center">Deviasi & Status</TableHead>
                <TableHead className="w-[12%]">Langkah Perbaikan</TableHead>
                <TableHead className="w-[12%] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flattenedRtps.length > 0 ? (
                flattenedRtps.map((item) => (
                  <TableRow key={`${item.riskId}-${item.rtpId}`} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-700">
                      {item.pernyataanRisiko}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {item.rencana}
                    </TableCell>
                    <TableCell className="text-center bg-slate-50/30">
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-mono text-xs text-slate-500">
                          K:{item.awalK} / D:{item.awalD}
                        </span>
                        <span className="font-bold text-slate-700">{item.awalSkala}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center bg-blue-50/30">
                      {item.efektifitas ? (
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-mono text-xs text-blue-600/70">
                            K:{item.efektifitas.targetKemungkinan} / D:{item.efektifitas.targetDampak}
                          </span>
                          <span className="font-bold text-blue-700">{item.efektifitas.targetSkala}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center bg-emerald-50/30">
                      {item.efektifitas ? (
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-mono text-xs text-emerald-600/70">
                            K:{item.efektifitas.aktualKemungkinan} / D:{item.efektifitas.aktualDampak}
                          </span>
                          <span className="font-bold text-emerald-700">{item.efektifitas.aktualSkala}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.efektifitas ? (
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            item.efektifitas.deviasi <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            Deviasi: {item.efektifitas.deviasi > 0 ? '+' : ''}{item.efektifitas.deviasi}
                          </span>
                          <span className={`text-[11px] font-semibold flex items-center ${
                            item.efektifitas.deviasi <= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {item.efektifitas.deviasi <= 0 ? <ShieldCheck className="w-3 h-3 mr-1" /> : <ShieldAlert className="w-3 h-3 mr-1" />}
                            {item.efektifitas.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 whitespace-pre-wrap">
                      {item.efektifitas?.langkahPerbaikan || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col gap-2 items-end">
                        <Button 
                          size="sm" 
                          variant={item.efektifitas ? "outline" : "default"}
                          className={!item.efektifitas ? "bg-indigo-600 hover:bg-indigo-700 w-full" : "w-full"}
                          onClick={() => handleOpenModal(item)}
                        >
                          {item.efektifitas ? "Update Efektifitas" : "Input Target & Aktual"}
                        </Button>

                        {item.efektifitas?.status === "RTP Belum Efektif" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant={item.isTransferred ? "secondary" : "destructive"}
                                disabled={item.isTransferred}
                                className="w-full text-xs"
                              >
                                {item.isTransferred ? "Telah Ditransfer" : `Transfer ke ${Number(activeYear) + 1}`}
                                {!item.isTransferred && <Send className="w-3 h-3 ml-2" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Transfer Risiko?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Karena RTP belum efektif, risiko ini akan disalin ke daftar Identifikasi Risiko tahun <strong>{Number(activeYear) + 1}</strong> agar dapat dipantau dan dikendalikan kembali di tahun tersebut. Lanjutkan?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleTransfer(item)}
                                  className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                  Ya, Transfer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                    Belum ada RTP yang bisa dinilai efektifitasnya.<br/>
                    Pastikan Anda telah mengisi RTP dan Analisis Risiko Awal.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Input Efektifitas */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Input Efektifitas RTP</DialogTitle>
            <DialogDescription>
              Tentukan target penurunan dan realisasi aktual untuk RTP: <br/>
              <strong className="text-slate-800">{selectedItem?.rencana}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            
            {/* Info Risiko Awal */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
              <span className="text-sm text-slate-600 font-medium">Skala Risiko Awal (Sebelum RTP):</span>
              <div className="flex gap-4 text-sm font-semibold">
                <span className="text-slate-500">Kemungkinan: <span className="text-slate-800">{selectedItem?.awalK}</span></span>
                <span className="text-slate-500">Dampak: <span className="text-slate-800">{selectedItem?.awalD}</span></span>
                <span className="text-slate-500">Skala: <span className="text-indigo-600 text-lg">{selectedItem?.awalSkala}</span></span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box Target */}
              <div className="space-y-4 border border-blue-100 bg-blue-50/30 p-4 rounded-xl">
                <h3 className="font-semibold text-blue-800 flex items-center">
                  <Target className="w-4 h-4 mr-2" /> Target Penurunan
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Target Kemungkinan (1-5)</Label>
                    <Select value={form.targetK} onValueChange={(v) => setForm({...form, targetK: v})}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Target Dampak (1-5)</Label>
                    <Select value={form.targetD} onValueChange={(v) => setForm({...form, targetD: v})}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-2 flex justify-between items-center border-t border-blue-100">
                    <span className="text-sm font-medium text-slate-600">Skala Target:</span>
                    <span className="text-xl font-bold text-blue-700">{previewTargetSkala || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Box Aktual */}
              <div className="space-y-4 border border-emerald-100 bg-emerald-50/30 p-4 rounded-xl">
                <h3 className="font-semibold text-emerald-800 flex items-center">
                  <ActivitySquare className="w-4 h-4 mr-2" /> Realisasi Aktual
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Aktual Kemungkinan (1-5)</Label>
                    <Select value={form.aktualK} onValueChange={(v) => setForm({...form, aktualK: v})}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Aktual Dampak (1-5)</Label>
                    <Select value={form.aktualD} onValueChange={(v) => setForm({...form, aktualD: v})}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-2 flex justify-between items-center border-t border-emerald-100">
                    <span className="text-sm font-medium text-slate-600">Skala Aktual:</span>
                    <span className="text-xl font-bold text-emerald-700">{previewAktualSkala || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-medium text-slate-700">Langkah Perbaikan (Tindak Lanjut)</Label>
              <textarea 
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                placeholder="Jika deviasi positif (Belum Efektif), jelaskan langkah perbaikan apa yang akan dilakukan..."
                value={form.langkahPerbaikan}
                onChange={(e) => setForm({...form, langkahPerbaikan: e.target.value})}
              />
            </div>

            {/* Preview Status (Bawah) */}
            {(form.targetK && form.targetD && form.aktualK && form.aktualD) && (
              <div className={`p-4 rounded-lg flex items-center justify-between border ${
                previewDeviasi <= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-600">Deviasi (Aktual - Target)</span>
                  <span className={`text-2xl font-bold ${previewDeviasi <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {previewDeviasi > 0 ? '+' : ''}{previewDeviasi}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-slate-600">Status RTP</span>
                  <span className={`text-lg font-bold flex items-center ${previewDeviasi <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {previewDeviasi <= 0 ? <ShieldCheck className="w-5 h-5 mr-2" /> : <ShieldAlert className="w-5 h-5 mr-2" />}
                    {previewStatus}
                  </span>
                </div>
              </div>
            )}
            
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan Efektifitas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}