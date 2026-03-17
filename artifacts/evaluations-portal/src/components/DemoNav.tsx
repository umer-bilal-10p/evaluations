import { useState } from "react";
import { useDemoContext, DEMO_PAGES } from "@/context/DemoContext";

export function DemoNav() {
  const { currentPage, setCurrentPage } = useDemoContext();
  const [visible, setVisible] = useState(true);

  return (
    <>
      {/* Full pill — shown when visible */}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-1 rounded-full px-2 py-1.5 shadow-2xl"
        style={{
          background: "rgba(13,22,41,0.92)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.10)",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
          transform: visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(12px)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
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

        {/* Divider + hide button */}
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)", marginLeft: 2 }} />
        <button
          onClick={() => setVisible(false)}
          title="Hide demo controls"
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.35)",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)"; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        </button>
      </div>

      {/* Minimised tab — shown when hidden */}
      <button
        onClick={() => setVisible(true)}
        title="Show demo controls"
        className="fixed bottom-6 z-[9999] rounded-full shadow-xl"
        style={{
          right: 20,
          opacity: visible ? 0 : 1,
          pointerEvents: visible ? "none" : "auto",
          transform: visible ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
          background: "rgba(13,22,41,0.92)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.12)",
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          color: "rgba(255,255,255,0.55)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)"; }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Demo
      </button>
    </>
  );
}
