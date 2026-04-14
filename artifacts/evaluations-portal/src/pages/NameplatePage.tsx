import { useState, useEffect, useRef } from "react";
import { PortalHeader } from "@/components/PortalHeader";
import { Sidebar } from "@/components/Sidebar";
import { useDemoContext } from "@/context/DemoContext";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkle, Sparkles, Flag } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  kvaFanBase: "2,100",
  kvaHigher: "2,100",
  kvaFanHigher: "2,500",
  coolingClass: "ONAN",
  rise: "65",
  frequency: "60",
  impedancePct: "5.75",
  oilType: "Mineral Oil",
  oilVolume: "210",
  oilVolumeError: "Exceeds max capacity for ONAN 1,750 kVA (220 gal)",
  coreCoilsWeight: "6,120",
  oilWeight: "2,380",
  caseTankWeight: "2,840",
  totalWeight: "11,340",
};

const HV = {
  nominalVoltage: "12470GRDY/7200",
  hv1Config: "GrdY",
  hv2Config: "DELTA",
  deltaWye: true,
  dualVoltage: true,
  hv1DyDelta: "12,470",
  hv1Delta: "12,470",
  hv1Wye: "7,200",
  hv2DyDelta: "12,470",
  hv2Delta: "12,470",
  hv2Wye: "7,200",
  bil: "110",
  windingMaterial: "AL",
  taps: [
    { label: "1/A", hvVoltage: "12,979", percentage: "104.08" },
    { label: "2/B", hvVoltage: "12,724", percentage: "102.04" },
    { label: "3/C", hvVoltage: "12,470", percentage: "100.00" },
    { label: "4/D", hvVoltage: "12,219", percentage: "97.99" },
    { label: "5/E", hvVoltage: "11,961", percentage: "95.92" },
  ],
  tapConfig: "+/-5%",
  numberOfTaps: "5",
  nominalTapPosition: "3",
};

const LV = {
  nominalVoltage: "480GRDY/277",
  lv1Config: "GrdY",
  lv2Config: "GrdY",
  deltaWye: false,
  dualVoltage: true,
  lv1DyDelta: "",
  lv1Delta: "480",
  lv1Wye: "277",
  lv2DyDelta: "",
  lv2Delta: "240",
  lv2Wye: "138",
  bil: "30",
  windingMaterial: "AL",
  lvBaseVoltage: "480",
};

const YEAR_OPTIONS = Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => String(new Date().getFullYear() - i));
const TAP_LABELS = ["1/A","2/B","3/C","4/D","5/E","6/F","7/G"];

/* ─── Voltage formatting helper ─────────────────────────────────────────────── */
function fmtV(raw: number | string): string {
  const n = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/,/g, ""));
  return isNaN(n) ? "" : n.toLocaleString("en-US");
}

/* ─── Nominal voltage parsers ──────────────────────────────────────────────── */
interface HVParsed {
  hv1Config: string; hv1Delta: string; hv1Wye: string;
  hv2Config: string; hv2Delta: string; hv2Wye: string;
  dualVoltage: boolean;
}

function parseHvNominal(v: string): HVParsed | null {
  let m: RegExpMatchArray | null;
  // "NGRDY/M X PGRDY/Q"
  m = v.match(/^(\d+)GRDY\/(\d+)\s+X\s+(\d+)GRDY\/(\d+)$/);
  if (m) return { hv1Config:"GrdY", hv1Delta:fmtV(m[1]), hv1Wye:fmtV(m[2]), hv2Config:"GrdY", hv2Delta:fmtV(m[3]), hv2Wye:fmtV(m[4]), dualVoltage:true };
  // "N/MY/P X Q/RY/S"
  m = v.match(/^(\d+)\/(\d+)Y\/(\d+)\s+X\s+(\d+)\/(\d+)Y\/(\d+)$/);
  if (m) return { hv1Config:"DELTA", hv1Delta:fmtV(m[1]), hv1Wye:"", hv2Config:"GrdY", hv2Delta:fmtV(m[5]), hv2Wye:fmtV(m[6]), dualVoltage:true };
  // "N/MY/P" — DELTA hv1 + GrdY hv2, dual
  m = v.match(/^(\d+)\/(\d+)Y\/(\d+)$/);
  if (m) return { hv1Config:"DELTA", hv1Delta:fmtV(m[1]), hv1Wye:"", hv2Config:"GrdY", hv2Delta:fmtV(m[2]), hv2Wye:fmtV(m[3]), dualVoltage:true };
  // "NGRDY/M" — single GrdY
  m = v.match(/^(\d+)GRDY\/(\d+)$/);
  if (m) return { hv1Config:"GrdY", hv1Delta:fmtV(m[1]), hv1Wye:fmtV(m[2]), hv2Config:"", hv2Delta:"", hv2Wye:"", dualVoltage:false };
  // Plain number — single DELTA
  m = v.match(/^(\d+)$/);
  if (m) return { hv1Config:"DELTA", hv1Delta:fmtV(m[1]), hv1Wye:"", hv2Config:"", hv2Delta:"", hv2Wye:"", dualVoltage:false };
  return null;
}

interface LVParsed {
  lv1Config: string; lv1Delta: string; lv1Wye: string;
  lv2Config: string; lv2Delta: string; lv2Wye: string;
  dualVoltage: boolean; lvBaseVoltage: string;
}

function parseLvNominal(v: string): LVParsed | null {
  let m: RegExpMatchArray | null;
  // "NGRDY/M X PGRDY/Q"
  m = v.match(/^(\d+)GRDY\/(\d+)\s+X\s+(\d+)GRDY\/(\d+)$/);
  if (m) return { lv1Config:"GrdY", lv1Delta:m[1], lv1Wye:m[2], lv2Config:"GrdY", lv2Delta:m[3], lv2Wye:m[4], dualVoltage:true, lvBaseVoltage:m[1] };
  // "N X M" — two plain deltas
  m = v.match(/^(\d+)\s+X\s+(\d+)$/);
  if (m) return { lv1Config:"DELTA", lv1Delta:m[1], lv1Wye:"", lv2Config:"DELTA", lv2Delta:m[2], lv2Wye:"", dualVoltage:true, lvBaseVoltage:m[1] };
  // "NGRDY/M"
  m = v.match(/^(\d+)GRDY\/(\d+)$/);
  if (m) return { lv1Config:"GrdY", lv1Delta:m[1], lv1Wye:m[2], lv2Config:"", lv2Delta:"", lv2Wye:"", dualVoltage:false, lvBaseVoltage:m[1] };
  // Plain number
  m = v.match(/^(\d+)$/);
  if (m) return { lv1Config:"DELTA", lv1Delta:m[1], lv1Wye:"", lv2Config:"", lv2Delta:"", lv2Wye:"", dualVoltage:false, lvBaseVoltage:m[1] };
  return null;
}

/* ─── Sub-components ────────────────────────────────────────────────────────── */

function ConfidenceBadge({ pct }: { pct: number }) {
  const isHigh = pct >= 60;
  return (
    <Badge
      className={cn(
        "gap-1.5 rounded-full font-semibold text-xs px-2.5 py-0.5",
        isHigh
          ? "border-[rgba(124,58,237,0.28)] bg-[rgba(124,58,237,0.10)] text-[#7C3AED] dark:border-[rgba(167,139,250,0.38)] dark:bg-[rgba(139,92,246,0.18)] dark:text-[#c4b5fd]"
          : "border-[#FCD34D] bg-[#FEF3C7] text-[#92400E] dark:border-[rgba(252,211,77,0.42)] dark:bg-[rgba(251,191,36,0.18)] dark:text-[#FCD34D]",
      )}
    >
      <Sparkles size={11} strokeWidth={1.75} />
      AI was {pct}% Confident
    </Badge>
  );
}

function SectionHeader({ title, confidence }: { title: string; confidence: number }) {
  return (
    <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <ConfidenceBadge pct={confidence} />
    </div>
  );
}

function AiChip({ label }: { label: string }) {
  return (
    <Badge
      className="mt-1 gap-1 rounded-md text-xs font-medium px-1.5 py-0.5 border-[rgba(124,58,237,0.22)] bg-[rgba(124,58,237,0.08)] text-[#7C3AED] dark:border-[rgba(167,139,250,0.38)] dark:bg-[rgba(139,92,246,0.18)] dark:text-[#c4b5fd]"
    >
      <Sparkle size={10} strokeWidth={1.75} />
      AI: {label}
    </Badge>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <span className="block mt-1 text-xs text-destructive">⚠ {msg}</span>
  );
}

/* ─── Unified Field ──────────────────────────────────────────────────────────── */
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
  );
}

function Field({
  label, value, editMode, required, error, placeholder, onChange,
}: {
  label: string; value: string; editMode: boolean; required?: boolean; error?: boolean; placeholder?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <Input
        value={onChange !== undefined ? value : undefined}
        defaultValue={onChange === undefined ? value : undefined}
        readOnly={!editMode}
        placeholder={editMode ? placeholder : undefined}
        onChange={onChange && editMode ? (e) => onChange(e.target.value) : undefined}
        className={cn(
          "h-9 text-sm shadow-none",
          !editMode && "bg-muted/40 cursor-default focus-visible:ring-0 focus-visible:ring-offset-0",
          editMode && "bg-background",
          error && editMode && "border-red-400 focus-visible:ring-red-400",
        )}
      />
    </div>
  );
}

/* ─── Unified Select ─────────────────────────────────────────────────────────── */
function SelectField({
  label, value, editMode, required, options, onChange,
}: {
  label: string; value: string; editMode: boolean; required?: boolean; options: string[];
  onChange?: (v: string) => void;
}) {
  if (!editMode) {
    return (
      <div>
        <FieldLabel label={label} required={required} />
        <Input value={value || "—"} readOnly className="h-9 text-sm shadow-none bg-muted/40 cursor-default focus-visible:ring-0 focus-visible:ring-offset-0" />
      </div>
    );
  }
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <Select
        value={onChange !== undefined ? value : undefined}
        defaultValue={onChange === undefined ? value : undefined}
        onValueChange={onChange}
      >
        <SelectTrigger className="h-9 bg-background text-sm shadow-none">
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
  label, value, editMode, onChange,
}: {
  label: string; value: boolean; editMode: boolean; onChange?: (v: boolean) => void;
}) {
  return (
    <div>
      <FieldLabel label={label} required />
      <div className="flex items-center gap-2 h-9">
        <Switch
          checked={value}
          onCheckedChange={editMode ? onChange : undefined}
          disabled={!editMode}
          className={cn("data-[state=checked]:bg-[#0047BB]", !editMode && "opacity-100 cursor-default")}
        />
        <span className={cn(
          "text-sm font-medium",
          value ? "text-[#0047BB] dark:text-[#93C5FD]" : "text-muted-foreground",
        )}>
          {value ? "Yes" : "No"}
        </span>
      </div>
    </div>
  );
}

/* ─── Section wrapper ───────────────────────────────────────────────────────── */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <Card className="mb-4 shadow-none rounded-xl">
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

function FieldGrid({ children, cols = 3, className }: { children: React.ReactNode; cols?: number; className?: string }) {
  return (
    <div className={className} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "16px 20px" }}>
      {children}
    </div>
  );
}

/* ─── Paired toggles (Delta Wye + Dual Voltage in one 1/3-col slot) ─────────── */
function PairedToggles({
  leftLabel, leftValue, rightLabel, rightValue,
  editMode, onLeftChange, onRightChange, rightDisabled,
}: {
  leftLabel: string; leftValue: boolean;
  rightLabel: string; rightValue: boolean;
  editMode: boolean;
  onLeftChange?: (v: boolean) => void;
  onRightChange?: (v: boolean) => void;
  rightDisabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col flex-1 min-w-0">
        <FieldLabel label={leftLabel} />
        <div className="flex items-center h-9 gap-1.5">
          <Switch
            checked={leftValue}
            onCheckedChange={editMode ? onLeftChange : undefined}
            disabled={!editMode}
            className={cn("data-[state=checked]:bg-[#0047BB]", !editMode && "opacity-100 cursor-default")}
          />
          <span className={cn("text-xs font-medium", leftValue ? "text-[#0047BB] dark:text-[#93C5FD]" : "text-muted-foreground")}>
            {leftValue ? "On" : "Off"}
          </span>
        </div>
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <FieldLabel label={rightLabel} />
        <div className="flex items-center h-9 gap-1.5">
          <Switch
            checked={rightValue}
            onCheckedChange={(editMode && !rightDisabled) ? onRightChange : undefined}
            disabled={!editMode || rightDisabled}
            className={cn("data-[state=checked]:bg-[#0047BB]", (!editMode || rightDisabled) && "opacity-100 cursor-default")}
          />
          <span className={cn("text-xs font-medium", rightValue ? "text-[#0047BB] dark:text-[#93C5FD]" : "text-muted-foreground")}>
            {rightValue ? "On" : "Off"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Tap table ─────────────────────────────────────────────────────────────── */
function computeTapPercentage(tapConfig: string, numTaps: number, tapIndex: number, nominalPos?: number): string | null {
  if (numTaps <= 0) return "100.00";
  if (numTaps === 1) return "100.00";
  const nom = (nominalPos != null && nominalPos >= 1 && nominalPos <= numTaps) ? nominalPos : Math.ceil(numTaps / 2);
  const pmMatch = tapConfig.match(/^\+\/-(\d+(?:\.\d+)?)%$/);
  const minusMatch = tapConfig.match(/^-(\d+(?:\.\d+)?)%$/);
  if (pmMatch) {
    const half = parseFloat(pmMatch[1]);
    const stepsAbove = nom - 1;
    const step = stepsAbove > 0 ? half / stepsAbove : 0;
    const pct = 100 + (nom - tapIndex) * step;
    return pct.toFixed(2);
  }
  if (minusMatch) {
    const range = parseFloat(minusMatch[1]);
    const stepsBelow = numTaps - nom;
    const step = stepsBelow > 0 ? range / stepsBelow : 0;
    const pct = 100 - (tapIndex - nom) * step;
    return pct.toFixed(2);
  }
  return null;
}

function buildTapRows(
  tapCfg: string,
  numTaps: number,
  nominalPos: number,
  nominalDeltaStr: string,
): Array<{ label: string; hvVoltage: string; percentage: string }> {
  const delta = parseFloat(nominalDeltaStr.replace(/,/g, ""));
  return Array.from({ length: numTaps }, (_, i) => {
    const pct = parseFloat(computeTapPercentage(tapCfg, numTaps, i + 1, nominalPos) ?? "100");
    const voltage = !isNaN(delta) ? Math.round(delta * pct / 100).toLocaleString("en-US") : "";
    return { label: TAP_LABELS[i] ?? `${i + 1}`, hvVoltage: voltage, percentage: pct.toFixed(2) };
  });
}

function TapTable({
  taps, editMode, readonly, tapConfig, numberOfTaps,
}: {
  taps: typeof HV.taps;
  editMode: boolean;
  readonly?: boolean;
  tapConfig: string;
  numberOfTaps: string;
}) {
  const numTaps = parseInt(numberOfTaps) || 0;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Tap Voltage &amp; Percentage
      </p>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider w-16">TAP</TableHead>
              <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider">HV Voltage</TableHead>
              <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider">Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taps.map((row, idx) => {
              const computed = tapConfig !== "Custom"
                ? computeTapPercentage(tapConfig, numTaps, idx + 1)
                : null;
              const displayPct = computed ?? row.percentage;
              return (
                <TableRow key={row.label} className="hover:bg-muted/30">
                  <TableCell className="font-semibold text-sm py-2">{row.label}</TableCell>
                  <TableCell className="text-sm py-2">
                    {editMode && !readonly ? (
                      <Input defaultValue={row.hvVoltage} className="h-7 text-xs bg-background max-w-[100px] shadow-none" />
                    ) : row.hvVoltage}
                  </TableCell>
                  <TableCell className="text-sm font-medium py-2 text-foreground">
                    {editMode && !readonly ? (
                      <Input defaultValue={displayPct} className="h-7 text-xs bg-background max-w-[80px] shadow-none" />
                    ) : displayPct}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
      <div style={{
        position: "absolute", top: fs(6), right: fs(6),
        background: "rgba(0,71,187,0.92)", borderRadius: fs(5),
        padding: `${fs(2)}px ${fs(6)}px`,
        fontSize: fs(9), fontWeight: 700, color: "#fff",
        letterSpacing: "0.05em", boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
      }}>
        IC {icNumber}
      </div>
      <div style={{ position: "absolute", bottom: fs(5), left: fs(6), display: "flex", alignItems: "center", gap: fs(3) }}>
        <div style={{ width: fs(6), height: fs(6), borderRadius: "50%", background: "#FBBF24" }} />
        <span style={{ fontSize: fs(7), fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Low quality</span>
      </div>
      <div style={{ position: "absolute", bottom: fs(5), right: fs(6), fontSize: fs(7), color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>
        {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>
    </>
  );
}

/* ─── Nameplate image card ───────────────────────────────────────────────────── */
function NameplateImageCard({ icNumber, manufacturer, mfgSerial, kva }: {
  icNumber: string; manufacturer: string; mfgSerial: string; kva: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = "/nameplate.png";
    a.download = `nameplate-IC${icNumber}.png`;
    a.click();
  };

  return (
    <>
      <Card className="mb-3 shadow-none">
        <CardContent className="p-4 flex gap-4 items-start">
          {/* Thumbnail */}
          <div
            onClick={() => setExpanded(true)}
            className="relative flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border border-border"
            style={{ width: 200, height: 140 }}
          >
            <img
              src="/nameplate.png"
              alt="Nameplate scan"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded flex items-center justify-center text-white/85"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground mb-0.5">IC: {icNumber}</p>
              <p className="text-xs text-muted-foreground">{manufacturer} · {mfgSerial} · {kva.toLocaleString()} kVA</p>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7C3AED] dark:text-[#c4b5fd] flex-shrink-0">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/>
                <path d="M3 9h2M3 15h2M19 9h2M19 15h2M9 3v2M15 3v2M9 19v2M15 19v2"/>
              </svg>
              <span className="text-xs text-[#7C3AED] dark:text-[#c4b5fd] font-medium">AI was used to scan Nameplate</span>
            </div>
            <div className="flex flex-wrap gap-1 items-center">
              {["Blurry", "Underexposed", "Off angle"].map((tag) => (
                <Badge key={tag} className="rounded-full text-[10px] font-medium border-[#FCD34D] bg-[#FEF3C7] text-[#92400E] dark:border-[rgba(252,211,77,0.42)] dark:bg-[rgba(251,191,36,0.18)] dark:text-[#FCD34D] px-2 py-0">
                  {tag}
                </Badge>
              ))}
              <span className="text-xs text-[#92400E] dark:text-[#FCD34D]">
                — Image quality issues were detected, AI accuracy was likely impacted.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expanded modal */}
      {expanded && (
        <div
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }}
        >
          <div onClick={(e) => e.stopPropagation()} className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(false)}
              className="absolute -top-10 left-0 text-white/70 hover:text-white hover:bg-white/10 gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="5" x2="5" y2="19"/><line x1="5" y1="5" x2="19" y2="19"/>
              </svg>
              Close
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="absolute -top-10 right-0 text-white border-white/20 bg-white/12 hover:bg-white/20 gap-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </Button>
            <div className="rounded-xl overflow-hidden relative border border-white/15"
              style={{ maxWidth: 800, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
              <img
                src="/nameplate.png"
                alt="Nameplate scan"
                style={{ display: "block", maxWidth: "80vw", maxHeight: "70vh", objectFit: "contain" }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Evaluation stepper ────────────────────────────────────────────────────── */
const EVAL_STEPS = [
  {
    id: "nameplate", label: "Nameplate",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
  },
  {
    id: "electrical", label: "Electrical",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    id: "condition", label: "Condition",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    id: "dimensions", label: "Dimensions",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="7" width="22" height="10" rx="2"/>
        <line x1="7" y1="7" x2="7" y2="17"/>
        <line x1="11" y1="7" x2="11" y2="12"/>
        <line x1="15" y1="7" x2="15" y2="17"/>
        <line x1="19" y1="7" x2="19" y2="12"/>
      </svg>
    ),
  },
  {
    id: "configuration", label: "Configuration",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
        <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
        <line x1="1" y1="14" x2="7" y2="14"/>
        <line x1="9" y1="8" x2="15" y2="8"/>
        <line x1="17" y1="16" x2="23" y2="16"/>
      </svg>
    ),
  },
  {
    id: "accessories", label: "Accessories",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    id: "photos", label: "Photos",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    ),
  },
  {
    id: "final-report", label: "Final Report",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
];

function EvalStepper({
  activeStep,
  completedSteps,
  onStepClick,
  onToggleComplete,
}: {
  activeStep: number;
  completedSteps: Set<number>;
  onStepClick: (i: number) => void;
  onToggleComplete: (i: number) => void;
}) {
  return (
    <div className="flex flex-col">
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>
        Evaluation Steps
      </p>

      {EVAL_STEPS.map((step, i) => {
        const done = completedSteps.has(i);
        const active = activeStep === i;
        return (
          <div key={step.id}>
            {/* Connector line between steps */}
            {i > 0 && (
              <div style={{ display: "flex", paddingLeft: 11 }}>
                <div style={{
                  width: 2, height: 18,
                  background: completedSteps.has(i - 1) ? "#0047BB" : "rgba(255,255,255,0.12)",
                  transition: "background 0.3s",
                }} />
              </div>
            )}

            {/* Step row — circle + label + status all on one aligned row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Circle toggle */}
              <button
                onClick={() => onToggleComplete(i)}
                title={done ? "Mark incomplete" : "Mark complete"}
                style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  border: done ? "none" : active ? "2px solid #5b9cf6" : "2px solid rgba(255,255,255,0.18)",
                  background: done ? "#0047BB" : active ? "rgba(91,156,246,0.15)" : "transparent",
                  color: done ? "#fff" : active ? "#5b9cf6" : "rgba(255,255,255,0.5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                {step.icon}
              </button>

              {/* Label */}
              <button
                onClick={() => onStepClick(i)}
                style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <span style={{
                  fontSize: 12, fontWeight: active ? 600 : 400,
                  color: active ? "#5b9cf6" : "rgba(255,255,255,0.85)",
                  transition: "color 0.15s",
                }}>
                  {step.label}
                </span>
              </button>

              {/* Right status indicator */}
              {done ? (
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  background: "#16a34a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : active ? (
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: "#5b9cf6",
                  boxShadow: "0 0 0 3px rgba(91,156,246,0.25)",
                }} />
              ) : null}
            </div>
          </div>
        );
      })}

    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function NameplatePage() {
  const { selectedUnit, setCurrentPage } = useDemoContext();
  const [editMode, setEditMode] = useState(false);
  const [supervisorComments, setSupervisorComments] = useState([
    { initials: "MC", color: "#0047BB", name: "Michael Chen", role: "Senior Evaluator", time: "2 hours ago", text: "Oil volume reading of 210 gallons appears low for this unit. The standard capacity for ONAN 1,750 kVA is 220 gal. Please verify against the physical nameplate before finalizing." },
    { initials: "SR", color: "#047857", name: "Sandra Rivera", role: "QA Supervisor", time: "45 min ago", text: "Confirmed HV nominal voltage matches the 12,470D configuration. All tap values look correct per the engineering spec sheet." },
  ]);
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [editingCommentIdx, setEditingCommentIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  /* ── Toggle state ── */
  const [hvDeltaWye, setHvDeltaWye] = useState(HV.deltaWye);
  const [hvDualVoltage, setHvDualVoltage] = useState(HV.dualVoltage);
  const [lvDeltaWye, setLvDeltaWye] = useState(LV.deltaWye);
  const [lvDualVoltage, setLvDualVoltage] = useState(LV.dualVoltage);

  /* ── HV rating state ── */
  const [hvNominal, setHvNominal] = useState(HV.nominalVoltage);
  const [hv1Config, setHv1Config] = useState(HV.hv1Config);
  const [hv1Delta, setHv1Delta] = useState(HV.hv1Delta);
  const [hv1Wye, setHv1Wye] = useState(HV.hv1Wye);
  const [hv1DyDelta, setHv1DyDelta] = useState(HV.hv1DyDelta);
  const [hv2Config, setHv2Config] = useState(HV.hv2Config);
  const [hv2Delta, setHv2Delta] = useState(HV.hv2Delta);
  const [hv2Wye, setHv2Wye] = useState(HV.hv2Wye);
  const [hv2DyDelta, setHv2DyDelta] = useState(HV.hv2DyDelta);
  const [hvBil, setHvBil] = useState(HV.bil);
  const [hvWindingMaterial, setHvWindingMaterial] = useState(HV.windingMaterial === "AL" ? "Aluminum" : HV.windingMaterial === "CU" ? "Copper" : "Unknown");

  /* ── Tap state ── */
  const [tapConfig, setTapConfig] = useState(HV.tapConfig);
  const [numberOfTaps, setNumberOfTaps] = useState(HV.numberOfTaps);
  const [nominalTapPosition, setNominalTapPosition] = useState(HV.nominalTapPosition);
  const [tapRows, setTapRows] = useState<Array<{ label: string; hvVoltage: string; percentage: string }>>(HV.taps);

  /* ── LV rating state ── */
  const [lvNominal, setLvNominal] = useState(LV.nominalVoltage);
  const [lv1Config, setLv1Config] = useState(LV.lv1Config);
  const [lv1Delta, setLv1Delta] = useState(LV.lv1Delta);
  const [lv1Wye, setLv1Wye] = useState(LV.lv1Wye);
  const [lv1DyDelta, setLv1DyDelta] = useState(LV.lv1DyDelta);
  const [lv2Config, setLv2Config] = useState(LV.lv2Config);
  const [lv2Delta, setLv2Delta] = useState(LV.lv2Delta);
  const [lv2Wye, setLv2Wye] = useState(LV.lv2Wye);
  const [lv2DyDelta, setLv2DyDelta] = useState(LV.lv2DyDelta);
  const [lvBil, setLvBil] = useState(LV.bil);
  const [lvWindingMaterial, setLvWindingMaterial] = useState(LV.windingMaterial === "AL" ? "Aluminum" : "Unknown");
  const [lvBaseVoltage, setLvBaseVoltage] = useState(LV.lvBaseVoltage);

  /* ── Derive HV sub-fields from Nominal Voltage selection ── */
  const handleHvNominalChange = (v: string) => {
    setHvNominal(v);
    const p = parseHvNominal(v);
    if (!p) return;
    setHv1Config(p.hv1Config);
    setHv1Delta(p.hv1Delta);
    setHv1Wye(p.hv1Wye);
    setHv1DyDelta(p.hv1Config === "DELTA" ? p.hv1Delta : "");
    setHv2Config(p.hv2Config);
    setHv2Delta(p.hv2Delta);
    setHv2Wye(p.hv2Wye);
    setHv2DyDelta(p.hv2Config === "DELTA" ? p.hv2Delta : "");
    setHvDualVoltage(p.dualVoltage);
  };

  /* ── Derive LV sub-fields from Nominal Voltage selection ── */
  const handleLvNominalChange = (v: string) => {
    setLvNominal(v);
    const p = parseLvNominal(v);
    if (!p) return;
    setLv1Config(p.lv1Config);
    setLv1Delta(p.lv1Delta);
    setLv1Wye(p.lv1Wye);
    setLv1DyDelta(p.lv1Config === "DELTA" ? p.lv1Delta : "");
    setLv2Config(p.lv2Config);
    setLv2Delta(p.lv2Delta);
    setLv2Wye(p.lv2Wye);
    setLv2DyDelta(p.lv2Config === "DELTA" ? p.lv2Delta : "");
    setLvDualVoltage(p.dualVoltage);
    setLvBaseVoltage(p.lvBaseVoltage);
  };

  /* ── LV Dual Voltage mirrors HV ── */
  useEffect(() => {
    if (!hvDualVoltage) setLvDualVoltage(false);
  }, [hvDualVoltage]);

  /* ── Integral Delta Wye: lock on when configs differ in dual-voltage mode ── */
  useEffect(() => {
    if (hvDualVoltage && hv1Config && hv2Config && hv1Config !== hv2Config) setHvDeltaWye(true);
  }, [hvDualVoltage, hv1Config, hv2Config]);

  useEffect(() => {
    if (lvDualVoltage && lv1Config && lv2Config && lv1Config !== lv2Config) setLvDeltaWye(true);
  }, [lvDualVoltage, lv1Config, lv2Config]);

  /* ── Recompute tap rows whenever anything that drives them changes ── */
  useEffect(() => {
    if (tapConfig === "Custom" || tapConfig === "None") return;
    const n = parseInt(numberOfTaps, 10);
    if (!n || n <= 0) return;
    const nom = parseInt(nominalTapPosition, 10) || Math.ceil(n / 2);
    const refDelta = hvDualVoltage ? hv2Delta : hv1Delta;
    setTapRows(buildTapRows(tapConfig, n, nom, refDelta));
  }, [tapConfig, numberOfTaps, nominalTapPosition, hv1Delta, hv2Delta, hvDualVoltage]);

  /* Stepper state */
  const [activeStep, setActiveStep]       = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  /* Section refs for scroll-to + IntersectionObserver */
  const identRef   = useRef<HTMLDivElement>(null);
  const ratingsRef = useRef<HTMLDivElement>(null);
  const hvRef      = useRef<HTMLDivElement>(null);
  const lvRef      = useRef<HTMLDivElement>(null);
  const sectionRefs = [identRef, ratingsRef, hvRef, lvRef];

  /* activeStep is fixed at 0 — the whole page is the Nameplate step */
  const scrollToStep = (_idx: number) => { /* no-op: steps are workflow-level, not in-page sections */ };


  const toggleComplete = (idx: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const unit = selectedUnit || DEFAULT_NAMEPLATE;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
      <PortalHeader />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden">

          {/* ── Unit sub-header ── */}
          <div className="flex items-center gap-4 px-6 flex-shrink-0 flex-wrap min-h-12"
            style={{ background: "#0d1629", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>

            {/* Back button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage("evaluations-history")}
              className="gap-1.5 border-white/22 bg-white/8 text-white/85 hover:bg-white/15 hover:text-white flex-shrink-0"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Back to Evaluation History
            </Button>

            <Separator orientation="vertical" className="h-4 bg-white/15 flex-shrink-0" />

            {/* Breadcrumb pills */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {/* Standalone value pills */}
              {[unit.transformerType, unit.manufacturer].map((val, i) => (
                <Badge key={i} variant="outline" className="text-xs font-semibold text-white/80 bg-white/7 border-white/12 rounded-md px-2.5 py-0.5">
                  {val}
                </Badge>
              ))}
              {/* Label + value pills */}
              {([
                ["IC", unit.icNumber],
                ["Serial", unit.mfgSerial],
                ["kVA", unit.kva.toLocaleString()],
              ] as [string, string][]).map(([lbl, val]) => (
                <Badge key={lbl} variant="outline" className="text-xs bg-white/7 border-white/12 rounded-md px-2.5 py-0.5 gap-1.5 font-medium">
                  <span className="text-white/45">{lbl}</span>
                  <span className="text-white/85 font-semibold">{val}</span>
                </Badge>
              ))}
              {/* NPX intake tags — split on ": " into label + value */}
              {(unit.intakeTags ?? []).map((tag: string) => {
                const sep = tag.indexOf(": ");
                const lbl = sep !== -1 ? tag.slice(0, sep) : null;
                const val = sep !== -1 ? tag.slice(sep + 2) : tag;
                return (
                  <Badge key={tag} variant="outline" className="text-xs bg-white/7 border-white/12 rounded-md px-2.5 py-0.5 gap-1.5 font-medium">
                    {lbl && <span className="text-white/45">{lbl}</span>}
                    <span className="text-white/85 font-semibold">{val}</span>
                  </Badge>
                );
              })}
              {/* Base Damage */}
              {unit.hasBaseDamage && (
                <Badge className="text-xs font-semibold gap-1.5 rounded-md px-2.5 py-0.5 border-[rgba(234,88,12,0.45)] bg-[rgba(234,88,12,0.25)] text-[#FEF3C7]">
                  <Flag size={11} strokeWidth={2} />
                  Base Damage
                </Badge>
              )}
            </div>

            {/* Edit / Save / Discard */}
            {editMode ? (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode(false)}
                  className="gap-1.5 border border-white/22 text-white/75 hover:bg-white/8 hover:text-white"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Discard Changes
                </Button>
                <Button
                  size="sm"
                  onClick={() => setEditMode(false)}
                  className="gap-1.5 bg-[#0047BB] border-[#0047BB] text-white hover:bg-[#0040AA]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Save
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => setEditMode(true)}
                className="flex-shrink-0 gap-1.5 bg-[#0047BB] border-[#0047BB] text-white hover:bg-[#0040AA]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </Button>
            )}
          </div>

          {/* ── Content: stepper panel + scrollable sections ── */}
          <div className="flex-1 overflow-hidden flex">

            {/* ── Left: sticky stepper panel ── */}
            <div className="w-[230px] flex-shrink-0 overflow-auto py-6 px-4"
              style={{ background: "#0d1629", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
              <EvalStepper
                activeStep={activeStep}
                completedSteps={completedSteps}
                onStepClick={scrollToStep}
                onToggleComplete={toggleComplete}
              />
            </div>

            {/* ── Right: scrollable content ── */}
            <div className="flex-1 overflow-auto px-8 py-6">
            <div className="max-w-[900px] mx-auto">

              {/* Evaluation Comments */}
              <div className="mb-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="comments" className="border border-border rounded-xl bg-card overflow-hidden">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0047BB]">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span className="text-sm font-semibold text-foreground">Evaluation Comments</span>
                        <Badge className="w-[18px] h-[18px] rounded-full bg-[#0047BB] text-white text-[10px] font-bold p-0 flex items-center justify-center">
                          {supervisorComments.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="flex flex-col gap-3 pt-1">
                        {supervisorComments.map((c, idx) => {
                          const isOwn = c.initials === "YU";
                          const isEditing = editingCommentIdx === idx;
                          return (
                            <Card key={idx} className={cn(
                              "shadow-none rounded-lg",
                              isEditing ? "border-[#0047BB]" : "border-border",
                              "bg-muted/50",
                            )}>
                              <CardContent className="p-3.5">
                                {/* Header */}
                                <div className="flex items-center gap-2 mb-2">
                                  <Avatar className="h-7 w-7 flex-shrink-0">
                                    <AvatarFallback
                                      className="text-[10px] font-bold text-white"
                                      style={{ background: c.color }}
                                    >
                                      {c.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                                    <p className="text-xs text-muted-foreground">{c.role} · {c.time}</p>
                                  </div>
                                  {isOwn && !isEditing && (
                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Edit comment"
                                        onClick={() => { setEditingCommentIdx(idx); setEditDraft(c.text); }}
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                                      >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Delete comment"
                                        onClick={() => setSupervisorComments((prev) => prev.filter((_, i) => i !== idx))}
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                          <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                                        </svg>
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                {/* Body */}
                                {isEditing ? (
                                  <div>
                                    <Textarea
                                      autoFocus
                                      value={editDraft}
                                      onChange={(e) => setEditDraft(e.target.value)}
                                      rows={3}
                                      className="text-sm resize-none bg-background shadow-none"
                                    />
                                    <div className="flex justify-end gap-1.5 mt-2">
                                      <Button variant="outline" size="sm" onClick={() => setEditingCommentIdx(null)}>
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        disabled={!editDraft.trim()}
                                        onClick={() => {
                                          if (!editDraft.trim()) return;
                                          setSupervisorComments((prev) =>
                                            prev.map((item, i) => i === idx ? { ...item, text: editDraft.trim(), time: "Edited · Just now" } : item)
                                          );
                                          setEditingCommentIdx(null);
                                        }}
                                        className="bg-[#0047BB] border-[#0047BB] text-white hover:bg-[#0040AA]"
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-foreground leading-relaxed m-0">{c.text}</p>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}

                        {/* New comment input */}
                        <Card className="shadow-none rounded-lg overflow-hidden">
                          <Textarea
                            value={commentDraft}
                            onChange={(e) => setCommentDraft(e.target.value)}
                            placeholder="Leave a comment…"
                            rows={3}
                            className="border-0 rounded-none focus-visible:ring-0 resize-none text-sm bg-transparent shadow-none"
                          />
                          <div className="border-t border-border px-3 py-2 flex justify-end items-center gap-2 bg-muted/30">
                            {commentDraft.trim() && (
                              <Button variant="outline" size="sm" onClick={() => setCommentDraft("")}>
                                Cancel
                              </Button>
                            )}
                            <Button
                              size="sm"
                              disabled={!commentDraft.trim() || postingComment}
                              onClick={() => {
                                if (!commentDraft.trim()) return;
                                setPostingComment(true);
                                setTimeout(() => {
                                  setSupervisorComments((prev) => [
                                    ...prev,
                                    { initials: "YU", color: "#182557", name: "You", role: "Supervisor", time: "Just now", text: commentDraft.trim() },
                                  ]);
                                  setCommentDraft("");
                                  setPostingComment(false);
                                }, 400);
                              }}
                              className="gap-1.5 bg-[#0047BB] border-[#0047BB] text-white hover:bg-[#0040AA] disabled:opacity-50"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                              </svg>
                              {postingComment ? "Posting…" : "Post Comment"}
                            </Button>
                          </div>
                        </Card>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Nameplate image card */}
              <NameplateImageCard
                icNumber={unit.icNumber}
                manufacturer={unit.manufacturer}
                mfgSerial={unit.mfgSerial}
                kva={unit.kva}
              />

              {/* ── IDENTIFICATION ── */}
              <div ref={identRef}>
              <Section>
                <SectionHeader title="Identification" confidence={87} />
                <FieldGrid>
                  <SelectField label="Manufacturer" value={IDENTIFICATION.manufacturer} editMode={editMode} required
                    options={["ABB","Eaton","GE","Hitachi","Siemens","SPX","Square D","Virginia Transformer","Other"]} />
                  <div>
                    <Field label="Serial Number" value={IDENTIFICATION.serialNumber} editMode={editMode} required />
                    <AiChip label={IDENTIFICATION.aiSerial} />
                  </div>
                  <SelectField label="Unit Type" value={IDENTIFICATION.unitType} editMode={editMode} required
                    options={["Three-Phase Pad","Single-Phase Pad","Underground","Network","Auto-Transformer"]} />
                  <SelectField label="Year Manufactured" value={IDENTIFICATION.yearManufactured} editMode={editMode} required
                    options={YEAR_OPTIONS} />
                </FieldGrid>
              </Section>
              </div>

              {/* ── RATINGS ── */}
              <div ref={ratingsRef}>
              <Section>
                <SectionHeader title="Ratings" confidence={91} />
                <FieldGrid>
                  <Field label="KVA Base (kVA)" value={RATINGS.kvaBase} editMode={editMode} required />
                  <Field label="KVA Fan Base (kVA)" value={RATINGS.kvaFanBase} editMode={editMode} placeholder="—" />
                  <Field label="KVA Higher Rating (kVA)" value={RATINGS.kvaHigher} editMode={editMode} placeholder="—" />
                  <Field label="KVA Fan Higher Rating (kVA)" value={RATINGS.kvaFanHigher} editMode={editMode} placeholder="—" />
                  <SelectField label="Cooling Class" value={RATINGS.coolingClass} editMode={editMode} required
                    options={["ONAN/ONAF","ONAN","ONAF","ONAF (FUT)","ONAN/ONAF/ONAF","ONAN/ONAF(F)/ONAF(F)","ONAN/OFAF","ONAN/ONAF/OFAF","OFAF","KNAN","KNAF","KNAF (FUT)","KNAN/KNAF/KNAF","KNAN/KNAF(F)/KNAF(F)","KNAN/KFAF","KNAN/KNAF/KFAF","KFAF"]} />
                  <SelectField label="Rise (°C)" value={RATINGS.rise} editMode={editMode} required
                    options={["55","65","75","55/65","65/75"]} />
                  <Field label="Frequency (Hz)" value={RATINGS.frequency} editMode={editMode} required />
                  <Field label="Impedance %" value={RATINGS.impedancePct} editMode={editMode} required />
                  <SelectField label="Oil Type" value={RATINGS.oilType} editMode={editMode} required
                    options={["Mineral Oil","FR3","R-Temp","Silicone","BETA","Wecosol","Natural Ester","BIOTEMP"]} />
                  <div>
                    <FieldLabel label="Oil Volume (Gal)" required />
                    <Input
                      defaultValue={RATINGS.oilVolume}
                      readOnly={!editMode}
                      className={cn(
                        "h-9 text-sm shadow-none",
                        !editMode && "bg-muted/40 cursor-default focus-visible:ring-0 focus-visible:ring-offset-0",
                        editMode && "bg-background border-red-400 focus-visible:ring-red-400",
                      )}
                    />
                    {editMode && <ErrorMsg msg={RATINGS.oilVolumeError} />}
                  </div>
                  <Field label="Core & Coils Weight (lbs)" value={RATINGS.coreCoilsWeight} editMode={editMode} required />
                  <Field label="Oil Weight (lbs)" value={RATINGS.oilWeight} editMode={editMode} required />
                  <Field label="Case/Tank Weight (lbs)" value={RATINGS.caseTankWeight} editMode={editMode} required />
                  <Field label="Total Weight (lbs)" value={RATINGS.totalWeight} editMode={editMode} required />
                </FieldGrid>
              </Section>
              </div>

              {/* ── HV RATINGS ── */}
              <div ref={hvRef}>
              <Section>
                <SectionHeader title="HV Ratings" confidence={96} />
                {(() => {
                  const hvIsIntegral = hvDualVoltage && hv1Config !== hv2Config;
                  const showHv1DyDelta = hvDeltaWye && !hvIsIntegral;
                  const showHv2DyDelta = hvDeltaWye && !hvIsIntegral;
                  const hvVoltOptions = ["2,400","4,160","7,200","7,620","12,470","13,200","13,800","14,400","22,000","24,940","34,500","46,000","69,000"];
                  return (
                    <>
                      {/* Row 1: Nominal Voltage only */}
                      <FieldGrid>
                        <SelectField label="HV Nominal Voltage" value={hvNominal} editMode={editMode} required
                          onChange={handleHvNominalChange}
                          options={[
                            "2400GRDY/1386","4160GRDY/2400","7200GRDY/4157","12470GRDY/7200",
                            "13200GRDY/7620","13800GRDY/7967","24940GRDY/14400","34500GRDY/19920",
                            "69000GRDY/39840","115000GRDY/66395","138000GRDY/79674",
                            "2400","4160","7200","12470","13200","13800","34500","69000",
                            "2400/4160Y/2400","4160/7200Y/4157","7200/12470Y/7200","13200/22860Y/13200",
                            "12470GRDY/7200 X 14400GRDY/8315","2400/4160Y/2400 X 7200/12470Y/7200",
                          ]} />
                      </FieldGrid>

                      {/* Row 2: HV1 Config | Delta Wye + Dual Voltage | HV2 Config (conditional) */}
                      <FieldGrid className="mt-4">
                        <SelectField label="HV 1 Configuration" value={hv1Config} editMode={editMode} required
                          onChange={(v) => { setHv1Config(v); setHv1DyDelta(v === "DELTA" ? hv1Delta : ""); }}
                          options={["GrdY","Y","DELTA"]} />
                        <PairedToggles
                          leftLabel="Delta Wye" leftValue={hvDeltaWye}
                          onLeftChange={hvIsIntegral ? undefined : setHvDeltaWye}
                          rightLabel="Dual Voltage" rightValue={hvDualVoltage} onRightChange={setHvDualVoltage}
                          editMode={editMode}
                          rightDisabled={false}
                        />
                        {hvDualVoltage && (
                          <SelectField label="HV 2 Configuration" value={hv2Config} editMode={editMode} required
                            onChange={(v) => { setHv2Config(v); setHv2DyDelta(v === "DELTA" ? hv2Delta : ""); }}
                            options={["GrdY","Y","DELTA"]} />
                        )}
                      </FieldGrid>

                      {/* Row 3: HV1 sub-voltages */}
                      <FieldGrid className="mt-4">
                        {showHv1DyDelta && (
                          <SelectField label="HV 1 DY Delta" value={hv1DyDelta} editMode={editMode} required
                            onChange={setHv1DyDelta} options={hvVoltOptions} />
                        )}
                        {(hv1Config === "GrdY" || hv1Config === "Y") && (
                          <SelectField label="HV 1 Wye" value={hv1Wye} editMode={editMode} required
                            onChange={setHv1Wye} options={hvVoltOptions} />
                        )}
                        <SelectField label="HV 1 Delta" value={hv1Delta} editMode={editMode} required
                          onChange={setHv1Delta} options={hvVoltOptions} />
                      </FieldGrid>

                      {/* Row 4: HV2 sub-voltages — only when Dual Voltage on */}
                      {hvDualVoltage && (
                        <FieldGrid className="mt-4">
                          {showHv2DyDelta && (
                            <SelectField label="HV 2 DY Delta" value={hv2DyDelta} editMode={editMode} required
                              onChange={setHv2DyDelta} options={hvVoltOptions} />
                          )}
                          {(hv2Config === "GrdY" || hv2Config === "Y") && (
                            <SelectField label="HV 2 Wye" value={hv2Wye} editMode={editMode} required
                              onChange={setHv2Wye} options={hvVoltOptions} />
                          )}
                          <SelectField label="HV 2 Delta" value={hv2Delta} editMode={editMode} required
                            onChange={setHv2Delta} options={hvVoltOptions} />
                        </FieldGrid>
                      )}

                      {/* BIL + Winding Material */}
                      <FieldGrid className="mt-4">
                        <SelectField label="HV BIL (kV)" value={hvBil} editMode={editMode} required
                          onChange={setHvBil}
                          options={["30","45","60","75","95","110","125","150","200","250","350"]} />
                        <SelectField label="HV Winding Material" value={hvWindingMaterial} editMode={editMode} required
                          onChange={setHvWindingMaterial}
                          options={["Copper","Aluminum","Unknown"]} />
                      </FieldGrid>
                    </>
                  );
                })()}
              </Section>
              </div>

              {/* ── TAP TABLE ── */}
              <Section>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">Tap Table</span>
                </div>
                <FieldGrid>
                  <Field label="Number of Taps" value={numberOfTaps} editMode={editMode} required
                    onChange={(v) => {
                      const n = parseInt(v, 10);
                      setNumberOfTaps(v);
                      if (tapConfig === "Custom" && n > 0) {
                        const nom = parseInt(nominalTapPosition, 10) || Math.ceil(n / 2);
                        setTapRows(Array.from({ length: n }, (_, i) => ({
                          label: TAP_LABELS[i] ?? `${i+1}`,
                          hvVoltage: tapRows[i]?.hvVoltage ?? "",
                          percentage: tapRows[i]?.percentage ?? "100.00",
                        })));
                        setNominalTapPosition(String(Math.min(nom, n)));
                      }
                    }} />
                  <SelectField label="Tap Configuration" value={tapConfig} editMode={editMode} required
                    onChange={(v) => {
                      setTapConfig(v);
                      if (v === "None") setTapRows([]);
                    }}
                    options={["+/-5%","-10%","J-tap","K-tap","Custom","None"]} />
                  <Field label="Nominal Tap Position" value={nominalTapPosition} editMode={editMode} required
                    onChange={(v) => setNominalTapPosition(v)} />
                </FieldGrid>
                {parseInt(numberOfTaps) > 0 && tapConfig !== "None" && (
                  <div className="mt-4">
                    <TapTable
                      taps={tapRows}
                      editMode={editMode}
                      readonly={tapConfig !== "Custom"}
                      tapConfig={tapConfig}
                      numberOfTaps={numberOfTaps}
                    />
                  </div>
                )}
              </Section>

              {/* ── LV RATINGS ── */}
              <div ref={lvRef}>
              <Section>
                <SectionHeader title="LV Ratings" confidence={54} />
                {(() => {
                  const lvIsIntegral = lvDualVoltage && lv1Config !== lv2Config;
                  const showLv1DyDelta = lvDeltaWye && !lvIsIntegral;
                  const showLv2DyDelta = lvDeltaWye && !lvIsIntegral;
                  const lvVoltOptions = ["120","208","240","277","480","600","2,400","4,160","7,200","12,470","13,200"];
                  return (
                    <>
                      {/* Row 1: Nominal Voltage only */}
                      <FieldGrid>
                        <SelectField label="LV Nominal Voltage" value={lvNominal} editMode={editMode} required
                          onChange={handleLvNominalChange}
                          options={["120","208","240","277","480","600","208GRDY/120","480GRDY/277","600GRDY/347","2400GRDY/1386","4160GRDY/2400","240 X 120","480GRDY/277 X 240GRDY/138"]} />
                      </FieldGrid>

                      {/* Row 2: LV1 Config | Delta Wye + Dual Voltage | LV2 Config (conditional) */}
                      <FieldGrid className="mt-4">
                        <SelectField label="LV 1 Configuration" value={lv1Config} editMode={editMode} required
                          onChange={(v) => { setLv1Config(v); setLv1DyDelta(v === "DELTA" ? lv1Delta : ""); }}
                          options={["GrdY","Y","DELTA"]} />
                        <PairedToggles
                          leftLabel="Delta Wye" leftValue={lvDeltaWye}
                          onLeftChange={lvIsIntegral ? undefined : setLvDeltaWye}
                          rightLabel="Dual Voltage" rightValue={lvDualVoltage} onRightChange={setLvDualVoltage}
                          editMode={editMode}
                          rightDisabled={!hvDualVoltage}
                        />
                        {lvDualVoltage && (
                          <SelectField label="LV 2 Configuration" value={lv2Config} editMode={editMode} required
                            onChange={(v) => { setLv2Config(v); setLv2DyDelta(v === "DELTA" ? lv2Delta : ""); }}
                            options={["GrdY","Y","DELTA"]} />
                        )}
                      </FieldGrid>

                      {/* Row 3: LV1 sub-voltages */}
                      <FieldGrid className="mt-4">
                        {showLv1DyDelta && (
                          <SelectField label="LV 1 DY Delta" value={lv1DyDelta} editMode={editMode} required
                            onChange={setLv1DyDelta} options={lvVoltOptions} />
                        )}
                        {(lv1Config === "GrdY" || lv1Config === "Y") && (
                          <SelectField label="LV 1 Wye" value={lv1Wye} editMode={editMode} required
                            onChange={setLv1Wye} options={lvVoltOptions} />
                        )}
                        <SelectField label="LV 1 Delta" value={lv1Delta} editMode={editMode} required
                          onChange={setLv1Delta} options={lvVoltOptions} />
                      </FieldGrid>

                      {/* Row 4: LV2 sub-voltages — only when LV Dual Voltage on */}
                      {lvDualVoltage && (
                        <FieldGrid className="mt-4">
                          {showLv2DyDelta && (
                            <SelectField label="LV 2 DY Delta" value={lv2DyDelta} editMode={editMode} required
                              onChange={setLv2DyDelta} options={lvVoltOptions} />
                          )}
                          {(lv2Config === "GrdY" || lv2Config === "Y") && (
                            <SelectField label="LV 2 Wye" value={lv2Wye} editMode={editMode} required
                              onChange={setLv2Wye} options={lvVoltOptions} />
                          )}
                          <SelectField label="LV 2 Delta" value={lv2Delta} editMode={editMode} required
                            onChange={setLv2Delta} options={lvVoltOptions} />
                        </FieldGrid>
                      )}

                      {/* BIL + Winding Material + Base Voltage */}
                      <FieldGrid className="mt-4">
                        <SelectField label="LV BIL (kV)" value={lvBil} editMode={editMode} required
                          onChange={setLvBil}
                          options={["10","30","45","60","75","95","110","125","150","200","250","350"]} />
                        <SelectField label="LV Winding Material" value={lvWindingMaterial} editMode={editMode} required
                          onChange={setLvWindingMaterial}
                          options={["Copper","Aluminum","Unknown"]} />
                        <Field label="LV Base Voltage" value={lvBaseVoltage} editMode={editMode} required
                          onChange={setLvBaseVoltage} />
                      </FieldGrid>
                    </>
                  );
                })()}
              </Section>
              </div>

              <div className="h-20" />
            </div>
            </div>{/* end scrollable right */}
          </div>{/* end stepper+content flex */}
        </main>
      </div>
    </div>
  );
}
