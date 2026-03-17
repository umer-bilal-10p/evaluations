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

export function Sidebar() {
  const { currentPage, setCurrentPage } = useDemoContext();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: 52, zIndex: 30 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Icon strip — always visible */}
      <div
        className="flex flex-col items-center pt-4 gap-1 h-full"
        style={{
          width: 52,
          background: "#0d1629",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              title={item.label}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isActive ? "#5b9cf6" : "rgba(255,255,255,0.45)",
                background: isActive ? "rgba(91,156,246,0.12)" : "transparent",
                border: "none",
                cursor: "pointer",
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }
              }}
            >
              {item.icon}
            </button>
          );
        })}
      </div>

      {/* Expanded drawer — slides out to the right, overlays main content */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 52,
          height: "100%",
          width: expanded ? 196 : 0,
          overflow: "hidden",
          transition: "width 0.2s cubic-bezier(0.4,0,0.2,1)",
          background: "#111c35",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          zIndex: 1,
          boxShadow: expanded ? "4px 0 16px rgba(0,0,0,0.25)" : "none",
        }}
      >
        <div style={{ width: 196, paddingTop: 12, paddingBottom: 12 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.25)",
              padding: "4px 16px 8px",
              whiteSpace: "nowrap",
            }}
          >
            Navigation
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setCurrentPage(item.id); setExpanded(false); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 16px",
                  background: isActive ? "rgba(91,156,246,0.12)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                <span style={{ color: isActive ? "#5b9cf6" : "rgba(255,255,255,0.45)", flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#5b9cf6" : "rgba(255,255,255,0.75)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span
                    style={{
                      marginLeft: "auto",
                      width: 3,
                      height: 16,
                      borderRadius: 2,
                      background: "#5b9cf6",
                      flexShrink: 0,
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
