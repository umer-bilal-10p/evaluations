import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type DemoPage = "login" | "home" | "evaluations-history";

export interface DemoPageDef {
  id: DemoPage;
  label: string;
}

export const DEMO_PAGES: DemoPageDef[] = [
  { id: "login", label: "Login" },
  { id: "home", label: "Home" },
  { id: "evaluations-history", label: "Evaluations History" },
];

const DEMO_USER = {
  name: "James Mitchell",
  initials: "JM",
  role: "Warehouse Manager",
  site: "Houston, TX",
};

const DARK_MODE_KEY = "eval-portal-dark";

interface DemoContextType {
  currentPage: DemoPage;
  setCurrentPage: (page: DemoPage) => void;
  user: typeof DEMO_USER;
  isDark: boolean;
  toggleDark: () => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<DemoPage>("login");

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(DARK_MODE_KEY);
      if (stored !== null) return stored === "true";
    } catch {}
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem(DARK_MODE_KEY, String(isDark));
    } catch {}
  }, [isDark]);

  const toggleDark = () => setIsDark((d) => !d);

  return (
    <DemoContext.Provider
      value={{ currentPage, setCurrentPage, user: DEMO_USER, isDark, toggleDark }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoContext() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemoContext must be used inside DemoProvider");
  return ctx;
}
