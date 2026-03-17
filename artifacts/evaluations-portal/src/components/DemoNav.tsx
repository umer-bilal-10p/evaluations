import { useDemoContext, DEMO_PAGES } from "@/context/DemoContext";

export function DemoNav() {
  const { currentPage, setCurrentPage } = useDemoContext();

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-1 rounded-full px-2 py-1.5 shadow-2xl"
      style={{ background: "rgba(13,22,41,0.92)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.10)" }}
    >
      <span
        className="select-none px-2 text-[10px] font-bold uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        Demo
      </span>
      <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)" }} />
      {DEMO_PAGES.map((page) => {
        const isActive = currentPage === page.id;
        return (
          <button
            key={page.id}
            onClick={() => setCurrentPage(page.id)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150"
            style={{
              background: isActive ? "#0047BB" : "transparent",
              color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.10)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)";
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }
            }}
          >
            {page.label}
          </button>
        );
      })}
    </div>
  );
}
