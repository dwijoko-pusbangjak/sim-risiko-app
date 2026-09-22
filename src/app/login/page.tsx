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
    // Jika state user sudah aktif (berhasil ditarik dari AuthContext), langsung redirect ke dashboard
    if (user) {
      import('@/lib/logger').then(({ logActivity }) => {
        logActivity(user, "Login", "Autentikasi", "Berhasil masuk ke sistem.");
      });
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    // Mengambil pengaturan URL Wallpaper dari Firestore
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
      // Redirect di-handle oleh useEffect di atas agar AuthContext sinkron
    } catch (err: any) {
      setError("Login gagal. Periksa kembali email dan kata sandi Anda.");
      setLoading(false); // Hanya matikan loading jika error
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      
      {/* Sisi Kiri: Wallpaper / Gambar Sosialisasi */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[65%] relative bg-slate-900 overflow-hidden items-center justify-center">
        {wallpaperUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={wallpaperUrl} 
              alt="Pengumuman / Sosialisasi SIM-Risiko" 
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
              onError={(e) => {
                 (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {/* Gradient shadow from bottom for readability if there is text over it */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-800 to-emerald-900 opacity-95">
            {/* Dekorasi Abstract saat tidak ada wallpaper */}
            <div className="absolute top-0 right-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
               <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white blur-3xl mix-blend-overlay"></div>
               <div className="absolute bottom-12 -left-12 w-64 h-64 rounded-full bg-emerald-400 blur-3xl mix-blend-overlay"></div>
            </div>
          </div>
        )}
        
        {/* Konten Default jika tidak ada Wallpaper */}
        {!wallpaperUrl && (
           <div className="relative z-10 flex flex-col items-center justify-center text-center px-12 animate-in fade-in duration-1000">
             <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl mb-6 shadow-xl border border-white/20">
               <ShieldCheck className="w-16 h-16 text-white" />
             </div>
             <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">SIM-Risiko</h1>
             <p className="text-lg md:text-xl text-slate-200 max-w-lg font-medium leading-relaxed">
               Sistem Informasi Manajemen Risiko Kementerian Desa dan Pembangunan Daerah Tertinggal
             </p>
           </div>
        )}
      </div>

      {/* Sisi Kanan: Form Login */}
      <div className="w-full lg:w-[45%] xl:w-[35%] flex items-center justify-center p-8 sm:p-12 bg-white relative">
        <div className="w-full max-w-[360px] space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 delay-150 fill-mode-both">
          
          <div className="space-y-2 lg:hidden mb-10 text-center">
             <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-xl mb-4">
               <ShieldCheck className="w-10 h-10 text-emerald-700" />
             </div>
             <h1 className="text-2xl font-bold tracking-tight text-slate-900">SIM-Risiko</h1>
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
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium border border-red-200 flex items-center">
                <div className="w-1 h-full bg-red-500 rounded-full mr-3 absolute left-0" />
                {error}
              </div>
            )}
            
            <div className="space-y-2.5">
              <Label htmlFor="year" className="text-slate-700">Tahun Manajemen Risiko</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year" className="h-11 bg-slate-50">
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
              <Label htmlFor="email" className="text-slate-700">Alamat Email / ID Pengguna</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nama@kemendesa.go.id" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-slate-50"
                required
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700">Kata Sandi</Label>
              </div>
              <Input 
                id="password" 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-slate-50"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg mt-4" 
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

          <div className="pt-6 text-center">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Kementerian Desa PDT. Seluruh hak cipta dilindungi.
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
