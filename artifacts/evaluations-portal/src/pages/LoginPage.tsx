import { useState } from "react";
import { useDemoContext } from "@/context/DemoContext";

type SsoStep = "idle" | "email" | "password" | "signing-in" | "done";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function isValidEmail(v: string): boolean { return EMAIL_REGEX.test(v.trim()); }

export default function LoginPage() {
  const { isDark, toggleDark } = useDemoContext();
  const [ssoStep, setSsoStep]   = useState<SsoStep>("idle");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError]       = useState("");
  const [passwordError, setPasswordError] = useState("");

  const openSso  = () => { setSsoStep("email"); setEmailError(""); setPasswordError(""); };
  const closeSso = () => { setSsoStep("idle"); setEmail(""); setPassword(""); setEmailError(""); setPasswordError(""); };

  const handleEmailNext = () => {
    if (!email.trim())        { setEmailError("Enter your email address."); return; }
    if (!isValidEmail(email)) { setEmailError("That doesn't look right — enter a valid email (e.g. name@company.com)."); return; }
    setEmailError(""); setSsoStep("password");
  };
  const handlePasswordSignIn = () => {
    if (!password) { setPasswordError("Enter your password."); return; }
    setPasswordError(""); setSsoStep("signing-in");
    setTimeout(() => setSsoStep("done"), 2200);
  };
  const handleKeyEmail    = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") handleEmailNext(); };
  const handleKeyPassword = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") handlePasswordSignIn(); };

  /* ── Mode-specific tokens ──────────────────────────────────────────────── */
  const FOOTER_COLOR = "rgba(255,255,255,0.40)";
  const card = isDark
    ? { bg: "rgba(255,255,255,0.10)", border: "rgba(255,255,255,0.20)", titleColor: "#ffffff", subtitleColor: "rgba(255,255,255,0.60)", footerColor: FOOTER_COLOR, logoSrc: "/sss-mark-white.png", backdropFilter: "blur(14px)" }
    : { bg: "rgba(255,255,255,0.88)", border: "rgba(255,255,255,0.60)", titleColor: "#0f172a",  subtitleColor: "rgba(15,23,42,0.55)",     footerColor: FOOTER_COLOR, logoSrc: "/sss-mark-black.png", backdropFilter: "blur(14px)" };

  const toggleBtnStyle: React.CSSProperties = isDark
    ? { border: "1px solid rgba(255,255,255,0.20)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.70)" }
    : { border: "1px solid rgba(0,0,0,0.18)",       background: "rgba(255,255,255,0.70)", color: "rgba(15,23,42,0.70)" };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Shared background photo */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/bg-power.png')" }} />

      {/* Mode toggle */}
      <button
        onClick={toggleDark}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        style={{ position: "absolute", top: 20, right: 20, zIndex: 20, width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)", transition: "background 0.15s", ...toggleBtnStyle }}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Card */}
      <div className="relative z-10 flex flex-col items-center w-full px-4">
        <div
          className="w-full max-w-sm rounded-2xl px-8 py-10 shadow-2xl"
          style={{ background: card.bg, border: `1px solid ${card.border}`, backdropFilter: card.backdropFilter }}
        >
          {/* Logo + title */}
          <div className="mb-8 text-center">
            <img
              src={card.logoSrc}
              alt="Sunbelt Solomon"
              style={{ height: 56, width: "auto", objectFit: "contain", display: "block", margin: "0 auto 16px" }}
              draggable={false}
            />
            <h1 style={{ fontSize: 30, fontWeight: 700, color: card.titleColor, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
              Evaluations
            </h1>
            <p style={{ marginTop: 8, fontSize: 14, color: card.subtitleColor }}>
              Sign in to access your portal
            </p>
          </div>

          {/* SSO button */}
          <button
            onClick={openSso}
            style={{ width: "100%", height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#182557", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#1e2f6b"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#182557"; }}
          >
            <MicrosoftIcon />
            Sign in with Microsoft
          </button>

          {/* Disclaimer */}
          <p style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: card.subtitleColor, lineHeight: 1.6 }}>
            Access is restricted to Sunbelt Solomon employees.<br />
            Contact your administrator if you need access.
          </p>
        </div>

        <p style={{ position: "relative", zIndex: 10, marginTop: 28, fontSize: 12, color: card.footerColor, textAlign: "center" }}>
          &copy; {new Date().getFullYear()} Sunbelt Solomon. All rights reserved.
        </p>
      </div>

      {/* SSO modal */}
      {ssoStep !== "idle" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && ssoStep !== "signing-in") closeSso(); }}
        >
          <div className="relative bg-white w-full max-w-[440px] mx-4 rounded-sm shadow-2xl overflow-hidden">
            {ssoStep === "email"      && <MsEmailStep    email={email} setEmail={setEmail} error={emailError} onNext={handleEmailNext} onKeyDown={handleKeyEmail} onCancel={closeSso} />}
            {ssoStep === "password"   && <MsPasswordStep email={email} password={password} setPassword={setPassword} error={passwordError} onSignIn={handlePasswordSignIn} onKeyDown={handleKeyPassword} onBack={() => setSsoStep("email")} />}
            {ssoStep === "signing-in" && <MsSigningInStep />}
            {ssoStep === "done"       && <MsDoneStep />}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── SSO modal steps ──────────────────────────────────────────────────────── */

function MsEmailStep({ email, setEmail, error, onNext, onKeyDown, onCancel }: { email: string; setEmail: (v: string) => void; error: string; onNext: () => void; onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void; onCancel: () => void }) {
  return (
    <div className="p-8">
      <MsLogoHeader />
      <h1 className="mt-4 text-[1.4rem] font-semibold text-[#1b1b1b] leading-tight">Sign in</h1>
      <div className="mt-6">
        <input autoFocus type="email" placeholder="Email, phone, or Skype" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKeyDown}
          className={`w-full border-b-2 ${error ? "border-[#a80000]" : "border-[#666]"} focus:border-[#182557] outline-none py-2 text-[15px] text-[#1b1b1b] bg-transparent transition-colors placeholder:text-[#666]`} />
        {error && (
          <div className="mt-2 flex items-start gap-1.5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-px">
              <circle cx="8" cy="8" r="7.5" stroke="#a80000" />
              <path d="M8 4.5v4" stroke="#a80000" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11" r="0.75" fill="#a80000" />
            </svg>
            <p className="text-xs text-[#a80000] leading-snug">{error}</p>
          </div>
        )}
      </div>
      <p className="mt-4 text-[13px] text-[#1b1b1b]">No account?{" "}<span className="text-[#182557] cursor-pointer hover:underline">Create one!</span></p>
      <div className="mt-8 flex justify-end">
        <button onClick={onCancel} className="px-6 py-2 mr-2 text-[14px] text-[#182557] hover:bg-[#f2f2f2] transition-colors">Cancel</button>
        <button onClick={onNext}   className="px-6 py-2 bg-[#182557] hover:bg-[#1e2f6b] text-white text-[14px] font-semibold transition-colors">Next</button>
      </div>
    </div>
  );
}

function MsPasswordStep({ email, password, setPassword, error, onSignIn, onKeyDown, onBack }: { email: string; password: string; setPassword: (v: string) => void; error: string; onSignIn: () => void; onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void; onBack: () => void }) {
  return (
    <div className="p-8">
      <MsLogoHeader />
      <button onClick={onBack} className="mt-4 flex items-center gap-1 text-[13px] text-[#0067b8] hover:underline">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M7 1L3 5L7 9" stroke="#0067b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {email}
      </button>
      <h1 className="mt-3 text-[1.4rem] font-semibold text-[#1b1b1b] leading-tight">Enter password</h1>
      <div className="mt-6">
        <input autoFocus type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKeyDown}
          className={`w-full border-b-2 ${error ? "border-[#a80000]" : "border-[#666]"} focus:border-[#182557] outline-none py-2 text-[15px] text-[#1b1b1b] bg-transparent transition-colors placeholder:text-[#666]`} />
        {error && (
          <div className="mt-2 flex items-start gap-1.5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-px">
              <circle cx="8" cy="8" r="7.5" stroke="#a80000" />
              <path d="M8 4.5v4" stroke="#a80000" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11" r="0.75" fill="#a80000" />
            </svg>
            <p className="text-xs text-[#a80000] leading-snug">{error}</p>
          </div>
        )}
      </div>
      <p className="mt-4 text-[13px] text-[#182557] cursor-pointer hover:underline">Forgot my password</p>
      <div className="mt-8 flex justify-end">
        <button onClick={onSignIn} className="px-6 py-2 bg-[#182557] hover:bg-[#1e2f6b] text-white text-[14px] font-semibold transition-colors">Sign in</button>
      </div>
    </div>
  );
}

function MsSigningInStep() {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[260px]">
      <MsLogoHeader />
      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-[#0067b8] border-t-transparent rounded-full animate-spin" />
        <p className="text-[15px] text-[#1b1b1b] font-medium">Signing you in…</p>
        <p className="text-[13px] text-[#666]">Stay signed in to reduce sign-in prompts.</p>
      </div>
    </div>
  );
}

function MsDoneStep() {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[260px]">
      <MsLogoHeader />
      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#107c10] flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M4 11L9 16L18 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-[15px] text-[#1b1b1b] font-semibold">Signed in successfully</p>
        <p className="text-[13px] text-[#666] text-center">Redirecting you to the Evaluations portal…</p>
      </div>
    </div>
  );
}

function MsLogoHeader() {
  return (
    <div className="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" width="21" height="21">
        <rect x="0" y="0" width="10" height="10" fill="#f25022" />
        <rect x="11" y="0" width="10" height="10" fill="#7fba00" />
        <rect x="0" y="11" width="10" height="10" fill="#00a4ef" />
        <rect x="11" y="11" width="10" height="10" fill="#ffb900" />
      </svg>
      <span style={{ fontFamily: "'Segoe UI', sans-serif", fontSize: 18, fontWeight: 300, color: "#737373", letterSpacing: "-0.01em" }}>Microsoft</span>
    </div>
  );
}

function MicrosoftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" width="20" height="20">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#00a4ef" />
      <rect x="1" y="11" width="9" height="9" fill="#00b04f" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
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
