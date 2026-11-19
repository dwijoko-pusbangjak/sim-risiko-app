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
  HelpCircle,
  Volume2,
  TrendingUp,
  Award
} from "lucide-react";
import { AnimatedMascot } from "@/components/AnimatedMascot";

interface CaptchaData {
  code: string;
  lines: Array<{ x1: number; y1: number; x2: number; y2: number; color: string; strokeWidth: number }>;
  dots: Array<{ cx: number; cy: number; r: number; color: string }>;
  charStyles: Array<{ rotate: number; y: number; color: string }>;
}

const generateCaptchaData = (): CaptchaData => {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const palette = ["#1e3a8a", "#0369a1", "#0f766e", "#4338ca", "#7c2d12", "#1e293b", "#0284c7"];
  const linePalette = ["#94a3b8", "#60a5fa", "#818cf8", "#38bdf8", "#a5b4fc"];

  const lines = [
    {
      x1: Math.floor(Math.random() * 20),
      y1: 10 + Math.floor(Math.random() * 24),
      x2: 140 + Math.floor(Math.random() * 20),
      y2: 10 + Math.floor(Math.random() * 24),
      color: linePalette[Math.floor(Math.random() * linePalette.length)],
      strokeWidth: 1.5 + Math.random() * 0.8,
    },
    {
      x1: Math.floor(Math.random() * 30),
      y1: 15 + Math.floor(Math.random() * 20),
      x2: 130 + Math.floor(Math.random() * 30),
      y2: 15 + Math.floor(Math.random() * 20),
      color: linePalette[Math.floor(Math.random() * linePalette.length)],
      strokeWidth: 1.2 + Math.random() * 0.6,
    },
    {
      x1: Math.floor(Math.random() * 40),
      y1: 5 + Math.floor(Math.random() * 30),
      x2: 120 + Math.floor(Math.random() * 40),
      y2: 5 + Math.floor(Math.random() * 30),
      color: linePalette[Math.floor(Math.random() * linePalette.length)],
      strokeWidth: 1.0 + Math.random() * 0.5,
    },
  ];

  const dots = Array.from({ length: 14 }).map(() => ({
    cx: Math.floor(Math.random() * 160),
    cy: Math.floor(Math.random() * 44),
    r: 1 + Math.random() * 1.5,
    color: palette[Math.floor(Math.random() * palette.length)],
  }));

  const charStyles = code.split("").map(() => ({
    rotate: (Math.random() - 0.5) * 26,
    y: 28 + (Math.random() - 0.5) * 6,
    color: palette[Math.floor(Math.random() * palette.length)],
  }));

  return { code, lines, dots, charStyles };
};

const LOGIN_MESSAGES = [
  {
    icon: Sparkles,
    iconColor: "text-blue-500",
    text: "Halo! Selamat datang di Si-MaRi Kemendes PDT 👋",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-sky-500",
    text: "Sistem Manajemen Risiko Terpadu & Terintegrasi",
  },
  {
    icon: LogIn,
    iconColor: "text-indigo-500",
    text: "Silakan masuk untuk mengelola profil & mitigasi risiko unit Anda",
  },
];

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
  const [activeMsgIndex, setActiveMsgIndex] = useState(0);
  const [isMsgVisible, setIsMsgVisible] = useState(true);

  // State CAPTCHA Visual
  const [captchaData, setCaptchaData] = useState<CaptchaData>({
    code: "",
    lines: [],
    dots: [],
    charStyles: []
  });
  const [captchaInput, setCaptchaInput] = useState("");
  const [isCaptchaRotating, setIsCaptchaRotating] = useState(false);
  
  const router = useRouter();
  const { setActiveYear, user } = useAuth();

  // Inisialisasi Kode CAPTCHA pada saat halaman dibuka
  useEffect(() => {
    setCaptchaData(generateCaptchaData());
  }, []);

  const handleRefreshCaptcha = () => {
    setIsCaptchaRotating(true);
    setCaptchaData(generateCaptchaData());
    setCaptchaInput("");
    setTimeout(() => {
      setIsCaptchaRotating(false);
    }, 450);
  };

  const handleSpeakCaptcha = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const textToSpeak = captchaData.code.split("").join(" . ");
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = "id-ID";
      utterance.rate = 0.8;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSpeakMascotMessage = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const msg = LOGIN_MESSAGES[activeMsgIndex]?.text;
      if (!msg) return;
      const cleanMsg = msg.replace(/[👋✨]/g, "").trim();
      const utterance = new SpeechSynthesisUtterance(cleanMsg);
      utterance.lang = "id-ID";
      utterance.rate = 0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  // Efek Animasi Timbul Tenggelam bergantian per kalimat
  useEffect(() => {
    const fadeOutTimer = setTimeout(() => {
      setIsMsgVisible(false);
    }, 3200);

    const switchTimer = setTimeout(() => {
      setActiveMsgIndex((prev) => (prev + 1) % LOGIN_MESSAGES.length);
      setIsMsgVisible(true);
    }, 3700);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(switchTimer);
    };
  }, [activeMsgIndex]);

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

    // 1. Verifikasi Keamanan CAPTCHA
    if (!captchaInput.trim()) {
      setError("Silakan masukkan kode keamanan (CAPTCHA) terlebih dahulu.");
      setLoading(false);
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaData.code.toUpperCase()) {
      setError("Kode keamanan (CAPTCHA) tidak sesuai. Silakan masukkan kode baru yang muncul.");
      setCaptchaInput("");
      handleRefreshCaptcha();
      setLoading(false);
      return;
    }

    // 2. Lanjutkan Proses Autentikasi
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
      setCaptchaInput("");
      handleRefreshCaptcha();
      setLoading(false);
    }
  };


  const handleResetForm = () => {
    setEmail("");
    setPassword("");
    setCaptchaInput("");
    handleRefreshCaptcha();
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
        
        {/* SISI KIRI: HERO BRANDING & MASKOT SI-MARI DENGAN BALON BICARA TIMBUL TENGGELAM */}
        <section className="hidden md:flex flex-col items-start justify-center flex-1 max-w-lg lg:max-w-xl lg:pr-6 animate-in fade-in duration-700">
          
          {/* Gelembung Pesan Animasi Timbul Tenggelam (Speech Bubble dari Maskot) */}
          <div className="mb-4 w-full min-h-[52px] flex items-center relative">
            {(() => {
              const currentMsg = LOGIN_MESSAGES[activeMsgIndex];
              const IconComp = currentMsg.icon;
              return (
                <div className="relative inline-block max-w-md">
                  <div
                    className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-white/95 shadow-md shadow-blue-500/10 text-xs font-semibold text-slate-700 transition-all duration-500 ease-in-out transform relative z-10 ${
                      isMsgVisible
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 -translate-y-2 scale-95 blur-xs"
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${currentMsg.iconColor} shrink-0 animate-pulse`} />
                    <span className="leading-tight">{currentMsg.text}</span>

                    {/* Tombol Suara untuk Mendengarkan Maskot Berbicara */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeakMascotMessage();
                      }}
                      title="Dengarkan maskot berbicara"
                      className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50 cursor-pointer shrink-0"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Indikator Titik Posisi Kalimat */}
                    <div className="flex items-center gap-1 ml-1.5 pl-2.5 border-l border-slate-200/90">
                      {LOGIN_MESSAGES.map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            activeMsgIndex === idx ? "w-3 bg-blue-600" : "w-1.5 bg-slate-300/80"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Ekor Balon Bicara (Speech Bubble Pointer) yang menunjuk ke arah Maskot */}
                  <div
                    className={`absolute -bottom-1.5 left-36 sm:left-44 w-3.5 h-3.5 bg-white/90 border-r border-b border-white/95 transform rotate-45 transition-opacity duration-300 shadow-xs ${
                      isMsgVisible ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
              );
            })()}
          </div>

          {/* Baris Bersebelahan: Tipografi Brand Si-MaRi (Kiri) + Karakter Maskot Si-MaRi (Kanan) */}
          <div className="flex items-center gap-4 lg:gap-6 mt-1 w-full">
            {/* Teks Judul Brand Si-MaRi */}
            <div className="relative shrink-0">
              {/* Titik-Titik Aksen Melayang Lembut */}
              <div className="absolute -top-3 -left-3 w-2.5 h-2.5 rounded-full bg-blue-400/50 blur-[0.5px] animate-pulse" />
              <div className="absolute top-12 -left-6 w-3.5 h-3.5 rounded-full bg-sky-400/40 blur-[1px]" />
              <div className="absolute -bottom-2 left-16 w-2 h-2 rounded-full bg-indigo-400/40 blur-[0.5px]" />

              <span className="block text-[11px] font-bold tracking-[0.25em] text-slate-400 uppercase mb-1">
                PORTAL RESMI
              </span>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-[#0f2747] leading-none">
                Si<span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">-MaRi</span>
              </h1>
              <span className="block text-xs font-bold tracking-[0.35em] text-slate-400/90 uppercase mt-2.5">
                KEMENDES PDT
              </span>
            </div>

            {/* Karakter Maskot Si-MaRi dengan Animasi Tangan Menunjuk Tulisan & Mulut Berbicara */}
            <div className="relative shrink-0 flex items-center justify-center">
              <AnimatedMascot
                isSpeaking={isMsgVisible}
                onMascotClick={handleSpeakMascotMessage}
                className="w-32 lg:w-40"
              />
            </div>
          </div>

          {/* Deskripsi Pendukung (3 Baris) */}
          <div className="mt-5 space-y-0.5 max-w-md">
            <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-snug">
              Sistem Informasi Manajemen Risiko
            </p>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Kementerian Desa dan Pembangunan Daerah Tertinggal
            </p>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Republik Indonesia
            </p>
          </div>
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

                {/* Kolom Verifikasi Keamanan CAPTCHA */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="captcha-input" className="text-slate-700 text-xs font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Kode Keamanan (CAPTCHA)</span>
                    </Label>
                    <span className="text-[10px] text-slate-400 font-medium">Bebas besar/kecil</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Kotak Visual Gambar CAPTCHA (SVG) */}
                    <div 
                      className="relative flex-1 overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-r from-slate-100 via-sky-50 to-blue-50 select-none shadow-2xs h-11 flex items-center justify-center cursor-pointer group"
                      onClick={handleRefreshCaptcha}
                      title="Klik gambar untuk mengganti kode keamanan baru"
                    >
                      {captchaData.code ? (
                        <svg
                          viewBox="0 0 160 44"
                          className="w-full h-full max-h-11"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <defs>
                            <linearGradient id="captchaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#f8fafc" />
                              <stop offset="50%" stopColor="#f0f9ff" />
                              <stop offset="100%" stopColor="#e0f2fe" />
                            </linearGradient>
                          </defs>
                          <rect width="160" height="44" fill="url(#captchaGrad)" />
                          
                          {/* Garis-garis acak pengaman */}
                          {captchaData.lines.map((line, idx) => (
                            <line
                              key={`line-${idx}`}
                              x1={line.x1}
                              y1={line.y1}
                              x2={line.x2}
                              y2={line.y2}
                              stroke={line.color}
                              strokeWidth={line.strokeWidth}
                              strokeOpacity={0.6}
                            />
                          ))}

                          {/* Titik-titik acak pengaman */}
                          {captchaData.dots.map((dot, idx) => (
                            <circle
                              key={`dot-${idx}`}
                              cx={dot.cx}
                              cy={dot.cy}
                              r={dot.r}
                              fill={dot.color}
                              fillOpacity={0.4}
                            />
                          ))}

                          {/* Karakter Teks CAPTCHA */}
                          {captchaData.code.split("").map((char, idx) => {
                            const style = captchaData.charStyles[idx] || { rotate: 0, y: 28, color: "#1e3a8a" };
                            const xPos = 18 + idx * 28;
                            return (
                              <text
                                key={`char-${idx}`}
                                x={xPos}
                                y={style.y}
                                fill={style.color}
                                fontSize="22"
                                fontWeight="bold"
                                fontFamily="monospace"
                                transform={`rotate(${style.rotate}, ${xPos}, ${style.y})`}
                                textAnchor="middle"
                                className="select-none pointer-events-none drop-shadow-xs"
                              >
                                {char}
                              </text>
                            );
                          })}
                        </svg>
                      ) : (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>

                    {/* Tombol Segarkan Kode Acak */}
                    <button
                      type="button"
                      onClick={handleRefreshCaptcha}
                      className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition-all cursor-pointer shrink-0"
                      title="Ganti Kode Keamanan Baru"
                    >
                      <RotateCw className={`w-4 h-4 transition-transform ${isCaptchaRotating ? "animate-spin" : ""}`} />
                    </button>

                    {/* Tombol Suara (Audio Accessibility) */}
                    <button
                      type="button"
                      onClick={handleSpeakCaptcha}
                      className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition-all cursor-pointer shrink-0"
                      title="Dengarkan Suara Kode Keamanan"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Input Kode Keamanan Pengguna */}
                  <div className="relative">
                    <input
                      id="captcha-input"
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="Ketik 5 kode di atas..."
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      className="w-full h-11 px-3.5 bg-[#f4f7fb] border border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs sm:text-sm font-bold tracking-[0.2em] text-slate-800 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal outline-none transition-all uppercase"
                      maxLength={6}
                    />
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
                    Lupa kata sandi? Hubungi Administrator
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: INFORMASI & BANTUAN */}
            {activeTab === "info" && (
              <div className="space-y-3.5 animate-in fade-in duration-300">
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-slate-700 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-blue-900">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Panduan Masuk Sistem</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Gunakan alamat email dinas resmi yang telah didaftarkan oleh Administrator Kemendes PDT. Jika mengalami kendala akses atau lupa kata sandi, silakan berkoordinasi dengan tim Administrator.
                  </p>
                </div>

                {/* Informasi Indeks Kinerja SPIP, MRI, dan IEPK Kemendes PDT */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>Indeks Pengendalian & Risiko Kemendes PDT</span>
                    </span>
                    <span className="text-[9px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                      Evaluasi BPKP RI
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {/* 1. NILAI SPIP */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">Maturitas SPIP Terintegrasi</p>
                          <p className="text-[10px] text-slate-500 leading-tight">Level 3 (Terdefinisi)</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-emerald-700 block leading-none">3,018</span>
                        <span className="text-[9px] text-emerald-600 font-medium">Skala 5.00</span>
                      </div>
                    </div>

                    {/* 2. MANAJEMEN RISIKO INDEKS (MRI) */}
                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">Manajemen Risiko Indeks (MRI)</p>
                          <p className="text-[10px] text-slate-500 leading-tight">Level 2+ (Menuju Terdefinisi)</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-blue-700 block leading-none">2,894</span>
                        <span className="text-[9px] text-blue-600 font-medium">Skala 5.00</span>
                      </div>
                    </div>

                    {/* 3. INDEKS EFEKTIVITAS PENCEGAHAN KORUPSI (IEPK) */}
                    <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">Indeks Pencegahan Korupsi (IEPK)</p>
                          <p className="text-[10px] text-slate-500 leading-tight">Level 2+ (Terkelola)</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-indigo-700 block leading-none">2,814</span>
                        <span className="text-[9px] text-indigo-600 font-medium">Skala 5.00</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[9.5px] text-slate-400 text-center pt-0.5">
                    * Data evaluasi resmi SPIP Terintegrasi Kemendesa PDT periode sebelumnya.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("login")}
                  className="w-full h-10 rounded-xl text-xs font-semibold cursor-pointer border-slate-200 hover:bg-slate-50 transition-colors"
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
