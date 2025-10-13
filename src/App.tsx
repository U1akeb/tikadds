import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import JobBoard from "./pages/JobBoard";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import CreateJob from "./pages/CreateJob";
import NotFound from "./pages/NotFound";
import { UserProvider } from "./context/UserContext";
import { JobProvider } from "./context/JobContext";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <AuthProvider>
        <JobProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/jobs" element={<JobBoard />} />
                <Route path="/create-job" element={<CreateJob />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </JobProvider>
      </AuthProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
