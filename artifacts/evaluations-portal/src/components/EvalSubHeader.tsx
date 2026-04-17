import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Flag } from "lucide-react";

const TRANSFORMER_TYPE_ABBR: Record<string, string> = {
  "Three-Phase Pad": "3PPM",
  "Single-Phase Pad": "1PPM",
  "Underground": "URD",
  "Network": "NTX",
  "Auto-Transformer": "AUTO",
};

type UnitInfo = {
  transformerType: string;
  manufacturer: string;
  icNumber: string;
  mfgSerial: string;
  kva: number;
  intakeTags: string[];
  hasBaseDamage: boolean;
};

export function EvalSubHeader({
  unit,
  onBack,
  rightSlot,
}: {
  unit: UnitInfo;
  onBack: () => void;
  rightSlot?: ReactNode;
}) {
  const npxTags = (unit.intakeTags ?? []).filter((t) => t.startsWith("NPX: "));

  return (
    <div
      className="flex items-center gap-4 px-6 flex-shrink-0 flex-wrap min-h-12"
      style={{ background: "#0d1629", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onBack}
        className="gap-1.5 border-white/22 bg-white/8 text-white/85 hover:bg-white/15 hover:text-white flex-shrink-0"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Back to Evaluation History
      </Button>

      <Separator orientation="vertical" className="h-4 bg-white/15 flex-shrink-0" />

      <div className="flex items-center gap-1.5 flex-wrap flex-1">
        <Badge variant="outline" className="text-xs font-medium text-white/80 bg-white/7 border-white/12 rounded-md px-2.5 py-0.5 gap-1.5">
          {TRANSFORMER_TYPE_ABBR[unit.transformerType] ?? unit.transformerType}
          <span className="text-white/30">|</span>
          {unit.manufacturer}
        </Badge>

        {([
          ["IC", unit.icNumber],
          ["Serial", unit.mfgSerial],
          ["kVA", unit.kva.toLocaleString()],
        ] as [string, string][]).map(([lbl, val]) => (
          <Badge key={lbl} variant="outline" className="text-xs font-medium text-white/80 bg-white/7 border-white/12 rounded-md px-2.5 py-0.5 gap-1.5">
            {lbl}
            <span className="text-white/30">|</span>
            {val}
          </Badge>
        ))}

        {npxTags.map((tag) => {
          const sep = tag.indexOf(": ");
          const lbl = sep !== -1 ? tag.slice(0, sep) : null;
          const val = sep !== -1 ? tag.slice(sep + 2) : tag;
          return (
            <Badge key={tag} variant="outline" className="text-xs font-medium text-white/80 bg-white/7 border-white/12 rounded-md px-2.5 py-0.5 gap-1.5">
              {lbl}
              {lbl && <span className="text-white/30">|</span>}
              {val}
            </Badge>
          );
        })}

        {unit.hasBaseDamage && (
          <Badge className="text-xs font-semibold gap-1.5 rounded-md px-2.5 py-0.5 border-[rgba(234,88,12,0.45)] bg-[rgba(234,88,12,0.25)] text-[#FEF3C7]">
            <Flag size={11} strokeWidth={2} />
            Base Damage
          </Badge>
        )}
      </div>

      {rightSlot && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {rightSlot}
        </div>
      )}
    </div>
  );
}
