import { useState, useRef, useCallback } from "react";
import { PortalHeader } from "@/components/PortalHeader";
import { Sidebar } from "@/components/Sidebar";
import { useDemoContext } from "@/context/DemoContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Sparkles, Flag, Camera, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Settings2, Trash2, RotateCcw, MapPin, AlertCircle, Save, Loader2, CheckCircle2,
  Upload, EyeOff, X, Maximize2, Plus, Package2, Box, Layers, Database, ArrowUp, ArrowDown,
  ChevronsUp, ChevronsDown, Minus, DoorOpen, HelpCircle, Pencil,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type SectionId = "Tank" | "Cabinet" | "Radiator";
type DamageType = "Rust" | "Dent" | "Leak" | "Arc Damage" | "Holes" | "Tears" | "None" | "";
type Assessment = "Repairable" | "Non-Repairable" | "";
type DamageAssessment = "Surface" | "Structural" | "";
type BaseStatus = "pending" | "damaged" | "clean" | "dismissed";
type SaveState = "idle" | "saving" | "saved" | "savedAgo";
type ModalStep = "location" | "sublocation" | "photoSource" | "aiAnalyzing" | "baseDamageAlert" | null;

interface AIOriginal {
  damageType: DamageType;
  assessment: Assessment;
  damageAssessment: DamageAssessment;
  comments: string;
}

interface DamageEntry {
  id: string;
  imageUrl: string;
  name: string;
  aiDetected: boolean;
  confidence?: number;
  damageType: DamageType;
  sectionLocation: SectionId;
  subLocation: string;
  location: string;
  assessment: Assessment;
  damageAssessment: DamageAssessment;
  comments: string;
  additionalPhotos: { id: string; imageUrl: string; damageType: DamageType; assessment: Assessment; damageAssessment: DamageAssessment; comments: string }[];
  aiOriginal?: AIOriginal;
}

interface Snapshot {
  entries: DamageEntry[];
  baseStatus: BaseStatus;
  currentEntry: DamageEntry | null;
}

/* ─── Constants ──────────────────────────────────────────────────────────────── */
const DAMAGE_TYPES: DamageType[] = ["Rust", "Dent", "Leak", "Arc Damage", "Holes", "Tears", "None"];
const DAMAGE_TYPE_DESCS: Record<string, string> = {
  Rust: "Oxidation or corrosion on metal surfaces.",
  Dent: "Physical deformation without material loss.",
  Leak: "Fluid or gas escaping from a sealed area.",
  "Arc Damage": "Electrical arc flash or discharge damage.",
  Holes: "Punctures or perforations through the material.",
  Tears: "Rips or cuts in sheet metal or gaskets.",
  None: "No damage found at this location.",
};
const REPAIRABILITY_DESCS: Record<string, string> = {
  Repairable: "Damage can be fixed to restore the unit to acceptable service condition.",
  "Non-Repairable": "Damage is too severe; the component or unit must be scrapped or replaced.",
};
const DAMAGE_ASSESSMENT_DESCS: Record<string, string> = {
  Surface: "Damage is cosmetic — affects appearance but not structural integrity.",
  Structural: "Damage compromises the physical structure or core function of the unit.",
};

type SectionTheme = {
  id: SectionId; icon: React.ReactNode; iconBg: string; iconColor: string;
  cardBorder: string; headerGradient: string; bodyDivider: string; bodyBg: string; shadowColor: string;
};
const SECTION_INFO: Record<SectionId, SectionTheme> = {
  Tank: {
    id: "Tank", iconBg: "rgba(254,249,195,0.80)", iconColor: "#b45309",
    cardBorder: "1.5px solid rgba(180,83,9,0.22)",
    headerGradient: "linear-gradient(105deg, rgba(254,249,195,0.60) 0%, transparent 100%)",
    bodyDivider: "1px solid rgba(180,83,9,0.15)", bodyBg: "rgba(254,249,195,0.08)", shadowColor: "rgba(180,83,9,0.08)",
    icon: <Package2 size={18} />,
  },
  Cabinet: {
    id: "Cabinet", iconBg: "rgba(243,232,255,0.80)", iconColor: "#7c3aed",
    cardBorder: "1.5px solid rgba(124,58,237,0.24)",
    headerGradient: "linear-gradient(105deg, rgba(243,232,255,0.60) 0%, transparent 100%)",
    bodyDivider: "1px solid rgba(124,58,237,0.15)", bodyBg: "rgba(243,232,255,0.08)", shadowColor: "rgba(124,58,237,0.08)",
    icon: <Box size={18} />,
  },
  Radiator: {
    id: "Radiator", iconBg: "rgba(219,234,254,0.80)", iconColor: "#1d4ed8",
    cardBorder: "1.5px solid rgba(59,130,246,0.24)",
    headerGradient: "linear-gradient(105deg, rgba(219,234,254,0.60) 0%, transparent 100%)",
    bodyDivider: "1px solid rgba(59,130,246,0.15)", bodyBg: "rgba(219,234,254,0.08)", shadowColor: "rgba(59,130,246,0.08)",
    icon: <Layers size={18} />,
  },
};
const SECTION_ICON_LG: Record<SectionId, React.ReactNode> = {
  Tank: <Package2 size={38} />, Cabinet: <Box size={38} />, Radiator: <Layers size={38} />,
};

type SubLocDef = { label: string; icon: React.ReactNode; flip?: boolean };
const SUB_LOCATIONS: Record<SectionId, SubLocDef[]> = {
  Tank: [
    { label: "Base", icon: <Database size={26} /> },
    { label: "Left Side Wall", icon: <ChevronLeft size={26} /> },
    { label: "Right Side Wall", icon: <ChevronRight size={26} /> },
    { label: "Rear Wall", icon: <Minus size={26} /> },
    { label: "Front Wall", icon: <Package2 size={26} /> },
    { label: "Top", icon: <ArrowUp size={26} /> },
    { label: "Lifting Hooks", icon: <ChevronsUp size={26} /> },
  ],
  Cabinet: [
    { label: "Left Door", icon: <DoorOpen size={26} /> },
    { label: "Right Door", icon: <DoorOpen size={26} />, flip: true },
    { label: "Left Side", icon: <ChevronLeft size={26} /> },
    { label: "Right Side", icon: <ChevronRight size={26} /> },
    { label: "Top", icon: <ArrowUp size={26} /> },
    { label: "Sill (Bottom Plates)", icon: <ArrowDown size={26} /> },
    { label: "False Bottom", icon: <ChevronsDown size={26} /> },
  ],
  Radiator: [
    { label: "Left Side", icon: <ChevronLeft size={26} /> },
    { label: "Right Side", icon: <ChevronRight size={26} /> },
    { label: "Rear Side", icon: <Minus size={26} /> },
  ],
};

const MOCK_AI: Record<SectionId, { damageType: DamageType; assessment: Assessment; damageAssessment: DamageAssessment; confidence: number; comments: string }> = {
  Tank:    { damageType: "Rust",  assessment: "Repairable",     damageAssessment: "Surface",    confidence: 87, comments: "Surface corrosion detected near base weld line. Appears containable — recommend grinding and repainting." },
  Cabinet: { damageType: "Dent",  assessment: "Non-Repairable", damageAssessment: "Structural", confidence: 68, comments: "Large dent on door panel — hinge misaligned. May compromise cabinet sealing." },
  Radiator:{ damageType: "Dent",  assessment: "Non-Repairable", damageAssessment: "Structural", confidence: 62, comments: "Significant deformation across fin array. May compromise thermal performance." },
};

const TRANSFORMER_TYPE_ABBR: Record<string, string> = {
  "Three-Phase Pad": "3Ø Pad", "Single-Phase Pad": "1Ø Pad", "Pole Mount": "Pole",
};

/* ─── Evaluation stepper (identical to NameplatePage) ───────────────────────── */
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
  activeStep, completedSteps, onStepClick, onToggleComplete,
}: {
  activeStep: number; completedSteps: Set<number>;
  onStepClick: (i: number) => void; onToggleComplete: (i: number) => void;
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
            {i > 0 && (
              <div style={{ display: "flex", paddingLeft: 11 }}>
                <div style={{ width: 2, height: 18, background: completedSteps.has(i - 1) ? "#0047BB" : "rgba(255,255,255,0.12)", transition: "background 0.3s" }} />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => onToggleComplete(i)}
                title={done ? "Mark incomplete" : "Mark complete"}
                style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, border: done ? "none" : active ? "2px solid #5b9cf6" : "2px solid rgba(255,255,255,0.18)", background: done ? "#0047BB" : active ? "rgba(91,156,246,0.15)" : "transparent", color: done ? "#fff" : active ? "#5b9cf6" : "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
              >{step.icon}</button>
              <button onClick={() => onStepClick(i)} style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? "#5b9cf6" : "rgba(255,255,255,0.85)", transition: "color 0.15s" }}>{step.label}</span>
              </button>
              {done ? (
                <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              ) : active ? (
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: "#5b9cf6", boxShadow: "0 0 0 3px rgba(91,156,246,0.25)" }} />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Seed data ──────────────────────────────────────────────────────────────── */
function makeSeedEntry(
  id: string, sec: SectionId, sub: string, imageUrl: string, aiDetected: boolean,
  damageType: DamageType, assessment: Assessment, damageAssessment: DamageAssessment,
  confidence: number | undefined, comments: string, aiOriginal?: AIOriginal,
): DamageEntry {
  return {
    id, imageUrl, name: aiDetected ? "Damage Photo" : "Manual Entry", aiDetected, confidence,
    damageType, sectionLocation: sec, subLocation: sub,
    location: sub ? `${sec} — ${sub}` : sec,
    assessment, damageAssessment, comments, additionalPhotos: [], aiOriginal,
  };
}

const AI_ORIG_TANK: AIOriginal = { damageType: "Rust", assessment: "Repairable", damageAssessment: "Surface", comments: "Surface corrosion detected near base weld line. Appears containable — recommend grinding and repainting." };

const SEED_ENTRIES: DamageEntry[] = [
  /* ── Tank ── */
  makeSeedEntry("dmg-seed-1", "Tank", "Base", "/nameplate.png", true,  "Rust", "Repairable",     "Surface",    87,        "Surface corrosion detected near base weld line. Appears containable — recommend grinding and repainting.", AI_ORIG_TANK),
  makeSeedEntry("dmg-seed-4", "Tank", "Top Panel",       "",              false, "Dent", "Repairable",     "Surface",    undefined, "Minor dent on top panel from impact during transport. No structural concern.", undefined),
  makeSeedEntry("dmg-seed-5", "Tank", "Right Side Wall", "/nameplate.png", true,  "Rust", "Non-Repairable", "Structural", 73,        "Deep corrosion along right weld seam — metal thickness compromised. Recommend panel replacement.", undefined),
  /* ── Cabinet ── */
  makeSeedEntry("dmg-seed-2", "Cabinet", "Left Door",       "",              false, "Dent",  "Non-Repairable", "Structural", undefined, "Large dent on left door panel — hinge is misaligned and door no longer closes flush. Structural concern.", undefined),
  makeSeedEntry("dmg-seed-6", "Cabinet", "Top Cover",       "/nameplate.png", true,  "Rust",  "Repairable",     "Surface",    79,        "Surface rust on top cover. Recommend treatment and re-coating before storage.", undefined),
  makeSeedEntry("dmg-seed-7", "Cabinet", "Right Side Panel","",              false, "Holes", "Non-Repairable", "Structural", undefined, "Two puncture holes on right panel, likely from forklift contact. Structural damage to mounting frame.", undefined),
  /* ── Radiator ── */
  makeSeedEntry("dmg-seed-8", "Radiator", "Left Side",      "/nameplate.png", true,  "Dent",  "Non-Repairable", "Structural", 62,        "Significant fin deformation across the left cooling array. Thermal performance may be compromised.", undefined),
  makeSeedEntry("dmg-seed-9", "Radiator", "Bottom Section", "",              false, "Tears", "Non-Repairable", "Structural", undefined, "Torn fins along bottom edge. Coolant flow restriction possible — full replacement recommended.", undefined),
];

const SEED_PENDING: DamageEntry = makeSeedEntry("dmg-seed-3", "Radiator", "Left Side", "", false, "", "", "", undefined, "", undefined);

function deriveLocation(section: string, sub: string) {
  return sub ? `${section} — ${sub}` : section;
}

function newEntry(section: SectionId, sub: string, imageUrl: string, aiDetected: boolean, ai?: typeof MOCK_AI[SectionId]): DamageEntry {
  return {
    id: `dmg-${Date.now()}`, imageUrl, name: imageUrl ? "Damage Photo" : "Manual Entry",
    aiDetected, confidence: ai?.confidence,
    damageType: aiDetected && ai ? ai.damageType : "",
    sectionLocation: section, subLocation: sub, location: deriveLocation(section, sub),
    assessment: aiDetected && ai ? ai.assessment : "",
    damageAssessment: aiDetected && ai ? ai.damageAssessment : "",
    comments: aiDetected && ai ? ai.comments : "",
    additionalPhotos: [],
    aiOriginal: ai && aiDetected ? { damageType: ai.damageType, assessment: ai.assessment, damageAssessment: ai.damageAssessment, comments: ai.comments } : undefined,
  };
}

/* ─── Field label helper (matches Nameplate pattern) ────────────────────────── */
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
  );
}

/* ─── SegmentControl ─────────────────────────────────────────────────────────── */
function SegmentControl<T extends string>({
  options, value, onChange, disabled, activeColors, aiOriginal, size = "sm",
}: {
  options: readonly T[];
  value: string;
  onChange: (v: T) => void;
  disabled?: boolean;
  activeColors: Partial<Record<string, string>>;
  aiOriginal?: string;
  size?: "sm" | "md";
}) {
  const h = size === "md" ? 48 : 44;
  const fs = size === "md" ? 15 : 13;
  return (
    <div style={{ opacity: disabled ? 0.38 : 1, pointerEvents: disabled ? "none" : "auto" }}>
      <div style={{ display: "flex", borderRadius: 100, background: "hsl(var(--muted))", padding: 3, gap: 3, height: h }}>
        {options.map((opt) => {
          const isSelected = value === opt;
          const isAiSuggested = !value && aiOriginal === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              style={{ flex: 1, borderRadius: 100, fontSize: fs, cursor: "pointer", border: "none", transition: "all 0.15s", background: isSelected ? (activeColors[opt] ?? "#0047bb") : "transparent", color: isSelected ? "white" : "hsl(var(--muted-foreground))", fontWeight: isSelected ? 600 : 500, boxShadow: isSelected ? "0 1px 4px rgba(0,0,0,0.18)" : "none", outline: isAiSuggested ? "1px solid rgba(124,58,237,0.35)" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
            >
              {isSelected && <Check size={12} strokeWidth={2.5} />}
              {isAiSuggested && !isSelected && <Sparkles size={12} color="#7c3aed" />}
              {opt}
            </button>
          );
        })}
      </div>
      {value && aiOriginal && value !== aiOriginal && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <Sparkles size={10} color="#7c3aed" />
          <span style={{ fontSize: 12, color: "#7c3aed", fontWeight: 500 }}>AI detected: {aiOriginal}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Field Tooltip ──────────────────────────────────────────────────────────── */
function FieldTooltip({ label, items }: { label: string; items: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} className="h-5 w-5 rounded-full p-0">
        <HelpCircle size={14} className="text-muted-foreground/50" />
      </Button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", left: 24, top: 0, zIndex: 9999, width: 340, background: "hsl(var(--popover))", backdropFilter: "blur(20px)", borderRadius: 14, border: "1px solid hsl(var(--border))", boxShadow: "0 8px 40px rgba(0,0,0,0.22)", padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 8, borderBottom: "1px solid hsl(var(--border))", marginBottom: 10 }}>
              <HelpCircle size={13} color="#0047BB" />
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", color: "#0047BB" }}>{label}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "max-content 1fr", rowGap: 8, columnGap: 12 }}>
              {Object.entries(items).map(([term, desc]) => (
                <>
                  <span key={`t-${term}`} className="text-sm font-semibold text-foreground whitespace-nowrap">{term}</span>
                  <span key={`d-${term}`} className="text-sm text-muted-foreground">{desc}</span>
                </>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Confidence Badge (matches Nameplate's ConfidenceBadge style) ─────────── */
function ConfidenceBadge({ pct }: { pct: number }) {
  const isHigh = pct >= 60;
  return (
    <Badge className={cn(
      "gap-1 rounded-full font-semibold text-xs px-2 py-0.5",
      isHigh
        ? "border-[rgba(124,58,237,0.28)] bg-[rgba(124,58,237,0.10)] text-[#7C3AED]"
        : "border-[#FCD34D] bg-[#FEF3C7] text-[#92400E]",
    )}>
      <Sparkles size={10} strokeWidth={1.75} />
      AI was {pct}% Confident
    </Badge>
  );
}

/* ─── AI Restore Chip ────────────────────────────────────────────────────────── */
function AiRestoreChip({ aiValue, onRestore }: { aiValue: string; onRestore: () => void }) {
  return (
    <Button
      variant="ghost" size="sm" onClick={onRestore}
      className="h-[22px] px-2.5 rounded-full text-[11px] font-semibold gap-1 text-[#7c3aed] hover:text-[#7c3aed] border border-[rgba(124,58,237,0.22)] bg-[rgba(124,58,237,0.08)] hover:bg-[rgba(124,58,237,0.12)]"
    >
      <Sparkles size={10} />
      AI: {aiValue}
    </Button>
  );
}

/* ─── DamageCard (edit mode) ─────────────────────────────────────────────────── */
interface DamageCardProps {
  entry: DamageEntry; index: number; isPending?: boolean;
  onChange: (updated: DamageEntry) => void; onDelete: () => void; onLightbox: (url: string) => void;
}

function DamageCard({ entry, index, isPending, onChange, onDelete, onLightbox }: DamageCardProps) {
  const [collapsed, setCollapsed] = useState(!isPending);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [lpSection, setLpSection] = useState<SectionId>(entry.sectionLocation);
  const [lpSub, setLpSub] = useState(entry.subLocation);

  const isMissingMandatory = !entry.damageType || (entry.damageType !== "None" && (!entry.assessment || !entry.damageAssessment));
  const update = useCallback((patch: Partial<DamageEntry>) => onChange({ ...entry, ...patch }), [entry, onChange]);

  const smartTitle = entry.damageType
    ? `${entry.damageType} - ${entry.sectionLocation}${entry.subLocation ? " " + entry.subLocation : ""} #${index + 1}`
    : (entry.location ? `${entry.location} #${index + 1}` : `Finding #${index + 1}`);

  function handleDamageTypeChange(dt: DamageType) {
    if (dt === "None") update({ damageType: dt, assessment: "", damageAssessment: "" });
    else update({ damageType: dt });
  }

  function confirmLocationPicker() {
    update({ sectionLocation: lpSection, subLocation: lpSub, location: deriveLocation(lpSection, lpSub) });
    setShowLocationPicker(false);
  }

  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: isPending ? "#86efac" : "hsl(var(--border))", borderWidth: isPending ? 1.5 : 1, background: "hsl(var(--card))" }}>
      {isPending && (
        <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", background: entry.aiDetected ? "#dcfce7" : "#f0f9ff", borderBottom: entry.aiDetected ? "1px solid #86efac" : "1px solid #7dd3fc" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {entry.aiDetected ? <Check size={16} color="#16a34a" /> : <Camera size={16} color="#0369a1" />}
            <span style={{ fontSize: 13, color: entry.aiDetected ? "#14532d" : "#0c4a6e", fontWeight: 500 }}>
              {entry.aiDetected ? `AI detected ${entry.damageType || "potential"} damage — review details below.` : "Photo captured — AI could not detect damage type. Fill in details manually."}
            </span>
          </div>
          {entry.aiDetected && entry.confidence != null && <ConfidenceBadge pct={entry.confidence} />}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: collapsed ? "10px 12px" : "16px 20px", borderBottom: collapsed ? "none" : "1px solid hsl(var(--border))" }}>
        {collapsed && entry.imageUrl && (
          <img src={entry.imageUrl} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: "1px solid hsl(var(--border))", flexShrink: 0 }} />
        )}
        <span className="text-foreground" style={{ fontSize: 16, fontWeight: 600, flex: 1 }} onClick={() => setCollapsed((c) => !c)}>{smartTitle}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {!isPending && entry.aiDetected && entry.confidence != null && !collapsed && <ConfidenceBadge pct={entry.confidence} />}
          {!isPending && !entry.aiDetected && !collapsed && (
            <Badge variant="outline" className="text-xs font-medium text-muted-foreground">Manual Entry</Badge>
          )}
          {isPending && (
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => {}}>
              {entry.imageUrl ? <RotateCcw size={13} /> : <Camera size={13} />}
              {entry.imageUrl ? "Retake" : "Add Photo"}
            </Button>
          )}
          {!isPending && (
            <div style={{ position: "relative" }}>
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => setShowActionsMenu((v) => !v)}>
                <Settings2 size={13} /> Actions <ChevronDown size={13} />
              </Button>
              {showActionsMenu && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setShowActionsMenu(false)} />
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50, background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", minWidth: 176, overflow: "hidden" }}>
                    <Button variant="ghost" size="sm" onClick={() => { setShowLocationPicker(true); setShowActionsMenu(false); if (collapsed) setCollapsed(false); }} className="w-full justify-start gap-2 h-11 px-4 text-sm rounded-none text-foreground">
                      <MapPin size={14} /> Change Location
                    </Button>
                    <Separator />
                    <Button variant="ghost" size="sm" onClick={() => { onDelete(); setShowActionsMenu(false); }} className="w-full justify-start gap-2 h-11 px-4 text-sm rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 size={14} /> Delete Finding
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </Button>
        </div>
      </div>

      {collapsed && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "10px 20px 14px" }}>
          {[entry.damageType, entry.location, entry.assessment, entry.damageAssessment].filter(Boolean).map((chip, i) => (
            <Badge key={i} variant="outline" className="text-muted-foreground text-xs">{chip}</Badge>
          ))}
          {entry.additionalPhotos.length > 0 && (
            <Badge variant="outline" className="text-muted-foreground text-xs gap-1"><Plus size={11} /> +{entry.additionalPhotos.length} more</Badge>
          )}
          {isMissingMandatory && (
            <span className="ml-auto flex items-center gap-1 text-xs text-destructive flex-shrink-0">
              <AlertCircle size={11} /> Details pending
            </span>
          )}
        </div>
      )}

      {!collapsed && (
        <>
          {showLocationPicker && (
            <div style={{ padding: "16px 20px", background: "hsl(var(--muted))", borderBottom: "1px solid hsl(var(--border))", display: "flex", alignItems: "flex-end", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <FieldLabel label="Location" required />
                <Select value={lpSection} onValueChange={(v) => { setLpSection(v as SectionId); setLpSub(""); }}>
                  <SelectTrigger className="h-9 bg-background text-sm shadow-none"><SelectValue /></SelectTrigger>
                  <SelectContent>{(["Tank", "Cabinet", "Radiator"] as SectionId[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div style={{ flex: 1 }}>
                <FieldLabel label="Sublocation" required />
                <Select value={lpSub} onValueChange={setLpSub}>
                  <SelectTrigger className="h-9 bg-background text-sm shadow-none"><SelectValue placeholder={lpSection ? "Select sublocation" : "Select a location first"} /></SelectTrigger>
                  <SelectContent>{(SUB_LOCATIONS[lpSection] || []).map((s) => <SelectItem key={s.label} value={s.label}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" onClick={confirmLocationPicker}>
                <Check size={16} className="text-green-600" />
              </Button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, padding: "20px 20px 0" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <FieldLabel label="Damage Type" required />
                <FieldTooltip label="Damage Types" items={DAMAGE_TYPE_DESCS} />
              </div>
              <Select value={entry.damageType || ""} onValueChange={(v) => handleDamageTypeChange(v as DamageType)}>
                <SelectTrigger className="h-[44px] rounded-xl bg-muted text-foreground text-sm shadow-none border-border">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>{DAMAGE_TYPES.map((dt) => <SelectItem key={dt} value={dt}>{dt}</SelectItem>)}</SelectContent>
              </Select>
              {entry.damageType && entry.aiOriginal?.damageType && entry.damageType !== entry.aiOriginal.damageType && (
                <div className="mt-1"><AiRestoreChip aiValue={entry.aiOriginal.damageType} onRestore={() => update({ damageType: entry.aiOriginal!.damageType })} /></div>
              )}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <FieldLabel label={`Repairability${entry.damageType !== "None" ? "" : ""}`} required={entry.damageType !== "None"} />
                <FieldTooltip label="Repairability" items={REPAIRABILITY_DESCS} />
              </div>
              <SegmentControl
                options={["Repairable", "Non-Repairable"] as const}
                value={entry.assessment}
                onChange={(v) => update({ assessment: v as Assessment })}
                disabled={entry.damageType === "None"}
                activeColors={{ "Repairable": "#16a34a", "Non-Repairable": "#dc2626" }}
                aiOriginal={entry.aiOriginal?.assessment}
              />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <FieldLabel label="Damage Assessment" required={entry.damageType !== "None"} />
                <FieldTooltip label="Damage Assessment" items={DAMAGE_ASSESSMENT_DESCS} />
              </div>
              <SegmentControl
                options={["Surface", "Structural"] as const}
                value={entry.damageAssessment}
                onChange={(v) => update({ damageAssessment: v as DamageAssessment })}
                disabled={entry.damageType === "None"}
                activeColors={{ "Surface": "#0047bb", "Structural": "#b45309" }}
                aiOriginal={entry.aiOriginal?.damageAssessment}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: 20 }}>
            <div style={{ width: 160, flexShrink: 0 }}>
              <FieldLabel label="Photo" />
              {entry.imageUrl ? (
                <div style={{ width: 160, height: 120, borderRadius: 12, border: "1px solid hsl(var(--border))", cursor: "zoom-in", position: "relative", overflow: "hidden" }} onClick={() => onLightbox(entry.imageUrl)}>
                  <img src={entry.imageUrl} alt="damage" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 6, background: "rgba(0,0,0,0.42)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Maximize2 size={13} color="white" />
                  </div>
                </div>
              ) : (
                <div style={{ width: 160, height: 120, borderRadius: 12, border: "1.5px dashed hsl(var(--border))", background: "hsl(var(--muted)/0.4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Camera size={24} className="text-muted-foreground/40" />
                  <span className="text-muted-foreground/50 text-xs">No Photo</span>
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <FieldLabel label="Comments" />
                {entry.aiOriginal?.comments && <Sparkles size={12} color="#7c3aed" />}
              </div>
              <Textarea
                value={entry.comments}
                onChange={(e) => update({ comments: e.target.value })}
                placeholder="Add observation notes…"
                rows={4}
                className="rounded-xl shadow-none bg-muted text-foreground border-border resize-none text-sm"
                style={{ minHeight: 120 }}
              />
              {entry.comments !== entry.aiOriginal?.comments && entry.aiOriginal?.comments && (
                <div className="mt-1"><AiRestoreChip aiValue="original comment" onRestore={() => update({ comments: entry.aiOriginal!.comments })} /></div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── BaseInspectionCard (edit mode) ─────────────────────────────────────────── */
function BaseInspectionCard({ status, onClean, onDocumentDamage, onDismiss }: {
  status: BaseStatus; onClean: () => void; onDocumentDamage: () => void; onDismiss: () => void;
}) {
  const cfg = {
    pending:  { border: "#fde047", iconBg: "rgba(254,249,195,0.70)", iconColor: "#ca8a04", title: "Tank Inspection (Required)", titleCls: "text-foreground", subtitle: "If you have access to the tank during transportation, take a photo, or upload a photo taken during available access." },
    damaged:  { border: "#3b82f6", iconBg: "rgba(59,130,246,0.12)", iconColor: "#3b82f6", title: "Tank Inspection — Damage Documented", titleCls: "text-blue-600", subtitle: "Tank damage has been documented below." },
    clean:    { border: "#16a34a", iconBg: "rgba(22,163,74,0.12)", iconColor: "#16a34a", title: "Tank Inspection — No Damage", titleCls: "text-green-700", subtitle: "Tank confirmed clean. No corrosion or damage found." },
    dismissed:{ border: "hsl(var(--border))", iconBg: "hsl(var(--muted))", iconColor: "hsl(var(--muted-foreground))", title: "Tank Inspection — Dismissed", titleCls: "text-muted-foreground", subtitle: "" },
  }[status];

  return (
    <div className="rounded-2xl" style={{ display: "flex", gap: 24, padding: 24, background: "hsl(var(--card))", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: `2.5px solid ${cfg.border}`, cursor: status === "damaged" ? "pointer" : "default" }} onClick={status === "damaged" ? onDismiss : undefined} title={status === "damaged" ? "Tap to dismiss" : undefined}>
      <div style={{ width: 80, height: 80, borderRadius: 14, background: cfg.iconBg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.iconColor }}>
        {status === "clean" && <Check size={32} />}
        {status === "damaged" && <Camera size={32} />}
        {(status === "pending" || status === "dismissed") && <Package2 size={32} />}
      </div>
      <div style={{ flex: 1 }}>
        <div className={`text-base font-semibold mb-1.5 ${cfg.titleCls}`}>{cfg.title}</div>
        {cfg.subtitle && <p className="text-sm text-muted-foreground" style={{ marginBottom: status === "pending" ? 16 : 0 }}>{cfg.subtitle}</p>}
        {status === "pending" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 232 }}>
            <Button className="gap-2 rounded-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold" onClick={onClean}>
              <Check size={16} /> No Damage Found
            </Button>
            <Button className="gap-2 rounded-full h-11 bg-[#0047bb] hover:bg-[#0040aa] text-white font-semibold" onClick={onDocumentDamage}>
              <Camera size={16} /> Document Tank Damage
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SectionCard (edit mode) ────────────────────────────────────────────────── */
interface SectionCardProps {
  section: SectionId; entries: DamageEntry[]; pendingEntry: DamageEntry | null;
  baseStatus?: BaseStatus;
  onBaseClean?: () => void; onBaseDocument?: () => void; onBaseDismiss?: () => void;
  onDocumentContextual: (section: SectionId, sub?: string) => void;
  onEntryChange: (id: string, updated: DamageEntry) => void;
  onEntryDelete: (id: string) => void;
  onPendingChange: (updated: DamageEntry) => void;
  onLightbox: (url: string) => void;
}

function SectionCard({ section, entries, pendingEntry, baseStatus, onBaseClean, onBaseDocument, onBaseDismiss, onDocumentContextual, onEntryChange, onEntryDelete, onPendingChange, onLightbox }: SectionCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const si = SECTION_INFO[section];

  const sublocsWithFindings = [...new Set(entries.map((e) => e.subLocation).filter(Boolean))];
  const tabs = sublocsWithFindings.length > 0 ? ["All", ...sublocsWithFindings] : [];
  const filteredEntries = activeTab === "All" ? entries : entries.filter((e) => e.subLocation === activeTab);
  const showBaseCard = section === "Tank" && baseStatus && baseStatus !== "dismissed";
  const isPendingHere = pendingEntry?.sectionLocation === section;

  return (
    <Card className="mb-4 shadow-none rounded-xl overflow-hidden" style={{ border: si.cardBorder }}>
      <div onClick={() => setExpanded((e) => !e)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: si.headerGradient, cursor: "pointer" }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: si.iconBg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: si.iconColor }}>{si.icon}</div>
        <span className="text-foreground text-base font-semibold">{section}</span>
        <span className="text-muted-foreground text-sm">
          {entries.length === 0 && !isPendingHere ? "no findings" : `${entries.length + (isPendingHere ? 1 : 0)} finding${entries.length + (isPendingHere ? 1 : 0) !== 1 ? "s" : ""}`}
        </span>
        <div className="flex-1" />
        <div style={{ width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${si.iconColor}`, display: "flex", alignItems: "center", justifyContent: "center", color: si.iconColor }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {expanded && (
        <CardContent className="p-0">
          <div style={{ borderTop: si.bodyDivider, padding: "14px 14px 16px", background: si.bodyBg }}>
            {showBaseCard && (
              <div className="mb-4">
                <BaseInspectionCard status={baseStatus!} onClean={onBaseClean!} onDocumentDamage={onBaseDocument!} onDismiss={onBaseDismiss!} />
              </div>
            )}
            {tabs.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab;
                    const count = tab === "All" ? null : entries.filter((e) => e.subLocation === tab).length;
                    return (
                      <Button
                        key={tab} size="sm" onClick={() => setActiveTab(tab)}
                        variant={isActive ? "default" : "outline"}
                        className="rounded-full h-8 text-[13px] font-medium"
                        style={isActive ? { background: si.iconColor, borderColor: si.iconColor, color: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" } : { color: "hsl(var(--muted-foreground))" }}
                      >
                        {tab}{count != null && <span className="ml-1.5 opacity-70 text-[12px]">{count}</span>}
                      </Button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" className="gap-2 rounded-full h-9" style={{ borderColor: si.iconColor, color: si.iconColor }} onClick={() => onDocumentContextual(section, activeTab !== "All" ? activeTab : undefined)}>
                  <Camera size={14} /> Document {activeTab !== "All" ? `${section} ${activeTab}` : section} Damage
                </Button>
              </div>
            )}
            {filteredEntries.length === 0 && !isPendingHere ? (
              <div className="text-muted-foreground rounded-xl text-sm border border-dashed border-border p-3 text-center" style={{ background: "rgba(255,255,255,0.10)" }}>
                {activeTab !== "All" ? "No findings for this sublocation" : "No findings yet for this section"}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredEntries.map((e) => (
                  <DamageCard key={e.id} entry={e} index={entries.indexOf(e)} onChange={(u) => onEntryChange(e.id, u)} onDelete={() => onEntryDelete(e.id)} onLightbox={onLightbox} />
                ))}
              </div>
            )}
            {isPendingHere && (
              <div style={{ marginTop: filteredEntries.length > 0 ? 12 : 0 }}>
                <DamageCard entry={pendingEntry!} index={entries.length} isPending onChange={onPendingChange} onDelete={() => {}} onLightbox={onLightbox} />
              </div>
            )}
            {tabs.length === 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: (filteredEntries.length > 0 || isPendingHere) ? 12 : 0 }}>
                <Button variant="outline" size="sm" className="gap-2 rounded-full h-9" style={{ borderColor: si.iconColor, color: si.iconColor }} onClick={() => onDocumentContextual(section)}>
                  <Camera size={14} /> Document {section} Damage
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/* ─── ReadOnlySectionCard (view mode) ────────────────────────────────────────── */
const DAMAGE_TYPE_BADGE: Record<string, string> = {
  Rust: "border-amber-300 bg-amber-100 text-amber-800",
  Dent: "border-blue-300 bg-blue-100 text-blue-800",
  Leak: "border-cyan-300 bg-cyan-100 text-cyan-800",
  "Arc Damage": "border-red-300 bg-red-100 text-red-800",
  Holes: "border-orange-300 bg-orange-100 text-orange-800",
  Tears: "border-rose-300 bg-rose-100 text-rose-800",
  None: "border-border bg-muted text-muted-foreground",
};

function ReadOnlySectionCard({
  section, entries, pendingEntry, baseStatus, onLightbox,
}: {
  section: SectionId; entries: DamageEntry[]; pendingEntry: DamageEntry | null;
  baseStatus?: BaseStatus; onLightbox: (url: string) => void;
}) {
  const si = SECTION_INFO[section];
  const allRows = [...entries, ...(pendingEntry?.sectionLocation === section ? [pendingEntry] : [])];
  const findingCount = entries.length + (pendingEntry?.sectionLocation === section ? 1 : 0);

  const baseStatusLabel: Record<BaseStatus, string> = {
    pending:   "Pending Review",
    damaged:   "Damage Documented",
    clean:     "No Damage",
    dismissed: "Dismissed",
  };

  return (
    <Card className="mb-4 shadow-none rounded-xl overflow-hidden border border-border">
      {/* Neutral header — only the icon keeps its section colour */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-muted/30">
        <div style={{ width: 34, height: 34, borderRadius: 10, background: si.iconBg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: si.iconColor }}>
          {si.icon}
        </div>
        <span className="text-foreground text-sm font-semibold">{section}</span>
        <span className="text-xs text-muted-foreground">
          {findingCount} finding{findingCount !== 1 ? "s" : ""}
        </span>
      </div>

      <CardContent className="p-0">
        {/* Tank base inspection — always shown, plain text */}
        {section === "Tank" && baseStatus && (
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border bg-muted/20">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Base Inspection</span>
            <span className="text-sm text-foreground">{baseStatusLabel[baseStatus]}</span>
          </div>
        )}

        {allRows.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No damage findings documented</p>
          </div>
        ) : (
          <Table style={{ tableLayout: "fixed", width: "100%" }}>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                {/* Fixed widths — tableLayout:fixed enforces these across all section tables */}
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider" style={{ width: 36 }}>#</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider" style={{ width: 82 }}>Photo</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider" style={{ width: 108 }}>Sub-location</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider" style={{ width: 95 }}>Damage Type</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider" style={{ width: 95 }}>Repairability</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider" style={{ width: 85 }}>Assessment</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider" style={{ width: 148 }}>Capture Method</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRows.map((entry, idx) => {
                const isIncomplete = !entry.damageType || (entry.damageType !== "None" && (!entry.assessment || !entry.damageAssessment));
                return (
                  <TableRow key={entry.id} className="hover:bg-muted/20">
                    {/* # — row number only */}
                    <TableCell className="py-4 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm font-medium text-muted-foreground">{idx + 1}</span>
                        {isIncomplete && (
                          <Badge className="text-[9px] px-1 py-0 gap-0.5 border-amber-300 bg-amber-100 text-amber-800 font-semibold leading-tight whitespace-nowrap">
                            <AlertCircle size={8} /> Incomplete
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {/* Photo — thumbnail or placeholder */}
                    <TableCell className="py-4 align-top">
                      {entry.imageUrl ? (
                        <img
                          src={entry.imageUrl} alt="damage"
                          onClick={() => onLightbox(entry.imageUrl)}
                          className="w-14 h-14 rounded-md object-cover cursor-zoom-in border border-border"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-md border border-dashed border-border bg-muted/40 flex flex-col items-center justify-center gap-0.5">
                          <Camera size={13} className="text-muted-foreground/30" />
                          <span className="text-[8px] font-medium text-muted-foreground/40 leading-none">No Image</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-sm text-foreground align-top">{entry.subLocation || entry.sectionLocation || "—"}</TableCell>
                    <TableCell className="py-4 text-sm text-foreground align-top">{entry.damageType || "—"}</TableCell>
                    <TableCell className="py-4 text-sm text-foreground align-top">{entry.assessment || "—"}</TableCell>
                    <TableCell className="py-4 text-sm text-foreground align-top">{entry.damageAssessment || "—"}</TableCell>
                    <TableCell className="py-4 align-top">
                      {entry.aiDetected && entry.confidence != null ? (
                        <ConfidenceBadge pct={entry.confidence} />
                      ) : (
                        <span className="text-sm text-foreground">Manual</span>
                      )}
                    </TableCell>
                    {/* Notes — wraps freely */}
                    <TableCell className="py-4 text-sm text-muted-foreground align-top">
                      {entry.comments || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Modals ─────────────────────────────────────────────────────────────────── */
function ModalOverlay({ onClose, children }: { onClose?: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.58)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function LocationSelectorModal({ onSelect, onCancel }: { onSelect: (s: SectionId) => void; onCancel: () => void }) {
  return (
    <ModalOverlay onClose={onCancel}>
      <div className="rounded-3xl overflow-hidden" style={{ width: 520, background: "hsl(var(--background))", boxShadow: "0 24px 60px rgba(0,0,0,0.38)" }}>
        <div style={{ padding: "28px 20px 18px", textAlign: "center" }}>
          <div className="text-foreground text-2xl font-bold mb-1">Where is the damage?</div>
          <div className="text-muted-foreground text-base">Select the section of the transformer</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, padding: "0 20px 18px" }}>
          {(["Tank", "Cabinet", "Radiator"] as SectionId[]).map((sec) => {
            const si = SECTION_INFO[sec];
            return (
              <Button
                key={sec} variant="outline" onClick={() => onSelect(sec)}
                className="rounded-2xl h-auto flex-col gap-3.5 py-7 px-4 shadow-sm hover:scale-[1.02] transition-transform"
              >
                <div style={{ width: 84, height: 84, borderRadius: 16, background: si.iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: si.iconColor }}>{SECTION_ICON_LG[sec]}</div>
                <span className="text-foreground text-base font-semibold">{sec}</span>
              </Button>
            );
          })}
        </div>
        <div style={{ padding: "0 20px 24px" }}>
          <Button variant="secondary" className="w-full h-12 text-base rounded-2xl" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function SublocationSelectorModal({ section, onSelect, onBack, onCancel }: { section: SectionId; onSelect: (sub: string) => void; onBack: () => void; onCancel: () => void }) {
  const si = SECTION_INFO[section];
  const subLocs = SUB_LOCATIONS[section];
  const cols = Math.min(subLocs.length, 4);
  return (
    <ModalOverlay onClose={onCancel}>
      <div className="rounded-3xl overflow-hidden" style={{ width: 580, background: "hsl(var(--background))", boxShadow: "0 24px 60px rgba(0,0,0,0.38)" }}>
        <div style={{ padding: "28px 20px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ color: si.iconColor, display: "flex", alignItems: "center" }}>{si.icon}</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: si.iconColor }}>{section}</span>
          </div>
          <div className="text-foreground text-2xl font-bold mb-1">Select Sub-location</div>
          <div className="text-muted-foreground text-base">Where exactly is the damage located?</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12, padding: "0 20px 18px" }}>
          {subLocs.map((sub) => (
            <Button
              key={sub.label} variant="outline" onClick={() => onSelect(sub.label)}
              className="rounded-2xl h-auto flex-col gap-2.5 py-5 px-2 shadow-sm hover:scale-[1.02] transition-transform"
            >
              <div style={{ width: 56, height: 56, borderRadius: 12, background: si.iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: si.iconColor, transform: sub.flip ? "scaleX(-1)" : undefined }}>{sub.icon}</div>
              <span className="text-foreground text-sm font-semibold text-center leading-tight">{sub.label}</span>
            </Button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, padding: "0 20px 24px" }}>
          <Button variant="secondary" className="flex-1 h-12 text-base rounded-2xl gap-2" onClick={onBack}><ChevronLeft size={16} /> Back</Button>
          <Button variant="secondary" className="flex-1 h-12 text-base rounded-2xl" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function PhotoSourceModal({ onTakePhoto, onUpload, onWithoutPhoto, onCancel }: { onTakePhoto: () => void; onUpload: () => void; onWithoutPhoto: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.50)", paddingBottom: 48 }}>
      <div className="rounded-2xl overflow-hidden" style={{ width: 420, background: "hsl(var(--background))", boxShadow: "0 24px 60px rgba(0,0,0,0.32)" }}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid hsl(var(--border))", textAlign: "center" }}>
          <div className="text-foreground text-lg font-semibold mb-1">Add a Photo</div>
          <div className="text-muted-foreground text-sm">How would you like to document this damage?</div>
        </div>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Take Photo", icon: <Camera size={20} className="text-[#0047bb]" />, action: onTakePhoto },
            { label: "Upload Photo", icon: <Upload size={20} className="text-[#0047bb]" />, action: onUpload },
            { label: "Enter Without Photo", icon: <EyeOff size={20} className="text-[#0047bb]" />, action: onWithoutPhoto },
          ].map(({ label, icon, action }) => (
            <Button
              key={label} variant="ghost" onClick={action}
              className="h-14 rounded-2xl justify-start gap-3.5 px-5 text-base font-medium text-foreground bg-card hover:bg-accent"
            >
              {icon} {label}
            </Button>
          ))}
          <Separator />
          <Button variant="ghost" onClick={onCancel} className="h-14 rounded-2xl text-muted-foreground text-base font-medium w-full bg-card hover:bg-accent">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function AIAnalyzingOverlay({ onCancel }: { onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.50)" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div className="rounded-3xl" style={{ position: "relative", background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", boxShadow: "0 24px 80px rgba(0,0,0,0.28)", padding: "52px 64px 44px", minWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <Button variant="ghost" size="icon" onClick={onCancel} className="absolute top-3 right-3 h-8 w-8 text-muted-foreground">
          <X size={16} />
        </Button>
        <Loader2 size={36} color="#0047BB" style={{ animation: "spin 0.8s linear infinite" }} />
        <div className="text-center">
          <div className="text-foreground text-xl font-semibold mb-1">AI is analysing the image.</div>
          <div className="text-muted-foreground text-sm">Please hold on.</div>
        </div>
      </div>
    </div>
  );
}

function BaseDamageAlert({ onProceed, onGoBack }: { onProceed: () => void; onGoBack: () => void }) {
  return (
    <ModalOverlay>
      <div className="rounded-3xl" style={{ width: 340, background: "hsl(var(--background))", boxShadow: "0 8px 40px rgba(0,0,0,0.28)", border: "1px solid hsl(var(--border))", padding: "32px 28px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(251,191,36,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Flag size={22} color="#d97706" />
        </div>
        <div className="text-center">
          <div className="text-foreground text-lg font-semibold mb-2">Base Damage Not Documented</div>
          <div className="text-muted-foreground text-sm leading-relaxed">
            We noticed this transformer is flagged with Base Damage, and no Tank damage has been documented. Would you still like to proceed?
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Button className="h-12 rounded-full text-base font-semibold gap-2 bg-amber-500 hover:bg-amber-600 text-white border-none" onClick={onProceed}>Proceed Anyway</Button>
          <Button variant="outline" className="h-12 rounded-full text-base font-semibold" onClick={onGoBack}>Go Back &amp; Document</Button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10002, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)", cursor: "zoom-out" }} onClick={onClose}>
      <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-12 right-12 h-9 w-9 rounded-full text-white bg-white/18 hover:bg-white/25">
        <X size={16} />
      </Button>
      <img src={url} alt="damage" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1100, maxHeight: 820, objectFit: "contain", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.50)", cursor: "default" }} />
    </div>
  );
}

/* ─── Seed comments ──────────────────────────────────────────────────────────── */
const SEED_COMMENTS = [
  { initials: "ML", color: "#7c3aed", name: "Maria Lopez", role: "Field Evaluator", time: "3 hours ago", text: "Cabinet left door is completely non-functional — the hinge has failed and the panel is deformed. Unit will likely need a full cabinet replacement rather than a panel repair." },
  { initials: "JW", color: "#047857", name: "James Wright", role: "QA Supervisor", time: "1 hour ago", text: "Tank base rust confirmed as surface-level only. Recommend prep and re-coat before redeployment. Cleared for Repair category." },
];

/* ─── Main ConditionPage ─────────────────────────────────────────────────────── */
export default function ConditionPage() {
  const { selectedUnit, setCurrentPage } = useDemoContext();

  const unit = selectedUnit ?? {
    manufacturer: "Siemens", icNumber: "185840632", mfgSerial: "TF-7662-N", kva: 1750,
    site: "KSSO", loadNumber: "LN-4821", transformerType: "Three-Phase Pad",
    hasBaseDamage: true, intakeTags: ["NPX: Rewind"],
  };

  /* ── Damage state ── */
  const [entries, setEntries]           = useState<DamageEntry[]>(SEED_ENTRIES);
  const [currentEntry, setCurrentEntry] = useState<DamageEntry | null>(SEED_PENDING);
  const [baseStatus, setBaseStatus]     = useState<BaseStatus>("damaged");

  /* ── Edit / save state ── */
  const [editMode, setEditMode]         = useState(false);
  const [saveState, setSaveState]       = useState<SaveState>("idle");
  const [savedTimestamp, setSavedTimestamp] = useState<number | null>(null);
  const [snapshot, setSnapshot]         = useState<Snapshot>({ entries: SEED_ENTRIES, baseStatus: "damaged", currentEntry: SEED_PENDING });

  /* ── Modal ── */
  const [modalStep, setModalStep]       = useState<ModalStep>(null);
  const [flowSection, setFlowSection]   = useState<SectionId | null>(null);
  const [flowSublocation, setFlowSublocation] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl]   = useState<string | null>(null);

  /* ── Stepper ── */
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set([0]));
  const STEP_PAGES: Record<number, "nameplate" | "condition" | "electrical"> = { 0: "nameplate", 1: "electrical", 2: "condition" };
  const handleStepClick = (i: number) => { const p = STEP_PAGES[i]; if (p) setCurrentPage(p); };
  const toggleComplete = (i: number) => setCompletedSteps((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  /* ── Comments ── */
  const [comments, setComments]         = useState(SEED_COMMENTS);
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [editingCommentIdx, setEditingCommentIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft]       = useState("");

  /* ── File input ── */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Document damage flow ── */
  function openDocumentFlow(preSection?: SectionId, preSub?: string) {
    if (preSection && preSub) { setFlowSection(preSection); setFlowSublocation(preSub); setModalStep("photoSource"); }
    else if (preSection)      { setFlowSection(preSection); setFlowSublocation(null);   setModalStep("sublocation"); }
    else                      { setFlowSection(null);       setFlowSublocation(null);   setModalStep("location"); }
  }

  function commitNewEntry(entry: DamageEntry) {
    if (currentEntry) setEntries((prev) => [...prev, currentEntry]);
    setCurrentEntry(entry);
    if (entry.sectionLocation === "Tank" && baseStatus === "pending") setBaseStatus("damaged");
  }

  function simulateTakePhoto() {
    setModalStep("aiAnalyzing");
    setTimeout(() => {
      const sec = flowSection!;
      commitNewEntry(newEntry(sec, flowSublocation ?? "", "/nameplate.png", true, MOCK_AI[sec]));
      setModalStep(null);
    }, 1800);
  }

  function handleUploadPhoto() { setModalStep(null); setTimeout(() => fileInputRef.current?.click(), 50); }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setModalStep("aiAnalyzing");
      setTimeout(() => {
        commitNewEntry(newEntry(flowSection!, flowSublocation ?? "", url, true, MOCK_AI[flowSection!]));
        setModalStep(null);
      }, 1800);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleWithoutPhoto() {
    commitNewEntry(newEntry(flowSection!, flowSublocation ?? "", "", false));
    setModalStep(null);
  }

  /* ── Edit mode save/discard ── */
  function handleSave() {
    if (saveState === "saving") return;
    setSaveState("saving");
    setTimeout(() => {
      setSnapshot({ entries, baseStatus, currentEntry });
      setSaveState("saved");
      setSavedTimestamp(Date.now());
      setEditMode(false);
      setTimeout(() => setSaveState("savedAgo"), 2000);
    }, 600);
  }

  function handleDiscard() {
    setEntries(snapshot.entries);
    setBaseStatus(snapshot.baseStatus);
    setCurrentEntry(snapshot.currentEntry);
    setEditMode(false);
  }

  /* ── Validation (applies in edit mode only for Next button) ── */
  const allEntries = [...entries, ...(currentEntry ? [currentEntry] : [])];
  const hasUnconfirmedAssessments = allEntries.some(
    (e) => e.damageType === "" || (e.damageType !== "None" && (e.assessment === "" || e.damageAssessment === ""))
  );
  const hasTankFindings = allEntries.some((e) => e.sectionLocation === "Tank");

  function handleNext() {
    if (editMode && hasUnconfirmedAssessments) return;
    if (unit.hasBaseDamage && !hasTankFindings) { setModalStep("baseDamageAlert"); return; }
    setCurrentPage("electrical");
  }

  const nextDisabled = editMode && hasUnconfirmedAssessments;

  const npxTags = unit.intakeTags.filter((t: string) => t.startsWith("NPX: "));

  /* ── Stats for view mode ── */
  const totalFindings = entries.length + (currentEntry ? 1 : 0);
  const sectionsWithDamage = (["Tank", "Cabinet", "Radiator"] as SectionId[]).filter((s) => allEntries.some((e) => e.sectionLocation === s)).length;
  const aiDetectedCount = entries.filter((e) => e.aiDetected).length;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
      <PortalHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden">

          {/* ── Dark sub-header (identical pattern to NameplatePage) ── */}
          <div className="flex items-center gap-3 px-6 flex-shrink-0 flex-wrap min-h-12"
            style={{ background: "#0d1629", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>

            <Button
              variant="outline" size="sm"
              onClick={() => setCurrentPage("nameplate")}
              className="gap-1.5 border-white/22 bg-white/8 text-white/85 hover:bg-white/15 hover:text-white flex-shrink-0"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Back to Nameplate
            </Button>

            <Separator orientation="vertical" className="h-4 bg-white/15 flex-shrink-0" />

            {/* Transformer metadata pills */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              <Badge variant="outline" className="text-xs font-medium text-white/80 bg-white/7 border-white/12 rounded-md px-2.5 py-0.5 gap-1.5">
                {TRANSFORMER_TYPE_ABBR[unit.transformerType] ?? unit.transformerType}
                <span className="text-white/30">|</span>
                {unit.manufacturer}
              </Badge>
              {([["IC", unit.icNumber], ["S#", unit.mfgSerial], ["kVA", unit.kva.toLocaleString()]] as [string, string][]).map(([lbl, val]) => (
                <Badge key={lbl} variant="outline" className="text-xs font-medium text-white/80 bg-white/7 border-white/12 rounded-md px-2.5 py-0.5 gap-1.5">
                  {lbl}<span className="text-white/30">|</span>{val}
                </Badge>
              ))}
              {npxTags.map((tag: string) => {
                const sep = tag.indexOf(": ");
                const lbl = sep !== -1 ? tag.slice(0, sep) : null;
                const val = sep !== -1 ? tag.slice(sep + 2) : tag;
                return (
                  <Badge key={tag} variant="outline" className="text-xs font-medium text-white/80 bg-white/7 border-white/12 rounded-md px-2.5 py-0.5 gap-1.5">
                    {lbl}{lbl && <span className="text-white/30">|</span>}{val}
                  </Badge>
                );
              })}
              {unit.hasBaseDamage && (
                <Badge className="text-xs font-semibold gap-1.5 rounded-md px-2.5 py-0.5 border-[rgba(234,88,12,0.45)] bg-[rgba(234,88,12,0.25)] text-[#FEF3C7]">
                  <Flag size={11} strokeWidth={2} /> Base Damage
                </Badge>
              )}
            </div>

            {/* Right: Edit / Save / Discard */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {saveState === "saved" && !editMode && (
                <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium mr-1">
                  <CheckCircle2 size={14} /> Saved
                </div>
              )}
              {saveState === "savedAgo" && !editMode && savedTimestamp && (
                <span className="text-white/40 text-xs mr-1">
                  Saved {Math.round((Date.now() - savedTimestamp) / 1000)}s ago
                </span>
              )}
              {editMode ? (
                <>
                  <Button
                    variant="ghost" size="sm"
                    onClick={handleDiscard}
                    className="gap-1.5 border border-white/22 text-white/75 hover:bg-white/8 hover:text-white"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Discard Changes
                  </Button>
                  <Button
                    size="sm"
                    disabled={saveState === "saving"}
                    onClick={handleSave}
                    className="gap-1.5 bg-[#0047BB] border-[#0047BB] text-white hover:bg-[#0040AA]"
                  >
                    {saveState === "saving" ? <Loader2 size={12} className="animate-spin" /> : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                    {saveState === "saving" ? "Saving…" : "Save"}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setEditMode(true)}
                  className="flex-shrink-0 gap-1.5 bg-[#0047BB] border-[#0047BB] text-white hover:bg-[#0040AA]"
                >
                  <Pencil size={12} />
                  Edit
                </Button>
              )}
            </div>
          </div>

          {/* ── Content: stepper panel + scrollable right ── */}
          <div className="flex-1 overflow-hidden flex">

            {/* Left: dark stepper panel */}
            <div className="w-[230px] flex-shrink-0 overflow-auto py-6 px-4"
              style={{ background: "#0d1629", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
              <EvalStepper
                activeStep={2}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
                onToggleComplete={toggleComplete}
              />
            </div>

            {/* Right: scrollable content */}
            <div className="flex-1 overflow-auto px-8 py-6">
              <div className="max-w-[900px] mx-auto">

                {/* Page heading */}
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-foreground mb-1">Condition Assessment</h1>
                  <p className="text-sm text-muted-foreground">Review physical damage findings for this transformer unit</p>
                </div>

                {/* Summary stats */}
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  <Badge variant="outline" className="gap-1.5 text-xs font-semibold">
                    <AlertCircle size={11} /> {totalFindings} Finding{totalFindings !== 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="outline" className="gap-1.5 text-xs font-semibold">
                    {sectionsWithDamage} of 3 Sections Affected
                  </Badge>
                  {aiDetectedCount > 0 && (
                    <Badge className="gap-1.5 text-xs font-semibold border-[rgba(124,58,237,0.28)] bg-[rgba(124,58,237,0.10)] text-[#7C3AED]">
                      <Sparkles size={11} strokeWidth={1.75} /> {aiDetectedCount} AI Detected
                    </Badge>
                  )}
                  {editMode && (
                    <Badge className="gap-1.5 text-xs font-semibold border-amber-300 bg-amber-100 text-amber-800">
                      <Pencil size={10} /> Editing
                    </Badge>
                  )}
                </div>

                {/* Evaluation Comments accordion */}
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
                            {comments.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="flex flex-col gap-3 pt-1">
                          {comments.map((c, idx) => {
                            const isOwn = c.initials === "YU";
                            const isEditing = editingCommentIdx === idx;
                            return (
                              <Card key={idx} className={cn("shadow-none rounded-lg", isEditing ? "border-[#0047BB]" : "border-border", "bg-muted/50")}>
                                <CardContent className="p-3.5">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Avatar className="h-7 w-7 flex-shrink-0">
                                      <AvatarFallback className="text-[10px] font-bold text-white" style={{ background: c.color }}>{c.initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-foreground">{c.name}</p>
                                      <p className="text-xs text-muted-foreground">{c.role} · {c.time}</p>
                                    </div>
                                    {isOwn && !isEditing && (
                                      <div className="flex items-center gap-0.5 flex-shrink-0">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => { setEditingCommentIdx(idx); setEditDraft(c.text); }}>
                                          <Pencil size={13} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setComments((prev) => prev.filter((_, i) => i !== idx))}>
                                          <Trash2 size={13} />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  {isEditing ? (
                                    <div>
                                      <Textarea autoFocus value={editDraft} onChange={(e) => setEditDraft(e.target.value)} rows={3} className="text-sm resize-none bg-background shadow-none" />
                                      <div className="flex justify-end gap-1.5 mt-2">
                                        <Button variant="outline" size="sm" onClick={() => setEditingCommentIdx(null)}>Cancel</Button>
                                        <Button size="sm" disabled={!editDraft.trim()} onClick={() => { if (!editDraft.trim()) return; setComments((prev) => prev.map((item, i) => i === idx ? { ...item, text: editDraft.trim(), time: "Edited · Just now" } : item)); setEditingCommentIdx(null); }} className="bg-[#0047BB] border-[#0047BB] text-white hover:bg-[#0040AA]">Save</Button>
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
                                <Button variant="outline" size="sm" onClick={() => setCommentDraft("")}>Cancel</Button>
                              )}
                              <Button
                                size="sm"
                                disabled={!commentDraft.trim() || postingComment}
                                onClick={() => {
                                  if (!commentDraft.trim()) return;
                                  setPostingComment(true);
                                  setTimeout(() => {
                                    setComments((prev) => [...prev, { initials: "YU", color: "#182557", name: "You", role: "Supervisor", time: "Just now", text: commentDraft.trim() }]);
                                    setCommentDraft(""); setPostingComment(false);
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

                {/* Document Damage CTA (edit mode only) */}
                {editMode && (
                  <Card className="mb-6 shadow-none rounded-xl border-dashed border-[#0047bb]/40 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => openDocumentFlow()}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(59,130,246,0.10)", border: "1px solid rgba(147,197,253,0.40)" }}>
                        <Camera size={26} color="#2563eb" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground mb-0.5">Document Damage</p>
                        <p className="text-sm text-muted-foreground">Take or upload a photo — AI will automatically detect damage type and severity.</p>
                      </div>
                      <Button className="gap-2 bg-[#0047bb] hover:bg-[#0040aa] text-white font-semibold flex-shrink-0 shadow-md" onClick={(e) => { e.stopPropagation(); openDocumentFlow(); }}>
                        <Camera size={15} /> Document Damage
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Section cards — view mode or edit mode */}
                {(["Tank", "Cabinet", "Radiator"] as SectionId[]).map((sec) =>
                  editMode ? (
                    <SectionCard
                      key={sec}
                      section={sec}
                      entries={entries.filter((e) => e.sectionLocation === sec)}
                      pendingEntry={currentEntry?.sectionLocation === sec ? currentEntry : null}
                      baseStatus={sec === "Tank" ? baseStatus : undefined}
                      onBaseClean={() => setBaseStatus("clean")}
                      onBaseDocument={() => openDocumentFlow("Tank")}
                      onBaseDismiss={() => setBaseStatus("dismissed")}
                      onDocumentContextual={(s, sub) => openDocumentFlow(s, sub)}
                      onEntryChange={(id, updated) => setEntries((prev) => prev.map((e) => e.id === id ? updated : e))}
                      onEntryDelete={(id) => {
                        setEntries((prev) => {
                          const next = prev.filter((e) => e.id !== id);
                          if (sec === "Tank" && !next.some((e) => e.sectionLocation === "Tank") && baseStatus === "damaged") setBaseStatus("pending");
                          return next;
                        });
                      }}
                      onPendingChange={setCurrentEntry}
                      onLightbox={setLightboxUrl}
                    />
                  ) : (
                    <ReadOnlySectionCard
                      key={sec}
                      section={sec}
                      entries={entries.filter((e) => e.sectionLocation === sec)}
                      pendingEntry={currentEntry}
                      baseStatus={sec === "Tank" ? baseStatus : undefined}
                      onLightbox={setLightboxUrl}
                    />
                  )
                )}

                {/* Floating sticky navigation */}
                <div className="sticky bottom-6 z-40 mt-8 flex items-center justify-between">
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage("nameplate")}
                    className="gap-1.5 font-medium shadow-md bg-zinc-600 hover:bg-zinc-700 text-white border-zinc-600 hover:border-zinc-700"
                  >
                    <ChevronLeft size={14} />
                    Back to Nameplate
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleNext}
                    disabled={nextDisabled}
                    title={nextDisabled ? "Confirm all assessments before proceeding" : undefined}
                    className="gap-1.5 font-medium shadow-md text-white"
                    style={nextDisabled ? {} : { background: "#0047bb", boxShadow: "0 4px 14px rgba(0,71,187,0.28)" }}
                  >
                    Next: Electrical
                    <ChevronRight size={14} />
                  </Button>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelected} />

      {modalStep === "location"      && <LocationSelectorModal onSelect={(sec) => { setFlowSection(sec); setModalStep("sublocation"); }} onCancel={() => setModalStep(null)} />}
      {modalStep === "sublocation"   && flowSection && <SublocationSelectorModal section={flowSection} onSelect={(sub) => { setFlowSublocation(sub); setModalStep("photoSource"); }} onBack={() => setModalStep("location")} onCancel={() => setModalStep(null)} />}
      {modalStep === "photoSource"   && <PhotoSourceModal onTakePhoto={simulateTakePhoto} onUpload={handleUploadPhoto} onWithoutPhoto={handleWithoutPhoto} onCancel={() => setModalStep(null)} />}
      {modalStep === "aiAnalyzing"   && <AIAnalyzingOverlay onCancel={() => setModalStep(null)} />}
      {modalStep === "baseDamageAlert" && <BaseDamageAlert onProceed={() => { setModalStep(null); setCurrentPage("electrical"); }} onGoBack={() => setModalStep(null)} />}
      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  );
}
