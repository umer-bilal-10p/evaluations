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
     * The outer div reserves exactly COLLAPSED_W in the flex layout at all times.
     * The inner absolute div grows over the content area when expanded.
     */
    <div
      className="relative flex-shrink-0"
      style={{ width: COLLAPSED_W }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Sidebar panel — absolutely positioned so it overlays content when expanded */}
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
          boxShadow: expanded ? "4px 0 20px rgba(0,0,0,0.30)" : "none",
        }}
      >
        {/* Section label — only visible when expanded */}
        <div
          style={{
            padding: "16px 16px 6px",
            opacity: expanded ? 1 : 0,
            transition: "opacity 0.15s ease",
            transitionDelay: expanded ? "0.08s" : "0s",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.25)",
              whiteSpace: "nowrap",
            }}
          >
            Navigation
          </p>
        </div>

        {/* Nav items */}
        <div style={{ padding: expanded ? "0 8px" : "12px 8px 12px", paddingTop: expanded ? 0 : 12 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setCurrentPage(item.id); setExpanded(false); }}
                title={expanded ? undefined : item.label}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px",
                  borderRadius: 8,
                  background: isActive ? "rgba(91,156,246,0.12)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                  color: isActive ? "#5b9cf6" : "rgba(255,255,255,0.45)",
                  minWidth: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
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
                {/* Icon — always visible, centered when collapsed */}
                <span
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: isActive && !expanded ? "rgba(91,156,246,0.12)" : "transparent",
                  }}
                >
                  {item.icon}
                </span>

                {/* Label — fades in when expanded */}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#5b9cf6" : "rgba(255,255,255,0.75)",
                    whiteSpace: "nowrap",
                    opacity: expanded ? 1 : 0,
                    transition: "opacity 0.15s ease",
                    transitionDelay: expanded ? "0.08s" : "0s",
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  {item.label}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <span
                    style={{
                      flexShrink: 0,
                      width: 3,
                      height: 16,
                      borderRadius: 2,
                      background: "#5b9cf6",
                      opacity: expanded ? 1 : 0,
                      transition: "opacity 0.15s ease",
                      transitionDelay: expanded ? "0.08s" : "0s",
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
