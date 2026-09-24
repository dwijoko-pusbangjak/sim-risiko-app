"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Save, Image as ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
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
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setWallpaperUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalUrl = wallpaperUrl;

      if (uploadFile) {
        toast.info("Mengunggah gambar...");
        const storageRef = ref(storage, `wallpapers/login_wallpaper_${Date.now()}_${uploadFile.name}`);
        await uploadBytes(storageRef, uploadFile);
        finalUrl = await getDownloadURL(storageRef);
      }

      const docRef = doc(db, "settings", "general");
      await setDoc(docRef, {
        loginWallpaperUrl: finalUrl,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email
      }, { merge: true });
      
      toast.success("Pengaturan wallpaper berhasil disimpan!");
      setUploadFile(null);
      setWallpaperUrl(finalUrl);
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
        <p className="text-slate-500">Kelola konfigurasi global aplikasi Si-MaRi.</p>
      </div>

      <Card className="max-w-2xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <ImageIcon className="mr-2 h-5 w-5 text-indigo-600" /> Wallpaper Halaman Login
          </CardTitle>
          <CardDescription>
            Unggah gambar yang akan muncul di sisi kiri halaman login. Gunakan gambar beresolusi baik (.jpg, .png).
            Ini berguna untuk media pengumuman atau sosialisasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wallpaperFile">Upload Gambar Wallpaper (Opsional)</Label>
            <div className="flex items-center gap-4">
              <Input 
                id="wallpaperFile" 
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer file:cursor-pointer"
              />
              <Button type="button" variant="outline" onClick={() => {
                setUploadFile(null);
                setWallpaperUrl("");
                const fileInput = document.getElementById("wallpaperFile") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
              }}>
                Hapus
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Kosongkan dan simpan jika ingin menggunakan warna solid/gradien bawaan.
            </p>
          </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium">ATAU</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wallpaperUrl">Gunakan Tautan (URL) Gambar</Label>
              <Input 
                id="wallpaperUrl" 
                type="url"
                placeholder="https://contoh.com/gambar-wallpaper.jpg"
                value={!uploadFile ? wallpaperUrl : ""}
                onChange={(e) => {
                  setUploadFile(null);
                  setWallpaperUrl(e.target.value);
                  const fileInput = document.getElementById("wallpaperFile") as HTMLInputElement;
                  if (fileInput) fileInput.value = "";
                }}
              />
              <p className="text-xs text-slate-500">
                Jika Firebase Storage terkunci, Anda bisa mengunggah gambar ke situs seperti Imgur/Postimages lalu menempelkan tautannya di sini.
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
