import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import SetupSession from "./pages/SetupSession";
import SessionDemo from "./pages/SessionDemo";
import KnowledgeLibrary from "./pages/KnowledgeLibrary";
import EmailToMeeting from "./pages/EmailToMeeting";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Set dark mode by default to match Supabase theme
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/setup-session" element={<SetupSession />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/session/demo" element={<SessionDemo />} />
            <Route path="/knowledge-library" element={<KnowledgeLibrary />} />
            <Route path="/email-to-meeting" element={<EmailToMeeting />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;