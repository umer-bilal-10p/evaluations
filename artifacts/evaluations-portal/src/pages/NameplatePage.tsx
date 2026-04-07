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

function ConfidenceBadge({ pct }: { pct: number }) {
  const isHigh = pct >= 90;
  const isMid = pct >= 70 && pct < 90;
  const bg = isHigh ? "#D4F7E8" : isMid ? "#FEF3C7" : "#FEE2E2";
  const color = isHigh ? "#047857" : isMid ? "#92400E" : "#DC2626";
  const border = isHigh ? "#6EE7B7" : isMid ? "#FCD34D" : "#FCA5A5";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
      background: bg, color, border: `1px solid ${border}`,
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
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
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.6 }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
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

function ReadVal({ value, muted, error }: { value: string; muted?: boolean; error?: boolean }) {
  return (
    <div style={{
      height: 36, borderRadius: 7, border: `1px solid ${error ? "#FCA5A5" : "hsl(var(--border))"}`,
      background: muted ? "hsl(var(--muted))" : error ? "#FFF1F2" : "hsl(var(--muted))",
      padding: "0 12px", display: "flex", alignItems: "center",
      fontSize: 13, color: value ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
      fontFamily: "inherit",
    }}>
      {value || "—"}
    </div>
  );
}

function AiChip({ label }: { label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4,
      fontSize: 11, color: "#0047BB", fontWeight: 500,
      background: "rgba(0,71,187,0.07)", border: "1px solid rgba(0,71,187,0.18)",
      borderRadius: 5, padding: "1px 7px",
    }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
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

function SwitchField({ label, value, editMode, onChange }: { label: string; value: boolean; editMode: boolean; onChange?: (v: boolean) => void; }) {
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
            !editMode && "opacity-100 cursor-default"
          )}
        />
        <span style={{ fontSize: 13, fontWeight: 500, color: value ? "#0047BB" : "hsl(var(--muted-foreground))" }}>
          {value ? "Yes" : "No"}
        </span>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value, required }: { label: string; value: string; required?: boolean }) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <ReadVal value={value} muted />
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
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
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
            </div>

            {/* Edit / Done button */}
            <button
              onClick={() => setEditMode((v) => !v)}
              style={{
                flexShrink: 0,
                padding: "6px 16px", borderRadius: 7,
                border: editMode ? "1px solid rgba(255,255,255,0.3)" : "1px solid #0047BB",
                background: editMode ? "rgba(255,255,255,0.08)" : "#0047BB",
                color: "#fff", fontSize: 12, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              {editMode ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Done Editing
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </>
              )}
            </button>
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

              {/* AI success banner */}
              <div style={{
                background: "#D4F7E8", border: "1px solid #6EE7B7",
                borderRadius: 8, padding: "10px 16px",
                display: "flex", alignItems: "center", gap: 10,
                marginBottom: 16, fontSize: 13, color: "#047857", fontWeight: 500,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                AI has successfully extracted data. Review and confirm the values below.
              </div>

              {/* Nameplate image card */}
              <div style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 10,
                padding: 16,
                marginBottom: 12,
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
              }}>
                {/* Image placeholder */}
                <div style={{
                  width: 120, height: 80, borderRadius: 7,
                  background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, overflow: "hidden", position: "relative",
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.4 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>

                {/* Metadata */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: 3 }}>
                    IC: {unit.icNumber}
                  </div>
                  <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginBottom: 8 }}>
                    {unit.manufacturer} · {unit.mfgSerial} · {unit.kva.toLocaleString()} kVA · Captured just now
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#047857" }}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span style={{ fontSize: 11, color: "#047857", fontWeight: 500 }}>AI extraction complete</span>
                  </div>
                </div>
              </div>

              {/* AI issue tags */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                marginBottom: 20,
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#92400E" }}>Issues detected</span>
                {["Blurry", "Underexposed", "Off angle"].map((tag) => (
                  <span key={tag} style={{
                    fontSize: 11, fontWeight: 500,
                    background: "#FEF3C7", border: "1px solid #FCD34D", color: "#92400E",
                    borderRadius: 20, padding: "1px 9px",
                  }}>
                    {tag}
                  </span>
                ))}
                <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>— may reduce AI accuracy</span>
              </div>

              {/* ── IDENTIFICATION ──────────────────────────────────────── */}
              <Section>
                <SectionHeader title="Identification" confidence={87} />
                <FieldGrid>
                  {/* Manufacturer */}
                  <div>
                    <FieldLabel label="Manufacturer" required />
                    {editMode ? (
                      <Select defaultValue={IDENTIFICATION.manufacturer}>
                        <SelectTrigger className="h-9 bg-background text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Siemens", "ABB", "Eaton", "General Electric", "Schneider Electric", "Square D"].map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <ReadVal value={IDENTIFICATION.manufacturer} />
                    )}
                  </div>

                  {/* Serial Number */}
                  <div>
                    <FieldLabel label="Serial Number" required />
                    {editMode ? (
                      <Input defaultValue={IDENTIFICATION.serialNumber} className="h-9 bg-background text-sm" />
                    ) : (
                      <ReadVal value={IDENTIFICATION.serialNumber} />
                    )}
                    <AiChip label={IDENTIFICATION.aiSerial} />
                  </div>

                  {/* Unit Type */}
                  <div>
                    <FieldLabel label="Unit Type" required />
                    {editMode ? (
                      <Select defaultValue={IDENTIFICATION.unitType}>
                        <SelectTrigger className="h-9 bg-background text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Three-Phase Pad", "Single-Phase Pad", "Pole Mount"].map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <ReadVal value={IDENTIFICATION.unitType} />
                    )}
                  </div>

                  {/* Year Manufactured */}
                  <div>
                    <FieldLabel label="Year Manufactured" required />
                    {editMode ? (
                      <Select defaultValue={IDENTIFICATION.yearManufactured}>
                        <SelectTrigger className="h-9 bg-background text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 40 }, (_, i) => String(2024 - i)).map((y) => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <ReadVal value={IDENTIFICATION.yearManufactured} />
                    )}
                  </div>
                </FieldGrid>
              </Section>

              {/* ── RATINGS ─────────────────────────────────────────────── */}
              <Section>
                <SectionHeader title="Ratings" confidence={91} />
                <FieldGrid>
                  <div>
                    <FieldLabel label="KVA Base" required />
                    {editMode ? <Input defaultValue={RATINGS.kvaBase} className="h-9 bg-background text-sm" /> : <ReadVal value={RATINGS.kvaBase} />}
                  </div>
                  <div>
                    <FieldLabel label="KVA Fan Base" required />
                    {editMode ? <Input defaultValue={RATINGS.kvaFanBase} placeholder="e.g. 2,000" className="h-9 bg-background text-sm" /> : <ReadVal value={RATINGS.kvaFanBase} />}
                  </div>
                  <div>
                    <FieldLabel label="KVA Higher Rating" required />
                    {editMode ? <Input defaultValue={RATINGS.kvaHigherRating} placeholder="e.g. 2,100" className="h-9 bg-background text-sm" /> : <ReadVal value={RATINGS.kvaHigherRating} />}
                  </div>
                  <div>
                    <FieldLabel label="KVA Fan Higher Rating" required />
                    {editMode ? <Input defaultValue={RATINGS.kvaFanHigherRating} placeholder="e.g. 2,200" className="h-9 bg-background text-sm" /> : <ReadVal value={RATINGS.kvaFanHigherRating} />}
                  </div>
                  <div>
                    <FieldLabel label="Cooling Class" required />
                    {editMode ? (
                      <Select defaultValue={RATINGS.coolingClass}>
                        <SelectTrigger className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["ONAN", "ONAF", "ONAN/ONAF", "OFAF", "ODAF"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <ReadVal value={RATINGS.coolingClass} />}
                  </div>
                  <div>
                    <FieldLabel label="Rise (°C)" required />
                    {editMode ? <Input defaultValue={RATINGS.rise} className="h-9 bg-background text-sm" /> : <ReadVal value={RATINGS.rise} />}
                  </div>
                  <div>
                    <FieldLabel label="Frequency" required />
                    {editMode ? <Input defaultValue={RATINGS.frequency} className="h-9 bg-background text-sm" /> : <ReadVal value={RATINGS.frequency} />}
                  </div>
                  <div>
                    <FieldLabel label="Impedance %" required />
                    {editMode ? <Input defaultValue={RATINGS.impedance} className="h-9 bg-background text-sm" /> : <ReadVal value={RATINGS.impedance} />}
                  </div>
                  <div>
                    <FieldLabel label="Oil Type" required />
                    {editMode ? (
                      <Select defaultValue={RATINGS.oilType}>
                        <SelectTrigger className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Mineral Oil", "Silicone", "Natural Ester", "Synthetic Ester"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <ReadVal value={RATINGS.oilType} />}
                  </div>

                  {/* Oil Volume — validation error */}
                  <div>
                    <FieldLabel label="Oil Volume (Gallons)" required />
                    {editMode ? (
                      <Input defaultValue={RATINGS.oilVolume} className="h-9 bg-background text-sm border-red-400 focus-visible:ring-red-400" />
                    ) : (
                      <ReadVal value={RATINGS.oilVolume} error />
                    )}
                    <ErrorMsg msg={RATINGS.oilVolumeError} />
                  </div>

                  <div>
                    <FieldLabel label="Core &amp; Coils Weight (lbs)" required />
                    {editMode ? <Input defaultValue={RATINGS.coreCoilsWeight} className="h-9 bg-background text-sm" /> : <ReadVal value={RATINGS.coreCoilsWeight} />}
                  </div>
                  <div>
                    <FieldLabel label="Oil Weight (lbs)" required />
                    {editMode ? <Input defaultValue={RATINGS.oilWeight} className="h-9 bg-background text-sm" /> : <ReadVal value={RATINGS.oilWeight} />}
                  </div>
                  <div>
                    <FieldLabel label="Case/Tank Weight (lbs)" required />
                    {editMode ? <Input defaultValue={RATINGS.caseTankWeight} className="h-9 bg-background text-sm" /> : <ReadVal value={RATINGS.caseTankWeight} />}
                  </div>
                  <div>
                    <FieldLabel label="Total Weight (lbs)" required />
                    {editMode ? <Input defaultValue={RATINGS.totalWeight} className="h-9 bg-background text-sm" /> : <ReadVal value={RATINGS.totalWeight} />}
                  </div>
                </FieldGrid>
              </Section>

              {/* ── HV RATINGS ──────────────────────────────────────────── */}
              <Section>
                <SectionHeader title="HV Ratings" confidence={96} />
                <FieldGrid>
                  <div>
                    <FieldLabel label="HV Nominal Voltage" required />
                    {editMode ? (
                      <Select defaultValue={HV.nominalVoltage}>
                        <SelectTrigger className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[HV.nominalVoltage, "12470Y/7200", "13800", "4160"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <ReadVal value={HV.nominalVoltage} />}
                  </div>
                  <div>
                    <FieldLabel label="HV DY Delta" required />
                    {editMode ? (
                      <Select defaultValue={HV.dyDelta}>
                        <SelectTrigger className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Delta", "Wye", "Delta/Wye"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <ReadVal value={HV.dyDelta} />}
                  </div>
                  <ReadOnlyField label="HV 1 Configuration" value={HV.hv1Config} required />

                  <div>
                    <FieldLabel label="HV 1 Delta" required />
                    {editMode ? <Input defaultValue={HV.hv1Delta} className="h-9 bg-background text-sm" /> : <ReadVal value={HV.hv1Delta} />}
                  </div>
                  <ReadOnlyField label="HV 3 Configuration" value={HV.hv3Config} required />
                  <div>
                    <FieldLabel label="HV 2 Delta" required />
                    {editMode ? <Input defaultValue={HV.hv2Delta} className="h-9 bg-background text-sm" /> : <ReadVal value={HV.hv2Delta} />}
                  </div>

                  <div>
                    <FieldLabel label="HV 2 Wye" required />
                    {editMode ? <Input defaultValue={HV.hv2Wye} className="h-9 bg-background text-sm" /> : <ReadVal value={HV.hv2Wye} />}
                  </div>
                  <SwitchField label="Delta Wye" value={hvDeltaWye} editMode={editMode} onChange={setHvDeltaWye} />
                  <SwitchField label="Dual Voltage" value={hvDualVoltage} editMode={editMode} onChange={setHvDualVoltage} />

                  <div>
                    <FieldLabel label="HV BIL (kV)" required />
                    {editMode ? <Input defaultValue={HV.bil} className="h-9 bg-background text-sm" /> : <ReadVal value={HV.bil} />}
                  </div>
                  <div>
                    <FieldLabel label="HV Winding Material" required />
                    {editMode ? (
                      <Select defaultValue={HV.windingMaterial}>
                        <SelectTrigger className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["AL", "CU"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <ReadVal value={HV.windingMaterial} />}
                  </div>
                  <div />
                </FieldGrid>

                {/* Tap table */}
                <div style={{ marginTop: 20 }}>
                  <TapTable taps={HV.taps} editMode={editMode} />
                </div>

                <div style={{ marginTop: 16 }}>
                  <FieldGrid>
                    <div>
                      <FieldLabel label="Number of Taps" required />
                      {editMode ? <Input defaultValue={HV.numberOfTaps} className="h-9 bg-background text-sm" /> : <ReadVal value={HV.numberOfTaps} />}
                    </div>
                    <div>
                      <FieldLabel label="Tap Configuration" required />
                      {editMode ? (
                        <Select defaultValue={HV.tapConfig}>
                          <SelectTrigger className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["1A-5E", "1A-7G", "Full Range"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : <ReadVal value={HV.tapConfig} />}
                    </div>
                    <div>
                      <FieldLabel label="Nominal Tap Position" required />
                      {editMode ? <Input defaultValue={HV.nominalTapPos} className="h-9 bg-background text-sm" /> : <ReadVal value={HV.nominalTapPos} />}
                    </div>
                  </FieldGrid>
                </div>
              </Section>

              {/* ── LV RATINGS ──────────────────────────────────────────── */}
              <Section>
                <SectionHeader title="LV Ratings" confidence={54} />
                <FieldGrid>
                  <div style={{ gridColumn: "1 / span 1" }}>
                    <FieldLabel label="LV Nominal Voltage" required />
                    {editMode ? (
                      <Select defaultValue={LV.nominalVoltage}>
                        <SelectTrigger className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[LV.nominalVoltage, "208Y/120", "480Y/277", "240/120"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <ReadVal value={LV.nominalVoltage} />}
                  </div>
                  <ReadOnlyField label="LV 1 Configuration" value={LV.lv1Config} required />
                  <div>
                    <FieldLabel label="LV1 Delta" required />
                    {editMode ? <Input defaultValue={LV.lv1Delta} className="h-9 bg-background text-sm" /> : <ReadVal value={LV.lv1Delta} />}
                  </div>

                  <div>
                    <FieldLabel label="LV 1 Wye" required />
                    {editMode ? <Input defaultValue={LV.lv1Wye} className="h-9 bg-background text-sm" /> : <ReadVal value={LV.lv1Wye} />}
                  </div>
                  <ReadOnlyField label="LV 2 Configuration" value={LV.lv2Config} required />
                  <div>
                    <FieldLabel label="LV 2 Delta" required />
                    {editMode ? <Input defaultValue={LV.lv2Delta} className="h-9 bg-background text-sm" /> : <ReadVal value={LV.lv2Delta} />}
                  </div>

                  <div>
                    <FieldLabel label="LV 2 Wye" required />
                    {editMode ? <Input defaultValue={LV.lv2Wye} className="h-9 bg-background text-sm" /> : <ReadVal value={LV.lv2Wye} />}
                  </div>
                  <SwitchField label="Delta Wye" value={lvDeltaWye} editMode={editMode} onChange={setLvDeltaWye} />
                  <SwitchField label="Dual Voltage" value={lvDualVoltage} editMode={editMode} onChange={setLvDualVoltage} />

                  <div>
                    <FieldLabel label="LV BIL (kV)" required />
                    {editMode ? <Input defaultValue={LV.bil} className="h-9 bg-background text-sm" /> : <ReadVal value={LV.bil} />}
                  </div>
                  <div>
                    <FieldLabel label="LV Winding Material" required />
                    {editMode ? (
                      <Select defaultValue={LV.windingMaterial}>
                        <SelectTrigger className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["AL", "CU"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <ReadVal value={LV.windingMaterial} />}
                  </div>
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
