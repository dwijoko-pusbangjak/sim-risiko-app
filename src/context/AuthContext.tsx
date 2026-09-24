"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";

export type Role = "admin" | "eselon_1" | "eselon_2" | null;

interface UserProfile {
  uid: string;
  email: string | null;
  role: Role;
  unitName?: string; // Nama direktorat/biro/unit kerjanya
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  activeYear: string;
  setActiveYear: (year: string) => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  activeYear: new Date().getFullYear().toString(),
  setActiveYear: () => {} 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYearState] = useState<string>("2026");
  
  // Timeout for auto-logout
  const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load active year from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedYear = localStorage.getItem("simrisiko_active_year");
      if (savedYear) setActiveYearState(savedYear);
    }
  }, []);

  const setActiveYear = (year: string) => {
    setActiveYearState(year);
    if (typeof window !== "undefined") {
      localStorage.setItem("simrisiko_active_year", year);
    }
  };

  const handleIdleLogout = useCallback(async () => {
    if (auth.currentUser) {
      toast.error("Sesi Anda telah habis karena tidak ada aktivitas selama 5 menit. Silakan login kembali.", { duration: 5000 });
      await signOut(auth);
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    // Only set timer if user is logged in
    if (auth.currentUser) {
      idleTimerRef.current = setTimeout(handleIdleLogout, IDLE_TIMEOUT_MS);
    }
  }, [handleIdleLogout, IDLE_TIMEOUT_MS]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          let role: Role = null;
          let unitName = "";
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            role = data.role as Role;
            unitName = data.unitName;
          }

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: role || "eselon_2", // Default fallback
            unitName: unitName,
          });
          
          // Start idle timer when user logs in
          resetIdleTimer();
        } catch (error) {
          console.error("Gagal mengambil data user:", error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: "eselon_2", // Fallback
          });
          resetIdleTimer();
        }
      } else {
        setUser(null);
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [resetIdleTimer]);

  useEffect(() => {
    // Only attach event listeners if user is logged in
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Throttle the reset so we don't clear/set timeouts thousands of times per second on mousemove
    let throttleTimeout: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (!throttleTimeout) {
        resetIdleTimer();
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 1000); // Only reset timer max once per second
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (throttleTimeout) clearTimeout(throttleTimeout);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user, resetIdleTimer]);

  return (
    <AuthContext.Provider value={{ user, loading, activeYear, setActiveYear }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
