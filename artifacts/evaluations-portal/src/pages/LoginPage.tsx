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
              className="h-5 w-auto object-contain select-none mx-auto mb-3"
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
          className={`w-full border-b-2 ${error ? "border-[#a80000]" : "border-[#666]"} focus:border-[#0067b8] outline-none py-2 text-[15px] text-[#1b1b1b] bg-transparent transition-colors placeholder:text-[#666]`}
        />
        {error && <p className="mt-1 text-xs text-[#a80000]">{error}</p>}
      </div>

      <p className="mt-4 text-[13px] text-[#1b1b1b]">
        No account?{" "}
        <span className="text-[#0067b8] cursor-pointer hover:underline">Create one!</span>
      </p>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onCancel}
          className="px-6 py-2 mr-2 text-[14px] text-[#0067b8] hover:bg-[#f2f2f2] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-[#0067b8] hover:bg-[#005fa1] text-white text-[14px] font-semibold transition-colors"
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
          className={`w-full border-b-2 ${error ? "border-[#a80000]" : "border-[#666]"} focus:border-[#0067b8] outline-none py-2 text-[15px] text-[#1b1b1b] bg-transparent transition-colors placeholder:text-[#666]`}
        />
        {error && <p className="mt-1 text-xs text-[#a80000]">{error}</p>}
      </div>

      <p className="mt-4 text-[13px] text-[#0067b8] cursor-pointer hover:underline">
        Forgot my password
      </p>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onSignIn}
          className="px-6 py-2 bg-[#0067b8] hover:bg-[#005fa1] text-white text-[14px] font-semibold transition-colors"
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 108 24"
      width="108"
      height="24"
      aria-label="Microsoft"
    >
      <path d="M0 0h11.377v11.372H0z" fill="#f25022" />
      <path d="M12.623 0H24v11.372H12.623z" fill="#7fba00" />
      <path d="M0 12.623h11.377V24H0z" fill="#00a4ef" />
      <path d="M12.623 12.623H24V24H12.623z" fill="#ffb900" />
      <path d="M37.927 5.879h-5.424v3.658h5.104v1.775h-5.104v5.685h-2.07V4.104h7.494v1.775zm2.172 10.254c0-.407.144-.752.431-1.034.287-.283.641-.424 1.062-.424.437 0 .797.141 1.08.424.283.282.424.627.424 1.034 0 .4-.141.741-.424 1.018-.283.277-.643.415-1.08.415-.421 0-.775-.138-1.062-.415a1.377 1.377 0 01-.431-1.018zm8.644-9.38c-.547 0-.996.203-1.347.608-.351.406-.556.998-.614 1.776h3.829c-.011-.778-.198-1.37-.561-1.776-.363-.405-.792-.607-1.307-.607zm.143 9.577c-1.341 0-2.407-.418-3.197-1.252-.79-.835-1.185-1.969-1.185-3.401 0-1.467.374-2.62 1.123-3.457.749-.838 1.755-1.257 3.016-1.257 1.219 0 2.177.391 2.874 1.172.697.782 1.046 1.859 1.046 3.232v.797h-5.981c.025.874.269 1.552.731 2.031.462.48 1.098.72 1.907.72.528 0 1.019-.055 1.47-.166.452-.11.94-.295 1.465-.554v1.775c-.463.228-.935.389-1.416.484-.48.094-1.04.142-1.68.142l.827-.266zm11.205-9.283c.281 0 .522.021.722.063l-.128 1.924a2.824 2.824 0 00-.637-.072c-.702 0-1.254.228-1.655.684-.401.457-.601 1.084-.601 1.882v5.464h-2.044V7.245h1.592l.272 1.688h.097c.261-.571.623-1.022 1.086-1.352.462-.33.965-.494 1.511-.494h-.215zm7.015 10.062c-.506 0-.943-.085-1.312-.256-.369-.171-.687-.454-.954-.851h-.101c.067.443.101.861.101 1.256v3.454h-2.043V7.245h1.662l.279 1.042h.101c.262-.39.583-.683.963-.882.381-.198.822-.297 1.326-.297 1.094 0 1.943.413 2.546 1.24.604.826.906 1.968.906 3.424 0 .966-.152 1.808-.456 2.526-.304.718-.737 1.27-1.298 1.655a3.377 3.377 0 01-1.946.584zm-.507-8.282c-.659 0-1.139.2-1.439.6-.3.4-.454 1.036-.463 1.908v.262c0 .983.154 1.692.463 2.126.309.434.803.651 1.481.651.572 0 1.022-.244 1.351-.731.329-.487.493-1.172.493-2.057 0-.892-.165-1.572-.494-2.041-.33-.478-.802-.718-1.393-.718zm6.95-4.823c0-.338.096-.604.287-.797.192-.193.46-.289.803-.289.332 0 .597.096.793.289.197.193.296.459.296.797 0 .326-.099.589-.296.79-.196.2-.461.3-.793.3-.343 0-.611-.1-.803-.3-.191-.201-.287-.464-.287-.79zm2.113 12.908h-2.043V7.245h2.043v9.071zm6.847.177c-1.388 0-2.449-.394-3.181-1.181-.733-.787-1.1-1.906-1.1-3.357 0-1.488.376-2.634 1.127-3.44.751-.807 1.837-1.21 3.256-1.21.966 0 1.823.189 2.572.566l-.63 1.668c-.757-.332-1.404-.498-1.942-.498-1.489 0-2.234.97-2.234 2.912 0 .943.186 1.659.558 2.147.371.488.917.732 1.636.732.815 0 1.604-.22 2.369-.659v1.835a4.394 4.394 0 01-1.136.419c-.395.044-.846.066-1.295.066zm11.249-1.952c0 .605-.236 1.068-.707 1.39-.472.321-1.144.482-2.017.482-.876 0-1.609-.137-2.197-.41v-1.835c.796.399 1.571.598 2.325.598.898 0 1.347-.273 1.347-.819a.685.685 0 00-.147-.448 1.762 1.762 0 00-.5-.367 12.84 12.84 0 00-.958-.421c-.891-.358-1.497-.721-1.82-1.088-.322-.367-.483-.843-.483-1.426 0-.546.232-.975.697-1.287.465-.312 1.1-.468 1.906-.468.79 0 1.57.175 2.34.524l-.664 1.551c-.749-.327-1.386-.49-1.912-.49-.768 0-1.152.219-1.152.659 0 .22.105.406.314.56.209.153.638.362 1.287.625.646.265 1.117.519 1.411.762.294.244.509.52.644.83.136.31.204.672.204 1.076l.085-.198z" fill="#737373" />
    </svg>
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
