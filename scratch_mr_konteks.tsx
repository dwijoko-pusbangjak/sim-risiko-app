"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
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

interface Indikator { name: string; target: string; }
interface SasaranStrategis { id: string; name: string; }
interface SasaranProgram { id: string; strategisId: string; unitName: string; name: string; ikp?: string; target?: string; indikators?: Indikator[]; }
interface SasaranKegiatan { id: string; programId: string; unitName: string; name: string; ikk?: string; target?: string; indikators?: Indikator[]; }

interface KebijakanRow {
  id: string;
  sasaran: string;
  peraturan: string;
  amanat: string;
  pihakInternal: string;
  hubInternal: string;
  pihakEksternal: string;
  hubEksternal: string;
}

interface InsidenRow {
  id: string;
  sumber: string;
  uraian: string;
  penyebab: string;
}

interface KonteksData {
  id: string;
  tahun: string;
  sumberData: string;
  tujuanKL: string;
  kebijakanList?: KebijakanRow[];
  insidenList?: InsidenRow[];
  peraturan?: Record<string, string>;
  amanatPeraturan?: Record<string, string>;
  pihakInternal?: Record<string, string>;
  hubunganInternal?: Record<string, string>;
  pihakEksternal?: Record<string, string>;
  hubunganEksternal?: Record<string, string>;
  stakeholderInternal?: string; // legacy
  stakeholderEksternal?: string; // legacy
  sumberTemuan?: string;
  uraianTemuan?: string;
  penyebabTemuan?: string;
}

export default function PenetapanKonteksPage() {
  const { user, loading: authLoading } = useAuth();
  
  // List State
  const [konteksList, setKonteksList] = useState<KonteksData[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const [konteksId, setKonteksId] = useState("");
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [sumberData, setSumberData] = useState("");
  const [tujuanKL, setTujuanKL] = useState("");
  const [kebijakanList, setKebijakanList] = useState<KebijakanRow[]>([]);
  const [insidenListState, setInsidenListState] = useState<InsidenRow[]>([]);

  // legacy fields to preserve on save
  const [legacyData, setLegacyData] = useState<any>({});
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Master Data
  const [strategisList, setStrategisList] = useState<SasaranStrategis[]>([]);
  const [programList, setProgramList] = useState<SasaranProgram[]>([]);
  const [kegiatanList, setKegiatanList] = useState<SasaranKegiatan[]>([]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchMasterData();
      fetchKonteksList();
    }
  }, [authLoading, user]);

  const fetchMasterData = async () => {
    try {
      const stratSnap = await getDocs(collection(db, "sasaran_strategis"));
      setStrategisList(stratSnap.docs.map(d => ({ id: d.id, ...d.data() } as SasaranStrategis)));

      if (user?.role === "eselon_1") {
        const progQ = query(collection(db, "sasaran_program"), where("unitName", "==", user.unitName));
        const progSnap = await getDocs(progQ);
        setProgramList(progSnap.docs.map(d => ({ id: d.id, ...d.data() } as SasaranProgram)));
      } else if (user?.role === "eselon_2") {
        const progSnap = await getDocs(collection(db, "sasaran_program"));
        setProgramList(progSnap.docs.map(d => ({ id: d.id, ...d.data() } as SasaranProgram)));

        const kegQ = query(collection(db, "sasaran_kegiatan"), where("unitName", "==", user.unitName));
        const kegSnap = await getDocs(kegQ);
        setKegiatanList(kegSnap.docs.map(d => ({ id: d.id, ...d.data() } as SasaranKegiatan)));
      }
    } catch (error) {
      console.error("Gagal mengambil master data:", error);
      toast.error("Gagal mengambil data sasaran.");
    }
  };

  const fetchKonteksList = async () => {
    setIsListLoading(true);
    try {
      if (!user?.unitName) {
        setIsListLoading(false);
        return;
      }
      const q = query(collection(db, "mr_konteks"), where("unitName", "==", user.unitName));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as KonteksData));
      // Urutkan tahun terbaru di atas
      data.sort((a, b) => b.tahun.localeCompare(a.tahun));
      setKonteksList(data);
    } catch (error) {
      console.error("Error fetching list:", error);
      toast.error("Gagal memuat daftar penetapan konteks.");
    } finally {
      setIsListLoading(false);
    }
  };

  const resetForm = () => {
    setTahun(new Date().getFullYear().toString());
    setSumberData("");
    setTujuanKL("");
    setPeraturan({});
    setAmanatPeraturan({});
    setPihakInternal({});
    setHubunganInternal({});
    setPihakEksternal({});
    setHubunganEksternal({});
    setStakeholderInternal("");
    setStakeholderEksternal("");
    setSumberTemuan("");
    setUraianTemuan("");
    setPenyebabTemuan("");
    setIsEditMode(false);
  };

  const handleCreateNew = () => {
    resetForm();
    setIsFormVisible(true);
  };

  const handleEdit = (item: KonteksData) => {
    setKonteksId(item.id);
    setTahun(item.tahun);
    setSumberData(item.sumberData || "");
    setTujuanKL(item.tujuanKL || "");
    setPeraturan(item.peraturan || {});
    setAmanatPeraturan(item.amanatPeraturan || {});
    setPihakInternal(item.pihakInternal || {});
    setHubunganInternal(item.hubunganInternal || {});
    setPihakEksternal(item.pihakEksternal || {});
    setHubunganEksternal(item.hubunganEksternal || {});
    setStakeholderInternal(item.stakeholderInternal || "");
    setStakeholderEksternal(item.stakeholderEksternal || "");
    setSumberTemuan(item.sumberTemuan || "");
    setUraianTemuan(item.uraianTemuan || "");
    setPenyebabTemuan(item.penyebabTemuan || "");
    setIsEditMode(true);
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "mr_konteks", id));
      
      import('@/lib/logger').then(({ logActivity }) => {
        logActivity(user, "Hapus", "Penetapan Konteks", `Menghapus Penetapan Konteks ID: ${id}`);
      });

      toast.success("Data berhasil dihapus!");
      if (isFormVisible && id === konteksId) {
        setIsFormVisible(false);
      }
      fetchKonteksList();
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
      // Buat ID spesifik berdasarkan tahun agar tidak ada duplikasi tahun per unit
      const docId = `${user.unitName}-${tahun}`.replace(/\s+/g, '-').toLowerCase();
      const docRef = doc(db, "mr_konteks", docId);
      
      await setDoc(docRef, {
        unitName: user.unitName,
        tahun,
        sumberData,
        tujuanKL,
        peraturan,
        amanatPeraturan,
        pihakInternal,
        hubunganInternal,
        pihakEksternal,
        hubunganEksternal,
        stakeholderInternal,
        stakeholderEksternal,
        sumberTemuan,
        uraianTemuan,
        penyebabTemuan,
        updatedAt: new Date().toISOString(),
        ownerId: user.uid,
        role: user.role
      }, { merge: true });

      import('@/lib/logger').then(({ logActivity }) => {
        logActivity(user, isEditMode ? "Edit" : "Tambah", "Penetapan Konteks", `Menyimpan Penetapan Konteks Tahun ${tahun}`);
      });

      toast.success("Data Penetapan Konteks berhasil disimpan!");
      setIsFormVisible(false);
      fetchKonteksList();
    } catch (error: any) {
      console.error("Error saving konteks:", error);
      toast.error(`Gagal menyimpan: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDynamicChange = (setter: React.Dispatch<React.SetStateAction<Record<string, string>>>, id: string, value: string) => {
    setter(prev => ({ ...prev, [id]: value }));
  };

  if (authLoading || (isListLoading && strategisList.length === 0)) {
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Penetapan Konteks</h2>
          <p className="text-slate-500">Daftar penetapan konteks manajemen risiko untuk unit kerja Anda.</p>
        </div>
        {!isFormVisible && (
          <Button onClick={handleCreateNew} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" /> Tambah Penetapan Konteks
          </Button>
        )}
      </div>

      {/* Tabel Daftar Konteks */}
      {!isFormVisible && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px]">Tahun</TableHead>
                <TableHead>Sumber Data</TableHead>
                <TableHead className="hidden md:table-cell">Tujuan K/L</TableHead>
                <TableHead className="text-center w-[150px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isListLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : konteksList.length > 0 ? (
                konteksList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-slate-800">{item.tahun}</TableCell>
                    <TableCell className="text-slate-600">{item.sumberData}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-500 max-w-md truncate">
                      {item.tujuanKL}
                    </TableCell>
                    <TableCell className="text-center">
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
                              <AlertDialogTitle>Hapus Penetapan Konteks?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus data penetapan konteks tahun {item.tahun}? Tindakan ini tidak dapat dibatalkan.
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
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    Belum ada data penetapan konteks. Klik tombol "Tambah Penetapan Konteks".
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form Penetapan Konteks */}
      {isFormVisible && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h3 className="text-lg font-bold text-slate-800">
              {isEditMode ? "Edit Penetapan Konteks" : "Buat Penetapan Konteks Baru"}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setIsFormVisible(false)} className="text-slate-500">
              <X className="h-4 w-4 mr-2" /> Tutup Form
            </Button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Unit Pemilik Risiko</Label>
                <Input 
                  value={user?.unitName || "Belum ada unit"} 
                  disabled 
                  className="bg-slate-100 text-slate-600 font-semibold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tahun">Tahun Penetapan</Label>
                <Select value={tahun} onValueChange={setTahun} disabled={isEditMode}>
                  <SelectTrigger id="tahun" className={isEditMode ? "bg-slate-50" : ""}>
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
                {isEditMode && <p className="text-xs text-slate-400">Tahun tidak dapat diubah saat edit.</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sumberData">Sumber Data *</Label>
              <Input 
                id="sumberData"
                placeholder="Contoh: Renstra, DIPA, dll" 
                value={sumberData}
                onChange={(e) => setSumberData(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tujuanKL">Tujuan K/L *</Label>
              <Textarea 
                id="tujuanKL"
                placeholder="Tuliskan tujuan Kementerian/Lembaga..." 
                value={tujuanKL}
                onChange={(e) => setTujuanKL(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-lg font-semibold text-slate-800">Kebijakan dan Daftar Pemangku Kepentingan Terkait</Label>
              <p className="text-sm text-slate-500 mb-2">
                Tabel ini ditarik otomatis dari master data Sasaran Kinerja. Silakan isi Nama Peraturan, Amanat, serta Stakeholder.
              </p>
              
              <div className="border rounded-lg overflow-x-auto">
                <Table className="min-w-[1400px]">
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-12 border-r border-b text-center align-middle" rowSpan={2}>No.</TableHead>
                      <TableHead className="w-[250px] border-r border-b text-center align-middle" rowSpan={2}>
                        Sasaran Strategis / Program / Kegiatan
                      </TableHead>
                      <TableHead className="w-[200px] border-r border-b text-center align-middle" rowSpan={2}>Nama Peraturan</TableHead>
                      <TableHead className="w-[200px] border-r border-b text-center align-middle" rowSpan={2}>Amanat Peraturan Terkait Unit Kerja</TableHead>
                      <TableHead className="w-[300px] border-r border-b text-center" colSpan={2}>Stakeholder Internal</TableHead>
                      <TableHead className="w-[300px] border-b text-center" colSpan={2}>Stakeholder Eksternal</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="w-[150px] border-r border-b text-center bg-slate-50">Stakeholder</TableHead>
                      <TableHead className="w-[150px] border-r border-b text-center bg-slate-50">Hubungan</TableHead>
                      <TableHead className="w-[150px] border-r border-b text-center bg-slate-50">Stakeholder</TableHead>
                      <TableHead className="w-[150px] border-b text-center bg-slate-50">Hubungan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user?.role === "eselon_1" && (
                      programList.length > 0 ? programList.map((prog, idx) => {
                        const strat = strategisList.find(s => s.id === prog.strategisId);
                        return (
                          <TableRow key={prog.id} className="border-b">
                            <TableCell className="border-r text-center align-top p-2">{idx + 1}</TableCell>
                            <TableCell className="border-r text-sm align-top p-2">
                              <p className="font-semibold text-slate-700">{prog.name}</p>
                              {prog.indikators && prog.indikators.length > 0 ? (
                                <ul className="list-disc pl-4 mt-2 space-y-1">
                                  {prog.indikators.map((ind, i) => <li key={i}>{ind.name}</li>)}
                                </ul>
                              ) : (
                                <p className="mt-2 text-slate-600">{prog.ikp}</p>
                              )}
                            </TableCell>
                            <TableCell className="border-r align-top p-2">
                              <Textarea 
                                placeholder="Ketik peraturan..." 
                                value={peraturan[prog.id] || ""}
                                onChange={(e) => handleDynamicChange(setPeraturan, prog.id, e.target.value)}
                                className="min-h-[120px] w-full resize-y text-sm"
                              />
                            </TableCell>
                            <TableCell className="border-r align-top p-2">
                              <Textarea 
                                placeholder="Amanat peraturan..." 
                                value={amanatPeraturan[prog.id] || ""}
                                onChange={(e) => handleDynamicChange(setAmanatPeraturan, prog.id, e.target.value)}
                                className="min-h-[120px] w-full resize-y text-sm"
                              />
                            </TableCell>
                            <TableCell className="border-r align-top p-2">
                              <Textarea 
                                placeholder="Pihak internal..." 
                                value={pihakInternal[prog.id] || ""}
                                onChange={(e) => handleDynamicChange(setPihakInternal, prog.id, e.target.value)}
                                className="min-h-[120px] w-full resize-y text-sm"
                              />
                            </TableCell>
                            <TableCell className="border-r align-top p-2">
                              <Textarea 
                                placeholder="Hubungan internal..." 
                                value={hubunganInternal[prog.id] || ""}
                                onChange={(e) => handleDynamicChange(setHubunganInternal, prog.id, e.target.value)}
                                className="min-h-[120px] w-full resize-y text-sm"
                              />
                            </TableCell>
                            <TableCell className="border-r align-top p-2">
                              <Textarea 
                                placeholder="Pihak eksternal..." 
                                value={pihakEksternal[prog.id] || ""}
                                onChange={(e) => handleDynamicChange(setPihakEksternal, prog.id, e.target.value)}
                                className="min-h-[120px] w-full resize-y text-sm"
                              />
                            </TableCell>
                            <TableCell className="align-top p-2">
                              <Textarea 
                                placeholder="Hubungan eksternal..." 
                                value={hubunganEksternal[prog.id] || ""}
                                onChange={(e) => handleDynamicChange(setHubunganEksternal, prog.id, e.target.value)}
                                className="min-h-[120px] w-full resize-y text-sm"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center h-24 text-slate-500">
                            Belum ada Sasaran Program yang diinput untuk unit ini.
                          </TableCell>
                        </TableRow>
                      )
                    )}

                    {user?.role === "eselon_2" && (
                      kegiatanList.length > 0 ? kegiatanList.map((keg, idx) => {
                        const prog = programList.find(p => p.id === keg.programId);
                        return (
                          <TableRow key={keg.id} className="border-b">
                            <TableCell className="border-r text-center align-top p-2">{idx + 1}</TableCell>
                            <TableCell className="border-r text-sm align-top p-2">
                              <p className="font-semibold text-slate-700">{keg.name}</p>
                              {keg.indikators && keg.indikators.length > 0 ? (
                                <ul className="list-disc pl-4 mt-2 space-y-1">
                                  {keg.indikators.map((ind, i) => <li key={i}>{ind.name}</li>)}
                                </ul>
                              ) : (
                                <p className="mt-2 text-slate-600">{keg.ikk}</p>
                              )}
                            </TableCell>
                            <TableCell className="border-r align-top p-2">
                              <Textarea 
                                placeholder="Ketik peraturan..." 
                                value={peraturan[keg.id] || ""}
                                onChange={(e) => handleDynamicChange(setPeraturan, keg.id, e.target.value)}
                                className="min-h-[120px] w-full resize-y text-sm"
                              />
                            </TableCell>
                            <TableCell className="border-r align-top p-2">
                              <Textarea 
                                placeholder="Amanat peraturan..." 
                                value={amanatPeraturan[keg.id] || ""}
                                onChange={(e) => handleDynamicChange(setAmanatPeraturan, keg.id, e.target.value)}
                                className="min-h-[120px] w-full resize-y text-sm"
                              />
                            </TableCell>
                            <TableCell className="border-r align-top p-2">
                              <Textarea 
                                placeholder="Pihak internal..." 
                                value={pihakInternal[keg.id] || ""}
                                onChange={(e) => handleDynamicChange(setPihakInternal, keg.id, e.target.value)}
                                className="min-h-[120px] w-full resize-y text-sm"
                              />
                            </TableCell>
                            <TableCell className="border-r align-top p-2">
                              <Textarea 
                                placeholder="Hubungan internal..." 
                                value={hubunganInternal[keg.id] || ""}
                                onChange={(e) => handleDynamicChange(setHubunganInternal, keg.id, e.target.value)}
                                className="min-h-[120px] w-full resize-y text-sm"
                              />
                            </TableCell>
                            <TableCell className="border-r align-top p-2">
                              <Textarea 
                                placeholder="Pihak eksternal..." 
                                value={pihakEksternal[keg.id] || ""}
                                onChange={(e) => handleDynamicChange(setPihakEksternal, keg.id, e.target.value)}
                                className="min-h-[120px] w-full resize-y text-sm"
                              />
                            </TableCell>
                            <TableCell className="align-top p-2">
                              <Textarea 
                                placeholder="Hubungan eksternal..." 
                                value={hubunganEksternal[keg.id] || ""}
                                onChange={(e) => handleDynamicChange(setHubunganEksternal, keg.id, e.target.value)}
                                className="min-h-[120px] w-full resize-y text-sm"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center h-24 text-slate-500">
                            Belum ada Sasaran Kegiatan yang diinput untuk unit ini.
                          </TableCell>
                        </TableRow>
                      )
                    )}
                    
                    {user?.role === "admin" && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center h-24 text-slate-500">
                          Admin tidak memiliki Sasaran Kinerja unit secara langsung.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <h4 className="font-semibold text-slate-800">Insiden / Temuan Sebelumnya</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sumberTemuan">Sumber Temuan</Label>
                  <Input 
                    id="sumberTemuan"
                    placeholder="Contoh: Audit Internal, LHP BPK..." 
                    value={sumberTemuan}
                    onChange={(e) => setSumberTemuan(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uraianTemuan">Uraian Temuan</Label>
                  <Textarea 
                    id="uraianTemuan"
                    placeholder="Deskripsikan temuan..." 
                    value={uraianTemuan}
                    onChange={(e) => setUraianTemuan(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="penyebabTemuan">Penyebab Temuan</Label>
                  <Textarea 
                    id="penyebabTemuan"
                    placeholder="Penyebab utama dari temuan..." 
                    value={penyebabTemuan}
                    onChange={(e) => setPenyebabTemuan(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 gap-3">
              <Button type="button" variant="outline" onClick={() => setIsFormVisible(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Data
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
