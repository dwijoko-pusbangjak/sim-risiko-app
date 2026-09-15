"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Save, Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface SasaranProgram { id: string; name: string; ikp: string; }
interface SasaranKegiatan { id: string; name: string; ikk: string; }

interface IdentifikasiRisiko {
  id: string;
  tahun: string;
  unitName: string;
  indikatorKinerja: string;
  sasaranTerkait: string;
  permasalahan: string;
  pernyataanRisiko: string;
  kategori: string;
  pemilikRisiko: string;
  uraianPenyebab: string;
  sumberPenyebab: string;
  sifatPenyebab: string; // Controllable / Uncontrollable
  uraianDampak: string;
  pihakTerdampak: string;
  pengendalianAda: string;
  penilaianPengendalian: string;
  sisaRisiko: string;
}

// Native Firebase doc id will be used instead of manual uuidv4

export default function IdentifikasiRisikoPage() {
  const { user, loading: authLoading, activeYear } = useAuth();
  
  const [risikoList, setRisikoList] = useState<IdentifikasiRisiko[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Master Data (Indikator & Sasaran)
  const [kinerjaList, setKinerjaList] = useState<{ id: string; indikator: string; sasaran: string }[]>([]);

  // Form State
  const [formData, setFormData] = useState<IdentifikasiRisiko>({
    id: "",
    tahun: activeYear,
    unitName: "",
    indikatorKinerja: "",
    sasaranTerkait: "",
    permasalahan: "",
    pernyataanRisiko: "",
    kategori: "",
    pemilikRisiko: "",
    uraianPenyebab: "",
    sumberPenyebab: "",
    sifatPenyebab: "",
    uraianDampak: "",
    pihakTerdampak: "",
    pengendalianAda: "",
    penilaianPengendalian: "",
    sisaRisiko: "",
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchMasterData();
      fetchRisikoList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, activeYear]);

  // Handle otomatisasi sisaRisiko
  useEffect(() => {
    if (formData.penilaianPengendalian === "Belum Memadai") {
      setFormData(prev => ({ ...prev, sisaRisiko: prev.pernyataanRisiko }));
    } else if (formData.penilaianPengendalian === "Sudah Memadai") {
      setFormData(prev => ({ ...prev, sisaRisiko: "Tidak ada" }));
    } else if (formData.penilaianPengendalian === "") {
      setFormData(prev => ({ ...prev, sisaRisiko: "" }));
    }
  }, [formData.penilaianPengendalian, formData.pernyataanRisiko]);

  const fetchMasterData = async () => {
    try {
      if (!user?.unitName) return;
      
      let list: { id: string; indikator: string; sasaran: string }[] = [];
      
      if (user.role === "eselon_1") {
        const q = query(collection(db, "sasaran_program"), where("unitName", "==", user.unitName));
        const snap = await getDocs(q);
        list = snap.docs.map(d => {
          const data = d.data() as SasaranProgram;
          return { id: d.id, indikator: data.ikp, sasaran: data.name };
        });
      } else if (user.role === "eselon_2") {
        const q = query(collection(db, "sasaran_kegiatan"), where("unitName", "==", user.unitName));
        const snap = await getDocs(q);
        list = snap.docs.map(d => {
          const data = d.data() as SasaranKegiatan;
          return { id: d.id, indikator: data.ikk, sasaran: data.name };
        });
      }
      setKinerjaList(list);
    } catch (error) {
      console.error("Gagal mengambil master kinerja:", error);
    }
  };

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
      
      // Auto-heal mismatched IDs
      snap.docs.forEach(docSnap => {
        const d = docSnap.data();
        if (d.id && d.id !== docSnap.id) {
          import('firebase/firestore').then(({ doc, setDoc }) => {
            setDoc(doc(db, "mr_identifikasi", docSnap.id), { id: docSnap.id }, { merge: true });
          });
        }
      });
      
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as IdentifikasiRisiko));
      setRisikoList(data);
    } catch (error: any) {
      console.error("Error fetching list:", error);
      toast.error(`Gagal memuat: ${error?.message || "Kesalahan tidak diketahui"}`);
    } finally {
      setIsListLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      tahun: activeYear,
      unitName: user?.unitName || "",
      indikatorKinerja: "",
      sasaranTerkait: "",
      permasalahan: "",
      pernyataanRisiko: "",
      kategori: "",
      pemilikRisiko: user?.unitName || "",
      uraianPenyebab: "",
      sumberPenyebab: "",
      sifatPenyebab: "",
      uraianDampak: "",
      pihakTerdampak: "",
      pengendalianAda: "",
      penilaianPengendalian: "",
      sisaRisiko: "",
    });
    setIsEditMode(false);
  };

  const handleCreateNew = () => {
    resetForm();
    setIsFormVisible(true);
  };

  const handleEdit = (item: IdentifikasiRisiko) => {
    setFormData(item);
    setIsEditMode(true);
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "mr_identifikasi", id));
      toast.success("Data berhasil dihapus!");
      if (isFormVisible && id === formData.id) {
        setIsFormVisible(false);
      }
      fetchRisikoList();
    } catch (error) {
      console.error("Gagal hapus:", error);
      toast.error("Gagal menghapus data.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.unitName) return toast.error("Unit Kerja tidak ditemukan.");
    
    setIsSaving(true);
    try {
      const docRef = formData.id ? doc(db, "mr_identifikasi", formData.id) : doc(collection(db, "mr_identifikasi"));
      
      const dataToSave: any = { 
        ...formData, 
        id: docRef.id,
        updatedAt: new Date().toISOString(), 
        ownerId: user.uid 
      };
      
      // Hapus undefined values agar Firebase tidak error
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === undefined) {
          delete dataToSave[key];
        }
      });
      
      await setDoc(docRef, dataToSave, { merge: true });
      
      import('@/lib/logger').then(({ logActivity }) => {
        logActivity(
          user, 
          formData.id ? "Edit" : "Tambah", 
          "Identifikasi Risiko", 
          `Risiko: ${dataToSave.pernyataanRisiko}`
        );
      });

      toast.success("Identifikasi Risiko berhasil disimpan!");
      setIsFormVisible(false);
      fetchRisikoList();
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error(`Gagal menyimpan: ${error?.message || "Kesalahan tidak diketahui"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Saat dropdown Indikator berubah, sesuaikan Sasaran
  const handleIndikatorChange = (val: string) => {
    const selected = kinerjaList.find(k => k.indikator === val);
    setFormData(prev => ({
      ...prev,
      indikatorKinerja: val,
      sasaranTerkait: selected ? selected.sasaran : ""
    }));
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Identifikasi Risiko</h2>
          <p className="text-slate-500">Daftar identifikasi risiko untuk Tahun {activeYear}.</p>
        </div>
        {!isFormVisible && (
          <Button onClick={handleCreateNew} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" /> Tambah Identifikasi Risiko
          </Button>
        )}
      </div>

      {/* Tabel Daftar Risiko */}
      {!isFormVisible && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="min-w-[200px] whitespace-nowrap">Indikator Kinerja</TableHead>
                  <TableHead className="min-w-[250px] whitespace-nowrap">Sasaran Terkait</TableHead>
                  <TableHead className="min-w-[250px] whitespace-nowrap">Permasalahan</TableHead>
                  <TableHead className="min-w-[250px] whitespace-nowrap">Pernyataan Risiko</TableHead>
                  <TableHead className="min-w-[130px] whitespace-nowrap">Kategori</TableHead>
                  <TableHead className="min-w-[180px] whitespace-nowrap">Pemilik Risiko</TableHead>
                  <TableHead className="min-w-[250px] whitespace-nowrap">Uraian Penyebab</TableHead>
                  <TableHead className="min-w-[180px] whitespace-nowrap">Sumber Penyebab</TableHead>
                  <TableHead className="min-w-[120px] whitespace-nowrap text-center">Sifat (C/UC)</TableHead>
                  <TableHead className="min-w-[250px] whitespace-nowrap">Uraian Dampak</TableHead>
                  <TableHead className="min-w-[180px] whitespace-nowrap">Pihak Terdampak</TableHead>
                  <TableHead className="min-w-[250px] whitespace-nowrap">Pengendalian Yg Ada</TableHead>
                  <TableHead className="min-w-[150px] whitespace-nowrap">Penilaian</TableHead>
                  <TableHead className="min-w-[180px] whitespace-nowrap">Sisa Risiko</TableHead>
                  <TableHead className="text-center min-w-[100px] sticky right-0 bg-slate-100 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)] z-10">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risikoList.length > 0 ? (
                  risikoList.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-sm max-w-[200px] truncate" title={item.indikatorKinerja}>{item.indikatorKinerja}</TableCell>
                      <TableCell className="text-sm max-w-[250px] truncate" title={item.sasaranTerkait}>{item.sasaranTerkait}</TableCell>
                      <TableCell className="text-sm max-w-[250px] truncate text-slate-600" title={item.permasalahan}>{item.permasalahan}</TableCell>
                      <TableCell className="text-sm max-w-[250px] truncate font-medium text-slate-800" title={item.pernyataanRisiko}>{item.pernyataanRisiko}</TableCell>
                      <TableCell>
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap">
                          {item.kategori}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate" title={item.pemilikRisiko}>{item.pemilikRisiko}</TableCell>
                      <TableCell className="text-sm max-w-[250px] truncate text-slate-600" title={item.uraianPenyebab}>{item.uraianPenyebab}</TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate" title={item.sumberPenyebab}>{item.sumberPenyebab}</TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          item.sifatPenyebab === 'Controllable' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                        }`} title={item.sifatPenyebab}>
                          {item.sifatPenyebab === 'Controllable' ? 'C' : 'UC'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm max-w-[250px] truncate text-slate-600" title={item.uraianDampak}>{item.uraianDampak}</TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate" title={item.pihakTerdampak}>{item.pihakTerdampak}</TableCell>
                      <TableCell className="text-sm max-w-[250px] truncate text-slate-600" title={item.pengendalianAda}>{item.pengendalianAda}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
                          item.penilaianPengendalian === 'Sudah Memadai' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          {item.penilaianPengendalian}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate font-medium text-slate-700" title={item.sisaRisiko}>{item.sisaRisiko}</TableCell>
                      
                      <TableCell className="text-center sticky right-0 bg-white/95 backdrop-blur-sm shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} title="Edit">
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-9 w-9 text-red-600" title="Hapus">
                              <Trash2 className="h-4 w-4" />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Identifikasi Risiko?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus data risiko ini? Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-red-600 hover:bg-red-700">
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
                    <TableCell colSpan={15} className="h-32 text-center text-slate-500">
                      Belum ada data identifikasi risiko tahun {activeYear}.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Form Identifikasi Risiko */}
      {isFormVisible && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h3 className="text-lg font-bold text-slate-800">
              {isEditMode ? "Edit Identifikasi Risiko" : "Buat Identifikasi Risiko Baru"}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setIsFormVisible(false)} className="text-slate-500">
              <X className="h-4 w-4 mr-2" /> Tutup Form
            </Button>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            
            {/* Bagian 1: Kinerja & Permasalahan */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-md">1. Kinerja & Masalah</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="indikatorKinerja">Indikator Sasaran Kinerja *</Label>
                  <Select value={formData.indikatorKinerja} onValueChange={handleIndikatorChange} required>
                    <SelectTrigger id="indikatorKinerja">
                      {formData.indikatorKinerja ? (
                        <span className="truncate">{formData.indikatorKinerja}</span>
                      ) : (
                        <span className="text-slate-500">Pilih Indikator Kinerja...</span>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {kinerjaList.length === 0 && (
                        <SelectItem value="none" disabled>Tidak ada data indikator</SelectItem>
                      )}
                      {kinerjaList.map(k => (
                        <SelectItem key={k.id} value={k.indikator}>{k.indikator}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sasaranTerkait">Sasaran Terkait</Label>
                  <Input 
                    id="sasaranTerkait"
                    value={formData.sasaranTerkait} 
                    disabled 
                    className="bg-slate-100 text-slate-700"
                    placeholder="Otomatis terisi..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="permasalahan">Permasalahan *</Label>
                <Textarea 
                  id="permasalahan"
                  placeholder="Deskripsikan permasalahan..." 
                  value={formData.permasalahan}
                  onChange={(e) => setFormData({...formData, permasalahan: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Bagian 2: Pernyataan Risiko & Kategori */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-md">2. Identifikasi Risiko</h4>
              
              <div className="space-y-2">
                <Label htmlFor="pernyataanRisiko">Pernyataan Risiko *</Label>
                <Textarea 
                  id="pernyataanRisiko"
                  placeholder="Kejadian yang mungkin terjadi dan berdampak negatif..." 
                  value={formData.pernyataanRisiko}
                  onChange={(e) => setFormData({...formData, pernyataanRisiko: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="kategori">Kategori Risiko *</Label>
                  <Select 
                    value={formData.kategori} 
                    onValueChange={(val) => setFormData({...formData, kategori: val})} 
                    required
                  >
                    <SelectTrigger id="kategori">
                      {formData.kategori || <span className="text-slate-500">Pilih Kategori...</span>}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Strategis">Strategis</SelectItem>
                      <SelectItem value="Operasional">Operasional</SelectItem>
                      <SelectItem value="Organisasional">Organisasional</SelectItem>
                      <SelectItem value="Kepatuhan">Kepatuhan</SelectItem>
                      <SelectItem value="Keuangan">Keuangan</SelectItem>
                      <SelectItem value="Fraud">Fraud</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pemilikRisiko">Pemilik Risiko *</Label>
                  <Input 
                    id="pemilikRisiko"
                    value={formData.pemilikRisiko}
                    onChange={(e) => setFormData({...formData, pemilikRisiko: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bagian 3: Analisis Penyebab & Dampak */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-md">3. Analisis Penyebab & Dampak</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="uraianPenyebab">Uraian Penyebab *</Label>
                  <Textarea 
                    id="uraianPenyebab"
                    placeholder="Penyebab terjadinya risiko..." 
                    value={formData.uraianPenyebab}
                    onChange={(e) => setFormData({...formData, uraianPenyebab: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sumberPenyebab">Sumber Penyebab *</Label>
                  <Textarea 
                    id="sumberPenyebab"
                    placeholder="Sumber dari penyebab tersebut..." 
                    value={formData.sumberPenyebab}
                    onChange={(e) => setFormData({...formData, sumberPenyebab: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sifatPenyebab">Sifat (C/UC) *</Label>
                  <Select 
                    value={formData.sifatPenyebab} 
                    onValueChange={(val) => setFormData({...formData, sifatPenyebab: val})} 
                    required
                  >
                    <SelectTrigger id="sifatPenyebab">
                      {formData.sifatPenyebab || <span className="text-slate-500">Pilih Sifat...</span>}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Controllable">Controllable (Bisa Dikendalikan)</SelectItem>
                      <SelectItem value="Uncontrollable">Uncontrollable (Tidak Bisa Dikendalikan)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="uraianDampak">Uraian Dampak *</Label>
                  <Textarea 
                    id="uraianDampak"
                    placeholder="Dampak jika risiko terjadi..." 
                    value={formData.uraianDampak}
                    onChange={(e) => setFormData({...formData, uraianDampak: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pihakTerdampak">Pihak yang Terkena Dampak *</Label>
                  <Textarea 
                    id="pihakTerdampak"
                    placeholder="Siapa saja yang terkena dampaknya..." 
                    value={formData.pihakTerdampak}
                    onChange={(e) => setFormData({...formData, pihakTerdampak: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bagian 4: Pengendalian */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-md">4. Pengendalian Risiko</h4>
              
              <div className="space-y-2">
                <Label htmlFor="pengendalianAda">Pengendalian Yang Ada *</Label>
                <Textarea 
                  id="pengendalianAda"
                  placeholder="Langkah pengendalian yang sudah berjalan saat ini..." 
                  value={formData.pengendalianAda}
                  onChange={(e) => setFormData({...formData, pengendalianAda: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="penilaianPengendalian">Penilaian Pengendalian *</Label>
                  <Select 
                    value={formData.penilaianPengendalian} 
                    onValueChange={(val) => setFormData({...formData, penilaianPengendalian: val})} 
                    required
                  >
                    <SelectTrigger id="penilaianPengendalian">
                      {formData.penilaianPengendalian || <span className="text-slate-500">Pilih Penilaian...</span>}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sudah Memadai">Sudah Memadai</SelectItem>
                      <SelectItem value="Belum Memadai">Belum Memadai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sisaRisiko">Sisa Risiko</Label>
                  <Input 
                    id="sisaRisiko"
                    value={formData.sisaRisiko} 
                    disabled 
                    className="bg-slate-100 text-slate-700 font-medium"
                    placeholder="Otomatis dihitung berdasarkan penilaian..."
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Terisi otomatis: Jika 'Sudah Memadai' = Tidak ada. Jika 'Belum Memadai' = Pernyataan Risiko.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t gap-3">
              <Button type="button" variant="outline" onClick={() => setIsFormVisible(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Identifikasi Risiko
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}