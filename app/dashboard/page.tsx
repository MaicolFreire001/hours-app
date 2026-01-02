"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

type Interval = { in: string; out: string };
type DayEntry = { date: string; intervals: Interval[] };

export default function DashboardPage() {
  const { tokens, isLoggedIn, logout } = useAuth();

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;

  const [month, setMonth] = useState(currentMonth);
  const [days, setDays] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);

  useEffect(() => {
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr);
    const monthNum = parseInt(monthStr);

    const date = new Date(year, monthNum - 1, 1);
    const tempDays: DayEntry[] = [];

    while (date.getMonth() === monthNum - 1) {
      const yyyy = date.getFullYear();
      const mm = (date.getMonth() + 1).toString().padStart(2, "0");
      const dd = date.getDate().toString().padStart(2, "0");

      tempDays.push({
        date: `${yyyy}-${mm}-${dd}`,
        intervals: [{ in: "", out: "" }],
      });

      date.setDate(date.getDate() + 1);
    }

    setDays(tempDays);
  }, [month]);

  const addInterval = (dayIndex: number) => {
    const copy = [...days];
    copy[dayIndex].intervals.push({ in: "", out: "" });
    setDays(copy);
  };

  const removeInterval = (dayIndex: number, intervalIndex: number) => {
    const copy = [...days];
    copy[dayIndex].intervals.splice(intervalIndex, 1);
    setDays(copy);
  };

  const updateInterval = (
    dayIndex: number,
    intervalIndex: number,
    field: "in" | "out",
    value: string
  ) => {
    const copy = [...days];
    copy[dayIndex].intervals[intervalIndex][field] = value;
    setDays(copy);
  };

  const generateSheet = async () => {
    if (!tokens) {
      alert("Debes iniciar sesión");
      logout();
      return;
    }

    setLoading(true);
    setSheetUrl(null);

    try {
      const res = await fetch("/api/create-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, days, tokens }),
      });

      const data = await res.json();

      if (res.status === 401) {
        alert("Tu sesión expiró. Iniciá sesión nuevamente.");
        logout();
        return;
      }

      if (data.url) {
        setSheetUrl(data.url);
      } else {
        alert(data.error || "Error al generar la planilla");
      }
    } catch {
      alert("Error de red");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center">
        Debes iniciar sesión
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold">
            Horarios · Planilla mensual
          </h1>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-red-400 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* MES */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
          <label className="block text-sm text-slate-400 mb-2">
            Mes de trabajo
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="
              bg-slate-900 border border-slate-700 rounded-md
              px-3 py-2 text-slate-100
              focus:outline-none focus:ring-2 focus:ring-blue-500
              transition
            "
          />
        </div>

        {/* MOBILE VIEW */}
        <div className="space-y-4 md:hidden">
          {days.map((day, dayIndex) => (
            <div
              key={day.date}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
            >
              <div className="font-semibold">{day.date}</div>

              {day.intervals.map((interval, intervalIndex) => (
                <div key={intervalIndex} className="flex gap-2 items-center">
                  <input
                    type="time"
                    value={interval.in}
                    onChange={(e) =>
                      updateInterval(dayIndex, intervalIndex, "in", e.target.value)
                    }
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1"
                  />
                  <input
                    type="time"
                    value={interval.out}
                    onChange={(e) =>
                      updateInterval(dayIndex, intervalIndex, "out", e.target.value)
                    }
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1"
                  />
                  <button
                    onClick={() => addInterval(dayIndex)}
                    className="bg-emerald-600 hover:bg-emerald-500 transition text-white px-2 py-1 rounded"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2">Ingreso</th>
                <th className="px-3 py-2">Salida</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day, dayIndex) =>
                day.intervals.map((interval, intervalIndex) => (
                  <tr
                    key={`${day.date}-${intervalIndex}`}
                    className="border-t border-slate-800 hover:bg-slate-800/40 transition"
                  >
                    {intervalIndex === 0 && (
                      <td
                        rowSpan={day.intervals.length}
                        className="px-3 py-2 font-medium"
                      >
                        {day.date}
                      </td>
                    )}
                    <td className="px-3 py-2">
                      <input
                        type="time"
                        value={interval.in}
                        onChange={(e) =>
                          updateInterval(dayIndex, intervalIndex, "in", e.target.value)
                        }
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="time"
                        value={interval.out}
                        onChange={(e) =>
                          updateInterval(dayIndex, intervalIndex, "out", e.target.value)
                        }
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2 flex gap-1 justify-center">
                      <button
                        onClick={() => addInterval(dayIndex)}
                        className="bg-emerald-600 hover:bg-emerald-500 transition text-white px-2 py-1 rounded"
                      >
                        +
                      </button>
                      {day.intervals.length > 1 && (
                        <button
                          onClick={() => removeInterval(dayIndex, intervalIndex)}
                          className="bg-red-600 hover:bg-red-500 transition text-white px-2 py-1 rounded"
                        >
                          −
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">
          <button
            onClick={generateSheet}
            disabled={loading}
            className="
              bg-blue-600 hover:bg-blue-500 transition
              text-white px-5 py-2 rounded-lg
              disabled:opacity-50
            "
          >
            {loading ? "Generando..." : "Generar planilla"}
          </button>

          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 underline transition"
            >
              Abrir planilla
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
