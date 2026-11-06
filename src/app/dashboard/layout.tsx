"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, SearchCheck, Send, Inbox, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Settings,
  DatabaseBackup, 
  LogOut,
  Menu,
  User,
  Users,
  Building2,
  Target,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FolderTree,
  ClipboardList,
  ShieldAlert,
  BarChart4,
  BookOpen,
  BookMarked,
  Sparkles,
  Search,
  X,
  PanelLeftClose,
  PanelLeft,
  Home,
  Calendar,
  CheckCircle2,
  HelpCircle,
  KeyRound,
  ArrowRight
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import AIChatBox from "@/components/AIChatBox";
import { cn } from "cn";

type NavItemChild = {
  name: string;
  href: string;
  step?: string;
  badge?: string;
};

type NavItem = {
  name: string;
  href?: string;
  icon: any;
  badge?: string;
  children?: NavItemChild[];
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const LiveClock = () => {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return <div className="h-4"></div>;

  return (
    <div className="text-[11px] xl:text-[12px] font-medium text-slate-500 flex items-center gap-1.5">
      <Calendar className="w-3.5 h-3.5 text-slate-400" />
      <span>
        {time.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </span>
      <span className="text-slate-300">•</span>
      <span className="font-mono text-slate-600 font-semibold">
        {time.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </span>
    </div>
  );
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    "Proses Manajemen Risiko": true,
    "Proses Riviu": true,
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { user, loading, activeYear } = useAuth();
  const [isAnalisisRtpEnabled, setIsAnalisisRtpEnabled] = useState<boolean>(true);

  // Subscribe to real-time general settings for Analisis RTP visibility
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "general"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.isAnalisisRtpEnabled === "boolean") {
            setIsAnalisisRtpEnabled(data.isAnalisisRtpEnabled);
          } else {
            setIsAnalisisRtpEnabled(true);
          }
        }
      },
      (err) => {
        console.error("Error subscribing to settings:", err);
      }
    );

    return () => unsub();
  }, []);

  // Redirect jika tidak login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Otomatis buka menu induk jika child sedang aktif
  useEffect(() => {
    if (pathname.startsWith("/dashboard/mr-")) {
      setOpenMenus((prev) => ({ ...prev, "Proses Manajemen Risiko": true }));
    }
    if (pathname.startsWith("/dashboard/proses-audit/")) {
      setOpenMenus((prev) => ({ ...prev, "Proses Riviu": true }));
    }
  }, [pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const getRoleLabel = (role: string | null) => {
    if (role === "admin") return "Administrator";
    if (role === "kementerian") return "Pengelola Risiko Kementerian";
    if (role === "auditor") return "Auditor APIP";
    if (role === "eselon_1") return "Unit Kerja Eselon 1";
    if (role === "eselon_2") return "Unit Kerja Eselon 2";
    if (role === "pimpinan") return "Pimpinan Unit Kerja";
    return "Pengguna";
  };

  const getUserInitials = (nameOrEmail: string | undefined | null) => {
    if (!nameOrEmail) return "MR";
    const parts = nameOrEmail.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameOrEmail.substring(0, 2).toUpperCase();
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-emerald-700 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Memuat Sistem Manajemen Risiko...</p>
        </div>
      </div>
    );
  }

  // Struktur Group Navigasi
  const navGroups: NavGroup[] = [];

  // Group 1: Overview
  navGroups.push({
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Katalog Peraturan", href: "/dashboard/katalog-peraturan", icon: BookOpen, badge: "Regulasi" },
      { name: "Modul Aplikasi", href: "/dashboard/modul", icon: BookMarked, badge: "Panduan" },
    ],
  });

  // Group 2: Cascading Kinerja
  const sasaranItems: NavItem[] = [];
  if (user.role === "admin" || user.role === "kementerian") {
    sasaranItems.push({ name: "Sasaran Strategis", href: "/dashboard/sasaran-strategis", icon: Target, badge: "Level 1" });
    sasaranItems.push({ name: "Sasaran Program", href: "/dashboard/sasaran-program", icon: Target, badge: "Level 2" });
    sasaranItems.push({ name: "Sasaran Kegiatan", href: "/dashboard/sasaran-kegiatan", icon: Target, badge: "Level 3" });
  } else if (user.role === "eselon_1") {
    sasaranItems.push({ name: "Sasaran Program", href: "/dashboard/sasaran-program", icon: Target, badge: "Level 2" });
  } else if (user.role === "eselon_2") {
    sasaranItems.push({ name: "Sasaran Kegiatan", href: "/dashboard/sasaran-kegiatan", icon: Target, badge: "Level 3" });
  }
  if (sasaranItems.length > 0) {
    navGroups.push({ title: "Cascading Kinerja", items: sasaranItems });
  }

  // Group 3: Manajemen Risiko (Khusus non-admin)
  if (user.role !== "admin" && user.role !== "auditor") {
    if (user.role === "pimpinan") {
      const pimpinanItems: NavItem[] = [];
      if (isAnalisisRtpEnabled) {
        pimpinanItems.push({ name: "Analisis RTP", href: "/dashboard/mr-analisis-rtp", icon: Sparkles, badge: "Telaah" });
      }
      pimpinanItems.push({ name: "Cetak Laporan", href: "/dashboard/laporan", icon: BarChart4, badge: "PDF" });

      navGroups.push({
        title: "Pemantauan & Laporan",
        items: pimpinanItems,
      });
    } else {
      const prosesMRChildren: NavItemChild[] = [
        { name: "Identifikasi Risiko", href: "/dashboard/mr-identifikasi", step: "01" },
        { name: "Analisis Risiko", href: "/dashboard/mr-analisis", step: "02" },
        { name: "Rencana Tindak Pengendalian", href: "/dashboard/mr-rtp", step: "03" },
        { name: "Pemantauan RTP", href: "/dashboard/mr-pemantauan", step: "04" },
        { name: "Pencatatan Keterjadian", href: "/dashboard/mr-keterjadian", step: "05" },
        { name: "Efektifitas RTP", href: "/dashboard/mr-efektifitas", step: "06" },
      ];
      if (isAnalisisRtpEnabled) {
        prosesMRChildren.push({ name: "Analisis RTP", href: "/dashboard/mr-analisis-rtp", step: "07", badge: "Telaah" });
      }

      navGroups.push({
        title: "Manajemen Risiko",
        items: [
          { name: "Penetapan Konteks", href: "/dashboard/mr-konteks", icon: ClipboardList, badge: "Awal" },
          {
            name: "Proses Manajemen Risiko",
            icon: FolderTree,
            children: prosesMRChildren,
          },
          {
            name: "Proses Riviu",
            icon: SearchCheck,
            children: [
              { name: "Kirim ke Auditor", href: "/dashboard/proses-audit/kirim", badge: "Kirim" },
              { name: "Inbox Hasil Auditor", href: "/dashboard/proses-audit/inbox", badge: "Inbox" },
            ],
          },
          { name: "Cetak Laporan", href: "/dashboard/laporan", icon: BarChart4, badge: "PDF" },
        ],
      });
    }
  }

  // Group 4: Administrator (khusus admin - selalu tampil agar admin bisa mengatur)
  if (user.role === "admin") {
    navGroups.push({
      title: "Administrator",
      items: [
        { name: "Manajemen Unit Kerja", href: "/dashboard/units", icon: Building2 },
        { name: "Manajemen Pengguna", href: "/dashboard/users", icon: Users },
        { name: "Analisis RTP", href: "/dashboard/mr-analisis-rtp", icon: Sparkles, badge: "Kontrol" },
        { name: "Log Aktivitas", href: "/dashboard/logs", icon: FileText },
        { name: "Pengaturan Sistem", href: "/dashboard/settings", icon: Settings },
        { name: "Backup & Restore", href: "/dashboard/backup", icon: DatabaseBackup },
      ],
    });
  }

  if (user?.role === "auditor") {
    const auditorItems: NavItem[] = [
      { name: "Audit Risiko", href: "/dashboard/audit", icon: SearchCheck, badge: "APIP" },
    ];
    if (isAnalisisRtpEnabled) {
      auditorItems.push({ name: "Analisis RTP", href: "/dashboard/mr-analisis-rtp", icon: Sparkles, badge: "Telaah" });
    }
    auditorItems.push({ name: "Cetak Laporan", href: "/dashboard/laporan", icon: BarChart4, badge: "PDF" });

    navGroups.push({
      title: "Auditor",
      items: auditorItems,
    });
  }

  // Filter Navigasi Cepat (Quick Search Filter)
  const filteredNavGroups = useMemo(() => {
    if (!searchQuery.trim()) return navGroups;
    const q = searchQuery.toLowerCase().trim();

    return navGroups
      .map((group) => {
        const matchingItems = group.items
          .map((item) => {
            const itemMatches = item.name.toLowerCase().includes(q);
            if (item.children) {
              const matchingChildren = item.children.filter(
                (c) => c.name.toLowerCase().includes(q) || itemMatches
              );
              if (matchingChildren.length > 0) {
                return { ...item, children: matchingChildren };
              }
              if (itemMatches) {
                return item;
              }
              return null;
            }
            return itemMatches ? item : null;
          })
          .filter(Boolean) as NavItem[];

        return { ...group, items: matchingItems };
      })
      .filter((group) => group.items.length > 0);
  }, [navGroups, searchQuery]);

  // Mencari nama halaman saat ini untuk Topbar
  let currentPageName = "Dashboard";
  navGroups.forEach((group) => {
    group.items.forEach((item) => {
      if (item.href === pathname) currentPageName = item.name;
      if (item.children) {
        const child = item.children.find((c) => c.href === pathname);
        if (child) currentPageName = child.name;
      }
    });
  });

  // Breadcrumbs Generator Dinamis
  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; href?: string }[] = [{ label: "Beranda", href: "/dashboard" }];
    if (pathname === "/dashboard") return crumbs;

    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.href === pathname) {
          if (group.title !== "Overview") {
            crumbs.push({ label: group.title });
          }
          crumbs.push({ label: item.name, href: item.href });
          return crumbs;
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.href === pathname) {
              if (group.title !== "Overview") {
                crumbs.push({ label: group.title });
              }
              crumbs.push({ label: item.name });
              crumbs.push({ label: child.name, href: child.href });
              return crumbs;
            }
          }
        }
      }
    }

    return [{ label: "Beranda", href: "/dashboard" }, { label: currentPageName }];
  }, [pathname, navGroups, currentPageName]);

  // Render Navigasi Menu
  const renderNavGroups = (groups: NavGroup[], isMobile = false) => {
    if (groups.length === 0 && searchQuery.trim()) {
      return (
        <div className="text-center py-10 px-3 space-y-2">
          <Search className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-300">Menu tidak ditemukan</p>
          <p className="text-[11px] text-slate-500">
            Tidak ada menu yang sesuai kata kunci &quot;{searchQuery}&quot;
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs text-emerald-400 hover:underline font-medium pt-1 cursor-pointer"
          >
            Bersihkan Pencarian
          </button>
        </div>
      );
    }

    const collapsedView = isCollapsed && !isMobile;

    return groups.map((group, idx) => (
      <div key={group.title} className={idx > 0 ? (collapsedView ? "mt-4 pt-3 border-t border-slate-800/60" : "mt-5") : ""}>
        {/* Header Kategori */}
        {!collapsedView ? (
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-[10px] xl:text-[11px] font-extrabold uppercase tracking-wider text-slate-400/90 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {group.title}
            </h3>
            <span className="text-[9px] font-bold text-slate-500 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800">
              {group.items.length}
            </span>
          </div>
        ) : (
          <div className="w-6 h-0.5 bg-slate-800/80 mx-auto mb-2" />
        )}

        <div className="space-y-1">
          {group.items.map((item) => {
            const Icon = item.icon;
            const isDirectActive = item.href ? pathname === item.href : false;
            const hasChildActive = item.children?.some((c) => pathname === c.href);
            const isActive = isDirectActive || hasChildActive;

            // Jika ada children (Submenu bertingkat)
            if (item.children) {
              const isOpen =
                searchQuery.trim().length > 0
                  ? true
                  : openMenus[item.name] !== undefined
                  ? openMenus[item.name]
                  : Boolean(isActive);

              if (collapsedView) {
                // Di mode collapsed: klik icon untuk ekspansi sidebar dan langsung buka menu
                return (
                  <div key={item.name} className="flex justify-center py-0.5">
                    <button
                      onClick={() => {
                        setIsCollapsed(false);
                        setOpenMenus((prev) => ({ ...prev, [item.name]: true }));
                      }}
                      title={`${item.name} (${item.children.length} sub-menu)`}
                      className={cn(
                        "p-2.5 rounded-xl transition-all relative group cursor-pointer",
                        isActive
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/40"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {hasChildActive && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
                      )}
                    </button>
                  </div>
                );
              }

              return (
                <div key={item.name} className="flex flex-col space-y-1">
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      "group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all w-full cursor-pointer",
                      hasChildActive
                        ? "bg-slate-800/90 text-emerald-300 border border-emerald-900/40 shadow-xs"
                        : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    )}
                  >
                    <div className="flex items-center flex-1 min-w-0 pr-2">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center mr-2.5 transition-colors shrink-0",
                        hasChildActive ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-900 text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-800"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-left leading-tight truncate flex-1 font-semibold">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono bg-slate-900/80 text-slate-400 border border-slate-800">
                        {item.children.length}
                      </span>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-slate-400 transition-transform" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400 transition-transform" />
                      )}
                    </div>
                  </button>

                  {/* Daftar Submenu Children dengan Timeline Line & Step Badge */}
                  <div
                    className={cn(
                      "grid transition-all duration-200 ease-in-out",
                      isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="flex flex-col space-y-1 pl-4 pr-1 pb-1 relative before:absolute before:left-6 before:top-1 before:bottom-3 before:w-px before:bg-slate-800">
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href;
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              onClick={() => isMobile && setIsSidebarOpen(false)}
                              className={cn(
                                "group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all",
                                isChildActive
                                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md shadow-emerald-950/30"
                                  : "text-slate-400 hover:text-emerald-200 hover:bg-slate-800/60"
                              )}
                            >
                              <div className="flex items-center min-w-0 flex-1 pr-2">
                                {/* Step Pill atau Bullet Dot */}
                                {child.step ? (
                                  <span
                                    className={cn(
                                      "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md mr-2 shrink-0 border transition-colors",
                                      isChildActive
                                        ? "bg-white/20 text-white border-white/30"
                                        : "bg-slate-900 text-emerald-400 border-slate-700/60 group-hover:border-emerald-600/50"
                                    )}
                                  >
                                    {child.step}
                                  </span>
                                ) : (
                                  <span
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full mr-2.5 shrink-0 transition-colors",
                                      isChildActive ? "bg-white" : "bg-slate-600 group-hover:bg-emerald-400"
                                    )}
                                  />
                                )}
                                <span className="truncate leading-tight">{child.name}</span>
                              </div>

                              {child.badge && (
                                <span
                                  className={cn(
                                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0",
                                    isChildActive
                                      ? "bg-white/20 text-white"
                                      : "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                                  )}
                                >
                                  {child.badge}
                                </span>
                              )}

                              {isChildActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white ml-1.5 shrink-0 animate-pulse" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Menu Langsung (Direct Link)
            if (collapsedView) {
              return (
                <div key={item.name} className="flex justify-center py-0.5">
                  <Link
                    href={item.href!}
                    title={item.name}
                    className={cn(
                      "p-2.5 rounded-xl transition-all relative group cursor-pointer",
                      isDirectActive
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/40"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {isDirectActive && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                    )}
                  </Link>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href!}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={cn(
                  "group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all w-full cursor-pointer",
                  isDirectActive
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/30 font-bold"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                )}
              >
                <div className="flex items-center flex-1 min-w-0 pr-2">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center mr-2.5 transition-colors shrink-0",
                    isDirectActive ? "bg-white/20 text-white" : "bg-slate-900 text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-800"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-left leading-tight truncate flex-1">{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 border",
                      isDirectActive
                        ? "bg-white/20 text-white border-white/30"
                        : "bg-slate-900 text-emerald-400 border-slate-700/60"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 print:h-auto print:min-h-0 print:block print:overflow-visible font-sans">
      {/* ====================================================================== */}
      {/* SIDEBAR UNTUK DESKTOP (ELEGANT DARK EMERALD THEME)                    */}
      {/* ====================================================================== */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-slate-800 bg-gradient-to-b from-[#090d16] via-[#0f172a] to-[#0a1120] text-slate-200 shrink-0 transition-all duration-300 ease-in-out print:hidden relative z-30",
          isCollapsed ? "w-20" : "w-64 xl:w-72"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 xl:px-5 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 ring-1 ring-white/20 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-black text-white tracking-tight leading-none">
                    Si<span className="text-emerald-400">-MaRi</span>
                  </h1>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                    v2.0
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                  Kemendes PDT
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Perkecil Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Info Profil di Sidebar */}
        <div className="border-b border-slate-800/80 p-3.5 xl:p-4 bg-slate-900/40 shrink-0">
          {!isCollapsed ? (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm ring-2 ring-emerald-500/30">
                {getUserInitials(user.unitName || user.email)}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p
                  className="text-xs font-bold text-white truncate leading-tight"
                  title={user.unitName || user.email || ""}
                >
                  {user.unitName || user.email}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {getRoleLabel(user.role)}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-300 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded-md">
                    TA {activeYear}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-emerald-500/30 cursor-pointer"
                title={`${user.unitName || user.email} (${getRoleLabel(user.role)})`}
                onClick={() => setIsCollapsed(false)}
              >
                {getUserInitials(user.unitName || user.email)}
              </div>
            </div>
          )}
        </div>

        {/* Input Pencarian Cepat Menu Navigasi */}
        {!isCollapsed ? (
          <div className="px-3.5 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari menu navigasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-2 flex justify-center shrink-0">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cari Menu Navigasi"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* List Menu Scrollable */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-3 custom-scrollbar space-y-1">
          {renderNavGroups(filteredNavGroups)}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800/80 p-3 shrink-0 bg-slate-950/60">
          {!isCollapsed ? (
            <div className="space-y-2">
              <Link
                href="/dashboard/modul"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-emerald-950/40 border border-slate-800/80 hover:border-emerald-800/50 text-slate-300 hover:text-emerald-300 transition-all text-xs group"
              >
                <div className="flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">Panduan Alur MR</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </Link>
              <p className="text-[10px] text-slate-500 text-center font-medium">
                Kemendes PDT © 2026
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setIsCollapsed(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Perluas Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ====================================================================== */}
      {/* AREA KONTEN UTAMA & TOPBAR                                             */}
      {/* ====================================================================== */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden print:block print:overflow-visible">
        {/* Header / Topbar */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6 shrink-0 shadow-xs border-slate-200/80 print:hidden relative z-20">
          {/* Sisi Kiri: Mobile Toggle & Breadcrumbs Navigasi */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Desktop Sidebar Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
              title={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
            >
              {isCollapsed ? (
                <PanelLeft className="w-4 h-4 text-slate-600" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Mobile Brand Logo */}
            <div className="flex items-center gap-1.5 md:hidden">
              <ShieldAlert className="h-5 w-5 text-emerald-600" />
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                Si<span className="text-emerald-600">-MaRi</span>
              </h1>
            </div>

            {/* Desktop Breadcrumbs & Page Heading */}
            <div className="hidden md:flex flex-col min-w-0 justify-center">
              <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium leading-none">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                >
                  <Home className="w-3 h-3 text-slate-400" />
                  <span>Beranda</span>
                </Link>

                {breadcrumbs.slice(1).map((crumb, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="hover:text-emerald-600 transition-colors truncate max-w-[180px]"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-600 truncate max-w-[180px]">
                        {crumb.label}
                      </span>
                    )}
                  </div>
                ))}
              </nav>

              <h2 className="text-base xl:text-lg font-black text-slate-900 tracking-tight truncate leading-tight mt-1">
                {currentPageName}
              </h2>
            </div>
          </div>

          {/* Sisi Kanan Topbar: Unit Kerja Pill, Panduan Shortcut, Clock, User Profile */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Chip Info Unit & Tahun Anggaran */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200/90 px-3 py-1 rounded-xl text-xs shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-700 max-w-[160px] truncate" title={user.unitName || ""}>
                {user.unitName || "Semua Unit"}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md text-[11px]">
                TA {activeYear}
              </span>
            </div>

            {/* Quick Link Panduan Alur */}
            <Link
              href="/dashboard/modul"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200/90 hover:border-emerald-300 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
            >
              <BookMarked className="w-3.5 h-3.5 text-emerald-600" />
              <span>Panduan</span>
            </Link>

            {/* Jam Digital */}
            <div className="hidden xl:block">
              <LiveClock />
            </div>

            {/* Dropdown Profil Pengguna */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500/20">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 text-white font-bold text-xs flex items-center justify-center ring-2 ring-emerald-500/20 shadow-xs">
                  {getUserInitials(user.unitName || user.email)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 pr-0.5 hidden sm:block" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-80 p-2.5 rounded-2xl shadow-xl border border-slate-200 max-w-[90vw]">
                <div className="p-2 space-y-1 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate" title={user.unitName || user.email || ""}>
                    {user.unitName || user.email}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {getRoleLabel(user.role)}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Tahun Anggaran MR: {activeYear}
                  </p>
                </div>

                <DropdownMenuSeparator className="my-1.5" />

                <DropdownMenuItem
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="cursor-pointer rounded-xl text-xs py-2 text-slate-700 font-medium hover:bg-slate-100"
                >
                  <KeyRound className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Ubah Password Akun</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/modul")}
                  className="cursor-pointer rounded-xl text-xs py-2 text-slate-700 font-medium hover:bg-slate-100"
                >
                  <BookMarked className="mr-2 h-4 w-4 text-emerald-600" />
                  <span>Buka Modul Panduan Alur</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1.5" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer rounded-xl text-xs py-2 text-rose-600 font-semibold hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus:text-rose-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar dari Sistem</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Konten Halaman */}
        <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#f8fafc] relative print:overflow-visible print:bg-white print:p-0 print:m-0">
          <div className="mx-auto max-w-7xl print:max-w-none print:w-full">
            {children}
          </div>
        </main>
      </div>

      {/* ====================================================================== */}
      {/* OVERLAY & SIDEBAR MOBILE                                               */}
      {/* ====================================================================== */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-gradient-to-b from-[#090d16] via-[#0f172a] to-[#0a1120] text-slate-200 shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight leading-none">
                Si<span className="text-emerald-400">-MaRi</span>
              </h1>
              <span className="text-[10px] text-slate-400 font-medium">Kemendes PDT</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="border-b border-slate-800/80 p-4 bg-slate-900/40 shrink-0">
          <p className="text-xs font-bold text-white truncate" title={user.unitName || user.email || ""}>
            {user.unitName || user.email}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-md">
              {getRoleLabel(user.role)}
            </span>
            <span className="text-[10px] font-semibold text-slate-300 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded-md">
              TA {activeYear}
            </span>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-8 pr-7 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar space-y-1">
          {renderNavGroups(filteredNavGroups, true)}
        </nav>

        <div className="border-t border-slate-800/80 p-3 shrink-0 bg-slate-950/60 text-center">
          <p className="text-[11px] text-slate-500 font-medium">Kemendes PDT © 2026</p>
        </div>
      </aside>

      {/* Floating AI Chatbox Assistant (Bawah Kanan) */}
      <AIChatBox />
    </div>
  );
}
