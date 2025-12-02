"use client";

import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { isLoggedIn, logout } = useAuth();

  if (!isLoggedIn)
    return <p>Debes iniciar sesión para ver esta página.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <p>Desde aquí vas a poder cargar tus horarios y generar tu planilla.</p>

      <button
        onClick={logout}
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
