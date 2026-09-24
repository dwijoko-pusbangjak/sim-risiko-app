"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ShieldCheck, LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  
  const router = useRouter();
  const { setActiveYear, user } = useAuth();

  useEffect(() => {
    if (user) {
      import('@/lib/logger').then(({ logActivity }) => {
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
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError("Login gagal. Periksa kembali email dan kata sandi Anda.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4 relative overflow-hidden">
      {/* Gambar Latar Belakang Penuh */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-20 mix-blend-multiply"
        style={{ backgroundImage: "url('/bg-kemendes.jpg')" }}
      />
      {/* Overlay Blur Halus */}
      <div className="absolute inset-0 backdrop-blur-sm pointer-events-none" />

      {/* Kotak Utama Login (Tengah) */}
      <div className="w-full max-w-[1000px] bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row z-10 min-h-[600px]" style={{ boxShadow: "0 30px 60px -10px rgba(0,0,0,0.8), 0 20px 40px -20px rgba(0,0,0,0.6)" }}>
        
        {/* Sisi Kiri: Wallpaper / Gambar Sosialisasi */}
        <div className="hidden md:flex md:w-[50%] relative bg-slate-900 overflow-hidden items-center justify-center">
          {wallpaperUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={wallpaperUrl} 
                alt="Pengumuman / Sosialisasi Si-MaRi" 
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                onError={(e) => {
                   (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-800 to-emerald-900 opacity-95">
              <div className="absolute top-0 right-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                 <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white blur-3xl mix-blend-overlay"></div>
                 <div className="absolute bottom-12 -left-12 w-48 h-48 rounded-full bg-emerald-400 blur-3xl mix-blend-overlay"></div>
              </div>
            </div>
          )}
          
          {!wallpaperUrl && (
             <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 animate-in fade-in duration-1000">
               <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl mb-6 shadow-xl border border-white/20">
                 <ShieldCheck className="w-14 h-14 text-white" />
               </div>
               <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Si-MaRi</h1>
               <p className="text-base text-slate-200 max-w-sm font-medium leading-relaxed">
                 Sistem Informasi Manajemen Risiko Kementerian Desa dan Pembangunan Daerah Tertinggal
               </p>
             </div>
          )}
        </div>

        {/* Sisi Kanan: Form Login */}
        <div className="w-full md:w-[50%] flex items-center justify-center p-8 sm:p-12 bg-white relative">
          <div className="w-full max-w-[360px] space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 delay-150 fill-mode-both">
            
            <div className="space-y-2 md:hidden mb-8 text-center">
               <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-xl mb-3">
                 <ShieldCheck className="w-8 h-8 text-emerald-700" />
               </div>
               <h1 className="text-2xl font-bold tracking-tight text-slate-900">Si-MaRi</h1>
               <p className="text-sm text-slate-500">Kemendes PDT</p>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Masuk</h2>
              <p className="text-sm text-slate-500 font-medium">
                Silakan masuk ke akun Anda untuk melanjutkan.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium border border-red-200 flex items-center relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                  <span className="pl-2">{error}</span>
                </div>
              )}
              
              <div className="space-y-2.5">
                <Label htmlFor="year" className="text-slate-700 font-semibold">Tahun Manajemen Risiko</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year" className="h-11 bg-slate-50 border-slate-200 focus:ring-emerald-500">
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                    <SelectItem value="2028">2028</SelectItem>
                    <SelectItem value="2029">2029</SelectItem>
                    <SelectItem value="2030">2030</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-slate-700 font-semibold">Alamat Email / ID Pengguna</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nama@kemendesa.go.id" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700 font-semibold">Kata Sandi</Label>
                </div>
                <Input 
                  id="password" 
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg mt-6" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    Masuk Sistem <LogIn className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center text-xs text-slate-400">
              <p>&copy; {new Date().getFullYear()} Kementerian Desa PDT.</p>
              <p>Sistem Informasi Manajemen Risiko.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
