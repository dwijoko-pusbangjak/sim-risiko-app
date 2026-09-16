"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Loader2, Pencil, Trash2, Target } from "lucide-react";
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

import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface Indikator {
  name: string;
  target: string;
}

interface SasaranStrategis {
  id: string;
  name: string; // Sasaran Strategis
  iku?: string; // Legacy
  target?: string; // Legacy
  indikators?: Indikator[];
}

export default function SasaranStrategisPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [dataList, setDataList] = useState<SasaranStrategis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

  const [formData, setFormData] = useState<SasaranStrategis>({
    id: "",
    name: "",
    indikators: [{ name: "", target: "" }]
  });

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== "admin") {
        router.push("/dashboard");
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const colRef = collection(db, "sasaran_strategis");
      const snapshot = await getDocs(colRef);
      const fetched: SasaranStrategis[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as SasaranStrategis);
      });
      setDataList(fetched);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      toast.error("Gagal mengambil data dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({ id: "", name: "", indikators: [{ name: "", target: "" }] });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SasaranStrategis) => {
    // Migration for old data
    const indikators = item.indikators && item.indikators.length > 0 
      ? item.indikators 
      : [{ name: item.iku || "", target: item.target || "" }];
      
    setFormData({ ...item, indikators });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dataToSave = {
        name: formData.name,
        indikators: formData.indikators || [],
      };

      if (isEditMode && formData.id) {
        await updateDoc(doc(db, "sasaran_strategis", formData.id), dataToSave);
        toast.success("Data berhasil diperbarui!");
      } else {
        await addDoc(collection(db, "sasaran_strategis"), dataToSave);
        toast.success("Data baru berhasil ditambahkan!");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error menyimpan data:", error);
      toast.error("Gagal menyimpan data Sasaran Strategis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "sasaran_strategis", deleteTarget.id));
      toast.success("Sasaran Strategis berhasil dihapus!");
      fetchData();
    } catch (error) {
      console.error("Gagal menghapus:", error);
      toast.error("Gagal menghapus data.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredData = dataList.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.iku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || user?.role !== "admin") return null;

  return (
    <div className="space-y-4">
      {/* ALERT DIALOG HAPUS */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus Sasaran Strategis <strong>{deleteTarget?.name}</strong>?
              <br/><br/>
              Penghapusan ini bersifat permanen dan dapat memutus referensi data Sasaran Program Eselon 1 yang terkait.
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Sasaran Strategis Kementerian</h2>
          <p className="text-slate-500">Pusat data Indikator Kinerja Utama tingkat Kementerian.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-emerald-600 text-white hover:bg-emerald-700 h-10 py-2 px-4" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" /> Input Sasaran Strategis
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit Sasaran Strategis" : "Tambah Sasaran Strategis"}</DialogTitle>
                <DialogDescription>
                  Masukkan rincian sasaran, IKU, dan nilai target capaian.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Sasaran Strategis *</Label>
                  <Input 
                    id="name" 
                    required
                    placeholder="Contoh: Meningkatnya tata kelola kementerian" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Indikator Kinerja Utama & Target</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFormData({...formData, indikators: [...(formData.indikators || []), { name: "", target: "" }]})}
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
                          placeholder="Contoh: Nilai SAKIP Kementerian" 
                          value={ind.name}
                          onChange={(e) => {
                            const newInds = [...formData.indikators!];
                            newInds[index].name = e.target.value;
                            setFormData({...formData, indikators: newInds});
                          }}
                        />
                      </div>
                      <div className="grid gap-1.5 pr-8">
                        <Label className="text-xs">Target {index + 1} *</Label>
                        <Input 
                          required
                          placeholder="Contoh: 85.50 (Sangat Baik)" 
                          value={ind.target}
                          onChange={(e) => {
                            const newInds = [...formData.indikators!];
                            newInds[index].target = e.target.value;
                            setFormData({...formData, indikators: newInds});
                          }}
                        />
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
            placeholder="Cari sasaran atau IKU..." 
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
              <TableHead className="w-[300px]">Sasaran Strategis</TableHead>
              <TableHead>Indikator Kinerja Utama (IKU)</TableHead>
              <TableHead>Target</TableHead>
              <TableHead className="text-center w-[120px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  <div className="flex justify-center items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat data...</div>
                </TableCell>
              </TableRow>
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-slate-800">
                    <div className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-purple-600 mt-1 shrink-0" />
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 align-top">
                    {item.indikators && item.indikators.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-2">
                        {item.indikators.map((ind, i) => <li key={i}>{ind.name}</li>)}
                      </ul>
                    ) : (
                      item.iku
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {item.indikators && item.indikators.length > 0 ? (
                      <ul className="space-y-2">
                        {item.indikators.map((ind, i) => (
                          <li key={i}>
                            <span className="px-2 py-1 rounded-md text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-100 inline-block">
                              {ind.target}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="px-2 py-1 rounded-md text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {item.target}
                      </span>
                    )}
                  </TableCell>
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  Belum ada data Sasaran Strategis.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
