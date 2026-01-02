"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

type Interval = { in: string; out: string };
type DayEntry = { date: string; intervals: Interval[] };

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
    const result: DayEntry[] = [];

    while (date.getMonth() === m - 1) {
      result.push({
        date: date.toISOString().split("T")[0],
        intervals: [{ in: "", out: "" }],
      });
      date.setDate(date.getDate() + 1);
    }

    setDays(result);
  }, [month]);

  const validateDay = (day: DayEntry) => {
    let hasAnyValue = false;
    let hasError = false;

    for (const i of day.intervals) {
      if (i.in || i.out) hasAnyValue = true;

      if ((i.in && !i.out) || (!i.in && i.out)) {
        hasError = true;
      }

      if (i.in && i.out && i.in >= i.out) {
        hasError = true;
      }
    }

    return {
      hasError: hasAnyValue && hasError,
      isEmpty: !hasAnyValue,
    };
  };

  const hasBlockingErrors = useMemo(
    () => days.some(d => validateDay(d).hasError),
    [days]
  );

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
    if (!tokens) return logout();

    setLoading(true);
    setSheetUrl(null);

    try {
      const res = await fetch("/api/create-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, days, tokens }),
      });

      const data = await res.json();
      if (data.url) setSheetUrl(data.url);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="p-4 max-w-7xl mx-auto text-white space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="font-bold">Horarios · Planilla mensual</h1>
        <button onClick={logout} className="text-blue-400 text-sm">
          Cerrar sesión
        </button>
      </header>

      <div className="bg-slate-900/60 p-4 rounded-xl">
        <label className="text-sm block mb-2">Mes de trabajo</label>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          //className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
          className="
            bg-slate-800 border border-slate-700 rounded
            px-3 py-2
            w-full
            sm:max-w-[180px]
            md:max-w-none
            flex-1
          "
        />
      </div>

      <AnimatePresence>
        {days.map((day, dayIndex) => {
          const { hasError } = validateDay(day);

          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-4 border ${
                hasError
                  ? "border-red-500/60 bg-red-500/10"
                  : "border-slate-800 bg-slate-900/40"
              }`}
            >
              <div className="font-mono mb-3">{day.date}</div>

              <div className="space-y-2">
                {day.intervals.map((interval, i) => (
                  <div
                    key={i}
                    className="
                      flex flex-col sm:flex-row
                      gap-2 items-center
                      w-full
                    "
                  >
                    <input
                      type="time"
                      value={interval.in}
                      onChange={e =>
                        updateInterval(dayIndex, i, "in", e.target.value)
                      }
                      className="
                        bg-slate-800 border border-slate-700 rounded
                        px-3 py-2
                        w-full
                        sm:max-w-[180px]
                        md:max-w-none
                        flex-1
                      "
                    />

                    <input
                      type="time"
                      value={interval.out}
                      onChange={e =>
                        updateInterval(dayIndex, i, "out", e.target.value)
                      }
                      className="
                        bg-slate-800 border border-slate-700 rounded
                        px-3 py-2
                        w-full
                        sm:max-w-[180px]
                        md:max-w-none
                        flex-1
                      "
                    />

                    {day.intervals.length > 1 && (
                      <button
                        onClick={() => removeInterval(dayIndex, i)}
                        className="
                          bg-red-600 text-white
                          px-2 py-2 rounded
                          self-start sm:self-center
                        "
                      >
                        −
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => addInterval(dayIndex)}
                  className="bg-green-600 text-sm px-3 py-1 rounded w-fit"
                >
                  +
                </button>
              </div>

              {hasError && (
                <p className="text-red-400 text-sm mt-2">
                  ⚠ Día incompleto o con horarios inválidos
                </p>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="flex gap-4 items-center">
        <button
          onClick={generateSheet}
          disabled={loading || hasBlockingErrors}
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
