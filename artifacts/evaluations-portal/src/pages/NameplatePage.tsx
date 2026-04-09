import { useState } from "react";
import { PortalHeader } from "@/components/PortalHeader";
import { Sidebar } from "@/components/Sidebar";
import { useDemoContext } from "@/context/DemoContext";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    { tap: "1/A", kvaRating: "12,979", deviation: "+4.0" },
    { tap: "2/B", kvaRating: "12,724", deviation: "+2.0" },
    { tap: "3/C", kvaRating: "12,470", deviation: "0.0" },
    { tap: "4/D", kvaRating: "12,219", deviation: "-2.0" },
    { tap: "5/E", kvaRating: "11,961", deviation: "-4.0" },
    { tap: "6/F", kvaRating: "—", deviation: "—" },
    { tap: "7/G", kvaRating: "—", deviation: "—" },
  ],
  numberOfTaps: "5",
  tapConfig: "1/A-5/E",
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

function SparkleIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L14.09 8.26L20.5 9.27L16.25 13.41L17.18 19.82L12 17L6.82 19.82L7.75 13.41L3.5 9.27L9.91 8.26L12 2Z"/>
    </svg>
  );
}

function ConfidenceBadge({ pct }: { pct: number }) {
  const isHigh = pct >= 60;
  return (
    <Badge
      className={cn(
        "gap-1 rounded-full font-semibold text-xs px-2 py-0.5",
        isHigh
          ? "border-[rgba(124,58,237,0.28)] bg-[rgba(124,58,237,0.10)] text-[#7C3AED]"
          : "border-[#FCD34D] bg-[#FEF3C7] text-[#92400E]",
      )}
    >
      <SparkleIcon size={10} />
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
      className="mt-1 gap-1 rounded-md text-xs font-medium px-1.5 py-0.5 border-[rgba(124,58,237,0.22)] bg-[rgba(124,58,237,0.08)] text-[#7C3AED]"
    >
      <SparkleIcon size={9} />
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
  label, value, editMode, required, error, placeholder,
}: {
  label: string; value: string; editMode: boolean; required?: boolean; error?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <Input
        defaultValue={value}
        readOnly={!editMode}
        placeholder={editMode ? placeholder : undefined}
        className={cn(
          "h-9 text-sm shadow-none",
          !editMode && "bg-muted border-muted cursor-default focus-visible:ring-0 focus-visible:ring-offset-0",
          editMode && "bg-background",
          error && editMode && "border-red-400 focus-visible:ring-red-400",
        )}
      />
    </div>
  );
}

/* ─── Unified Select ─────────────────────────────────────────────────────────── */
function SelectField({
  label, value, editMode, required, options,
}: {
  label: string; value: string; editMode: boolean; required?: boolean; options: string[];
}) {
  if (!editMode) {
    return (
      <div>
        <FieldLabel label={label} required={required} />
        <Input value={value || "—"} readOnly className="h-9 text-sm shadow-none bg-muted border-muted cursor-default focus-visible:ring-0 focus-visible:ring-offset-0" />
      </div>
    );
  }
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <Select defaultValue={value}>
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
        <span className={cn("text-sm font-medium", value ? "text-[#0047BB]" : "text-muted-foreground")}>
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

function FieldGrid({ children, cols = 3 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "16px 20px" }}>
      {children}
    </div>
  );
}

/* ─── Tap table ─────────────────────────────────────────────────────────────── */
function TapTable({ taps, editMode }: { taps: typeof HV.taps; editMode: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Tap Voltage &amp; % Deviation
      </p>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider w-16">TAP</TableHead>
              <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider">KVA Rating</TableHead>
              <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider">% Deviation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taps.map((row) => (
              <TableRow key={row.tap} className="hover:bg-muted/30">
                <TableCell className="font-semibold text-sm py-2">{row.tap}</TableCell>
                <TableCell className="text-sm py-2">
                  {editMode ? (
                    <Input defaultValue={row.kvaRating} className="h-7 text-xs bg-background max-w-[100px] shadow-none" />
                  ) : row.kvaRating}
                </TableCell>
                <TableCell className={cn(
                  "text-sm font-medium py-2",
                  row.deviation.startsWith("+") ? "text-[#047857]"
                    : row.deviation === "0.0" ? "text-foreground"
                    : "text-destructive",
                )}>
                  {editMode ? (
                    <Input defaultValue={row.deviation} className="h-7 text-xs bg-background max-w-[80px] shadow-none" />
                  ) : row.deviation}
                </TableCell>
              </TableRow>
            ))}
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
    a.href = "data:text/plain,nameplate-placeholder";
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
            style={{ width: 200, height: 140, background: "linear-gradient(135deg, #1a1f2e 0%, #2a3350 40%, #1e2640 100%)" }}
          >
            <NameplateImageContent icNumber={icNumber} manufacturer={manufacturer} mfgSerial={mfgSerial} kva={kva} scale={1} />
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7C3AED] flex-shrink-0">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/>
                <path d="M3 9h2M3 15h2M19 9h2M19 15h2M9 3v2M15 3v2M9 19v2M15 19v2"/>
              </svg>
              <span className="text-xs text-[#7C3AED] font-medium">AI was used to scan Nameplate</span>
            </div>
            <div className="flex flex-wrap gap-1 items-center">
              {["Blurry", "Underexposed", "Off angle"].map((tag) => (
                <Badge key={tag} className="rounded-full text-[10px] font-medium border-[#FCD34D] bg-[#FEF3C7] text-[#92400E] px-2 py-0">
                  {tag}
                </Badge>
              ))}
              <span className="text-xs text-[#92400E]">
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
              style={{ width: 640, height: 400, background: "linear-gradient(135deg, #1a1f2e 0%, #2a3350 40%, #1e2640 100%)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
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
  const [supervisorComments, setSupervisorComments] = useState([
    { initials: "MC", color: "#0047BB", name: "Michael Chen", role: "Senior Evaluator", time: "2 hours ago", text: "Oil volume reading of 210 gallons appears low for this unit. The standard capacity for ONAN 1,750 kVA is 220 gal. Please verify against the physical nameplate before finalizing." },
    { initials: "SR", color: "#047857", name: "Sandra Rivera", role: "QA Supervisor", time: "45 min ago", text: "Confirmed HV nominal voltage matches the 12,470D configuration. All tap values look correct per the engineering spec sheet." },
  ]);
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [editingCommentIdx, setEditingCommentIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
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
              {[
                unit.manufacturer,
                `IC: ${unit.icNumber}`,
                `Serial: ${unit.mfgSerial}`,
                `KVA: ${unit.kva.toLocaleString()}`,
                unit.transformerType,
              ].map((label, i) => (
                <Badge key={i} variant="outline" className="text-xs font-medium text-white/75 bg-white/7 border-white/12 rounded-md px-2 py-0.5">
                  {label}
                </Badge>
              ))}
              {unit.hasBaseDamage && (
                <Badge className="text-xs font-semibold gap-1 rounded-md px-2 py-0.5 border-[rgba(234,88,12,0.45)] bg-[rgba(234,88,12,0.25)] text-[#FEF3C7]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Base Damage
                </Badge>
              )}
              {(unit.intakeTags ?? []).map((tag: string) => (
                <Badge key={tag} className="text-xs font-semibold rounded-md px-2 py-0.5 border-[rgba(14,165,233,0.35)] bg-[rgba(14,165,233,0.18)] text-[#E0F2FE]">
                  {tag}
                </Badge>
              ))}
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

          {/* ── Scrollable content ── */}
          <div className="flex-1 overflow-auto px-8 py-6">
            <div className="max-w-[1100px] mx-auto">

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
              <Section>
                <SectionHeader title="Identification" confidence={87} />
                <FieldGrid>
                  <SelectField label="Manufacturer" value={IDENTIFICATION.manufacturer} editMode={editMode} required
                    options={["Siemens", "ABB", "Eaton", "General Electric", "Schneider Electric", "Square D"]} />
                  <div>
                    <Field label="Serial Number" value={IDENTIFICATION.serialNumber} editMode={editMode} required />
                    <AiChip label={IDENTIFICATION.aiSerial} />
                  </div>
                  <SelectField label="Unit Type" value={IDENTIFICATION.unitType} editMode={editMode} required
                    options={["Three-Phase Pad", "Single-Phase Pad", "Pole Mount"]} />
                  <SelectField label="Year Manufactured" value={IDENTIFICATION.yearManufactured} editMode={editMode} required
                    options={Array.from({ length: 40 }, (_, i) => String(2024 - i))} />
                </FieldGrid>
              </Section>

              {/* ── RATINGS ── */}
              <Section>
                <SectionHeader title="Ratings" confidence={91} />
                <FieldGrid>
                  <Field label="KVA Base" value={RATINGS.kvaBase} editMode={editMode} required />
                  <Field label="KVA Fan Base" value={RATINGS.kvaFanBase} editMode={editMode} required placeholder="e.g. 2,000" />
                  <Field label="KVA Higher Rating" value={RATINGS.kvaHigherRating} editMode={editMode} required placeholder="e.g. 2,100" />
                  <Field label="KVA Fan Higher Rating" value={RATINGS.kvaFanHigherRating} editMode={editMode} required placeholder="e.g. 2,200" />
                  <SelectField label="Cooling Class" value={RATINGS.coolingClass} editMode={editMode} required
                    options={["ONAN", "ONAF", "ONAN/ONAF", "OFAF", "ODAF"]} />
                  <Field label="Rise (°C)" value={RATINGS.rise} editMode={editMode} required />
                  <Field label="Frequency" value={RATINGS.frequency} editMode={editMode} required />
                  <Field label="Impedance %" value={RATINGS.impedance} editMode={editMode} required />
                  <SelectField label="Oil Type" value={RATINGS.oilType} editMode={editMode} required
                    options={["Mineral Oil", "Silicone", "Natural Ester", "Synthetic Ester"]} />
                  <div>
                    <FieldLabel label="Oil Volume (Gallons)" required />
                    <Input
                      defaultValue={RATINGS.oilVolume}
                      readOnly={!editMode}
                      className={cn(
                        "h-9 text-sm shadow-none",
                        !editMode && "bg-muted border-muted cursor-default focus-visible:ring-0 focus-visible:ring-offset-0",
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

              {/* ── HV RATINGS ── */}
              <Section>
                <SectionHeader title="HV Ratings" confidence={96} />
                <FieldGrid>
                  <SelectField label="HV Nominal Voltage" value={HV.nominalVoltage} editMode={editMode} required
                    options={[HV.nominalVoltage, "12470Y/7200", "13800", "4160"]} />
                  <SelectField label="HV DY Delta" value={HV.dyDelta} editMode={editMode} required
                    options={["Delta", "Wye", "Delta/Wye"]} />
                  <Field label="HV 1 Configuration" value={HV.hv1Config} editMode={editMode} required />
                  <Field label="HV 1 Delta" value={HV.hv1Delta} editMode={editMode} required />
                  <Field label="HV 3 Configuration" value={HV.hv3Config} editMode={editMode} required />
                  <Field label="HV 2 Delta" value={HV.hv2Delta} editMode={editMode} required />
                  <Field label="HV 2 Wye" value={HV.hv2Wye} editMode={editMode} required />
                  <SwitchField label="Delta Wye" value={hvDeltaWye} editMode={editMode} onChange={setHvDeltaWye} />
                  <SwitchField label="Dual Voltage" value={hvDualVoltage} editMode={editMode} onChange={setHvDualVoltage} />
                  <Field label="HV BIL (kV)" value={HV.bil} editMode={editMode} required />
                  <SelectField label="HV Winding Material" value={HV.windingMaterial} editMode={editMode} required options={["AL", "CU"]} />
                  <div />
                </FieldGrid>
                <div className="mt-5">
                  <FieldGrid>
                    <Field label="Number of Taps" value={HV.numberOfTaps} editMode={editMode} required />
                    <SelectField label="Tap Configuration" value={HV.tapConfig} editMode={editMode} required
                      options={["1/A-5/E", "1/A-7/G", "Full Range"]} />
                    <Field label="Nominal Tap Position" value={HV.nominalTapPos} editMode={editMode} required />
                  </FieldGrid>
                </div>
                <div className="mt-4">
                  <TapTable taps={HV.taps.filter((t) => t.kvaRating !== "—")} editMode={editMode} />
                </div>
              </Section>

              {/* ── LV RATINGS ── */}
              <Section>
                <SectionHeader title="LV Ratings" confidence={54} />
                <FieldGrid>
                  <SelectField label="LV Nominal Voltage" value={LV.nominalVoltage} editMode={editMode} required
                    options={[LV.nominalVoltage, "208Y/120", "480Y/277", "240/120"]} />
                  <Field label="LV 1 Configuration" value={LV.lv1Config} editMode={editMode} required />
                  <Field label="LV1 Delta" value={LV.lv1Delta} editMode={editMode} required />
                  <Field label="LV 1 Wye" value={LV.lv1Wye} editMode={editMode} required />
                  <Field label="LV 2 Configuration" value={LV.lv2Config} editMode={editMode} required />
                  <Field label="LV 2 Delta" value={LV.lv2Delta} editMode={editMode} required />
                  <Field label="LV 2 Wye" value={LV.lv2Wye} editMode={editMode} required />
                  <SwitchField label="Delta Wye" value={lvDeltaWye} editMode={editMode} onChange={setLvDeltaWye} />
                  <SwitchField label="Dual Voltage" value={lvDualVoltage} editMode={editMode} onChange={setLvDualVoltage} />
                  <Field label="LV BIL (kV)" value={LV.bil} editMode={editMode} required />
                  <SelectField label="LV Winding Material" value={LV.windingMaterial} editMode={editMode} required options={["AL", "CU"]} />
                  <div />
                </FieldGrid>
              </Section>

              <div className="h-20" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
