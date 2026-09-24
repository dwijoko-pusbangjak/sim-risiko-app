"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Save, Plus, Pencil, Trash2, AlertTriangle, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/logger";

interface RisikoOption {
  id: string;
  pernyataanRisiko: string;
  keterjadianList: Keterjadian[];
}

interface Keterjadian {
  id: string;
  tanggal: string;
  kronologi: string;
  penyebab: string;
  dampak: string;
}

type FlattenedKeterjadian = {
  id: string;
  riskId: string;
  pernyataanRisiko: string;
  tanggal: string;
  kronologi: string;
  penyebab: string;
  dampak: string;
  rincianMitigasi?: string;
  kondisiSetelahMitigasi?: string;
};

export default function KeterjadianRisikoPage() {
  const { user, activeYear, loading: authLoading } = useAuth();
  
  const [risikoList, setRisikoList] = useState<any[]>([]);
  const [keterjadianList, setKeterjadianList] = useState<FlattenedKeterjadian[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    id: "",
    riskId: "",
    tanggal: "",
    kronologi: "",
    penyebab: "",
    dampak: "",
    rincianMitigasi: "",
    kondisiSetelahMitigasi: ""
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeYear]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (!user?.unitName || !activeYear) {
        setRisikoList([]);
        setKeterjadianList([]);
        return;
      }

      const q = query(
        collection(db, "mr_identifikasi"), 
        where("unitName", "==", user.unitName),
        where("tahun", "==", activeYear)
      );
      const snap = await getDocs(q);
      
      const rList: any[] = [];
      const kList: FlattenedKeterjadian[] = [];
      
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        rList.push({ ...data, id: docSnap.id });
        
        if (data.keterjadianList && Array.isArray(data.keterjadianList)) {
          data.keterjadianList.forEach((kejadian: any) => {
            kList.push({
              id: kejadian.id,
              riskId: docSnap.id,
              pernyataanRisiko: data.pernyataanRisiko || "Tanpa Judul",
              tanggal: kejadian.tanggal,
              kronologi: kejadian.kronologi,
              penyebab: kejadian.penyebab,
              dampak: kejadian.dampak,
              rincianMitigasi: kejadian.rincianMitigasi || "",
              kondisiSetelahMitigasi: kejadian.kondisiSetelahMitigasi || ""
            });
          });
        }
      });
      
      // Urutkan berdasarkan tanggal terbaru
      kList.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
      
      setRisikoList(rList);
      setKeterjadianList(kList);
    } catch (error) {
      console.error("Gagal memuat data keterjadian:", error);
      toast.error("Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      id: "",
      riskId: "",
      tanggal: "",
      kronologi: "",
      penyebab: "",
      dampak: "",
      rincianMitigasi: "",
      kondisiSetelahMitigasi: ""
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FlattenedKeterjadian) => {
    setFormData({
      id: item.id,
      riskId: item.riskId,
      tanggal: item.tanggal,
      kronologi: item.kronologi,
      penyebab: item.penyebab,
      dampak: item.dampak,
      rincianMitigasi: item.rincianMitigasi || "",
      kondisiSetelahMitigasi: item.kondisiSetelahMitigasi || ""
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleSave = async () => {
    if (!formData.riskId) {
      toast.error("Silakan pilih risiko terlebih dahulu.");
      return;
    }
    if (!formData.tanggal || !formData.kronologi || !formData.penyebab || !formData.dampak) {
      toast.error("Field bertanda bintang wajib diisi.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const selectedRisk = risikoList.find(r => r.id === formData.riskId);
      if (!selectedRisk) throw new Error("Risiko tidak ditemukan");
      
      const currentList = Array.isArray(selectedRisk.keterjadianList) ? [...selectedRisk.keterjadianList] : [];
      
      if (isEditMode) {
        // Mode Edit
        const index = currentList.findIndex((k: any) => k.id === formData.id);
        if (index > -1) {
          currentList[index] = {
            id: formData.id,
            tanggal: formData.tanggal,
            kronologi: formData.kronologi,
            penyebab: formData.penyebab,
            dampak: formData.dampak,
            rincianMitigasi: formData.rincianMitigasi,
            kondisiSetelahMitigasi: formData.kondisiSetelahMitigasi
          };
        }
      } else {
        // Mode Tambah
        currentList.push({
          id: generateId(),
          tanggal: formData.tanggal,
          kronologi: formData.kronologi,
          penyebab: formData.penyebab,
          dampak: formData.dampak,
          rincianMitigasi: formData.rincianMitigasi,
          kondisiSetelahMitigasi: formData.kondisiSetelahMitigasi
        });
      }
      
      const docRef = doc(db, "mr_identifikasi", formData.riskId);
      await setDoc(docRef, { keterjadianList: currentList }, { merge: true });
      
      logActivity(
        user,
        isEditMode ? "Edit" : "Tambah",
        "Keterjadian",
        `${isEditMode ? 'Mengubah' : 'Menambahkan'} catatan keterjadian risiko tanggal ${formData.tanggal}`
      );
      
      toast.success(`Data keterjadian berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}!`);
      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (error: any) {
      console.error("Gagal menyimpan keterjadian:", error);
      toast.error(`Gagal menyimpan: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (riskId: string, kejadianId: string) => {
    try {
      const selectedRisk = risikoList.find(r => r.id === riskId);
      if (!selectedRisk) throw new Error("Risiko tidak ditemukan");
      
      const currentList = selectedRisk.keterjadianList.filter((k: any) => k.id !== kejadianId);
      
      const docRef = doc(db, "mr_identifikasi", riskId);
      await setDoc(docRef, { keterjadianList: currentList }, { merge: true });
      
      logActivity(user, "Hapus", "Keterjadian", `Menghapus catatan keterjadian risiko`);
      
      toast.success("Catatan keterjadian berhasil dihapus!");
      fetchData();
    } catch (error: any) {
      console.error("Gagal menghapus:", error);
      toast.error(`Gagal menghapus: ${error.message}`);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Pencatatan Keterjadian</h2>
          <p className="text-slate-500">
            Catat insiden atau perwujudan risiko yang telah terjadi.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Keterjadian
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto pb-4">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead className="min-w-[200px]">Pernyataan Risiko</TableHead>
                <TableHead className="min-w-[120px] text-center">Tanggal Kejadian</TableHead>
                <TableHead className="min-w-[200px]">Kronologi</TableHead>
                <TableHead className="min-w-[150px]">Penyebab</TableHead>
                <TableHead className="min-w-[150px]">Dampak</TableHead>
                <TableHead className="min-w-[150px]">Rincian Mitigasi</TableHead>
                <TableHead className="min-w-[150px]">Kondisi Setelah Mitigasi</TableHead>
                <TableHead className="text-center w-28">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                  </TableCell>
                </TableRow>
              ) : keterjadianList.length > 0 ? (
                keterjadianList.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-slate-50">
                    <TableCell className="text-center font-medium">{index + 1}</TableCell>
                    <TableCell className="font-semibold">{item.pernyataanRisiko}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {new Date(item.tanggal).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </TableCell>
                    <TableCell className="text-sm whitespace-pre-wrap">{item.kronologi}</TableCell>
                    <TableCell className="text-sm text-slate-600 whitespace-pre-wrap">{item.penyebab}</TableCell>
                    <TableCell className="text-sm text-slate-600 whitespace-pre-wrap">{item.dampak}</TableCell>
                    <TableCell className="text-sm text-slate-600 whitespace-pre-wrap">{item.rincianMitigasi || "-"}</TableCell>
                    <TableCell className="text-sm text-slate-600 whitespace-pre-wrap">{item.kondisiSetelahMitigasi || "-"}</TableCell>
                    <TableCell>
                      <div className="flex justify-center items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenEdit(item)}
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700" title="Hapus">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Keterjadian?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus catatan keterjadian ini? Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.riskId, item.id)} className="bg-red-600 hover:bg-red-700">
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                    Belum ada catatan keterjadian risiko tahun {activeYear}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Keterjadian Risiko" : "Tambah Keterjadian Risiko"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            
            <div className="space-y-2">
              <Label htmlFor="riskId">Pilih Risiko Terkait <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.riskId} 
                onValueChange={(val) => setFormData({...formData, riskId: val})}
                disabled={isEditMode} // Tidak bisa ganti parent saat edit
              >
                <SelectTrigger className="w-full bg-slate-50">
                  <SelectValue placeholder="-- Pilih Pernyataan Risiko --" />
                </SelectTrigger>
                <SelectContent>
                  {risikoList.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.pernyataanRisiko}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal Kejadian <span className="text-red-500">*</span></Label>
              <Input 
                id="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="kronologi">Kronologi Kejadian / Uraian Peristiwa <span className="text-red-500">*</span></Label>
              <Textarea 
                id="kronologi"
                placeholder="Ceritakan runtutan kejadian atau uraian peristiwa yang terjadi..."
                value={formData.kronologi}
                onChange={(e) => setFormData({...formData, kronologi: e.target.value})}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="penyebab">Penyebab <span className="text-red-500">*</span></Label>
              <Textarea 
                id="penyebab"
                placeholder="Uraikan penyebab terjadinya insiden ini..."
                value={formData.penyebab}
                onChange={(e) => setFormData({...formData, penyebab: e.target.value})}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dampak">Dampak <span className="text-red-500">*</span></Label>
              <Textarea 
                id="dampak"
                placeholder="Jelaskan dampak dari insiden (kerugian finansial, reputasi, dsb)..."
                value={formData.dampak}
                onChange={(e) => setFormData({...formData, dampak: e.target.value})}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rincianMitigasi">Rincian Mitigasi</Label>
              <Textarea 
                id="rincianMitigasi"
                placeholder="Tindakan mitigasi yang telah atau akan dilakukan..."
                value={formData.rincianMitigasi}
                onChange={(e) => setFormData({...formData, rincianMitigasi: e.target.value})}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kondisiSetelahMitigasi">Kondisi Setelah Mitigasi</Label>
              <Textarea 
                id="kondisiSetelahMitigasi"
                placeholder="Kondisi setelah mitigasi dilakukan..."
                value={formData.kondisiSetelahMitigasi}
                onChange={(e) => setFormData({...formData, kondisiSetelahMitigasi: e.target.value})}
                className="min-h-[80px]"
              />
            </div>

          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}