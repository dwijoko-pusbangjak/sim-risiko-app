"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs
} from "firebase/firestore";
import {
  MessageSquare,
  Send,
  Search,
  Users,
  Building2,
  ShieldAlert,
  Sparkles,
  Bot,
  UserCheck,
  CheckCheck,
  Clock,
  ChevronLeft,
  RefreshCw,
  Info,
  ShieldCheck,
  MessageCircle,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UserContact {
  id: string; // UID
  email: string;
  role: string;
  unitName: string;
  unitId?: string;
}

interface ChatMessage {
  id: string;
  conversationId: string; // "general" atau `${uidA}_${uidB}`
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  senderUnit: string;
  recipientId: string; // "general" atau UID penerima
  recipientName?: string;
  text: string;
  timestamp: any;
  createdAtStr: string;
}

const GENERAL_ROOM_ID = "general";

export default function ChatPenggunaPage() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<UserContact[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Percakapan yang sedang aktif: "general" atau ID pengguna lawan bicara
  const [activeRecipient, setActiveRecipient] = useState<UserContact | { id: string; name: string; unitName: string; role: string }>({
    id: GENERAL_ROOM_ID,
    name: "Forum Diskusi Risiko Kemendes PDT",
    unitName: "Semua Unit Kerja & APIP",
    role: "Semua Pengguna"
  });

  // State Pesan Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hitung ID percakapan: "general" atau gabungan alfabetis 2 UID
  const getConversationId = (otherUserId: string) => {
    if (otherUserId === GENERAL_ROOM_ID) return GENERAL_ROOM_ID;
    if (!user) return GENERAL_ROOM_ID;
    return [user.uid, otherUserId].sort().join("_");
  };

  const activeConversationId = getConversationId(activeRecipient.id);

  // 1. Ambil daftar semua user dari Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const snap = await getDocs(collection(db, "users"));
        const list: UserContact[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            email: data.email || "",
            role: data.role || "eselon_2",
            unitName: data.unitName || data.email || "Unit Kerja",
            unitId: data.unitId
          });
        });
        setUsersList(list);
      } catch (err) {
        console.error("Gagal mengambil daftar pengguna:", err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // 2. Real-time Subscription ke Pesan Chat pada conversationId aktif
  useEffect(() => {
    if (!user || !activeConversationId) return;

    try {
      const q = query(
        collection(db, "chat_messages"),
        where("conversationId", "==", activeConversationId),
        orderBy("timestamp", "asc"),
        limit(150)
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
              timestamp: data.timestamp,
              createdAtStr: data.createdAtStr || "Baru saja"
            });
          });
          setMessages(msgs);
        },
        (error) => {
          console.warn("Real-time chat error:", error);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Subscription setup failed:", err);
    }
  }, [user, activeConversationId]);

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Kirim Pesan
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || newMessageText.trim();
    if (!textToSend || !user || isSending) return;

    setIsSending(true);
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const dateStr = now.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

      const newMsgData = {
        conversationId: activeConversationId,
        senderId: user.uid,
        senderName: user.unitName || user.email || "Pengguna",
        senderEmail: user.email || "",
        senderRole: user.role || "eselon_2",
        senderUnit: user.unitName || "Unit Kerja",
        recipientId: activeRecipient.id,
        recipientName: "unitName" in activeRecipient ? activeRecipient.unitName : activeRecipient.name,
        text: textToSend,
        timestamp: serverTimestamp(),
        createdAtStr: `${dateStr}, ${timeStr}`
      };

      await addDoc(collection(db, "chat_messages"), newMsgData);
      setNewMessageText("");
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (err: any) {
      console.error("Gagal mengirim pesan:", err);
      toast.error("Gagal mengirim pesan. Silakan coba lagi.");
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
    return "Pengguna";
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

  // Filter daftar pengguna (kecuali diri sendiri)
  const filteredUsers = usersList.filter((u) => {
    if (u.id === user?.uid) return false; // Jangan tampilkan diri sendiri di daftar kontak
    const matchesSearch =
      u.unitName.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.role.toLowerCase().includes(searchUser.toLowerCase());

    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const quickPrompts = [
    "Halo, mohon bantuan telaah risiko pada unit kami.",
    "RTP unit kerja kami telah selesai diinput, siap untuk diverifikasi.",
    "Apakah ada revisi untuk penetapan konteks risiko?",
    "Terima kasih atas koordinasinya."
  ];

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden font-sans">
      {/* ====================================================================== */}
      {/* HEADER UTAMA CHAT                                                      */}
      {/* ====================================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0f172a] to-emerald-950 text-white px-4 md:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight">
                Pusat Komunikasi & Chat Pengguna
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
                placeholder="Cari unit atau pengguna..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white rounded-xl"
              />
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
                  name: "Forum Diskusi Risiko Kemendes PDT",
                  unitName: "Semua Unit Kerja & APIP",
                  role: "Semua Pengguna"
                });
                setShowMobileChat(true);
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      Forum Diskusi Risiko
                    </h3>
                    <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-md">
                      Publik
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Saluran terbuka untuk seluruh unit kerja Kemendes PDT
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Pesan Langsung ({filteredUsers.length})</span>
              <span className="text-slate-400">1-on-1</span>
            </div>

            {/* 2. Daftar Pengguna Langsung */}
            {loadingUsers ? (
              <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Memuat daftar pengguna...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Tidak ada pengguna yang sesuai pencarian.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = activeRecipient.id === u.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      setActiveRecipient(u);
                      setShowMobileChat(true);
                    }}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                        : "bg-white hover:bg-slate-100/90 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {getUserInitials(u.unitName || u.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-800 truncate" title={u.unitName}>
                            {u.unitName}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
                              u.role
                            )}`}
                          >
                            {getRoleLabel(u.role)}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {u.email}
                          </span>
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
                  getUserInitials("unitName" in activeRecipient ? activeRecipient.unitName : activeRecipient.name)
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 truncate">
                    {"unitName" in activeRecipient ? activeRecipient.unitName : activeRecipient.name}
                  </h2>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Aktif
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {activeRecipient.id === GENERAL_ROOM_ID
                    ? "Saluran Publik Kemendes PDT • Semua Unit Kerja & Auditor"
                    : `${getRoleLabel(activeRecipient.role)} • ${"email" in activeRecipient ? activeRecipient.email : ""}`}
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
                    : `Percakapan langsung dengan ${"unitName" in activeRecipient ? activeRecipient.unitName : activeRecipient.name}`}
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
                const isMe = msg.senderId === user?.uid;
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
                  activeRecipient.id === GENERAL_ROOM_ID ? "semua unit..." : "unit ini..."
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
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
