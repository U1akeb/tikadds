import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type DarkThemeVariant = "aurora" | "cosmic" | "neon" | "velvet";

const THEME_VARIANT_STORAGE_KEY = "adspark-dark-variant";

interface ThemeVariantContextValue {
  variant: DarkThemeVariant;
  setVariant: (variant: DarkThemeVariant) => void;
}

const ThemeVariantContext = createContext<ThemeVariantContextValue | null>(null);

const isDarkMode = () => document.documentElement.classList.contains("dark");

function applyVariant(variant: DarkThemeVariant) {
  document.documentElement.setAttribute("data-dark-variant", variant);
}

export function ThemeVariantProvider({ children }: { children: ReactNode }) {
  const [variant, setVariantState] = useState<DarkThemeVariant>(() => {
    if (typeof window === "undefined") {
      return "aurora";
    }
    const stored = window.localStorage.getItem(THEME_VARIANT_STORAGE_KEY);
    if (stored === "cosmic" || stored === "neon" || stored === "velvet") {
      return stored;
    }
    return "aurora";
  });

  useEffect(() => {
    applyVariant(variant);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_VARIANT_STORAGE_KEY, variant);
    }
  }, [variant]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const observer = new MutationObserver(() => {
      if (isDarkMode()) {
        applyVariant(variant);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [variant]);

  const handleSetVariant = useCallback((next: DarkThemeVariant) => {
    setVariantState(next);
  }, []);

  const value = useMemo<ThemeVariantContextValue>(
    () => ({
      variant,
      setVariant: handleSetVariant,
    }),
    [variant, handleSetVariant],
  );

  return <ThemeVariantContext.Provider value={value}>{children}</ThemeVariantContext.Provider>;
}

export function useThemeVariant() {
  const context = useContext(ThemeVariantContext);
  if (!context) {
    throw new Error("useThemeVariant must be used within a ThemeVariantProvider");
  }
  return context;
}
