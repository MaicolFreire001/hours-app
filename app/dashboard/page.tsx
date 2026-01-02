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

    if (res.status === 401 && data.needLogin) {
      alert("Tu sesión expiró. Iniciá sesión nuevamente.");
      logout();
      return;
    }

    if (data.newTokens) {
      const updatedTokens = {
        ...tokens,
        ...data.newTokens,
      };
      localStorage.setItem("googleTokens", JSON.stringify(updatedTokens));
    }

    if (data.url) {
      setSheetUrl(data.url);
      alert("Planilla creada correctamente!");
    } else if (data.error) {
      alert("Error: " + data.error);
    } else {
      alert("Error al generar la planilla");
    }

  } catch (err) {
    console.error(err);
    alert("Error de red");
  } finally {
    setLoading(false);
  }
};

  if (!isLoggedIn)
    return <p className="p-4">Debes iniciar sesión para usar esta página.</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Generar planilla de horarios
      </h1>

      <div className="mb-4">
        <label className="mr-2 font-semibold">Mes:</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border px-2 py-1 rounded"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="table-auto border-collapse border w-full">
          <thead>
            <tr>
              <th className="border px-2 py-1">Fecha</th>
              <th className="border px-2 py-1">Hora de ingreso</th>
              <th className="border px-2 py-1">Hora de salida</th>
              <th className="border px-2 py-1">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day, dayIndex) =>
              day.intervals.map((interval, intervalIndex) => (
                <tr key={`${day.date}-${intervalIndex}`}>
                  {intervalIndex === 0 && (
                    <td
                      className="border px-2 py-1"
                      rowSpan={day.intervals.length}
                    >
                      {day.date}
                    </td>
                  )}
                  <td className="border px-2 py-1">
                    <input
                      type="time"
                      value={interval.in}
                      onChange={(e) =>
                        updateInterval(
                          dayIndex,
                          intervalIndex,
                          "in",
                          e.target.value
                        )
                      }
                      className="border px-1 py-1 rounded w-full"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="time"
                      value={interval.out}
                      onChange={(e) =>
                        updateInterval(
                          dayIndex,
                          intervalIndex,
                          "out",
                          e.target.value
                        )
                      }
                      className="border px-1 py-1 rounded w-full"
                    />
                  </td>
                  <td className="border px-2 py-1 flex gap-1">
                    <button
                      onClick={() => addInterval(dayIndex)}
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      +
                    </button>
                    {day.intervals.length > 1 && (
                      <button
                        onClick={() =>
                          removeInterval(dayIndex, intervalIndex)
                        }
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        -
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={generateSheet}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Generando..." : "Generar planilla"}
        </button>

        {sheetUrl && (
          <a
            href={sheetUrl}
            target="_blank"
            className="text-blue-700 underline"
            rel="noreferrer"
          >
            Abrir planilla
          </a>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={logout}
          className="bg-gray-600 text-white px-4 py-2 rounded"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
