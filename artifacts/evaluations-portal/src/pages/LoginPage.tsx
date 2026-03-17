import { useState } from "react";
import { Button } from "@/components/ui/button";

type SsoStep = "idle" | "email" | "password" | "signing-in" | "done";

export default function LoginPage() {
  const [ssoStep, setSsoStep] = useState<SsoStep>("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const openSso = () => {
    setSsoStep("email");
    setEmailError("");
    setPasswordError("");
  };

  const closeSso = () => {
    setSsoStep("idle");
    setEmail("");
    setPassword("");
    setEmailError("");
    setPasswordError("");
  };

  const handleEmailNext = () => {
    if (!email.trim() || !email.includes("@")) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError("");
    setSsoStep("password");
  };

  const handlePasswordSignIn = () => {
    if (!password) {
      setPasswordError("Enter your password.");
      return;
    }
    setPasswordError("");
    setSsoStep("signing-in");
    setTimeout(() => setSsoStep("done"), 2200);
  };

  const handleKeyEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleEmailNext();
  };

  const handleKeyPassword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handlePasswordSignIn();
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-power.png')" }}
      />

      <div className="relative z-10 flex flex-col items-center w-full px-4">
        <div className="mb-10 flex flex-col items-center">
          <img
            src="/logo-white.png"
            alt="Sunbelt Solomon"
            className="h-28 w-auto object-contain select-none"
            draggable={false}
          />
        </div>

        <div className="w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl px-8 py-10">
          <div className="mb-8 text-center">
            <img
              src="/wordmark-white.png"
              alt="Sunbelt Solomon"
              className="h-3.5 w-auto object-contain select-none mx-auto mb-2"
              draggable={false}
            />
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Evaluations
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Sign in to access your portal
            </p>
          </div>

          <Button
            onClick={openSso}
            size="lg"
            className="w-full flex items-center justify-center gap-3 bg-[#0047BB] hover:bg-[#0052d4] active:bg-[#003fa3] text-white font-semibold rounded-xl border-0 shadow-none outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <MicrosoftIcon />
            <span>Sign in with Microsoft</span>
          </Button>

          <p className="mt-6 text-center text-xs text-white/40">
            Access is restricted to Sunbelt Solomon employees.
            <br />
            Contact your administrator if you need access.
          </p>
        </div>

        <p className="relative z-10 mt-8 text-xs text-white/30 text-center">
          &copy; {new Date().getFullYear()} Sunbelt Solomon. All rights reserved.
        </p>
      </div>

      {ssoStep !== "idle" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && ssoStep !== "signing-in") closeSso();
          }}
        >
          <div className="relative bg-white w-full max-w-[440px] mx-4 rounded-sm shadow-2xl overflow-hidden">
            {ssoStep === "email" && (
              <MsEmailStep
                email={email}
                setEmail={setEmail}
                error={emailError}
                onNext={handleEmailNext}
                onKeyDown={handleKeyEmail}
                onCancel={closeSso}
              />
            )}
            {ssoStep === "password" && (
              <MsPasswordStep
                email={email}
                password={password}
                setPassword={setPassword}
                error={passwordError}
                onSignIn={handlePasswordSignIn}
                onKeyDown={handleKeyPassword}
                onBack={() => setSsoStep("email")}
              />
            )}
            {ssoStep === "signing-in" && <MsSigningInStep />}
            {ssoStep === "done" && <MsDoneStep />}
          </div>
        </div>
      )}
    </div>
  );
}

function MsEmailStep({
  email,
  setEmail,
  error,
  onNext,
  onKeyDown,
  onCancel,
}: {
  email: string;
  setEmail: (v: string) => void;
  error: string;
  onNext: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onCancel: () => void;
}) {
  return (
    <div className="p-8">
      <MsLogoHeader />
      <h1 className="mt-4 text-[1.4rem] font-semibold text-[#1b1b1b] leading-tight">Sign in</h1>

      <div className="mt-6">
        <input
          autoFocus
          type="email"
          placeholder="Email, phone, or Skype"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={onKeyDown}
          className={`w-full border-b-2 ${error ? "border-[#a80000]" : "border-[#666]"} focus:border-[#182557] outline-none py-2 text-[15px] text-[#1b1b1b] bg-transparent transition-colors placeholder:text-[#666]`}
        />
        {error && <p className="mt-1 text-xs text-[#a80000]">{error}</p>}
      </div>

      <p className="mt-4 text-[13px] text-[#1b1b1b]">
        No account?{" "}
        <span className="text-[#182557] cursor-pointer hover:underline">Create one!</span>
      </p>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onCancel}
          className="px-6 py-2 mr-2 text-[14px] text-[#182557] hover:bg-[#f2f2f2] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-[#182557] hover:bg-[#1e2f6b] text-white text-[14px] font-semibold transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function MsPasswordStep({
  email,
  password,
  setPassword,
  error,
  onSignIn,
  onKeyDown,
  onBack,
}: {
  email: string;
  password: string;
  setPassword: (v: string) => void;
  error: string;
  onSignIn: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBack: () => void;
}) {
  return (
    <div className="p-8">
      <MsLogoHeader />
      <button
        onClick={onBack}
        className="mt-4 flex items-center gap-1 text-[13px] text-[#0067b8] hover:underline"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M7 1L3 5L7 9" stroke="#0067b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {email}
      </button>

      <h1 className="mt-3 text-[1.4rem] font-semibold text-[#1b1b1b] leading-tight">Enter password</h1>

      <div className="mt-6">
        <input
          autoFocus
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
          className={`w-full border-b-2 ${error ? "border-[#a80000]" : "border-[#666]"} focus:border-[#182557] outline-none py-2 text-[15px] text-[#1b1b1b] bg-transparent transition-colors placeholder:text-[#666]`}
        />
        {error && <p className="mt-1 text-xs text-[#a80000]">{error}</p>}
      </div>

      <p className="mt-4 text-[13px] text-[#182557] cursor-pointer hover:underline">
        Forgot my password
      </p>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onSignIn}
          className="px-6 py-2 bg-[#182557] hover:bg-[#1e2f6b] text-white text-[14px] font-semibold transition-colors"
        >
          Sign in
        </button>
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
    <div className="flex items-center gap-2" aria-label="Microsoft">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 21 21"
        width="21"
        height="21"
        aria-hidden="true"
      >
        <rect x="0" y="0" width="10" height="10" fill="#f25022" />
        <rect x="11" y="0" width="10" height="10" fill="#7fba00" />
        <rect x="0" y="11" width="10" height="10" fill="#00a4ef" />
        <rect x="11" y="11" width="10" height="10" fill="#ffb900" />
      </svg>
      <span
        style={{ fontFamily: "'Segoe UI', sans-serif", fontSize: "18px", fontWeight: 300, color: "#737373", letterSpacing: "-0.01em" }}
      >
        Microsoft
      </span>
    </div>
  );
}

function MicrosoftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 21 21"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#00a4ef" />
      <rect x="1" y="11" width="9" height="9" fill="#00b04f" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}
