"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Settings, 
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
  BarChart4
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
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
import { KeyRound } from "lucide-react";

type NavItem = {
  name: string;
  href?: string;
  icon: any;
  children?: { name: string; href: string }[];
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ "Proses Manajemen Risiko": true });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { user, loading, activeYear } = useAuth();

  // Redirect jika tidak login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center text-emerald-700 font-medium">Memuat sistem...</div>;
  }

  // Struktur Group Navigasi
  const navGroups: NavGroup[] = [];

  // Group 1: Overview
  navGroups.push({
    title: "Overview",
    items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }]
  });

  // Group 2: Cascading Kinerja
  const sasaranItems: NavItem[] = [];
  if (user.role === "admin") {
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

  // Group 3: Manajemen Risiko (Khusus non-admin)
  if (user.role !== "admin") {
    navGroups.push({
      title: "Manajemen Risiko",
      items: [
        { name: "Penetapan Konteks", href: "/dashboard/mr-konteks", icon: ClipboardList },
        {
          name: "Proses Manajemen Risiko",
          icon: FolderTree,
          children: [
            { name: "Identifikasi Risiko", href: "/dashboard/mr-identifikasi" },
            { name: "Analisis Risiko", href: "/dashboard/mr-analisis" },
            { name: "Rencana Tindak Pengendalian", href: "/dashboard/mr-rtp" },
            { name: "Pemantauan RTP", href: "/dashboard/mr-pemantauan" },
            { name: "Pencatatan Keterjadian", href: "/dashboard/mr-keterjadian" },
            { name: "Efektifitas RTP", href: "/dashboard/mr-efektifitas" },
          ]
        },
        { name: "Cetak Laporan", href: "/dashboard/laporan", icon: BarChart4 }
      ]
    });
  }

  // Group 4: Administrator (khusus admin)
  if (user.role === "admin") {
    navGroups.push({
      title: "Administrator",
      items: [
        { name: "Manajemen Unit Kerja", href: "/dashboard/units", icon: Building2 },
        { name: "Manajemen Pengguna", href: "/dashboard/users", icon: Users },
        { name: "Log Aktivitas", href: "/dashboard/logs", icon: FileText },
        { name: "Pengaturan Sistem", href: "/dashboard/settings", icon: Settings }
      ]
    });
  }

  const getRoleLabel = (role: string | null) => {
    if (role === "admin") return "Administrator";
    if (role === "eselon_1") return "Unit Kerja Eselon 1";
    if (role === "eselon_2") return "Unit Kerja Eselon 2";
    return "Pengguna";
  };

  const renderNavGroups = (groups: NavGroup[], isMobile = false) => {
    return groups.map((group, idx) => (
      <div key={group.title} className={idx > 0 ? "mt-6" : ""}>
        <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400/80 mb-2">
          {group.title}
        </h3>
        <div className="space-y-1">
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = item.href ? pathname === item.href : item.children?.some(c => pathname === c.href);
            
            if (item.children) {
              const isOpen = openMenus[item.name];
              return (
                <div key={item.name} className="flex flex-col space-y-1">
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] font-medium transition-all w-full ${
                      isActive ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/20" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className={`mr-3 h-[18px] w-[18px] transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-400"}`} />
                      <span className={`${isActive ? "font-semibold tracking-wide" : ""}`}>{item.name}</span>
                    </div>
                    {isOpen ? <ChevronDown className={`h-4 w-4 ${isActive ? "text-emerald-200" : "text-slate-500"}`} /> : <ChevronRight className={`h-4 w-4 ${isActive ? "text-emerald-200" : "text-slate-500"}`} />}
                  </button>
                  
                  <div className={`grid transition-all duration-200 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="flex flex-col space-y-1 pl-[2.1rem] pr-2 pb-2 relative before:absolute before:left-[1.2rem] before:top-0 before:bottom-3 before:w-px before:bg-slate-700/50">
                        {item.children.map(child => {
                          const isChildActive = pathname === child.href;
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              onClick={() => isMobile && setIsSidebarOpen(false)}
                              className={`relative flex items-center rounded-md px-3 py-2 text-[13px] font-medium transition-all ${
                                isChildActive ? "text-white bg-slate-800" : "text-slate-400 hover:bg-slate-800/50 hover:text-emerald-300"
                              }`}
                            >
                              {isChildActive && (
                                 <div className="absolute left-[-18px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500 ring-[3px] ring-[#0f172a]" />
                              )}
                              {child.name}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href!}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={`group flex items-center rounded-lg px-3 py-2.5 text-[14px] font-medium transition-all ${
                  isActive ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/20" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className={`mr-3 h-[18px] w-[18px] transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-400"}`} />
                <span className={`${isActive ? "font-semibold tracking-wide" : ""}`}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    ));
  };

  // Mencari nama halaman saat ini untuk Topbar
  let currentPageName = "Halaman";
  navGroups.forEach(group => {
    group.items.forEach(item => {
      if (item.href === pathname) currentPageName = item.name;
      if (item.children) {
        const child = item.children.find(c => c.href === pathname);
        if (child) currentPageName = child.name;
      }
    });
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar untuk Desktop (Dark Theme) */}
      <aside className="hidden w-72 flex-col border-r border-slate-800 bg-[#0f172a] md:flex shrink-0">
        <div className="flex h-16 items-center px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-emerald-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">Si<span className="text-emerald-500">-MaRi</span></h1>
          </div>
        </div>
        
        {/* Info Profil di Sidebar */}
        <div className="border-b border-slate-800 px-6 py-5 bg-[#111827]/50 shrink-0">
          <p className="text-sm font-semibold text-white whitespace-normal break-words max-w-full" title={user.unitName || user.email || ""}>
            {user.unitName || user.email}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-widest border border-emerald-900/50 bg-emerald-950/30 inline-block px-2 py-1 rounded-md">
              {getRoleLabel(user.role)}
            </p>
            <p className="text-[11px] font-medium text-slate-300 bg-slate-800/50 inline-block px-2 py-1 rounded-md border border-slate-700">
              Tahun: {activeYear}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          {renderNavGroups(navGroups)}
        </nav>
        
        <div className="border-t border-slate-800 p-4 shrink-0 bg-[#0f172a]">
          <p className="text-[11px] text-slate-500 text-center font-medium">Kemendes PDT © 2026</p>
        </div>
      </aside>

      {/* Area Konten Utama */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header / Topbar */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6 shrink-0 shadow-sm shadow-slate-100/50">
          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu className="h-6 w-6" />
            </Button>
            <div className="ml-3 flex items-center gap-1.5">
              <ShieldAlert className="h-5 w-5 text-emerald-600" />
              <h1 className="text-lg font-bold text-slate-900">Si<span className="text-emerald-600">-MaRi</span></h1>
            </div>
          </div>
          
          <div className="hidden md:flex items-center min-w-0 truncate">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight truncate">
              {currentPageName}
            </h2>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200">
                <User className="h-5 w-5 text-slate-600" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-2 rounded-xl max-w-[90vw]">
                <div className="px-2 py-1.5">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-slate-800 whitespace-normal break-words" title={user.unitName || user.email || ""}>
                      {user.unitName || user.email}
                    </p>
                    <p className="text-xs font-medium text-emerald-600 mt-0.5">
                      {getRoleLabel(user.role)} • Tahun MR: {activeYear}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem onClick={() => setIsPasswordModalOpen(true)} className="cursor-pointer rounded-lg mb-1">
                    <KeyRound className="mr-2 h-4 w-4 text-slate-600" />
                    <span className="font-medium text-slate-700">Ubah Password</span>
                  </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer rounded-lg">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-medium">Keluar dari Sistem</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Konten Halaman */}
        <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8fafc] relative">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay Sidebar Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar Mobile (Dark Theme) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-[#0f172a] shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-emerald-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">Si<span className="text-emerald-500">-MaRi</span></h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className="border-b border-slate-800 px-6 py-5 bg-[#111827]/50 shrink-0">
          <p className="text-sm font-semibold text-white whitespace-normal break-words max-w-full" title={user.unitName || user.email || ""}>
            {user.unitName || user.email}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-widest border border-emerald-900/50 bg-emerald-950/30 inline-block px-2 py-1 rounded-md">
              {getRoleLabel(user.role)}
            </p>
            <p className="text-[11px] font-medium text-slate-300 bg-slate-800/50 inline-block px-2 py-1 rounded-md border border-slate-700">
              Tahun: {activeYear}
            </p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          {renderNavGroups(navGroups, true)}
        </nav>
      </aside>
    </div>
  );
}
