"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ColorTheme = "emerald" | "blue" | "indigo" | "violet" | "teal" | "amber" | "rose" | "slate";
export type BgTone = "default" | "eyecare" | "cool";
export type NavbarStyle = "dark" | "tinted";
export type FontSize = "normal" | "large";

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
  isCustomizerOpen: boolean;
  setColorTheme: (theme: ColorTheme) => void;
  setBgTone: (tone: BgTone) => void;
  setNavbarStyle: (style: NavbarStyle) => void;
  setFontSize: (size: FontSize) => void;
  openCustomizer: () => void;
  closeCustomizer: () => void;
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("emerald");
  const [bgTone, setBgToneState] = useState<BgTone>("default");
  const [navbarStyle, setNavbarStyleState] = useState<NavbarStyle>("dark");
  const [fontSize, setFontSizeState] = useState<FontSize>("normal");
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Inisialisasi preferensi warna dari localStorage saat komponen dimount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("sim_risiko_theme_color") as ColorTheme | null;
      const savedBgTone = localStorage.getItem("sim_risiko_theme_bgtone") as BgTone | null;
      const savedNavbar = localStorage.getItem("sim_risiko_theme_navbar") as NavbarStyle | null;
      const savedFontSize = localStorage.getItem("sim_risiko_theme_fontsize") as FontSize | null;

      const activeTheme = savedTheme && COLOR_OPTIONS.some(c => c.id === savedTheme) ? savedTheme : "emerald";
      setColorThemeState(activeTheme);
      document.documentElement.setAttribute("data-theme", activeTheme);

      const activeBg = savedBgTone && BG_TONE_OPTIONS.some(b => b.id === savedBgTone) ? savedBgTone : "default";
      setBgToneState(activeBg);
      document.documentElement.setAttribute("data-bg-tone", activeBg);

      const activeNav = savedNavbar && ["dark", "tinted"].includes(savedNavbar) ? savedNavbar : "dark";
      setNavbarStyleState(activeNav);
      document.documentElement.setAttribute("data-navbar-style", activeNav);

      const activeFont = savedFontSize && ["normal", "large"].includes(savedFontSize) ? savedFontSize : "normal";
      setFontSizeState(activeFont);
      document.documentElement.setAttribute("data-font-size", activeFont);
    } catch (e) {
      console.warn("Gagal memuat pengaturan tema:", e);
    }
  }, []);

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
    try {
      localStorage.setItem("sim_risiko_theme_color", theme);
      document.documentElement.setAttribute("data-theme", theme);
    } catch (e) {
      console.warn(e);
    }
  };

  const setBgTone = (tone: BgTone) => {
    setBgToneState(tone);
    try {
      localStorage.setItem("sim_risiko_theme_bgtone", tone);
      document.documentElement.setAttribute("data-bg-tone", tone);
    } catch (e) {
      console.warn(e);
    }
  };

  const setNavbarStyle = (style: NavbarStyle) => {
    setNavbarStyleState(style);
    try {
      localStorage.setItem("sim_risiko_theme_navbar", style);
      document.documentElement.setAttribute("data-navbar-style", style);
    } catch (e) {
      console.warn(e);
    }
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    try {
      localStorage.setItem("sim_risiko_theme_fontsize", size);
      document.documentElement.setAttribute("data-font-size", size);
    } catch (e) {
      console.warn(e);
    }
  };

  const resetToDefault = () => {
    setColorTheme("emerald");
    setBgTone("default");
    setNavbarStyle("dark");
    setFontSize("normal");
  };

  return (
    <ThemeContext.Provider
      value={{
        colorTheme,
        bgTone,
        navbarStyle,
        fontSize,
        isCustomizerOpen,
        setColorTheme,
        setBgTone,
        setNavbarStyle,
        setFontSize,
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
