"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

type Interval = { in: string; out: string };
type DayEntry = { date: string; intervals: Interval[] };

function isDayEmpty(day: DayEntry) {
  return day.intervals.every(i => !i.in && !i.out);
}

function isDayInvalid(day: DayEntry) {
  if (isDayEmpty(day)) return false;

  return day.intervals.some(i => {
    if (!i.in || !i.out) return true;
    return i.in >= i.out;
  });
}

export default function DashboardPage() {
  const { tokens, isLoggedIn, logout } = useAuth();

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  const [month, setMonth] = useState(currentMonth);
  const [days, setDays] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);

  useEffect(() => {
    const [y, m] = month.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    const temp: DayEntry[] = [];

    while (date.getMonth() === m - 1) {
      temp.push({
        date: date.toISOString().slice(0, 10),
        intervals: [{ in: "", out: "" }],
      });
      date.setDate(date.getDate() + 1);
    }

    setDays(temp);
  }, [month]);

  const updateInterval = (
    d: number,
    i: number,
    field: "in" | "out",
    value: string
  ) => {
    const copy = [...days];
    copy[d].intervals[i][field] = value;
    setDays(copy);
  };

  const addInterval = (d: number) => {
    const copy = [...days];
    copy[d].intervals.push({ in: "", out: "" });
    setDays(copy);
  };

  const removeInterval = (d: number, i: number) => {
    const copy = [...days];
    copy[d].intervals.splice(i, 1);
    setDays(copy);
  };

  const generateSheet = async () => {
    if (!tokens) {
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

      if (res.status === 401) {
        alert("Sesión expirada");
        logout();
        return;
      }

      const data = await res.json();

      if (data.url) {
        setSheetUrl(data.url);
        alert("Planilla creada correctamente");
      } else {
        alert(data.error || "Error al generar planilla");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn)
    return <p className="p-6 text-slate-300">Debes iniciar sesión</p>;

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-slate-900 to-black text-slate-100">
      <header className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
        <h1 className="font-semibold text-lg">Horarios · Planilla mensual</h1>
        <button onClick={logout} className="text-sm text-blue-400 hover:underline">
          Cerrar sesión
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <label className="block text-sm mb-1 text-slate-300">
            Mes de trabajo
          </label>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
          />
        </div>

        <div className="space-y-4">
          {days.map((day, dIndex) => {
            const invalid = isDayInvalid(day);

            return (
              <div
                key={day.date}
                className={`rounded-xl p-4 border transition
                  ${
                    invalid
                      ? "border-red-600 bg-red-950/30"
                      : "border-slate-800 bg-slate-900"
                  }`}
              >
                <div className="font-medium mb-3">{day.date}</div>

                <div className="space-y-2">
                  {day.intervals.map((interval, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row gap-2 items-center w-full"
                    >
                      <input
                        type="time"
                        value={interval.in}
                        onChange={e =>
                          updateInterval(dIndex, i, "in", e.target.value)
                        }
                        className="bg-slate-800 border border-slate-700 rounded px-3 py-2 w-full sm:max-w-[180px] md:max-w-none flex-1"
                      />

                      <input
                        type="time"
                        value={interval.out}
                        onChange={e =>
                          updateInterval(dIndex, i, "out", e.target.value)
                        }
                        className="bg-slate-800 border border-slate-700 rounded px-3 py-2 w-full sm:max-w-[180px] md:max-w-none flex-1"
                      />

                      {day.intervals.length > 1 && (
                        <button
                          onClick={() => removeInterval(dIndex, i)}
                          className="bg-red-600 text-white px-2 py-2 rounded"
                        >
                          −
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {invalid && (
                  <p className="text-red-400 text-sm mt-2">
                    ⚠ Día incompleto o con horarios inválidos
                  </p>
                )}

                <button
                  onClick={() => addInterval(dIndex)}
                  className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-1 rounded"
                >
                  +
                </button>
              </div>
            );
          })}
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={generateSheet}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-6 py-2 rounded"
          >
            {loading ? "Generando..." : "Generar planilla"}
          </button>

          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              className="text-blue-400 underline"
              rel="noreferrer"
            >
              Abrir planilla
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
