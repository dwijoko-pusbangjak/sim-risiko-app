"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { 
  Loader2, 
  ShieldCheck, 
  LogIn, 
  Eye, 
  EyeOff, 
  Sparkles, 
  RotateCw, 
  Check, 
  Info, 
  UserCheck, 
  HelpCircle 
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [rememberMe, setRememberMe] = useState(true);
  const [activeTab, setActiveTab] = useState<"login" | "info">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  
  const router = useRouter();
  const { setActiveYear, user } = useAuth();

  useEffect(() => {
    if (user) {
      import("@/lib/logger").then(({ logActivity }) => {
        logActivity(user, "Login", "Autentikasi", "Berhasil masuk ke sistem.");
      });
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    const fetchWallpaper = async () => {
      try {
        const docRef = doc(db, "settings", "general");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.loginWallpaperUrl) {
            setWallpaperUrl(data.loginWallpaperUrl);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil pengaturan wallpaper:", error);
      }
    };
    fetchWallpaper();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      setActiveYear(selectedYear);
      try {
        localStorage.setItem("sim_risiko_menu_position", "top");
      } catch (storageErr) {
        // Abaikan jika browser memblokir localStorage
      }
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      setError("Email atau kata sandi tidak sesuai. Silakan periksa kembali akun Anda.");
      setLoading(false);
    }
  };

  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setActiveTab("login");
  };

  const handleResetForm = () => {
    setEmail("");
    setPassword("");
    setError("");
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#ebf3fc] via-[#f3f7fd] to-[#e4eefb] p-4 sm:p-6 lg:p-12 font-sans select-none">
      
      {/* ========================================================================= */}
      {/* 1. LATAR BELAKANG ELEGAN & GELOMBANG CAHAYA FLUID (Persis Screenshot)   */}
      {/* ========================================================================= */}
      
      {/* Cahaya Diffuse Ambient Halus */}
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-sky-200/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 -right-20 w-[550px] h-[550px] bg-blue-200/40 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-indigo-200/35 rounded-full blur-[140px] pointer-events-none" />

      {/* Gelombang Halus Melengkung Berlayer 3D (Fluid Wave) */}
      <svg 
        className="absolute bottom-0 left-0 w-full h-[58%] pointer-events-none z-0" 
        viewBox="0 0 1440 600" 
        fill="none" 
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wave1" x1="0%" y1="60%" x2="100%" y2="85%">
            <stop offset="0%" stopColor="#9cc2f7" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#bad7fc" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#e5effe" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="wave2" x1="5%" y1="20%" x2="95%" y2="90%">
            <stop offset="0%" stopColor="#4177e6" stopOpacity="0.48" />
            <stop offset="55%" stopColor="#76a3f3" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#c8defb" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="wave3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#295fd1" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#6097ee" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#dbe8fc" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d="M-100,430 C280,560 520,240 920,380 C1220,490 1320,330 1580,410 L1580,650 L-100,650 Z" fill="url(#wave1)" />
        <path d="M-50,470 C240,580 480,290 860,420 C1160,520 1280,380 1540,460 L1540,650 L-50,650 Z" fill="url(#wave2)" />
        <path d="M0,510 C190,610 400,350 780,460 C1080,540 1230,440 1480,500 L1480,650 L0,650 Z" fill="url(#wave3)" />
      </svg>

      {/* ========================================================================= */}
      {/* 2. HEADER BRANDING POJOK KIRI ATAS (Logo & Nama Aplikasi)                */}
      {/* ========================================================================= */}
      <header className="absolute top-6 left-6 sm:top-8 sm:left-10 flex items-center gap-2.5 z-20">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/25 border border-white/60">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
            Si<span className="text-blue-600">-MaRi</span>
          </span>
          <span className="text-[10px] font-semibold text-slate-500 leading-tight">Kemendes PDT</span>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. KONTEN UTAMA: HERO VISUAL (Kiri) + KARTU LOGIN PUTIH (Kanan)          */}
      {/* ========================================================================= */}
      <main className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16 py-12 lg:py-6">
        
        {/* SISI KIRI: HERO BRANDING & BUBBLE CHAT FROSTED (Persis Screenshot) */}
        <section className="hidden md:flex flex-col items-start justify-center flex-1 max-w-lg lg:pr-6 animate-in fade-in duration-700">
          
          {/* Gelembung Pesan Obrolan Transparan (Frosted Chat Bubbles) */}
          <div className="space-y-2.5 mb-8 w-full">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/75 backdrop-blur-md border border-white/80 shadow-xs text-xs font-semibold text-slate-700 animate-in fade-in slide-in-from-left-4 duration-500">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Halo! Selamat datang di Si-MaRi Kemendes PDT 👋</span>
            </div>
            
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/65 backdrop-blur-md border border-white/70 shadow-xs text-xs font-medium text-slate-600 animate-in fade-in slide-in-from-left-4 duration-700">
                <span>Sistem Manajemen Risiko Terpadu & Terintegrasi</span>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/55 backdrop-blur-md border border-white/60 shadow-xs text-xs font-medium text-slate-600 animate-in fade-in slide-in-from-left-4 duration-1000">
                <span>Silakan masuk untuk mengelola profil & mitigasi risiko unit Anda</span>
              </div>
            </div>
          </div>

          {/* Tipografi Brand Futuristik Besar (Sesuai Gaya 'navos' di Screenshot) */}
          <div className="relative mt-2">
            {/* Titik-Titik Aksen Melayang Lembut */}
            <div className="absolute -top-3 -left-3 w-2.5 h-2.5 rounded-full bg-blue-400/50 blur-[0.5px] animate-pulse" />
            <div className="absolute top-12 -left-6 w-3.5 h-3.5 rounded-full bg-sky-400/40 blur-[1px]" />
            <div className="absolute -bottom-2 left-16 w-2 h-2 rounded-full bg-indigo-400/40 blur-[0.5px]" />

            <span className="block text-[11px] font-bold tracking-[0.25em] text-slate-400 uppercase mb-1">
              PORTAL RESMI
            </span>
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-[#0f2747] leading-none">
              Si<span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">-MaRi</span>
            </h1>
            <span className="block text-xs font-bold tracking-[0.35em] text-slate-400/90 uppercase mt-3">
              KEMENDES PDT
            </span>
          </div>

          {/* Deskripsi Pendukung */}
          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-6 max-w-sm">
            Kementerian Desa dan Pembangunan Daerah Tertinggal Republik Indonesia.
          </p>
        </section>

        {/* SISI KANAN: KARTU LOGIN PUTIH MODERN BERKELAS (Persis Screenshot) */}
        <div className="w-full max-w-[420px] sm:max-w-[440px] shrink-0 animate-in fade-in slide-in-from-bottom-6 lg:slide-in-from-right-8 duration-700">
          <div className="relative bg-white/95 backdrop-blur-xl rounded-[28px] p-7 sm:p-9 shadow-[0_25px_60px_-15px_rgba(28,57,142,0.12),0_0_0_1px_rgba(255,255,255,0.95)] border border-white/80">
            
            {/* Header Judul Kartu Login */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Masuk ke Akun Anda
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Akses Sistem Manajemen Risiko Kemendes PDT
              </p>
            </div>

            {/* Navigasi Tab (Persis Screenshot dengan Garis Bawah Biru) */}
            <div className="flex items-center gap-6 border-b border-slate-100 pb-3 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={`relative text-xs sm:text-sm font-bold transition-colors cursor-pointer pb-1 ${
                  activeTab === "login" ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Akun Pengguna
                {activeTab === "login" && (
                  <span className="absolute bottom-[-13px] left-0 right-0 h-[2.5px] bg-blue-600 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={`relative text-xs sm:text-sm font-bold transition-colors cursor-pointer pb-1 ${
                  activeTab === "info" ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Informasi & Bantuan
                {activeTab === "info" && (
                  <span className="absolute bottom-[-13px] left-0 right-0 h-[2.5px] bg-blue-600 rounded-full" />
                )}
              </button>
            </div>

            {/* TAB 1: FORM LOGIN UTAMA */}
            {activeTab === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-semibold border border-rose-200/80 flex items-center relative overflow-hidden animate-in fade-in duration-200">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                    <span className="pl-2">{error}</span>
                  </div>
                )}

                {/* Pemilihan Tahun Manajemen Risiko */}
                <div className="space-y-1.5">
                  <Label htmlFor="year-select" className="text-slate-700 text-xs font-semibold">
                    Tahun Manajemen Risiko
                  </Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger 
                      id="year-select" 
                      className="h-11 w-full bg-[#f4f7fb] border border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs font-semibold text-slate-800 transition-all cursor-pointer"
                    >
                      <SelectValue placeholder="Pilih Tahun Anggaran" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-xl shadow-xl border border-slate-100">
                      <SelectItem value="2026" className="text-xs font-semibold">Tahun Anggaran 2026</SelectItem>
                      <SelectItem value="2027" className="text-xs font-semibold">Tahun Anggaran 2027</SelectItem>
                      <SelectItem value="2028" className="text-xs font-semibold">Tahun Anggaran 2028</SelectItem>
                      <SelectItem value="2029" className="text-xs font-semibold">Tahun Anggaran 2029</SelectItem>
                      <SelectItem value="2030" className="text-xs font-semibold">Tahun Anggaran 2030</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Kolom Email / ID Pengguna */}
                <div className="space-y-1.5">
                  <Label htmlFor="email-input" className="text-slate-700 text-xs font-semibold">
                    Alamat Email / ID Pengguna
                  </Label>
                  <div className="relative">
                    <input
                      id="email-input"
                      type="email"
                      required
                      placeholder="nama@kemendesa.go.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 px-3.5 bg-[#f4f7fb] border border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Kolom Kata Sandi dengan Ikon Mata (Toggle Password Visibility) */}
                <div className="space-y-1.5">
                  <Label htmlFor="password-input" className="text-slate-700 text-xs font-semibold">
                    Kata Sandi
                  </Label>
                  <div className="relative">
                    <input
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 px-3.5 pr-10 bg-[#f4f7fb] border border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                      title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Checkbox Ketentuan & Ingat Saya (Persis Screenshot) */}
                <div className="flex items-center gap-2 pt-1 pb-1">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="text-[11px] text-slate-600 select-none cursor-pointer">
                    Saya menyetujui ketentuan akses sistem & kebijakan privasi
                  </label>
                </div>

                {/* Tombol Masuk Utama (Persis Biru Solid Vibrant di Screenshot) */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/25 transition-all hover:scale-[1.008] active:scale-[0.99] cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi Akun...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>Masuk Sistem</span>
                      <LogIn className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                {/* Tautan Bawah */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("info")}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    Lupa kata sandi? Hubungi Administrator APIP
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: PANDUAN & BANTUAN AKSES */}
            {activeTab === "info" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-slate-700 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-900">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Panduan Masuk Sistem</span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    Gunakan alamat email dinas resmi yang telah didaftarkan oleh Administrator Inspektorat Jenderal / APIP Kemendes PDT.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Pintasan Contoh Pengguna (Uji Coba):
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { role: "Administrator Sistem", email: "admin@kemendesa.go.id" },
                      { role: "Auditor APIP", email: "auditor@kemendesa.go.id" },
                      { role: "Pimpinan / Irjen", email: "pimpinan@kemendesa.go.id" },
                      { role: "Pengelola Unit Kerja", email: "pusbangjak@kemendesa.go.id" }
                    ].map((item) => (
                      <button
                        key={item.email}
                        type="button"
                        onClick={() => handleQuickFill(item.email)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#f4f7fb] hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all text-left text-xs cursor-pointer group"
                      >
                        <div>
                          <p className="font-bold text-slate-800 group-hover:text-blue-700">{item.role}</p>
                          <p className="text-[11px] text-slate-500">{item.email}</p>
                        </div>
                        <UserCheck className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("login")}
                  className="w-full h-10 rounded-xl text-xs font-semibold cursor-pointer border-slate-200 hover:bg-slate-50"
                >
                  Kembali ke Formulir Masuk
                </Button>
              </div>
            )}

            {/* Footer Hak Cipta Singkat */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-medium">
                Kementerian Desa dan Pembangunan Daerah Tertinggal &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 4. TOMBOL BULAT POJOK KANAN BAWAH (Persis Tombol di Screenshot)          */}
      {/* ========================================================================= */}
      <button
        type="button"
        onClick={handleResetForm}
        title="Muat Ulang / Bersihkan Formulir"
        className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:rotate-180 transition-all duration-300 z-30 cursor-pointer active:scale-95"
      >
        <RotateCw className="w-4 h-4" />
      </button>

    </div>
  );
}
