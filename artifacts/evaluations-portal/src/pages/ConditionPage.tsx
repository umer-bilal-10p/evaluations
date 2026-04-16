import { useState, useRef, useCallback } from "react";
import { PortalHeader } from "@/components/PortalHeader";
import { Sidebar } from "@/components/Sidebar";
import { useDemoContext } from "@/context/DemoContext";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Sparkle, Flag, Camera, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Settings2, Trash2, RotateCcw, MapPin, AlertCircle, Save, Loader2, CheckCircle2, Upload,
  EyeOff, X, Maximize2, Plus, Package2, Box, Layers, Database, ArrowUp, ArrowDown,
  ChevronsUp, ChevronsDown, Minus, DoorOpen, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type SectionId = "Tank" | "Cabinet" | "Radiator";
type DamageType = "Rust" | "Dent" | "Leak" | "Arc Damage" | "Holes" | "Tears" | "None" | "";
type Assessment = "Repairable" | "Non-Repairable" | "";
type DamageAssessment = "Surface" | "Structural" | "";
type BaseStatus = "pending" | "clean" | "dismissed";
type SaveDraftState = "idle" | "saving" | "saved" | "savedAgo";
type ModalStep = "location" | "sublocation" | "photoSource" | "aiAnalyzing" | "baseDamageAlert" | "lightbox" | null;

interface AIOriginal {
  damageType: DamageType;
  assessment: Assessment;
  damageAssessment: DamageAssessment;
  comments: string;
}

interface AdditionalPhoto {
  id: string;
  imageUrl: string;
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
  additionalPhotos: AdditionalPhoto[];
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
  "Non-Repairable": "Damage is too severe; the affected component or unit must be scrapped or replaced.",
};

const DAMAGE_ASSESSMENT_DESCS: Record<string, string> = {
  Surface: "Damage is cosmetic — affects appearance but not structural integrity or performance.",
  Structural: "Damage compromises the physical structure, safety, or core function of the unit.",
};

type SectionInfo = {
  id: SectionId;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  cardBorder: string;
  headerGradient: string;
  bodyDivider: string;
  bodyBg: string;
  shadowColor: string;
};

const SECTION_INFO: Record<SectionId, SectionInfo> = {
  Tank: {
    id: "Tank", iconBg: "#fef9c3", iconColor: "#b45309",
    cardBorder: "1.5px solid rgba(180,83,9,0.22)",
    headerGradient: "linear-gradient(105deg, rgba(254,249,195,0.85) 0%, rgba(255,255,255,0.70) 100%)",
    bodyDivider: "1px solid rgba(180,83,9,0.15)", bodyBg: "rgba(254,249,195,0.18)",
    shadowColor: "rgba(180,83,9,0.08)",
    icon: <Package2 size={18} />,
  },
  Cabinet: {
    id: "Cabinet", iconBg: "#f3e8ff", iconColor: "#7c3aed",
    cardBorder: "1.5px solid rgba(124,58,237,0.24)",
    headerGradient: "linear-gradient(105deg, rgba(243,232,255,0.85) 0%, rgba(255,255,255,0.70) 100%)",
    bodyDivider: "1px solid rgba(124,58,237,0.15)", bodyBg: "rgba(243,232,255,0.18)",
    shadowColor: "rgba(124,58,237,0.08)",
    icon: <Box size={18} />,
  },
  Radiator: {
    id: "Radiator", iconBg: "#dbeafe", iconColor: "#1d4ed8",
    cardBorder: "1.5px solid rgba(59,130,246,0.24)",
    headerGradient: "linear-gradient(105deg, rgba(219,234,254,0.85) 0%, rgba(255,255,255,0.70) 100%)",
    bodyDivider: "1px solid rgba(59,130,246,0.15)", bodyBg: "rgba(219,234,254,0.18)",
    shadowColor: "rgba(59,130,246,0.08)",
    icon: <Layers size={18} />,
  },
};

const SECTION_ICON_LARGE: Record<SectionId, React.ReactNode> = {
  Tank: <Package2 size={38} />,
  Cabinet: <Box size={38} />,
  Radiator: <Layers size={38} />,
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
  Tank: { damageType: "Dent", assessment: "Repairable", damageAssessment: "Surface", confidence: 87, comments: "Minor deformation detected on panel surface. Appears to be from impact during transport." },
  Cabinet: { damageType: "Rust", assessment: "Repairable", damageAssessment: "Surface", confidence: 74, comments: "Surface corrosion visible on door frame. Does not appear to affect structural integrity." },
  Radiator: { damageType: "Dent", assessment: "Non-Repairable", damageAssessment: "Structural", confidence: 62, comments: "Significant deformation across fin array. May compromise thermal performance." },
};

function deriveLocation(section: string, sub: string): string {
  return sub ? `${section} — ${sub}` : section;
}

function newEntry(section: SectionId, sub: string, imageUrl: string, aiDetected: boolean, ai?: typeof MOCK_AI[SectionId]): DamageEntry {
  const id = `dmg-${Date.now()}`;
  return {
    id, imageUrl, name: imageUrl ? "Damage Photo" : "Manual Entry",
    aiDetected, confidence: ai?.confidence,
    damageType: aiDetected && ai ? ai.damageType : "",
    sectionLocation: section, subLocation: sub,
    location: deriveLocation(section, sub),
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
  options: T[];
  value: T | "";
  onChange: (v: T) => void;
  disabled?: boolean;
  activeColors: Record<T, string>;
  aiOriginal?: T | "";
  size?: "sm" | "md";
}) {
  const h = size === "md" ? 48 : 44;
  const fs = size === "md" ? 15 : 13;
  return (
    <div style={{ opacity: disabled ? 0.38 : 1, pointerEvents: disabled ? "none" : "auto" }}>
      <div style={{ display: "flex", borderRadius: 100, background: "rgba(118,118,128,0.12)", padding: 3, gap: 3, height: h }}>
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
                background: isSelected ? activeColors[opt] : "transparent",
                color: isSelected ? "white" : "rgba(0,0,0,0.50)",
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
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: 20, height: 20, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
      >
        <HelpCircle size={14} color="rgba(27,32,56,0.30)" />
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", left: 24, top: 0, zIndex: 9999, width: 340,
            background: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)",
            borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.14)", padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 8, borderBottom: "1px solid rgba(0,0,0,0.06)", marginBottom: 10 }}>
              <HelpCircle size={13} color="#0047BB" />
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", color: "#0047BB" }}>{label}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "max-content 1fr", rowGap: 8, columnGap: 12 }}>
              {Object.entries(items).map(([term, desc]) => (
                <>
                  <span key={`t-${term}`} style={{ fontSize: 13, color: "#1B2038", fontWeight: 600, whiteSpace: "nowrap" }}>{term}</span>
                  <span key={`d-${term}`} style={{ fontSize: 13, color: "rgba(27,32,56,0.58)" }}>{desc}</span>
                </>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── AI Restore Chip ────────────────────────────────────────────────────────── */
function AiRestoreChip({ aiValue, onRestore }: { aiValue: string; onRestore: () => void }) {
  return (
    <button
      onClick={onRestore}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4, height: 22,
        padding: "0 10px", borderRadius: 9999, background: "rgba(124,58,237,0.08)",
        border: "1px solid rgba(124,58,237,0.22)", cursor: "pointer",
      }}
    >
      <Sparkles size={10} color="#7c3aed" />
      <span style={{ fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>AI: {aiValue}</span>
    </button>
  );
}

/* ─── Confidence Badge ───────────────────────────────────────────────────────── */
function ConfBadge({ score }: { score: number }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5, height: 30, padding: "0 14px",
      borderRadius: 9999, background: "rgba(107,33,168,0.07)", border: "1px solid rgba(139,92,246,0.30)",
    }}>
      <Sparkles size={14} color="#6b21a8" />
      <span style={{ fontSize: 14, color: "#6b21a8", fontWeight: 600 }}>{score}% Confidence</span>
    </div>
  );
}

/* ─── Manual Entry Badge ─────────────────────────────────────────────────────── */
function ManualBadge() {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", height: 26, padding: "0 10px",
      borderRadius: 9999, background: "#f5f5f5", border: "1px solid #e5e5e5",
      fontSize: 12, color: "#737373", fontWeight: 500,
    }}>
      Manual Entry
    </div>
  );
}

/* ─── DamageCard ─────────────────────────────────────────────────────────────── */
interface DamageCardProps {
  entry: DamageEntry;
  index: number;
  isPending?: boolean;
  onChange: (updated: DamageEntry) => void;
  onDelete: () => void;
  onAddPhoto?: () => void;
  onLightbox: (url: string) => void;
}

function DamageCard({ entry, index, isPending, onChange, onDelete, onAddPhoto, onLightbox }: DamageCardProps) {
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
    <div style={{
      borderRadius: 14, overflow: "hidden",
      border: isPending ? "1.5px solid #86efac" : "1px solid rgba(0,0,0,0.08)",
      background: "white",
    }}>
      {/* AI Detection Banner */}
      {isPending && (
        <div style={{
          height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px",
          background: entry.aiDetected ? "#dcfce7" : "#f0f9ff",
          borderBottom: entry.aiDetected ? "1px solid #86efac" : "1px solid #7dd3fc",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {entry.aiDetected ? <Check size={16} color="#16a34a" /> : <Camera size={16} color="#0369a1" />}
            <span style={{ fontSize: 13, color: entry.aiDetected ? "#14532d" : "#0c4a6e", fontWeight: 500 }}>
              {entry.aiDetected
                ? `AI detected ${entry.damageType} damage — review details below.`
                : "Photo captured — AI could not detect damage type. Fill in details manually."}
            </span>
          </div>
          {entry.aiDetected && entry.confidence != null && (
            <ConfBadge score={entry.confidence} />
          )}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
          padding: collapsed ? "10px 12px 10px 12px" : "16px 20px",
          borderBottom: collapsed ? "none" : "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Collapsed thumbnail */}
        {collapsed && entry.imageUrl && (
          <img
            src={entry.imageUrl} alt="damage"
            style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(0,0,0,0.08)", flexShrink: 0 }}
          />
        )}

        {/* Title */}
        <span
          style={{ fontSize: 16, fontWeight: 600, color: "#1B2038", flex: 1 }}
          onClick={() => setCollapsed((c) => !c)}
        >
          {smartTitle}
        </span>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {!isPending && entry.aiDetected && entry.confidence != null && !collapsed && <ConfBadge score={entry.confidence} />}
          {!isPending && !entry.aiDetected && !collapsed && <ManualBadge />}

          {isPending && (
            <button
              onClick={() => onAddPhoto?.()}
              style={{
                display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 12px",
                borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "white",
                cursor: "pointer", fontSize: 13, color: "#525252", fontWeight: 500,
              }}
            >
              {entry.imageUrl ? <RotateCcw size={13} /> : <Camera size={13} />}
              {entry.imageUrl ? "Retake" : "Add Photo"}
            </button>
          )}

          {!isPending && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowActionsMenu((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 12px",
                  borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "white",
                  cursor: "pointer", fontSize: 13, color: "#525252", fontWeight: 500,
                }}
              >
                <Settings2 size={13} /> Actions <ChevronDown size={13} />
              </button>
              {showActionsMenu && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setShowActionsMenu(false)} />
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
                    background: "white", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 10,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 176, overflow: "hidden",
                  }}>
                    <button
                      onClick={() => { setShowLocationPicker(true); setShowActionsMenu(false); if (collapsed) setCollapsed(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 16px", border: "none", background: "white", cursor: "pointer", fontSize: 14, color: "#171717" }}
                    >
                      <MapPin size={14} /> Change Location
                    </button>
                    <div style={{ height: 1, background: "rgba(0,0,0,0.07)" }} />
                    <button
                      onClick={() => { onDelete(); setShowActionsMenu(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 16px", border: "none", background: "white", cursor: "pointer", fontSize: 14, color: "#ef4444" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "white"; }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid rgba(0,0,0,0.10)", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#737373" }}
          >
            {collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Collapsed summary */}
      {collapsed && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "10px 20px 14px" }}>
          {[entry.damageType, entry.location, entry.assessment, entry.damageAssessment].filter(Boolean).map((chip, i) => (
            <span key={i} style={{ fontSize: 13, height: 26, padding: "0 12px", borderRadius: 9999, background: "#f5f5f5", border: "1px solid #e5e5e5", color: "#525252", display: "inline-flex", alignItems: "center" }}>{chip}</span>
          ))}
          {entry.additionalPhotos.length > 0 && (
            <span style={{ fontSize: 13, height: 26, padding: "0 12px", borderRadius: 9999, background: "#f5f5f5", border: "1px solid #e5e5e5", color: "#525252", display: "inline-flex", alignItems: "center", gap: 4 }}>
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
          {/* Location picker row */}
          {showLocationPicker && (
            <div style={{ padding: "16px 20px", background: "rgba(248,250,252,0.80)", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "flex-end", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "hsl(var(--muted-foreground))", marginBottom: 4 }}>Location *</label>
                <Select value={lpSection} onValueChange={(v) => { setLpSection(v as SectionId); setLpSub(""); }}>
                  <SelectTrigger className="h-9 bg-background text-sm shadow-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Tank", "Cabinet", "Radiator"] as SectionId[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "hsl(var(--muted-foreground))", marginBottom: 4 }}>Sublocation *</label>
                <Select value={lpSub} onValueChange={setLpSub}>
                  <SelectTrigger className="h-9 bg-background text-sm shadow-none"><SelectValue placeholder={lpSection ? "Select sublocation" : "Select a location first"} /></SelectTrigger>
                  <SelectContent>
                    {(SUB_LOCATIONS[lpSection] || []).map((s) => <SelectItem key={s.label} value={s.label}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <button
                onClick={confirmLocationPicker}
                style={{ width: 38, height: 42, borderRadius: 8, border: "1px solid rgba(0,0,0,0.10)", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Check size={16} color="#16a34a" />
              </button>
            </div>
          )}

          {/* Row A: three-column fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, padding: "20px 20px 0" }}>
            {/* Damage Type */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8" }}>Damage Type *</label>
                <FieldTooltip label="Damage Types" items={DAMAGE_TYPE_DESCS} />
              </div>
              <Select value={entry.damageType || ""} onValueChange={(v) => handleDamageTypeChange(v as DamageType)}>
                <SelectTrigger style={{ height: 52, borderRadius: 10, background: "#f8fafc", border: "1px solid #e5e5e5", fontSize: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DAMAGE_TYPES.map((dt) => <SelectItem key={dt} value={dt}>{dt}</SelectItem>)}
                </SelectContent>
              </Select>
              {entry.damageType && entry.aiOriginal?.damageType && entry.damageType !== entry.aiOriginal.damageType && (
                <div className="mt-1"><AiRestoreChip aiValue={entry.aiOriginal.damageType} onRestore={() => update({ damageType: entry.aiOriginal!.damageType })} /></div>
              )}
            </div>

            {/* Repairability */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8" }}>Repairability {entry.damageType !== "None" ? "*" : ""}</label>
                <FieldTooltip label="Repairability" items={REPAIRABILITY_DESCS} />
              </div>
              <SegmentControl<Assessment>
                options={["Repairable", "Non-Repairable"]}
                value={entry.assessment}
                onChange={(v) => update({ assessment: v })}
                disabled={entry.damageType === "None"}
                activeColors={{ "Repairable": "#16a34a", "Non-Repairable": "#dc2626" }}
                aiOriginal={entry.aiOriginal?.assessment}
              />
            </div>

            {/* Damage Assessment */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8" }}>Damage Assessment {entry.damageType !== "None" ? "*" : ""}</label>
                <FieldTooltip label="Damage Assessment" items={DAMAGE_ASSESSMENT_DESCS} />
              </div>
              <SegmentControl<DamageAssessment>
                options={["Surface", "Structural"]}
                value={entry.damageAssessment}
                onChange={(v) => update({ damageAssessment: v })}
                disabled={entry.damageType === "None"}
                activeColors={{ "Surface": "#0047bb", "Structural": "#b45309" }}
                aiOriginal={entry.aiOriginal?.damageAssessment}
              />
            </div>
          </div>

          {/* Row B: photo + comments */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: 20 }}>
            {/* Photo slot */}
            <div style={{ width: 176, flexShrink: 0 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8", marginBottom: 6 }}>Photo</label>
              {entry.imageUrl ? (
                <div
                  style={{ width: 176, height: 132, borderRadius: 12, border: "1px solid #bfdbfe", cursor: "zoom-in", position: "relative", overflow: "hidden" }}
                  onClick={() => onLightbox(entry.imageUrl)}
                >
                  <img src={entry.imageUrl} alt="damage" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 6, background: "rgba(0,0,0,0.42)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Maximize2 size={13} color="white" />
                  </div>
                </div>
              ) : (
                <div style={{ width: 176, height: 132, borderRadius: 12, border: "1.5px dashed rgba(0,0,0,0.15)", background: "rgba(0,0,0,0.025)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Camera size={24} color="rgba(0,0,0,0.22)" />
                  <span style={{ fontSize: 12, color: "rgba(0,0,0,0.32)" }}>No Photo</span>
                </div>
              )}
            </div>

            {/* Comments */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8" }}>Comments</label>
                {entry.aiOriginal?.comments && <Sparkles size={12} color="#7c3aed" />}
              </div>
              <Textarea
                value={entry.comments}
                onChange={(e) => update({ comments: e.target.value })}
                placeholder="Add observation notes…"
                rows={4}
                style={{ borderRadius: 10, border: "1px solid #e5e5e5", background: "white", fontSize: 15, minHeight: 132, resize: "none", padding: "12px 16px" }}
                className="shadow-none"
              />
              {entry.comments !== entry.aiOriginal?.comments && entry.aiOriginal?.comments && (
                <div className="mt-1"><AiRestoreChip aiValue="original comment" onRestore={() => update({ comments: entry.aiOriginal!.comments })} /></div>
              )}
            </div>
          </div>

          {/* Photo quality advisory (when photo present) */}
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
  const borderColor = status === "pending" ? "#fde047" : status === "clean" ? "#16a34a" : "#3b82f6";
  const iconBg = status === "pending" ? "#fefce8" : status === "clean" ? "rgba(22,163,74,0.08)" : "rgba(59,130,246,0.08)";
  const iconColor = status === "pending" ? "#ca8a04" : status === "clean" ? "#16a34a" : "#3b82f6";
  const title = status === "pending" ? "Tank Inspection (Required)" : status === "clean" ? "Tank Inspection — No Damage" : "Tank Inspection — Damage Documented";
  const titleColor = status === "pending" ? "#171717" : status === "clean" ? "#15803d" : "#1d4ed8";
  const subtitle = status === "pending"
    ? "If you have access to the tank during transportation, take a photo, or upload a photo taken during available access."
    : status === "clean"
    ? "Tank confirmed clean. No corrosion or damage found."
    : "Tank damage has been documented below.";

  return (
    <div
      style={{ display: "flex", gap: 24, padding: 24, borderRadius: 14, background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)", border: `2.5px solid ${borderColor}`, cursor: status === "damaged" ? "pointer" : "default" }}
      onClick={status === "damaged" ? onDismiss : undefined}
    >
      <div style={{ width: 88, height: 88, borderRadius: 14, background: iconBg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {status === "clean" ? <Check size={36} color={iconColor} /> : status === "damaged" ? <Camera size={36} color={iconColor} /> : <Package2 size={36} color={iconColor} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: titleColor, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 14, color: "rgba(27,32,56,0.58)", marginBottom: 16 }}>{subtitle}</div>
        {status === "pending" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 248 }}>
            <button
              onClick={onClean}
              style={{ height: 52, borderRadius: 9999, background: "#16a34a", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 600, boxShadow: "0 4px 16px rgba(22,163,74,0.28)" }}
            >
              <Check size={18} /> No Damage Found
            </button>
            <button
              onClick={onDocumentDamage}
              style={{ height: 52, borderRadius: 9999, background: "#0047bb", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,71,187,0.28)" }}
            >
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

  return (
    <div style={{ background: "white", borderRadius: 18, border: si.cardBorder, overflow: "hidden", boxShadow: `0 2px 16px ${si.shadowColor}, 0 1px 3px rgba(0,0,0,0.05)`, marginBottom: 16 }}>
      {/* Header */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: si.headerGradient, cursor: "pointer" }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 12, background: si.iconBg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: si.iconColor }}>
          {si.icon}
        </div>
        <span style={{ fontSize: 18, fontWeight: 600, color: "#1B2038" }}>{section}</span>
        <span style={{ fontSize: 13, color: "rgba(27,32,56,0.50)" }}>
          {entries.length === 0 ? "no findings" : `${entries.length} finding${entries.length !== 1 ? "s" : ""}`}
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${si.iconColor}`, display: "flex", alignItems: "center", justifyContent: "center", color: si.iconColor }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ borderTop: si.bodyDivider, padding: "14px 14px 16px", background: si.bodyBg }}>
          {/* Base inspection card (Tank only) */}
          {section === "Tank" && baseStatus && baseStatus !== "dismissed" && (
            <div style={{ marginBottom: 16 }}>
              <BaseInspectionCard
                status={baseStatus}
                onClean={onBaseClean!}
                onDocumentDamage={onBaseDocument!}
                onDismiss={onBaseDismiss!}
              />
            </div>
          )}

          {/* Tabs + contextual button row */}
          {tabs.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {tabs.map((tab) => {
                  const isActive = activeTab === tab;
                  const count = tab === "All" ? null : entries.filter((e) => e.subLocation === tab).length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: "6px 14px", borderRadius: 100, fontSize: 13, cursor: "pointer",
                        background: isActive ? si.iconColor : "white",
                        color: isActive ? "white" : "#525252",
                        fontWeight: isActive ? 600 : 500,
                        border: isActive ? "none" : "1px solid rgba(0,0,0,0.10)",
                        boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                      }}
                    >
                      {tab}{count != null && <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 12 }}>{count}</span>}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => onDocumentContextual(section, activeTab !== "All" ? activeTab : undefined)}
                style={{ display: "flex", alignItems: "center", gap: 6, height: 44, padding: "0 16px", borderRadius: 100, background: "transparent", border: `1.5px solid ${si.iconColor}`, color: si.iconColor, fontSize: 15, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                <Camera size={16} /> Document {activeTab !== "All" ? `${section} ${activeTab}` : `${section}`} Damage
              </button>
            </div>
          )}

          {/* Entries */}
          {filteredEntries.length === 0 && !pendingEntry ? (
            <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.40)", borderRadius: 12, border: "1.5px dashed rgba(0,0,0,0.10)" }}>
              <span style={{ fontSize: 15, color: "rgba(27,32,56,0.45)" }}>
                {activeTab !== "All" ? "No findings for this sublocation" : "No findings yet for this section"}
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredEntries.map((e, i) => (
                <DamageCard
                  key={e.id}
                  entry={e}
                  index={entries.indexOf(e)}
                  onChange={(updated) => onEntryChange(e.id, updated)}
                  onDelete={() => onEntryDelete(e.id)}
                  onLightbox={onLightbox}
                />
              ))}
            </div>
          )}

          {/* Pending entry in this section */}
          {pendingEntry && pendingEntry.sectionLocation === section && (
            <div style={{ marginTop: 16 }}>
              <DamageCard
                entry={pendingEntry}
                index={entries.length}
                isPending
                onChange={onPendingChange}
                onDelete={() => {}}
                onLightbox={onLightbox}
              />
            </div>
          )}

          {/* Contextual button when no tabs */}
          {tabs.length === 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: filteredEntries.length > 0 || (pendingEntry?.sectionLocation === section) ? 12 : 0 }}>
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

/* ─── Modal Overlay ──────────────────────────────────────────────────────────── */
function ModalOverlay({ onClose, children, style }: { onClose?: () => void; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.50)", ...style }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* ─── Location Selector Modal ────────────────────────────────────────────────── */
function LocationSelectorModal({ onSelect, onCancel }: { onSelect: (s: SectionId) => void; onCancel: () => void }) {
  return (
    <ModalOverlay onClose={onCancel}>
      <div style={{ width: 520, borderRadius: 24, overflow: "hidden", background: "rgba(242,242,247,0.97)", backdropFilter: "blur(40px)", boxShadow: "0 24px 60px rgba(0,0,0,0.30)" }}>
        <div style={{ padding: "28px 20px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1c1c1e", letterSpacing: "-0.5px", marginBottom: 4 }}>Where is the damage?</div>
          <div style={{ fontSize: 16, color: "#3c3c43" }}>Select the section of the transformer</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, padding: "0 20px 18px" }}>
          {(["Tank", "Cabinet", "Radiator"] as SectionId[]).map((sec) => {
            const si = SECTION_INFO[sec];
            return (
              <button
                key={sec}
                onClick={() => onSelect(sec)}
                style={{
                  padding: "28px 16px", borderRadius: 18, background: "white", border: "1.5px solid rgba(0,0,0,0.10)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 14, transition: "transform 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
              >
                <div style={{ width: 84, height: 84, borderRadius: 16, background: si.iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: si.iconColor }}>
                  {SECTION_ICON_LARGE[sec]}
                </div>
                <span style={{ fontSize: 18, color: "#1c1c1e", fontWeight: 600 }}>{sec}</span>
              </button>
            );
          })}
        </div>
        <div style={{ padding: "0 20px 24px" }}>
          <button
            onClick={onCancel}
            style={{ width: "100%", height: 56, borderRadius: 16, background: "rgba(120,120,128,0.12)", border: "none", color: "#3c3c43", fontSize: 17, cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ─── Sublocation Selector Modal ─────────────────────────────────────────────── */
function SublocationSelectorModal({ section, onSelect, onBack, onCancel }: { section: SectionId; onSelect: (sub: string) => void; onBack: () => void; onCancel: () => void }) {
  const si = SECTION_INFO[section];
  const subLocs = SUB_LOCATIONS[section];
  const cols = Math.min(subLocs.length, 4);

  return (
    <ModalOverlay onClose={onCancel}>
      <div style={{ width: 580, borderRadius: 24, overflow: "hidden", background: "rgba(242,242,247,0.97)", backdropFilter: "blur(40px)", boxShadow: "0 24px 60px rgba(0,0,0,0.30)" }}>
        <div style={{ padding: "28px 20px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ color: si.iconColor, display: "flex", alignItems: "center" }}>{si.icon}</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: si.iconColor }}>{section}</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1c1c1e", marginBottom: 4 }}>Select Sub-location</div>
          <div style={{ fontSize: 16, color: "#3c3c43" }}>Where exactly is the damage located?</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12, padding: "0 20px 18px" }}>
          {subLocs.map((sub) => (
            <button
              key={sub.label}
              onClick={() => onSelect(sub.label)}
              style={{
                padding: "20px 8px", borderRadius: 16, background: "white", border: "1.5px solid rgba(0,0,0,0.10)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "transform 0.12s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            >
              <div
                style={{ width: 56, height: 56, borderRadius: 12, background: si.iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: si.iconColor, transform: sub.flip ? "scaleX(-1)" : undefined }}
              >
                {sub.icon}
              </div>
              <span style={{ fontSize: 14, color: "#1c1c1e", fontWeight: 600, textAlign: "center", lineHeight: 1.35 }}>{sub.label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, padding: "0 20px 24px" }}>
          <button onClick={onBack} style={{ flex: 1, height: 56, borderRadius: 16, background: "rgba(120,120,128,0.12)", border: "none", color: "#3c3c43", fontSize: 16, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <ChevronLeft size={18} /> Back
          </button>
          <button onClick={onCancel} style={{ flex: 1, height: 56, borderRadius: 16, background: "rgba(120,120,128,0.08)", border: "none", color: "#3c3c43", fontSize: 16, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ─── Photo Source Modal ─────────────────────────────────────────────────────── */
function PhotoSourceModal({ onTakePhoto, onUpload, onWithoutPhoto, onCancel }: {
  onTakePhoto: () => void;
  onUpload: () => void;
  onWithoutPhoto: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.48)", paddingBottom: 48 }}>
      <div style={{ width: 420, borderRadius: 20, overflow: "hidden", background: "rgba(242,242,247,0.96)", backdropFilter: "blur(40px)", boxShadow: "0 24px 60px rgba(0,0,0,0.28)" }}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid rgba(0,0,0,0.12)", textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: "#1c1c1e", letterSpacing: "-0.43px", marginBottom: 4 }}>Add a Photo</div>
          <div style={{ fontSize: 13, color: "#6c6c70" }}>How would you like to document this damage?</div>
        </div>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Take Photo", icon: <Camera size={20} color="#0047bb" />, action: onTakePhoto },
            { label: "Upload Photo", icon: <Upload size={20} color="#0047bb" />, action: onUpload },
            { label: "Enter Without Photo", icon: <EyeOff size={20} color="#0047bb" />, action: onWithoutPhoto },
          ].map(({ label, icon, action }) => (
            <button
              key={label}
              onClick={action}
              style={{ height: 56, borderRadius: 14, border: "none", background: "white", fontSize: 17, letterSpacing: "-0.43px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "0 20px" }}
            >
              {icon} {label}
            </button>
          ))}
          <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "2px 0" }} />
          <button
            onClick={onCancel}
            style={{ height: 56, borderRadius: 14, border: "none", background: "white", fontSize: 17, letterSpacing: "-0.43px", fontWeight: 500, color: "#3c3c43", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── AI Analyzing Overlay ───────────────────────────────────────────────────── */
function AIAnalyzingOverlay({ onCancel }: { onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(27,32,56,0.38)" }}>
      <div style={{ position: "relative", background: "rgba(255,255,255,0.94)", backdropFilter: "blur(32px)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.90)", boxShadow: "0 24px 80px rgba(0,0,0,0.18), 0 4px 16px rgba(0,71,187,0.12)", padding: "52px 64px 44px", minWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <button
          onClick={onCancel}
          style={{ position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.65)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <X size={16} />
        </button>
        <Loader2 size={36} color="#0047BB" style={{ animation: "spin 0.8s linear infinite" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#1B2038", marginBottom: 6 }}>AI is analysing the image.</div>
          <div style={{ fontSize: 15, color: "rgba(27,32,56,0.56)" }}>Please hold on.</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Base Damage Alert ──────────────────────────────────────────────────────── */
function BaseDamageAlert({ onProceed, onGoBack }: { onProceed: () => void; onGoBack: () => void }) {
  return (
    <ModalOverlay>
      <div style={{ width: 340, borderRadius: 34, overflow: "hidden", background: "rgba(249,249,249,0.92)", backdropFilter: "blur(40px)", boxShadow: "0 8px 40px rgba(0,0,0,0.22)", border: "0.5px solid rgba(255,255,255,0.6)", padding: "32px 28px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Flag size={22} color="#d97706" />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: "#1c1c1e", letterSpacing: "-0.43px", marginBottom: 8 }}>Base Damage Not Documented</div>
          <div style={{ fontSize: 15, color: "#3c3c43", letterSpacing: "-0.24px" }}>
            We noticed this transformer is flagged with Base Damage, and no Tank damage has been documented. Would you still like to proceed?
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          <button onClick={onProceed} style={{ height: 52, borderRadius: 9999, background: "#d97706", color: "white", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600 }}>Proceed Anyway</button>
          <button onClick={onGoBack} style={{ height: 50, borderRadius: 9999, background: "rgba(120,120,128,0.16)", color: "#1c1c1e", border: "none", cursor: "pointer", fontSize: 16 }}>Go Back & Document</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ─── Image Lightbox ─────────────────────────────────────────────────────────── */
function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 10002, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)", cursor: "zoom-out" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 48, right: 48, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18 }}
      >
        ✕
      </button>
      <img
        src={url} alt="damage" onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 1100, maxHeight: 820, objectFit: "contain", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.50)", cursor: "default" }}
      />
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

  /* ─── State ─────────────────────────────────────────────────────────────────── */
  const [entries, setEntries] = useState<DamageEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<DamageEntry | null>(null);
  const [baseStatus, setBaseStatus] = useState<BaseStatus>("pending");
  const [saveDraftState, setSaveDraftState] = useState<SaveDraftState>("idle");
  const [savedTimestamp, setSavedTimestamp] = useState<number | null>(null);

  /* Modal flow */
  const [modalStep, setModalStep] = useState<ModalStep>(null);
  const [flowSection, setFlowSection] = useState<SectionId | null>(null);
  const [flowSublocation, setFlowSublocation] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── Document damage flow helpers ─────────────────────────────────────────── */
  function openDocumentFlow(preSection?: SectionId, preSub?: string) {
    if (preSection && preSub) {
      setFlowSection(preSection);
      setFlowSublocation(preSub);
      setModalStep("photoSource");
    } else if (preSection) {
      setFlowSection(preSection);
      setFlowSublocation(null);
      setModalStep("sublocation");
    } else {
      setFlowSection(null);
      setFlowSublocation(null);
      setModalStep("location");
    }
  }

  function handleLocationSelect(sec: SectionId) {
    setFlowSection(sec);
    setModalStep("sublocation");
  }

  function handleSublocationSelect(sub: string) {
    setFlowSublocation(sub);
    setModalStep("photoSource");
  }

  function simulateTakePhoto() {
    setModalStep("aiAnalyzing");
    setTimeout(() => {
      const sec = flowSection!;
      const sub = flowSublocation ?? "";
      const ai = MOCK_AI[sec];
      const entry = newEntry(sec, sub, "/nameplate.png", true, ai);
      commitPending(entry);
      setModalStep(null);
    }, 1800);
  }

  function handleUploadPhoto() {
    setModalStep(null);
    setTimeout(() => fileInputRef.current?.click(), 50);
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setModalStep("aiAnalyzing");
      setTimeout(() => {
        const sec = flowSection!;
        const sub = flowSublocation ?? "";
        const ai = MOCK_AI[sec];
        const entry = newEntry(sec, sub, url, true, ai);
        commitPending(entry);
        setModalStep(null);
      }, 1800);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleWithoutPhoto() {
    const sec = flowSection!;
    const sub = flowSublocation ?? "";
    const entry = newEntry(sec, sub, "", false);
    commitPending(entry);
    setModalStep(null);
  }

  function commitPending(entry: DamageEntry) {
    if (currentEntry) {
      setEntries((prev) => [...prev, currentEntry]);
    }
    setCurrentEntry(entry);
  }

  /* ─── Save draft ─────────────────────────────────────────────────────────────── */
  function handleSaveDraft() {
    if (saveDraftState === "saving") return;
    setSaveDraftState("saving");
    setTimeout(() => {
      setSaveDraftState("saved");
      setSavedTimestamp(Date.now());
      setTimeout(() => setSaveDraftState("savedAgo"), 2500);
    }, 1500);
  }

  /* ─── Next button ────────────────────────────────────────────────────────────── */
  const allEntries = [...entries, ...(currentEntry ? [currentEntry] : [])];
  const hasUnconfirmedAssessments = allEntries.some(
    (e) => e.damageType !== "None" && (e.assessment === "" || e.damageAssessment === "")
  );
  const hasTankFindings = allEntries.some((e) => e.sectionLocation === "Tank");

  function handleNext() {
    if (hasUnconfirmedAssessments) return;
    if (unit.hasBaseDamage && !hasTankFindings) {
      setModalStep("baseDamageAlert");
      return;
    }
    setCurrentPage("evaluations-history");
  }

  /* ─── Pill tags (same logic as NameplatePage) ────────────────────────────────── */
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

        {/* Main area */}
        <main className="flex-1 overflow-hidden" style={{ background: "linear-gradient(150deg, #e4ecf7 0%, #eef1f8 50%, #f3f5fa 100%)" }}>
          <div className="h-full flex flex-col overflow-hidden" style={{ padding: "24px 24px 0" }}>

            {/* Page header */}
            <div className="flex items-start justify-between mb-5 flex-shrink-0">
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1B2038", marginBottom: 4 }}>Condition</h1>
                <p style={{ fontSize: 16, color: "rgba(27,32,56,0.44)" }}>Document and photograph any physical damage found on this unit</p>
              </div>

              {/* Header pills */}
              <div className="flex items-center flex-wrap gap-2 justify-end">
                {[
                  { lbl: "MFR", val: unit.manufacturer },
                  { lbl: "IC", val: unit.icNumber },
                  { lbl: "S#", val: unit.mfgSerial },
                  { lbl: "KVA", val: unit.kva.toLocaleString() },
                  { lbl: "TYPE", val: TRANSFORMER_TYPE_ABBR[unit.transformerType] ?? unit.transformerType },
                ].map(({ lbl, val }) => (
                  <Badge key={lbl} className="gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(27,32,56,0.85)" }}>
                    <span style={{ color: "rgba(27,32,56,0.50)" }}>{lbl}</span>
                    <span style={{ color: "rgba(27,32,56,0.20)" }}>|</span>
                    <span>{val}</span>
                  </Badge>
                ))}
                {npxTags.map((tag) => {
                  const [lbl, val] = tag.split(": ");
                  return (
                    <Badge key={tag} className="gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(13,22,41,0.75)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                      {lbl && <span style={{ color: "rgba(255,255,255,0.80)" }}>{lbl}</span>}
                      {lbl && val && <span style={{ color: "rgba(255,255,255,0.30)" }}>|</span>}
                      {val && <span style={{ color: "rgba(255,255,255,0.80)" }}>{val}</span>}
                    </Badge>
                  );
                })}
                {unit.hasBaseDamage && (
                  <Badge className="gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(217,119,6,0.15)", border: "1px solid rgba(217,119,6,0.35)", color: "#d97706" }}>
                    <Flag size={11} /> Flagged
                  </Badge>
                )}
              </div>
            </div>

            {/* Glass form card */}
            <div className="flex-1 overflow-hidden flex flex-col" style={{ background: "rgba(255,255,255,0.80)", backdropFilter: "blur(20px)", borderRadius: "20px 20px 0 0", border: "1px solid rgba(255,255,255,0.70)", boxShadow: "0 4px 32px rgba(27,32,56,0.08), 0 1px 0 rgba(255,255,255,0.6) inset" }}>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto" style={{ padding: "28px 28px 8px" }}>

                {/* Document Damage CTA */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: 24, background: "rgba(255,255,255,0.72)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.85)", borderRadius: 20, boxShadow: "0 8px 32px rgba(0,71,187,0.10), inset 0 1px 0 rgba(255,255,255,0.9)", padding: "20px 24px", cursor: "pointer", marginBottom: 28 }}
                  onClick={() => openDocumentFlow()}
                >
                  <div style={{ width: 80, height: 80, borderRadius: 18, background: "linear-gradient(145deg, rgba(59,130,246,0.18) 0%, rgba(99,160,255,0.10) 100%)", backdropFilter: "blur(12px)", border: "1px solid rgba(147,197,253,0.55)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Camera size={34} color="#2563eb" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1B2038", marginBottom: 4 }}>Document Damage</div>
                    <div style={{ fontSize: 15, color: "rgba(27,32,56,0.52)" }}>Take a clear photo of the damage. AI will automatically detect the damage type and severity.</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); openDocumentFlow(); }}
                    style={{ height: 48, padding: "0 20px", borderRadius: 100, background: "linear-gradient(135deg, #0047bb 0%, #0065ff 100%)", boxShadow: "0 4px 20px rgba(0,71,187,0.38), inset 0 1px 0 rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.18)", color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0 }}
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
                    onEntryDelete={(id) => setEntries((prev) => prev.filter((e) => e.id !== id))}
                    onPendingChange={setCurrentEntry}
                    onLightbox={setLightboxUrl}
                  />
                ))}

                <div style={{ height: 20 }} />
              </div>

              {/* Bottom action bar */}
              <div style={{ padding: "16px 28px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={() => setCurrentPage("nameplate")}
                    style={{ height: 52, padding: "0 20px", borderRadius: 9999, background: "rgba(27,32,56,0.07)", border: "1px solid rgba(27,32,56,0.09)", color: "#1B2038", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <ChevronLeft size={18} /> Back
                  </button>

                  <button
                    onClick={handleSaveDraft}
                    disabled={saveDraftState === "saving"}
                    style={{ height: 52, padding: "0 24px", borderRadius: 9999, background: "#1B2038", color: "white", border: "none", fontSize: 16, fontWeight: 600, cursor: saveDraftState === "saving" ? "default" : "pointer", boxShadow: "0 2px 10px rgba(27,32,56,0.22)", display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {saveDraftState === "saving" ? <Loader2 size={17} style={{ animation: "spin 0.8s linear infinite" }} /> : <Save size={17} />}
                    {saveDraftState === "saving" ? "Saving…" : "Save Draft"}
                  </button>

                  {saveDraftState === "saved" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#16a34a" }}>
                      <CheckCircle2 size={16} /> Draft saved
                    </div>
                  )}
                  {saveDraftState === "savedAgo" && (
                    <div style={{ fontSize: 13, color: "rgba(27,32,56,0.44)" }}>
                      Last saved {savedTimestamp ? `${Math.round((Date.now() - savedTimestamp) / 1000)}s` : "5s"} ago
                    </div>
                  )}
                </div>

                <button
                  onClick={handleNext}
                  disabled={hasUnconfirmedAssessments}
                  title={hasUnconfirmedAssessments ? "Confirm all assessments before proceeding" : undefined}
                  style={{
                    height: 52, padding: "0 28px", borderRadius: 9999, fontSize: 16, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6, border: "none", cursor: hasUnconfirmedAssessments ? "not-allowed" : "pointer",
                    background: hasUnconfirmedAssessments ? "#94a3b8" : "#0047bb",
                    boxShadow: hasUnconfirmedAssessments ? "none" : "0 4px 16px rgba(0,71,187,0.28)",
                    color: "white", opacity: hasUnconfirmedAssessments ? 0.65 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  Next: Electrical <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Hidden file input for upload */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelected} />

      {/* Modals */}
      {modalStep === "location" && (
        <LocationSelectorModal onSelect={handleLocationSelect} onCancel={() => setModalStep(null)} />
      )}
      {modalStep === "sublocation" && flowSection && (
        <SublocationSelectorModal
          section={flowSection}
          onSelect={handleSublocationSelect}
          onBack={() => setModalStep("location")}
          onCancel={() => setModalStep(null)}
        />
      )}
      {modalStep === "photoSource" && (
        <PhotoSourceModal
          onTakePhoto={simulateTakePhoto}
          onUpload={handleUploadPhoto}
          onWithoutPhoto={handleWithoutPhoto}
          onCancel={() => setModalStep(null)}
        />
      )}
      {modalStep === "aiAnalyzing" && (
        <AIAnalyzingOverlay onCancel={() => setModalStep(null)} />
      )}
      {modalStep === "baseDamageAlert" && (
        <BaseDamageAlert
          onProceed={() => { setModalStep(null); setCurrentPage("evaluations-history"); }}
          onGoBack={() => setModalStep(null)}
        />
      )}
      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  );
}
