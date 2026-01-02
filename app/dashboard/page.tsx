"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    const year = Number(yearStr);
    const monthNum = Number(monthStr);

    const date = new Date(year, monthNum - 1, 1);
    const result: DayEntry[] = [];

    while (date.getMonth() === monthNum - 1) {
      result.push({
        date: date.toISOString().split("T")[0],
        intervals: [{ in: "", out: "" }],
      });
      date.setDate(date.getDate() + 1);
    }

    setDays(result);
  }, [month]);


  const validateDay = (day: DayEntry) => {
    let hasError = false;
    let incomplete = false;

    for (const i of day.intervals) {
      if (!i.in || !i.out) {
        incomplete = true;
      } else if (i.in >= i.out) {
        hasError = true;
      }
    }

    return { hasError, incomplete };
  };

  const hasAnyErrors = useMemo(() => {
    return days.some(d => {
      const v = validateDay(d);
      return v.hasError;
    });
  }, [days]);


  const updateInterval = (
    dayIndex: number,
    intervalIndex: number,
    field: "in" | "out",
    value: string
  ) => {
    const copy = structuredClone(days);
    copy[dayIndex].intervals[intervalIndex][field] = value;
    setDays(copy);
  };

  const addInterval = (dayIndex: number) => {
    const copy = structuredClone(days);
    copy[dayIndex].intervals.push({ in: "", out: "" });
    setDays(copy);
  };

  const removeInterval = (dayIndex: number, intervalIndex: number) => {
    const copy = structuredClone(days);
    copy[dayIndex].intervals.splice(intervalIndex, 1);
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

      const data = await res.json();

      if (res.status === 401 && data.needLogin) {
        logout();
        return;
      }

      if (data.url) setSheetUrl(data.url);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6 text-white">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Horarios · Planilla mensual</h1>
        <button onClick={logout} className="text-sm text-blue-400">
          Cerrar sesión
        </button>
      </header>

      <div className="bg-slate-900/60 p-4 rounded-xl">
        <label className="block text-sm mb-2">Mes de trabajo</label>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
        />
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {days.map((day, dayIndex) => {
            const { hasError, incomplete } = validateDay(day);

            return (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-4 border ${
                  hasError || incomplete
                    ? "border-red-500/50 bg-red-500/10"
                    : "border-slate-800 bg-slate-900/40"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                  <div className="font-mono">{day.date}</div>

                  {day.intervals.map((interval, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="time"
                        value={interval.in}
                        onChange={e =>
                          updateInterval(dayIndex, i, "in", e.target.value)
                        }
                        className="bg-slate-800 border rounded px-2 py-1 w-full"
                      />
                      <input
                        type="time"
                        value={interval.out}
                        onChange={e =>
                          updateInterval(dayIndex, i, "out", e.target.value)
                        }
                        className="bg-slate-800 border rounded px-2 py-1 w-full"
                      />
                      <button
                        onClick={() => removeInterval(dayIndex, i)}
                        className="bg-red-600 px-2 rounded"
                      >
                        −
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => addInterval(dayIndex)}
                    className="bg-green-600 px-3 py-1 rounded"
                  >
                    +
                  </button>
                </div>

                {(hasError || incomplete) && (
                  <p className="text-red-400 text-sm mt-2">
                    ⚠ Día incompleto o con horarios inválidos
                  </p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex gap-4 items-center">
        <button
          onClick={generateSheet}
          disabled={loading || hasAnyErrors}
          className="bg-blue-600 px-4 py-2 rounded disabled:opacity-50"
        >
          Generar planilla
        </button>

        {sheetUrl && (
          <a href={sheetUrl} target="_blank" className="underline text-blue-400">
            Abrir planilla
          </a>
        )}
      </div>
    </div>
  );
}
