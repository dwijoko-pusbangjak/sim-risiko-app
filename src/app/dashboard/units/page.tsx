"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Loader2, Pencil, Trash2, Building2, CornerDownRight } from "lucide-react";
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

import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface UnitData {
  id: string;
  name: string;
  level: "eselon_1" | "eselon_2";
  parentId: string | null;
  headName?: string;
  headNip?: string;
}

export default function UnitsManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [units, setUnits] = useState<UnitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // States for Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data Form
  const [formData, setFormData] = useState<{ id?: string, name: string, level: string, parentId: string, headName: string, headNip: string }>({
    name: "",
    level: "eselon_1",
    parentId: "none",
    headName: "",
    headNip: ""
  });

  // Proteksi Admin
  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== "admin") {
        router.push("/dashboard");
      } else {
        fetchUnits();
      }
    }
  }, [user, authLoading, router]);

  const fetchUnits = async () => {
    setIsLoading(true);
    try {
      const unitsRef = collection(db, "units");
      const snapshot = await getDocs(unitsRef);
      const fetched: UnitData[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as UnitData);
      });
      // Sort Eselon 1 first, then Eselon 2
      fetched.sort((a, b) => a.level.localeCompare(b.level));
      setUnits(fetched);
    } catch (error) {
      console.error("Gagal mengambil data unit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const eselon1List = units.filter(u => u.level === "eselon_1");

  const handleOpenCreate = () => {
    setFormData({ name: "", level: "eselon_1", parentId: "none", headName: "", headNip: "" });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (unit: UnitData) => {
    setFormData({
      id: unit.id,
      name: unit.name,
      level: unit.level,
      parentId: unit.parentId || "none",
      headName: unit.headName || "",
      headNip: unit.headNip || ""
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dataToSave = {
        name: formData.name,
        level: formData.level,
        parentId: formData.level === "eselon_2" ? formData.parentId : null,
        headName: formData.headName,
        headNip: formData.headNip,
      };

      if (formData.level === "eselon_2" && dataToSave.parentId === "none") {
        alert("Pilih Induk Eselon 1 untuk Unit Eselon 2 ini.");
        setIsSubmitting(false);
        return;
      }

      if (isEditMode && formData.id) {
        await updateDoc(doc(db, "units", formData.id), dataToSave);
      } else {
        await addDoc(collection(db, "units"), dataToSave);
      }

      setIsModalOpen(false);
      fetchUnits();
    } catch (error) {
      console.error("Error menyimpan unit:", error);
      alert("Gagal menyimpan data unit kerja.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    // Cek apakah unit ini punya anak (jika Eselon 1)
    const hasChildren = units.some(u => u.parentId === id);
    if (hasChildren) {
      alert("Tidak dapat menghapus unit ini karena masih memiliki unit Eselon 2 di bawahnya. Hapus atau pindahkan unit Eselon 2 terlebih dahulu.");
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus unit kerja: ${name}?`)) {
      try {
        await deleteDoc(doc(db, "units", id));
        fetchUnits();
      } catch (error) {
        console.error("Gagal menghapus:", error);
        alert("Gagal menghapus data unit.");
      }
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return "-";
    const parent = units.find(u => u.id === parentId);
    return parent ? parent.name : "-";
  };

  const filteredUnits = units.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || user?.role !== "admin") return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Manajemen Unit Kerja</h2>
          <p className="text-slate-500">Atur hierarki Eselon 1 dan Eselon 2 di lingkungan Kementerian.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-emerald-600 text-white hover:bg-emerald-700 h-10 py-2 px-4" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Unit Kerja
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit Unit Kerja" : "Tambah Unit Kerja Baru"}</DialogTitle>
                <DialogDescription>
                  Masukkan nama unit dan pilih level Eselon.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Unit Kerja *</Label>
                  <Input 
                    id="name" 
                    required
                    placeholder="Contoh: Ditjen Pembangunan Desa" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="level">Tingkat Eselon *</Label>
                  <Select 
                    value={formData.level} 
                    onValueChange={(val) => setFormData({...formData, level: val})}
                  >
                    <SelectTrigger>
                      {formData.level === "eselon_1" ? "Eselon 1 (Induk)" : 
                       formData.level === "eselon_2" ? "Eselon 2 (Sub-Unit)" : 
                       <span className="text-slate-500">Pilih Eselon</span>}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eselon_1">Eselon 1 (Induk)</SelectItem>
                      <SelectItem value="eselon_2">Eselon 2 (Sub-Unit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.level === "eselon_2" && (
                  <div className="grid gap-2">
                    <Label htmlFor="parentId">Induk Eselon 1 *</Label>
                    <Select 
                      value={formData.parentId} 
                      onValueChange={(val) => setFormData({...formData, parentId: val})}
                    >
                      <SelectTrigger>
                        {formData.parentId && formData.parentId !== "none" 
                          ? <span>{eselon1List.find(e => e.id === formData.parentId)?.name || "Induk tidak ditemukan"}</span>
                          : <span className="text-slate-500">Pilih Induk Eselon 1</span>
                        }
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" disabled>-- Pilih Induk Unit --</SelectItem>
                        {eselon1List.map(e1 => (
                          <SelectItem key={e1.id} value={e1.id}>{e1.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="headName">Nama Pimpinan Unit Kerja</Label>
                  <Input 
                    id="headName" 
                    placeholder="Contoh: Dr. Budi Santoso" 
                    value={formData.headName}
                    onChange={(e) => setFormData({...formData, headName: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="headNip">NIP Pimpinan</Label>
                  <Input 
                    id="headNip" 
                    placeholder="Contoh: 198012312005011002" 
                    value={formData.headNip}
                    onChange={(e) => setFormData({...formData, headNip: e.target.value})}
                  />
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
            placeholder="Cari nama unit..." 
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
              <TableHead className="w-[300px]">Nama Unit Kerja</TableHead>
              <TableHead>Pimpinan Unit</TableHead>
              <TableHead>Tingkat Eselon</TableHead>
              <TableHead>Induk (Eselon 1)</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  <div className="flex justify-center items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat data...</div>
                </TableCell>
              </TableRow>
            ) : units.length > 0 ? (
              (() => {
                const rows: JSX.Element[] = [];
                // Jika sedang mencari, tampilkan flat list. Jika tidak, tampilkan Tree hierarki.
                if (searchTerm) {
                  if (filteredUnits.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                          Unit kerja tidak ditemukan.
                        </TableCell>
                      </TableRow>
                    );
                  }
                  filteredUnits.forEach(u => {
                    rows.push(
                      <TableRow key={u.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Building2 className={`w-4 h-4 ${u.level === 'eselon_1' ? 'text-emerald-600' : 'text-slate-400'}`} />
                          {u.name}
                        </TableCell>
                        <TableCell>
                          {u.headName ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-700">{u.headName}</span>
                              <span className="text-xs text-slate-500">{u.headNip || '-'}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Belum diatur</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${u.level === 'eselon_1' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                            {u.level === 'eselon_1' ? 'Eselon 1' : 'Eselon 2'}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">{getParentName(u.parentId)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(u)} title="Edit Unit">
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id, u.name)} title="Hapus Unit">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  });
                } else {
                  // Mode Tree Hierarki
                  const eselon1List = units.filter(u => u.level === 'eselon_1');
                  eselon1List.forEach(e1 => {
                    // Push Eselon 1 Row
                    rows.push(
                      <TableRow key={e1.id} className="bg-slate-50/50 hover:bg-slate-50 border-b-2">
                        <TableCell className="font-bold flex items-center gap-2 text-slate-800">
                          <Building2 className="w-4 h-4 text-emerald-600" />
                          {e1.name}
                        </TableCell>
                        <TableCell>
                          {e1.headName ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-800">{e1.headName}</span>
                              <span className="text-xs text-slate-500">{e1.headNip || '-'}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Belum diatur</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
                            Eselon 1
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">-</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(e1)} title="Edit Unit">
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(e1.id, e1.name)} title="Hapus Unit">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );

                    // Cari anak (Eselon 2)
                    const children = units.filter(u => u.level === 'eselon_2' && u.parentId === e1.id);
                    children.forEach(e2 => {
                      rows.push(
                        <TableRow key={e2.id}>
                          <TableCell className="font-medium flex items-center gap-2 pl-8 text-slate-600">
                            <CornerDownRight className="w-4 h-4 text-slate-400" />
                            {e2.name}
                          </TableCell>
                          <TableCell>
                            {e2.headName ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-700">{e2.headName}</span>
                                <span className="text-xs text-slate-500">{e2.headNip || '-'}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Belum diatur</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                              Eselon 2
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">{e1.name}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(e2)} title="Edit Unit">
                                <Pencil className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(e2.id, e2.name)} title="Hapus Unit">
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  });
                }
                return rows;
              })()
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  Belum ada master data unit kerja.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
