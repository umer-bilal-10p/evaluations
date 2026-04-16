import { useDemoContext } from "@/context/DemoContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

export default function ElectricalPage() {
  const { setCurrentPage } = useDemoContext();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center">
            <Zap size={32} className="text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Electrical Inspection</h1>
          <p className="text-muted-foreground text-base max-w-sm">
            This section is coming soon. It will capture electrical component findings for this transformer unit.
          </p>
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid hsl(var(--border))", display: "flex", alignItems: "center", justifyContent: "space-between", background: "hsl(var(--background))", flexShrink: 0 }}>
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentPage("nameplate")}
            className="h-11 rounded-full px-5 text-sm font-semibold gap-1.5"
          >
            <ChevronLeft size={16} />
            Back to Nameplate
          </Button>
          <Button
            size="sm"
            onClick={() => setCurrentPage("condition")}
            className="h-11 rounded-full px-6 text-sm font-semibold gap-1.5"
            style={{ background: "#0047bb", boxShadow: "0 4px 14px rgba(0,71,187,0.28)" }}
          >
            Next: Condition
            <ChevronRight size={16} />
          </Button>
        </div>
      </main>
    </div>
  );
}
