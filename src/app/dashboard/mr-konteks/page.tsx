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
      setStrategisList(stratSnap.docs.map(d => ({ ...d.data(), id: d.id } as SasaranStrategis)));

      if (user?.role === "eselon_1") {
        const progQ = query(collection(db, "sasaran_program"), where("unitName", "==", user.unitName));
        const progSnap = await getDocs(progQ);
        setProgramList(progSnap.docs.map(d => ({ ...d.data(), id: d.id } as SasaranProgram)));
      } else if (user?.role === "eselon_2") {
        const progSnap = await getDocs(collection(db, "sasaran_program"));
        setProgramList(progSnap.docs.map(d => ({ ...d.data(), id: d.id } as SasaranProgram)));

        const kegQ = query(collection(db, "sasaran_kegiatan"), where("unitName", "==", user.unitName));
        const kegSnap = await getDocs(kegQ);
        setKegiatanList(kegSnap.docs.map(d => ({ ...d.data(), id: d.id } as SasaranKegiatan)));
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
      const data = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as KonteksData));
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


  const generateId = () => Date.now().toString() + Math.random().toString().slice(2, 6);

  const resetForm = () => {
    setTahun(new Date().getFullYear().toString());
    setSumberData("");
    setTujuanKL("");
    setKebijakanList([]);
    setInsidenListState([]);
    setLegacyData({});
    setIsEditMode(false);
  };

  const handleCreateNew = () => {
    resetForm();
    
    const initialKebijakan: KebijakanRow[] = [];
    if (user?.role === "eselon_1") {
      programList.forEach(prog => {
        const strat = strategisList.find(s => s.id === prog.strategisId);
        const parentName = strat ? strat.name : "-";
        const indText = prog.indikators && prog.indikators.length > 0 
          ? prog.indikators.map(i => `- ${i.name} (Target: ${i.target})`).join('\n')
          : `- ${prog.ikp} (Target: ${prog.target})`;
        initialKebijakan.push({
          id: generateId(),
          sasaran: `Induk: ${parentName}\nSasaran: ${prog.name}\nIndikator:\n${indText}`,
          peraturan: "", amanat: "", pihakInternal: "", hubInternal: "", pihakEksternal: "", hubEksternal: ""
        });
      });
    } else if (user?.role === "eselon_2") {
      kegiatanList.forEach(keg => {
        const prog = programList.find(p => p.id === keg.programId);
        const parentName = prog ? prog.name : "-";
        const indText = keg.indikators && keg.indikators.length > 0 
          ? keg.indikators.map(i => `- ${i.name} (Target: ${i.target})`).join('\n')
          : `- ${keg.ikk} (Target: ${keg.target})`;
        initialKebijakan.push({
          id: generateId(),
          sasaran: `Induk: ${parentName}\nSasaran: ${keg.name}\nIndikator:\n${indText}`,
          peraturan: "", amanat: "", pihakInternal: "", hubInternal: "", pihakEksternal: "", hubEksternal: ""
        });
      });
    }
    setKebijakanList(initialKebijakan);
    setIsFormVisible(true);
  };

  const handleEdit = (item: KonteksData) => {
    setKonteksId(item.id);
    setTahun(item.tahun);
    setSumberData(item.sumberData || "");
    setTujuanKL(item.tujuanKL || "");
    
    setLegacyData({
      peraturan: item.peraturan || {},
      amanatPeraturan: item.amanatPeraturan || {},
      pihakInternal: item.pihakInternal || {},
      hubunganInternal: item.hubunganInternal || {},
      pihakEksternal: item.pihakEksternal || {},
      hubunganEksternal: item.hubunganEksternal || {},
      stakeholderInternal: item.stakeholderInternal || "",
      stakeholderEksternal: item.stakeholderEksternal || "",
      sumberTemuan: item.sumberTemuan || "",
      uraianTemuan: item.uraianTemuan || "",
      penyebabTemuan: item.penyebabTemuan || ""
    });

    let parsedKebijakan = item.kebijakanList || [];
    if (parsedKebijakan.length === 0 && item.peraturan && Object.keys(item.peraturan).length > 0) {
      const list = user?.role === "eselon_1" ? programList : kegiatanList;
      parsedKebijakan = list.map(sas => {
        let parentName = "-";
        if (user?.role === "eselon_1") {
          const s = sas as SasaranProgram;
          parentName = strategisList.find(x => x.id === s.strategisId)?.name || "-";
        } else {
          const s = sas as SasaranKegiatan;
          parentName = programList.find(x => x.id === s.programId)?.name || "-";
        }
        
        const indText = sas.indikators && sas.indikators.length > 0 
          ? sas.indikators.map((i: any) => `- ${i.name} (Target: ${i.target})`).join('\n')
          : `- ${'ikp' in sas ? sas.ikp : 'ikk' in sas ? sas.ikk : ''} (Target: ${sas.target || '-'})`;
        
        return {
          id: generateId(),
          sasaran: `Induk: ${parentName}\nSasaran: ${sas.name}\nIndikator:\n${indText}`,
          peraturan: item.peraturan?.[sas.id] || "",
          amanat: item.amanatPeraturan?.[sas.id] || "",
          pihakInternal: item.pihakInternal?.[sas.id] || "",
          hubInternal: item.hubunganInternal?.[sas.id] || "",
          pihakEksternal: item.pihakEksternal?.[sas.id] || "",
          hubEksternal: item.hubunganEksternal?.[sas.id] || ""
        };
      });
    }
    setKebijakanList(parsedKebijakan);

    let parsedInsiden = item.insidenList || [];
    if (parsedInsiden.length === 0 && (item.sumberTemuan || item.uraianTemuan || item.penyebabTemuan)) {
      parsedInsiden = [{
        id: generateId(),
        sumber: item.sumberTemuan || "",
        uraian: item.uraianTemuan || "",
        penyebab: item.penyebabTemuan || ""
      }];
    }
    setInsidenListState(parsedInsiden);

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
      const docId = `${user.unitName}-${tahun}`.replace(/\s+/g, '-').toLowerCase();
      const docRef = doc(db, "mr_konteks", docId);
      
      await setDoc(docRef, {
        unitName: user.unitName,
        tahun,
        sumberData,
        tujuanKL,
        kebijakanList,
        insidenList: insidenListState,
        ...legacyData,
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

  const handleDynamicChange = (id: string, field: keyof KebijakanRow, value: string) => {
    setKebijakanList(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };
  const handleInsidenChange = (id: string, field: keyof InsidenRow, value: string) => {
    setInsidenListState(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
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
                    <TableCell className="text-slate-600 whitespace-pre-wrap">{item.sumberData}</TableCell>
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
              <Textarea id="sumberData" placeholder="Contoh: Renstra, DIPA, dll" value={sumberData} onChange={(e) => setSumberData(e.target.value)} required rows={3} className="min-h-[80px]" />
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
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-lg font-semibold text-slate-800">Kebijakan dan Daftar Pemangku Kepentingan Terkait</Label>
                  <p className="text-sm text-slate-500 mb-2">
                    Tabel ini ditarik otomatis dari master data Sasaran Kinerja. Anda dapat menambah baris baru jika diperlukan.
                  </p>
                </div>
                <Button type="button" onClick={() => setKebijakanList([...kebijakanList, { id: generateId(), sasaran: "", peraturan: "", amanat: "", pihakInternal: "", hubInternal: "", pihakEksternal: "", hubEksternal: "" }])} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" /> Tambah Baris
                </Button>
              </div>
              
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
                      <TableHead className="w-[300px] border-r border-b text-center" colSpan={2}>Stakeholder Eksternal</TableHead>
                      <TableHead className="w-12 border-b text-center align-middle" rowSpan={2}></TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="w-[150px] border-r border-b text-center bg-slate-50">Stakeholder</TableHead>
                      <TableHead className="w-[150px] border-r border-b text-center bg-slate-50">Hubungan</TableHead>
                      <TableHead className="w-[150px] border-r border-b text-center bg-slate-50">Stakeholder</TableHead>
                      <TableHead className="w-[150px] border-b text-center bg-slate-50">Hubungan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kebijakanList.length > 0 ? kebijakanList.map((row, idx) => (
                      <TableRow key={row.id} className="border-b">
                        <TableCell className="border-r text-center align-top p-2">{idx + 1}</TableCell>
                        <TableCell className="border-r align-top p-2">
                          <Textarea 
                            placeholder="Sasaran Kinerja..." 
                            value={row.sasaran}
                            onChange={(e) => handleDynamicChange(row.id, 'sasaran', e.target.value)}
                            className="min-h-[120px] w-full resize-y text-sm"
                          />
                        </TableCell>
                        <TableCell className="border-r align-top p-2">
                          <Textarea 
                            placeholder="Ketik peraturan..." 
                            value={row.peraturan}
                            onChange={(e) => handleDynamicChange(row.id, 'peraturan', e.target.value)}
                            className="min-h-[120px] w-full resize-y text-sm"
                          />
                        </TableCell>
                        <TableCell className="border-r align-top p-2">
                          <Textarea 
                            placeholder="Amanat peraturan..." 
                            value={row.amanat}
                            onChange={(e) => handleDynamicChange(row.id, 'amanat', e.target.value)}
                            className="min-h-[120px] w-full resize-y text-sm"
                          />
                        </TableCell>
                        <TableCell className="border-r align-top p-2">
                          <Textarea 
                            placeholder="Pihak internal..." 
                            value={row.pihakInternal}
                            onChange={(e) => handleDynamicChange(row.id, 'pihakInternal', e.target.value)}
                            className="min-h-[120px] w-full resize-y text-sm"
                          />
                        </TableCell>
                        <TableCell className="border-r align-top p-2">
                          <Textarea 
                            placeholder="Hubungan internal..." 
                            value={row.hubInternal}
                            onChange={(e) => handleDynamicChange(row.id, 'hubInternal', e.target.value)}
                            className="min-h-[120px] w-full resize-y text-sm"
                          />
                        </TableCell>
                        <TableCell className="border-r align-top p-2">
                          <Textarea 
                            placeholder="Pihak eksternal..." 
                            value={row.pihakEksternal}
                            onChange={(e) => handleDynamicChange(row.id, 'pihakEksternal', e.target.value)}
                            className="min-h-[120px] w-full resize-y text-sm"
                          />
                        </TableCell>
                        <TableCell className="border-r align-top p-2">
                          <Textarea 
                            placeholder="Hubungan eksternal..." 
                            value={row.hubEksternal}
                            onChange={(e) => handleDynamicChange(row.id, 'hubEksternal', e.target.value)}
                            className="min-h-[120px] w-full resize-y text-sm"
                          />
                        </TableCell>
                        <TableCell className="align-top p-2 text-center">
                          <Button type="button" variant="ghost" onClick={() => setKebijakanList(kebijakanList.filter(k => k.id !== row.id))} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center h-24 text-slate-500">
                          Belum ada baris kebijakan. Klik "Tambah Baris".
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-800">Insiden / Temuan Sebelumnya</h4>
                <Button type="button" onClick={() => setInsidenListState([...insidenListState, { id: generateId(), sumber: "", uraian: "", penyebab: "" }])} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" /> Tambah Insiden
                </Button>
              </div>
              
              {insidenListState.length > 0 ? insidenListState.map((insiden, idx) => (
                <div key={insiden.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-start p-4 border rounded-lg bg-slate-50 relative">
                  <div className="space-y-2">
                    <Label>Sumber Temuan</Label>
                    <Input 
                      placeholder="Contoh: Audit Internal, LHP BPK..." 
                      value={insiden.sumber}
                      onChange={(e) => handleInsidenChange(insiden.id, 'sumber', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Uraian Temuan</Label>
                    <Textarea 
                      placeholder="Deskripsikan temuan..." 
                      value={insiden.uraian}
                      onChange={(e) => handleInsidenChange(insiden.id, 'uraian', e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Penyebab Temuan</Label>
                    <Textarea 
                      placeholder="Penyebab utama dari temuan..." 
                      value={insiden.penyebab}
                      onChange={(e) => handleInsidenChange(insiden.id, 'penyebab', e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="pt-8">
                    <Button type="button" variant="ghost" onClick={() => setInsidenListState(insidenListState.filter(i => i.id !== insiden.id))} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center border rounded-lg border-dashed text-slate-500">
                  Belum ada insiden / temuan sebelumnya.
                </div>
              )}
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
