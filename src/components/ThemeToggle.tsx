import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MoonStar, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="relative h-10 w-10 rounded-2xl border-border/70 bg-background/60 backdrop-blur hover:border-primary"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun
        className={`absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-foreground transition-transform duration-300 ${isDark ? "scale-0 rotate-90" : "scale-100 rotate-0"}`}
      />
      <MoonStar
        className={`absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-foreground transition-transform duration-300 ${isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90"}`}
      />
    </Button>
  );
}
