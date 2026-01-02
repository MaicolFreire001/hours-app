"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Entry = {
  in: string;
  out: string;
};

type Day = {
  date: string;
  entries: Entry[];
};

function isInvalid(entry: Entry) {
  if (!entry.in || !entry.out) return true;
  return entry.in >= entry.out;
}

export default function MonthlySheet() {
  const [days, setDays] = useState<Day[]>([
    {
      date: "2026-01-01",
      entries: [{ in: "10:22", out: "13:24" }],
    },
    {
      date: "2026-01-02",
      entries: [{ in: "", out: "" }],
    },
  ]);

  function updateEntry(
    dayIndex: number,
    entryIndex: number,
    field: "in" | "out",
    value: string
  ) {
    setDays((prev) =>
      prev.map((day, dIdx) =>
        dIdx !== dayIndex
          ? day
          : {
              ...day,
              entries: day.entries.map((e, eIdx) =>
                eIdx !== entryIndex ? e : { ...e, [field]: value }
              ),
            }
      )
    );
  }

  function addEntry(dayIndex: number) {
    setDays((prev) =>
      prev.map((day, i) =>
        i === dayIndex
          ? { ...day, entries: [...day.entries, { in: "", out: "" }] }
          : day
      )
    );
  }

  function removeEntry(dayIndex: number, entryIndex: number) {
    setDays((prev) =>
      prev.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              entries: day.entries.filter((_, e) => e !== entryIndex),
            }
          : day
      )
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold">
          Horarios · Planilla mensual
        </h1>
        <button className="text-sm text-slate-300 hover:text-white transition">
          Cerrar sesión
        </button>
      </header>

      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* Selector mes */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <label className="block text-sm text-slate-400 mb-2">
            Mes de trabajo
          </label>
          <input
            type="month"
            defaultValue="2026-01"
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Tabla */}
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <div className="hidden md:grid grid-cols-[140px_1fr_1fr_140px] bg-slate-800 text-slate-300 text-sm font-medium px-4 py-3">
            <div>Fecha</div>
            <div>Ingreso</div>
            <div>Salida</div>
            <div className="text-center">Acciones</div>
          </div>

          <div className="divide-y divide-slate-800">
            {days.map((day, dayIndex) => {
              const hasErrors = day.entries.some(isInvalid);

              return (
                <motion.div
                  key={day.date}
                  layout
                  className={`px-4 py-4 transition-colors ${
                    hasErrors
                      ? "bg-red-950/20 border-l-4 border-red-500"
                      : "bg-slate-900/40"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_1fr_140px] gap-4 items-start">
                    {/* Fecha */}
                    <div className="text-sm font-medium pt-2">
                      {day.date}
                    </div>

                    {/* Ingreso */}
                    <div className="space-y-2">
                      {day.entries.map((entry, entryIndex) => (
                        <input
                          key={`in-${entryIndex}`}
                          type="time"
                          value={entry.in}
                          onChange={(e) =>
                            updateEntry(
                              dayIndex,
                              entryIndex,
                              "in",
                              e.target.value
                            )
                          }
                          className={`w-full h-11 rounded-md bg-slate-950 px-3 text-sm border transition focus:outline-none focus:ring-2 ${
                            isInvalid(entry)
                              ? "border-red-500 focus:ring-red-500"
                              : "border-slate-600 focus:ring-emerald-500"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Salida */}
                    <div className="space-y-2">
                      {day.entries.map((entry, entryIndex) => (
                        <input
                          key={`out-${entryIndex}`}
                          type="time"
                          value={entry.out}
                          onChange={(e) =>
                            updateEntry(
                              dayIndex,
                              entryIndex,
                              "out",
                              e.target.value
                            )
                          }
                          className={`w-full h-11 rounded-md bg-slate-950 px-3 text-sm border transition focus:outline-none focus:ring-2 ${
                            isInvalid(entry)
                              ? "border-red-500 focus:ring-red-500"
                              : "border-slate-600 focus:ring-emerald-500"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Acciones */}
                    <div className="flex md:flex-col gap-2 justify-start md:justify-center">
                      <button
                        onClick={() => addEntry(dayIndex)}
                        className="h-11 w-11 rounded-md bg-emerald-600 hover:bg-emerald-500 transition text-lg"
                      >
                        +
                      </button>

                      <AnimatePresence>
                        {day.entries.length > 1 && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() =>
                              removeEntry(dayIndex, day.entries.length - 1)
                            }
                            className="h-11 w-11 rounded-md bg-red-600 hover:bg-red-500 transition text-lg"
                          >
                            −
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Error */}
                  {hasErrors && (
                    <p className="mt-3 text-xs text-red-400">
                      ⚠ Día incompleto o con horarios inválidos (entrada ≥
                      salida)
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
