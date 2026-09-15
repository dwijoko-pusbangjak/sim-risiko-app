"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Save, FileText, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/logger";

// Tipe Data untuk menampung RTP yang sudah di-flatten (dilebarkan) dari parent risikonya
interface FlattenedRTP {
  riskId: string;
  pernyataanRisiko: string;
  rtpId: string;
  rencana: string;
  pemantauan?: {
    progres: string;
    waktuPelaksanaan: string;
    linkEviden: string;
    persentase: number;
  };
}

export default function PemantauanRTPPage() {
  const { user, activeYear, loading: authLoading } = useAuth();
  
  const [flattenedRtps, setFlattenedRtps] = useState<FlattenedRTP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk form modal pemantauan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FlattenedRTP | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    progres: "",
    waktuPelaksanaan: "",
    linkEviden: "",
    persentase: 0
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
        if (riskData.rtpList && Array.isArray(riskData.rtpList)) {
          riskData.rtpList.forEach((rtp: any) => {
            results.push({
              riskId: docSnap.id,
              pernyataanRisiko: riskData.pernyataanRisiko || "Tanpa Judul",
              rtpId: rtp.id,
              rencana: rtp.rencana || "Tanpa Nama RTP",
              pemantauan: rtp.pemantauan
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
    setFormData({
      progres: item.pemantauan?.progres || "",
      waktuPelaksanaan: item.pemantauan?.waktuPelaksanaan || "",
      linkEviden: item.pemantauan?.linkEviden || "",
      persentase: item.pemantauan?.persentase || 0
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedItem) return;
    if (formData.persentase < 0 || formData.persentase > 100) {
      toast.error("Persentase harus antara 0 dan 100.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // 1. Ambil dokumen identifikasi risiko yang menjadi induk
      const docRef = doc(db, "mr_identifikasi", selectedItem.riskId);
      
      // Ambil rtpList saat ini (bisa difetch ulang atau pakai list lokal, amannya fetch ulang untuk atomicity)
      // Demi kesederhanaan, kita bisa update elemen array dengan membaca lalu menulis ulang
      const docSnap = await getDocs(query(collection(db, "mr_identifikasi"), where("__name__", "==", selectedItem.riskId)));
      if (docSnap.empty) throw new Error("Dokumen risiko tidak ditemukan");
      
      const riskData = docSnap.docs[0].data();
      const currentRtpList = riskData.rtpList || [];
      
      // Cari dan update rtp yang sesuai
      const updatedRtpList = currentRtpList.map((rtp: any) => {
        if (rtp.id === selectedItem.rtpId) {
          return {
            ...rtp,
            pemantauan: {
              progres: formData.progres,
              waktuPelaksanaan: formData.waktuPelaksanaan,
              linkEviden: formData.linkEviden,
              persentase: Number(formData.persentase),
              updatedAt: new Date().toISOString()
            }
          };
        }
        return rtp;
      });
      
      // Simpan ke Firestore
      await setDoc(docRef, { rtpList: updatedRtpList }, { merge: true });
      
      // Log Aktivitas
      logActivity(
        user,
        "Edit",
        "Pemantauan RTP",
        `Update progres RTP: ${selectedItem.rencana} menjadi ${formData.persentase}%`
      );
      
      toast.success("Pemantauan RTP berhasil disimpan!");
      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (error: any) {
      console.error("Gagal menyimpan pemantauan:", error);
      toast.error(`Gagal menyimpan: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

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
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Pemantauan RTP</h2>
          <p className="text-slate-500">
            Laporkan progres dan realisasi dari Rencana Tindak Pengendalian (RTP) yang telah disusun.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[20%]">Risiko</TableHead>
                <TableHead className="w-[20%]">Rencana Tindak Pengendalian (RTP)</TableHead>
                <TableHead className="w-[25%]">Uraian Progres Pelaksanaan</TableHead>
                <TableHead className="w-[12%]">Waktu</TableHead>
                <TableHead className="w-[8%] text-center">Progres</TableHead>
                <TableHead className="w-[15%] text-right">Aksi</TableHead>
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
                    <TableCell className="text-slate-600 text-sm">
                      {item.pemantauan?.progres ? (
                        <div className="line-clamp-3 whitespace-pre-wrap">
                          {item.pemantauan.progres}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Belum ada progres</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {item.pemantauan?.waktuPelaksanaan ? (
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> {item.pemantauan.waktuPelaksanaan}
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-lg font-bold ${
                          (item.pemantauan?.persentase || 0) === 100 ? 'text-emerald-600' :
                          (item.pemantauan?.persentase || 0) > 0 ? 'text-indigo-600' : 'text-slate-400'
                        }`}>
                          {item.pemantauan?.persentase || 0}%
                        </span>
                        {/* Simple progress bar */}
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full ${
                              (item.pemantauan?.persentase || 0) === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${item.pemantauan?.persentase || 0}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant={item.pemantauan ? "outline" : "default"}
                        className={!item.pemantauan ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                        onClick={() => handleOpenModal(item)}
                      >
                        {item.pemantauan ? (
                          <>Update Progres</>
                        ) : (
                          <>Input Pemantauan</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    Belum ada Rencana Tindak Pengendalian (RTP) yang dapat dipantau.<br/>
                    Pastikan Anda telah mengisi RTP pada menu "Rencana Tindak Pengendalian".
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Input Pemantauan */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Input Pemantauan RTP</DialogTitle>
            <DialogDescription>
              Perbarui status pelaksanaan untuk RTP: <br/>
              <strong className="text-slate-800">{selectedItem?.rencana}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="progres">Progres Pelaksanaan RTP</Label>
              <Textarea 
                id="progres"
                placeholder="Jelaskan progres pelaksanaan yang sudah dilakukan..."
                value={formData.progres}
                onChange={(e) => setFormData({...formData, progres: e.target.value})}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="waktuPelaksanaan">Waktu Pelaksanaan</Label>
                <Input 
                  id="waktuPelaksanaan"
                  type="date"
                  value={formData.waktuPelaksanaan}
                  onChange={(e) => setFormData({...formData, waktuPelaksanaan: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="persentase">Persentase Pelaksanaan (%)</Label>
                <div className="relative">
                  <Input 
                    id="persentase"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.persentase}
                    onChange={(e) => setFormData({...formData, persentase: Number(e.target.value)})}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkEviden">Link Eviden Kegiatan</Label>
              <Input 
                id="linkEviden"
                type="url"
                placeholder="https://drive.google.com/..."
                value={formData.linkEviden}
                onChange={(e) => setFormData({...formData, linkEviden: e.target.value})}
              />
              <p className="text-xs text-slate-500">Masukkan URL/Tautan dokumen pendukung (Google Drive, OneDrive, dll).</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan Pemantauan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}