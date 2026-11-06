"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  setDoc
} from "firebase/firestore";
import {
  MessageSquare,
  Send,
  Search,
  Users,
  Building2,
  Sparkles,
  CheckCheck,
  ChevronLeft,
  ShieldCheck,
  MessageCircle,
  Loader2,
  UserPlus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CHAT_COLLECTION,
  GENERAL_ROOM_ID,
  getConversationId,
  markConversationAsRead,
  computeUnreadStats,
  ChatMessageData
} from "@/lib/chat-utils";

interface UserContact {
  id: string; // UID atau Unit ID
  email: string;
  role: string;
  unitName: string;
  unitId?: string;
  isUnitTarget?: boolean;
}

interface ChatMessage {
  id: string;
  conversationId: string; // "general" atau `${idA}_${idB}`
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  senderUnit: string;
  recipientId: string; // "general" atau ID penerima
  recipientName?: string;
  text: string;
  createdAt: string;
  createdAtStr: string;
}

export default function ChatPenggunaPage() {
  const { user } = useAuth();
  const currentUid = auth.currentUser?.uid || user?.uid || "";

  const [contactsList, setContactsList] = useState<UserContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Percakapan aktif: default ke Forum Diskusi Umum
  const [activeRecipient, setActiveRecipient] = useState<UserContact>({
    id: GENERAL_ROOM_ID,
    email: "publik@kemendesa.go.id",
    role: "Semua Pengguna",
    unitName: "Semua Unit Kerja & APIP"
  });

  // State Pesan Chat Ruangan Aktif
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // State Seluruh Pesan Chat untuk Kalkulasi Unread & Riwayat Chat Kontak
  const [allMessages, setAllMessages] = useState<ChatMessageData[]>([]);

  const [newMessageText, setNewMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hitung ID percakapan aktif
  const activeConversationId = useMemo(() => {
    return getConversationId(currentUid, activeRecipient.id);
  }, [currentUid, activeRecipient.id]);

  // 1. Daftarkan kehadiran pengguna saat ini (presence) ke Firestore
  useEffect(() => {
    if (!currentUid) return;

    try {
      const presenceRef = doc(db, CHAT_COLLECTION, `chat_presence_${currentUid}`);
      setDoc(
        presenceRef,
        {
          id: `chat_presence_${currentUid}`,
          type: "chat_user_presence",
          ownerId: currentUid,
          uid: currentUid,
          email: user?.email || auth.currentUser?.email || "",
          unitName: user?.unitName || user?.email || "Unit Kerja",
          role: user?.role || "eselon_2",
          tahun: "CHAT",
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      ).catch((e) => console.warn("Presence registration note:", e));
    } catch (e) {
      console.warn("Could not register presence:", e);
    }
  }, [currentUid, user]);

  // 2. Ambil master seluruh daftar kontak (Units + Presence + Users + Sistem)
  useEffect(() => {
    const fetchContacts = async () => {
      setLoadingContacts(true);
      const contactMap = new Map<string, UserContact>();

      // A. Ambil pengguna aktif dari presence
      try {
        const presenceQ = query(
          collection(db, CHAT_COLLECTION),
          where("type", "==", "chat_user_presence")
        );
        const presenceSnap = await getDocs(presenceQ);
        presenceSnap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.uid && d.uid !== currentUid) {
            contactMap.set(d.uid, {
              id: d.uid,
              email: d.email || "",
              role: d.role || "eselon_2",
              unitName: d.unitName || d.email || "Unit Kerja",
              isUnitTarget: false
            });
          }
        });
      } catch (err) {
        console.warn("Presence fetch notice:", err);
      }

      // B. Ambil seluruh daftar Unit Kerja resmi dari koleksi "units"
      try {
        const unitsSnap = await getDocs(collection(db, "units"));
        unitsSnap.forEach((docSnap) => {
          const d = docSnap.data();
          const unitId = `unit_${docSnap.id}`;
          if (!contactMap.has(unitId) && d.name !== user?.unitName) {
            contactMap.set(unitId, {
              id: unitId,
              email: `${docSnap.id}@kemendesa.go.id`,
              role: d.level || "eselon_2",
              unitName: d.name,
              isUnitTarget: true
            });
          }
        });
      } catch (err) {
        console.warn("Units fetch notice:", err);
      }

      // C. Coba ambil dari koleksi users jika akun memiliki izin baca
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        usersSnap.forEach((docSnap) => {
          const d = docSnap.data();
          if (docSnap.id !== currentUid) {
            contactMap.set(docSnap.id, {
              id: docSnap.id,
              email: d.email || "",
              role: d.role || "eselon_2",
              unitName: d.unitName || d.email || "Unit Kerja",
              unitId: d.unitId,
              isUnitTarget: false
            });
          }
        });
      } catch (err) {
        // Abaikan jika non-admin
      }

      // D. Kontak Sistem Default
      const defaultContacts: UserContact[] = [
        {
          id: "sys_apip",
          email: "inspektorat@kemendesa.go.id",
          role: "auditor",
          unitName: "Inspektorat Jenderal (Auditor APIP)",
          isUnitTarget: true
        },
        {
          id: "sys_kementerian",
          email: "pengelola.mr@kemendesa.go.id",
          role: "kementerian",
          unitName: "Tim Manajemen Risiko Kementerian",
          isUnitTarget: true
        },
        {
          id: "sys_admin",
          email: "admin.simari@kemendesa.go.id",
          role: "admin",
          unitName: "Administrator Sistem Si-MaRi",
          isUnitTarget: true
        }
      ];

      defaultContacts.forEach((dc) => {
        if (!contactMap.has(dc.id) && user?.role !== dc.role) {
          contactMap.set(dc.id, dc);
        }
      });

      setContactsList(Array.from(contactMap.values()));
      setLoadingContacts(false);
    };

    fetchContacts();
  }, [currentUid, user]);

  // 3. Real-time Subscription ke SELURUH Pesan Chat (untuk Hitung Unread & Riwayat Chat Kontak)
  useEffect(() => {
    try {
      const q = query(
        collection(db, CHAT_COLLECTION),
        where("type", "==", "chat_message")
      );

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const msgs: ChatMessageData[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            msgs.push({
              id: d.id,
              conversationId: data.conversationId,
              senderId: data.senderId,
              senderName: data.senderName,
              senderEmail: data.senderEmail,
              senderRole: data.senderRole,
              senderUnit: data.senderUnit,
              recipientId: data.recipientId,
              recipientName: data.recipientName,
              text: data.text || "",
              createdAt: data.createdAt || "",
              createdAtStr: data.createdAtStr || ""
            });
          });
          setAllMessages(msgs);
        },
        (err) => {
          console.warn("Global chat listener warning:", err);
        }
      );

      return () => unsub();
    } catch (e) {
      console.warn("Could not listen to all chat messages:", e);
    }
  }, []);

  // 4. Real-time Subscription ke Pesan Ruangan yang Aktif
  useEffect(() => {
    if (!activeConversationId) return;

    try {
      const q = query(
        collection(db, CHAT_COLLECTION),
        where("type", "==", "chat_message"),
        where("conversationId", "==", activeConversationId)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const msgs: ChatMessage[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            msgs.push({
              id: docSnap.id,
              conversationId: data.conversationId || activeConversationId,
              senderId: data.senderId,
              senderName: data.senderName || data.senderEmail,
              senderEmail: data.senderEmail,
              senderRole: data.senderRole,
              senderUnit: data.senderUnit,
              recipientId: data.recipientId,
              recipientName: data.recipientName,
              text: data.text || "",
              createdAt: data.createdAt || new Date().toISOString(),
              createdAtStr: data.createdAtStr || "Baru saja"
            });
          });

          // Urutkan dari pesan lama ke baru secara in-memory
          msgs.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          setMessages(msgs);
        },
        (error) => {
          console.warn("Real-time chat snapshot error:", error);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Subscription setup failed:", err);
    }
  }, [activeConversationId]);

  // 5. Tandai pesan sebagai telah dibaca (Mark as read) saat ruangan aktif dibuka / pesan masuk
  useEffect(() => {
    if (!currentUid || !activeConversationId) return;
    markConversationAsRead(currentUid, activeConversationId);
  }, [currentUid, activeConversationId, messages.length]);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 6. Analisis data pesan: kontak yang pernah chat & pesan terakhir tiap kontak
  const { chattedContactIds, lastMessageMap } = useMemo(() => {
    const ids = new Set<string>();
    const lastMsg: Record<
      string,
      { text: string; createdAtStr: string; createdAt: string; senderName: string }
    > = {};

    allMessages.forEach((msg) => {
      // Forum Umum
      if (msg.conversationId === GENERAL_ROOM_ID || msg.recipientId === GENERAL_ROOM_ID) {
        if (
          !lastMsg[GENERAL_ROOM_ID] ||
          new Date(msg.createdAt).getTime() > new Date(lastMsg[GENERAL_ROOM_ID].createdAt).getTime()
        ) {
          lastMsg[GENERAL_ROOM_ID] = {
            text: msg.text,
            createdAtStr: msg.createdAtStr || "",
            createdAt: msg.createdAt,
            senderName: msg.senderName || "Pengguna"
          };
        }
        return;
      }

      // Pesan 1-on-1: tentukan ID lawan bicara
      let otherId = "";
      if (msg.senderId === currentUid) {
        otherId = msg.recipientId || "";
      } else if (msg.recipientId === currentUid) {
        otherId = msg.senderId;
      } else if (msg.conversationId && msg.conversationId.includes(currentUid)) {
        const parts = msg.conversationId.split("_");
        otherId = parts.find((p) => p !== currentUid) || "";
      }

      if (otherId && otherId !== currentUid) {
        ids.add(otherId);
        if (
          !lastMsg[otherId] ||
          new Date(msg.createdAt).getTime() > new Date(lastMsg[otherId].createdAt).getTime()
        ) {
          lastMsg[otherId] = {
            text: msg.text,
            createdAtStr: msg.createdAtStr || "",
            createdAt: msg.createdAt,
            senderName: msg.senderName || "Pengguna"
          };
        }
      }
    });

    return { chattedContactIds: ids, lastMessageMap: lastMsg };
  }, [allMessages, currentUid]);

  // 7. Hitung jumlah unread badge per percakapan
  const unreadStats = useMemo(() => {
    return computeUnreadStats(currentUid, allMessages, activeConversationId);
  }, [currentUid, allMessages, activeConversationId]);

  // 8. Tampilkan Kontak Sesuai Aturan:
  // - Default (tanpa pencarian): HANYA kontak yang SUDAH PERNAH melakukan chat
  // - Sedang mencari: Cari di SEMUA kontak master (termasuk yang belum pernah chat)
  const searchQuery = searchUser.trim().toLowerCase();

  const displayedContacts = useMemo(() => {
    if (searchQuery) {
      // PENCARIAN AKTIF: Tampilkan seluruh kontak master yang cocok dengan kata kunci
      return contactsList.filter((c) => {
        if (c.id === currentUid) return false;
        const matchSearch =
          c.unitName.toLowerCase().includes(searchQuery) ||
          c.email.toLowerCase().includes(searchQuery) ||
          (c.role && c.role.toLowerCase().includes(searchQuery));
        const matchRole = roleFilter === "all" || c.role === roleFilter;
        return matchSearch && matchRole;
      });
    }

    // DEFAULT (KOLOM PENCARIAN KOSONG): HANYA kontak yang SUDAH PERNAH chat!
    const recentList = contactsList.filter((c) => {
      if (c.id === currentUid) return false;
      const hasChatted = chattedContactIds.has(c.id);
      const matchRole = roleFilter === "all" || c.role === roleFilter;
      return hasChatted && matchRole;
    });

    // Urutkan kontak dengan percakapan paling baru di atas
    recentList.sort((a, b) => {
      const timeA = lastMessageMap[a.id]?.createdAt
        ? new Date(lastMessageMap[a.id].createdAt).getTime()
        : 0;
      const timeB = lastMessageMap[b.id]?.createdAt
        ? new Date(lastMessageMap[b.id].createdAt).getTime()
        : 0;
      return timeB - timeA;
    });

    return recentList;
  }, [contactsList, currentUid, searchQuery, roleFilter, chattedContactIds, lastMessageMap]);

  // 9. Kirim Pesan dengan jaminan izin tulis lengkap
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || newMessageText.trim();

    if (!textToSend || !currentUid || isSending) return;

    setIsSending(true);
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const dateStr = now.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

      const msgDocRef = doc(collection(db, CHAT_COLLECTION));

      const rawMsgData = {
        id: msgDocRef.id,
        type: "chat_message",
        conversationId: activeConversationId,
        text: textToSend,

        // Field identitas autentikasi & kepemilikan
        ownerId: currentUid,
        senderId: currentUid,
        senderName: user?.unitName || user?.email || auth.currentUser?.email || "Pengguna",
        senderEmail: user?.email || auth.currentUser?.email || "",
        senderRole: user?.role || "eselon_2",
        senderUnit: user?.unitName || "Unit Kerja",
        unitName: user?.unitName || "Unit Kerja",
        role: user?.role || "eselon_2",
        tahun: "CHAT",

        // Field penerima
        recipientId: activeRecipient.id,
        recipientName: activeRecipient.unitName,

        // Waktu
        createdAt: now.toISOString(),
        createdAtStr: `${dateStr}, ${timeStr}`
      };

      // Pastikan tidak ada field undefined agar Firebase tidak menolak
      const cleanData: any = {};
      Object.keys(rawMsgData).forEach((key) => {
        if ((rawMsgData as any)[key] !== undefined) {
          cleanData[key] = (rawMsgData as any)[key];
        }
      });

      await setDoc(msgDocRef, cleanData, { merge: true });

      // Tandai percakapan sendiri langsung terbaca
      markConversationAsRead(currentUid, activeConversationId);

      setNewMessageText("");
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (err: any) {
      console.error("Gagal mengirim pesan detail:", err);
      toast.error(`Gagal mengirim pesan: ${err?.message || "Periksa koneksi Anda."}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRoleLabel = (role: string | null | undefined) => {
    if (role === "admin") return "Administrator";
    if (role === "kementerian") return "Kementerian";
    if (role === "auditor") return "Auditor APIP";
    if (role === "eselon_1") return "Eselon 1";
    if (role === "eselon_2") return "Eselon 2";
    if (role === "pimpinan") return "Pimpinan";
    return "Unit Kerja";
  };

  const getRoleBadgeColor = (role: string | null | undefined) => {
    if (role === "admin") return "bg-purple-100 text-purple-700 border-purple-200";
    if (role === "kementerian") return "bg-blue-100 text-blue-700 border-blue-200";
    if (role === "auditor") return "bg-amber-100 text-amber-700 border-amber-200";
    if (role === "pimpinan") return "bg-rose-100 text-rose-700 border-rose-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  const getUserInitials = (nameOrEmail: string | undefined | null) => {
    if (!nameOrEmail) return "U";
    const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && parts[0][0] && parts[1][0]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameOrEmail.slice(0, 2).toUpperCase();
  };

  // Saran pesan cepat
  const quickPrompts = [
    "Mohon konfirmasi status verifikasi risiko unit kami.",
    "Data Rencana Tindak Pengendalian (RTP) sudah kami perbarui.",
    "Apakah ada catatan audit dari tim APIP untuk periode ini?",
    "Terima kasih atas koordinasinya."
  ];

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden font-sans">
      {/* ====================================================================== */}
      {/* HEADER TOPBAR CHAT                                                    */}
      {/* ====================================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white px-4 md:px-6 py-3 flex items-center justify-between border-b border-slate-700/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold text-white tracking-wide">
                Pusat Koordinasi & Chat Pengguna
              </h1>
              <span className="hidden sm:inline-flex text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Real-time
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Koordinasi internal manajemen risiko antara Unit Kerja, Pengelola Kementerian, Auditor APIP, dan Admin.
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs text-slate-300 bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700/80 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <strong className="text-white">{user?.unitName || user?.email}</strong>
            <span className="text-slate-400">({getRoleLabel(user?.role)})</span>
          </span>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* BODY UTAMA: SPLIT PANE (KONTAK KIRI & PESAN KANAN)                     */}
      {/* ====================================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* PANEL KIRI: DAFTAR KONTAK & SALURAN UMUM */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200 bg-slate-50 shrink-0 transition-all duration-300 ${
            showMobileChat ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Pencarian & Filter Peran */}
          <div className="p-3 border-b border-slate-200 bg-white space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Cari unit atau nama pengguna..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white rounded-xl"
              />
              {searchUser && (
                <button
                  type="button"
                  onClick={() => setSearchUser("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px] font-bold px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Peran Pill */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
              {[
                { id: "all", label: "Semua" },
                { id: "kementerian", label: "Kementerian" },
                { id: "eselon_1", label: "Eselon 1" },
                { id: "eselon_2", label: "Eselon 2" },
                { id: "auditor", label: "Auditor" },
                { id: "admin", label: "Admin" }
              ].map((rf) => (
                <button
                  key={rf.id}
                  type="button"
                  onClick={() => setRoleFilter(rf.id)}
                  className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    roleFilter === rf.id
                      ? "bg-emerald-600 text-white shadow-xs font-semibold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          </div>

          {/* List Kontak & Saluran */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {/* 1. Saluran Umum Kemendes PDT (Dipin di Paling Atas) */}
            <div
              onClick={() => {
                setActiveRecipient({
                  id: GENERAL_ROOM_ID,
                  email: "publik@kemendesa.go.id",
                  role: "Semua Pengguna",
                  unitName: "Semua Unit Kerja & APIP"
                });
                setShowMobileChat(true);
                markConversationAsRead(currentUid, GENERAL_ROOM_ID);
              }}
              className={`p-3 rounded-xl cursor-pointer transition-all border ${
                activeRecipient.id === GENERAL_ROOM_ID
                  ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                  : "bg-white hover:bg-slate-100 border-slate-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      Forum Diskusi Risiko
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Unread badge untuk forum publik */}
                      {unreadStats.perConversation[GENERAL_ROOM_ID] > 0 &&
                        activeRecipient.id !== GENERAL_ROOM_ID && (
                          <span className="bg-rose-500 text-white font-extrabold text-[10px] px-1.5 py-0.2 rounded-full shadow-xs animate-pulse">
                            {unreadStats.perConversation[GENERAL_ROOM_ID]}
                          </span>
                        )}
                      <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-md">
                        Publik
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {lastMessageMap[GENERAL_ROOM_ID]
                      ? `${lastMessageMap[GENERAL_ROOM_ID].senderName.split(" ")[0]}: ${lastMessageMap[GENERAL_ROOM_ID].text}`
                      : "Saluran terbuka untuk seluruh unit kerja Kemendes PDT"}
                  </p>
                </div>
              </div>
            </div>

            {/* Header Kategori Kontak */}
            <div className="pt-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>
                {searchQuery
                  ? `Hasil Pencarian (${displayedContacts.length})`
                  : `Riwayat Percakapan (${displayedContacts.length})`}
              </span>
              <span className="text-slate-400">
                {searchQuery ? "Semua Kontak" : "Pernah Chat"}
              </span>
            </div>

            {/* 2. Daftar Pengguna & Unit Langsung */}
            {loadingContacts ? (
              <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Memuat daftar percakapan...</p>
              </div>
            ) : displayedContacts.length === 0 ? (
              searchQuery ? (
                <div className="text-center py-10 px-3 text-slate-400 space-y-2 bg-white rounded-xl border border-slate-200/80">
                  <Search className="w-7 h-7 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">Kontak Tidak Ditemukan</p>
                  <p className="text-[11px] text-slate-400">
                    Tidak ada unit kerja atau pengguna dengan nama &quot;{searchUser}&quot;.
                  </p>
                </div>
              ) : (
                /* Card panduan ketika belum ada riwayat chat 1-on-1 */
                <div className="text-center py-8 px-4 text-slate-400 space-y-2.5 bg-white rounded-xl border border-slate-200/80">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">Belum Ada Percakapan Langsung</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Kontak yang belum pernah chat tidak ditampilkan di sini. Ketik nama unit kerja atau pejabat pada kolom pencarian di atas untuk memulai chat baru.
                    </p>
                  </div>
                </div>
              )
            ) : (
              displayedContacts.map((c) => {
                const isSelected = activeRecipient.id === c.id;
                const convId = getConversationId(currentUid, c.id);
                const unreadCount = unreadStats.perConversation[convId] || 0;
                const lastMsg = lastMessageMap[c.id];
                const hasChatted = chattedContactIds.has(c.id);

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveRecipient(c);
                      setShowMobileChat(true);
                      markConversationAsRead(currentUid, convId);
                    }}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                        : "bg-white hover:bg-slate-100/90 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {getUserInitials(c.unitName || c.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-800 truncate" title={c.unitName}>
                            {c.unitName}
                          </p>
                          {/* Jam pesan terakhir atau Badge Mulai Chat */}
                          {lastMsg ? (
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                              {lastMsg.createdAtStr?.includes(",")
                                ? lastMsg.createdAtStr.split(",")[1].trim()
                                : lastMsg.createdAtStr}
                            </span>
                          ) : searchQuery && !hasChatted ? (
                            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded shrink-0">
                              Mulai Chat
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-[11px] text-slate-500 truncate flex-1">
                            {lastMsg ? (
                              <span className="text-slate-600">{lastMsg.text}</span>
                            ) : (
                              <span className="text-slate-400">
                                {getRoleLabel(c.role)} • {c.email || "Unit Resmi"}
                              </span>
                            )}
                          </p>

                          {/* Unread message count badge */}
                          {unreadCount > 0 && activeRecipient.id !== c.id && (
                            <span className="bg-rose-500 text-white font-extrabold text-[10px] px-1.5 py-0.2 rounded-full shadow-xs shrink-0 animate-pulse">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL KANAN: JENDELA PERCAKAPAN AKTIF */}
        <div
          className={`flex-1 flex flex-col bg-white overflow-hidden ${
            !showMobileChat ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header Percakapan Aktif */}
          <div className="p-3 md:px-5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              {/* Tombol Back untuk Mobile */}
              <button
                type="button"
                onClick={() => setShowMobileChat(false)}
                className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-sm">
                {activeRecipient.id === GENERAL_ROOM_ID ? (
                  <Users className="w-5 h-5" />
                ) : (
                  getUserInitials(activeRecipient.unitName)
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 truncate">
                    {activeRecipient.unitName}
                  </h2>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Aktif
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {activeRecipient.id === GENERAL_ROOM_ID
                    ? "Saluran Publik Kemendes PDT • Semua Unit Kerja & Auditor"
                    : `${getRoleLabel(activeRecipient.role)} • ${activeRecipient.email || ""}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                TA 2026
              </span>
            </div>
          </div>

          {/* Area Pesan (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5 bg-slate-50/70 custom-scrollbar">
            {/* Banner Penyambutan */}
            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3.5 text-xs text-emerald-900 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">
                  {activeRecipient.id === GENERAL_ROOM_ID
                    ? "Selamat datang di Forum Koordinasi Manajemen Risiko Kemendes PDT"
                    : `Percakapan langsung dengan ${activeRecipient.unitName}`}
                </p>
                <p className="text-[11px] text-emerald-800/90 mt-0.5">
                  Ruang komunikasi resmi untuk klarifikasi data risiko, konsultasi audit reviu APIP, sinkronisasi sasaran, dan percepatan penyelesaian RTP.
                </p>
              </div>
            </div>

            {/* List Bubble Pesan */}
            {messages.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-600">Belum ada percakapan</p>
                  <p className="text-[11px] text-slate-400">
                    Kirim pesan pertama Anda untuk memulai koordinasi.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUid;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}
                  >
                    {/* Header info pengirim (khusus jika bukan pesan sendiri) */}
                    {!isMe && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 px-1">
                        <span className="font-bold text-slate-800">{msg.senderName}</span>
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
                            msg.senderRole
                          )}`}
                        >
                          {getRoleLabel(msg.senderRole)}
                        </span>
                      </div>
                    )}

                    {/* Gelembung Pesan */}
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-xs ${
                        isMe
                          ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-tr-xs"
                          : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs"
                      }`}
                    >
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">
                        {msg.text}
                      </p>
                      <div
                        className={`flex items-center justify-end gap-1 text-[10px] mt-1 pt-1 ${
                          isMe
                            ? "text-emerald-100/80 border-t border-emerald-500/30"
                            : "text-slate-400 border-t border-slate-100"
                        }`}
                      >
                        <span>{msg.createdAtStr}</span>
                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Chips Pintasan Cepat */}
          <div className="px-4 py-2 bg-white border-t border-slate-100 shrink-0 overflow-x-auto custom-scrollbar flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Cepat:
            </span>
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isSending}
                className="text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-colors disabled:opacity-50 shrink-0 cursor-pointer whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Area Input Chat */}
          <div className="p-3 md:p-4 bg-white border-t border-slate-200 shrink-0">
            <div className="relative flex items-end gap-2 bg-slate-50 rounded-2xl border border-slate-300 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 p-2 transition-all">
              <textarea
                ref={textareaRef}
                rows={2}
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Tulis pesan untuk ${
                  activeRecipient.id === GENERAL_ROOM_ID ? "semua unit..." : `${activeRecipient.unitName}...`
                } (Enter untuk kirim)`}
                disabled={isSending}
                className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none custom-scrollbar"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isSending || !newMessageText.trim()}
                className="p-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-sm cursor-pointer"
                title="Kirim Pesan (Enter)"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400 px-1">
              <span>Tekan <strong>Enter</strong> untuk mengirim, <strong>Shift + Enter</strong> untuk baris baru</span>
              <span className="font-medium text-emerald-700 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-600" />
                Si-MaRi Kemendes PDT
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
