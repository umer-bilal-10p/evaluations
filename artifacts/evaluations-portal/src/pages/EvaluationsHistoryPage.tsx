import { useState, useEffect, useRef, useCallback } from "react";
import { PortalHeader } from "@/components/PortalHeader";
import { Sidebar } from "@/components/Sidebar";

type EvalStatus = "Pending" | "In Progress" | "Completed" | "On Hold";

type TransformerType = "Three-Phase Pad" | "Single-Phase Pad" | "Pole Mount";
const ALL_TYPES: TransformerType[] = ["Three-Phase Pad", "Single-Phase Pad", "Pole Mount"];

interface EvaluationUnit {
  id: string;
  dateReceived: string;
  icSerialNumber: string;
  manufacturer: string;
  transformerType: TransformerType;
  kva: number;
  warehouse: string;
  status: EvalStatus;
}

const SEED_UNITS: EvaluationUnit[] = [
  { id: "1",  dateReceived: "2024-11-15", icSerialNumber: "IC-2024-001", manufacturer: "ABB",     transformerType: "Three-Phase Pad", kva: 500,  warehouse: "99 - Houston, TX", status: "Completed" },
  { id: "2",  dateReceived: "2024-12-03", icSerialNumber: "TF-8842-B",   manufacturer: "Siemens", transformerType: "Three-Phase Pad", kva: 1000, warehouse: "12 - Dallas, TX",  status: "Completed" },
  { id: "3",  dateReceived: "2025-01-08", icSerialNumber: "TF-9901-C",   manufacturer: "GE",      transformerType: "Three-Phase Pad", kva: 750,  warehouse: "07 - Atlanta, GA", status: "Completed" },
  { id: "4",  dateReceived: "2025-01-22", icSerialNumber: "TF-1045-A",   manufacturer: "Eaton",   transformerType: "Three-Phase Pad", kva: 250,  warehouse: "34 - Phoenix, AZ", status: "Completed" },
  { id: "5",  dateReceived: "2025-02-14", icSerialNumber: "IC-2025-008", manufacturer: "ABB",     transformerType: "Three-Phase Pad", kva: 1500, warehouse: "99 - Houston, TX", status: "Completed" },
  { id: "6",  dateReceived: "2025-03-01", icSerialNumber: "TF-3371-D",   manufacturer: "Siemens", transformerType: "Three-Phase Pad", kva: 2000, warehouse: "22 - Denver, CO",  status: "Completed" },
  { id: "7",  dateReceived: "2025-03-18", icSerialNumber: "TF-5509-E",   manufacturer: "ABB",     transformerType: "Three-Phase Pad", kva: 500,  warehouse: "12 - Dallas, TX",  status: "Completed" },
  { id: "8",  dateReceived: "2025-04-02", icSerialNumber: "IC-2025-044", manufacturer: "GE",      transformerType: "Three-Phase Pad", kva: 1000, warehouse: "99 - Houston, TX", status: "Completed" },
  { id: "9",  dateReceived: "2025-04-19", icSerialNumber: "TF-7723-F",   manufacturer: "Eaton",   transformerType: "Three-Phase Pad", kva: 3000, warehouse: "07 - Atlanta, GA", status: "Completed" },
  { id: "10", dateReceived: "2025-05-07", icSerialNumber: "TF-8831-G",   manufacturer: "Siemens", transformerType: "Three-Phase Pad", kva: 750,  warehouse: "34 - Phoenix, AZ", status: "Completed" },
];

const ROW_INTERVAL_MS = 900;
const ALL_STATUSES: EvalStatus[] = ["Pending", "In Progress", "Completed", "On Hold"];

const MANUFACTURERS = [...new Set(SEED_UNITS.map((u) => u.manufacturer))].sort();
const WAREHOUSES    = [...new Set(SEED_UNITS.map((u) => u.warehouse))].sort();
const KVA_VALUES    = [...new Set(SEED_UNITS.map((u) => u.kva))].sort((a, b) => a - b);

type Filters = {
  icSerialNumber: string;
  manufacturer: string;
  kva: string;
  warehouse: string;
  status: string;
};

const EMPTY_FILTERS: Filters = {
  icSerialNumber: "",
  manufacturer: "",
  kva: "",
  warehouse: "",
  status: "",
};

function countActiveFilters(f: Filters): number {
  return Object.values(f).filter((v) => v !== "").length;
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[Number(month) - 1]} ${Number(day)}, ${year}`;
}

const STATUS_STYLES: Record<EvalStatus, { bg: string; color: string; borderColor: string }> = {
  "Pending":     { bg: "rgba(251,191,36,0.10)",  color: "#d97706", borderColor: "rgba(251,191,36,0.25)" },
  "In Progress": { bg: "rgba(59,130,246,0.10)",   color: "#3b82f6", borderColor: "rgba(59,130,246,0.25)" },
  "Completed":   { bg: "rgba(34,197,94,0.10)",    color: "#16a34a", borderColor: "rgba(34,197,94,0.25)"  },
  "On Hold":     { bg: "rgba(239,68,68,0.10)",    color: "#dc2626", borderColor: "rgba(239,68,68,0.25)"  },
};

function StatusIcon({ status }: { status: EvalStatus }) {
  const p = { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (status === "Completed")   return <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
  if (status === "In Progress") return <svg {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.04-6.5"/></svg>;
  if (status === "On Hold")     return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

function StatusBadge({ status, onClick }: { status: EvalStatus; onClick: (e: React.MouseEvent) => void }) {
  const s = STATUS_STYLES[status];
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.borderColor}`, cursor: "pointer" }} title="Click to change status">
      <StatusIcon status={status} />{status}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

function StatusDropdown({ current, onSelect, onClose }: { current: EvalStatus; onSelect: (s: EvalStatus) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} style={{ position: "absolute", zIndex: 200, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", minWidth: 160, overflow: "hidden", marginTop: 4 }}>
      {ALL_STATUSES.map((s) => {
        const st = STATUS_STYLES[s];
        return (
          <button key={s} onClick={() => { onSelect(s); onClose(); }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: s === current ? st.bg : "transparent", border: "none", cursor: "pointer", textAlign: "left", color: s === current ? st.color : "hsl(var(--foreground))", fontSize: 13, fontWeight: s === current ? 600 : 400, transition: "background 0.1s" }}
            onMouseEnter={(e) => { if (s !== current) (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--muted))"; }}
            onMouseLeave={(e) => { if (s !== current) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
            <span style={{ color: st.color }}><StatusIcon status={s} /></span>{s}
            {s === current && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: "auto", color: st.color }}><polyline points="20 6 9 17 4 12" /></svg>}
          </button>
        );
      })}
    </div>
  );
}

function CommentModal({ unitId, icNumber, onClose }: { unitId: string; icNumber: string; onClose: () => void }) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = () => { if (!text.trim()) return; setSubmitted(true); setTimeout(onClose, 1200); };
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 14, width: "100%", maxWidth: 440, margin: "0 16px", padding: 24, boxShadow: "0 20px 48px rgba(0,0,0,0.25)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "hsl(var(--foreground))" }}>Add Comment</h2>
            <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>Unit: {icNumber}</p>
          </div>
          <button onClick={onClose} style={{ color: "hsl(var(--muted-foreground))", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        {submitted ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "hsl(var(--foreground))" }}>Comment saved</p>
          </div>
        ) : (
          <>
            <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Add your notes about this evaluation unit…" rows={4}
              style={{ width: "100%", resize: "none", padding: "10px 12px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))", fontSize: 14, outline: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={onClose} style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "transparent", color: "hsl(var(--muted-foreground))", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSubmit} disabled={!text.trim()} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: text.trim() ? "#182557" : "hsl(var(--muted))", color: text.trim() ? "#fff" : "hsl(var(--muted-foreground))", fontSize: 13, fontWeight: 600, cursor: text.trim() ? "pointer" : "default", transition: "background 0.15s" }}>Save Comment</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Shared filter field styles ────────────────────────────────────────────── */
const FIELD: React.CSSProperties = {
  width: "100%",
  height: 34,
  fontSize: 13,
  fontWeight: 400,
  padding: "0 10px",
  borderRadius: 7,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--background))",
  color: "hsl(var(--foreground))",
  outline: "none",
  boxSizing: "border-box",
  lineHeight: "34px",
};

const SELECT_ARROW = `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")`;

const SELECT: React.CSSProperties = {
  ...FIELD,
  appearance: "none",
  cursor: "pointer",
  backgroundImage: SELECT_ARROW,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 9px center",
  paddingRight: 28,
};

function FInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={FIELD} />;
}

function FSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={SELECT}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function EvaluationsHistoryPage() {
  const [visibleCount, setVisibleCount]     = useState(0);
  const [started, setStarted]               = useState(false);
  const [statuses, setStatuses]             = useState<Record<string, EvalStatus>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [commentUnitId, setCommentUnitId]   = useState<string | null>(null);
  const [refreshKey, setRefreshKey]         = useState(0);
  const [spinning, setSpinning]             = useState(false);
  /* Filters visible by default */
  const [showFilters, setShowFilters]       = useState(true);
  const [filters, setFilters]               = useState<Filters>(EMPTY_FILTERS);

  const startPopulation = useCallback(() => {
    setVisibleCount(0);
    setStarted(false);
    const t = setTimeout(() => setStarted(true), 1200);
    return t;
  }, []);

  useEffect(() => {
    const t = startPopulation();
    return () => clearTimeout(t);
  }, [refreshKey, startPopulation]);

  useEffect(() => {
    if (!started || visibleCount >= SEED_UNITS.length) return;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), ROW_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [started, visibleCount]);

  const handleRefresh = () => {
    setSpinning(true);
    setStatuses({});
    setOpenDropdownId(null);
    setFilters(EMPTY_FILTERS);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setSpinning(false), 800);
  };

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const visibleRows = SEED_UNITS.slice(0, visibleCount);

  const filteredRows = visibleRows.filter((unit) => {
    const status: EvalStatus = statuses[unit.id] ?? unit.status;
    return (
      (!filters.icSerialNumber|| unit.icSerialNumber.toLowerCase().includes(filters.icSerialNumber.toLowerCase())) &&
      (!filters.manufacturer  || unit.manufacturer === filters.manufacturer) &&
      (!filters.kva           || unit.kva === Number(filters.kva)) &&
      (!filters.warehouse     || unit.warehouse === filters.warehouse) &&
      (!filters.status        || status === filters.status)
    );
  });

  const activeFilterCount = countActiveFilters(filters);
  const commentUnit = SEED_UNITS.find((u) => u.id === commentUnitId);

  /* Sticky header offsets */
  const COL_HEADER_H = 41;
  const FILTER_ROW_H = 58;

  const thBase: React.CSSProperties = {
    color: "hsl(var(--muted-foreground))",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    background: "hsl(var(--card))",
    zIndex: 10,
    borderBottom: showFilters ? "none" : "1px solid hsl(var(--border))",
    padding: "10px 20px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  };

  const filterTh: React.CSSProperties = {
    position: "sticky",
    top: COL_HEADER_H,
    background: "hsl(var(--card))",
    zIndex: 9,
    padding: "6px 12px 10px",
    borderBottom: "1px solid hsl(var(--border))",
    verticalAlign: "top",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
      <PortalHeader />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="rounded-xl overflow-hidden flex flex-col"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", height: `calc(100vh - ${showFilters ? 136 : 136}px)` }}>

            {/* ── Card header ── */}
            <div className="flex items-center justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>Evaluation History</h1>
                <p className="mt-0.5 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Transformer units received for evaluation, sorted oldest to newest</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Filter toggle */}
                <button onClick={() => { setShowFilters((v) => !v); if (showFilters) setFilters(EMPTY_FILTERS); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: showFilters ? "1px solid #5b9cf6" : "1px solid hsl(var(--border))", background: showFilters ? "rgba(91,156,246,0.10)" : "transparent", color: showFilters ? "#5b9cf6" : "hsl(var(--foreground))", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { if (!showFilters) (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--muted))"; }}
                  onMouseLeave={(e) => { if (!showFilters) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  Filters
                  {activeFilterCount > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "#5b9cf6", color: "#fff", fontSize: 10, fontWeight: 700 }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {/* Refresh */}
                <button onClick={handleRefresh} title="Refresh"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "transparent", color: "hsl(var(--foreground))", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--muted))"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: "transform 0.6s ease", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}>
                    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-.04-6.5" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* ── Table ── */}
            <div className="flex-1 overflow-auto" style={{ position: "relative" }}>
              {visibleCount === 0 ? <EmptyState /> : (
                <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    {/* Column labels */}
                    <tr>
                      {["Date Received","IC / Serial Number","Manufacturer","Type","KVA","Warehouse","Status",""].map((col, i) => (
                        <th key={i} style={thBase}>{col}</th>
                      ))}
                    </tr>

                    {/* Filter row */}
                    {showFilters && (
                      <tr>
                        {/* Date Received — no filter */}
                        <th style={{ ...filterTh, minWidth: 140 }} />
                        {/* IC search */}
                        <th style={{ ...filterTh, minWidth: 150 }}>
                          <FInput value={filters.icSerialNumber} onChange={(v) => setFilter("icSerialNumber", v)} placeholder="Search serial…" />
                        </th>
                        {/* Manufacturer */}
                        <th style={{ ...filterTh, minWidth: 130 }}>
                          <FSelect value={filters.manufacturer} onChange={(v) => setFilter("manufacturer", v)} options={MANUFACTURERS} placeholder="All" />
                        </th>
                        {/* Type — locked */}
                        <th style={{ ...filterTh, minWidth: 150 }}>
                          <select disabled style={{ ...SELECT, opacity: 0.5, cursor: "not-allowed" }}>
                            <option>Three-Phase Pad</option>
                            {ALL_TYPES.map((t) => <option key={t}>{t}</option>)}
                          </select>
                        </th>
                        {/* KVA */}
                        <th style={{ ...filterTh, minWidth: 110 }}>
                          <FSelect value={filters.kva} onChange={(v) => setFilter("kva", v)} options={KVA_VALUES.map(String)} placeholder="All" />
                        </th>
                        {/* Warehouse */}
                        <th style={{ ...filterTh, minWidth: 170 }}>
                          <FSelect value={filters.warehouse} onChange={(v) => setFilter("warehouse", v)} options={WAREHOUSES} placeholder="All" />
                        </th>
                        {/* Status */}
                        <th style={{ ...filterTh, minWidth: 170 }}>
                          <FSelect value={filters.status} onChange={(v) => setFilter("status", v)} options={ALL_STATUSES} placeholder="All" />
                        </th>
                        {/* Clear all */}
                        <th style={{ ...filterTh, verticalAlign: "middle" }}>
                          {activeFilterCount > 0 && (
                            <button onClick={() => setFilters(EMPTY_FILTERS)}
                              style={{ fontSize: 12, color: "#5b9cf6", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap", padding: 0, fontWeight: 500 }}>
                              Clear all
                            </button>
                          )}
                        </th>
                      </tr>
                    )}
                  </thead>

                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr><td colSpan={8}>
                        <div className="flex flex-col items-center justify-center py-14 text-center">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 10, opacity: 0.5 }}>
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                          </svg>
                          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>No results match the active filters.</p>
                          <button onClick={() => setFilters(EMPTY_FILTERS)} style={{ marginTop: 8, fontSize: 12, color: "#5b9cf6", background: "none", border: "none", cursor: "pointer" }}>Clear filters</button>
                        </div>
                      </td></tr>
                    ) : filteredRows.map((unit, idx) => {
                      const status: EvalStatus = statuses[unit.id] ?? unit.status;
                      const isDropdownOpen = openDropdownId === unit.id;
                      return (
                        <tr key={unit.id}
                          style={{ borderBottom: idx < filteredRows.length - 1 ? "1px solid hsl(var(--border))" : undefined, animation: "fadeSlideIn 0.4s ease-out" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "hsl(var(--muted) / 0.4)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                          <td className="px-5 py-3.5" style={{ color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap" }}>{formatDate(unit.dateReceived)}</td>
                          <td className="px-5 py-3.5 font-mono font-medium" style={{ color: "hsl(var(--foreground))", whiteSpace: "nowrap" }}>{unit.icSerialNumber}</td>
                          <td className="px-5 py-3.5" style={{ color: "hsl(var(--foreground))" }}>{unit.manufacturer}</td>
                          <td className="px-5 py-3.5">
                            <select disabled value={unit.transformerType}
                              style={{ ...SELECT, height: 30, fontSize: 13, opacity: 0.55, cursor: "not-allowed", width: "auto", minWidth: 140, paddingRight: 28 }}
                              onChange={() => {}}>
                              {ALL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td className="px-5 py-3.5 font-medium" style={{ color: "hsl(var(--foreground))" }}>{unit.kva.toLocaleString()} kVA</td>
                          <td className="px-5 py-3.5" style={{ color: "hsl(var(--foreground))", whiteSpace: "nowrap" }}>{unit.warehouse}</td>
                          <td className="px-5 py-3.5" style={{ position: "relative" }}>
                            <div className="flex items-center gap-2">
                              <div style={{ position: "relative" }}>
                                <StatusBadge status={status} onClick={(e) => { e.stopPropagation(); setOpenDropdownId(isDropdownOpen ? null : unit.id); }} />
                                {isDropdownOpen && <StatusDropdown current={status} onSelect={(s) => setStatuses((prev) => ({ ...prev, [unit.id]: s }))} onClose={() => setOpenDropdownId(null)} />}
                              </div>
                              <button onClick={() => setCommentUnitId(unit.id)} title="Add comment"
                                style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid hsl(var(--border))", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "hsl(var(--muted-foreground))", transition: "color 0.15s, background 0.15s", flexShrink: 0 }}
                                onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "hsl(var(--foreground))"; b.style.background = "hsl(var(--muted))"; }}
                                onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "hsl(var(--muted-foreground))"; b.style.background = "transparent"; }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-3.5" />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {commentUnitId && commentUnit && (
        <CommentModal unitId={commentUnitId} icNumber={commentUnit.icSerialNumber} onClose={() => setCommentUnitId(null)} />
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center" style={{ minHeight: 280 }}>
      <div className="rounded-full flex items-center justify-center mb-4" style={{ width: 52, height: 52, background: "hsl(var(--muted))" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      </div>
      <p className="font-medium mb-1" style={{ color: "hsl(var(--foreground))", fontSize: 15 }}>No units currently awaiting evaluation.</p>
      <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>Units will appear here as they are received for evaluation.</p>
    </div>
  );
}
