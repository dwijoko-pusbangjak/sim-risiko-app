"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  SearchCheck, 
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
  FolderTree,
  ClipboardList,
  ShieldAlert,
  BarChart4,
  BookOpen,
  BookMarked,
  Sparkles,
  KeyRound,
  FileText,
  PanelLeft,
  PanelTop,
  Check,
  MessageSquare
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, doc, onSnapshot } from "firebase/firestore";
import { computeUnreadStats, CHAT_COLLECTION, ChatMessageData } from "@/lib/chat-utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import AIChatBox from "@/components/AIChatBox";

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

  if (!time) return <div className="h-4" />;

  return (
    <div suppressHydrationWarning className="text-[11px] xl:text-[12px] font-medium text-slate-500 flex items-center mt-0.5">
      {time.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })} - {time.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </div>
  );
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const rawPathname = usePathname();
  const pathname = rawPathname || "/dashboard";
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ 
    "Proses Manajemen Risiko": true,
    "Proses Riviu": false 
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { user, loading, activeYear } = useAuth();
  const { menuPosition, setMenuPosition } = useTheme();
  const [isAnalisisRtpEnabled, setIsAnalisisRtpEnabled] = useState<boolean>(true);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [allChatMessages, setAllChatMessages] = useState<ChatMessageData[]>([]);

  const handleToggleMenuPosition = (pos: "sidebar" | "top") => {
    setMenuPosition(pos);
  };

  // Subscribe ke pesan chat real-time untuk menghitung pesan belum dibaca (unread count badge)
  useEffect(() => {
    if (!user?.uid) {
      setUnreadChatCount(0);
      return;
    }

    let unsub = () => {};
    try {
      const q = query(
        collection(db, CHAT_COLLECTION),
        where("type", "==", "chat_message")
      );

      unsub = onSnapshot(
        q,
        (snapshot) => {
          const msgs: ChatMessageData[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            msgs.push({
              id: d.id,
              conversationId: data.conversationId,
              senderId: data.senderId,
              recipientId: data.recipientId,
              text: data.text || "",
              createdAt: data.createdAt || ""
            });
          });
          setAllChatMessages(msgs);
          const stats = computeUnreadStats(user.uid, msgs);
          setUnreadChatCount(stats.totalUnread);
        },
        (err) => {
          console.warn("Unread chat subscription error:", err);
        }
      );
    } catch (err) {
      console.warn("Could not setup unread chat listener:", err);
    }

    const handleReadUpdated = () => {
      setAllChatMessages((prevMsgs) => {
        if (!user?.uid) return prevMsgs;
        const stats = computeUnreadStats(user.uid, prevMsgs);
        setUnreadChatCount(stats.totalUnread);
        return prevMsgs;
      });
    };

    window.addEventListener("sim_risiko_chat_read_updated", handleReadUpdated);

    return () => {
      unsub();
      window.removeEventListener("sim_risiko_chat_read_updated", handleReadUpdated);
    };
  }, [user?.uid]);

  // Subscribe ke pengaturan sistem real-time untuk status aktif menu Analisis RTP
  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onSnapshot(
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
          console.warn("Could not subscribe to settings/general:", err);
        }
      );
    } catch (e) {
      console.warn("Error subscribing to settings:", e);
    }

    return () => unsub();
  }, []);

  // Redirect jika tidak login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Otomatis buka accordion menu jika child sedang aktif
  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/dashboard/mr-")) {
      setOpenMenus((prev) => ({ ...prev, "Proses Manajemen Risiko": true }));
    } else if (pathname.startsWith("/dashboard/proses-audit")) {
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

  const getRoleLabel = (role: string | null | undefined) => {
    if (role === "admin") return "Administrator";
    if (role === "kementerian") return "Pengelola Risiko Kementerian";
    if (role === "auditor") return "Auditor APIP";
    if (role === "eselon_1") return "Unit Kerja Eselon 1";
    if (role === "eselon_2") return "Unit Kerja Eselon 2";
    if (role === "pimpinan") return "Pimpinan Unit Kerja";
    return "Pengguna";
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
      { name: "Katalog Peraturan", href: "/dashboard/katalog-peraturan", icon: BookOpen }
    ]
  });

  // Group 2: Cascading Kinerja (Khusus Kementerian, Eselon 1, dan Eselon 2 - tidak untuk Admin)
  const sasaranItems: NavItem[] = [];
  if (user.role === "kementerian") {
    sasaranItems.push({ name: "Sasaran Strategis", href: "/dashboard/sasaran-strategis", icon: Target });
    sasaranItems.push({ name: "Sasaran Program", href: "/dashboard/sasaran-program", icon: Target });
    sasaranItems.push({ name: "Sasaran Kegiatan", href: "/dashboard/sasaran-kegiatan", icon: Target });
  } else if (user.role === "eselon_1") {
    sasaranItems.push({ name: "Sasaran Program", href: "/dashboard/sasaran-program", icon: Target });
  } else if (user.role === "eselon_2") {
    sasaranItems.push({ name: "Sasaran Kegiatan", href: "/dashboard/sasaran-kegiatan", icon: Target });
  }
  if (sasaranItems.length > 0) {
    navGroups.push({ title: "Cascading Kinerja", items: sasaranItems });
  }

  // Group 3: Manajemen Risiko (Khusus Pengelola Risiko Non-Admin)
  if (user.role !== "admin" && user.role !== "auditor") {
    if (user.role === "pimpinan") {
      const pimpinanItems: NavItem[] = [];
      if (isAnalisisRtpEnabled) {
        pimpinanItems.push({ name: "Analisis RTP", href: "/dashboard/mr-analisis-rtp", icon: Sparkles, badge: "Telaah" });
      }
      pimpinanItems.push({ name: "Cetak Laporan", href: "/dashboard/laporan", icon: BarChart4 });

      navGroups.push({
        title: "Pemantauan & Laporan",
        items: pimpinanItems
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
          { name: "Penetapan Konteks", href: "/dashboard/mr-konteks", icon: ClipboardList },
          {
            name: "Proses Manajemen Risiko",
            icon: FolderTree,
            children: prosesMRChildren
          },
          {
            name: "Proses Riviu",
            icon: SearchCheck,
            children: [
              { name: "Kirim ke Auditor", href: "/dashboard/proses-audit/kirim" },
              { name: "Inbox Hasil Auditor", href: "/dashboard/proses-audit/inbox" }
            ]
          },
          { name: "Cetak Laporan", href: "/dashboard/laporan", icon: BarChart4 }
        ]
      });
    }
  }

  // Group 4: Administrator (Khusus Admin - memiliki menu Analisis RTP untuk mengontrol aktivasi)
  if (user.role === "admin") {
    navGroups.push({
      title: "Administrator",
      items: [
        { name: "Manajemen Unit Kerja", href: "/dashboard/units", icon: Building2 },
        { name: "Manajemen Pengguna", href: "/dashboard/users", icon: Users },
        { name: "Analisis RTP", href: "/dashboard/mr-analisis-rtp", icon: Sparkles, badge: "Kontrol" },
        { name: "Log Aktivitas", href: "/dashboard/logs", icon: FileText },
        { name: "Pengaturan Sistem", href: "/dashboard/settings", icon: Settings },
        { name: "Backup & Restore", href: "/dashboard/backup", icon: DatabaseBackup }
      ]
    });
  }

  // Group 5: Auditor (Khusus Auditor APIP)
  if (user.role === "auditor") {
    const auditorItems: NavItem[] = [
      { name: "Audit Risiko", href: "/dashboard/audit", icon: SearchCheck },
    ];
    if (isAnalisisRtpEnabled) {
      auditorItems.push({ name: "Analisis RTP", href: "/dashboard/mr-analisis-rtp", icon: Sparkles, badge: "Telaah" });
    }
    auditorItems.push({ name: "Cetak Laporan", href: "/dashboard/laporan", icon: BarChart4 });

    navGroups.push({
      title: "Auditor APIP",
      items: auditorItems
    });
  }

  // Render Navigasi Menu Vertikal (Sidebar)
  const renderNavGroups = (groups: NavGroup[], isMobile = false) => {
    return groups.map((group, idx) => (
      <div key={group.title} className={idx > 0 ? "mt-5" : ""}>
        <div className="flex items-center justify-between px-3 mb-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/60" />
            {group.title}
          </h3>
          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded-md">
            {group.items.length}
          </span>
        </div>

        <div className="space-y-1">
          {group.items.map((item) => {
            const Icon = item.icon;
            const isDirectActive = item.href ? pathname === item.href : false;
            const hasChildActive = item.children?.some((c) => pathname === c.href);
            const isActive = isDirectActive || hasChildActive;

            // Submenu bertingkat (children)
            if (item.children) {
              const isOpen = openMenus[item.name] !== undefined ? openMenus[item.name] : Boolean(isActive);

              return (
                <div key={item.name} className="flex flex-col space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.name)}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-[12px] xl:text-[13px] font-medium transition-all w-full cursor-pointer text-left border ${
                      hasChildActive
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-xs font-semibold"
                        : "text-slate-700 hover:bg-slate-100/90 hover:text-emerald-700 border-transparent hover:border-slate-200/60"
                    }`}
                  >
                    <div className="flex items-center flex-1 min-w-0 pr-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-2.5 transition-all shrink-0 border ${
                        hasChildActive 
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-xs" 
                          : "bg-slate-100 text-slate-600 border-slate-200/80 group-hover:text-emerald-700 group-hover:bg-emerald-50 group-hover:border-emerald-200"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-left leading-tight truncate flex-1 font-semibold">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200/80 font-bold">
                        {item.children.length}
                      </span>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-transform" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-transform" />
                      )}
                    </div>
                  </button>

                  {/* Submenu Item List */}
                  <div className={`grid transition-all duration-200 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="flex flex-col space-y-1 p-1.5 rounded-2xl bg-slate-100/70 border border-slate-200/80 backdrop-blur-md shadow-inner my-1">
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href;
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              onClick={() => isMobile && setIsSidebarOpen(false)}
                              className={`group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-[12px] font-medium transition-all border ${
                                isChildActive
                                  ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                                  : "text-slate-700 hover:bg-white hover:text-emerald-800 border-transparent hover:border-slate-200/80 font-semibold"
                              }`}
                            >
                              <div className="flex items-center min-w-0 flex-1 pr-2">
                                {child.step ? (
                                  <span
                                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md mr-2 shrink-0 border transition-all ${
                                      isChildActive
                                        ? "bg-white/20 text-white border-white/30"
                                        : "bg-white text-slate-700 border-slate-200 group-hover:border-emerald-300 group-hover:text-emerald-700"
                                    }`}
                                  >
                                    {child.step}
                                  </span>
                                ) : (
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full mr-2.5 shrink-0 transition-colors ${
                                      isChildActive ? "bg-white" : "bg-slate-400 group-hover:bg-emerald-500"
                                    }`}
                                  />
                                )}
                                <span className="truncate leading-tight">{child.name}</span>
                              </div>

                              {child.badge && (
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ${
                                    isChildActive
                                      ? "bg-white/20 text-white border border-white/30"
                                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  }`}
                                >
                                  {child.badge}
                                </span>
                              )}

                              {isChildActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white ml-1 shrink-0 animate-pulse" />
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

            // Menu Standar (Direct Link)
            return (
              <Link
                key={item.name}
                href={item.href || "/dashboard"}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-[12px] xl:text-[13px] font-medium transition-all w-full cursor-pointer border ${
                  isDirectActive
                    ? "bg-emerald-600 text-white shadow-xs font-bold border-emerald-500"
                    : "text-slate-700 hover:bg-slate-100/90 hover:text-emerald-700 border-transparent hover:border-slate-200/60 font-semibold"
                }`}
              >
                <div className="flex items-center flex-1 min-w-0 pr-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-2.5 transition-all shrink-0 border ${
                    isDirectActive 
                      ? "bg-white/20 text-white border-white/30" 
                      : "bg-slate-100 text-slate-600 border-slate-200/80 group-hover:text-emerald-700 group-hover:bg-emerald-50 group-hover:border-emerald-200"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-left leading-tight truncate flex-1">{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full shrink-0 shadow-xs ${
                      item.name === "Chat Pengguna" && unreadChatCount > 0
                        ? "bg-rose-500 text-white border border-rose-400 text-[10px] animate-pulse"
                        : isDirectActive
                        ? "bg-white/20 text-white border border-white/30 text-[9px] uppercase tracking-wider"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] uppercase tracking-wider"
                    }`}
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

  // Mencari nama halaman saat ini untuk Topbar
  let currentPageName = "Dashboard";
  if (pathname === "/dashboard/modul") {
    currentPageName = "Panduan Alur MR";
  } else {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.href === pathname) {
          currentPageName = item.name;
          break;
        }
        if (item.children) {
          const child = item.children.find((c) => c.href === pathname);
          if (child) {
            currentPageName = child.name;
            break;
          }
        }
      }
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative print:h-auto print:min-h-0 print:block print:overflow-visible font-sans">
      {/* Latar Belakang Gradien Halus untuk Refraksi Kaca Nyata */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden print:hidden" aria-hidden="true">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-8 w-80 h-80 bg-teal-400/15 rounded-full blur-3xl" />
        <div className="absolute -top-10 right-1/4 w-[500px] h-48 bg-emerald-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-slate-400/15 rounded-full blur-3xl" />
      </div>

      {/* ====================================================================== */}
      {/* 1. SIDEBAR DESKTOP (Tampil HANYA jika menuPosition === "sidebar")        */}
      {/* ====================================================================== */}
      {menuPosition === "sidebar" && (
        <aside className="hidden w-64 xl:w-72 flex-col glass-sidebar md:flex shrink-0 print:hidden animate-in fade-in duration-200 relative z-20">
          {/* Brand Header */}
          <div className="flex h-16 items-center px-4 xl:px-6 border-b border-slate-200/80 shrink-0 bg-white/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-sm border border-emerald-400/30">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                  Si<span className="text-emerald-600">-MaRi</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-medium">Kemendes PDT</p>
              </div>
            </div>
          </div>
          
          {/* Info Profil di Sidebar */}
          <div className="border-b border-slate-200/80 px-4 xl:px-6 py-3.5 bg-white/30 backdrop-blur-sm shrink-0">
            <p className="text-xs xl:text-sm font-bold text-slate-800 whitespace-normal break-words max-w-full" title={user.unitName || user.email || ""}>
              {user.unitName || user.email}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider border border-emerald-200 bg-emerald-50 inline-block px-2 py-0.5 rounded-lg">
                {getRoleLabel(user.role)}
              </span>
              <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 inline-block px-2 py-0.5 rounded-lg border border-slate-200">
                TA {activeYear}
              </span>
            </div>
          </div>

          {/* List Menu Scrollable */}
          <nav className="flex-1 overflow-y-auto px-3.5 py-4 custom-scrollbar">
            {renderNavGroups(navGroups)}
          </nav>
          
          {/* Sidebar Footer dengan Pintasan Panduan Alur MR */}
          <div className="border-t border-slate-200/80 p-3 shrink-0 bg-white/40 space-y-2">
            <Link
              href="/dashboard/modul"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/60 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition-all text-xs group shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <BookMarked className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-semibold text-slate-800 group-hover:text-emerald-800">Panduan Alur MR</div>
                  <div className="text-[10px] text-slate-500">Diagram alur & petunjuk</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </Link>
            <p className="text-[10px] text-slate-400 text-center font-medium pt-1">Kemendes PDT © 2026</p>
          </div>
        </aside>
      )}

      {/* ====================================================================== */}
      {/* 2. AREA KONTEN UTAMA + TOPBAR HEADER                                   */}
      {/* ====================================================================== */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden print:block print:overflow-visible">
        {/* Header Baris 1: Brand (jika top mode), Title, Info Unit, Switcher, Profil */}
        <header className="flex h-16 items-center justify-between border-b bg-white/85 backdrop-blur-md px-4 md:px-6 shrink-0 shadow-xs border-slate-200/80 print:hidden relative z-20">
          {/* Sisi Kiri Header */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button untuk Tampilan Mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Logo untuk Mode Menu Atas (Top) pada Desktop */}
            {menuPosition === "top" && (
              <div className="hidden md:flex items-center gap-2.5 pr-4 border-r border-slate-200/80 mr-1">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-950/20 border border-emerald-400/30">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                    Si<span className="text-emerald-600">-MaRi</span>
                  </h1>
                  <p className="text-[10px] text-slate-500 font-medium">Kemendes PDT</p>
                </div>
              </div>
            )}

            {/* Mobile Logo */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-sm border border-emerald-400/30">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <h1 className="text-lg font-bold text-slate-900">Si<span className="text-emerald-600">-MaRi</span></h1>
            </div>
            
            {/* Nama Halaman Aktif & Jam Digital */}
            <div className="hidden md:flex flex-col min-w-0 truncate justify-center">
              <h2 className="text-base xl:text-lg font-bold text-slate-800 tracking-tight truncate leading-tight">
                {currentPageName}
              </h2>
              <LiveClock />
            </div>
          </div>

          {/* Sisi Kanan Header: Info Unit, Switcher Posisi Menu, Panduan, Profil */}
          <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
            {/* Chip Info Unit & Tahun Anggaran */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs backdrop-blur-sm">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-700 max-w-[160px] truncate" title={user.unitName || ""}>
                {user.unitName || "Semua Unit"}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-200/60 px-2 py-0.5 rounded-md text-[11px]">
                TA {activeYear}
              </span>
            </div>

            {/* Switcher Posisi Penempatan Menu (Samping / Atas) */}
            <div className="hidden md:flex items-center bg-slate-100/90 backdrop-blur-sm p-0.5 rounded-xl border border-slate-200/80 shadow-xs" title="Atur Posisi Tata Letak Menu">
              <button
                type="button"
                onClick={() => handleToggleMenuPosition("sidebar")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  menuPosition === "sidebar"
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Posisikan Menu di Samping Kiri"
              >
                <PanelLeft className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Menu Kiri</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleMenuPosition("top")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  menuPosition === "top"
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Posisikan Menu di Atas (Horizontal)"
              >
                <PanelTop className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Menu Atas</span>
              </button>
            </div>

            {/* Tombol Pintasan Chat Pengguna (Pojok Kanan Atas) */}
            <Link
              href="/dashboard/chat"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all relative cursor-pointer border ${
                pathname === "/dashboard/chat"
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-xs font-bold border-emerald-400/30"
                  : "text-slate-700 hover:text-emerald-700 bg-slate-50/80 hover:bg-emerald-50/80 border-slate-200/80 hover:border-emerald-300 backdrop-blur-sm"
              }`}
              title="Pusat Chat Antar Pengguna"
            >
              <div className="relative flex items-center">
                <MessageSquare className={`w-3.5 h-3.5 ${pathname === "/dashboard/chat" ? "text-white" : "text-emerald-600"}`} />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                    {unreadChatCount > 99 ? "99+" : unreadChatCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Chat</span>
              {unreadChatCount > 0 ? (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse shadow-xs">
                  {unreadChatCount}
                </span>
              ) : (
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${pathname === "/dashboard/chat" ? "bg-white" : "bg-emerald-500"}`} />
              )}
            </Link>

            {/* Tombol Pintasan Panduan (Khusus jika mode sidebar) */}
            {menuPosition === "sidebar" && (
              <Link
                href="/dashboard/modul"
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-xl transition-all"
              >
                <BookMarked className="w-3.5 h-3.5 text-emerald-600" />
                <span>Panduan</span>
              </Link>
            )}

            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer outline-none">
                <User className="h-5 w-5 text-slate-600" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl shadow-xl max-w-[90vw] border border-slate-200/80 bg-white/95 backdrop-blur-md">
                <div className="px-2 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-xs xl:text-sm font-semibold text-slate-800 whitespace-normal break-words" title={user.unitName || user.email || ""}>
                      {user.unitName || user.email}
                    </p>
                    <p className="text-xs font-medium text-emerald-600">
                      {getRoleLabel(user.role)} • TA: {activeYear}
                    </p>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1.5" />

                {/* Pengaturan Penempatan Menu di dalam Dropdown */}
                <div className="px-2 pt-1 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Posisi Penempatan Menu
                </div>
                <DropdownMenuItem
                  onClick={() => handleToggleMenuPosition("sidebar")}
                  className="cursor-pointer rounded-lg text-xs py-1.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <PanelLeft className="h-4 w-4 text-slate-500" />
                    <span>Sebelah Kiri (Sidebar)</span>
                  </div>
                  {menuPosition === "sidebar" && <Check className="h-4 w-4 text-emerald-600 font-bold" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleToggleMenuPosition("top")}
                  className="cursor-pointer rounded-lg text-xs py-1.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <PanelTop className="h-4 w-4 text-slate-500" />
                    <span>Sebelah Atas (Navbar)</span>
                  </div>
                  {menuPosition === "top" && <Check className="h-4 w-4 text-emerald-600 font-bold" />}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem onClick={() => router.push("/dashboard/chat")} className="cursor-pointer rounded-lg text-xs py-2">
                  <MessageSquare className="mr-2 h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-slate-700">Buka Chat Pengguna</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsPasswordModalOpen(true)} className="cursor-pointer rounded-lg text-xs py-2">
                  <KeyRound className="mr-2 h-4 w-4 text-slate-600" />
                  <span className="font-medium text-slate-700">Ubah Password Akun</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/modul")} className="cursor-pointer rounded-lg text-xs py-2">
                  <BookMarked className="mr-2 h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-slate-700">Buka Panduan Alur MR</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer rounded-lg text-xs py-2">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-medium">Keluar dari Sistem</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ====================================================================== */}
        {/* 3. NAVBAR HORIZONTAL (Tampil HANYA jika menuPosition === "top")        */}
        {/* ====================================================================== */}
        {menuPosition === "top" && (
          <nav className="hidden md:flex items-center justify-between glass-menu-bar text-slate-800 px-4 md:px-6 py-2 shrink-0 overflow-x-auto shadow-xs custom-scrollbar relative z-10 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Overview Group: Dashboard & Katalog Peraturan */}
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                  pathname === "/dashboard"
                    ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                    : "text-slate-700 hover:text-emerald-700 hover:bg-slate-100/90 border-transparent hover:border-slate-200/80"
                }`}
              >
                <LayoutDashboard className={`h-3.5 w-3.5 ${pathname === "/dashboard" ? "text-white" : "text-emerald-600"}`} />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/dashboard/katalog-peraturan"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                  pathname === "/dashboard/katalog-peraturan"
                    ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                    : "text-slate-700 hover:text-emerald-700 hover:bg-slate-100/90 border-transparent hover:border-slate-200/80"
                }`}
              >
                <BookOpen className={`h-3.5 w-3.5 ${pathname === "/dashboard/katalog-peraturan" ? "text-white" : "text-emerald-600"}`} />
                <span>Katalog Peraturan</span>
              </Link>

              <div className="h-4 w-px bg-slate-300/80 mx-1.5 shrink-0" />

              {/* Cascading Kinerja (Khusus Kementerian, Eselon 1, Eselon 2 - tidak untuk Admin) */}
              {sasaranItems.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer outline-none border ${
                    sasaranItems.some(s => pathname === s.href)
                      ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                      : "text-slate-700 hover:text-emerald-700 hover:bg-slate-100/90 border-transparent hover:border-slate-200/80"
                  }`}>
                    <Target className={`h-3.5 w-3.5 ${sasaranItems.some(s => pathname === s.href) ? "text-white" : "text-emerald-600"}`} />
                    <span>Cascading Kinerja</span>
                    <ChevronDown className={`h-3 w-3 ml-0.5 ${sasaranItems.some(s => pathname === s.href) ? "text-white" : "text-slate-400"}`} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-58 p-1.5 glass-dropdown-content text-slate-800 rounded-2xl shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 mb-1">
                      Cascading Kinerja
                    </div>
                    {sasaranItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <DropdownMenuItem
                          key={item.name}
                          onClick={() => router.push(item.href!)}
                          className={`cursor-pointer rounded-xl text-xs py-2 px-2.5 flex items-center justify-between mb-0.5 transition-all border ${
                            isActive
                              ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                              : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800 border-transparent font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Target className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-emerald-600"}`} />
                            <span className="truncate">{item.name}</span>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Menu Manajemen Risiko untuk Pimpinan */}
              {user.role === "pimpinan" && (
                <>
                  {isAnalisisRtpEnabled && (
                    <Link
                      href="/dashboard/mr-analisis-rtp"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                        pathname === "/dashboard/mr-analisis-rtp"
                          ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                          : "text-slate-700 hover:text-emerald-700 hover:bg-slate-100/90 border-transparent hover:border-slate-200/80"
                      }`}
                    >
                      <Sparkles className={`h-3.5 w-3.5 ${pathname === "/dashboard/mr-analisis-rtp" ? "text-white" : "text-emerald-600"}`} />
                      <span>Analisis RTP</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold ${
                        pathname === "/dashboard/mr-analisis-rtp" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        Telaah
                      </span>
                    </Link>
                  )}
                  <Link
                    href="/dashboard/laporan"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                      pathname === "/dashboard/laporan"
                        ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                        : "text-slate-700 hover:text-emerald-700 hover:bg-slate-100/90 border-transparent hover:border-slate-200/80"
                    }`}
                  >
                    <BarChart4 className={`h-3.5 w-3.5 ${pathname === "/dashboard/laporan" ? "text-white" : "text-emerald-600"}`} />
                    <span>Cetak Laporan</span>
                  </Link>
                </>
              )}

              {/* Menu Manajemen Risiko untuk Pengelola Non-Admin Non-Pimpinan */}
              {user.role !== "admin" && user.role !== "auditor" && user.role !== "pimpinan" && (
                <>
                  <Link
                    href="/dashboard/mr-konteks"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                      pathname === "/dashboard/mr-konteks"
                        ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                        : "text-slate-700 hover:text-emerald-700 hover:bg-slate-100/90 border-transparent hover:border-slate-200/80"
                    }`}
                  >
                    <ClipboardList className={`h-3.5 w-3.5 ${pathname === "/dashboard/mr-konteks" ? "text-white" : "text-emerald-600"}`} />
                    <span>Penetapan Konteks</span>
                  </Link>

                  {/* Dropdown 7 Tahapan Proses Manajemen Risiko */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer outline-none border ${
                      pathname.startsWith("/dashboard/mr-") && pathname !== "/dashboard/mr-konteks"
                        ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                        : "text-slate-700 hover:text-emerald-700 hover:bg-slate-100/90 border-transparent hover:border-slate-200/80"
                    }`}>
                      <FolderTree className={`h-3.5 w-3.5 ${pathname.startsWith("/dashboard/mr-") && pathname !== "/dashboard/mr-konteks" ? "text-white" : "text-emerald-600"}`} />
                      <span>Proses MR</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md font-bold ${
                        pathname.startsWith("/dashboard/mr-") && pathname !== "/dashboard/mr-konteks"
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {isAnalisisRtpEnabled ? "7" : "6"}
                      </span>
                      <ChevronDown className={`h-3 w-3 ml-0.5 ${pathname.startsWith("/dashboard/mr-") && pathname !== "/dashboard/mr-konteks" ? "text-white" : "text-slate-400"}`} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-68 p-1.5 glass-dropdown-content text-slate-800 rounded-2xl shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
                      <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 mb-1">
                        7 Tahapan Proses Manajemen Risiko
                      </div>
                      {[
                        { name: "Identifikasi Risiko", href: "/dashboard/mr-identifikasi", step: "01" },
                        { name: "Analisis Risiko", href: "/dashboard/mr-analisis", step: "02" },
                        { name: "Rencana Tindak Pengendalian", href: "/dashboard/mr-rtp", step: "03" },
                        { name: "Pemantauan RTP", href: "/dashboard/mr-pemantauan", step: "04" },
                        { name: "Pencatatan Keterjadian", href: "/dashboard/mr-keterjadian", step: "05" },
                        { name: "Efektifitas RTP", href: "/dashboard/mr-efektifitas", step: "06" },
                        ...(isAnalisisRtpEnabled ? [{ name: "Analisis RTP", href: "/dashboard/mr-analisis-rtp", step: "07", badge: "Telaah" }] : [])
                      ].map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <DropdownMenuItem
                            key={child.name}
                            onClick={() => router.push(child.href)}
                            className={`cursor-pointer rounded-xl text-xs py-2 px-2.5 flex items-center justify-between mb-0.5 transition-all border ${
                              isChildActive
                                ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                                : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800 border-transparent font-medium"
                            }`}
                          >
                            <div className="flex items-center min-w-0 pr-2">
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md mr-2 shrink-0 border ${
                                isChildActive ? "bg-white/20 text-white border-white/30" : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}>
                                {child.step}
                              </span>
                              <span className="truncate">{child.name}</span>
                            </div>
                            {child.badge && (
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ${
                                isChildActive ? "bg-white/20 text-white border border-white/30" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}>
                                {child.badge}
                              </span>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Dropdown Proses Riviu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer outline-none border ${
                      pathname.startsWith("/dashboard/proses-audit")
                        ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                        : "text-slate-700 hover:text-emerald-700 hover:bg-slate-100/90 border-transparent hover:border-slate-200/80"
                    }`}>
                      <SearchCheck className={`h-3.5 w-3.5 ${pathname.startsWith("/dashboard/proses-audit") ? "text-white" : "text-emerald-600"}`} />
                      <span>Proses Riviu</span>
                      <ChevronDown className={`h-3 w-3 ml-0.5 ${pathname.startsWith("/dashboard/proses-audit") ? "text-white" : "text-slate-400"}`} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-58 p-1.5 glass-dropdown-content text-slate-800 rounded-2xl shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
                      <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 mb-1">
                        Proses Riviu Auditor APIP
                      </div>
                      {[
                        { name: "Kirim ke Auditor", href: "/dashboard/proses-audit/kirim" },
                        { name: "Inbox Hasil Auditor", href: "/dashboard/proses-audit/inbox" }
                      ].map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <DropdownMenuItem
                            key={child.name}
                            onClick={() => router.push(child.href)}
                            className={`cursor-pointer rounded-xl text-xs py-2 px-2.5 flex items-center justify-between mb-0.5 transition-all border ${
                              isChildActive
                                ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                                : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800 border-transparent font-medium"
                            }`}
                          >
                            <span className="truncate">{child.name}</span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Link
                    href="/dashboard/laporan"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                      pathname === "/dashboard/laporan"
                        ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                        : "text-slate-700 hover:text-emerald-700 hover:bg-slate-100/90 border-transparent hover:border-slate-200/80"
                    }`}
                  >
                    <BarChart4 className={`h-3.5 w-3.5 ${pathname === "/dashboard/laporan" ? "text-white" : "text-emerald-600"}`} />
                    <span>Cetak Laporan</span>
                  </Link>
                </>
              )}

              {/* Menu Khusus Administrator */}
              {user.role === "admin" && (
                <DropdownMenu>
                  <DropdownMenuTrigger className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer outline-none border ${
                    ["/dashboard/units", "/dashboard/users", "/dashboard/mr-analisis-rtp", "/dashboard/logs", "/dashboard/settings", "/dashboard/backup"].includes(pathname)
                      ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                      : "text-slate-700 hover:text-emerald-700 hover:bg-slate-100/90 border-transparent hover:border-slate-200/80"
                  }`}>
                    <Settings className={`h-3.5 w-3.5 ${["/dashboard/units", "/dashboard/users", "/dashboard/mr-analisis-rtp", "/dashboard/logs", "/dashboard/settings", "/dashboard/backup"].includes(pathname) ? "text-white" : "text-emerald-600"}`} />
                    <span>Administrator</span>
                    <ChevronDown className={`h-3 w-3 ml-0.5 ${["/dashboard/units", "/dashboard/users", "/dashboard/mr-analisis-rtp", "/dashboard/logs", "/dashboard/settings", "/dashboard/backup"].includes(pathname) ? "text-white" : "text-slate-400"}`} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 p-1.5 glass-dropdown-content text-slate-800 rounded-2xl shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 mb-1">
                      Menu Administrator
                    </div>
                    {[
                      { name: "Manajemen Unit Kerja", href: "/dashboard/units", icon: Building2 },
                      { name: "Manajemen Pengguna", href: "/dashboard/users", icon: Users },
                      { name: "Analisis RTP", href: "/dashboard/mr-analisis-rtp", icon: Sparkles, badge: "Kontrol" },
                      { name: "Log Aktivitas", href: "/dashboard/logs", icon: FileText },
                      { name: "Pengaturan Sistem", href: "/dashboard/settings", icon: Settings },
                      { name: "Backup & Restore", href: "/dashboard/backup", icon: DatabaseBackup }
                    ].map((adminItem) => {
                      const Icon = adminItem.icon;
                      const isActive = pathname === adminItem.href;
                      return (
                        <DropdownMenuItem
                          key={adminItem.name}
                          onClick={() => router.push(adminItem.href)}
                          className={`cursor-pointer rounded-xl text-xs py-2 px-2.5 flex items-center justify-between mb-0.5 transition-all border ${
                            isActive
                              ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                              : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800 border-transparent font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-emerald-600"}`} />
                            <span className="truncate">{adminItem.name}</span>
                          </div>
                          {adminItem.badge && (
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                              isActive ? "bg-white/20 text-white border border-white/30" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}>
                              {adminItem.badge}
                            </span>
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Menu Khusus Auditor APIP */}
              {user.role === "auditor" && (
                <>
                  <Link
                    href="/dashboard/audit"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                      pathname === "/dashboard/audit"
                        ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                        : "text-slate-700 hover:text-emerald-700 hover:bg-slate-100/90 border-transparent hover:border-slate-200/80"
                    }`}
                  >
                    <SearchCheck className={`h-3.5 w-3.5 ${pathname === "/dashboard/audit" ? "text-white" : "text-emerald-600"}`} />
                    <span>Audit Risiko</span>
                  </Link>
                  {isAnalisisRtpEnabled && (
                    <Link
                      href="/dashboard/mr-analisis-rtp"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                        pathname === "/dashboard/mr-analisis-rtp"
                          ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                          : "text-slate-700 hover:text-emerald-700 hover:bg-slate-100/90 border-transparent hover:border-slate-200/80"
                      }`}
                    >
                      <Sparkles className={`h-3.5 w-3.5 ${pathname === "/dashboard/mr-analisis-rtp" ? "text-white" : "text-emerald-600"}`} />
                      <span>Analisis RTP</span>
                    </Link>
                  )}
                  <Link
                    href="/dashboard/laporan"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                      pathname === "/dashboard/laporan"
                        ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                        : "text-slate-700 hover:text-emerald-700 hover:bg-slate-100/90 border-transparent hover:border-slate-200/80"
                    }`}
                  >
                    <BarChart4 className={`h-3.5 w-3.5 ${pathname === "/dashboard/laporan" ? "text-white" : "text-emerald-600"}`} />
                    <span>Cetak Laporan</span>
                  </Link>
                </>
              )}
            </div>

            {/* Sisi Kanan Navbar Horizontal: Pintasan Panduan Alur MR */}
            <div className="flex items-center shrink-0 ml-3">
              <Link
                href="/dashboard/modul"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                  pathname === "/dashboard/modul"
                    ? "bg-emerald-600 text-white font-bold shadow-xs border-emerald-500"
                    : "bg-slate-100/80 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border-slate-200/80 hover:border-emerald-300 backdrop-blur-md"
                }`}
              >
                <BookMarked className={`h-3.5 w-3.5 ${pathname === "/dashboard/modul" ? "text-white" : "text-emerald-600"}`} />
                <span>Panduan Alur MR</span>
              </Link>
            </div>
          </nav>
        )}

        {/* Konten Halaman */}
        <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 theme-bg-main relative print:overflow-visible print:bg-white print:p-0 print:m-0">
          <div className="mx-auto max-w-7xl 2xl:max-w-[1600px] print:max-w-none print:w-full">
            {children}
          </div>
        </main>
      </div>

      {/* ====================================================================== */}
      {/* 4. DRAWER SIDEBAR MOBILE (Untuk Perangkat Smartphone/Tablet)           */}
      {/* ====================================================================== */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 xl:w-72 transform glass-sidebar shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4 xl:px-6 shrink-0 bg-white/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-sm border border-emerald-400/30">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                Si<span className="text-emerald-600">-MaRi</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">Kemendes PDT</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="text-slate-500 hover:text-slate-800 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className="border-b border-slate-200/80 px-4 xl:px-6 py-3.5 bg-white/30 backdrop-blur-sm shrink-0">
          <p className="text-xs xl:text-sm font-bold text-slate-800 whitespace-normal break-words max-w-full" title={user.unitName || user.email || ""}>
            {user.unitName || user.email}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider border border-emerald-200 bg-emerald-50 inline-block px-2 py-0.5 rounded-lg">
              {getRoleLabel(user.role)}
            </span>
            <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 inline-block px-2 py-0.5 rounded-lg border border-slate-200">
              TA {activeYear}
            </span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 custom-scrollbar">
          {renderNavGroups(navGroups, true)}
        </nav>
        <div className="border-t border-slate-200/80 p-3 shrink-0 bg-white/40 space-y-2">
          <Link
            href="/dashboard/modul"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/60 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition-all text-xs group shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <BookMarked className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-semibold text-slate-800 group-hover:text-emerald-800">Panduan Alur MR</div>
                <div className="text-[10px] text-slate-500">Diagram alur & petunjuk</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-all" />
          </Link>
          <p className="text-[10px] text-slate-400 text-center font-medium pt-1">Kemendes PDT © 2026</p>
        </div>
      </aside>

      {/* Floating AI Chatbox Assistant */}
      <AIChatBox />
    </div>
  );
}
