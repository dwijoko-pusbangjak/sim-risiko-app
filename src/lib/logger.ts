import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

let cachedIp = "";
let isFetchingIp = false;

const getClientIp = async (): Promise<string> => {
  if (cachedIp) return cachedIp;
  if (isFetchingIp) return "Client-IP";
  
  isFetchingIp = true;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);

    const res = await fetch("https://api.ipify.org?format=json", {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      cachedIp = data.ip || "Client-IP";
      return cachedIp;
    }
  } catch (e) {
    cachedIp = "Client-IP";
  } finally {
    isFetchingIp = false;
  }
  return cachedIp || "Client-IP";
};

export const logActivity = async (
  user: { email?: string | null; unitName?: string | null; role?: string | null } | null,
  action: string,
  module: string,
  details?: string
) => {
  if (!user || !user.email) return;

  // Run in background without blocking callers
  try {
    const ipAddress = await getClientIp();

    await addDoc(collection(db, "activity_logs"), {
      email: user.email,
      unitName: user.unitName || "Admin/System",
      role: user.role || "unknown",
      action,
      module,
      details: details || "",
      ipAddress,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to log activity (silent):", error);
  }
};
