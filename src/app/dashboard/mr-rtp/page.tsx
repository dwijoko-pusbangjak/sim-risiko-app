"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save, X, Plus, Pencil, Trash2, ShieldCheck, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface RTP {
  id: string;
  rencana: string;
  penanggungjawab: string;
  targetWaktu: string;
  bentukKomunikasi: string;
}

interface IdentifikasiRisiko {
  id: string;
  tahun: string;
  unitName: string;
  pernyataanRisiko: string;
  besaranRisiko?: number;
  levelRisiko?: string;
  rtpList?: RTP[];
}

export function getRiskLevelInfo(score: number) {
  if (score >= 20) return { label: 'Sangat Tinggi', color: 'bg-red-100 text-red-800' };
  if (score >= 16) return { label: 'Tinggi', color: 'bg-orange-100 text-orange-800' };
  if (score >= 12) return { label: 'Sedang', color: 'bg-yellow-100 text-yellow-800' };
  if (score >= 6) return { label: 'Rendah', color: 'bg-green-100 text-green-800' };
  if (score >= 1) return { label: 'Sangat Rendah', color: 'bg-blue-100 text-blue-800' };
  return { label: 'Belum Dianalisis', color: 'bg-slate-100 text-slate-500' };
}

export default function RtpPage() {
  const { user, loading: authLoading, activeYear } = useAuth();
  
  const [risikoList, setRisikoList] = useState<IdentifikasiRisiko[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  
  const [selectedRisiko, setSelectedRisiko] = useState<IdentifikasiRisiko | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<RTP>({
    id: "",
    rencana: "",
    penanggungjawab: "",
    targetWaktu: "",
    bentukKomunikasi: ""
  });

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
      const data = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as IdentifikasiRisiko));
      
      // Filter hanya risiko dengan besaran > 11
      const filteredData = data.filter(r => r.besaranRisiko && r.besaranRisiko > 11);
      
      setRisikoList(filteredData);
      
      // Update selectedRisiko with new data if it exists (for live updates inside modal)
      if (selectedRisiko) {
        const updatedSelected = filteredData.find(r => r.id === selectedRisiko.id);
        if (updatedSelected) {
          setSelectedRisiko(updatedSelected);
        } else {
          handleCloseModal();
        }
      }
    } catch (error: any) {
      console.error("Error fetching list:", error);
      toast.error(`Gagal memuat: ${error?.message || "Kesalahan tidak diketahui"}`);
    } finally {
      setIsListLoading(false);
    }
  };

  const handleOpenModal = (item: IdentifikasiRisiko) => {
    setSelectedRisiko(item);
    setIsModalOpen(true);
    setIsFormVisible(false); // Selalu buka tabel dulu, bukan form
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRisiko(null);
    setIsFormVisible(false);
  };

  const handleAddRtp = () => {
    setFormData({
      id: Math.random().toString(36).substring(2, 15), // Simple ID generator
      rencana: "",
      penanggungjawab: "",
      targetWaktu: "",
      bentukKomunikasi: ""
    });
    setIsFormVisible(true);
  };

  const handleEditRtp = (rtp: RTP) => {
    setFormData({ ...rtp });
    setIsFormVisible(true);
  };

  const handleDeleteRtp = async (rtpId: string) => {
    if (!selectedRisiko) return;
    
    try {
      const currentList = selectedRisiko.rtpList || [];
      const newList = currentList.filter(rtp => rtp.id !== rtpId);
      
      const docRef = doc(db, "mr_identifikasi", selectedRisiko.id);
      await setDoc(docRef, { 
        rtpList: newList,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      import('@/lib/logger').then(({ logActivity }) => {
        logActivity(user, "Hapus", "Rencana Tindak Pengendalian", `Menghapus RTP untuk risiko: ${selectedRisiko.pernyataanRisiko}`);
      });

      toast.success("RTP berhasil dihapus!");
      fetchRisikoList();
    } catch (error: any) {
      console.error("Error deleting RTP:", error);
      toast.error(`Gagal menghapus: ${error?.message || "Terjadi kesalahan"}`);
    }
  };

  const handleSaveRtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRisiko) return;
    
    setIsSaving(true);
    try {
      const currentList = selectedRisiko.rtpList || [];
      
      // Check if editing or adding
      const isEdit = currentList.some(r => r.id === formData.id);
      
      let newList;
      if (isEdit) {
        newList = currentList.map(r => r.id === formData.id ? formData : r);
      } else {
        newList = [...currentList, formData];
      }
      
      const docRef = doc(db, "mr_identifikasi", selectedRisiko.id);
      await setDoc(docRef, { 
        rtpList: newList,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      import('@/lib/logger').then(({ logActivity }) => {
        logActivity(
          user, 
          isEdit ? "Edit" : "Tambah", 
          "Rencana Tindak Pengendalian", 
          `${isEdit ? 'Mengubah' : 'Menambah'} RTP: ${formData.rencana}`
        );
      });

      toast.success(isEdit ? "RTP berhasil diperbarui!" : "RTP berhasil ditambahkan!");
      setIsFormVisible(false); // Kembali ke list RTP di dalam modal
      fetchRisikoList(); // Akan trigger re-render dari useEffect
    } catch (error: any) {
      console.error("Error saving RTP:", error);
      toast.error(`Gagal menyimpan: ${error?.message || "Terjadi kesalahan"}`);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Rencana Tindak Pengendalian (RTP)</h2>
          <p className="text-slate-500">Kelola tindakan pengendalian untuk risiko prioritas dengan nilai &gt; 11 di Tahun {activeYear}.</p>
        </div>
      </div>

      {/* Tabel Risiko Prioritas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h3 className="font-semibold text-slate-800 flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5 text-indigo-600" /> Daftar Risiko Prioritas (Sedang - Sangat Tinggi)
          </h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar pb-2">
          <Table>
            <TableHeader className="bg-white">
              <TableRow>
                <TableHead className="min-w-[300px]">Pernyataan Risiko</TableHead>
                <TableHead className="text-center">Besaran</TableHead>
                <TableHead className="text-center min-w-[150px]">Level Risiko</TableHead>
                <TableHead className="text-center min-w-[150px] sticky right-0 bg-white shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)] z-10">
                  Jumlah RTP (Klik Detail)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risikoList.length > 0 ? (
                risikoList.map((item) => {
                  const levelInfo = getRiskLevelInfo(item.besaranRisiko || 0);
                  const count = item.rtpList?.length || 0;
                  
                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-800 max-w-[300px] truncate" title={item.pernyataanRisiko}>
                        {item.pernyataanRisiko}
                      </TableCell>
                      <TableCell className="text-center font-bold text-lg text-slate-700">
                        {item.besaranRisiko}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${levelInfo.color}`}>
                          {item.levelRisiko}
                        </span>
                      </TableCell>
                      <TableCell className="text-center sticky right-0 bg-white/95 backdrop-blur-sm shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                        <button 
                          onClick={() => handleOpenModal(item)}
                          className="inline-flex items-center justify-center bg-indigo-100 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm border border-indigo-200"
                          title="Klik untuk melihat atau menambah RTP"
                        >
                          <ListChecks className="w-3.5 h-3.5 mr-1.5" />
                          {count} RTP
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                    Tidak ada risiko dengan nilai di atas 11.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* CUSTOM OVERLAY MODAL (Priviu Windows) */}
      {isModalOpen && selectedRisiko && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4 sm:p-6">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4 flex justify-between items-center shrink-0">
              <div className="pr-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center">
                  <ShieldCheck className="mr-2 h-5 w-5 text-indigo-600" /> Detail Rencana Tindak Pengendalian
                </h3>
                <p className="text-slate-600 text-sm mt-1 line-clamp-2">
                  <span className="font-semibold text-slate-700">Risiko:</span> {selectedRisiko.pernyataanRisiko}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseModal} className="shrink-0 text-slate-500 hover:text-slate-700 hover:bg-indigo-100/50 rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
              
              {/* === VIEW 1: TABEL RTP === */}
              {!isFormVisible && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={handleAddRtp} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                      <Plus className="mr-2 h-4 w-4" /> Tambah RTP Baru
                    </Button>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar pb-2">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="min-w-[250px]">Rencana Tindak Pengendalian</TableHead>
                            <TableHead className="min-w-[200px]">Penanggungjawab</TableHead>
                            <TableHead className="min-w-[150px]">Target Waktu</TableHead>
                            <TableHead className="min-w-[200px]">Bentuk Komunikasi</TableHead>
                            <TableHead className="text-center w-[100px] sticky right-0 bg-slate-50 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)] z-10">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedRisiko.rtpList && selectedRisiko.rtpList.length > 0 ? (
                            selectedRisiko.rtpList.map((rtp) => (
                              <TableRow key={rtp.id} className="hover:bg-slate-50/50">
                                <TableCell className="font-medium text-slate-800 whitespace-pre-wrap">{rtp.rencana}</TableCell>
                                <TableCell className="text-slate-600">{rtp.penanggungjawab}</TableCell>
                                <TableCell className="text-slate-600">{rtp.targetWaktu}</TableCell>
                                <TableCell className="text-slate-600">{rtp.bentukKomunikasi}</TableCell>
                                <TableCell className="text-center sticky right-0 bg-white/95 backdrop-blur-sm shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditRtp(rtp)} title="Edit RTP" className="h-8 w-8">
                                      <Pencil className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-red-50 text-red-600 hover:text-red-700 h-8 w-8" title="Hapus RTP">
                                        <Trash2 className="h-4 w-4" />
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Hapus RTP?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Apakah Anda yakin ingin menghapus Rencana Tindak Pengendalian ini?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Batal</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteRtp(rtp.id)} className="bg-red-600 hover:bg-red-700">
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
                              <TableCell colSpan={5} className="h-40 flex-col flex items-center justify-center text-center text-slate-500">
                                <ShieldCheck className="h-10 w-10 text-slate-300 mb-2" />
                                <p>Belum ada Rencana Tindak Pengendalian (RTP).</p>
                                <p className="text-sm">Klik tombol "Tambah RTP Baru" di atas untuk memulai.</p>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              {/* === VIEW 2: FORM TAMBAH/EDIT RTP === */}
              {isFormVisible && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center">
                      <Plus className="mr-2 h-5 w-5 text-indigo-600" />
                      {formData.id && selectedRisiko.rtpList?.some(r => r.id === formData.id) ? "Edit RTP" : "Tambah RTP Baru"}
                    </h3>
                  </div>

                  <form onSubmit={handleSaveRtp} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="rencana" className="text-base font-semibold">Rencana Tindak Pengendalian *</Label>
                      <Textarea 
                        id="rencana" 
                        placeholder="Uraikan rencana mitigasi secara jelas..." 
                        className="min-h-[100px] resize-y"
                        value={formData.rencana}
                        onChange={(e) => setFormData({...formData, rencana: e.target.value})}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="penanggungjawab" className="text-base font-semibold">Penanggungjawab *</Label>
                        <Input 
                          id="penanggungjawab" 
                          placeholder="Nama / Jabatan Penanggungjawab" 
                          value={formData.penanggungjawab}
                          onChange={(e) => setFormData({...formData, penanggungjawab: e.target.value})}
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="targetWaktu" className="text-base font-semibold">Target Waktu RTP *</Label>
                        <Input 
                          id="targetWaktu" 
                          placeholder="contoh: Triwulan 3 2026, atau November 2026" 
                          value={formData.targetWaktu}
                          onChange={(e) => setFormData({...formData, targetWaktu: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="bentukKomunikasi" className="text-base font-semibold">Bentuk Komunikasi *</Label>
                      <Input 
                        id="bentukKomunikasi" 
                        placeholder="contoh: Rapat Rutin, Surat Edaran, Memo, dll." 
                        value={formData.bentukKomunikasi}
                        onChange={(e) => setFormData({...formData, bentukKomunikasi: e.target.value})}
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setIsFormVisible(false)}>
                        Batal
                      </Button>
                      <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 px-8">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Simpan RTP
                      </Button>
                    </div>
                  </form>
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}