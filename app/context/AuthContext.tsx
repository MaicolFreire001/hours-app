/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createContext, useContext, useState } from "react";

type AuthContextType = {
  tokens: any | null;
  isLoggedIn: boolean;
  loginWithGoogle: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  tokens: null,
  isLoggedIn: false,
  loginWithGoogle: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<any | null>(() => {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem("googleTokens");
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);

      if (!parsed?.access_token) {
        localStorage.removeItem("googleTokens");
        return null;
      }

      return parsed;
    } catch {
      localStorage.removeItem("googleTokens");
      return null;
    }
  });

  const loginWithGoogle = () => {
    window.location.href = "/api/auth/google";
  };

  const logout = () => {
    localStorage.removeItem("googleTokens");
    setTokens(null);
    window.location.href = "/";
  };

  const isLoggedIn = !!tokens;

  return (
    <AuthContext.Provider
      value={{ tokens, isLoggedIn, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
