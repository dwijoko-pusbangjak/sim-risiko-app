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

interface SasaranKegiatan {
  id: string;
  programId: string;
  unitName: string;
  name: string; // Sasaran Kegiatan
  ikk?: string; // Legacy
  target?: string; // Legacy
  indikators?: Indikator[];
}

interface SasaranProgram {
  id: string;
  name: string;
  unitName: string;
}

export default function SasaranKegiatanPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [dataList, setDataList] = useState<SasaranKegiatan[]>([]);
  const [programList, setProgramList] = useState<SasaranProgram[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

  const [formData, setFormData] = useState<SasaranKegiatan>({
    id: "",
    programId: "",
    unitName: "",
    name: "",
    indikators: [{ name: "", target: "", satuan: "" }]
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== "admin" && user.role !== "eselon_2")) {
        router.push("/dashboard");
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let parentEselon1Name = "";

      if (user?.role === "eselon_2" && user.unitName) {
        const unitsRef = collection(db, "units");
        const unitsSnap = await getDocs(unitsRef);
        let myUnitId = "";
        let parentId = "";
        
        unitsSnap.forEach(u => {
          if (u.data().name === user.unitName && u.data().level === "eselon_2") {
            myUnitId = u.id;
            parentId = u.data().parentId;
          }
        });

        if (parentId) {
          unitsSnap.forEach(u => {
            if (u.id === parentId) {
              parentEselon1Name = u.data().name;
            }
          });
        }
      }

      // 1. Fetch Sasaran Program
      const progRef = collection(db, "sasaran_program");
      const progSnap = await getDocs(progRef);
      const fetchedProg: SasaranProgram[] = [];
      progSnap.forEach((doc) => {
        const data = doc.data();
        if (user?.role === "admin" || (user?.role === "eselon_2" && data.unitName === parentEselon1Name)) {
          fetchedProg.push({ id: doc.id, name: data.name, unitName: data.unitName });
        }
      });
      setProgramList(fetchedProg);

      // 2. Fetch Sasaran Kegiatan
      const colRef = collection(db, "sasaran_kegiatan");
      const snapshot = await getDocs(colRef);
      const fetchedKegiatan: SasaranKegiatan[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (user?.role === "admin" || data.unitName === user?.unitName) {
          fetchedKegiatan.push({ ...data, id: doc.id } as SasaranKegiatan);
        }
      });
      setDataList(fetchedKegiatan);

    } catch (error) {
      console.error("Gagal mengambil data:", error);
      toast.error("Gagal memuat data dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({ 
      id: "", 
      programId: "", 
      unitName: user?.unitName || "", 
      name: "", 
      indikators: [{ name: "", target: "", satuan: "" }]
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SasaranKegiatan) => {
    const indikators = item.indikators && item.indikators.length > 0 
      ? item.indikators 
      : [{ name: item.ikk || "", target: item.target || "", satuan: "" }];
      
    setFormData({ ...item, indikators });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.programId) {
      toast.error("Harap pilih Induk Sasaran Program!");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const dataToSave = {
        programId: formData.programId,
        unitName: formData.unitName,
        name: formData.name,
        indikators: formData.indikators || [],
      };

      if (isEditMode && formData.id) {
        await updateDoc(doc(db, "sasaran_kegiatan", formData.id), dataToSave);
        toast.success("Data Sasaran Kegiatan berhasil diperbarui!");
      } else {
        await addDoc(collection(db, "sasaran_kegiatan"), dataToSave);
        toast.success("Sasaran Kegiatan baru berhasil ditambahkan!");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error menyimpan data:", error);
      toast.error("Gagal menyimpan data Sasaran Kegiatan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "sasaran_kegiatan", deleteTarget.id));
      toast.success("Sasaran Kegiatan berhasil dihapus!");
      fetchData();
    } catch (error) {
      console.error("Gagal menghapus:", error);
      toast.error("Gagal menghapus data.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const getProgramName = (id: string) => {
    const prog = programList.find(p => p.id === id);
    return prog ? prog.name : "Tidak ditemukan / Terhapus";
  };

  const filteredData = dataList.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ikk?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user?.role === "admin" && item.unitName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (authLoading || !user || (user.role !== "admin" && user.role !== "eselon_2")) return null;

  return (
    <div className="space-y-4">
      {/* ALERT DIALOG HAPUS */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus Sasaran Kegiatan <strong>{deleteTarget?.name}</strong>?
              <br/><br/>
              Tindakan ini tidak dapat dibatalkan.
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Sasaran Kegiatan (Eselon 2)</h2>
          <p className="text-slate-500">
            {user.role === "admin" 
              ? "Pantau seluruh Sasaran Kegiatan Eselon 2."
              : `Kelola Sasaran Kegiatan untuk ${user.unitName}`}
          </p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          {user.role === "eselon_2" && (
            <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-emerald-600 text-white hover:bg-emerald-700 h-10 py-2 px-4" onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" /> Input Sasaran Kegiatan
            </DialogTrigger>
          )}
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit Sasaran Kegiatan" : "Tambah Sasaran Kegiatan"}</DialogTitle>
                <DialogDescription>
                  Hubungkan dengan Sasaran Program dari Unit Eselon 1 Induk Anda.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="programId">Induk Sasaran Program (Eselon 1) *</Label>
                  <Select 
                    value={formData.programId} 
                    onValueChange={(val) => setFormData({...formData, programId: val})}
                  >
                    <SelectTrigger>
                      <span className="truncate text-left w-full">
                        {formData.programId ? getProgramName(formData.programId) : "Pilih Sasaran Program"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {programList.length === 0 ? (
                        <SelectItem value="empty" disabled>Belum ada program dari Eselon 1.</SelectItem>
                      ) : (
                        programList.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Sasaran Kegiatan *</Label>
                  <Input 
                    id="name" 
                    required
                    placeholder="Contoh: Penyusunan draft regulasi X" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Indikator Sasaran Kegiatan (IKK) & Target</Label>
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
                          placeholder="Contoh: Dokumen draft yang disetujui" 
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
                            placeholder="Contoh: 1 Dokumen"
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
            placeholder="Cari kegiatan / IKK..." 
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
              <TableHead className="w-[250px]">Sasaran Kegiatan</TableHead>
              <TableHead>Cascading (Induk Program)</TableHead>
              {user.role === "admin" && <TableHead>Unit Eselon 2</TableHead>}
              <TableHead>Indikator Sasaran (IKK)</TableHead>
              <TableHead>Target</TableHead>
              {user.role === "eselon_2" && <TableHead className="text-center w-[120px]">Aksi</TableHead>}
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
                      <LinkIcon className="w-3 h-3 mt-0.5 text-emerald-500 shrink-0" />
                      {getProgramName(item.programId)}
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
                      item.ikk
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
                  {user.role === "eselon_2" && (
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
                  Belum ada data Sasaran Kegiatan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
