// Helper fungsi utilitas chat, pengelolaan read status, dan unread badge
export const CHAT_COLLECTION = "mr_identifikasi";
export const GENERAL_ROOM_ID = "general";

export const getConversationId = (currentUid: string, otherId: string): string => {
  if (!otherId || otherId === GENERAL_ROOM_ID) return GENERAL_ROOM_ID;
  if (!currentUid) return GENERAL_ROOM_ID;
  return [currentUid, otherId].sort().join("_");
};

export const getChatInitTime = (currentUid: string): string => {
  if (typeof window === "undefined") return new Date().toISOString();
  const key = `sim_risiko_chat_init_${currentUid}`;
  let init = localStorage.getItem(key);
  if (!init) {
    // Inisialisasi waktu patokan pertama kali (24 jam terakhir) agar pesan lampau tidak membanjiri badge
    init = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(key, init);
  }
  return init;
};

export const getLastReadMap = (currentUid: string): Record<string, string> => {
  if (typeof window === "undefined" || !currentUid) return {};
  try {
    const raw = localStorage.getItem(`sim_risiko_chat_last_read_${currentUid}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Could not read chat lastRead map:", e);
  }
  return {};
};

export const markConversationAsRead = (currentUid: string, conversationId: string) => {
  if (typeof window === "undefined" || !currentUid || !conversationId) return;
  try {
    const map = getLastReadMap(currentUid);
    map[conversationId] = new Date().toISOString();
    localStorage.setItem(`sim_risiko_chat_last_read_${currentUid}`, JSON.stringify(map));

    // Kirim event kustom ke seluruh tab/komponen agar badge di layout dan header langsung diperbarui
    window.dispatchEvent(
      new CustomEvent("sim_risiko_chat_read_updated", {
        detail: { conversationId, timestamp: map[conversationId] }
      })
    );
  } catch (e) {
    console.warn("Could not save chat lastRead:", e);
  }
};

export interface ChatMessageData {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderEmail?: string;
  senderRole?: string;
  senderUnit?: string;
  recipientId?: string;
  recipientName?: string;
  text: string;
  createdAt: string;
  createdAtStr?: string;
}

export const computeUnreadStats = (
  currentUid: string,
  messages: ChatMessageData[],
  activeConversationId?: string | null
): { totalUnread: number; perConversation: Record<string, number> } => {
  if (!currentUid) return { totalUnread: 0, perConversation: {} };

  const lastReadMap = getLastReadMap(currentUid);
  const initTime = getChatInitTime(currentUid);

  let totalUnread = 0;
  const perConversation: Record<string, number> = {};

  messages.forEach((msg) => {
    // Abaikan pesan yang dikirim oleh diri sendiri
    if (msg.senderId === currentUid) return;

    // Periksa apakah pesan ini ditujukan untuk user ini (Forum Umum atau Direct Message ke user)
    const isGeneral =
      msg.recipientId === GENERAL_ROOM_ID || msg.conversationId === GENERAL_ROOM_ID;
    const isDirectToMe =
      msg.recipientId === currentUid ||
      (msg.conversationId && msg.conversationId.includes(currentUid));

    if (!isGeneral && !isDirectToMe) return;

    const convId =
      msg.conversationId ||
      (isGeneral ? GENERAL_ROOM_ID : getConversationId(currentUid, msg.senderId));

    // Jika user sedang aktif membuka percakapan ini, jangan hitung sebagai unread
    if (activeConversationId && activeConversationId === convId) {
      return;
    }

    const lastReadTime = lastReadMap[convId] || initTime;
    const isNewer =
      new Date(msg.createdAt).getTime() > new Date(lastReadTime).getTime();

    if (isNewer) {
      totalUnread++;
      perConversation[convId] = (perConversation[convId] || 0) + 1;
    }
  });

  return { totalUnread, perConversation };
};
