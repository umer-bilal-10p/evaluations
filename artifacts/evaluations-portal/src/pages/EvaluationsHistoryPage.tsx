import { useState, useEffect } from "react";
import { PortalHeader } from "@/components/PortalHeader";

type EvalStatus = "Pending" | "In Progress" | "Completed" | "On Hold";

interface EvaluationUnit {
  id: string;
  dateReceived: string;
  icSerialNumber: string;
  manufacturer: string;
  kva: number;
  warehouse: string;
  status: EvalStatus;
}

const ALL_UNITS: EvaluationUnit[] = [
  { id: "1",  dateReceived: "2024-11-15", icSerialNumber: "IC-2024-001", manufacturer: "ABB",     kva: 500,  warehouse: "Houston, TX",  status: "Pending"     },
  { id: "2",  dateReceived: "2024-12-03", icSerialNumber: "TF-8842-B",   manufacturer: "Siemens", kva: 1000, warehouse: "Dallas, TX",    status: "In Progress" },
  { id: "3",  dateReceived: "2025-01-08", icSerialNumber: "TF-9901-C",   manufacturer: "GE",      kva: 750,  warehouse: "Atlanta, GA",   status: "Pending"     },
  { id: "4",  dateReceived: "2025-01-22", icSerialNumber: "TF-1045-A",   manufacturer: "Eaton",   kva: 250,  warehouse: "Phoenix, AZ",   status: "On Hold"     },
  { id: "5",  dateReceived: "2025-02-14", icSerialNumber: "IC-2025-008", manufacturer: "ABB",     kva: 1500, warehouse: "Houston, TX",   status: "Pending"     },
  { id: "6",  dateReceived: "2025-03-01", icSerialNumber: "TF-3371-D",   manufacturer: "Siemens", kva: 2000, warehouse: "Denver, CO",    status: "Pending"     },
  { id: "7",  dateReceived: "2025-03-18", icSerialNumber: "TF-5509-E",   manufacturer: "ABB",     kva: 500,  warehouse: "Dallas, TX",    status: "In Progress" },
  { id: "8",  dateReceived: "2025-04-02", icSerialNumber: "IC-2025-044", manufacturer: "GE",      kva: 1000, warehouse: "Houston, TX",   status: "Pending"     },
  { id: "9",  dateReceived: "2025-04-19", icSerialNumber: "TF-7723-F",   manufacturer: "Eaton",   kva: 3000, warehouse: "Atlanta, GA",   status: "On Hold"     },
  { id: "10", dateReceived: "2025-05-07", icSerialNumber: "TF-8831-G",   manufacturer: "Siemens", kva: 750,  warehouse: "Phoenix, AZ",   status: "Pending"     },
];

const ROW_INTERVAL_MS = 900;

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[Number(month) - 1]} ${Number(day)}, ${year}`;
}

const STATUS_STYLES: Record<EvalStatus, { bg: string; color: string; dot: string }> = {
  "Pending":     { bg: "rgba(251,191,36,0.12)",  color: "#d97706", dot: "#f59e0b" },
  "In Progress": { bg: "rgba(59,130,246,0.12)",   color: "#3b82f6", dot: "#60a5fa" },
  "Completed":   { bg: "rgba(34,197,94,0.12)",    color: "#16a34a", dot: "#22c55e" },
  "On Hold":     { bg: "rgba(239,68,68,0.12)",    color: "#dc2626", dot: "#f87171" },
};

function StatusBadge({ status }: { status: EvalStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      <span
        className="inline-block rounded-full"
        style={{ width: 6, height: 6, background: s.dot, flexShrink: 0 }}
      />
      {status}
    </span>
  );
}

export default function EvaluationsHistoryPage() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isPopulating, setIsPopulating] = useState(false);

  useEffect(() => {
    setVisibleCount(0);
    setIsPopulating(false);
    const startDelay = setTimeout(() => {
      setIsPopulating(true);
    }, 1200);
    return () => clearTimeout(startDelay);
  }, []);

  useEffect(() => {
    if (!isPopulating) return;
    if (visibleCount >= ALL_UNITS.length) return;

    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, ROW_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [isPopulating, visibleCount]);

  const visibleRows = ALL_UNITS.slice(0, visibleCount);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}
    >
      <PortalHeader pageName="Evaluations" />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          {/* Card header */}
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: "1px solid hsl(var(--border))" }}
          >
            <div>
              <h1
                className="text-xl font-semibold"
                style={{ color: "hsl(var(--foreground))" }}
              >
                Units for Evaluation
              </h1>
              <p
                className="mt-0.5 text-sm"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Transformer units awaiting evaluation, sorted oldest to newest
              </p>
            </div>

            {/* Live count badge */}
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
              style={{
                background: visibleCount > 0 ? "rgba(59,130,246,0.10)" : "hsl(var(--muted))",
                color: visibleCount > 0 ? "#3b82f6" : "hsl(var(--muted-foreground))",
              }}
            >
              {isPopulating && visibleCount < ALL_UNITS.length && (
                <span
                  className="inline-block rounded-full animate-pulse"
                  style={{ width: 7, height: 7, background: "#3b82f6", flexShrink: 0 }}
                />
              )}
              {visibleCount} unit{visibleCount !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
            {visibleCount === 0 ? (
              <EmptyState isLoading={!isPopulating} />
            ) : (
              <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                    {[
                      "Date Received",
                      "IC / Serial Number",
                      "Manufacturer",
                      "KVA",
                      "Warehouse",
                      "Status",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap" }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((unit, idx) => (
                    <tr
                      key={unit.id}
                      className="transition-all duration-500"
                      style={{
                        borderBottom: idx < visibleRows.length - 1 ? "1px solid hsl(var(--border))" : undefined,
                        opacity: 1,
                        animation: "fadeSlideIn 0.4s ease-out",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = "hsl(var(--muted) / 40%)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                      }}
                    >
                      <td className="px-5 py-4" style={{ color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap" }}>
                        {formatDate(unit.dateReceived)}
                      </td>
                      <td className="px-5 py-4 font-mono font-medium" style={{ color: "hsl(var(--foreground))", whiteSpace: "nowrap" }}>
                        {unit.icSerialNumber}
                      </td>
                      <td className="px-5 py-4" style={{ color: "hsl(var(--foreground))" }}>
                        {unit.manufacturer}
                      </td>
                      <td className="px-5 py-4 font-medium" style={{ color: "hsl(var(--foreground))" }}>
                        {unit.kva.toLocaleString()} kVA
                      </td>
                      <td className="px-5 py-4" style={{ color: "hsl(var(--foreground))" }}>
                        {unit.warehouse}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={unit.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function EmptyState({ isLoading }: { isLoading: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
      style={{ minHeight: 280 }}
    >
      {isLoading ? (
        <>
          <div
            className="rounded-full flex items-center justify-center mb-4"
            style={{ width: 48, height: 48, background: "hsl(var(--muted))" }}
          >
            <svg
              className="animate-spin"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 14 }}>Loading units…</p>
        </>
      ) : (
        <>
          <div
            className="rounded-full flex items-center justify-center mb-4"
            style={{ width: 52, height: 52, background: "hsl(var(--muted))" }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <p
            className="font-medium mb-1"
            style={{ color: "hsl(var(--foreground))", fontSize: 15 }}
          >
            No units currently awaiting evaluation.
          </p>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>
            Units will appear here as they are received for evaluation.
          </p>
        </>
      )}
    </div>
  );
}
