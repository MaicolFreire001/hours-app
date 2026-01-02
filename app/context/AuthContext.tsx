/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  startTransition,
} from "react";

type AuthContextType = {
  tokens: any | null;
  isLoggedIn: boolean;
  loading: boolean;
  loginWithGoogle: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let parsed: any | null = null;

    try {
      const stored = localStorage.getItem("googleTokens");
      if (stored) parsed = JSON.parse(stored);
    } catch {
      localStorage.removeItem("googleTokens");
    }

    startTransition(() => {
      setTokens(parsed);
      setLoading(false);
    });
  }, []);

  const loginWithGoogle = () => {
    window.location.href = "/api/auth/google";
  };

  const logout = () => {
    localStorage.removeItem("googleTokens");
    setTokens(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        tokens,
        isLoggedIn: !!tokens,
        loading,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
