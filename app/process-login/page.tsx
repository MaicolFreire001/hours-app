"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProcessLoginPage() {
  const router = useRouter();

  useEffect(() => {

    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const tokens = params.get("tokens");

    if (tokens) {
      try {
        const decoded = JSON.parse(atob(tokens));
        localStorage.setItem("googleTokens", JSON.stringify(decoded));
        
      } catch (err) {
        console.error("Error decoding tokens:", err);
      }
    }

    router.replace("/");
  }, [router]);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      Procesando inicio de sesión...
    </div>
  );
}
