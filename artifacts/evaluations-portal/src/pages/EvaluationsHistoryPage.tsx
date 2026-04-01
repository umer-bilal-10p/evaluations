import { useState, useEffect, useRef, useCallback } from "react";
import { PortalHeader } from "@/components/PortalHeader";
import { Sidebar } from "@/components/Sidebar";

/* ─── Types ──────────────────────────────────────────────────────────────────── */
type EvalStatus = "Not Started" | "In Progress" | "Completed";
type TransformerType = "Three-Phase Pad" | "Single-Phase Pad" | "Pole Mount";
type IntakeCategory = "Surplus" | "Recycle";
type IntakeTag = "Base Damage" | "NPX: Rewind" | "NPX: Repair" | "NPX: Scrap";

const ALL_STATUSES: EvalStatus[]       = ["Not Started", "In Progress", "Completed"];
const ALL_CATEGORIES: IntakeCategory[] = ["Surplus", "Recycle"];

/* ─── Column definitions ─────────────────────────────────────────────────────── */
const COL_DEFS = [
  { key: "date",        label: "Date & Time Received" },
  { key: "mfgSerial",  label: "MFG S#" },
  { key: "icNumber",   label: "IC#" },
  { key: "mfr",        label: "MFR" },
  { key: "type",       label: "Type" },
  { key: "kva",        label: "KVA" },
  { key: "intake",     label: "Intake Type" },
  { key: "load",       label: "Load #" },
  { key: "whs",        label: "WHS" },
  { key: "status",     label: "Status" },
  { key: "site",       label: "Site" },
  { key: "completedOn", label: "Completed On" },
  { key: "completedBy", label: "Completed By" },
] as const;

type ColKey = typeof COL_DEFS[number]["key"];
type ColVisibility = Record<ColKey, boolean>;

const DEFAULT_COL_VISIBILITY: ColVisibility = {
  date: true, mfgSerial: true, icNumber: true, mfr: true, type: true,
  kva: true, intake: true, load: true, whs: true, status: true,
  site: true, completedOn: true, completedBy: true,
};

/* ─── Data model ─────────────────────────────────────────────────────────────── */
interface ActiveUser { name: string; initials: string; color: string; }

interface EvaluationUnit {
  id: string;
  dateReceived: string;
  timeReceived: string;
  mfgSerial: string;
  icNumber: string;
  manufacturer: string;
  transformerType: TransformerType;
  kva: number;
  intakeCategory: IntakeCategory;
  intakeTags: IntakeTag[];
  loadNumber: number;
  warehouseNumber: number;
  warehouse: string;
  status: EvalStatus;
  completedOn: string | null;
  completedBy: string | null;
  activeUser: ActiveUser | null;
}

function siteFromWarehouse(w: string): string { return w.split(" - ")[1] ?? w; }

const SEED_UNITS: EvaluationUnit[] = [
  { id: "1",  dateReceived: "2024-07-22", timeReceived: "11:28 AM", mfgSerial: "TF-7662-M", icNumber: "185940632", manufacturer: "Siemens", transformerType: "Three-Phase Pad", kva: 1750, intakeCategory: "Surplus", intakeTags: ["Base Damage", "NPX: Rewind"],  loadNumber: 194503, warehouseNumber: 18, warehouse: "18 - Houston, TX",  status: "Not Started", completedOn: null, completedBy: null, activeUser: null },
  { id: "2",  dateReceived: "2024-08-20", timeReceived: "9:53 AM",  mfgSerial: "TF-9884-K", icNumber: "221083647", manufacturer: "GE",      transformerType: "Three-Phase Pad", kva: 250,  intakeCategory: "Recycle", intakeTags: ["NPX: Repair"],                 loadNumber: 425019, warehouseNumber: 55, warehouse: "55 - Dallas, TX",   status: "Not Started", completedOn: null, completedBy: null, activeUser: null },
  { id: "3",  dateReceived: "2024-11-05", timeReceived: "3:21 PM",  mfgSerial: "TF-5540-E", icNumber: "312048756", manufacturer: "Siemens", transformerType: "Three-Phase Pad", kva: 2000, intakeCategory: "Recycle", intakeTags: ["Base Damage", "NPX: Repair"],  loadNumber: 314087, warehouseNumber: 7,  warehouse: "07 - Atlanta, GA", status: "Not Started", completedOn: null, completedBy: null, activeUser: null },
  { id: "4",  dateReceived: "2024-11-18", timeReceived: "2:37 PM",  mfgSerial: "TF-9201-A", icNumber: "098432711", manufacturer: "ABB",     transformerType: "Three-Phase Pad", kva: 500,  intakeCategory: "Recycle", intakeTags: ["NPX: Rewind"],                 loadNumber: 203415, warehouseNumber: 12, warehouse: "12 - Dallas, TX",   status: "Not Started", completedOn: null, completedBy: null, activeUser: null },
  { id: "5",  dateReceived: "2024-07-09", timeReceived: "6:47 PM",  mfgSerial: "TF-6551-N", icNumber: "093284756", manufacturer: "ABB",     transformerType: "Three-Phase Pad", kva: 400,  intakeCategory: "Recycle", intakeTags: ["Base Damage", "NPX: Scrap"],   loadNumber: 362780, warehouseNumber: 31, warehouse: "31 - Phoenix, AZ", status: "In Progress", completedOn: null, completedBy: null, activeUser: { name: "Carlos Rivera", initials: "CR", color: "#0047BB" } },
  { id: "6",  dateReceived: "2025-01-15", timeReceived: "10:12 AM", mfgSerial: "TF-3371-D", icNumber: "441928573", manufacturer: "Eaton",   transformerType: "Three-Phase Pad", kva: 1000, intakeCategory: "Surplus", intakeTags: ["Base Damage"],                 loadNumber: 119204, warehouseNumber: 99, warehouse: "99 - Houston, TX", status: "Not Started", completedOn: null, completedBy: null, activeUser: null },
  { id: "7",  dateReceived: "2025-02-03", timeReceived: "8:05 AM",  mfgSerial: "TF-8831-G", icNumber: "554738201", manufacturer: "Siemens", transformerType: "Three-Phase Pad", kva: 750,  intakeCategory: "Recycle", intakeTags: ["NPX: Rewind", "NPX: Repair"],  loadNumber: 278456, warehouseNumber: 22, warehouse: "22 - Denver, CO",   status: "Not Started", completedOn: null, completedBy: null, activeUser: null },
  { id: "8",  dateReceived: "2025-02-28", timeReceived: "1:44 PM",  mfgSerial: "TF-4492-C", icNumber: "667193845", manufacturer: "GE",      transformerType: "Three-Phase Pad", kva: 1500, intakeCategory: "Surplus", intakeTags: ["Base Damage", "NPX: Rewind"],  loadNumber: 390127, warehouseNumber: 44, warehouse: "44 - Atlanta, GA", status: "Completed",   completedOn: "2025-03-05", completedBy: "Maria Santos", activeUser: null },
  { id: "9",  dateReceived: "2025-03-14", timeReceived: "4:30 PM",  mfgSerial: "TF-2278-B", icNumber: "789042316", manufacturer: "ABB",     transformerType: "Three-Phase Pad", kva: 3000, intakeCategory: "Recycle", intakeTags: ["NPX: Scrap"],                  loadNumber: 451803, warehouseNumber: 7,  warehouse: "07 - Atlanta, GA", status: "In Progress", completedOn: null, completedBy: null, activeUser: { name: "Sarah Chen", initials: "SC", color: "#7c3aed" } },
  { id: "10", dateReceived: "2025-04-07", timeReceived: "11:55 AM", mfgSerial: "TF-1045-A", icNumber: "823615490", manufacturer: "Eaton",   transformerType: "Three-Phase Pad", kva: 500,  intakeCategory: "Surplus", intakeTags: ["Base Damage", "NPX: Repair"],  loadNumber: 512948, warehouseNumber: 34, warehouse: "34 - Phoenix, AZ", status: "Not Started", completedOn: null, completedBy: null, activeUser: null },
];

const ROW_INTERVAL_MS = 900;
const MANUFACTURERS  = [...new Set(SEED_UNITS.map((u) => u.manufacturer))].sort();
const WAREHOUSES     = [...new Set(SEED_UNITS.map((u) => u.warehouse))].sort();
const KVA_VALUES     = [...new Set(SEED_UNITS.map((u) => u.kva))].sort((a, b) => a - b).map(String);
const SITES          = [...new Set(SEED_UNITS.map((u) => siteFromWarehouse(u.warehouse)))].sort();

/* ─── Filters ────────────────────────────────────────────────────────────────── */
type Filters = {
  dateFrom: string; dateTo: string; icNumber: string;
  manufacturer: string[]; kva: string[]; warehouse: string[];
  intakeCategory: string[]; status: string[]; site: string[];
};

const EMPTY_FILTERS: Filters = {
  dateFrom: "", dateTo: "", icNumber: "",
  manufacturer: [], kva: [], warehouse: [],
  intakeCategory: [], status: [], site: [],
};

function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.dateFrom) n++; if (f.dateTo) n++; if (f.icNumber) n++;
  if (f.manufacturer.length) n++; if (f.kva.length) n++;
  if (f.warehouse.length) n++; if (f.intakeCategory.length) n++;
  if (f.status.length) n++; if (f.site.length) n++;
  return n;
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[Number(month) - 1]} ${Number(day)}, ${year}`;
}
function formatDateTime(iso: string, time: string): { date: string; time: string } {
  return { date: formatDate(iso), time };
}

/* ─── Shared field styles ────────────────────────────────────────────────────── */
const FIELD: React.CSSProperties = {
  height: 34, fontSize: 13, fontWeight: 400, padding: "0 10px",
  borderRadius: 7, border: "1px solid hsl(var(--border))",
  background: "hsl(var(--background))", color: "hsl(var(--foreground))",
  outline: "none", boxSizing: "border-box", lineHeight: "34px", width: "100%",
};
const SELECT_ARROW = `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")`;
const LABEL: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.07em",
  color: "hsl(var(--muted-foreground))", marginBottom: 4, whiteSpace: "nowrap",
};
const DATE_INPUT: React.CSSProperties = {
  ...FIELD, width: 130, colorScheme: "inherit" as React.CSSProperties["colorScheme"],
};
const CARD: React.CSSProperties = {
  background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
};

function FInput({ value, onChange, placeholder, style }: { value: string; onChange: (v: string) => void; placeholder: string; style?: React.CSSProperties }) {
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...FIELD, ...style }} />;
}

/* ─── Multi-select dropdown ──────────────────────────────────────────────────── */
function MultiSelect({ value, onChange, options, placeholder, style }: {
  value: string[]; onChange: (v: string[]) => void;
  options: string[]; placeholder: string; style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);

  const displayText = value.length === 0
    ? placeholder
    : value.length === 1 ? value[0] : `${value.length} selected`;

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <button onClick={() => setOpen((v) => !v)} style={{
        ...FIELD, display: "flex", alignItems: "center", cursor: "pointer",
        backgroundImage: SELECT_ARROW, backgroundRepeat: "no-repeat",
        backgroundPosition: "right 9px center", paddingRight: 28, textAlign: "left",
        color: value.length > 0 ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
        border: open ? "1px solid #0047BB" : "1px solid hsl(var(--border))",
      }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{displayText}</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 400,
          background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
          borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
          minWidth: "100%", maxHeight: 220, overflowY: "auto", padding: "4px 0",
        }}>
          {options.map((opt) => (
            <label key={opt} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "7px 12px", cursor: "pointer", fontSize: 13,
              color: "hsl(var(--foreground))", userSelect: "none",
              background: value.includes(opt) ? "rgba(0,71,187,0.06)" : "transparent",
            }}
              onMouseEnter={(e) => { if (!value.includes(opt)) (e.currentTarget as HTMLLabelElement).style.background = "hsl(var(--muted))"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLLabelElement).style.background = value.includes(opt) ? "rgba(0,71,187,0.06)" : "transparent"; }}>
              <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)}
                style={{ width: 14, height: 14, accentColor: "#0047BB", cursor: "pointer", flexShrink: 0 }} />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Status ─────────────────────────────────────────────────────────────────── */
const STATUS_STYLES: Record<EvalStatus, { bg: string; color: string; borderColor: string }> = {
  "Not Started": { bg: "rgba(100,116,139,0.08)",  color: "#64748b", borderColor: "rgba(100,116,139,0.28)" },
  "In Progress": { bg: "rgba(59,130,246,0.10)",   color: "#3b82f6", borderColor: "rgba(59,130,246,0.30)" },
  "Completed":   { bg: "rgba(34,197,94,0.10)",    color: "#16a34a", borderColor: "rgba(34,197,94,0.30)"  },
};

function StatusIcon({ status }: { status: EvalStatus }) {
  const p = { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (status === "Completed")   return <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
  if (status === "In Progress") return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

function StatusBadge({ status, onClick }: { status: EvalStatus; onClick: (e: React.MouseEvent) => void }) {
  const s = STATUS_STYLES[status];
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.borderColor}`, cursor: "pointer", whiteSpace: "nowrap" }} title="Click to change status">
      <StatusIcon status={status} />{status}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
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
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: s === current ? st.bg : "transparent", border: "none", cursor: "pointer", textAlign: "left", color: s === current ? st.color : "hsl(var(--foreground))", fontSize: 13, fontWeight: s === current ? 600 : 400 }}
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

/* ─── Intake pills ───────────────────────────────────────────────────────────── */
function FlagIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  );
}

function IntakePills({ category, tags }: { category: IntakeCategory; tags: IntakeTag[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: "hsl(var(--muted-foreground))" }}>{category}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {tags.map((tag) => {
          const isDamage = tag === "Base Damage";
          return (
            <span key={tag} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
              background: isDamage ? "rgba(251,191,36,0.18)" : "rgba(100,116,139,0.08)",
              color:      isDamage ? "#d97706"               : "#64748b",
              border:     isDamage ? "1px solid rgba(251,191,36,0.35)" : "1px solid rgba(100,116,139,0.22)",
            }}>
              {isDamage ? <FlagIcon /> : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
              )}
              {tag}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Active user lock pill ──────────────────────────────────────────────────── */
function ActiveUserPill({ user }: { user: ActiveUser }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      marginTop: 5, padding: "3px 8px 3px 5px", borderRadius: 20,
      background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))",
      fontSize: 11, fontWeight: 500, color: "hsl(var(--foreground))",
      whiteSpace: "nowrap",
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
        background: user.color, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff",
        letterSpacing: "-0.02em",
      }}>
        {user.initials}
      </div>
      <span style={{ color: "hsl(var(--foreground))", fontSize: 11 }}>{user.name}</span>
    </div>
  );
}

/* ─── Column picker ──────────────────────────────────────────────────────────── */
function ColumnPicker({ visibility, onChange, onClose, onReset }: { visibility: ColVisibility; onChange: (key: ColKey, val: boolean) => void; onClose: () => void; onReset: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 300, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", minWidth: 210, overflow: "hidden", padding: "6px 0" }}>
      <div style={{ padding: "8px 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "hsl(var(--muted-foreground))" }}>Columns</span>
        <button onClick={onReset} style={{ fontSize: 11, fontWeight: 500, color: "#0047BB", background: "none", border: "none", cursor: "pointer", padding: "1px 4px", borderRadius: 4 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,71,187,0.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}>
          Reset
        </button>
      </div>
      {COL_DEFS.map(({ key, label }) => (
        <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", cursor: "pointer", fontSize: 13, color: "hsl(var(--foreground))" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLLabelElement).style.background = "hsl(var(--muted))"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLLabelElement).style.background = "transparent"; }}>
          <input type="checkbox" checked={visibility[key]} onChange={(e) => onChange(key, e.target.checked)}
            style={{ width: 15, height: 15, accentColor: "#0047BB", cursor: "pointer", flexShrink: 0 }} />
          {label}
        </label>
      ))}
    </div>
  );
}

/* ─── Comment modal ──────────────────────────────────────────────────────────── */
function CommentModal({ icNumber, onClose }: { icNumber: string; onClose: () => void }) {
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {submitted ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "hsl(var(--foreground))" }}>Comment saved</p>
          </div>
        ) : (
          <>
            <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Add your notes about this evaluation unit…" rows={4}
              style={{ width: "100%", resize: "none", padding: "10px 12px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))", fontSize: 14, outline: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={onClose} style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "transparent", color: "hsl(var(--muted-foreground))", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSubmit} disabled={!text.trim()} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: text.trim() ? "#182557" : "hsl(var(--muted))", color: text.trim() ? "#fff" : "hsl(var(--muted-foreground))", fontSize: 13, fontWeight: 600, cursor: text.trim() ? "pointer" : "default" }}>Save Comment</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */
export default function EvaluationsHistoryPage() {
  const [visibleCount, setVisibleCount]     = useState(0);
  const [started, setStarted]               = useState(false);
  const [statuses, setStatuses]             = useState<Record<string, EvalStatus>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [commentUnitId, setCommentUnitId]   = useState<string | null>(null);
  const [refreshKey, setRefreshKey]         = useState(0);
  const [spinning, setSpinning]             = useState(false);
  const [showFilters, setShowFilters]       = useState(true);
  const [filters, setFilters]               = useState<Filters>(EMPTY_FILTERS);
  const [colVisibility, setColVisibility]   = useState<ColVisibility>(DEFAULT_COL_VISIBILITY);
  const [showColPicker, setShowColPicker]   = useState(false);

  const startPopulation = useCallback(() => {
    setVisibleCount(0); setStarted(false);
    const t = setTimeout(() => setStarted(true), 1200);
    return t;
  }, []);

  useEffect(() => { const t = startPopulation(); return () => clearTimeout(t); }, [refreshKey, startPopulation]);
  useEffect(() => {
    if (!started || visibleCount >= SEED_UNITS.length) return;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), ROW_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [started, visibleCount]);

  const handleRefresh = () => {
    setSpinning(true); setStatuses({}); setOpenDropdownId(null);
    setFilters(EMPTY_FILTERS); setRefreshKey((k) => k + 1);
    setTimeout(() => setSpinning(false), 800);
  };

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const filteredRows = SEED_UNITS.slice(0, visibleCount).filter((unit) => {
    const status: EvalStatus = statuses[unit.id] ?? unit.status;
    return (
      (!filters.dateFrom          || unit.dateReceived >= filters.dateFrom) &&
      (!filters.dateTo            || unit.dateReceived <= filters.dateTo) &&
      (!filters.icNumber          || unit.icNumber.includes(filters.icNumber)) &&
      (!filters.manufacturer.length || filters.manufacturer.includes(unit.manufacturer)) &&
      (!filters.kva.length        || filters.kva.includes(String(unit.kva))) &&
      (!filters.warehouse.length  || filters.warehouse.includes(unit.warehouse)) &&
      (!filters.intakeCategory.length || filters.intakeCategory.includes(unit.intakeCategory)) &&
      (!filters.status.length     || filters.status.includes(status)) &&
      (!filters.site.length       || filters.site.includes(siteFromWarehouse(unit.warehouse)))
    );
  });

  const activeFilterCount = countActiveFilters(filters);
  const commentUnit = SEED_UNITS.find((u) => u.id === commentUnitId);
  const show = colVisibility;
  const visibleColCount = COL_DEFS.filter((c) => show[c.key]).length;
  const COLSPAN = visibleColCount + 2; // +1 comment, +1 open

  const thBase: React.CSSProperties = {
    color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap",
    position: "sticky", top: 0, background: "hsl(var(--card))", zIndex: 10,
    borderBottom: "1px solid hsl(var(--border))", padding: "0 16px", height: 41,
    textAlign: "left", fontSize: 11, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.07em",
  };

  const filterBtnStyle: React.CSSProperties = showFilters
    ? { display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #0047BB", background: "#0047BB", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }
    : { display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "transparent", color: "hsl(var(--foreground))", fontSize: 13, fontWeight: 500, cursor: "pointer" };

  const actionBtnStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
    borderRadius: 8, border: "1px solid hsl(var(--border))", background: "transparent",
    color: "hsl(var(--foreground))", fontSize: 13, fontWeight: 500, cursor: "pointer",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
      <PortalHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 lg:p-8" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── 1. Header card ── */}
          <div style={CARD}>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>Evaluation History</h1>
                <p className="mt-0.5 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Transformer units received for evaluation, sorted oldest to newest</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowFilters((v) => !v); if (showFilters) setFilters(EMPTY_FILTERS); }} style={filterBtnStyle}
                  onMouseEnter={(e) => { if (!showFilters) (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--muted))"; }}
                  onMouseLeave={(e) => { if (!showFilters) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  Filters
                  {activeFilterCount > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: showFilters ? "rgba(255,255,255,0.25)" : "#0047BB", color: "#fff", fontSize: 10, fontWeight: 700 }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {activeFilterCount > 0 && (
                  <button onClick={() => setFilters(EMPTY_FILTERS)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "transparent", color: "hsl(var(--muted-foreground))", fontSize: 13, fontWeight: 400, cursor: "pointer" }}
                    onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "hsl(var(--muted))"; b.style.color = "hsl(var(--foreground))"; }}
                    onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "transparent"; b.style.color = "hsl(var(--muted-foreground))"; }}
                    title="Clear all filters">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Clear filters
                  </button>
                )}

                <div style={{ position: "relative" }}>
                  <button onClick={() => setShowColPicker((v) => !v)} style={actionBtnStyle}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--muted))"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    Columns
                  </button>
                  {showColPicker && (
                    <ColumnPicker visibility={colVisibility} onChange={(key, val) => setColVisibility((prev) => ({ ...prev, [key]: val }))} onClose={() => setShowColPicker(false)} onReset={() => setColVisibility(DEFAULT_COL_VISIBILITY)} />
                  )}
                </div>

                <button onClick={handleRefresh} title="Refresh" style={actionBtnStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--muted))"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: "transform 0.6s ease", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}>
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.04-6.5"/>
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* ── 2. Filter card ── */}
          {showFilters && (
            <div style={CARD}>
              {/*
                Ordered by table column position:
                Row 1 (5): Date Received · IC# · Manufacturer · Type · KVA
                Row 2 (4): Intake Type · Warehouse · Status · Site
                Date Received gets flex:2 since it contains two date pickers.
              */}

              {/* Row 1 */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: "16px 20px 12px" }}>
                {/* Date Received — flex:2 to fit two pickers */}
                <div style={{ flex: 2, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>Date Received</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <input type="date" value={filters.dateFrom} onChange={(e) => setFilter("dateFrom", e.target.value)}
                      style={{ ...FIELD, flex: 1, minWidth: 0, width: "auto", colorScheme: "inherit" as React.CSSProperties["colorScheme"] }} />
                    <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", flexShrink: 0 }}>–</span>
                    <input type="date" value={filters.dateTo} onChange={(e) => setFilter("dateTo", e.target.value)}
                      style={{ ...FIELD, flex: 1, minWidth: 0, width: "auto", colorScheme: "inherit" as React.CSSProperties["colorScheme"] }} />
                  </div>
                </div>

                {/* IC # */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>IC #</span>
                  <FInput value={filters.icNumber} onChange={(v) => setFilter("icNumber", v)} placeholder="Search IC number…" />
                </div>

                {/* Manufacturer */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>Manufacturer</span>
                  <MultiSelect value={filters.manufacturer} onChange={(v) => setFilter("manufacturer", v)} options={MANUFACTURERS} placeholder="All" style={{ width: "100%" }} />
                </div>

                {/* Type (locked) */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>Type</span>
                  <select disabled style={{ ...FIELD, width: "100%", appearance: "none", opacity: 0.5, cursor: "not-allowed", backgroundImage: SELECT_ARROW, backgroundRepeat: "no-repeat", backgroundPosition: "right 9px center", paddingRight: 28 }}>
                    <option>Three-Phase Pad</option>
                  </select>
                </div>

                {/* KVA */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>KVA</span>
                  <MultiSelect value={filters.kva} onChange={(v) => setFilter("kva", v)} options={KVA_VALUES} placeholder="All" style={{ width: "100%" }} />
                </div>
              </div>

              {/* Row 2 */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: "12px 20px 16px", borderTop: "1px solid hsl(var(--border))" }}>
                {/* Intake Type */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>Intake Type</span>
                  <MultiSelect value={filters.intakeCategory} onChange={(v) => setFilter("intakeCategory", v)} options={ALL_CATEGORIES} placeholder="All" style={{ width: "100%" }} />
                </div>

                {/* Warehouse */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>Warehouse</span>
                  <MultiSelect value={filters.warehouse} onChange={(v) => setFilter("warehouse", v)} options={WAREHOUSES} placeholder="All" style={{ width: "100%" }} />
                </div>

                {/* Status */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>Status</span>
                  <MultiSelect value={filters.status} onChange={(v) => setFilter("status", v)} options={ALL_STATUSES} placeholder="All" style={{ width: "100%" }} />
                </div>

                {/* Site */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>Site</span>
                  <MultiSelect value={filters.site} onChange={(v) => setFilter("site", v)} options={SITES} placeholder="All Sites" style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          )}

          {/* ── 3. Table card ── */}
          <div style={{ ...CARD, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {visibleCount === 0 ? <EmptyState /> : (
              <div style={{ flex: 1, overflowY: "auto" }}>
                <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {show.date        && <th style={thBase}>Date & Time Received</th>}
                      {show.mfgSerial   && <th style={thBase}>MFG S#</th>}
                      {show.icNumber    && <th style={thBase}>IC#</th>}
                      {show.mfr         && <th style={thBase}>MFR</th>}
                      {show.type        && <th style={thBase}>Type</th>}
                      {show.kva         && <th style={thBase}>KVA</th>}
                      {show.intake      && <th style={thBase}>Intake Type</th>}
                      {show.load        && <th style={thBase}>Load #</th>}
                      {show.whs         && <th style={thBase}>WHS</th>}
                      {show.status      && <th style={thBase}>Status</th>}
                      {show.site        && <th style={thBase}>Site</th>}
                      {show.completedOn && <th style={thBase}>Completed On</th>}
                      {show.completedBy && <th style={thBase}>Completed By</th>}
                      <th style={{ ...thBase, padding: "0 10px" }}></th>
                      <th style={{ ...thBase, padding: "0 16px 0 8px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr><td colSpan={COLSPAN}>
                        <div className="flex flex-col items-center justify-center py-14 text-center">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 10, opacity: 0.5 }}>
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                          </svg>
                          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>No results match the active filters.</p>
                          <button onClick={() => setFilters(EMPTY_FILTERS)} style={{ marginTop: 8, fontSize: 12, color: "#0047BB", background: "none", border: "none", cursor: "pointer" }}>Clear filters</button>
                        </div>
                      </td></tr>
                    ) : filteredRows.map((unit, idx) => {
                      const status: EvalStatus = statuses[unit.id] ?? unit.status;
                      const isDropdownOpen = openDropdownId === unit.id;
                      const { date, time } = formatDateTime(unit.dateReceived, unit.timeReceived);
                      const site = siteFromWarehouse(unit.warehouse);
                      return (
                        <tr key={unit.id}
                          style={{ borderBottom: idx < filteredRows.length - 1 ? "1px solid hsl(var(--border))" : undefined, animation: "fadeSlideIn 0.4s ease-out" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "hsl(var(--muted) / 0.4)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>

                          {show.date && (
                            <td className="px-4 py-3" style={{ whiteSpace: "nowrap" }}>
                              <div style={{ fontSize: 13, color: "hsl(var(--foreground))" }}>{date}</div>
                              <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>{time}</div>
                            </td>
                          )}
                          {show.mfgSerial  && <td className="px-4 py-3 font-mono font-semibold" style={{ color: "hsl(var(--foreground))", whiteSpace: "nowrap", fontSize: 13 }}>{unit.mfgSerial}</td>}
                          {show.icNumber   && <td className="px-4 py-3 font-mono" style={{ color: "hsl(var(--foreground))", whiteSpace: "nowrap", fontSize: 13 }}>{unit.icNumber}</td>}
                          {show.mfr        && <td className="px-4 py-3" style={{ color: "hsl(var(--foreground))", fontSize: 13 }}>{unit.manufacturer}</td>}
                          {show.type       && <td className="px-4 py-3" style={{ color: "hsl(var(--foreground))", whiteSpace: "nowrap", fontSize: 13 }}>{unit.transformerType}</td>}
                          {show.kva        && <td className="px-4 py-3 font-medium" style={{ color: "hsl(var(--foreground))", whiteSpace: "nowrap", fontSize: 13 }}>{unit.kva.toLocaleString()}</td>}
                          {show.intake     && <td className="px-4 py-3"><IntakePills category={unit.intakeCategory} tags={unit.intakeTags} /></td>}
                          {show.load       && <td className="px-4 py-3 font-mono" style={{ color: "hsl(var(--foreground))", whiteSpace: "nowrap", fontSize: 13 }}>{unit.loadNumber}</td>}
                          {show.whs        && <td className="px-4 py-3" style={{ color: "hsl(var(--foreground))", fontSize: 13 }}>{unit.warehouseNumber}</td>}
                          {show.status     && (
                            <td className="px-4 py-3" style={{ position: "relative" }}>
                              <div style={{ position: "relative", display: "inline-block" }}>
                                <StatusBadge status={status} onClick={(e) => { e.stopPropagation(); setOpenDropdownId(isDropdownOpen ? null : unit.id); }} />
                                {isDropdownOpen && <StatusDropdown current={status} onSelect={(s) => setStatuses((prev) => ({ ...prev, [unit.id]: s }))} onClose={() => setOpenDropdownId(null)} />}
                              </div>
                              {unit.activeUser && status === "In Progress" && (
                                <div><ActiveUserPill user={unit.activeUser} /></div>
                              )}
                            </td>
                          )}
                          {show.site        && <td className="px-4 py-3" style={{ color: "hsl(var(--foreground))", fontSize: 13, whiteSpace: "nowrap" }}>{site}</td>}
                          {show.completedOn && (
                            <td className="px-4 py-3" style={{ color: unit.completedOn ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", fontSize: 13, whiteSpace: "nowrap" }}>
                              {unit.completedOn ? formatDate(unit.completedOn) : "—"}
                            </td>
                          )}
                          {show.completedBy && (
                            <td className="px-4 py-3" style={{ color: unit.completedBy ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", fontSize: 13, whiteSpace: "nowrap" }}>
                              {unit.completedBy ?? "—"}
                            </td>
                          )}

                          {/* Comment button */}
                          <td className="px-2 py-3">
                            <button onClick={() => setCommentUnitId(unit.id)} title="Add comment"
                              style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid hsl(var(--border))", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "hsl(var(--muted-foreground))" }}
                              onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "hsl(var(--foreground))"; b.style.background = "hsl(var(--muted))"; }}
                              onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "hsl(var(--muted-foreground))"; b.style.background = "transparent"; }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                              </svg>
                            </button>
                          </td>

                          {/* Open button */}
                          <td className="px-3 py-3" style={{ whiteSpace: "nowrap" }}>
                            <button
                              style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid #0047BB", background: "transparent", color: "#0047BB", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background 0.15s, color 0.15s" }}
                              onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "#0047BB"; b.style.color = "#fff"; }}
                              onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "transparent"; b.style.color = "#0047BB"; }}>
                              Open
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {commentUnitId && commentUnit && (
        <CommentModal icNumber={commentUnit.icNumber} onClose={() => setCommentUnitId(null)} />
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <p className="font-medium mb-1" style={{ color: "hsl(var(--foreground))", fontSize: 15 }}>No units currently awaiting evaluation.</p>
      <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>Units will appear here as they are received for evaluation.</p>
    </div>
  );
}
