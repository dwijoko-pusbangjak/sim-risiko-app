"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  RotateCcw,
  Settings,
  Key,
  Copy,
  Check,
  ChevronRight,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  HelpCircle,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  source?: "gemini" | "knowledge_base";
}

// Lightweight Markdown Formatter
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed text-slate-800 break-words">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Headings
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-bold text-slate-900 mt-2 mb-1 text-sm sm:text-base border-b border-slate-200 pb-0.5">
              {renderInline(trimmed.replace(/^###\s+/, ""))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="font-bold text-slate-900 mt-2.5 mb-1 text-base text-emerald-900">
              {renderInline(trimmed.replace(/^##\s+/, ""))}
            </h3>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={idx} className="font-bold text-slate-900 mt-3 mb-1 text-base sm:text-lg text-emerald-950">
              {renderInline(trimmed.replace(/^#\s+/, ""))}
            </h2>
          );
        }

        // Blockquotes
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote key={idx} className="border-l-3 border-emerald-500 bg-emerald-50/70 pl-2.5 py-1 my-1 rounded-r text-slate-700 italic text-xs sm:text-sm">
              {renderInline(trimmed.replace(/^>\s*/, ""))}
            </blockquote>
          );
        }

        // Horizontal rule
        if (trimmed === "---" || trimmed === "***") {
          return <hr key={idx} className="my-2 border-slate-200" />;
        }

        // Unordered List
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-emerald-600 mt-1.5 shrink-0 block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <div className="flex-1">
                {renderInline(trimmed.substring(2))}
              </div>
            </div>
          );
        }

        // Numbered list (e.g. 1. 2. etc)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="font-semibold text-emerald-700 text-xs shrink-0 mt-0.5 bg-emerald-50 px-1 rounded border border-emerald-200">
                {numMatch[1]}.
              </span>
              <div className="flex-1">
                {renderInline(numMatch[2])}
              </div>
            </div>
          );
        }

        // Standard Paragraph
        return (
          <p key={idx} className="my-0.5">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

// Inline Markdown parser (Bold, Italic, Code, Link)
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let keyIdx = 0;

  // Regex matches `**bold**` OR `` `code` `` OR `*italic*`
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={keyIdx++} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code key={keyIdx++} className="bg-slate-100 text-emerald-800 text-xs px-1 py-0.5 rounded font-mono border border-slate-200">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={keyIdx++} className="italic text-slate-700">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts.length > 0 ? parts : text}</>;
}

export default function AIChatBox() {
  const { user, activeYear } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Quick Prompt Suggestions
  const quickPrompts = [
    "Bagaimana rumus baku pernyataan risiko?",
    "Berikan contoh risiko untuk unit kerja saya",
    "Jelaskan skala 5x5 kemungkinan & dampak",
    "Cara menyusun Rencana Tindak Pengendalian (RTP)",
    "Bagaimana alur audit dengan Auditor APIP?",
    "Apa dasar hukum pengelolaan risiko?"
  ];

  // Initialize chat from localStorage or greeting
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load saved API key
    const savedKey = localStorage.getItem("simrisiko_gemini_api_key") || "";
    setApiKeyInput(savedKey);

    // Load saved messages
    const savedMessages = localStorage.getItem("simrisiko_ai_chat_history");
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved chat history:", e);
      }
    }

    // Default welcome message if empty
    const welcomeMsg: Message = {
      id: "welcome-1",
      role: "assistant",
      content: `Halo! Saya **Si-MaRi AI**, asisten kecerdasan buatan konsultasi Manajemen Risiko Kementerian Desa, PDT, dan Transmigrasi.\n\nSaya siap mendampingi Anda (${user?.unitName || "Unit Kerja Kemendesa"}) dalam:\n- **Perumusan Pernyataan Risiko** (*[Sebab] -> [Peristiwa] -> [Dampak]*)\n- **Penetapan Skala 5x5** (*Kemungkinan & Dampak*)\n- **Penyusunan Rencana Tindak Pengendalian (RTP)**\n- **Konsultasi Audit & Reviu APIP**\n\nSilakan pilih salah satu pertanyaan cepat di bawah atau ketik pertanyaan Anda!`,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      source: "knowledge_base"
    };
    setMessages([welcomeMsg]);
  }, [user]);

  // Save messages to localStorage when updated
  useEffect(() => {
    if (typeof window === "undefined" || messages.length === 0) return;
    try {
      localStorage.setItem("simrisiko_ai_chat_history", JSON.stringify(messages));
    } catch (e) {
      console.warn("Could not save chat history:", e);
    }
  }, [messages]);

  // Smart Auto-scroll: When assistant finishes replying, scroll to start of new message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      if (isLoading) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } else if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Focus textarea when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage.trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!customText) setInputMessage("");
    setIsLoading(true);

    try {
      // API call to Next.js API endpoint
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userContext: {
            role: user?.role,
            unitName: user?.unitName,
            activeYear: activeYear,
            email: user?.email
          },
          apiKey: apiKeyInput.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error("Gagal mendapatkan respon dari AI server");
      }

      const data = await response.json();
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "Maaf, belum ada jawaban yang dapat diberikan.",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        source: data.source || "knowledge_base"
      };

      setMessages([...newMessages, assistantMsg]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "⚠️ Terjadi gangguan koneksi saat menghubungi AI. Pastikan jaringan internet stabil atau coba tanyakan kembali beberapa saat lagi.",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        source: "knowledge_base"
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus seluruh riwayat percakapan dengan Si-MaRi AI?")) {
      const resetMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Percakapan telah direset. Halo kembali, rekan ${user?.unitName || "Kemendesa PDT"}! Ada yang bisa saya bantu terkait penyusunan atau analisis risiko hari ini?`,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        source: "knowledge_base"
      };
      setMessages([resetMsg]);
      localStorage.removeItem("simrisiko_ai_chat_history");
      toast.success("Riwayat percakapan berhasil dibersihkan");
    }
  };

  const handleSaveApiKey = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("simrisiko_gemini_api_key", apiKeyInput.trim());
      setShowSettings(false);
      toast.success(
        apiKeyInput.trim()
          ? "Kunci Google Gemini API berhasil disimpan!"
          : "Menggunakan Built-in Expert Engine Kemendesa (default)"
      );
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Teks berhasil disalin ke clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden font-sans">
      {/* 1. BUTTON JIKA CHAT DITUTUP */}
      {!isOpen && (
        <div className="relative group">
          {/* Greeting Tooltip Bubble */}
          <div className="absolute right-0 bottom-16 w-64 bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-xl border border-emerald-100 text-xs text-slate-700 pointer-events-none transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              Si-MaRi AI Assistant
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Butuh panduan merumuskan risiko, matriks 5x5, atau konsultasi APIP? Klik untuk diskusi langsung dengan AI!
            </p>
          </div>

          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-full shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 border border-emerald-400/30"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              </span>
            </div>
            <span className="font-semibold text-sm tracking-wide">Tanya AI Risiko</span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      )}

      {/* 2. CHAT WINDOW JIKA DIBUKA */}
      {isOpen && (
        <div
          className={`bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col transition-all duration-300 overflow-hidden ${
            isMinimized
              ? "w-80 h-14"
              : "w-[94vw] sm:w-[440px] md:w-[480px] h-[620px] max-h-[88vh]"
          }`}
        >
          {/* HEADER CHAT */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-3.5 flex items-center justify-between shrink-0 border-b border-emerald-900/40 select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative p-1.5 bg-emerald-600/30 border border-emerald-500/40 rounded-xl">
                <Bot className="w-5 h-5 text-emerald-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white tracking-wide">Si-MaRi AI</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 font-medium">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate max-w-[190px] sm:max-w-[260px]">
                  {user?.unitName || "Kemendesa PDT"} • TA {activeYear}
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1 text-slate-300">
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="Pengaturan AI / API Key"
                className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={handleClearChat}
                title="Reset Percakapan"
                className="p-1.5 hover:bg-slate-800 hover:text-amber-400 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Perbesar" : "Kecilkan"}
                className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Tutup Chat"
                className="p-1.5 hover:bg-rose-900/60 hover:text-rose-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* JIKA TIDAK DIMINIMIZE */}
          {!isMinimized && (
            <>
              {/* SETTINGS PANEL (JIKA DIBUKA) */}
              {showSettings && (
                <div className="bg-slate-50 border-b border-slate-200 p-3.5 text-xs text-slate-700 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-emerald-600" />
                      Konfigurasi Engine AI
                    </span>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Tutup
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
                    Secara bawaan, Si-MaRi dilengkapi <strong>Built-in Expert Knowledge Base Kemendesa PDT</strong> yang dapat menjawab seluruh pertanyaan regulasi & perumusan risiko secara offline/lokal. Anda juga dapat memasukkan <em>Google Gemini API Key</em> jika ingin memanfaatkan model generative online langsung.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Masukkan Gemini API Key (opsional)..."
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                    <button
                      onClick={handleSaveApiKey}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs transition-colors shrink-0"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              )}

              {/* MESSAGES LIST AREA */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-4 bg-slate-50/60 custom-scrollbar">
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    ref={idx === messages.length - 1 ? lastMessageRef : null}
                    className="w-full flex flex-col"
                  >
                    {msg.role === "user" ? (
                      /* USER MESSAGE BUBBLE */
                      <div className="flex items-start justify-end gap-2 max-w-[90%] self-end">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl rounded-tr-xs p-3 shadow-sm">
                          <div className="flex items-center justify-between gap-3 mb-1 text-[10px] text-emerald-100/90 font-medium pb-1 border-b border-emerald-500/30">
                            <span className="font-semibold text-white flex items-center gap-1">
                              Anda ({user?.role === "kementerian" ? "Kementerian" : user?.role === "auditor" ? "Auditor" : "Unit Kerja"})
                            </span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </p>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ring-2 ring-emerald-200 mt-1">
                          {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                      </div>
                    ) : (
                      /* ASSISTANT MESSAGE BUBBLE */
                      <div className="flex items-start gap-2 max-w-[94%] self-start">
                        <div className="w-7 h-7 rounded-full bg-slate-900 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm mt-1">
                          <Bot className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="bg-white text-slate-800 border border-slate-200/90 rounded-2xl rounded-tl-xs p-3.5 shadow-sm flex-1 relative group">
                          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 text-[11px] text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-emerald-900">Si-MaRi AI</span>
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-medium">
                                {msg.source === "gemini" ? "Gemini 2.0" : "KB Expert Engine"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                              <span className="text-[10px]">{msg.timestamp}</span>
                              <button
                                onClick={() => handleCopy(msg.content, msg.id)}
                                title="Salin jawaban"
                                className="p-1 hover:bg-slate-100 hover:text-slate-700 rounded transition-colors"
                              >
                                {copiedId === msg.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                          <FormattedMessage content={msg.content} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading Bubble */}
                {isLoading && (
                  <div className="flex items-start gap-2 max-w-[90%] self-start">
                    <div className="w-7 h-7 rounded-full bg-slate-900 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <Bot className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3 shadow-sm flex items-center gap-2.5 text-xs text-slate-600">
                      <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                      <span>Si-MaRi sedang menganalisis & merumuskan jawaban...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* QUICK PROMPT SUGGESTIONS CHIPS (No ugly scrollbar) */}
              <div className="bg-white px-3 py-2 border-t border-slate-100 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden shrink-0">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Contoh:
                  </span>
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(prompt)}
                      disabled={isLoading}
                      className="text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* INPUT BOX */}
              <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                <div className="relative flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-300 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 p-2">
                  <textarea
                    ref={textareaRef}
                    rows={2}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tanyakan apa saja seputar Manajemen Risiko Kemendesa..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none custom-scrollbar"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !inputMessage.trim()}
                    className="p-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-sm"
                    title="Kirim (Enter)"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400 px-1">
                  <span>Tekan <strong>Enter</strong> kirim, <strong>Shift+Enter</strong> baris baru</span>
                  <span className="flex items-center gap-1 font-medium text-emerald-700">
                    <ShieldAlert className="w-3 h-3 text-emerald-600" />
                    Permenpan RB 5/2020
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
