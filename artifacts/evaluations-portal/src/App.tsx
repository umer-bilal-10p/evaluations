import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "@/lib/msalConfig";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DemoProvider, useDemoContext } from "@/context/DemoContext";
import { DemoNav } from "@/components/DemoNav";
import LoginPage from "@/pages/LoginPage";
import EvaluationsHistoryPage from "@/pages/EvaluationsHistoryPage";

const queryClient = new QueryClient();
const msalInstance = new PublicClientApplication(msalConfig);

function AppContent() {
  const { currentPage } = useDemoContext();

  return (
    <>
      {currentPage === "login" && <LoginPage />}
      {currentPage === "evaluations-history" && <EvaluationsHistoryPage />}
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
