"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Ambil data profile dari Firestore berdasarkan UID
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
        } catch (error) {
          console.error("Gagal mengambil data user:", error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: "eselon_2", // Fallback
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, activeYear, setActiveYear }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
