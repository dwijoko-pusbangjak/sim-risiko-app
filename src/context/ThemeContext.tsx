"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ColorTheme = "emerald" | "blue" | "indigo" | "violet" | "teal" | "amber" | "rose" | "slate";
export type BgTone = "default" | "eyecare" | "cool";
export type NavbarStyle = "dark" | "tinted";
export type FontSize = "normal" | "large";
export type MenuPosition = "top" | "sidebar";

export interface UserPreferences {
  colorTheme: ColorTheme;
  bgTone: BgTone;
  navbarStyle: NavbarStyle;
  fontSize: FontSize;
  menuPosition: MenuPosition;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  colorTheme: "emerald",
  bgTone: "default",
  navbarStyle: "dark",
  fontSize: "normal",
  menuPosition: "top",
};

export interface ColorOption {
  id: ColorTheme;
  name: string;
  tagline: string;
  badge: string;
  primaryHex: string;
  lightHex: string;
  dotColor: string;
}

export const COLOR_OPTIONS: ColorOption[] = [
  {
    id: "emerald",
    name: "Hijau Zamrud",
    tagline: "Resmi, seimbang & alami (Standar Kemendesa)",
    badge: "Default",
    primaryHex: "#059669",
    lightHex: "#ecfdf5",
    dotColor: "bg-emerald-600",
  },
  {
    id: "blue",
    name: "Biru Samudera",
    tagline: "Menenangkan mata, profesional & ramah jam kerja panjang",
    badge: "Populer",
    primaryHex: "#2563eb",
    lightHex: "#eff6ff",
    dotColor: "bg-blue-600",
  },
  {
    id: "indigo",
    name: "Indigo Elegan",
    tagline: "Teduh, modern dengan kontras lembut",
    badge: "Elegan",
    primaryHex: "#4f46e5",
    lightHex: "#eef2ff",
    dotColor: "bg-indigo-600",
  },
  {
    id: "violet",
    name: "Ungu Violet",
    tagline: "Artistik, anggun & fokus tinggi",
    badge: "Fokus",
    primaryHex: "#7c3aed",
    lightHex: "#f5f3ff",
    dotColor: "bg-violet-600",
  },
  {
    id: "teal",
    name: "Tosika Sejuk",
    tagline: "Segar, jernih & ramah pembacaan tabel data",
    badge: "Sejuk",
    primaryHex: "#0d9488",
    lightHex: "#f0fdfa",
    dotColor: "bg-teal-600",
  },
  {
    id: "amber",
    name: "Kuning Hangat",
    tagline: "Hangat, mengurangi ketegangan mata (ramah malam)",
    badge: "Hangat",
    primaryHex: "#d97706",
    lightHex: "#fffbeb",
    dotColor: "bg-amber-600",
  },
  {
    id: "rose",
    name: "Mawar Modern",
    tagline: "Berkarakter tegas, dinamis & estetis",
    badge: "Dinamis",
    primaryHex: "#e11d48",
    lightHex: "#fff1f2",
    dotColor: "bg-rose-600",
  },
  {
    id: "slate",
    name: "Abu-abu Netral",
    tagline: "Minimalis, monokrom tenang & bebas distraksi",
    badge: "Minimalis",
    primaryHex: "#475569",
    lightHex: "#f8fafc",
    dotColor: "bg-slate-600",
  },
];

export interface BgToneOption {
  id: BgTone;
  name: string;
  tagline: string;
  colorPreview: string;
}

export const BG_TONE_OPTIONS: BgToneOption[] = [
  {
    id: "default",
    name: "Standar Bersih",
    tagline: "Latar putih & abu-abu terang segar",
    colorPreview: "bg-[#f8fafc] border-slate-300",
  },
  {
    id: "eyecare",
    name: "Ramah Mata (Eye-Care)",
    tagline: "Nuansa kertas hangat lembut, kurangi silau layar",
    colorPreview: "bg-[#faf7f2] border-amber-200",
  },
  {
    id: "cool",
    name: "Sejuk Nordic",
    tagline: "Nuansa keperakan dingin yang menenangkan",
    colorPreview: "bg-[#f0f4f9] border-blue-200",
  },
];

interface ThemeContextType {
  colorTheme: ColorTheme;
  bgTone: BgTone;
  navbarStyle: NavbarStyle;
  fontSize: FontSize;
  menuPosition: MenuPosition;
  isCustomizerOpen: boolean;
  setColorTheme: (theme: ColorTheme) => void;
  setBgTone: (tone: BgTone) => void;
  setNavbarStyle: (style: NavbarStyle) => void;
  setFontSize: (size: FontSize) => void;
  setMenuPosition: (pos: MenuPosition) => void;
  openCustomizer: () => void;
  closeCustomizer: () => void;
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Helper untuk menerapkan atribut CSS ke root document
  const applyDomAttributes = (targetPrefs: UserPreferences) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", targetPrefs.colorTheme);
      document.documentElement.setAttribute("data-bg-tone", targetPrefs.bgTone);
      document.documentElement.setAttribute("data-navbar-style", targetPrefs.navbarStyle);
      document.documentElement.setAttribute("data-font-size", targetPrefs.fontSize);
    }
  };

  // Muat preferensi khusus akun pengguna saat login / berganti user
  useEffect(() => {
    // Bersihkan kunci lama yang bersifat global tanpa pemisahan akun
    try {
      localStorage.removeItem("sim_risiko_theme_color");
      localStorage.removeItem("sim_risiko_theme_bgtone");
      localStorage.removeItem("sim_risiko_theme_navbar");
      localStorage.removeItem("sim_risiko_theme_fontsize");
      localStorage.removeItem("sim_risiko_menu_position");
    } catch (e) {
      console.warn("Clean error:", e);
    }

    if (!user?.uid) {
      // Jika pengguna belum login atau sudah logout: kembalikan ke default bersih
      setPrefs(DEFAULT_PREFERENCES);
      applyDomAttributes(DEFAULT_PREFERENCES);
      return;
    }

    // 1. Ambil preferensi lokal khusus user ini dari localStorage
    const userStorageKey = `sim_risiko_user_prefs_${user.uid}`;
    let initialUserPrefs: UserPreferences = DEFAULT_PREFERENCES;

    try {
      const stored = localStorage.getItem(userStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        initialUserPrefs = {
          colorTheme: COLOR_OPTIONS.some((c) => c.id === parsed.colorTheme) ? parsed.colorTheme : DEFAULT_PREFERENCES.colorTheme,
          bgTone: BG_TONE_OPTIONS.some((b) => b.id === parsed.bgTone) ? parsed.bgTone : DEFAULT_PREFERENCES.bgTone,
          navbarStyle: ["dark", "tinted"].includes(parsed.navbarStyle) ? parsed.navbarStyle : DEFAULT_PREFERENCES.navbarStyle,
          fontSize: ["normal", "large"].includes(parsed.fontSize) ? parsed.fontSize : DEFAULT_PREFERENCES.fontSize,
          menuPosition: ["top", "sidebar"].includes(parsed.menuPosition) ? parsed.menuPosition : DEFAULT_PREFERENCES.menuPosition,
        };
      }
    } catch (e) {
      console.warn("Parse local user preferences error:", e);
    }

    setPrefs(initialUserPrefs);
    applyDomAttributes(initialUserPrefs);

    // 2. Sinkronisasi dengan database cloud Firestore (user_preferences)
    const syncCloudPreferences = async () => {
      try {
        const docRef = doc(db, "user_preferences", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const merged: UserPreferences = {
            colorTheme: COLOR_OPTIONS.some((c) => c.id === data.colorTheme) ? data.colorTheme : initialUserPrefs.colorTheme,
            bgTone: BG_TONE_OPTIONS.some((b) => b.id === data.bgTone) ? data.bgTone : initialUserPrefs.bgTone,
            navbarStyle: ["dark", "tinted"].includes(data.navbarStyle) ? data.navbarStyle : initialUserPrefs.navbarStyle,
            fontSize: ["normal", "large"].includes(data.fontSize) ? data.fontSize : initialUserPrefs.fontSize,
            menuPosition: ["top", "sidebar"].includes(data.menuPosition) ? data.menuPosition : initialUserPrefs.menuPosition,
          };

          setPrefs(merged);
          applyDomAttributes(merged);
          localStorage.setItem(userStorageKey, JSON.stringify(merged));
        }
      } catch (err) {
        console.warn("Sync cloud preferences error:", err);
      }
    };

    syncCloudPreferences();
  }, [user?.uid]);

  // Fungsi pembantu untuk menyimpan preferensi terisolasi per akun pengguna
  const updatePreference = (patch: Partial<UserPreferences>) => {
    setPrefs((prev) => {
      const updated: UserPreferences = { ...prev, ...patch };
      applyDomAttributes(updated);

      if (user?.uid) {
        const userStorageKey = `sim_risiko_user_prefs_${user.uid}`;
        try {
          localStorage.setItem(userStorageKey, JSON.stringify(updated));
        } catch (e) {
          console.warn("Save local preference error:", e);
        }

        // Simpan ke Firestore secara asinkron
        setDoc(
          doc(db, "user_preferences", user.uid),
          {
            ...updated,
            uid: user.uid,
            email: user.email || "",
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch((err) => {
          console.warn("Gagal simpan preferensi ke Firestore:", err);
        });
      }

      return updated;
    });
  };

  const setColorTheme = (theme: ColorTheme) => updatePreference({ colorTheme: theme });
  const setBgTone = (tone: BgTone) => updatePreference({ bgTone: tone });
  const setNavbarStyle = (style: NavbarStyle) => updatePreference({ navbarStyle: style });
  const setFontSize = (size: FontSize) => updatePreference({ fontSize: size });
  const setMenuPosition = (pos: MenuPosition) => updatePreference({ menuPosition: pos });

  const resetToDefault = () => {
    updatePreference(DEFAULT_PREFERENCES);
  };

  return (
    <ThemeContext.Provider
      value={{
        colorTheme: prefs.colorTheme,
        bgTone: prefs.bgTone,
        navbarStyle: prefs.navbarStyle,
        fontSize: prefs.fontSize,
        menuPosition: prefs.menuPosition,
        isCustomizerOpen,
        setColorTheme,
        setBgTone,
        setNavbarStyle,
        setFontSize,
        setMenuPosition,
        openCustomizer: () => setIsCustomizerOpen(true),
        closeCustomizer: () => setIsCustomizerOpen(false),
        resetToDefault,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
