/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const buildMonth = (year: number, month: number) => {
  const days = [];
  const date = new Date(year, month, 1);

  while (date.getMonth() === month) {
    days.push({
      date: date.toISOString().slice(0, 10),
      intervals: [{ in: "", out: "" }],
    });
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const isValidInterval = (i: { in: number; out: number; }) =>
  i.in && i.out && i.in < i.out;

const dayStatus = (day: { date?: string; intervals: any; }) => {
  const filled = day.intervals.filter((i: { in: any; out: any; }) => i.in || i.out);
  if (filled.length === 0) return "empty";
  if (filled.every(isValidInterval)) return "ok";
  return "error";
};

export default function MonthlyTimesheet() {
  const [month, setMonth] = useState("2026-01");
  const [days, setDays] = useState(() => buildMonth(2026, 0));

  const monthLabel = useMemo(() => {
    const d = new Date(`${month}-01`);
    return d.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
  }, [month]);

  const updateInterval = (dIdx: number, iIdx: number, field: string, value: string) => {
    setDays(ds =>
      ds.map((d, di) =>
        di === dIdx
          ? {
              ...d,
              intervals: d.intervals.map((i, ii) =>
                ii === iIdx ? { ...i, [field]: value } : i
              ),
            }
          : d
      )
    );
  };

  const addInterval = (dIdx: number) => {
    setDays(ds =>
      ds.map((d, i) =>
        i === dIdx
          ? { ...d, intervals: [...d.intervals, { in: "", out: "" }] }
          : d
      )
    );
  };

  const removeInterval = (dIdx: number, iIdx: number) => {
    setDays(ds =>
      ds.map((d, i) =>
        i === dIdx
          ? {
              ...d,
              intervals: d.intervals.filter((_, ii) => ii !== iIdx),
            }
          : d
      )
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-black via-slate-900 to-black text-white p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg md:text-xl font-semibold">
          Horarios · Planilla mensual
        </h1>
        <button className="text-sm text-sky-400 hover:underline">
          Cerrar sesión
        </button>
      </div>

      <div className="bg-slate-900/70 rounded-xl p-4 mb-6">
        <label className="block text-sm text-slate-400 mb-1">
          Mes de trabajo
        </label>
        <input
          type="month"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            const d = new Date(`${e.target.value}-01`);
            setDays(buildMonth(d.getFullYear(), d.getMonth()));
          }}
          className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2"
        />
        <div className="mt-1 text-sm capitalize text-slate-300">
          {monthLabel}
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {days.map((day, dIdx) => {
            const status = dayStatus(day);

            return (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className={`rounded-xl border p-4 ${
                  status === "error"
                    ? "border-red-600 bg-red-950/40"
                    : "border-slate-800 bg-slate-900/60"
                }`}
              >
                <div className="font-medium mb-3">{day.date}</div>

                <AnimatePresence>
                  {day.intervals.map((interval, iIdx) => (
                    <motion.div
                      key={iIdx}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mb-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                        <input
                          type="time"
                          value={interval.in}
                          onChange={(e) =>
                            updateInterval(dIdx, iIdx, "in", e.target.value)
                          }
                          className="w-full text-base md:text-lg bg-slate-800 border border-slate-700 rounded-md px-3 py-2"
                        />
                        <input
                          type="time"
                          value={interval.out}
                          onChange={(e) =>
                            updateInterval(dIdx, iIdx, "out", e.target.value)
                          }
                          className="w-full text-base md:text-lg bg-slate-800 border border-slate-700 rounded-md px-3 py-2"
                        />

                        <button
                          onClick={() => removeInterval(dIdx, iIdx)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md"
                        >
                          −
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <button
                  onClick={() => addInterval(dIdx)}
                  className="mt-1 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-sm"
                >
                  +
                  <span>Agregar horario</span>
                </button>

                {status === "error" && (
                  <div className="mt-2 text-sm text-red-400">
                    ⚠ Día incompleto o con horarios inválidos
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
