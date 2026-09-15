import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

let cachedIp = "";
const getClientIp = async () => {
  if (cachedIp) return cachedIp;
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    cachedIp = data.ip;
    return cachedIp;
  } catch (e) {
    return "Unknown IP";
  }
};

export const logActivity = async (
  user: { email?: string | null; unitName?: string | null; role?: string | null } | null,
  action: string,
  module: string,
  details?: string
) => {
  if (!user || !user.email) return;

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
    console.error("Failed to log activity", error);
  }
};
