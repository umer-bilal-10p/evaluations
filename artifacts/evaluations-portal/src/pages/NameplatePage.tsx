import { useState } from "react";
import { PortalHeader } from "@/components/PortalHeader";
import { Sidebar } from "@/components/Sidebar";
import { useDemoContext } from "@/context/DemoContext";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ─── Default mock data ─────────────────────────────────────────────────────── */
const DEFAULT_NAMEPLATE = {
  manufacturer: "Siemens",
  icNumber: "185840632",
  mfgSerial: "TF-7662-N",
  kva: 1750,
  site: "KSSO",
  loadNumber: "LN-4821",
  transformerType: "Three-Phase Pad",
  hasBaseDamage: true,
  intakeTags: ["NPX: Rewind"],
};

const IDENTIFICATION = {
  manufacturer: "Siemens",
  serialNumber: "TF-7662-N",
  unitType: "Three-Phase Pad",
  yearManufactured: "2010",
  aiSerial: "TF-7662-N",
};

const RATINGS = {
  kvaBase: "1,750",
  kvaFanBase: "",
  kvaHigherRating: "",
  kvaFanHigherRating: "",
  coolingClass: "ONAN",
  rise: "65",
  frequency: "60",
  impedance: "5.75",
  oilType: "Mineral Oil",
  oilVolume: "210",
  oilVolumeError: "Exceeds max capacity for ONAN 1,750 kVA (220 gal)",
  coreCoilsWeight: "6,120",
  oilWeight: "2,380",
  caseTankWeight: "2,840",
  totalWeight: "11,340",
};

const HV = {
  nominalVoltage: "12470D X 12470GRD/Y/200",
  dyDelta: "Delta",
  hv1Config: "DELTA",
  hv1Delta: "12,470",
  hv3Config: "GY07",
  hv2Delta: "12,470",
  hv2Wye: "7,200",
  deltaWye: true,
  dualVoltage: true,
  bil: "110",
  windingMaterial: "AL",
  taps: [
    { tap: "1A", kvaRating: "12,979", deviation: "+4.0" },
    { tap: "2B", kvaRating: "12,724", deviation: "+2.0" },
    { tap: "3C", kvaRating: "12,470", deviation: "0.0" },
    { tap: "4D", kvaRating: "12,219", deviation: "-2.0" },
    { tap: "5E", kvaRating: "11,961", deviation: "-4.0" },
    { tap: "6F", kvaRating: "—", deviation: "—" },
    { tap: "7G", kvaRating: "—", deviation: "—" },
  ],
  numberOfTaps: "5",
  tapConfig: "1A-5E",
  nominalTapPos: "3",
};

const LV = {
  nominalVoltage: "480GRD/Y/277 X 240GRD/Y/138",
  lv1Config: "GY07",
  lv1Delta: "480",
  lv1Wye: "277",
  lv2Config: "GY07",
  lv2Delta: "240",
  lv2Wye: "138",
  deltaWye: false,
  dualVoltage: true,
  bil: "30",
  windingMaterial: "AL",
};

/* ─── Sub-components ────────────────────────────────────────────────────────── */

/* Sparkle icon shared by AI components */
function SparkleIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L14.09 8.26L20.5 9.27L16.25 13.41L17.18 19.82L12 17L6.82 19.82L7.75 13.41L3.5 9.27L9.91 8.26L12 2Z"/>
    </svg>
  );
}

function ConfidenceBadge({ pct }: { pct: number }) {
  const isHigh = pct >= 60;
  const bg = isHigh ? "rgba(124,58,237,0.10)" : "#FEF3C7";
  const color = isHigh ? "#7C3AED" : "#92400E";
  const border = isHigh ? "rgba(124,58,237,0.28)" : "#FCD34D";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
      background: bg, color, border: `1px solid ${border}`,
    }}>
      <SparkleIcon size={10} />
      {pct}% Confidence
    </span>
  );
}

function SectionHeader({ title, confidence }: { title: string; confidence: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      paddingBottom: 12, marginBottom: 16,
      borderBottom: "1px solid hsl(var(--border))",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: "#0047BB", flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(var(--foreground))" }}>
          {title}
        </span>
      </div>
      <ConfidenceBadge pct={confidence} />
    </div>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: "hsl(var(--muted-foreground))", marginBottom: 5, letterSpacing: "0.02em" }}>
      {label}{required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
    </div>
  );
}

function AiChip({ label }: { label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4,
      fontSize: 11, color: "#7C3AED", fontWeight: 500,
      background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.22)",
      borderRadius: 5, padding: "1px 7px",
    }}>
      <SparkleIcon size={9} />
      AI: {label}
    </span>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <span style={{ display: "block", marginTop: 4, fontSize: 11, color: "#DC2626" }}>
      ⚠ {msg}
    </span>
  );
}

/* ─── Unified Field — shadcn Input in readOnly or editable state ──────────── */
function Field({
  label,
  value,
  editMode,
  required,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  editMode: boolean;
  required?: boolean;
  error?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <Input
        defaultValue={value}
        readOnly={!editMode}
        placeholder={editMode ? placeholder : undefined}
        className={cn(
          "h-9 text-sm",
          !editMode && "bg-muted border-muted cursor-default focus-visible:ring-0 focus-visible:ring-offset-0",
          editMode && "bg-background",
          error && editMode && "border-red-400 focus-visible:ring-red-400",
          error && !editMode && "border-red-300 bg-red-50 dark:bg-red-950/20",
        )}
      />
    </div>
  );
}

/* ─── Unified Select — shadcn Select disabled in view mode ──────────────────── */
function SelectField({
  label,
  value,
  editMode,
  required,
  options,
}: {
  label: string;
  value: string;
  editMode: boolean;
  required?: boolean;
  options: string[];
}) {
  if (!editMode) {
    return (
      <div>
        <FieldLabel label={label} required={required} />
        <Input
          value={value || "—"}
          readOnly
          className="h-9 text-sm bg-muted border-muted cursor-default focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
    );
  }
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <Select defaultValue={value}>
        <SelectTrigger className="h-9 bg-background text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ─── Switch field ──────────────────────────────────────────────────────────── */
function SwitchField({
  label,
  value,
  editMode,
  onChange,
}: {
  label: string;
  value: boolean;
  editMode: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div>
      <FieldLabel label={label} required />
      <div style={{
        height: 36, borderRadius: 7, border: "1px solid hsl(var(--border))",
        background: "hsl(var(--muted))", padding: "0 12px",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <Switch
          checked={value}
          onCheckedChange={editMode ? onChange : undefined}
          disabled={!editMode}
          className={cn(
            "data-[state=checked]:bg-[#0047BB]",
            !editMode && "opacity-100 cursor-default",
          )}
        />
        <span style={{ fontSize: 13, fontWeight: 500, color: value ? "#0047BB" : "hsl(var(--muted-foreground))" }}>
          {value ? "Yes" : "No"}
        </span>
      </div>
    </div>
  );
}

/* ─── Section wrapper ───────────────────────────────────────────────────────── */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
      borderRadius: 12,
      padding: "20px 24px",
      marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function FieldGrid({ children, cols = 3 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: "16px 20px",
    }}>
      {children}
    </div>
  );
}

/* ─── Tap table ─────────────────────────────────────────────────────────────── */
function TapTable({ taps, editMode }: { taps: typeof HV.taps; editMode: boolean }) {
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
        color: "hsl(var(--muted-foreground))", marginBottom: 8,
      }}>
        Tap Voltage &amp; % Deviation
      </div>
      <div style={{
        border: "1px solid hsl(var(--border))",
        borderRadius: 8,
        overflow: "hidden",
        fontSize: 12,
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "64px 1fr 1fr",
          background: "hsl(var(--muted))",
          borderBottom: "1px solid hsl(var(--border))",
          padding: "6px 12px",
          fontWeight: 700, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase",
          color: "hsl(var(--muted-foreground))",
        }}>
          <span>TAP</span>
          <span>KVA Rating</span>
          <span>% Deviation</span>
        </div>
        {taps.map((row, i) => {
          const isEmpty = row.kvaRating === "—";
          return (
            <div key={row.tap} style={{
              display: "grid", gridTemplateColumns: "64px 1fr 1fr",
              padding: "7px 12px",
              borderBottom: i < taps.length - 1 ? "1px solid hsl(var(--border))" : undefined,
              background: "hsl(var(--card))",
              alignItems: "center",
            }}>
              <span style={{ fontWeight: 600, color: "hsl(var(--foreground))" }}>{row.tap}</span>
              <span style={{ color: isEmpty ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))" }}>
                {editMode && !isEmpty ? (
                  <Input defaultValue={row.kvaRating} className="h-7 text-xs bg-background" style={{ maxWidth: 100 }} />
                ) : row.kvaRating}
              </span>
              <span style={{
                color: isEmpty ? "hsl(var(--muted-foreground))"
                  : row.deviation.startsWith("+") ? "#047857"
                  : row.deviation === "0.0" ? "hsl(var(--foreground))"
                  : "#DC2626",
                fontWeight: isEmpty ? 400 : 500,
              }}>
                {editMode && !isEmpty ? (
                  <Input defaultValue={row.deviation} className="h-7 text-xs bg-background" style={{ maxWidth: 80 }} />
                ) : row.deviation}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Nameplate image content (reused in thumbnail + modal) ─────────────────── */
function NameplateImageContent({ icNumber, manufacturer, mfgSerial, kva, scale = 1 }: {
  icNumber: string; manufacturer: string; mfgSerial: string; kva: number; scale?: number;
}) {
  const fs = (n: number) => n * scale;
  return (
    <>
      <div style={{ padding: `${fs(10)}px ${fs(10)}px ${fs(6)}px`, display: "flex", flexDirection: "column", gap: fs(3), height: "100%", boxSizing: "border-box" }}>
        <div style={{
          fontSize: fs(9), fontWeight: 800, color: "#e2e8f0", letterSpacing: "0.1em",
          textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.2)",
          paddingBottom: fs(3), marginBottom: fs(1),
        }}>
          {manufacturer} · Distribution Transformer
        </div>
        {[
          ["SERIAL", mfgSerial],
          ["KVA", `${kva.toLocaleString()} ONAN`],
          ["HV", "12470D / 12470GRD"],
          ["LV", "480GRD/Y/277"],
          ["IMP %", "5.75   HZ 60"],
          ["TEMP", "65°C Rise"],
          ["WT OIL", "210 Gal"],
          ["FLUID", "Type II Mineral Oil"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: fs(5), alignItems: "baseline" }}>
            <span style={{ fontSize: fs(7), fontWeight: 700, color: "rgba(255,255,255,0.45)", width: fs(28), flexShrink: 0 }}>{k}</span>
            <span style={{ fontSize: fs(8), fontWeight: 600, color: "#cbd5e1", letterSpacing: "0.04em", fontFamily: "monospace" }}>{v}</span>
          </div>
        ))}
      </div>
      {/* IC# overlay */}
      <div style={{
        position: "absolute", top: fs(6), right: fs(6),
        background: "rgba(0,71,187,0.92)", borderRadius: fs(5),
        padding: `${fs(2)}px ${fs(6)}px`,
        fontSize: fs(9), fontWeight: 700, color: "#fff",
        letterSpacing: "0.05em", boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
      }}>
        IC {icNumber}
      </div>
      {/* Quality indicator */}
      <div style={{ position: "absolute", bottom: fs(5), left: fs(6), display: "flex", alignItems: "center", gap: fs(3) }}>
        <div style={{ width: fs(6), height: fs(6), borderRadius: "50%", background: "#FBBF24" }} />
        <span style={{ fontSize: fs(7), fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Low quality</span>
      </div>
      {/* Timestamp */}
      <div style={{ position: "absolute", bottom: fs(5), right: fs(6), fontSize: fs(7), color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>
        {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>
    </>
  );
}

/* ─── Nameplate image card with IC overlay ──────────────────────────────────── */
function NameplateImageCard({ icNumber, manufacturer, mfgSerial, kva }: {
  icNumber: string; manufacturer: string; mfgSerial: string; kva: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = "data:text/plain,nameplate-placeholder";
    a.download = `nameplate-IC${icNumber}.png`;
    a.click();
  };

  return (
    <>
      <div style={{
        background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
        borderRadius: 10, padding: 16, marginBottom: 12,
        display: "flex", gap: 16, alignItems: "flex-start",
      }}>
        {/* Thumbnail — clickable */}
        <div
          onClick={() => setExpanded(true)}
          style={{
            width: 200, height: 140, borderRadius: 8, overflow: "hidden",
            flexShrink: 0, position: "relative", cursor: "pointer",
            border: "1px solid hsl(var(--border))",
            background: "linear-gradient(135deg, #1a1f2e 0%, #2a3350 40%, #1e2640 100%)",
          }}
        >
          <NameplateImageContent icNumber={icNumber} manufacturer={manufacturer} mfgSerial={mfgSerial} kva={kva} scale={1} />
          {/* Expand icon overlay */}
          <div style={{
            position: "absolute", top: 6, left: 6,
            width: 24, height: 24, borderRadius: 5,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.85)",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </div>
        </div>

        {/* Metadata beside image */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: 1 }}>IC: {icNumber}</div>
            <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{manufacturer} · {mfgSerial} · {kva.toLocaleString()} kVA</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#047857", flexShrink: 0 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span style={{ fontSize: 11, color: "#047857", fontWeight: 500 }}>AI extraction complete</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {["Blurry", "Underexposed", "Off angle"].map((tag) => (
              <span key={tag} style={{
                fontSize: 10, fontWeight: 500,
                background: "#FEF3C7", border: "1px solid #FCD34D", color: "#92400E",
                borderRadius: 20, padding: "1px 7px",
              }}>{tag}</span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
            Image quality issues detected — may reduce AI accuracy
          </div>
        </div>
      </div>

      {/* ── Expanded modal ── */}
      {expanded && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative" }}
          >
            {/* Close button */}
            <button
              onClick={() => setExpanded(false)}
              style={{
                position: "absolute", top: -40, left: 0,
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", color: "rgba(255,255,255,0.7)",
                fontSize: 13, fontWeight: 500, cursor: "pointer", padding: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="5" x2="5" y2="19"/><line x1="5" y1="5" x2="19" y2="19"/>
              </svg>
              Close
            </button>

            {/* Download button */}
            <button
              onClick={handleDownload}
              style={{
                position: "absolute", top: -40, right: 0,
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer",
                borderRadius: 7, padding: "5px 12px",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </button>

            {/* Large nameplate image */}
            <div style={{
              width: 640, height: 400, borderRadius: 12, overflow: "hidden",
              position: "relative",
              background: "linear-gradient(135deg, #1a1f2e 0%, #2a3350 40%, #1e2640 100%)",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}>
              <NameplateImageContent icNumber={icNumber} manufacturer={manufacturer} mfgSerial={mfgSerial} kva={kva} scale={3.2} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function NameplatePage() {
  const { selectedUnit, setCurrentPage } = useDemoContext();
  const [editMode, setEditMode] = useState(false);
  const [hvDeltaWye, setHvDeltaWye] = useState(HV.deltaWye);
  const [hvDualVoltage, setHvDualVoltage] = useState(HV.dualVoltage);
  const [lvDeltaWye, setLvDeltaWye] = useState(LV.deltaWye);
  const [lvDualVoltage, setLvDualVoltage] = useState(LV.dualVoltage);

  const unit = selectedUnit || DEFAULT_NAMEPLATE;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
      <PortalHeader />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden">

          {/* ── Unit sub-header ──────────────────────────────────────────── */}
          <div style={{
            background: "#0d1629",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            padding: "0 24px",
            minHeight: 48,
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexShrink: 0,
            flexWrap: "wrap",
          }}>
            {/* Back link */}
            <button
              onClick={() => setCurrentPage("evaluations-history")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 500,
                background: "none", border: "none", cursor: "pointer", padding: 0,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Evaluations
            </button>

            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />

            {/* Breadcrumb pills */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", flex: 1 }}>
              {[
                unit.manufacturer,
                `IC: ${unit.icNumber}`,
                `Serial: ${unit.mfgSerial}`,
                `KVA: ${unit.kva.toLocaleString()}`,
                unit.transformerType,
              ].map((label, i) => (
                <span key={i} style={{
                  fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6, padding: "2px 9px",
                }}>
                  {label}
                </span>
              ))}
              {unit.hasBaseDamage && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: "#FEF3C7",
                  background: "rgba(234,88,12,0.25)", border: "1px solid rgba(234,88,12,0.45)",
                  borderRadius: 6, padding: "2px 9px", display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Base Damage
                </span>
              )}
              {(unit.intakeTags ?? []).map((tag: string) => (
                <span key={tag} style={{
                  fontSize: 11, fontWeight: 600, color: "#E0F2FE",
                  background: "rgba(14,165,233,0.18)", border: "1px solid rgba(14,165,233,0.35)",
                  borderRadius: 6, padding: "2px 9px",
                }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Edit / Save / Discard buttons */}
            {editMode ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => setEditMode(false)}
                  style={{
                    padding: "6px 16px", borderRadius: 7,
                    border: "1px solid rgba(255,255,255,0.22)",
                    background: "transparent", color: "rgba(255,255,255,0.75)",
                    fontSize: 12, fontWeight: 500, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Discard Changes
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  style={{
                    padding: "6px 16px", borderRadius: 7,
                    border: "1px solid #0047BB", background: "#0047BB",
                    color: "#fff", fontSize: 12, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                style={{
                  flexShrink: 0, padding: "6px 16px", borderRadius: 7,
                  border: "1px solid #0047BB", background: "#0047BB",
                  color: "#fff", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
            )}
          </div>

          {/* ── Scrollable content ───────────────────────────────────────── */}
          <div className="flex-1 overflow-auto" style={{ padding: "24px 32px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>

              {/* Supervisor Comments */}
              <div style={{ marginBottom: 16 }}>
                <Accordion type="single" collapsible>
                  <AccordionItem value="comments" style={{
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 10,
                    background: "hsl(var(--card))",
                    overflow: "hidden",
                  }}>
                    <AccordionTrigger className="px-4 py-3 hover:no-underline" style={{ borderBottom: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#0047BB" }}>
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--foreground))" }}>Supervisor Comments</span>
                        <span style={{
                          width: 18, height: 18, borderRadius: "50%",
                          background: "#0047BB", color: "#fff",
                          fontSize: 10, fontWeight: 700,
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}>2</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
                        {[
                          {
                            initials: "MC", color: "#0047BB", name: "Michael Chen",
                            role: "Senior Evaluator", time: "2 hours ago",
                            text: "Oil volume reading of 210 gallons appears low for this unit. The standard capacity for ONAN 1,750 kVA is 220 gal. Please verify against the physical nameplate before finalizing.",
                          },
                          {
                            initials: "SR", color: "#047857", name: "Sandra Rivera",
                            role: "QA Supervisor", time: "45 min ago",
                            text: "Confirmed HV nominal voltage matches the 12,470D configuration. All tap values look correct per the engineering spec sheet.",
                          },
                        ].map((c) => (
                          <div key={c.initials} style={{
                            background: "hsl(var(--muted) / 0.5)",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                            padding: "12px 14px",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: "50%",
                                background: c.color, color: "#fff",
                                fontSize: 10, fontWeight: 700,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                              }}>
                                {c.initials}
                              </div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "hsl(var(--foreground))" }}>{c.name}</div>
                                <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{c.role} · {c.time}</div>
                              </div>
                            </div>
                            <p style={{ fontSize: 13, color: "hsl(var(--foreground))", lineHeight: 1.5, margin: 0 }}>{c.text}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Nameplate image card with IC overlay */}
              <NameplateImageCard
                icNumber={unit.icNumber}
                manufacturer={unit.manufacturer}
                mfgSerial={unit.mfgSerial}
                kva={unit.kva}
              />

              {/* ── IDENTIFICATION ──────────────────────────────────────── */}
              <Section>
                <SectionHeader title="Identification" confidence={87} />
                <FieldGrid>
                  <SelectField
                    label="Manufacturer"
                    value={IDENTIFICATION.manufacturer}
                    editMode={editMode}
                    required
                    options={["Siemens", "ABB", "Eaton", "General Electric", "Schneider Electric", "Square D"]}
                  />

                  <div>
                    <Field label="Serial Number" value={IDENTIFICATION.serialNumber} editMode={editMode} required />
                    <AiChip label={IDENTIFICATION.aiSerial} />
                  </div>

                  <SelectField
                    label="Unit Type"
                    value={IDENTIFICATION.unitType}
                    editMode={editMode}
                    required
                    options={["Three-Phase Pad", "Single-Phase Pad", "Pole Mount"]}
                  />

                  <SelectField
                    label="Year Manufactured"
                    value={IDENTIFICATION.yearManufactured}
                    editMode={editMode}
                    required
                    options={Array.from({ length: 40 }, (_, i) => String(2024 - i))}
                  />
                </FieldGrid>
              </Section>

              {/* ── RATINGS ─────────────────────────────────────────────── */}
              <Section>
                <SectionHeader title="Ratings" confidence={91} />
                <FieldGrid>
                  <Field label="KVA Base" value={RATINGS.kvaBase} editMode={editMode} required />
                  <Field label="KVA Fan Base" value={RATINGS.kvaFanBase} editMode={editMode} required placeholder="e.g. 2,000" />
                  <Field label="KVA Higher Rating" value={RATINGS.kvaHigherRating} editMode={editMode} required placeholder="e.g. 2,100" />
                  <Field label="KVA Fan Higher Rating" value={RATINGS.kvaFanHigherRating} editMode={editMode} required placeholder="e.g. 2,200" />

                  <SelectField
                    label="Cooling Class"
                    value={RATINGS.coolingClass}
                    editMode={editMode}
                    required
                    options={["ONAN", "ONAF", "ONAN/ONAF", "OFAF", "ODAF"]}
                  />

                  <Field label="Rise (°C)" value={RATINGS.rise} editMode={editMode} required />
                  <Field label="Frequency" value={RATINGS.frequency} editMode={editMode} required />
                  <Field label="Impedance %" value={RATINGS.impedance} editMode={editMode} required />

                  <SelectField
                    label="Oil Type"
                    value={RATINGS.oilType}
                    editMode={editMode}
                    required
                    options={["Mineral Oil", "Silicone", "Natural Ester", "Synthetic Ester"]}
                  />

                  {/* Oil Volume — validation error */}
                  <div>
                    <FieldLabel label="Oil Volume (Gallons)" required />
                    <Input
                      defaultValue={RATINGS.oilVolume}
                      readOnly={!editMode}
                      className={cn(
                        "h-9 text-sm",
                        !editMode && "bg-red-50 dark:bg-red-950/20 border-red-300 cursor-default focus-visible:ring-0 focus-visible:ring-offset-0",
                        editMode && "bg-background border-red-400 focus-visible:ring-red-400",
                      )}
                    />
                    <ErrorMsg msg={RATINGS.oilVolumeError} />
                  </div>

                  <Field label="Core & Coils Weight (lbs)" value={RATINGS.coreCoilsWeight} editMode={editMode} required />
                  <Field label="Oil Weight (lbs)" value={RATINGS.oilWeight} editMode={editMode} required />
                  <Field label="Case/Tank Weight (lbs)" value={RATINGS.caseTankWeight} editMode={editMode} required />
                  <Field label="Total Weight (lbs)" value={RATINGS.totalWeight} editMode={editMode} required />
                </FieldGrid>
              </Section>

              {/* ── HV RATINGS ──────────────────────────────────────────── */}
              <Section>
                <SectionHeader title="HV Ratings" confidence={96} />
                <FieldGrid>
                  <SelectField
                    label="HV Nominal Voltage"
                    value={HV.nominalVoltage}
                    editMode={editMode}
                    required
                    options={[HV.nominalVoltage, "12470Y/7200", "13800", "4160"]}
                  />
                  <SelectField
                    label="HV DY Delta"
                    value={HV.dyDelta}
                    editMode={editMode}
                    required
                    options={["Delta", "Wye", "Delta/Wye"]}
                  />
                  <Field label="HV 1 Configuration" value={HV.hv1Config} editMode={editMode} required />

                  <Field label="HV 1 Delta" value={HV.hv1Delta} editMode={editMode} required />
                  <Field label="HV 3 Configuration" value={HV.hv3Config} editMode={editMode} required />
                  <Field label="HV 2 Delta" value={HV.hv2Delta} editMode={editMode} required />

                  <Field label="HV 2 Wye" value={HV.hv2Wye} editMode={editMode} required />
                  <SwitchField label="Delta Wye" value={hvDeltaWye} editMode={editMode} onChange={setHvDeltaWye} />
                  <SwitchField label="Dual Voltage" value={hvDualVoltage} editMode={editMode} onChange={setHvDualVoltage} />

                  <Field label="HV BIL (kV)" value={HV.bil} editMode={editMode} required />
                  <SelectField
                    label="HV Winding Material"
                    value={HV.windingMaterial}
                    editMode={editMode}
                    required
                    options={["AL", "CU"]}
                  />
                  <div />
                </FieldGrid>

                {/* Tap table */}
                <div style={{ marginTop: 20 }}>
                  <TapTable taps={HV.taps} editMode={editMode} />
                </div>

                <div style={{ marginTop: 16 }}>
                  <FieldGrid>
                    <Field label="Number of Taps" value={HV.numberOfTaps} editMode={editMode} required />
                    <SelectField
                      label="Tap Configuration"
                      value={HV.tapConfig}
                      editMode={editMode}
                      required
                      options={["1A-5E", "1A-7G", "Full Range"]}
                    />
                    <Field label="Nominal Tap Position" value={HV.nominalTapPos} editMode={editMode} required />
                  </FieldGrid>
                </div>
              </Section>

              {/* ── LV RATINGS ──────────────────────────────────────────── */}
              <Section>
                <SectionHeader title="LV Ratings" confidence={54} />
                <FieldGrid>
                  <SelectField
                    label="LV Nominal Voltage"
                    value={LV.nominalVoltage}
                    editMode={editMode}
                    required
                    options={[LV.nominalVoltage, "208Y/120", "480Y/277", "240/120"]}
                  />
                  <Field label="LV 1 Configuration" value={LV.lv1Config} editMode={editMode} required />
                  <Field label="LV1 Delta" value={LV.lv1Delta} editMode={editMode} required />

                  <Field label="LV 1 Wye" value={LV.lv1Wye} editMode={editMode} required />
                  <Field label="LV 2 Configuration" value={LV.lv2Config} editMode={editMode} required />
                  <Field label="LV 2 Delta" value={LV.lv2Delta} editMode={editMode} required />

                  <Field label="LV 2 Wye" value={LV.lv2Wye} editMode={editMode} required />
                  <SwitchField label="Delta Wye" value={lvDeltaWye} editMode={editMode} onChange={setLvDeltaWye} />
                  <SwitchField label="Dual Voltage" value={lvDualVoltage} editMode={editMode} onChange={setLvDualVoltage} />

                  <Field label="LV BIL (kV)" value={LV.bil} editMode={editMode} required />
                  <SelectField
                    label="LV Winding Material"
                    value={LV.windingMaterial}
                    editMode={editMode}
                    required
                    options={["AL", "CU"]}
                  />
                  <div />
                </FieldGrid>
              </Section>

              {/* Bottom padding */}
              <div style={{ height: 80 }} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
