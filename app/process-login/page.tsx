"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProcessLoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tokenData = searchParams.get("token");

    if (tokenData) {
      localStorage.setItem("googleTokens", tokenData);
      router.replace("/dashboard");
    } else {
      router.replace("/");
    }
  }, []);

  return <p>Procesando login...</p>;
}
