"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, MessageSquarePlus, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/logger";

export default function AuditRisikoPage() {
  const { user, activeYear, loading: authLoading } = useAuth();
  
  const [units, setUnits] = useState<any[]>([]);
  const [e1Units, setE1Units] = useState<any[]>([]);
  
  const [selectedE1, setSelectedE1] = useState<string>("all");
  const [selectedE2, setSelectedE2] = useState<string>("all");
  
  const [risks, setRisks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Riviu Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  const [catatan, setCatatan] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

    setIsLoading(true);
    try {
      // First, get all programs/kegiatans to get target indicators? 
      // We can just fetch mr_identifikasi for targetUnitName and activeYear
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

  if (authLoading || (user && user.role !== "auditor" && user.role !== "admin")) {
    return <div className="p-8 text-center text-slate-500">Memuat atau Anda tidak memiliki akses...</div>;
  }

  // Derived E2 list based on selected E1
  const availableE2 = units.filter(u => u.level === "eselon_2" && u.parentId === selectedE1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Audit Risiko</h2>
        <p className="text-slate-500">Riviu dan berikan catatan atas Peta Risiko dan RTP unit kerja.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Unit Eselon 1</Label>
            <Select value={selectedE1} onValueChange={(v) => { setSelectedE1(v); setSelectedE2("all"); }}>
              <SelectTrigger><SelectValue placeholder="Pilih Eselon 1" /></SelectTrigger>
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
              <SelectTrigger><SelectValue placeholder="Pilih Unit Terkait" /></SelectTrigger>
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

      {risks.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[15%]">Sasaran / IKU</TableHead>
                  <TableHead className="w-[20%]">Pernyataan Risiko</TableHead>
                  <TableHead className="w-[10%] text-center">Level Risiko</TableHead>
                  <TableHead className="w-[25%]">Rencana Tindak Pengendalian (RTP)</TableHead>
                  <TableHead className="w-[15%] text-center">Catatan Auditor</TableHead>
                  <TableHead className="w-[15%] text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell className="align-top">
                      <div className="font-medium text-slate-800 line-clamp-3">{r.sasaranTerkait}</div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-3">{r.indikatorKinerja}</div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="font-medium">{r.pernyataanRisiko}</div>
                      <div className="text-xs text-slate-500 mt-1">Sebab: {r.uraianPenyebab}</div>
                    </TableCell>
                    <TableCell className="align-top text-center">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        r.levelRisiko === 'Sangat Tinggi' ? 'bg-red-100 text-red-800' :
                        r.levelRisiko === 'Tinggi' ? 'bg-orange-100 text-orange-800' :
                        r.levelRisiko === 'Sedang' ? 'bg-yellow-100 text-yellow-800' :
                        r.levelRisiko === 'Rendah' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {r.levelRisiko || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      {r.rtpList && r.rtpList.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1 text-sm">
                          {r.rtpList.map((rtp: any, idx: number) => (
                            <li key={idx}>{rtp.rencana}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 italic text-sm">Tidak ada RTP</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-sm">
                      {r.catatanAuditor ? (
                        <div className="p-2 bg-pink-50 border border-pink-100 rounded-md text-pink-800 break-words whitespace-pre-wrap">
                          {r.catatanAuditor}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic block text-center">-</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-center">
                      <Button onClick={() => openRiviuModal(r)} variant="outline" size="sm" className="border-pink-200 text-pink-700 hover:bg-pink-50">
                        {r.catatanAuditor ? <CheckCircle className="w-4 h-4 mr-2" /> : <MessageSquarePlus className="w-4 h-4 mr-2" />}
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
      
      {/* Modal Riviu */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Berikan Catatan Riviu</DialogTitle>
            <DialogDescription>
              Catatan ini akan dikirimkan kembali ke unit kerja untuk diperbaiki.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-3 rounded-lg border text-sm">
              <span className="font-semibold block mb-1">Risiko:</span>
              {selectedRisk?.pernyataanRisiko}
            </div>
            <div className="space-y-2">
              <Label>Catatan Auditor</Label>
              <Textarea 
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan catatan perbaikan atau evaluasi di sini..."
                className="min-h-[150px]"
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
    </div>
  );
}
