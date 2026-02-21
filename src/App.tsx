import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { E2BSandboxProvider } from "./contexts/E2BSandboxContext";
import { FileSystemProvider } from "./contexts/FileSystemContext";
import { TerminalProvider } from "./contexts/TerminalContext";
import { PreviewProvider } from "./contexts/PreviewContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <E2BSandboxProvider>
      <FileSystemProvider>
        <TerminalProvider>
          <PreviewProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </PreviewProvider>
        </TerminalProvider>
      </FileSystemProvider>
    </E2BSandboxProvider>
  </QueryClientProvider>
);

export default App;
