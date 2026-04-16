import { useState, useRef, useCallback } from "react";
import { PortalHeader } from "@/components/PortalHeader";
import { Sidebar } from "@/components/Sidebar";
import { useDemoContext } from "@/context/DemoContext";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, Flag, Camera, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Settings2, Trash2, RotateCcw, MapPin, AlertCircle, Save, Loader2, CheckCircle2,
  Upload, EyeOff, X, Maximize2, Plus, Package2, Box, Layers, Database, ArrowUp, ArrowDown,
  ChevronsUp, ChevronsDown, Minus, DoorOpen, HelpCircle,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type SectionId = "Tank" | "Cabinet" | "Radiator";
type DamageType = "Rust" | "Dent" | "Leak" | "Arc Damage" | "Holes" | "Tears" | "None" | "";
type Assessment = "Repairable" | "Non-Repairable" | "";
type DamageAssessment = "Surface" | "Structural" | "";
type BaseStatus = "pending" | "damaged" | "clean" | "dismissed";
type SaveDraftState = "idle" | "saving" | "saved" | "savedAgo";
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
  // Tank / Base — AI detected Rust, Repairable, Surface @ 87% (confirmed)
  makeSeedEntry("dmg-seed-1", "Tank", "Base", "/nameplate.png", true, "Rust", "Repairable", "Surface", 87, "Surface corrosion detected near base weld line. Appears containable — recommend grinding and repainting.", AI_ORIG_TANK),
  // Cabinet / Left Door — manual Dent, Non-Repairable, Structural (no photo, no AI)
  makeSeedEntry("dmg-seed-2", "Cabinet", "Left Door", "", false, "Dent", "Non-Repairable", "Structural", undefined, "Large dent on left door panel — hinge is misaligned and door no longer closes flush. Structural concern.", undefined),
];

// Radiator / Left Side — fully blank (triggers Next: disabled)
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
              style={{
                flex: 1, borderRadius: 100, fontSize: fs, cursor: "pointer", border: "none",
                transition: "all 0.15s",
                background: isSelected ? (activeColors[opt] ?? "#0047bb") : "transparent",
                color: isSelected ? "white" : "hsl(var(--muted-foreground))",
                fontWeight: isSelected ? 600 : 500,
                boxShadow: isSelected ? "0 1px 4px rgba(0,0,0,0.18)" : "none",
                outline: isAiSuggested ? "1px solid rgba(124,58,237,0.35)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}
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
      <button onClick={() => setOpen((v) => !v)} style={{ width: 20, height: 20, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
        <HelpCircle size={14} className="text-muted-foreground/50" />
      </button>
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

/* ─── Confidence Badge ───────────────────────────────────────────────────────── */
function ConfBadge({ score }: { score: number }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 30, padding: "0 14px", borderRadius: 9999, background: "rgba(107,33,168,0.07)", border: "1px solid rgba(139,92,246,0.30)" }}>
      <Sparkles size={14} color="#6b21a8" />
      <span style={{ fontSize: 14, color: "#6b21a8", fontWeight: 600 }}>{score}% Confidence</span>
    </div>
  );
}

/* ─── AI Restore Chip ────────────────────────────────────────────────────────── */
function AiRestoreChip({ aiValue, onRestore }: { aiValue: string; onRestore: () => void }) {
  return (
    <button onClick={onRestore} style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 22, padding: "0 10px", borderRadius: 9999, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.22)", cursor: "pointer" }}>
      <Sparkles size={10} color="#7c3aed" />
      <span style={{ fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>AI: {aiValue}</span>
    </button>
  );
}

/* ─── DamageCard ─────────────────────────────────────────────────────────────── */
interface DamageCardProps {
  entry: DamageEntry;
  index: number;
  isPending?: boolean;
  onChange: (updated: DamageEntry) => void;
  onDelete: () => void;
  onLightbox: (url: string) => void;
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
    if (dt === "None") {
      update({ damageType: dt, assessment: "", damageAssessment: "" });
    } else {
      update({ damageType: dt });
    }
  }

  function confirmLocationPicker() {
    update({ sectionLocation: lpSection, subLocation: lpSub, location: deriveLocation(lpSection, lpSub) });
    setShowLocationPicker(false);
  }

  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: isPending ? "#86efac" : "hsl(var(--border))", borderWidth: isPending ? 1.5 : 1, background: "hsl(var(--card))" }}>
      {/* AI Detection Banner */}
      {isPending && (
        <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", background: entry.aiDetected ? "#dcfce7" : "#f0f9ff", borderBottom: entry.aiDetected ? "1px solid #86efac" : "1px solid #7dd3fc" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {entry.aiDetected ? <Check size={16} color="#16a34a" /> : <Camera size={16} color="#0369a1" />}
            <span style={{ fontSize: 13, color: entry.aiDetected ? "#14532d" : "#0c4a6e", fontWeight: 500 }}>
              {entry.aiDetected
                ? `AI detected ${entry.damageType || "potential"} damage — review details below.`
                : "Photo captured — AI could not detect damage type. Fill in details manually."}
            </span>
          </div>
          {entry.aiDetected && entry.confidence != null && <ConfBadge score={entry.confidence} />}
        </div>
      )}

      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: collapsed ? "10px 12px" : "16px 20px", borderBottom: collapsed ? "none" : "1px solid hsl(var(--border))" }}>
        {collapsed && entry.imageUrl && (
          <img src={entry.imageUrl} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: "1px solid hsl(var(--border))", flexShrink: 0 }} />
        )}
        <span className="text-foreground" style={{ fontSize: 16, fontWeight: 600, flex: 1 }} onClick={() => setCollapsed((c) => !c)}>
          {smartTitle}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {!isPending && entry.aiDetected && entry.confidence != null && !collapsed && <ConfBadge score={entry.confidence} />}
          {!isPending && !entry.aiDetected && !collapsed && (
            <div className="text-muted-foreground" style={{ display: "inline-flex", alignItems: "center", height: 26, padding: "0 10px", borderRadius: 9999, background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", fontSize: 12, fontWeight: 500 }}>Manual Entry</div>
          )}
          {isPending && (
            <button className="text-muted-foreground" onClick={() => {}} style={{ display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 12px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
              {entry.imageUrl ? <RotateCcw size={13} /> : <Camera size={13} />}
              {entry.imageUrl ? "Retake" : "Add Photo"}
            </button>
          )}
          {!isPending && (
            <div style={{ position: "relative" }}>
              <button
                className="text-muted-foreground"
                onClick={() => setShowActionsMenu((v) => !v)}
                style={{ display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 12px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", cursor: "pointer", fontSize: 13, fontWeight: 500 }}
              >
                <Settings2 size={13} /> Actions <ChevronDown size={13} />
              </button>
              {showActionsMenu && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setShowActionsMenu(false)} />
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50, background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", minWidth: 176, overflow: "hidden" }}>
                    <button
                      onClick={() => { setShowLocationPicker(true); setShowActionsMenu(false); if (collapsed) setCollapsed(false); }}
                      className="text-foreground hover:bg-accent w-full flex items-center gap-2 h-11 px-4 text-sm border-none cursor-pointer bg-transparent"
                    >
                      <MapPin size={14} /> Change Location
                    </button>
                    <div style={{ height: 1, background: "hsl(var(--border))" }} />
                    <button
                      onClick={() => { onDelete(); setShowActionsMenu(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 16px", border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: "#ef4444" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <button
            className="text-muted-foreground"
            onClick={() => setCollapsed((c) => !c)}
            style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Collapsed summary chips */}
      {collapsed && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "10px 20px 14px" }}>
          {[entry.damageType, entry.location, entry.assessment, entry.damageAssessment].filter(Boolean).map((chip, i) => (
            <span key={i} className="text-muted-foreground" style={{ fontSize: 13, height: 26, padding: "0 12px", borderRadius: 9999, background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", display: "inline-flex", alignItems: "center" }}>{chip}</span>
          ))}
          {entry.additionalPhotos.length > 0 && (
            <span className="text-muted-foreground" style={{ fontSize: 13, height: 26, padding: "0 12px", borderRadius: 9999, background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Plus size={11} /> +{entry.additionalPhotos.length} more photo(s)
            </span>
          )}
          {isMissingMandatory && (
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#ef4444", flexShrink: 0 }}>
              <AlertCircle size={11} /> Details pending
            </span>
          )}
        </div>
      )}

      {/* Expanded body */}
      {!collapsed && (
        <>
          {/* Inline location picker */}
          {showLocationPicker && (
            <div style={{ padding: "16px 20px", background: "hsl(var(--muted))", borderBottom: "1px solid hsl(var(--border))", display: "flex", alignItems: "flex-end", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="text-muted-foreground" style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Location *</label>
                <Select value={lpSection} onValueChange={(v) => { setLpSection(v as SectionId); setLpSub(""); }}>
                  <SelectTrigger className="h-9 bg-background text-sm shadow-none"><SelectValue /></SelectTrigger>
                  <SelectContent>{(["Tank", "Cabinet", "Radiator"] as SectionId[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="text-muted-foreground" style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Sublocation *</label>
                <Select value={lpSub} onValueChange={setLpSub}>
                  <SelectTrigger className="h-9 bg-background text-sm shadow-none"><SelectValue placeholder={lpSection ? "Select sublocation" : "Select a location first"} /></SelectTrigger>
                  <SelectContent>{(SUB_LOCATIONS[lpSection] || []).map((s) => <SelectItem key={s.label} value={s.label}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <button onClick={confirmLocationPicker} style={{ width: 38, height: 42, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={16} color="#16a34a" />
              </button>
            </div>
          )}

          {/* Three-column fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, padding: "20px 20px 0" }}>
            {/* Damage Type */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Damage Type *</label>
                <FieldTooltip label="Damage Types" items={DAMAGE_TYPE_DESCS} />
              </div>
              <Select value={entry.damageType || ""} onValueChange={(v) => handleDamageTypeChange(v as DamageType)}>
                <SelectTrigger className="h-[52px] rounded-xl bg-muted text-foreground text-base shadow-none border-border">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>{DAMAGE_TYPES.map((dt) => <SelectItem key={dt} value={dt}>{dt}</SelectItem>)}</SelectContent>
              </Select>
              {entry.damageType && entry.aiOriginal?.damageType && entry.damageType !== entry.aiOriginal.damageType && (
                <div className="mt-1"><AiRestoreChip aiValue={entry.aiOriginal.damageType} onRestore={() => update({ damageType: entry.aiOriginal!.damageType })} /></div>
              )}
            </div>

            {/* Repairability */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Repairability{entry.damageType !== "None" ? " *" : ""}
                </label>
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

            {/* Damage Assessment */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Damage Assessment{entry.damageType !== "None" ? " *" : ""}
                </label>
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

          {/* Photo + Comments */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: 20 }}>
            <div style={{ width: 176, flexShrink: 0 }}>
              <label className="text-muted-foreground" style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Photo</label>
              {entry.imageUrl ? (
                <div style={{ width: 176, height: 132, borderRadius: 12, border: "1px solid hsl(var(--border))", cursor: "zoom-in", position: "relative", overflow: "hidden" }} onClick={() => onLightbox(entry.imageUrl)}>
                  <img src={entry.imageUrl} alt="damage" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 6, background: "rgba(0,0,0,0.42)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Maximize2 size={13} color="white" />
                  </div>
                </div>
              ) : (
                <div style={{ width: 176, height: 132, borderRadius: 12, border: "1.5px dashed hsl(var(--border))", background: "hsl(var(--muted)/0.4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Camera size={24} className="text-muted-foreground/40" />
                  <span className="text-muted-foreground/50" style={{ fontSize: 12 }}>No Photo</span>
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <label className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Comments</label>
                {entry.aiOriginal?.comments && <Sparkles size={12} color="#7c3aed" />}
              </div>
              <Textarea
                value={entry.comments}
                onChange={(e) => update({ comments: e.target.value })}
                placeholder="Add observation notes…"
                rows={4}
                className="rounded-xl shadow-none bg-muted text-foreground border-border resize-none"
                style={{ fontSize: 15, minHeight: 132, padding: "12px 16px" }}
              />
              {entry.comments !== entry.aiOriginal?.comments && entry.aiOriginal?.comments && (
                <div className="mt-1"><AiRestoreChip aiValue="original comment" onRestore={() => update({ comments: entry.aiOriginal!.comments })} /></div>
              )}
            </div>
          </div>

          {/* Photo quality advisory */}
          {entry.imageUrl && (
            <div style={{ margin: "0 20px 12px", padding: "8px 12px", borderRadius: 8, background: "rgba(254,243,199,0.65)", border: "1px solid rgba(251,191,36,0.25)", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={14} color="#b45309" />
              <span style={{ fontSize: 13, color: "#92400e", fontWeight: 500 }}>Image issues detected:</span>
              {["Blurry", "Low light", "Off-angle"].map((issue) => (
                <span key={issue} style={{ height: 18, padding: "0 8px", borderRadius: 9999, background: "rgba(180,83,9,0.10)", color: "#92400e", border: "1px solid rgba(180,83,9,0.18)", fontSize: 11, display: "inline-flex", alignItems: "center" }}>{issue}</span>
              ))}
              <span style={{ fontSize: 13, color: "#92400e" }}>— may reduce AI accuracy</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── BaseInspectionCard ─────────────────────────────────────────────────────── */
function BaseInspectionCard({ status, onClean, onDocumentDamage, onDismiss }: {
  status: BaseStatus;
  onClean: () => void;
  onDocumentDamage: () => void;
  onDismiss: () => void;
}) {
  const cfg = {
    pending:  { border: "#fde047", iconBg: "rgba(254,249,195,0.70)", iconColor: "#ca8a04", title: "Tank Inspection (Required)", titleCls: "text-foreground", subtitle: "If you have access to the tank during transportation, take a photo, or upload a photo taken during available access." },
    damaged:  { border: "#3b82f6", iconBg: "rgba(59,130,246,0.12)", iconColor: "#3b82f6", title: "Tank Inspection — Damage Documented", titleCls: "text-blue-600 dark:text-blue-400", subtitle: "Tank damage has been documented below." },
    clean:    { border: "#16a34a", iconBg: "rgba(22,163,74,0.12)", iconColor: "#16a34a", title: "Tank Inspection — No Damage", titleCls: "text-green-700 dark:text-green-400", subtitle: "Tank confirmed clean. No corrosion or damage found." },
    dismissed:{ border: "hsl(var(--border))", iconBg: "hsl(var(--muted))", iconColor: "hsl(var(--muted-foreground))", title: "Tank Inspection — Dismissed", titleCls: "text-muted-foreground", subtitle: "" },
  }[status];

  return (
    <div
      className="rounded-2xl"
      style={{ display: "flex", gap: 24, padding: 24, background: "hsl(var(--card))", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: `2.5px solid ${cfg.border}`, cursor: status === "damaged" ? "pointer" : "default" }}
      onClick={status === "damaged" ? onDismiss : undefined}
      title={status === "damaged" ? "Tap to dismiss" : undefined}
    >
      <div style={{ width: 88, height: 88, borderRadius: 14, background: cfg.iconBg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.iconColor }}>
        {status === "clean"   && <Check size={36} />}
        {status === "damaged" && <Camera size={36} />}
        {(status === "pending" || status === "dismissed") && <Package2 size={36} />}
      </div>
      <div style={{ flex: 1 }}>
        <div className={`text-lg font-semibold mb-1.5 ${cfg.titleCls}`}>{cfg.title}</div>
        {cfg.subtitle && <div className="text-sm text-muted-foreground" style={{ marginBottom: status === "pending" ? 16 : 0 }}>{cfg.subtitle}</div>}
        {status === "pending" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 248 }}>
            <button onClick={onClean} style={{ height: 52, borderRadius: 9999, background: "#16a34a", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 600, boxShadow: "0 4px 16px rgba(22,163,74,0.28)" }}>
              <Check size={18} /> No Damage Found
            </button>
            <button onClick={onDocumentDamage} style={{ height: 52, borderRadius: 9999, background: "#0047bb", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,71,187,0.28)" }}>
              <Camera size={18} /> Document Tank Damage
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SectionCard ────────────────────────────────────────────────────────────── */
interface SectionCardProps {
  section: SectionId;
  entries: DamageEntry[];
  pendingEntry: DamageEntry | null;
  baseStatus?: BaseStatus;
  onBaseClean?: () => void;
  onBaseDocument?: () => void;
  onBaseDismiss?: () => void;
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
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "hsl(var(--card))", border: si.cardBorder, boxShadow: `0 2px 16px ${si.shadowColor}, 0 1px 3px rgba(0,0,0,0.05)` }}>
      {/* Header */}
      <div onClick={() => setExpanded((e) => !e)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: si.headerGradient, cursor: "pointer" }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: si.iconBg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: si.iconColor }}>{si.icon}</div>
        <span className="text-foreground" style={{ fontSize: 18, fontWeight: 600 }}>{section}</span>
        <span className="text-muted-foreground" style={{ fontSize: 13 }}>
          {entries.length === 0 && !isPendingHere ? "no findings" : `${entries.length + (isPendingHere ? 1 : 0)} finding${entries.length + (isPendingHere ? 1 : 0) !== 1 ? "s" : ""}`}
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${si.iconColor}`, display: "flex", alignItems: "center", justifyContent: "center", color: si.iconColor }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ borderTop: si.bodyDivider, padding: "14px 14px 16px", background: si.bodyBg }}>
          {showBaseCard && (
            <div style={{ marginBottom: 16 }}>
              <BaseInspectionCard status={baseStatus!} onClean={onBaseClean!} onDocumentDamage={onBaseDocument!} onDismiss={onBaseDismiss!} />
            </div>
          )}

          {/* Tabs + contextual document button */}
          {tabs.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {tabs.map((tab) => {
                  const isActive = activeTab === tab;
                  const count = tab === "All" ? null : entries.filter((e) => e.subLocation === tab).length;
                  return (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "6px 14px", borderRadius: 100, fontSize: 13, cursor: "pointer", background: isActive ? si.iconColor : "hsl(var(--background))", color: isActive ? "white" : "hsl(var(--muted-foreground))", fontWeight: isActive ? 600 : 500, border: isActive ? "none" : "1px solid hsl(var(--border))", boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.15)" : "none" }}>
                      {tab}{count != null && <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 12 }}>{count}</span>}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => onDocumentContextual(section, activeTab !== "All" ? activeTab : undefined)}
                style={{ display: "flex", alignItems: "center", gap: 6, height: 44, padding: "0 16px", borderRadius: 100, background: "transparent", border: `1.5px solid ${si.iconColor}`, color: si.iconColor, fontSize: 15, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                <Camera size={16} /> Document {activeTab !== "All" ? `${section} ${activeTab}` : section} Damage
              </button>
            </div>
          )}

          {/* Entries */}
          {filteredEntries.length === 0 && !isPendingHere ? (
            <div className="text-muted-foreground rounded-xl" style={{ padding: "12px 16px", background: "rgba(255,255,255,0.10)", border: "1.5px dashed hsl(var(--border))", fontSize: 15 }}>
              {activeTab !== "All" ? "No findings for this sublocation" : "No findings yet for this section"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

          {/* Contextual button when no tabs */}
          {tabs.length === 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: (filteredEntries.length > 0 || isPendingHere) ? 12 : 0 }}>
              <button
                onClick={() => onDocumentContextual(section)}
                style={{ display: "flex", alignItems: "center", gap: 6, height: 44, padding: "0 16px", borderRadius: 100, background: "transparent", border: `1.5px solid ${si.iconColor}`, color: si.iconColor, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
              >
                <Camera size={16} /> Document {section} Damage
              </button>
            </div>
          )}
        </div>
      )}
    </div>
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
          <div className="text-foreground" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 4 }}>Where is the damage?</div>
          <div className="text-muted-foreground" style={{ fontSize: 16 }}>Select the section of the transformer</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, padding: "0 20px 18px" }}>
          {(["Tank", "Cabinet", "Radiator"] as SectionId[]).map((sec) => {
            const si = SECTION_INFO[sec];
            return (
              <button key={sec} onClick={() => onSelect(sec)} className="rounded-2xl" style={{ padding: "28px 16px", background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, transition: "transform 0.12s" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}>
                <div style={{ width: 84, height: 84, borderRadius: 16, background: si.iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: si.iconColor }}>{SECTION_ICON_LG[sec]}</div>
                <span className="text-foreground" style={{ fontSize: 18, fontWeight: 600 }}>{sec}</span>
              </button>
            );
          })}
        </div>
        <div style={{ padding: "0 20px 24px" }}>
          <button onClick={onCancel} className="text-muted-foreground" style={{ width: "100%", height: 56, borderRadius: 16, background: "hsl(var(--muted))", border: "none", fontSize: 17, cursor: "pointer" }}>Cancel</button>
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
          <div className="text-foreground" style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Select Sub-location</div>
          <div className="text-muted-foreground" style={{ fontSize: 16 }}>Where exactly is the damage located?</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12, padding: "0 20px 18px" }}>
          {subLocs.map((sub) => (
            <button key={sub.label} onClick={() => onSelect(sub.label)} className="rounded-2xl" style={{ padding: "20px 8px", background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "transform 0.12s" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: si.iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: si.iconColor, transform: sub.flip ? "scaleX(-1)" : undefined }}>{sub.icon}</div>
              <span className="text-foreground" style={{ fontSize: 14, fontWeight: 600, textAlign: "center", lineHeight: 1.35 }}>{sub.label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, padding: "0 20px 24px" }}>
          <button onClick={onBack} className="text-muted-foreground" style={{ flex: 1, height: 56, borderRadius: 16, background: "hsl(var(--muted))", border: "none", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><ChevronLeft size={18} /> Back</button>
          <button onClick={onCancel} className="text-muted-foreground" style={{ flex: 1, height: 56, borderRadius: 16, background: "hsl(var(--muted))", border: "none", fontSize: 16, cursor: "pointer" }}>Cancel</button>
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
          <div className="text-foreground" style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.43px", marginBottom: 4 }}>Add a Photo</div>
          <div className="text-muted-foreground" style={{ fontSize: 13 }}>How would you like to document this damage?</div>
        </div>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Take Photo", icon: <Camera size={20} color="#0047bb" />, action: onTakePhoto },
            { label: "Upload Photo", icon: <Upload size={20} color="#0047bb" />, action: onUpload },
            { label: "Enter Without Photo", icon: <EyeOff size={20} color="#0047bb" />, action: onWithoutPhoto },
          ].map(({ label, icon, action }) => (
            <button key={label} onClick={action} className="text-foreground" style={{ height: 56, borderRadius: 14, border: "none", background: "hsl(var(--card))", fontSize: 17, letterSpacing: "-0.43px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "0 20px" }}>
              {icon} {label}
            </button>
          ))}
          <div style={{ height: 1, background: "hsl(var(--border))", margin: "2px 0" }} />
          <button onClick={onCancel} className="text-muted-foreground" style={{ height: 56, borderRadius: 14, border: "none", background: "hsl(var(--card))", fontSize: 17, letterSpacing: "-0.43px", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function AIAnalyzingOverlay({ onCancel }: { onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.50)" }}>
      <div className="rounded-3xl" style={{ position: "relative", background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", boxShadow: "0 24px 80px rgba(0,0,0,0.28)", padding: "52px 64px 44px", minWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <button onClick={onCancel} style={{ position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: "50%", background: "hsl(var(--muted))", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} className="text-muted-foreground" /></button>
        <Loader2 size={36} color="#0047BB" style={{ animation: "spin 0.8s linear infinite" }} />
        <div style={{ textAlign: "center" }}>
          <div className="text-foreground" style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>AI is analysing the image.</div>
          <div className="text-muted-foreground" style={{ fontSize: 15 }}>Please hold on.</div>
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
        <div style={{ textAlign: "center" }}>
          <div className="text-foreground" style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.43px", marginBottom: 8 }}>Base Damage Not Documented</div>
          <div className="text-muted-foreground" style={{ fontSize: 15, letterSpacing: "-0.24px" }}>
            We noticed this transformer is flagged with Base Damage, and no Tank damage has been documented. Would you still like to proceed?
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          <button onClick={onProceed} style={{ height: 52, borderRadius: 9999, background: "#d97706", color: "white", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600 }}>Proceed Anyway</button>
          <button onClick={onGoBack} className="text-foreground" style={{ height: 50, borderRadius: 9999, background: "hsl(var(--muted))", border: "none", cursor: "pointer", fontSize: 16 }}>Go Back &amp; Document</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10002, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)", cursor: "zoom-out" }} onClick={onClose}>
      <button onClick={onClose} style={{ position: "absolute", top: 48, right: 48, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18 }}>✕</button>
      <img src={url} alt="damage" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1100, maxHeight: 820, objectFit: "contain", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.50)", cursor: "default" }} />
    </div>
  );
}

/* ─── ConditionPage ──────────────────────────────────────────────────────────── */
export default function ConditionPage() {
  const { selectedUnit, setCurrentPage } = useDemoContext();

  const unit = selectedUnit ?? {
    manufacturer: "Siemens", icNumber: "185840632", mfgSerial: "TF-7662-N", kva: 1750,
    site: "KSSO", loadNumber: "LN-4821", transformerType: "Three-Phase Pad",
    hasBaseDamage: true, intakeTags: ["NPX: Rewind"],
  };

  const [entries, setEntries] = useState<DamageEntry[]>(SEED_ENTRIES);
  const [currentEntry, setCurrentEntry] = useState<DamageEntry | null>(SEED_PENDING);
  const [baseStatus, setBaseStatus] = useState<BaseStatus>("damaged");
  const [saveDraftState, setSaveDraftState] = useState<SaveDraftState>("idle");
  const [savedTimestamp, setSavedTimestamp] = useState<number | null>(null);
  const [modalStep, setModalStep] = useState<ModalStep>(null);
  const [flowSection, setFlowSection] = useState<SectionId | null>(null);
  const [flowSublocation, setFlowSublocation] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── Document flow ──────────────────────────────────────────────────────── */
  function openDocumentFlow(preSection?: SectionId, preSub?: string) {
    if (preSection && preSub) {
      setFlowSection(preSection); setFlowSublocation(preSub); setModalStep("photoSource");
    } else if (preSection) {
      setFlowSection(preSection); setFlowSublocation(null); setModalStep("sublocation");
    } else {
      setFlowSection(null); setFlowSublocation(null); setModalStep("location");
    }
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

  function handleSaveDraft() {
    if (saveDraftState === "saving") return;
    setSaveDraftState("saving");
    setTimeout(() => {
      setSaveDraftState("saved"); setSavedTimestamp(Date.now());
      setTimeout(() => setSaveDraftState("savedAgo"), 2500);
    }, 1500);
  }

  /* ─── Validation ─────────────────────────────────────────────────────────── */
  const allEntries = [...entries, ...(currentEntry ? [currentEntry] : [])];
  // Disabled when any entry has blank damageType OR when damageType is set (non-None) but assessment fields missing
  const hasUnconfirmedAssessments = allEntries.some(
    (e) => e.damageType === "" || (e.damageType !== "None" && (e.assessment === "" || e.damageAssessment === ""))
  );
  const hasTankFindings = allEntries.some((e) => e.sectionLocation === "Tank");

  function handleNext() {
    if (hasUnconfirmedAssessments) return;
    if (unit.hasBaseDamage && !hasTankFindings) { setModalStep("baseDamageAlert"); return; }
    setCurrentPage("evaluations-history");
  }

  const TRANSFORMER_TYPE_ABBR: Record<string, string> = {
    "Three-Phase Pad": "3Ø Pad", "Single-Phase Pad": "1Ø Pad", "Pole Mount": "Pole",
  };
  const npxTags = unit.intakeTags.filter((t) => t.startsWith("NPX: "));

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <PortalHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* ── Dark sub-header (matches Nameplate pattern) ── */}
          <div className="flex items-center gap-3 px-6 flex-shrink-0 flex-wrap min-h-12"
            style={{ background: "#0d1629", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Back arrow */}
            <button
              onClick={() => setCurrentPage("nameplate")}
              className="flex items-center gap-1.5 text-white/80 hover:text-white border border-white/22 rounded-md px-3 py-1 text-sm font-medium flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.07)", cursor: "pointer" }}
            >
              <ChevronLeft size={13} /> Back to Nameplate
            </button>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)" }} />
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
              {npxTags.map((tag) => {
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
          </div>

          {/* ── Gradient content area ── */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "24px 24px 0", background: "linear-gradient(150deg, #e4ecf7 0%, #eef1f8 50%, #f3f5fa 100%)" }}>

            {/* Page heading */}
            <div style={{ marginBottom: 20, flexShrink: 0 }}>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1B2038", marginBottom: 4 }}>Condition</h1>
              <p style={{ fontSize: 16, color: "rgba(27,32,56,0.44)" }}>Document and photograph any physical damage found on this unit</p>
            </div>

            {/* Glass form card */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "hsl(var(--background)/0.88)", backdropFilter: "blur(20px)", borderRadius: "20px 20px 0 0", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 32px rgba(27,32,56,0.08)" }}>

              <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 8px" }}>

                {/* Document Damage CTA */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: 24, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 20, boxShadow: "0 8px 32px rgba(0,71,187,0.08)", padding: "20px 24px", cursor: "pointer", marginBottom: 28 }}
                  onClick={() => openDocumentFlow()}
                >
                  <div style={{ width: 80, height: 80, borderRadius: 18, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(147,197,253,0.40)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Camera size={34} color="#2563eb" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="text-foreground" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Document Damage</div>
                    <div className="text-muted-foreground" style={{ fontSize: 15 }}>Take a clear photo of the damage. AI will automatically detect the damage type and severity.</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); openDocumentFlow(); }}
                    style={{ height: 48, padding: "0 20px", borderRadius: 100, background: "linear-gradient(135deg, #0047bb 0%, #0065ff 100%)", boxShadow: "0 4px 20px rgba(0,71,187,0.38)", border: "none", color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0 }}
                  >
                    <Camera size={17} /> Document Damage
                  </button>
                </div>

                {/* Section cards */}
                {(["Tank", "Cabinet", "Radiator"] as SectionId[]).map((sec) => (
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
                ))}
                <div style={{ height: 20 }} />
              </div>

              {/* Bottom action bar */}
              <div style={{ padding: "16px 28px", borderTop: "1px solid hsl(var(--border))", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => setCurrentPage("nameplate")} className="text-foreground" style={{ height: 52, padding: "0 20px", borderRadius: 9999, background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <ChevronLeft size={18} /> Back
                  </button>
                  <button onClick={handleSaveDraft} disabled={saveDraftState === "saving"} style={{ height: 52, padding: "0 24px", borderRadius: 9999, background: "#1B2038", color: "white", border: "none", fontSize: 16, fontWeight: 600, cursor: saveDraftState === "saving" ? "default" : "pointer", boxShadow: "0 2px 10px rgba(27,32,56,0.22)", display: "flex", alignItems: "center", gap: 8 }}>
                    {saveDraftState === "saving" ? <Loader2 size={17} style={{ animation: "spin 0.8s linear infinite" }} /> : <Save size={17} />}
                    {saveDraftState === "saving" ? "Saving…" : "Save Draft"}
                  </button>
                  {saveDraftState === "saved" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#16a34a" }}>
                      <CheckCircle2 size={16} /> Draft saved
                    </div>
                  )}
                  {saveDraftState === "savedAgo" && (
                    <div className="text-muted-foreground" style={{ fontSize: 13 }}>
                      Last saved {savedTimestamp ? `${Math.round((Date.now() - savedTimestamp) / 1000)}s` : "5s"} ago
                    </div>
                  )}
                </div>
                <button
                  onClick={handleNext}
                  disabled={hasUnconfirmedAssessments}
                  title={hasUnconfirmedAssessments ? "Confirm all assessments before proceeding" : undefined}
                  style={{ height: 52, padding: "0 28px", borderRadius: 9999, fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, border: "none", cursor: hasUnconfirmedAssessments ? "not-allowed" : "pointer", background: hasUnconfirmedAssessments ? "hsl(var(--muted-foreground)/0.4)" : "#0047bb", boxShadow: hasUnconfirmedAssessments ? "none" : "0 4px 16px rgba(0,71,187,0.28)", color: "white", opacity: hasUnconfirmedAssessments ? 0.65 : 1, transition: "all 0.15s" }}
                >
                  Next: Electrical <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelected} />

      {modalStep === "location" && <LocationSelectorModal onSelect={(sec) => { setFlowSection(sec); setModalStep("sublocation"); }} onCancel={() => setModalStep(null)} />}
      {modalStep === "sublocation" && flowSection && <SublocationSelectorModal section={flowSection} onSelect={(sub) => { setFlowSublocation(sub); setModalStep("photoSource"); }} onBack={() => setModalStep("location")} onCancel={() => setModalStep(null)} />}
      {modalStep === "photoSource" && <PhotoSourceModal onTakePhoto={simulateTakePhoto} onUpload={handleUploadPhoto} onWithoutPhoto={handleWithoutPhoto} onCancel={() => setModalStep(null)} />}
      {modalStep === "aiAnalyzing" && <AIAnalyzingOverlay onCancel={() => setModalStep(null)} />}
      {modalStep === "baseDamageAlert" && <BaseDamageAlert onProceed={() => { setModalStep(null); setCurrentPage("evaluations-history"); }} onGoBack={() => setModalStep(null)} />}
      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  );
}
