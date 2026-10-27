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
import { Loader2, Search, MessageSquarePlus, CheckCircle, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/logger";

export default function AuditRisikoPage() {
  const { user, activeYear, loading: authLoading } = useAuth();
  
  const [units, setUnits] = useState<any[]>([]);
  const [e1Units, setE1Units] = useState<any[]>([]);
  
  const [selectedE1, setSelectedE1] = useState<string>("all");
  const [selectedE2, setSelectedE2] = useState<string>("all");
  
  const [currentUnitName, setCurrentUnitName] = useState<string>("");
  const [risks, setRisks] = useState<any[]>([]);
  const [submission, setSubmission] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Riviu Modal (Per Risiko)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  const [catatan, setCatatan] = useState("");
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
    try {
      // 1. Fetch mr_identifikasi
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
      setRisks(rData);

      // 2. Fetch submission status from audit_submissions
      const cleanDocId = `${targetUnitName.replace(/[^a-zA-Z0-9]/g, '_')}_${safeYear}`;
      const subSnap = await getDoc(doc(db, "audit_submissions", cleanDocId));
      if (subSnap.exists()) {
        const subData = subSnap.data();
        setSubmission({ id: subSnap.id, ...subData });
        setCatatanUmum(subData.catatanUmum || "");
      } else {
        // Fallback by legacy ID
        const legacyDocId = `${targetUnitName.replace(/\s+/g, '_')}_${safeYear}`;
        const legSnap = await getDoc(doc(db, "audit_submissions", legacyDocId));
        if (legSnap.exists()) {
          const subData = legSnap.data();
          setSubmission({ id: legSnap.id, ...subData });
          setCatatanUmum(subData.catatanUmum || "");
        } else {
          setSubmission(null);
          setCatatanUmum("");
        }
      }
    } catch (error) {
      console.error("Fetch risks error", error);
      toast.error("Gagal mengambil data peta risiko");
    } finally {
      setIsLoading(false);
    }
  };

  const openRiviuModal = (risk: any) => {
    setSelectedRisk(risk);
    setCatatan(risk.catatanAuditor || "");
    setIsModalOpen(true);
  };

  const handleSaveRiviu = async () => {
    if (!selectedRisk) return;
    setIsSaving(true);
    const toastId = toast.loading("Menyimpan catatan auditor...");
    try {
      await updateDoc(doc(db, "mr_identifikasi", selectedRisk.id), {
        catatanAuditor: catatan,
        catatanUpdatedAt: new Date().toISOString()
      });
      
      // Update local state
      setRisks(prev => prev.map(r => r.id === selectedRisk.id ? { ...r, catatanAuditor: catatan } : r));
      
      logActivity(user, "Audit", "Peta Risiko", `Memberikan catatan riviu pada risiko: ${selectedRisk.pernyataanRisiko}`);
      toast.success("Catatan auditor berhasil disimpan!", { id: toastId });
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
      const notesCount = risks.filter(r => r.catatanAuditor && r.catatanAuditor.trim() !== "").length;

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

      // 1. Simpan ke audit_submissions (pakai format cleanDocId dan legacyDocId agar kompatibel 100%)
      const cleanDocId = `${cleanUnit.replace(/[^a-zA-Z0-9]/g, '_')}_${safeYear}`;
      await setDoc(doc(db, "audit_submissions", cleanDocId), submissionData, { merge: true });

      const legacyDocId = `${cleanUnit.replace(/\s+/g, '_')}_${safeYear}`;
      if (legacyDocId !== cleanDocId) {
        try {
          await setDoc(doc(db, "audit_submissions", legacyDocId), submissionData, { merge: true });
        } catch (e) {}
      }

      // 2. Update flag pada dokumen risiko
      for (const r of risks) {
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
      setIsSendModalOpen(false);

      logActivity(user, "Kirim", "Audit", `Mengirim hasil riviu audit ke unit kerja: ${cleanUnit}`);
      toast.success("Hasil riviu berhasil dikirim ke unit kerja! Catatan kini otomatis muncul di Inbox unit kerja.", { id: toastId });
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
  const notesCount = risks.filter(r => r.catatanAuditor && r.catatanAuditor.trim() !== "").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Audit Risiko</h2>
        <p className="text-slate-500">Riviu dan berikan catatan evaluasi atas Peta Risiko dan RTP unit kerja, lalu kirimkan hasil riviu ke unit kerja.</p>
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
              <span>Total Risiko: <strong className="text-slate-800">{risks.length}</strong></span>
              <span>•</span>
              <span>Diberi Catatan: <strong className="text-pink-600">{notesCount}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Status Dokumen: 
                {submission?.status === "reviewed" ? (
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
            <Button 
              onClick={() => setIsSendModalOpen(true)}
              disabled={isLoading || risks.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium"
              size="default"
            >
              <Send className="w-4 h-4 mr-2" />
              Kirim ke Unit Kerja
            </Button>
          </div>
        </div>
      )}

      {risks.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <span className="font-semibold text-slate-700 text-sm">Daftar Risiko & Rencana Tindak Pengendalian (RTP)</span>
            <span className="text-xs text-slate-500">Klik tombol &ldquo;Riviu&rdquo; untuk memberikan catatan pada masing-masing risiko</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/70">
                <TableRow>
                  <TableHead className="w-[18%]">Sasaran / IKU</TableHead>
                  <TableHead className="w-[22%]">Pernyataan Risiko & Sebab</TableHead>
                  <TableHead className="w-[10%] text-center">Level Risiko</TableHead>
                  <TableHead className="w-[24%]">Rencana Tindak Pengendalian (RTP)</TableHead>
                  <TableHead className="w-[16%] text-center">Catatan Auditor</TableHead>
                  <TableHead className="w-[10%] text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.map((r) => (
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
                      {r.catatanAuditor ? (
                        <div className="p-2.5 bg-pink-50 border border-pink-200 rounded-lg text-pink-900 break-words whitespace-pre-wrap shadow-2xs">
                          {r.catatanAuditor}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic block text-center">-</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-center">
                      <Button onClick={() => openRiviuModal(r)} variant="outline" size="sm" className="border-pink-200 text-pink-700 hover:bg-pink-50 hover:text-pink-800">
                        {r.catatanAuditor ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <MessageSquarePlus className="w-3.5 h-3.5 mr-1.5" />}
                        Riviu
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      
      {/* Modal Riviu Catatan Per Risiko */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Berikan Catatan Riviu</DialogTitle>
            <DialogDescription>
              Catatan ini akan tersimpan dan nantinya dikirimkan ke unit kerja ketika Anda menekan &ldquo;Kirim ke Unit Kerja&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="bg-slate-50 p-3 rounded-lg border text-sm">
              <span className="font-semibold block text-slate-600 mb-1">Pernyataan Risiko:</span>
              <span className="text-slate-800">{selectedRisk?.pernyataanRisiko}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="catatan-auditor">Catatan Auditor</Label>
              <Textarea 
                id="catatan-auditor"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan catatan perbaikan atau evaluasi di sini..."
                className="min-h-[140px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleSaveRiviu} disabled={isSaving} className="bg-pink-600 hover:bg-pink-700">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Simpan Catatan
            </Button>
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
              Hasil evaluasi dan seluruh catatan riviu akan otomatis masuk ke menu <strong>Inbox Hasil Auditor</strong> pada unit kerja terkait.
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
                <span className="font-bold text-pink-700">{notesCount} dari {risks.length} Risiko</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatan-umum">Catatan Umum / Rekomendasi Keseluruhan (Opsional)</Label>
              <Textarea 
                id="catatan-umum"
                value={catatanUmum}
                onChange={(e) => setCatatanUmum(e.target.value)}
                placeholder="Contoh: Secara umum sudah baik, mohon perbaiki rumusan penyebab risiko nomor 2 dan lengkapi target waktu pada RTP..."
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
