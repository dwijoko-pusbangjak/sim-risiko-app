"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { logActivity } from "@/lib/logger";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  FileText,
  UploadCloud,
  Download,
  Eye,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  RefreshCw,
  FileCheck,
  ShieldAlert,
  Calendar,
  Sparkles,
  X,
  AlertTriangle,
  Info,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
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

export interface Peraturan {
  id: string;
  nomor: string;
  nama: string;
  jenis?: string;
  tahun?: string;
  status: "berlaku" | "tidak_berlaku";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  keterangan?: string;
  storagePath?: string;
  createdAt?: string;
  createdBy?: string;
  createdByName?: string;
  updatedAt?: string;
}

const JENIS_PERATURAN_OPTIONS = [
  "Undang-Undang (UU)",
  "Peraturan Pemerintah (PP)",
  "Peraturan Presiden (Perpres)",
  "Peraturan Menteri PANRB",
  "Peraturan Menteri Desa PDT",
  "Keputusan Menteri Desa PDT",
  "Surat Edaran (SE)",
  "Pedoman Teknis / Juknis",
  "Peraturan Lainnya"
];

// Data Default Standar Manajemen Risiko Kemendesa
const DEFAULT_PERATURAN_LIST = [
  {
    nomor: "Permenpan RB No. 5 Tahun 2020",
    nama: "Petunjuk Pelaksanaan Manajemen Risiko di Lingkungan Instansi Pemerintah",
    jenis: "Peraturan Menteri PANRB",
    tahun: "2020",
    status: "berlaku" as const,
    keterangan: "Pedoman baku penerapan Manajemen Risiko SPBE dan SPIP bagi seluruh instansi pemerintah pusat dan daerah.",
    fileUrl: "https://jdih.menpan.go.id/dokumen-hukum/permenpan-rb/peraturan-menteri-pendayagunaan-aparatur-negara-dan-reformasi-birokrasi-nomor-5-tahun-2020",
    fileName: "PermenpanRB_No_5_Tahun_2020.pdf"
  },
  {
    nomor: "PP No. 60 Tahun 2008",
    nama: "Sistem Pengendalian Intern Pemerintah (SPIP)",
    jenis: "Peraturan Pemerintah (PP)",
    tahun: "2008",
    status: "berlaku" as const,
    keterangan: "Landasan utama pelaksanaan pengawasan intern pemerintah dan penilaian maturitas penyelenggaraan SPIP terintegrasi.",
    fileUrl: "https://peraturan.bpk.go.id/Details/4826/pp-no-60-tahun-2008",
    fileName: "PP_No_60_Tahun_2008_SPIP.pdf"
  },
  {
    nomor: "UU No. 6 Tahun 2014",
    nama: "Tentang Desa (beserta perubahannya UU No. 3 Tahun 2024)",
    jenis: "Undang-Undang (UU)",
    tahun: "2014",
    status: "berlaku" as const,
    keterangan: "Regulasi induk tata kelola pemerintahan desa, keuangan desa, dan pembangunan kawasan perdesaan.",
    fileUrl: "https://peraturan.bpk.go.id/Details/38580/uu-no-6-tahun-2014",
    fileName: "UU_No_6_Tahun_2014_Tentang_Desa.pdf"
  },
  {
    nomor: "Permendesa PDTT No. 15 Tahun 2023",
    nama: "Pedoman Penerapan Manajemen Risiko di Lingkungan Kementerian Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi",
    jenis: "Peraturan Menteri Desa PDT",
    tahun: "2023",
    status: "berlaku" as const,
    keterangan: "Petunjuk teknis identifikasi, analisis, evaluasi, dan pemantauan profil risiko di seluruh unit kerja Kemendesa PDT.",
    fileUrl: "https://jdih.kemendesa.go.id",
    fileName: "Permendesa_15_2023_MR.pdf"
  }
];

export default function KatalogPeraturanPage() {
  const { user, loading: authLoading } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "kementerian";

  // Data State
  const [peraturanList, setPeraturanList] = useState<Peraturan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | "berlaku" | "tidak_berlaku">("semua");
  const [jenisFilter, setJenisFilter] = useState<string>("semua");
  const [tahunFilter, setTahunFilter] = useState<string>("semua");

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStats, setUploadStats] = useState<{ transferred: number; total: number } | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    id?: string;
    nomor: string;
    nama: string;
    jenis: string;
    tahun: string;
    status: "berlaku" | "tidak_berlaku";
    keterangan: string;
    fileUrl: string;
    fileName: string;
    fileSize?: number;
    storagePath?: string;
  }>({
    nomor: "",
    nama: "",
    jenis: "Peraturan Menteri Desa PDT",
    tahun: new Date().getFullYear().toString(),
    status: "berlaku",
    keterangan: "",
    fileUrl: "",
    fileName: "",
    fileSize: 0,
    storagePath: ""
  });

  // Selected file for upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Alert
  const [deleteTarget, setDeleteTarget] = useState<Peraturan | null>(null);

  // Fetch Peraturan from Firestore
  const fetchPeraturan = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsLoading(true);
    try {
      const colRef = collection(db, "katalog_peraturan");
      const snap = await getDocs(colRef);
      const list: Peraturan[] = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          nomor: data.nomor || "",
          nama: data.nama || "",
          jenis: data.jenis || "Lainnya",
          tahun: data.tahun || "",
          status: data.status === "tidak_berlaku" ? "tidak_berlaku" : "berlaku",
          fileUrl: data.fileUrl || "",
          fileName: data.fileName || "",
          fileSize: data.fileSize || 0,
          keterangan: data.keterangan || "",
          storagePath: data.storagePath || "",
          createdAt: data.createdAt || "",
          createdBy: data.createdBy || "",
          createdByName: data.createdByName || "",
          updatedAt: data.updatedAt || ""
        });
      });

      // Sort by tahun desc, then nomor asc
      list.sort((a, b) => {
        const yearA = parseInt(a.tahun || "0", 10) || 0;
        const yearB = parseInt(b.tahun || "0", 10) || 0;
        if (yearB !== yearA) return yearB - yearA;
        return a.nomor.localeCompare(b.nomor);
      });

      setPeraturanList(list);
    } catch (error) {
      console.error("Gagal memuat katalog peraturan:", error);
      toast.error("Gagal memuat katalog peraturan.");
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchPeraturan();
    }
  }, [authLoading, user]);

  // Seed default data if empty using high-speed writeBatch
  const handleSeedDefaults = async () => {
    if (!canManage) return;
    setIsLoading(true);
    const toastId = toast.loading("Menginisialisasi peraturan standar manajemen risiko...");

    try {
      const batch = writeBatch(db);
      const nowIso = new Date().toISOString();

      DEFAULT_PERATURAN_LIST.forEach((item) => {
        const newDocRef = doc(collection(db, "katalog_peraturan"));
        batch.set(newDocRef, {
          ...item,
          createdAt: nowIso,
          createdBy: user?.email || "System",
          createdByName: user?.unitName || "Kementerian Desa PDT",
          timestamp: serverTimestamp()
        });
      });

      await batch.commit();

      logActivity(
        user,
        "Inisialisasi Peraturan Standar",
        "Katalog Peraturan",
        "Menambahkan 4 peraturan standar manajemen risiko"
      );

      toast.success("Berhasil memuat 4 peraturan standar manajemen risiko!", { id: toastId });
      fetchPeraturan(false);
    } catch (error) {
      console.error("Gagal inisialisasi default peraturan:", error);
      toast.error("Gagal menginisialisasi peraturan standar.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Open Modal Create
  const handleOpenCreate = () => {
    setIsEditMode(false);
    setSelectedFile(null);
    setUploadProgress(null);
    setUploadStats(null);
    setUploadMode("file");
    setFormData({
      nomor: "",
      nama: "",
      jenis: "Peraturan Menteri Desa PDT",
      tahun: new Date().getFullYear().toString(),
      status: "berlaku",
      keterangan: "",
      fileUrl: "",
      fileName: "",
      fileSize: 0,
      storagePath: ""
    });
    setIsModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (item: Peraturan) => {
    setIsEditMode(true);
    setSelectedFile(null);
    setUploadProgress(null);
    setUploadStats(null);
    setUploadMode(item.fileUrl && !item.storagePath ? "url" : "file");
    setFormData({
      id: item.id,
      nomor: item.nomor,
      nama: item.nama,
      jenis: item.jenis || "Peraturan Menteri Desa PDT",
      tahun: item.tahun || new Date().getFullYear().toString(),
      status: item.status,
      keterangan: item.keterangan || "",
      fileUrl: item.fileUrl || "",
      fileName: item.fileName || "",
      fileSize: item.fileSize || 0,
      storagePath: item.storagePath || ""
    });
    setIsModalOpen(true);
  };

  // Quick Toggle Status (Berlaku <-> Tidak Berlaku)
  const handleToggleStatus = (item: Peraturan) => {
    if (!canManage) return;

    const newStatus: "berlaku" | "tidak_berlaku" = item.status === "berlaku" ? "tidak_berlaku" : "berlaku";
    const statusLabel = newStatus === "berlaku" ? "Berlaku" : "Tidak Berlaku";

    // Optimistic Update: langsung perbarui UI seketika
    setPeraturanList(prev =>
      prev.map(p => (p.id === item.id ? { ...p, status: newStatus } : p))
    );
    toast.success(`Status ${item.nomor} diubah menjadi "${statusLabel}"`);

    // Async Firestore write in background
    const docRef = doc(db, "katalog_peraturan", item.id);
    updateDoc(docRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || "System"
    }).catch(err => {
      console.error("Gagal sinkron status:", err);
      toast.error("Gagal memperbarui status di server.");
      fetchPeraturan(false);
    });

    logActivity(
      user,
      `Ubah Status: ${item.nomor} -> ${statusLabel}`,
      "Katalog Peraturan",
      `Peraturan ${item.nomor} sekarang ${statusLabel}`
    );
  };

  // Handle Form Submit (Create / Edit) with Resumable Upload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomor.trim() || !formData.nama.trim()) {
      toast.error("Nomor peraturan dan nama peraturan wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(null);
    const toastId = toast.loading(isEditMode ? "Memperbarui peraturan..." : "Menyimpan peraturan baru...");

    try {
      let finalFileUrl = formData.fileUrl;
      let finalFileName = formData.fileName;
      let finalFileSize = formData.fileSize || 0;
      let finalStoragePath = formData.storagePath || "";

      // 1. Upload file if selected using uploadBytesResumable with real-time progress
      if (selectedFile) {
        toast.info("Mengunggah berkas ke penyimpanan...", { id: toastId });
        const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `katalog_peraturan/${Date.now()}_${cleanName}`;
        const storageRef = ref(storage, path);

        const uploadTask = uploadBytesResumable(storageRef, selectedFile);

        const uploadedUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadProgress(pct);
              setUploadStats({
                transferred: snapshot.bytesTransferred,
                total: snapshot.totalBytes
              });
            },
            (error) => {
              console.error("Upload error:", error);
              reject(error);
            },
            async () => {
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadUrl);
              } catch (err) {
                reject(err);
              }
            }
          );
        });

        finalFileUrl = uploadedUrl;
        finalFileName = selectedFile.name;
        finalFileSize = selectedFile.size;
        finalStoragePath = path;
      }

      // 2. Save / Update Firestore Document
      const nowIso = new Date().toISOString();

      if (isEditMode && formData.id) {
        // UPDATE
        const docRef = doc(db, "katalog_peraturan", formData.id);
        const updatePayload = {
          nomor: formData.nomor.trim(),
          nama: formData.nama.trim(),
          jenis: formData.jenis,
          tahun: formData.tahun.trim(),
          status: formData.status,
          keterangan: formData.keterangan.trim(),
          fileUrl: finalFileUrl,
          fileName: finalFileName,
          fileSize: finalFileSize,
          storagePath: finalStoragePath,
          updatedAt: nowIso,
          updatedBy: user?.email || "System"
        };

        await updateDoc(docRef, updatePayload);

        // Optimistic State Update
        setPeraturanList(prev =>
          prev.map(p => (p.id === formData.id ? { ...p, ...updatePayload } : p))
        );

        logActivity(
          user,
          `Edit Peraturan: ${formData.nomor}`,
          "Katalog Peraturan",
          `Status: ${formData.status}`
        );

        toast.success(`Peraturan "${formData.nomor}" berhasil diperbarui!`, { id: toastId });
      } else {
        // CREATE
        const colRef = collection(db, "katalog_peraturan");
        const createPayload = {
          nomor: formData.nomor.trim(),
          nama: formData.nama.trim(),
          jenis: formData.jenis,
          tahun: formData.tahun.trim(),
          status: formData.status,
          keterangan: formData.keterangan.trim(),
          fileUrl: finalFileUrl,
          fileName: finalFileName,
          fileSize: finalFileSize,
          storagePath: finalStoragePath,
          createdAt: nowIso,
          createdBy: user?.email || "System",
          createdByName: user?.unitName || "Kementerian Desa PDT",
          timestamp: serverTimestamp()
        };

        const newDoc = await addDoc(colRef, createPayload);

        // Optimistic State Update
        const createdPeraturan: Peraturan = {
          id: newDoc.id,
          ...createPayload
        };
        setPeraturanList(prev => [createdPeraturan, ...prev]);

        logActivity(
          user,
          `Tambah Peraturan: ${formData.nomor}`,
          "Katalog Peraturan",
          `Status: ${formData.status}`
        );

        toast.success(`Peraturan "${formData.nomor}" berhasil ditambahkan!`, { id: toastId });
      }

      // Close modal immediately
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Gagal menyimpan peraturan:", error);
      toast.error(`Gagal menyimpan: ${error.message || "Periksa koneksi internet Anda"}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
      setUploadStats(null);
    }
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!deleteTarget || !canManage) return;

    const toastId = toast.loading(`Menghapus ${deleteTarget.nomor}...`);
    try {
      // Optimistic remove from UI
      setPeraturanList(prev => prev.filter(p => p.id !== deleteTarget.id));

      // Delete Firestore doc
      await deleteDoc(doc(db, "katalog_peraturan", deleteTarget.id));

      // Clean up file in background if exists
      if (deleteTarget.storagePath) {
        deleteObject(ref(storage, deleteTarget.storagePath)).catch(e => console.warn(e));
      }

      logActivity(
        user,
        `Hapus Peraturan: ${deleteTarget.nomor}`,
        "Katalog Peraturan",
        `Menghapus peraturan: ${deleteTarget.nama}`
      );

      toast.success(`Peraturan "${deleteTarget.nomor}" berhasil dihapus.`, { id: toastId });
      setDeleteTarget(null);
    } catch (error) {
      console.error("Gagal menghapus peraturan:", error);
      toast.error("Gagal menghapus peraturan.", { id: toastId });
      fetchPeraturan(false);
    }
  };

  // Filter Logic:
  // RULE:
  // Jika canManage === true: tampilkan semua (bisa difilter melalui tab: semua, berlaku, tidak_berlaku).
  // Jika canManage === false: HANYA tampilkan peraturan yang status-nya "berlaku".
  const displayedList = peraturanList.filter((item) => {
    // 1. Strict Visibility Rule for Regular Users
    if (!canManage && item.status !== "berlaku") {
      return false;
    }

    // 2. Status Tab Filter (For Admin & Kementerian)
    if (canManage && statusFilter !== "semua" && item.status !== statusFilter) {
      return false;
    }

    // 3. Jenis Filter
    if (jenisFilter !== "semua" && item.jenis !== jenisFilter) {
      return false;
    }

    // 4. Tahun Filter
    if (tahunFilter !== "semua" && item.tahun !== tahunFilter) {
      return false;
    }

    // 5. Search Text Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNomor = item.nomor?.toLowerCase().includes(q);
      const matchNama = item.nama?.toLowerCase().includes(q);
      const matchJenis = item.jenis?.toLowerCase().includes(q);
      const matchTahun = item.tahun?.toLowerCase().includes(q);
      const matchKet = item.keterangan?.toLowerCase().includes(q);
      if (!matchNomor && !matchNama && !matchJenis && !matchTahun && !matchKet) {
        return false;
      }
    }

    return true;
  });

  // Calculate distinct years for dropdown filter
  const distinctYears = Array.from(
    new Set(peraturanList.map(p => p.tahun).filter(Boolean))
  ).sort((a, b) => (parseInt(b!, 10) || 0) - (parseInt(a!, 10) || 0));

  // Statistics
  const totalCount = canManage
    ? peraturanList.length
    : peraturanList.filter(p => p.status === "berlaku").length;
  const berlakuCount = peraturanList.filter(p => p.status === "berlaku").length;
  const tidakBerlakuCount = peraturanList.filter(p => p.status === "tidak_berlaku").length;
  const withDocCount = peraturanList.filter(p => p.fileUrl && (canManage || p.status === "berlaku")).length;

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Katalog Peraturan & Regulasi
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Pusat referensi regulasi hukum dan pedoman penyelenggaraan Manajemen Risiko Kementerian Desa PDT.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons for Admin & Kementerian */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPeraturan(true)}
            disabled={isLoading}
            className="text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>

          {canManage && (
            <Button
              onClick={handleOpenCreate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Peraturan
            </Button>
          )}
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Peraturan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Regulasi</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Peraturan Berlaku */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-700 font-medium">Status Berlaku</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-800 mt-1">{berlakuCount}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Peraturan Tidak Berlaku (Admin/Kementerian) */}
        {canManage ? (
          <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-rose-700 font-medium">Tidak Berlaku / Arsip</p>
              <p className="text-xl sm:text-2xl font-bold text-rose-800 mt-1">{tidakBerlakuCount}</p>
              <p className="text-[10px] text-slate-400">Disembunyikan dari user</p>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Akses Pengguna</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">Publikasi Aktif</p>
              <p className="text-[10px] text-emerald-600">Seluruh Regulasi Sah</p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Dokumen Siap Unduh */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Dokumen Terlampir</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{withDocCount}</p>
            <p className="text-[10px] text-slate-400">PDF / Dokumen Sah</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Download className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* CALLOUT INISIALISASI UNTUK ADMIN/KEMENTERIAN JIKA DATABASE KOSONG */}
      {canManage && peraturanList.length === 0 && !isLoading && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Katalog Peraturan Masih Kosong
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                Ingin langsung memuat paket peraturan standar manajemen risiko (Permenpan RB 5/2020, PP 60/2008 SPIP, UU No. 6/2014 Tentang Desa, dan Permendesa 15/2023) agar dapat langsung diakses oleh seluruh unit kerja?
              </p>
            </div>
          </div>
          <Button
            onClick={handleSeedDefaults}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0"
          >
            <FileCheck className="w-4 h-4 mr-1.5" />
            Muat Peraturan Standar
          </Button>
        </div>
      )}

      {/* 3. FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Status Tab (Khusus Admin & Pengelola Kementerian) */}
        {canManage && (
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit text-xs font-medium border border-slate-200">
            <button
              onClick={() => setStatusFilter("semua")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "semua"
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({peraturanList.length})
            </button>
            <button
              onClick={() => setStatusFilter("berlaku")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                statusFilter === "berlaku"
                  ? "bg-emerald-600 text-white font-bold shadow-xs"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Berlaku ({berlakuCount})
            </button>
            <button
              onClick={() => setStatusFilter("tidak_berlaku")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                statusFilter === "tidak_berlaku"
                  ? "bg-rose-600 text-white font-bold shadow-xs"
                  : "text-rose-700 hover:bg-rose-50"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Tidak Berlaku ({tidakBerlakuCount})
            </button>
          </div>
        )}

        {/* Search, Filter Jenis, dan Tahun */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari nomor peraturan, judul, kata kunci, dll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs sm:text-sm bg-slate-50 border-slate-200 focus:bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Jenis */}
          <div className="sm:col-span-4">
            <select
              value={jenisFilter}
              onChange={(e) => setJenisFilter(e.target.value)}
              className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="semua">Semua Jenis Peraturan</option>
              {JENIS_PERATURAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tahun */}
          <div className="sm:col-span-2">
            <select
              value={tahunFilter}
              onChange={(e) => setTahunFilter(e.target.value)}
              className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="semua">Semua Tahun</option>
              {distinctYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-sm font-medium">Memuat katalog peraturan...</p>
          </div>
        ) : displayedList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">Tidak ada peraturan ditemukan</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || jenisFilter !== "semua" || tahunFilter !== "semua"
                ? "Tidak ada peraturan yang cocok dengan kriteria pencarian atau filter yang dipilih."
                : "Belum ada peraturan yang tersimpan dalam katalog ini."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                <TableRow>
                  <TableHead className="w-12 text-center font-bold text-slate-700">No.</TableHead>
                  <TableHead className="font-bold text-slate-700 min-w-[280px]">Nomor & Nama Peraturan</TableHead>
                  <TableHead className="font-bold text-slate-700 w-36">Jenis & Tahun</TableHead>
                  <TableHead className="font-bold text-slate-700 w-44">Dokumen</TableHead>
                  <TableHead className="font-bold text-slate-700 w-32 text-center">Status</TableHead>
                  {canManage && (
                    <TableHead className="font-bold text-slate-700 w-32 text-center">Aksi</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedList.map((item, index) => {
                  const isBerlaku = item.status === "berlaku";

                  return (
                    <TableRow
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !isBerlaku ? "bg-rose-50/30" : ""
                      }`}
                    >
                      {/* 1. Nomor urut */}
                      <TableCell className="text-center font-medium text-slate-500 text-xs">
                        {index + 1}
                      </TableCell>

                      {/* 2. Nomor & Nama Peraturan */}
                      <TableCell className="align-top py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                              {item.nomor}
                            </span>
                            {!isBerlaku && (
                              <span className="text-[10px] bg-rose-100 text-rose-700 font-semibold px-1.5 py-0.2 rounded border border-rose-200">
                                Dicabut / Tidak Berlaku
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                            {item.nama}
                          </p>
                          {item.keterangan && (
                            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded border border-slate-100 mt-1">
                              <strong>Catatan:</strong> {item.keterangan}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* 3. Jenis & Tahun */}
                      <TableCell className="align-top py-3.5">
                        <div className="space-y-1">
                          <span className="inline-block text-[11px] font-medium bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                            {item.jenis || "Peraturan"}
                          </span>
                          {item.tahun && (
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              Tahun {item.tahun}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* 4. Dokumen */}
                      <TableCell className="align-top py-3.5">
                        {item.fileUrl ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200 rounded-lg transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Buka Dokumen
                              </a>
                            </div>
                            {item.fileName && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[170px]" title={item.fileName}>
                                {item.fileName} {formatFileSize(item.fileSize)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Belum ada berkas
                          </span>
                        )}
                      </TableCell>

                      {/* 5. Status Peraturan */}
                      <TableCell className="align-top py-3.5 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          {isBerlaku ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100/80 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Berlaku
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Tidak Berlaku
                            </span>
                          )}

                          {/* Quick Toggle Button for Admin & Kementerian */}
                          {canManage && (
                            <button
                              onClick={() => handleToggleStatus(item)}
                              className="text-[10px] text-slate-500 hover:text-slate-800 underline transition-colors mt-0.5"
                              title="Klik untuk mengubah status peraturan"
                            >
                              {isBerlaku ? "Ubah ke Tidak Berlaku" : "Aktifkan (Berlaku)"}
                            </button>
                          )}
                        </div>
                      </TableCell>

                      {/* 6. Aksi (Khusus Admin & Kementerian) */}
                      {canManage && (
                        <TableCell className="align-top py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Peraturan"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(item)}
                              title="Hapus Peraturan"
                              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 5. MODAL TAMBAH / EDIT PERATURAN */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                {isEditMode ? "Edit Katalog Peraturan" : "Tambah Peraturan Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Lengkapi rincian peraturan dan unggah dokumen sah. Peraturan dengan status <strong>Berlaku</strong> akan otomatis dapat diakses oleh seluruh pengguna SIM-Risiko.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-xs sm:text-sm">
              {/* Realtime Upload Progress Bar */}
              {isSubmitting && uploadProgress !== null && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                      Mengunggah Berkas ke Penyimpanan Cloud...
                    </span>
                    <span className="font-mono text-emerald-700">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-emerald-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  {uploadStats && (
                    <p className="text-[10px] text-emerald-700 text-right font-mono">
                      {formatFileSize(uploadStats.transferred)} dari {formatFileSize(uploadStats.total)}
                    </p>
                  )}
                </div>
              )}

              {/* Nomor Peraturan */}
              <div className="grid gap-1.5">
                <Label htmlFor="nomor" className="font-semibold text-slate-800">
                  Nomor Peraturan <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="nomor"
                  required
                  placeholder="Contoh: Permenpan RB No. 5 Tahun 2020 / PP No. 60 Tahun 2008"
                  value={formData.nomor}
                  onChange={(e) => setFormData({ ...formData, nomor: e.target.value })}
                  className="bg-slate-50 focus:bg-white"
                  disabled={isSubmitting}
                />
              </div>

              {/* Nama Peraturan */}
              <div className="grid gap-1.5">
                <Label htmlFor="nama" className="font-semibold text-slate-800">
                  Nama / Judul Peraturan <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="nama"
                  required
                  rows={2}
                  placeholder="Contoh: Petunjuk Pelaksanaan Manajemen Risiko di Lingkungan Instansi Pemerintah"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="bg-slate-50 focus:bg-white resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Jenis & Tahun */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="jenis" className="font-semibold text-slate-800">
                    Jenis Peraturan
                  </Label>
                  <select
                    id="jenis"
                    value={formData.jenis}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {JENIS_PERATURAN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="tahun" className="font-semibold text-slate-800">
                    Tahun Penetapan
                  </Label>
                  <Input
                    id="tahun"
                    placeholder="Contoh: 2020"
                    value={formData.tahun}
                    onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
                    className="bg-slate-50 focus:bg-white"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Status Peraturan (Berlaku / Tidak Berlaku) */}
              <div className="grid gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <Label className="font-semibold text-slate-800">
                  Status Peraturan <span className="text-rose-500">*</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {/* Pilihan Berlaku */}
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      formData.status === "berlaku"
                        ? "bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="berlaku"
                      checked={formData.status === "berlaku"}
                      onChange={() => setFormData({ ...formData, status: "berlaku" })}
                      disabled={isSubmitting}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="flex items-center gap-1 font-bold text-xs text-emerald-900">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Berlaku (Aktif)
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Ditampilkan di katalog seluruh pengguna SIM-Risiko.
                      </p>
                    </div>
                  </label>

                  {/* Pilihan Tidak Berlaku */}
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      formData.status === "tidak_berlaku"
                        ? "bg-rose-50/80 border-rose-400 ring-1 ring-rose-400"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="tidak_berlaku"
                      checked={formData.status === "tidak_berlaku"}
                      onChange={() => setFormData({ ...formData, status: "tidak_berlaku" })}
                      disabled={isSubmitting}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <div className="flex items-center gap-1 font-bold text-xs text-rose-900">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Tidak Berlaku (Arsip)
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Disembunyikan dari katalog pengguna umum.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Input Dokumen Peraturan (Upload File / URL) */}
              <div className="grid gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    Dokumen Peraturan
                  </Label>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setUploadMode("file")}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        uploadMode === "file"
                          ? "bg-emerald-600 text-white font-bold"
                          : "text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Unggah Berkas
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setUploadMode("url")}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        uploadMode === "url"
                          ? "bg-emerald-600 text-white font-bold"
                          : "text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Tautan Eksternal
                    </button>
                  </div>
                </div>

                {uploadMode === "file" ? (
                  <div className="space-y-2 mt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const f = e.target.files[0];
                          if (f.size > 25 * 1024 * 1024) {
                            toast.error("Ukuran berkas melebihi batas 25 MB. Gunakan berkas lebih kecil atau opsi Tautan Eksternal.");
                            return;
                          }
                          setSelectedFile(f);
                        }
                      }}
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-500">
                      Mendukung format PDF, Word, atau Excel (Maks. 25 MB).
                    </p>

                    {selectedFile && (
                      <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900">
                        <span className="font-medium truncate max-w-[320px]">
                          📎 {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </span>
                        {!isSubmitting && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
                          >
                            Batal
                          </button>
                        )}
                      </div>
                    )}

                    {isEditMode && formData.fileUrl && !selectedFile && (
                      <div className="text-xs text-slate-600 p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                        <span className="truncate max-w-[320px]">
                          Dokumen tersimpan: <strong>{formData.fileName || "Berkas Peraturan"}</strong>
                        </span>
                        <a
                          href={formData.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:underline text-xs shrink-0 font-medium ml-2"
                        >
                          Lihat
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1 mt-1">
                    <Input
                      type="url"
                      disabled={isSubmitting}
                      placeholder="https://jdih.kemendesa.go.id/... atau tautan Google Drive / Cloud"
                      value={formData.fileUrl}
                      onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                      className="bg-white text-xs sm:text-sm"
                    />
                    <p className="text-[11px] text-slate-500">
                      💡 Tip: Masukkan URL link dokumen sah dari JDIH Kemendesa atau portal regulasi pemerintah jika tidak ingin mengunggah berkas lokal.
                    </p>
                  </div>
                )}
              </div>

              {/* Keterangan / Catatan */}
              <div className="grid gap-1.5">
                <Label htmlFor="keterangan" className="font-semibold text-slate-800">
                  Keterangan / Catatan Tambahan (Opsional)
                </Label>
                <Textarea
                  id="keterangan"
                  rows={2}
                  disabled={isSubmitting}
                  placeholder="Misal: Mencabut Keputusan Menteri Nomor ... atau pedoman implementasi SPIP"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="bg-slate-50 focus:bg-white resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    {uploadProgress !== null ? `Mengunggah (${uploadProgress}%)...` : "Menyimpan..."}
                  </>
                ) : (
                  "Simpan Peraturan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. ALERT DIALOG HAPUS PERATURAN */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Hapus Peraturan dari Katalog?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-slate-600">
              Apakah Anda yakin ingin menghapus peraturan:
              <br />
              <strong className="text-slate-900 block my-1">
                {deleteTarget?.nomor} — {deleteTarget?.nama}
              </strong>
              Tindakan ini bersifat permanen dan akan menghapus berkas dokumen yang tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              Ya, Hapus Peraturan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
