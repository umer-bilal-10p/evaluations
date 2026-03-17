import { useState } from "react";
import { useDemoContext, type DemoPage } from "@/context/DemoContext";

interface NavItem {
  id: DemoPage;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "evaluations-history",
    label: "Evaluation History",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
];

const COLLAPSED_W = 52;
const EXPANDED_W = 220;

export function Sidebar() {
  const { currentPage, setCurrentPage } = useDemoContext();
  const [expanded, setExpanded] = useState(false);

  return (
    /*
     * Outer div: always 52px wide in flex layout — reserves the column.
     * Inner div: absolutely positioned, animates from 52→220px, overlays content.
     */
    <div
      className="relative flex-shrink-0"
      style={{ width: COLLAPSED_W }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: expanded ? EXPANDED_W : COLLAPSED_W,
          overflow: "hidden",
          transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
          background: "#0d1629",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          zIndex: 30,
          boxShadow: expanded ? "4px 0 20px rgba(0,0,0,0.28)" : "none",
        }}
      >
        {/*
         * Nav items — fixed width inner container so buttons don't grow with sidebar.
         * Padding is constant so nothing repositions on hover.
         */}
        <div style={{ padding: "12px 8px", width: EXPANDED_W }}>
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setCurrentPage(item.id); setExpanded(false); }}
                title={expanded ? undefined : item.label}
                style={{
                  /* Fixed width = expanded sidebar minus 2×padding. Clipped when collapsed. */
                  width: EXPANDED_W - 16,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  padding: 0,
                  borderRadius: 8,
                  /* Single background on the button only — no nested box */
                  background: isActive ? "rgba(91,156,246,0.12)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: isActive ? "#5b9cf6" : "rgba(255,255,255,0.45)",
                  transition: "background 0.15s, color 0.15s",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
                  }
                }}
              >
                {/* Icon — single span, no background, always at fixed position */}
                <span
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                  }}
                >
                  {item.icon}
                </span>

                {/* Label — fades in on expand */}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#5b9cf6" : "rgba(255,255,255,0.75)",
                    whiteSpace: "nowrap",
                    paddingLeft: 6,
                    opacity: expanded ? 1 : 0,
                    transition: "opacity 0.12s ease",
                    transitionDelay: expanded ? "0.1s" : "0s",
                    pointerEvents: "none",
                  }}
                >
                  {item.label}
                </span>

                {/* Active bar — only visible when expanded */}
                {isActive && (
                  <span
                    style={{
                      flexShrink: 0,
                      marginLeft: "auto",
                      marginRight: 8,
                      width: 3,
                      height: 16,
                      borderRadius: 2,
                      background: "#5b9cf6",
                      opacity: expanded ? 1 : 0,
                      transition: "opacity 0.12s ease",
                      transitionDelay: expanded ? "0.1s" : "0s",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
