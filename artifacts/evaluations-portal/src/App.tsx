import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "@/lib/msalConfig";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DemoProvider, useDemoContext } from "@/context/DemoContext";
import { DemoNav } from "@/components/DemoNav";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import EvaluationsHistoryPage from "@/pages/EvaluationsHistoryPage";
import NameplatePage from "@/pages/NameplatePage";

const queryClient = new QueryClient();
const msalInstance = new PublicClientApplication(msalConfig);

function AppContent() {
  const { currentPage } = useDemoContext();

  return (
    <>
      {currentPage === "login" && <LoginPage />}
      {currentPage === "home" && <HomePage />}
      {currentPage === "evaluations-history" && <EvaluationsHistoryPage />}
      {currentPage === "nameplate" && <NameplatePage />}
      <DemoNav />
    </>
  );
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <DemoProvider>
            <AppContent />
          </DemoProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </MsalProvider>
  );
}

export default App;
