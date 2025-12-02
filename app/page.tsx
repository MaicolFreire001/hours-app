"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";

export default function HomePage() {
  const { isLoggedIn, loginWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/dashboard");
    }
  }, [isLoggedIn, router]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold mb-6">Bienvenido a Hours App</h1>
      <p className="mb-6 text-center text-gray-700">
        Lleva el control de tus horarios y genera planillas automáticamente.
      </p>
      <button
        onClick={loginWithGoogle}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
      >
        Iniciar sesión con Google
      </button>
    </div>
  );
}
