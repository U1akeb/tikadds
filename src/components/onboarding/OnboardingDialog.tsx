import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { ThemeVariantSelector } from "@/components/theme/ThemeVariantSelector";
import { useThemeVariant } from "@/context/ThemeVariantContext";

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
  const { variant } = useThemeVariant();
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"creator" | "advertiser" | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (sessionMode === "auth" && !currentUser.onboardingCompleted) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [sessionMode, currentUser.onboardingCompleted]);

  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedRole(null);
      setSelectedCategories([]);
    }
  }, [open]);

  useEffect(() => {
    setSelectedCategories([]);
  }, [selectedRole]);

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

  const handleNext = () => {
    if (step === 1) {
      if (!selectedRole) {
        toast.error("Select how you want to start");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (selectedCategories.length === 0) {
        toast.error("Pick at least one category to continue");
        return;
      }
      setStep(3);
      return;
    }
    handleComplete();
  };

  const handleBack = () => {
    if (step === 1) {
      return;
    }
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl space-y-6 border-border/60 bg-card/95 backdrop-blur">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold">Customize your Tikadds experience</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Answer a few quick questions so we can tailor your home feed.
              </DialogDescription>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Step {step} of 3
            </span>
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">How do you want to start?</p>
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
        )}

        {step === 2 && selectedRole && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">What best describes you?</p>
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

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold">Choose your dark-mode vibe</p>
              <p className="text-xs text-muted-foreground">
                This palette appears whenever you switch to dark mode. You can change it later under Settings.
              </p>
            </div>
            <ThemeVariantSelector />
            <p className="text-xs text-muted-foreground">
              Currently selected: <span className="font-semibold capitalize text-foreground">{variant}</span>
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            Back
          </Button>
          <Button className="gradient-primary text-white" onClick={handleNext}>
            {step === 3 ? "Finish" : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
