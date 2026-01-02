"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

type Interval = { in: string; out: string };
type DayEntry = { date: string; intervals: Interval[] };

export default function DashboardPage() {
  const { tokens, isLoggedIn, logout } = useAuth();

  const [month, setMonth] = useState<string>("");

  useEffect(() => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    setMonth(currentMonth);
  }, []);

  const [days, setDays] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!month) return;

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
    setDays(prev => {
      const copy = structuredClone(prev);
      copy[dayIndex].intervals.push({ in: "", out: "" });
      return copy;
    });
  };

  const removeInterval = (dayIndex: number, intervalIndex: number) => {
    setDays(prev => {
      const copy = structuredClone(prev);
      copy[dayIndex].intervals.splice(intervalIndex, 1);
      return copy;
    });
  };

  const updateInterval = (
    dayIndex: number,
    intervalIndex: number,
    field: "in" | "out",
    value: string
  ) => {
    setDays(prev => {
      const copy = structuredClone(prev);
      copy[dayIndex].intervals[intervalIndex][field] = value;
      return copy;
    });
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

      if (res.status === 401 && data.needLogin) {
        alert("Tu sesión expiró. Iniciá sesión nuevamente.");
        logout();
        return;
      }

      if (data.newTokens) {
        const updatedTokens = { ...tokens, ...data.newTokens };
        localStorage.setItem("googleTokens", JSON.stringify(updatedTokens));
      }

      if (data.url) {
        setSheetUrl(data.url);
      } else {
        alert(data.error || "Error al generar la planilla");
      }
    } catch (err) {
      console.error(err);
      alert("Error de red");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Debes iniciar sesión para usar esta página.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Horarios · Planilla mensual</h1>
          <button
            onClick={logout}
            className="text-sm text-gray-600 hover:text-red-600"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Mes de trabajo</h2>
            <p className="text-sm text-gray-500">Seleccioná el mes a cargar</p>
          </div>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </section>

        <section className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2">Ingreso</th>
                  <th className="px-3 py-2">Salida</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day, dayIndex) =>
                  day.intervals.map((interval, intervalIndex) => (
                    <tr
                      key={`${day.date}-${intervalIndex}`}
                      className="border-t hover:bg-gray-50"
                    >
                      {intervalIndex === 0 && (
                        <td
                          rowSpan={day.intervals.length}
                          className="px-3 py-2 font-medium whitespace-nowrap"
                        >
                          {day.date}
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <input
                          type="time"
                          value={interval.in}
                          onChange={e =>
                            updateInterval(
                              dayIndex,
                              intervalIndex,
                              "in",
                              e.target.value
                            )
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="time"
                          value={interval.out}
                          onChange={e =>
                            updateInterval(
                              dayIndex,
                              intervalIndex,
                              "out",
                              e.target.value
                            )
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => addInterval(dayIndex)}
                            className="px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            +
                          </button>
                          {day.intervals.length > 1 && (
                            <button
                              onClick={() =>
                                removeInterval(dayIndex, intervalIndex)
                              }
                              className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                            >
                              −
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={generateSheet}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? "Generando…" : "Generar planilla"}
          </button>

          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-700 underline"
            >
              Abrir planilla en Google Sheets
            </a>
          )}
        </section>
      </main>
    </div>
  );
}
