"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Save, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      fetchSettings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const fetchSettings = async () => {
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
      console.error("Error fetching settings:", error);
      toast.error("Gagal memuat pengaturan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, "settings", "general");
      await setDoc(docRef, {
        loginWallpaperUrl: wallpaperUrl,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email
      }, { merge: true });
      
      toast.success("Pengaturan wallpaper berhasil disimpan!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Gagal menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Pengaturan Sistem</h2>
        <p className="text-slate-500">Kelola konfigurasi global aplikasi SIM Risiko.</p>
      </div>

      <Card className="max-w-2xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <ImageIcon className="mr-2 h-5 w-5 text-indigo-600" /> Wallpaper Halaman Login
          </CardTitle>
          <CardDescription>
            Atur gambar yang akan muncul di sisi kiri halaman login. Gunakan URL gambar yang valid (akhiran .jpg, .png).
            Ini berguna untuk media pengumuman atau sosialisasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wallpaperUrl">URL Gambar Wallpaper</Label>
            <Input 
              id="wallpaperUrl" 
              placeholder="Contoh: https://example.com/pengumuman.jpg" 
              value={wallpaperUrl}
              onChange={(e) => setWallpaperUrl(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Kosongkan jika ingin menggunakan warna solid/gradien bawaan.
            </p>
          </div>

          {wallpaperUrl && (
            <div className="mt-4 space-y-2">
              <Label>Pratinjau Gambar:</Label>
              <div className="border border-slate-200 rounded-lg overflow-hidden h-48 bg-slate-100 flex items-center justify-center relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={wallpaperUrl} 
                  alt="Wallpaper Preview" 
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "";
                    (e.target as HTMLImageElement).alt = "Gambar tidak dapat dimuat (URL tidak valid)";
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-slate-100 px-6 py-4">
          <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 ml-auto">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Pengaturan
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
