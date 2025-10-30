import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";

const CREATOR_TOPICS = [
  "Lifestyle",
  "Beauty",
  "Tech",
  "Travel",
  "Food & Drink",
  "Sports",
  "Education",
  "Comedy",
  "Music",
  "Gaming",
  "Wellness",
  "DIY",
];

const ADVERTISER_TOPICS = [
  "Fashion",
  "Beauty",
  "Tech",
  "Food & Beverage",
  "Entertainment",
  "Sports",
  "Finance",
  "Travel",
  "Automotive",
  "Health",
  "Education",
  "Gaming",
];

export function OnboardingDialog() {
  const { sessionMode } = useAuth();
  const { currentUser, completeOnboarding } = useUser();
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"creator" | "advertiser" | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (sessionMode === "auth" && !currentUser.onboardingCompleted) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [sessionMode, currentUser.onboardingCompleted]);

  useEffect(() => {
    setSelectedCategories([]);
  }, [selectedRole, open]);

  const topics = useMemo(() => {
    if (selectedRole === "creator") {
      return CREATOR_TOPICS;
    }
    if (selectedRole === "advertiser") {
      return ADVERTISER_TOPICS;
    }
    return [];
  }, [selectedRole]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((item) => item !== category);
      }
      if (prev.length >= 4) {
        toast.info("Choose up to four categories to start");
        return prev;
      }
      return [...prev, category];
    });
  };

  const handleComplete = () => {
    if (!selectedRole) {
      toast.error("Please choose how you'd like to use Tikadds");
      return;
    }
    if (selectedCategories.length === 0) {
      toast.error("Pick at least one category to tailor your experience");
      return;
    }

    completeOnboarding({ role: selectedRole, categories: selectedCategories });
    toast.success("Preferences saved! You can adjust these later in Settings.");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl space-y-6 border-border/60 bg-card/95 backdrop-blur">
        <DialogHeader className="text-left space-y-2">
          <DialogTitle className="text-2xl font-semibold">Customize your Tikadds experience</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Choose how you plan to use the platform. You can change these preferences anytime in Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 1</p>
          <div className="grid gap-3 md:grid-cols-2">
          <Button
            type="button"
            variant={selectedRole === "creator" ? "default" : "outline"}
            className={cn(selectedRole === "creator" ? "gradient-primary border-0 text-white" : "border-border/60")}
            onClick={() => setSelectedRole("creator")}
          >
              I’m a creator
            </Button>
            <Button
              type="button"
              variant={selectedRole === "advertiser" ? "default" : "outline"}
            className={cn(selectedRole === "advertiser" ? "gradient-secondary border-0 text-white" : "border-border/60")}
              onClick={() => setSelectedRole("advertiser")}
            >
              I’m an advertiser
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            You can switch between creator and advertiser modes later in Settings.
          </p>
        </div>

        {selectedRole && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Step 2. What best describes you?</p>
                <p className="text-xs text-muted-foreground">Select up to four categories.</p>
              </div>
              <Badge variant="secondary">{selectedCategories.length}/4</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => {
                const active = selectedCategories.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleCategory(topic)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-smooth",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => toast.info("Complete the steps to continue.")} disabled>
            Skip for now
          </Button>
          <Button className="gradient-primary text-white" onClick={handleComplete}>
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
