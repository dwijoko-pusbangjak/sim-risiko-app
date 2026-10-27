"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, MessageSquarePlus, CheckCircle, Send, CheckCircle2, Clock, AlertCircle, Edit3, Layers, FileCheck, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/logger";

interface CatatanKolomState {
  sasaran: string;
  pernyataanRisiko: string;
  penyebab: string;
  dampak: string;
  pengendalian: string;
  analisis: string;
  rtp: string;
  kesimpulan: string;
}

const INITIAL_CATATAN_KOLOM: CatatanKolomState = {
  sasaran: "",
  pernyataanRisiko: "",
  penyebab: "",
  dampak: "",
  pengendalian: "",
  analisis: "",
  rtp: "",
  kesimpulan: ""
};

export default function AuditRisikoPage() {
  const { user, activeYear, loading: authLoading } = useAuth();
  
  const [units, setUnits] = useState<any[]>([]);
  const [e1Units, setE1Units] = useState<any[]>([]);
  
  const [selectedE1, setSelectedE1] = useState<string>("all");
  const [selectedE2, setSelectedE2] = useState<string>("all");
  
  const [currentUnitName, setCurrentUnitName] = useState<string>("");
  const [risks, setRisks] = useState<any[]>([]);
  const [allUnitRisks, setAllUnitRisks] = useState<any[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  const [submission, setSubmission] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Riviu Modal (Per Risiko Detail per Kolom)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  const [catatanKolom, setCatatanKolom] = useState<CatatanKolomState>(INITIAL_CATATAN_KOLOM);
  const [isSaving, setIsSaving] = useState(false);

  // Kirim ke Unit Kerja Modal (Batch / Finalisasi)
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [catatanUmum, setCatatanUmum] = useState("");
  const [isSendingToUnit, setIsSendingToUnit] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    fetchUnits();
  }, [authLoading]);

  const fetchUnits = async () => {
    try {
      const snap = await getDocs(collection(db, "units"));
      const unitData: any[] = [];
      snap.forEach(d => unitData.push({ id: d.id, ...d.data() }));
      setUnits(unitData);
      setE1Units(unitData.filter(u => u.level === "eselon_1"));
    } catch (error) {
      console.error("Error fetching units", error);
    }
  };

  const handleFetchRisks = async () => {
    const safeYear = activeYear || new Date().getFullYear().toString();
    if (selectedE1 === "all") {
      toast.error("Pilih Unit Kerja Eselon 1 terlebih dahulu");
      return;
    }
    
    // Determine the target unit to fetch
    let targetUnitName = "";
    if (selectedE2 !== "all") {
      const u = units.find(x => x.id === selectedE2);
      targetUnitName = u?.name || "";
    } else {
      const u = units.find(x => x.id === selectedE1);
      targetUnitName = u?.name || "";
    }
    
    if (!targetUnitName) return;

    setCurrentUnitName(targetUnitName);
    setIsLoading(true);
    setShowArchive(false);

    try {
      // 1. Fetch submission status from audit_submissions
      const cleanDocId = `${targetUnitName.replace(/[^a-zA-Z0-9]/g, '_')}_${safeYear}`;
      let subData: any = null;
      const subSnap = await getDoc(doc(db, "audit_submissions", cleanDocId));
      if (subSnap.exists()) {
        subData = { id: subSnap.id, ...subData, ...subSnap.data() };
      } else {
        const legacyDocId = `${targetUnitName.replace(/\s+/g, '_')}_${safeYear}`;
        const legSnap = await getDoc(doc(db, "audit_submissions", legacyDocId));
        if (legSnap.exists()) {
          subData = { id: legSnap.id, ...legSnap.data() };
        } else {
          const qSub = query(
            collection(db, "audit_submissions"),
            where("unitName", "==", targetUnitName),
            where("tahun", "==", safeYear)
          );
          const snapSub = await getDocs(qSub);
          if (!snapSub.empty) {
            subData = { id: snapSub.docs[0].id, ...snapSub.docs[0].data() };
          }
        }
      }

      setSubmission(subData);
      setCatatanUmum(subData?.catatanUmum || "");

      // 2. Fetch mr_identifikasi
      const q = query(
        collection(db, "mr_identifikasi"), 
        where("unitName", "==", targetUnitName),
        where("tahun", "==", safeYear)
      );
      const snap = await getDocs(q);
      const rData: any[] = [];
      snap.forEach(d => {
        rData.push({ id: d.id, ...d.data() });
      });
      setAllUnitRisks(rData);

      // JIKA SUDAH DIKIRIM KE UNIT KERJA (status === 'reviewed'):
      // KOSONGKAN DATA KARENA SUDAH SELESAI DIAUDIT & TIDAK ADA LAGI YANG HARUS DIAUDIT!
      if (subData?.status === "reviewed") {
        setRisks([]);
      } else {
        setRisks(rData);
      }
    } catch (error) {
      console.error("Fetch risks error", error);
      toast.error("Gagal mengambil data peta risiko");
    } finally {
      setIsLoading(false);
    }
  };

  const isReadOnlyMode = showArchive || (submission?.status === "reviewed");

  const openRiviuModal = (risk: any) => {
    setSelectedRisk(risk);
    const cp = risk.catatanPerKolom || {};
    setCatatanKolom({
      sasaran: cp.sasaran || "",
      pernyataanRisiko: cp.pernyataanRisiko || "",
      penyebab: cp.penyebab || "",
      dampak: cp.dampak || "",
      pengendalian: cp.pengendalian || "",
      analisis: cp.analisis || "",
      rtp: cp.rtp || "",
      kesimpulan: cp.kesimpulan || (!risk.catatanPerKolom && risk.catatanAuditor ? risk.catatanAuditor : "")
    });
    setIsModalOpen(true);
  };

  const handleSaveRiviu = async () => {
    if (!selectedRisk) return;
    if (isReadOnlyMode) {
      toast.error("Mode hanya baca: data riwayat yang sudah dikirim ke unit kerja tidak dapat diubah lagi.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Menyimpan catatan auditor...");
    try {
      // 1. Susun catatanAuditor gabungan untuk backward compatibility
      const summaryNotes: string[] = [];
      if (catatanKolom.sasaran?.trim()) summaryNotes.push(`• [Sasaran & Indikator]: ${catatanKolom.sasaran.trim()}`);
      if (catatanKolom.pernyataanRisiko?.trim()) summaryNotes.push(`• [Pernyataan Risiko]: ${catatanKolom.pernyataanRisiko.trim()}`);
      if (catatanKolom.penyebab?.trim()) summaryNotes.push(`• [Penyebab]: ${catatanKolom.penyebab.trim()}`);
      if (catatanKolom.dampak?.trim()) summaryNotes.push(`• [Dampak]: ${catatanKolom.dampak.trim()}`);
      if (catatanKolom.pengendalian?.trim()) summaryNotes.push(`• [Pengendalian]: ${catatanKolom.pengendalian.trim()}`);
      if (catatanKolom.analisis?.trim()) summaryNotes.push(`• [Analisis]: ${catatanKolom.analisis.trim()}`);
      if (catatanKolom.rtp?.trim()) summaryNotes.push(`• [RTP]: ${catatanKolom.rtp.trim()}`);
      if (catatanKolom.kesimpulan?.trim()) summaryNotes.push(`• [Kesimpulan]: ${catatanKolom.kesimpulan.trim()}`);

      const combinedCatatan = summaryNotes.join("\n\n");

      await updateDoc(doc(db, "mr_identifikasi", selectedRisk.id), {
        catatanPerKolom: catatanKolom,
        catatanAuditor: combinedCatatan,
        catatanUpdatedAt: new Date().toISOString()
      });
      
      // Update local state (both active risks and archive)
      const updateFn = (prev: any[]) => prev.map(r => r.id === selectedRisk.id ? { 
        ...r, 
        catatanPerKolom: catatanKolom, 
        catatanAuditor: combinedCatatan,
        catatanUpdatedAt: new Date().toISOString()
      } : r);

      setRisks(updateFn);
      setAllUnitRisks(updateFn);
      
      logActivity(user, "Audit", "Peta Risiko", `Memberikan catatan riviu detail pada risiko: ${selectedRisk.pernyataanRisiko}`);
      toast.success("Catatan riviu berhasil disimpan!", { id: toastId });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Save riviu error", error);
      toast.error("Gagal menyimpan catatan.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendToUnit = async () => {
    if (!currentUnitName) return;
    const safeYear = activeYear || new Date().getFullYear().toString();
    setIsSendingToUnit(true);
    const toastId = toast.loading("Mengirim hasil riviu ke unit kerja...");

    try {
      const cleanUnit = currentUnitName.trim();
      const currentList = allUnitRisks.length > 0 ? allUnitRisks : risks;
      const notesCount = currentList.filter(r => r.catatanAuditor && r.catatanAuditor.trim() !== "").length;

      const submissionData = {
        unitName: cleanUnit,
        tahun: safeYear,
        status: "reviewed",
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.name || user?.email || "Auditor APIP",
        catatanUmum: catatanUmum.trim(),
        notesCount: notesCount,
        isPublishedToInbox: true
      };

      // 1. Simpan ke audit_submissions
      const cleanDocId = `${cleanUnit.replace(/[^a-zA-Z0-9]/g, '_')}_${safeYear}`;
      await setDoc(doc(db, "audit_submissions", cleanDocId), submissionData, { merge: true });

      const legacyDocId = `${cleanUnit.replace(/\s+/g, '_')}_${safeYear}`;
      if (legacyDocId !== cleanDocId) {
        try {
          await setDoc(doc(db, "audit_submissions", legacyDocId), submissionData, { merge: true });
        } catch (e) {}
      }

      // 2. Update flag pada setiap dokumen risiko secara aman
      for (const r of currentList) {
        try {
          await updateDoc(doc(db, "mr_identifikasi", r.id), {
            catatanPublished: true,
            auditStatus: "reviewed",
            catatanUmum: catatanUmum.trim(),
            auditorName: user?.name || user?.email || "Auditor APIP",
            publishedAt: new Date().toISOString()
          });
        } catch (err) {
          console.warn("Update risk doc failed for", r.id, err);
        }
      }

      setSubmission(submissionData);
      
      // KOSONGKAN DATA PADA HALAMAN AUDIT KARENA SUDAH TIDAK ADA LAGI YANG HARUS DIAUDIT!
      setRisks([]);
      setShowArchive(false);
      setIsSendModalOpen(false);

      logActivity(user, "Kirim", "Audit", `Mengirim hasil riviu audit ke unit kerja: ${cleanUnit}`);
      toast.success("Hasil riviu berhasil dikirim ke unit kerja! Data telah dikosongkan karena sudah tidak ada lagi yang harus diaudit.", { id: toastId });
    } catch (error: any) {
      console.error("Gagal kirim ke unit", error);
      toast.error("Gagal mengirim hasil riviu: " + (error?.message || "Kesalahan tidak diketahui"), { id: toastId });
    } finally {
      setIsSendingToUnit(false);
    }
  };

  if (authLoading || (user && user.role !== "auditor" && user.role !== "admin")) {
    return <div className="p-8 text-center text-slate-500">Memuat atau Anda tidak memiliki akses...</div>;
  }

  // Derived E2 list based on selected E1
  const availableE2 = units.filter(u => u.level === "eselon_2" && u.parentId === selectedE1);
  const displayList = allUnitRisks.length > 0 ? allUnitRisks : risks;
  const notesCount = displayList.filter(r => r.catatanAuditor && r.catatanAuditor.trim() !== "").length;

  // Daftar Definisi Kolom untuk Riviu Detail
  const COLUMN_SECTIONS = [
    {
      id: "sasaran",
      title: "1. Sasaran & Indikator Kinerja",
      desc: "Kesesuaian sasaran strategis/program/kegiatan dan indikator kinerja",
      renderValue: () => (
        <div className="space-y-1">
          <div><span className="font-semibold text-slate-600">Sasaran Terkait:</span> {selectedRisk?.sasaranTerkait || "-"}</div>
          <div><span className="font-semibold text-slate-600">Indikator Kinerja:</span> {selectedRisk?.indikatorKinerja || "-"}</div>
        </div>
      ),
      value: catatanKolom.sasaran,
      setValue: (val: string) => setCatatanKolom(prev => ({ ...prev, sasaran: val })),
      placeholder: "Tuliskan catatan evaluasi sasaran atau indikator kinerja..."
    },
    {
      id: "pernyataanRisiko",
      title: "2. Pernyataan Risiko & Kategori",
      desc: "Ketepatan rumusan pernyataan risiko (peristiwa yang berpotensi menghambat) dan kategorisasinya",
      renderValue: () => (
        <div className="space-y-1">
          <div><span className="font-semibold text-slate-600">Pernyataan Risiko:</span> <strong className="text-slate-900">{selectedRisk?.pernyataanRisiko || "-"}</strong></div>
          <div><span className="font-semibold text-slate-600">Kategori:</span> {selectedRisk?.kategori || "-"}</div>
          <div><span className="font-semibold text-slate-600">Permasalahan:</span> {selectedRisk?.permasalahan || "-"}</div>
        </div>
      ),
      value: catatanKolom.pernyataanRisiko,
      setValue: (val: string) => setCatatanKolom(prev => ({ ...prev, pernyataanRisiko: val })),
      placeholder: "Tuliskan catatan evaluasi rumusan pernyataan risiko atau kategori..."
    },
    {
      id: "penyebab",
      title: "3. Penyebab Risiko",
      desc: "Ketepatan identifikasi akar penyebab, sumber (Internal/Eksternal), dan sifat pengendalian (C/UC)",
      renderValue: () => (
        <div className="space-y-1">
          <div><span className="font-semibold text-slate-600">Uraian Penyebab:</span> {selectedRisk?.uraianPenyebab || "-"}</div>
          <div className="flex flex-wrap gap-4 text-xs mt-1">
            <span><span className="font-semibold text-slate-600">Sumber:</span> {selectedRisk?.sumberPenyebab || "-"}</span>
            <span><span className="font-semibold text-slate-600">Sifat Pengendalian:</span> {selectedRisk?.sifatPenyebab || "-"}</span>
          </div>
        </div>
      ),
      value: catatanKolom.penyebab,
      setValue: (val: string) => setCatatanKolom(prev => ({ ...prev, penyebab: val })),
      placeholder: "Tuliskan catatan evaluasi akar penyebab, sumber, atau sifat pengendalian..."
    },
    {
      id: "dampak",
      title: "4. Dampak Risiko & Pihak Terdampak",
      desc: "Ketepatan deskripsi konsekuensi/dampak negatif dan identifikasi pihak terdampak",
      renderValue: () => (
        <div className="space-y-1">
          <div><span className="font-semibold text-slate-600">Uraian Dampak:</span> {selectedRisk?.uraianDampak || "-"}</div>
          <div><span className="font-semibold text-slate-600">Pihak Terdampak:</span> {selectedRisk?.pihakTerdampak || "-"}</div>
        </div>
      ),
      value: catatanKolom.dampak,
      setValue: (val: string) => setCatatanKolom(prev => ({ ...prev, dampak: val })),
      placeholder: "Tuliskan catatan evaluasi uraian dampak atau pihak yang terdampak..."
    },
    {
      id: "pengendalian",
      title: "5. Pengendalian yang Ada & Sisa Risiko",
      desc: "Efektivitas sistem pengendalian yang sudah ada, kecukupan penilaian, serta sisa risiko",
      renderValue: () => (
        <div className="space-y-1">
          <div><span className="font-semibold text-slate-600">Pengendalian Saat Ini:</span> {selectedRisk?.pengendalianAda || "-"}</div>
          <div className="flex flex-wrap gap-4 text-xs mt-1">
            <span><span className="font-semibold text-slate-600">Penilaian:</span> {selectedRisk?.penilaianPengendalian || "-"}</span>
            <span><span className="font-semibold text-slate-600">Sisa Risiko:</span> {selectedRisk?.sisaRisiko || "-"}</span>
          </div>
        </div>
      ),
      value: catatanKolom.pengendalian,
      setValue: (val: string) => setCatatanKolom(prev => ({ ...prev, pengendalian: val })),
      placeholder: "Tuliskan catatan evaluasi sistem pengendalian yang ada atau sisa risiko..."
    },
    {
      id: "analisis",
      title: "6. Analisis Risiko (Kemungkinan & Dampak)",
      desc: "Validitas penilaian skala kemungkinan (K), dampak (D), besaran skor, dan penetapan level risiko",
      renderValue: () => (
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-slate-200/70 px-2 py-1 rounded text-xs">Kemungkinan (K): <strong>{selectedRisk?.levelKemungkinan || "-"}</strong></span>
          <span className="bg-slate-200/70 px-2 py-1 rounded text-xs">Dampak (D): <strong>{selectedRisk?.levelDampak || "-"}</strong></span>
          <span className="bg-slate-200/70 px-2 py-1 rounded text-xs">Skor Besaran: <strong>{selectedRisk?.besaranRisiko || "-"}</strong></span>
          <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded text-xs">Level: {selectedRisk?.levelRisiko || "-"}</span>
        </div>
      ),
      value: catatanKolom.analisis,
      setValue: (val: string) => setCatatanKolom(prev => ({ ...prev, analisis: val })),
      placeholder: "Tuliskan catatan evaluasi penilaian probabilitas, dampak, atau level risiko..."
    },
    {
      id: "rtp",
      title: "7. Rencana Tindak Pengendalian (RTP)",
      desc: "Kelayakan rencana mitigasi, kejelasan penanggung jawab, serta realitas target waktu pelaksanaan",
      renderValue: () => (
        selectedRisk?.rtpList && selectedRisk.rtpList.length > 0 ? (
          <div className="space-y-1.5">
            {selectedRisk.rtpList.map((x: any, i: number) => (
              <div key={i} className="text-xs bg-white p-2 rounded border border-slate-200">
                <div className="font-semibold text-slate-800">• {x.rencana}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">PJ: <strong>{x.penanggungjawab || "-"}</strong> | Target: <strong>{x.targetWaktu || "-"}</strong></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">Belum ada RTP yang diinput pada risiko ini.</div>
        )
      ),
      value: catatanKolom.rtp,
      setValue: (val: string) => setCatatanKolom(prev => ({ ...prev, rtp: val })),
      placeholder: "Tuliskan catatan evaluasi rencana tindak pengendalian (RTP), PJ, atau target waktu..."
    },
    {
      id: "kesimpulan",
      title: "8. Kesimpulan & Rekomendasi Tambahan",
      desc: "Kesimpulan umum atau arahan strategis auditor untuk risiko ini",
      renderValue: () => null,
      value: catatanKolom.kesimpulan,
      setValue: (val: string) => setCatatanKolom(prev => ({ ...prev, kesimpulan: val })),
      placeholder: "Tuliskan arahan umum atau kesimpulan untuk risiko ini..."
    }
  ];

  const isReviewed = submission?.status === "reviewed";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Audit Risiko</h2>
        <p className="text-slate-500">Riviu detail setiap kolom pada Peta Risiko dan RTP unit kerja, lalu kirimkan hasil evaluasi ke unit kerja.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Unit Eselon 1</Label>
            <Select value={selectedE1} onValueChange={(v) => { setSelectedE1(v); setSelectedE2("all"); }}>
              <SelectTrigger>
                {selectedE1 !== "all" ? 
                  <span className="truncate">{e1Units.find(u => u.id === selectedE1)?.name || "Unit tidak ditemukan"}</span> : 
                  <span className="text-slate-500">Pilih Eselon 1</span>
                }
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">-- Pilih Unit Eselon 1 --</SelectItem>
                {e1Units.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Unit Eselon 2 (Opsional)</Label>
            <Select value={selectedE2} onValueChange={setSelectedE2} disabled={selectedE1 === "all"}>
              <SelectTrigger>
                {selectedE2 !== "all" ? 
                  <span className="truncate">{availableE2.find(u => u.id === selectedE2)?.name || "Unit tidak ditemukan"}</span> : 
                  (selectedE1 !== "all" ? 
                    <span className="truncate">[{e1Units.find(u => u.id === selectedE1)?.name}] (Eselon 1 itu sendiri)</span> : 
                    <span className="text-slate-500">Pilih Unit Terkait</span>
                  )
                }
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {selectedE1 !== "all" 
                    ? `[${e1Units.find(u => u.id === selectedE1)?.name}] (Eselon 1 itu sendiri)` 
                    : "-- Pilih --"}
                </SelectItem>
                {availableE2.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button onClick={handleFetchRisks} disabled={isLoading || selectedE1 === "all"} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Tampilkan Peta Risiko
            </Button>
          </div>
        </div>
      </div>

      {currentUnitName && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Tahun {activeYear || new Date().getFullYear().toString()}
              </span>
              <h3 className="font-bold text-lg text-slate-800">{currentUnitName}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              {isReviewed && !showArchive ? (
                <>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Antrean Audit: <strong>Selesai (0 Risiko)</strong>
                  </span>
                  <span>•</span>
                  <span>Total Risiko Unit: <strong className="text-slate-800">{allUnitRisks.length}</strong></span>
                </>
              ) : (
                <>
                  <span>Risiko Ditampilkan: <strong className="text-slate-800">{risks.length}</strong></span>
                  <span>•</span>
                  <span>Diberi Catatan: <strong className="text-pink-600">{notesCount}</strong></span>
                </>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                Status Dokumen: 
                {isReviewed ? (
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Telah Dikirim ke Unit
                  </span>
                ) : submission?.status === "submitted" ? (
                  <span className="inline-flex items-center text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Menunggu Riviu Auditor
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    Belum Dikirim Unit
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isReviewed ? (
              <Button 
                variant="outline"
                onClick={() => {
                  if (showArchive) {
                    setShowArchive(false);
                    setRisks([]);
                  } else {
                    setShowArchive(true);
                    setRisks(allUnitRisks);
                  }
                }}
                className="text-slate-700 border-slate-300 hover:bg-slate-50 text-xs"
              >
                {showArchive ? <EyeOff className="w-4 h-4 mr-1.5" /> : <Eye className="w-4 h-4 mr-1.5" />}
                {showArchive ? "Tutup Riwayat" : "Lihat Riwayat Terkirim"}
              </Button>
            ) : (
              <Button 
                onClick={() => setIsSendModalOpen(true)}
                disabled={isLoading || risks.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium"
                size="default"
              >
                <Send className="w-4 h-4 mr-2" />
                Kirim ke Unit Kerja
              </Button>
            )}
          </div>
        </div>
      )}

      {/* KONDISI 1: SUDAH DIKIRIM KE UNIT KERJA & DATA DIKOSONGKAN SESUAI PERMINTAAN */}
      {currentUnitName && isReviewed && !showArchive && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-10 text-center space-y-4 shadow-2xs animate-in fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="max-w-lg mx-auto space-y-2">
            <h3 className="text-xl font-bold text-emerald-950">
              Peta Risiko Telah Selesai Diaudit & Dikirim
            </h3>
            <p className="text-sm text-emerald-800">
              Seluruh catatan riviu untuk <strong>{currentUnitName}</strong> Tahun <strong>{activeYear || new Date().getFullYear().toString()}</strong> telah berhasil dikirimkan ke unit kerja.
            </p>
            <div className="text-xs text-emerald-700 bg-white/80 py-2.5 px-4 rounded-lg border border-emerald-200/60 inline-block font-medium">
              Saat ini <strong>tidak ada lagi data yang harus diaudit</strong> pada unit kerja ini. Menunggu proses perbaikan dari unit kerja.
            </div>
            {submission?.reviewedAt && (
              <p className="text-xs text-slate-500 pt-1">
                Dikirim pada: {new Date(submission.reviewedAt).toLocaleString("id-ID")} oleh {submission.reviewedBy || "Auditor APIP"}
              </p>
            )}
          </div>
          {allUnitRisks.length > 0 && (
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setShowArchive(true); setRisks(allUnitRisks); }}
                className="text-emerald-800 border-emerald-300 hover:bg-emerald-100/60 text-xs"
              >
                <FileCheck className="w-4 h-4 mr-1.5" />
                Lihat Riwayat Dokumen yang Telah Dikirim ({allUnitRisks.length} Risiko)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* KONDISI 2: DATA RISIKO DITAMPILKAN (AKTIF AUDIT ATAU MODE ARSIP) */}
      {risks.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden animate-in fade-in">
          {showArchive && (
            <div className="bg-amber-50 border-b border-amber-200 p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <span className="font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Mode Arsip / Riwayat (Hanya Baca)
                </span>
                <span>Dokumen ini telah selesai diaudit dan dikirim ke unit kerja. Data hanya dapat dilihat dan tidak dapat diedit lagi.</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setShowArchive(false); setRisks([]); }}
                className="text-amber-800 hover:bg-amber-100 text-xs h-7 self-start sm:self-auto font-medium"
              >
                Tutup Riwayat & Kosongkan Data
              </Button>
            </div>
          )}

          <div className="p-4 bg-slate-50 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="font-semibold text-slate-700 text-sm block">Daftar Risiko & Rencana Tindak Pengendalian (RTP)</span>
              <span className="text-xs text-slate-500">
                {isReadOnlyMode 
                  ? "Mode Riwayat: Klik 'Lihat Detail' untuk melihat catatan yang telah dikirim ke unit kerja"
                  : "Klik tombol 'Riviu Detail' untuk memeriksa dan memberi catatan spesifik per kolom"
                }
              </span>
            </div>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
              {risks.length} Risiko Teridentifikasi
            </span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/70">
                <TableRow>
                  <TableHead className="w-[18%]">Sasaran / IKU</TableHead>
                  <TableHead className="w-[22%]">Pernyataan Risiko & Sebab</TableHead>
                  <TableHead className="w-[10%] text-center">Level Risiko</TableHead>
                  <TableHead className="w-[22%]">Rencana Tindak Pengendalian (RTP)</TableHead>
                  <TableHead className="w-[18%] text-center">Catatan Auditor (Per Kolom)</TableHead>
                  <TableHead className="w-[10%] text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.map((r) => {
                  const cp = r.catatanPerKolom;
                  const activeColsCount = cp ? Object.values(cp).filter((v: any) => v && v.trim() !== "").length : 0;

                  return (
                    <TableRow key={r.id} className="hover:bg-slate-50/70">
                      <TableCell className="align-top">
                        <div className="font-semibold text-slate-800 line-clamp-3">{r.sasaranTerkait || "-"}</div>
                        <div className="text-xs text-slate-500 mt-1 line-clamp-3">{r.indikatorKinerja || "-"}</div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="font-medium text-slate-900">{r.pernyataanRisiko}</div>
                        {r.uraianPenyebab && (
                          <div className="text-xs text-slate-500 mt-1.5 bg-slate-50 p-1.5 rounded border border-slate-100">
                            <span className="font-semibold text-slate-600">Penyebab: </span>
                            {r.uraianPenyebab}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-center">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold inline-block ${
                          r.levelRisiko === 'Sangat Tinggi' ? 'bg-red-100 text-red-800' :
                          r.levelRisiko === 'Tinggi' ? 'bg-orange-100 text-orange-800' :
                          r.levelRisiko === 'Sedang' ? 'bg-yellow-100 text-yellow-800' :
                          r.levelRisiko === 'Rendah' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {r.levelRisiko || "-"}
                        </span>
                        {r.besaranRisiko ? (
                          <div className="text-[11px] text-slate-400 mt-1 font-mono">Skor: {r.besaranRisiko}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="align-top">
                        {r.rtpList && r.rtpList.length > 0 ? (
                          <div className="space-y-2">
                            {r.rtpList.map((rtp: any, idx: number) => (
                              <div key={idx} className="text-xs bg-slate-50 p-2 rounded border border-slate-100">
                                <div className="font-medium text-slate-800">• {rtp.rencana}</div>
                                {(rtp.penanggungjawab || rtp.targetWaktu) && (
                                  <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-2">
                                    {rtp.penanggungjawab && <span>PJ: <strong>{rtp.penanggungjawab}</strong></span>}
                                    {rtp.targetWaktu && <span>Target: <strong>{rtp.targetWaktu}</strong></span>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Tidak ada RTP</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-xs">
                        {activeColsCount > 0 ? (
                          <div className="space-y-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-pink-100 text-pink-800">
                              {activeColsCount} Kolom Diberi Catatan
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {cp?.sasaran?.trim() && <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded">Sasaran</span>}
                              {cp?.pernyataanRisiko?.trim() && <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded">Risiko</span>}
                              {cp?.penyebab?.trim() && <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded">Penyebab</span>}
                              {cp?.dampak?.trim() && <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded">Dampak</span>}
                              {cp?.pengendalian?.trim() && <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded">Pengendalian</span>}
                              {cp?.analisis?.trim() && <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded">Analisis</span>}
                              {cp?.rtp?.trim() && <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded">RTP</span>}
                              {cp?.kesimpulan?.trim() && <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded">Kesimpulan</span>}
                            </div>
                            <div className="p-2 bg-pink-50/70 border border-pink-200 rounded text-pink-900 line-clamp-2 text-[11px]">
                              {r.catatanAuditor}
                            </div>
                          </div>
                        ) : r.catatanAuditor ? (
                          <div className="p-2 bg-pink-50 border border-pink-200 rounded text-pink-900 line-clamp-3">
                            {r.catatanAuditor}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic block text-center">-</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-center">
                        <Button 
                          onClick={() => openRiviuModal(r)} 
                          variant="outline" 
                          size="sm" 
                          className={isReadOnlyMode 
                            ? "border-slate-300 text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                            : "border-pink-200 text-pink-700 hover:bg-pink-50 hover:text-pink-800 whitespace-nowrap"
                          }
                        >
                          {isReadOnlyMode ? (
                            <>
                              <Eye className="w-3.5 h-3.5 mr-1 text-slate-600" />
                              Lihat Detail
                            </>
                          ) : activeColsCount > 0 || r.catatanAuditor ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              Riviu Detail
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-3.5 h-3.5 mr-1" />
                              Riviu Detail
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* KONDISI 3: BELUM ADA DATA ATAU UNIT KERJA BELUM MENGAJUKAN */}
      {currentUnitName && !isReviewed && risks.length === 0 && !isLoading && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-8 text-center space-y-3">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-amber-900">Tidak Ada Antrean Risiko untuk Diaudit</h3>
          <p className="text-sm text-amber-700 max-w-md mx-auto">
            Unit kerja ini belum memiliki data risiko teridentifikasi atau belum mengirimkan Peta Risiko untuk Tahun {activeYear || new Date().getFullYear().toString()}.
          </p>
        </div>
      )}
      
      {/* Modal Riviu Catatan Per Kolom Risiko (Dua Mode: Edit Aktif atau Hanya Baca / Riwayat) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-3 border-b bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  {isReadOnlyMode ? (
                    <>
                      <Lock className="w-5 h-5 text-amber-600" />
                      Detail Riviu Risiko (Mode Hanya Baca / Riwayat)
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-5 h-5 text-pink-600" />
                      Riviu Detail per Kolom Risiko
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                  {isReadOnlyMode 
                    ? "Dokumen ini telah selesai diaudit dan terkirim ke unit kerja. Data hanya dapat dilihat dan tidak dapat diubah lagi."
                    : "Berikan catatan spesifik pada masing-masing kolom agar perbaikan oleh unit kerja lebih terarah."
                  }
                </DialogDescription>
              </div>
            </div>
            {selectedRisk && (
              <div className="mt-3 p-2.5 bg-white border border-slate-200 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                <div>
                  <span className="text-slate-500 font-medium">Risiko: </span>
                  <span className="font-bold text-slate-800">{selectedRisk.pernyataanRisiko}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  selectedRisk.levelRisiko === 'Sangat Tinggi' ? 'bg-red-100 text-red-800' :
                  selectedRisk.levelRisiko === 'Tinggi' ? 'bg-orange-100 text-orange-800' :
                  selectedRisk.levelRisiko === 'Sedang' ? 'bg-yellow-100 text-yellow-800' :
                  selectedRisk.levelRisiko === 'Rendah' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  Level: {selectedRisk.levelRisiko || "-"}
                </span>
              </div>
            )}
          </DialogHeader>

          {/* Body Scrollable List of Columns */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {COLUMN_SECTIONS.map((sec) => {
              const isFilled = !!sec.value && sec.value.trim() !== "";

              return (
                <div 
                  key={sec.id} 
                  id={`sec-${sec.id}`}
                  className={`border rounded-xl p-4 transition-all ${
                    isFilled 
                      ? "border-pink-300 bg-pink-50/20 shadow-xs" 
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        {sec.title}
                        {isFilled && (
                          <span className="text-[10px] bg-pink-100 text-pink-700 font-bold px-2 py-0.5 rounded-full border border-pink-200">
                            ✓ Diberi Catatan
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500">{sec.desc}</p>
                    </div>
                  </div>

                  {/* Nilai data dari unit kerja */}
                  {sec.renderValue() && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 mb-3 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Data Isian Unit Kerja:
                      </span>
                      {sec.renderValue()}
                    </div>
                  )}

                  {/* Input Catatan Auditor ATAU Tampilan Hanya Baca */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`input-${sec.id}`} className="text-xs font-semibold text-slate-700">
                      Catatan Riviu Auditor untuk Kolom Ini:
                    </Label>
                    {isReadOnlyMode ? (
                      // MODE HANYA BACA (RIWAYAT TERKIRIM) - TIDAK BISA DIEDIT LAGI
                      isFilled ? (
                        <div className="p-3 bg-pink-50/70 border border-pink-200 rounded-lg text-xs text-pink-950 font-medium whitespace-pre-wrap leading-relaxed">
                          {sec.value}
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-400 italic">
                          Tidak ada catatan untuk kolom ini.
                        </div>
                      )
                    ) : (
                      // MODE EDIT AKTIF (SEBELUM DIKIRIM)
                      <Textarea 
                        id={`input-${sec.id}`}
                        value={sec.value}
                        onChange={(e) => sec.setValue(e.target.value)}
                        placeholder={sec.placeholder}
                        className="text-xs min-h-[75px] bg-white border-slate-300 focus:border-pink-500"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="p-4 border-t bg-slate-50/80 flex justify-between items-center">
            <span className="text-xs text-slate-500">
              {isReadOnlyMode ? (
                <span className="text-amber-800 font-medium flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  Mode Hanya Baca (Tidak Dapat Diedit)
                </span>
              ) : (
                <>
                  Total kolom diberi catatan: <strong className="text-pink-600">
                    {Object.values(catatanKolom).filter(v => v && v.trim() !== "").length} dari {COLUMN_SECTIONS.length}
                  </strong>
                </>
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Tutup
              </Button>
              {!isReadOnlyMode && (
                <Button onClick={handleSaveRiviu} disabled={isSaving} className="bg-pink-600 hover:bg-pink-700 text-white">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Simpan Catatan
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Kirim Hasil Riviu ke Unit Kerja */}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-800">
              <Send className="w-5 h-5 text-emerald-600" />
              Kirim Hasil Riviu ke Unit Kerja
            </DialogTitle>
            <DialogDescription>
              Setelah dikirim, seluruh hasil evaluasi akan masuk ke Inbox unit kerja dan data antrean audit di halaman ini akan otomatis selesai/dikosongkan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-lg text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-emerald-800 font-medium">Unit Kerja Tujuan:</span>
                <span className="font-bold text-emerald-950 text-right">{currentUnitName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800 font-medium">Tahun Anggaran:</span>
                <span className="font-bold text-emerald-950">{activeYear || new Date().getFullYear().toString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800 font-medium">Total Risiko Diberi Catatan:</span>
                <span className="font-bold text-pink-700">{notesCount} dari {displayList.length} Risiko</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatan-umum">Catatan Umum / Rekomendasi Keseluruhan (Opsional)</Label>
              <Textarea 
                id="catatan-umum"
                value={catatanUmum}
                onChange={(e) => setCatatanUmum(e.target.value)}
                placeholder="Contoh: Secara umum rumusan risiko sudah baik, mohon perbaiki rumusan penyebab risiko nomor 2 dan lengkapi target waktu pada RTP..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendModalOpen(false)}>Batal</Button>
            <Button 
              onClick={handleSendToUnit} 
              disabled={isSendingToUnit} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSendingToUnit ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Kirim Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
