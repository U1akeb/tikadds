import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { LogIn, Play, Sparkles, UserPlus } from "lucide-react";

const SUPPRESSED_ROUTES = new Set(["/login", "/register"]);

export function SessionGate() {
  const { sessionMode, continueAsGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  const isSuppressed = SUPPRESSED_ROUTES.has(location.pathname);
  const shouldShow = sessionMode === "none" && !dismissed && !isSuppressed;

  useEffect(() => {
    if (sessionMode !== "none") {
      setDismissed(true);
    }
  }, [sessionMode]);

  const handleNavigate = (path: string) => {
    setDismissed(true);
    navigate(path);
  };

  const handleGuest = () => {
    setDismissed(true);
    continueAsGuest();
  };

  return (
    <Dialog open={shouldShow} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg border-border/70 bg-card/95 backdrop-blur-sm">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="flex items-center gap-2 text-2xl font-semibold">
            <Sparkles className="h-6 w-6 text-primary" />
            Welcome to AdvidTok
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Sign in to follow creators, save favorites, and publish your own reels. You can also explore the feed as a guest.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button className="w-full gradient-primary text-white" onClick={() => handleNavigate("/login")}>
            <LogIn className="mr-2 h-4 w-4" />
            Log in
          </Button>
          <Button
            variant="outline"
            className="w-full border-primary text-primary"
            onClick={() => handleNavigate("/register")}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create a free account
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={handleGuest}
          >
            <Play className="mr-2 h-4 w-4" />
            Continue as guest
          </Button>
        </div>

        <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">
          Signing up lets you unlock personalized recommendations, follow creators, and apply for brand briefs.
        </div>
      </DialogContent>
    </Dialog>
  );
}
