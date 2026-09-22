"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Loader2, Pencil, Trash2, Target, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface Indikator {
  name: string;
  target: string;
  satuan?: string;
}

interface SasaranProgram {
  id: string;
  strategisId: string;
  unitName: string;
  name: string; // Sasaran Program
  ikp?: string; // Legacy
  target?: string; // Legacy
  indikators?: Indikator[];
}

interface SasaranStrategis {
  id: string;
  name: string;
}

export default function SasaranProgramPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [dataList, setDataList] = useState<SasaranProgram[]>([]);
  const [strategisList, setStrategisList] = useState<SasaranStrategis[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

  const [formData, setFormData] = useState<SasaranProgram>({
    id: "",
    strategisId: "",
    unitName: "",
    name: "",
    indikators: [{ name: "", target: "", satuan: "" }]
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== "admin" && user.role !== "eselon_1")) {
        router.push("/dashboard");
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Sasaran Strategis untuk dropdown & relasi
      const stratRef = collection(db, "sasaran_strategis");
      const stratSnap = await getDocs(stratRef);
      const fetchedStrat: SasaranStrategis[] = [];
      stratSnap.forEach((doc) => {
        fetchedStrat.push({ id: doc.id, name: doc.data().name });
      });
      setStrategisList(fetchedStrat);

      // 2. Fetch Sasaran Program
      const colRef = collection(db, "sasaran_program");
      const snapshot = await getDocs(colRef);
      const fetchedProg: SasaranProgram[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (user?.role === "admin" || data.unitName === user?.unitName) {
          fetchedProg.push({ id: doc.id, ...data } as SasaranProgram);
        }
      });
      setDataList(fetchedProg);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      toast.error("Gagal mengambil data dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({ 
      id: "", 
      strategisId: "", 
      unitName: user?.unitName || "", 
      name: "", 
      indikators: [{ name: "", target: "", satuan: "" }]
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SasaranProgram) => {
    const indikators = item.indikators && item.indikators.length > 0 
      ? item.indikators 
      : [{ name: item.ikp || "", target: item.target || "", satuan: "" }];
      
    setFormData({ ...item, indikators });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.strategisId) {
      toast.error("Harap pilih Induk Sasaran Strategis!");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const dataToSave = {
        strategisId: formData.strategisId,
        unitName: formData.unitName,
        name: formData.name,
        indikators: formData.indikators || [],
      };

      if (isEditMode && formData.id) {
        await updateDoc(doc(db, "sasaran_program", formData.id), dataToSave);
        toast.success("Data berhasil diperbarui!");
      } else {
        await addDoc(collection(db, "sasaran_program"), dataToSave);
        toast.success("Data baru berhasil ditambahkan!");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error menyimpan data:", error);
      toast.error("Gagal menyimpan data Sasaran Program.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "sasaran_program", deleteTarget.id));
      toast.success("Sasaran Program berhasil dihapus!");
      fetchData();
    } catch (error) {
      console.error("Gagal menghapus:", error);
      toast.error("Gagal menghapus data.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const getStrategisName = (id: string) => {
    const strat = strategisList.find(s => s.id === id);
    return strat ? strat.name : "Tidak ditemukan / Terhapus";
  };

  const filteredData = dataList.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ikp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user?.role === "admin" && item.unitName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (authLoading || !user || (user.role !== "admin" && user.role !== "eselon_1")) return null;

  return (
    <div className="space-y-4">
      {/* ALERT DIALOG HAPUS */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus Sasaran Program <strong>{deleteTarget?.name}</strong>?
              <br/><br/>
              Semua data turunan (Eselon 2) mungkin akan kehilangan referensi ke program ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Hapus Data</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Sasaran Program (Eselon 1)</h2>
          <p className="text-slate-500">
            {user.role === "admin" 
              ? "Pantau seluruh Sasaran Program Eselon 1."
              : `Kelola Sasaran Program untuk ${user.unitName}`}
          </p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          {user.role === "eselon_1" && (
            <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-emerald-600 text-white hover:bg-emerald-700 h-10 py-2 px-4" onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" /> Input Sasaran Program
            </DialogTrigger>
          )}
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit Sasaran Program" : "Tambah Sasaran Program"}</DialogTitle>
                <DialogDescription>
                  Hubungkan dengan Sasaran Strategis Kementerian.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="strategisId">Induk Sasaran Strategis (Pusat) *</Label>
                  <Select 
                    value={formData.strategisId} 
                    onValueChange={(val) => setFormData({...formData, strategisId: val})}
                  >
                    <SelectTrigger>
                      <span className="truncate text-left w-full">
                        {formData.strategisId ? getStrategisName(formData.strategisId) : "Pilih Sasaran Strategis"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {strategisList.length === 0 ? (
                        <SelectItem value="empty" disabled>Belum ada Sasaran Strategis dari Pusat.</SelectItem>
                      ) : (
                        strategisList.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Sasaran Program *</Label>
                  <Input 
                    id="name" 
                    required
                    placeholder="Contoh: Terwujudnya regulasi desa unggul" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Indikator Sasaran Program (IKP) & Target</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFormData({...formData, indikators: [...(formData.indikators || []), { name: "", target: "", satuan: "" }]})}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Tambah Indikator
                    </Button>
                  </div>
                  
                  {formData.indikators?.map((ind, index) => (
                    <div key={index} className="grid gap-2 p-3 border rounded-md relative bg-slate-50">
                      <div className="absolute right-2 top-2">
                        {formData.indikators!.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              const newInds = [...formData.indikators!];
                              newInds.splice(index, 1);
                              setFormData({...formData, indikators: newInds});
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-1.5 pr-8">
                        <Label className="text-xs">Indikator {index + 1} *</Label>
                        <Input 
                          required
                          placeholder="Contoh: Jumlah regulasi yang diterbitkan" 
                          value={ind.name}
                          onChange={(e) => {
                            const newInds = [...formData.indikators!];
                            newInds[index].name = e.target.value;
                            setFormData({...formData, indikators: newInds});
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 pr-8">
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Target {index + 1} *</Label>
                          <Input 
                            required
                            placeholder="Contoh: 15 Regulasi"
                            value={ind.target}
                            onChange={(e) => {
                              const newInds = [...formData.indikators!];
                              newInds[index].target = e.target.value;
                              setFormData({...formData, indikators: newInds});
                            }}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Satuan *</Label>
                          <Input 
                            required
                            placeholder="Satuan (Cth: Dokumen)"
                            value={ind.satuan || ""}
                            onChange={(e) => {
                              const newInds = [...formData.indikators!];
                              newInds[index].satuan = e.target.value;
                              setFormData({...formData, indikators: newInds});
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan Data"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Cari program / IKP..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-x-auto pb-8">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[250px]">Sasaran Program</TableHead>
              <TableHead>Cascading (Induk Strategis)</TableHead>
              {user.role === "admin" && <TableHead>Unit Eselon 1</TableHead>}
              <TableHead>Indikator Sasaran (IKP)</TableHead>
              <TableHead>Target</TableHead>
              {user.role === "eselon_1" && <TableHead className="text-center w-[120px]">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  <div className="flex justify-center items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat data...</div>
                </TableCell>
              </TableRow>
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-slate-800">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs leading-relaxed">
                    <div className="flex items-start gap-1">
                      <LinkIcon className="w-3 h-3 mt-0.5 text-blue-500 shrink-0" />
                      {getStrategisName(item.strategisId)}
                    </div>
                  </TableCell>
                  {user.role === "admin" && (
                    <TableCell>
                      <span className="px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {item.unitName}
                      </span>
                    </TableCell>
                  )}
                  <TableCell className="text-slate-600 align-top">
                    {item.indikators && item.indikators.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-2">
                        {item.indikators.map((ind, i) => <li key={i}>{ind.name}</li>)}
                      </ul>
                    ) : (
                      item.ikp
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {item.indikators && item.indikators.length > 0 ? (
                      <ul className="space-y-2">
                        {item.indikators.map((ind, i) => (
                          <li key={i}>
                            <span className="px-2 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 inline-block">
                              {ind.target} {ind.satuan || ""}
                              </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="px-2 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {item.target}
                      </span>
                    )}
                  </TableCell>
                  {user.role === "eselon_1" && (
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)} title="Edit">
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({id: item.id, name: item.name})} title="Hapus">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  Belum ada data Sasaran Program.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
