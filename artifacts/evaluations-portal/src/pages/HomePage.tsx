import { PortalHeader } from "@/components/PortalHeader";
import { Sidebar } from "@/components/Sidebar";
import { useDemoContext } from "@/context/DemoContext";

export default function HomePage() {
  const { user, setCurrentPage } = useDemoContext();

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}
    >
      <PortalHeader />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-auto p-8 lg:p-12">
          <div style={{ maxWidth: 720 }}>

            {/* Welcome block */}
            <div className="mb-10">
              <h1
                className="text-3xl font-bold tracking-tight mb-2"
                style={{ color: "hsl(var(--foreground))" }}
              >
                Welcome back, {user.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    background: "rgba(91,156,246,0.10)",
                    color: "#5b9cf6",
                    border: "1px solid rgba(91,156,246,0.2)",
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {user.role}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    background: "hsl(var(--muted))",
                    color: "hsl(var(--muted-foreground))",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {user.site}
                </span>
              </div>
            </div>

            {/* Under construction card */}
            <div
              className="rounded-2xl p-8 mb-8"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-start gap-5">
                {/* Icon */}
                <div
                  className="rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 52,
                    height: 52,
                    background: "rgba(251,191,36,0.10)",
                    border: "1px solid rgba(251,191,36,0.20)",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" />
                    <path d="m7 16.5-4.74-2.85" />
                    <path d="m7 16.5 5-3" />
                    <path d="M7 16.5v5.17" />
                    <path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" />
                    <path d="m17 16.5-5-3" />
                    <path d="m17 16.5 4.74-2.85" />
                    <path d="M17 16.5v5.17" />
                    <path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" />
                    <path d="M12 8 7.26 5.15" />
                    <path d="m12 8 4.74-2.85" />
                    <path d="M12 13.5V8" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <h2
                    className="text-lg font-semibold mb-1"
                    style={{ color: "hsl(var(--foreground))" }}
                  >
                    Portal Under Construction
                  </h2>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    We're actively building the Sunbelt Solomon Evaluations portal. More features
                    and tools will be rolling out over the coming weeks. Thank you for your patience.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick link to Evaluation History */}
            <div
              className="rounded-2xl p-6 flex items-center justify-between gap-4"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div>
                <p
                  className="text-sm font-medium mb-0.5"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  Evaluation History
                </p>
                <p
                  className="text-xs"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Review transformer units received for evaluation
                </p>
              </div>
              <button
                onClick={() => setCurrentPage("evaluations-history")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 9,
                  border: "none",
                  background: "#182557",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#1e2f6b"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#182557"; }}
              >
                Open
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
