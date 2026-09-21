"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Loader2, ShieldCheck, KeyRound, Pencil, Trash2, Mail, Building2, CornerDownRight, ChevronRight, ChevronDown } from "lucide-react";
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

// Firebase imports
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth as mainAuth, db, firebaseConfig } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string; // UID Firebase Auth
  email: string;
  role: string;
  unitName: string;
}

interface UnitData {
  id: string;
  name: string;
  level: string;
}

export default function UsersManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [unitsList, setUnitsList] = useState<UnitData[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setExpandedUnits(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  // States for Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data Form
  const [formData, setFormData] = useState({
    id: "", // Digunakan saat edit
    email: "",
    role: "eselon_2",
    unitName: "",
  });

  // Proteksi rute khusus Admin
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
      // Fetch Users
      const usersRef = collection(db, "users");
      const usersSnap = await getDocs(usersRef);
      const fetchedUsers: UserProfile[] = [];
      usersSnap.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setUsersList(fetchedUsers);

      // Fetch Units (Master Data)
      const unitsRef = collection(db, "units");
      const unitsSnap = await getDocs(unitsRef);
      const fetchedUnits: UnitData[] = [];
      unitsSnap.forEach((doc) => {
        fetchedUnits.push({ id: doc.id, ...doc.data() } as UnitData);
      });
      setUnitsList(fetchedUnits);

    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // BUAT USER BARU
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apps = getApps();
      const secondaryApp = apps.find(app => app.name === "Secondary") || initializeApp(firebaseConfig, "Secondary");
      const secondaryAuth = getAuth(secondaryApp);

      const defaultPassword = "Kemendes123!";
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, defaultPassword);
      const newUid = userCredential.user.uid;

      await setDoc(doc(db, "users", newUid), {
        email: formData.email,
        role: formData.role,
        unitName: formData.unitName,
      });

      await signOut(secondaryAuth);
      
      setFormData({ id: "", email: "", role: "eselon_2", unitName: "" });
      setIsCreateModalOpen(false);
      
      alert(`Berhasil! Pengguna terdaftar dengan sandi sementara: ${defaultPassword}`);
      fetchData();
    } catch (error: any) {
      console.error("Error menambah user:", error);
      alert("Gagal membuat pengguna. Email mungkin sudah terdaftar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // EDIT USER
  const openEditModal = (u: UserProfile) => {
    setFormData({
      id: u.id,
      email: u.email,
      role: u.role,
      unitName: u.unitName
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", formData.id), {
        role: formData.role,
        unitName: formData.unitName,
      });
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Gagal update:", error);
      alert("Gagal memperbarui data pengguna.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // HAPUS USER
  const handleDelete = async (uid: string, email: string) => {
    if (confirm(`Apakah Anda yakin ingin MENCABUT AKSES pengguna ${email}? \n\n(Catatan: Ini akan menghapus peran mereka sehingga tidak bisa lagi melihat data sistem. Akun inti mereka tetap ada di Firebase Console).`)) {
      try {
        await deleteDoc(doc(db, "users", uid));
        fetchData();
      } catch (error) {
        console.error("Gagal menghapus:", error);
        alert("Terjadi kesalahan saat menghapus akses.");
      }
    }
  };

  // RESET PASSWORD
  const handleResetPassword = async (email: string) => {
    if (confirm(`Kirim tautan pemulihan sandi (Reset Password) ke email ${email}?`)) {
      try {
        await sendPasswordResetEmail(mainAuth, email);
        alert(`Berhasil! Tautan reset password telah dikirim ke ${email}.`);
      } catch (error) {
        console.error("Gagal mengirim email reset:", error);
        alert("Gagal mengirim email. Pastikan format email benar.");
      }
    }
  };

  // Handler saat Role diubah (Reset Unit Kerja agar tidak bentrok)
  const handleRoleChange = (newRole: any) => {
    setFormData({
      ...formData,
      role: newRole,
      unitName: newRole === "admin" ? "Kementerian Pusat" : ""
    });
  };

  const filteredUsers = usersList.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.unitName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch(role) {
      case "admin": return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs font-bold">Admin</span>;
      case "eselon_1": return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-semibold">Eselon 1</span>;
      case "eselon_2": return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md text-xs font-semibold">Eselon 2</span>;
      default: return <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-md text-xs">Unknown</span>;
    }
  };

  if (authLoading || user?.role !== "admin") return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Manajemen Pengguna</h2>
          <p className="text-slate-500">Atur role, unit kerja, dan akses pengguna sistem.</p>
        </div>
        
        {/* MODAL TAMBAH USER */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-emerald-600 text-white hover:bg-emerald-700 h-10 py-2 px-4" onClick={() => setFormData({ id: "", email: "", role: "eselon_2", unitName: "" })}>
            <Plus className="mr-2 h-4 w-4" /> Buat Pengguna Baru
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Buat Akun Pegawai</DialogTitle>
                <DialogDescription>Sandi bawaan untuk pengguna baru adalah <strong>Kemendes123!</strong></DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Pengguna *</Label>
                  <Input id="email" type="email" required placeholder="nama@kemendesa.go.id" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Tingkatan Hak Akses (Role) *</Label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger><SelectValue placeholder="Pilih Role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator (Pusat)</SelectItem>
                      <SelectItem value="eselon_1">Unit Kerja Eselon 1</SelectItem>
                      <SelectItem value="eselon_2">Unit Kerja Eselon 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unitName">Nama Unit Kerja *</Label>
                  {formData.role === "admin" ? (
                    <Input id="unitName" required placeholder="Contoh: Pusat" value={formData.unitName} onChange={(e) => setFormData({...formData, unitName: e.target.value})} />
                  ) : (
                    <Select required value={formData.unitName} onValueChange={(val: any) => setFormData({...formData, unitName: val})}>
                      <SelectTrigger><SelectValue placeholder={`Pilih Unit ${formData.role === 'eselon_1' ? 'Eselon 1' : 'Eselon 2'}`} /></SelectTrigger>
                      <SelectContent>
                        {unitsList.filter(u => u.level === formData.role).map((unit) => (
                          <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                        ))}
                        {unitsList.filter(u => u.level === formData.role).length === 0 && (
                          <SelectItem value="kosong" disabled>Belum ada data unit kerja terdaftar.</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mendaftarkan...</> : "Buat Akun"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* MODAL EDIT USER */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Data Pengguna</DialogTitle>
                <DialogDescription>Email <strong>{formData.email}</strong></DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="role_edit">Ubah Role *</Label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger><SelectValue placeholder="Pilih Role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator (Pusat)</SelectItem>
                      <SelectItem value="eselon_1">Unit Kerja Eselon 1</SelectItem>
                      <SelectItem value="eselon_2">Unit Kerja Eselon 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unitName_edit">Ubah Unit Kerja *</Label>
                  {formData.role === "admin" ? (
                    <Input id="unitName_edit" required value={formData.unitName} onChange={(e) => setFormData({...formData, unitName: e.target.value})} />
                  ) : (
                    <Select required value={formData.unitName} onValueChange={(val: any) => setFormData({...formData, unitName: val})}>
                      <SelectTrigger><SelectValue placeholder={`Pilih Unit ${formData.role === 'eselon_1' ? 'Eselon 1' : 'Eselon 2'}`} /></SelectTrigger>
                      <SelectContent>
                        {unitsList.filter(u => u.level === formData.role).map((unit) => (
                          <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pencarian */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Cari email atau unit kerja..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabel Data */}
      <div className="rounded-md border bg-white overflow-x-auto pb-16">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[250px]">Akun (Email)</TableHead>
              <TableHead>Role / Hak Akses</TableHead>
              <TableHead>Unit Kerja</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  <div className="flex justify-center items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat data...</div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length > 0 ? (
              (() => {
                const rows: React.ReactNode[] = [];
                
                const renderUserRow = (u: any, indentClass: string) => (
                  <TableRow key={u.id} className={indentClass.includes('bg-') ? indentClass.split(' ').find(cls => cls.startsWith('bg-')) : ''}>
                    <TableCell className={`font-medium ${indentClass.replace(/bg-[^\s]+/g, '')}`}>
                      <div className="flex items-start gap-2 mt-0.5">
                        {u.role === "admin" ? <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" /> : <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />}
                        <span className="whitespace-normal break-words max-w-[300px]">{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell><span className="whitespace-normal break-words max-w-[400px] block">{u.unitName}</span></TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(u)} title="Edit Akses & Unit">
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleResetPassword(u.email)} title="Kirim Reset Password">
                          <Mail className="h-4 w-4 text-amber-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id, u.email)} title="Hapus Akses">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );

                if (searchTerm) {
                  filteredUsers.forEach(u => rows.push(renderUserRow(u, "")));
                } else {
                  // Admin / Kementerian (No Eselon 1 Parent)
                  const admins = filteredUsers.filter(u => u.role === "admin" || u.role === "kementerian" || !u.unitId || u.unitId === "none");
                  admins.forEach(u => rows.push(renderUserRow(u, "")));
                  
                  const eselon1Units = unitsList.filter(u => u.level === 'eselon_1');
                  eselon1Units.forEach(e1 => {
                    // Check if there are any users in this E1 or its E2 children
                    const e1Users = filteredUsers.filter(u => u.unitId === e1.id);
                    const e2Units = unitsList.filter(u => u.level === 'eselon_2' && u.parentId === e1.id);
                    const e2UserCount = filteredUsers.filter(u => e2Units.some(e2 => e2.id === u.unitId)).length;
                    
                    if (e1Users.length > 0 || e2UserCount > 0) {
                      rows.push(
                        <TableRow key={e1.id} className="bg-slate-50/50 hover:bg-slate-50 border-b-2 cursor-pointer" onClick={(e) => toggleExpand(e1.id, e)}>
                          <TableCell colSpan={4} className="font-bold text-slate-800">
                            <div className="flex items-start gap-2">
                              {expandedUnits[e1.id] ? <ChevronDown className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" /> : <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />}
                              <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="whitespace-normal break-words max-w-[600px]">{e1.name}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                      
                      if (expandedUnits[e1.id]) {
                        e1Users.forEach(u => rows.push(renderUserRow(u, "pl-8 bg-slate-50/30")));
                        
                        e2Units.forEach(e2 => {
                          const e2Users = filteredUsers.filter(u => u.unitId === e2.id);
                          if (e2Users.length > 0) {
                            rows.push(
                              <TableRow key={e2.id} className="bg-slate-50 hover:bg-slate-100 cursor-pointer border-t border-slate-100" onClick={(e) => toggleExpand(e2.id, e)}>
                                <TableCell colSpan={4} className="font-semibold text-slate-700 pl-8">
                                  <div className="flex items-start gap-2">
                                    {expandedUnits[e2.id] ? <ChevronDown className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" /> : <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />}
                                    <CornerDownRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    <span className="whitespace-normal break-words max-w-[600px]">{e2.name}</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                            
                            if (expandedUnits[e2.id]) {
                              e2Users.forEach(u => rows.push(renderUserRow(u, "pl-14 bg-slate-50/70")));
                            }
                          }
                        });
                      }
                    }
                  });
                  
                  // Users that belong to units that are not E1 or E2, or unknown
                  const matchedUserIds = new Set([
                    ...admins.map(u => u.id),
                    ...eselon1Units.flatMap(e1 => filteredUsers.filter(u => u.unitId === e1.id).map(u => u.id)),
                    ...unitsList.filter(u => u.level === 'eselon_2').flatMap(e2 => filteredUsers.filter(u => u.unitId === e2.id).map(u => u.id))
                  ]);
                  
                  const orphanedUsers = filteredUsers.filter(u => !matchedUserIds.has(u.id));
                  if (orphanedUsers.length > 0) {
                    rows.push(
                      <TableRow key="orphaned-group" className="bg-orange-50/50">
                        <TableCell colSpan={4} className="font-bold text-orange-800">
                          Lainnya (Unit Kerja Tidak Dikenal/Terhapus)
                        </TableCell>
                      </TableRow>
                    );
                    orphanedUsers.forEach(u => rows.push(renderUserRow(u, "pl-8 bg-orange-50/30")));
                  }
                }
                return rows;
              })()
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  Belum ada data pengaturan pengguna.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
