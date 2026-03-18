import { useDemoContext } from "@/context/DemoContext";

export function PortalHeader() {
  const { user, setCurrentPage, isDark, toggleDark } = useDemoContext();

  return (
    <header
      className="w-full flex items-center shrink-0"
      style={{
        height: 56,
        background: "#0d1629",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 24px",
        gap: 16,
      }}
    >
      {/* Left: brand logo + portal name */}
      <div className="flex items-center gap-3">
        <img
          src="/sss-logo-white.png"
          alt="Sunbelt Solomon"
          style={{ height: 22, width: "auto", objectFit: "contain" }}
          draggable={false}
        />
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.20)", margin: "0 4px" }} />
        <span style={{ color: "#5b9cf6", fontSize: 14, fontWeight: 500 }}>EvalAI</span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right: dark mode toggle, user info, logout */}
      <div className="flex items-center gap-4">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{
            width: 32,
            height: 32,
            color: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="text-right" style={{ lineHeight: 1.2 }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{user.name}</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
              {user.role} &middot; {user.site}
            </div>
          </div>
          <div
            className="flex items-center justify-center rounded-full select-none"
            style={{
              width: 32,
              height: 32,
              background: "#182557",
              border: "1.5px solid rgba(91,156,246,0.5)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.03em",
            }}
          >
            {user.initials}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => setCurrentPage("login")}
          className="rounded-lg text-xs font-medium transition-colors"
          style={{
            color: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "6px 14px",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.35)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)";
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
