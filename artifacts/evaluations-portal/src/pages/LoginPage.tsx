import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/lib/msalConfig";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function LoginPage() {
  const { instance } = useMsal();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await instance.loginRedirect(loginRequest);
    } catch (e) {
      console.error("Login failed", e);
      setError("Sign-in failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-power.png')" }}
      />
      <div className="absolute inset-0 bg-[#182557]/80" />

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
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-white/60 mb-2">
              Sunbelt Solomon
            </p>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Evaluations
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Sign in to access your portal
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/20 border border-red-400/40 px-4 py-3 text-sm text-red-200 text-center">
              {error}
            </div>
          )}

          <Button
            onClick={handleMicrosoftLogin}
            disabled={isLoading}
            size="lg"
            className="w-full flex items-center justify-center gap-3 bg-[#0047BB] hover:bg-[#0052d4] active:bg-[#003fa3] text-white font-semibold rounded-xl py-3.5 transition-colors duration-150 focus-visible:ring-white/60"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            ) : (
              <MicrosoftIcon />
            )}
            <span>{isLoading ? "Signing in…" : "Sign in with Microsoft"}</span>
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
