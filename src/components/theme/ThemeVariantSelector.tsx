import { cn } from "@/lib/utils";
import { useThemeVariant, type DarkThemeVariant } from "@/context/ThemeVariantContext";

const VARIANTS: Array<{
  id: DarkThemeVariant;
  label: string;
  description: string;
  preview: string;
}> = [
  {
    id: "aurora",
    label: "Aurora",
    description: "Vibrant magenta with electric violet accents.",
    preview: "linear-gradient(135deg, hsl(346 77% 50%), hsl(280 65% 60%))",
  },
  {
    id: "cosmic",
    label: "Cosmic",
    description: "Deep indigo paired with radiant cyan highlights.",
    preview: "linear-gradient(135deg, hsl(262 83% 62%), hsl(200 90% 55%))",
  },
  {
    id: "neon",
    label: "Neon",
    description: "Electric lime and amber accents inspired by neon lights.",
    preview: "linear-gradient(135deg, hsl(158 89% 52%), hsl(45 96% 53%))",
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Deep sapphire and aurora teal for a cinematic dark finish.",
    preview: "linear-gradient(135deg, hsl(220 85% 58%), hsl(168 78% 52%))",
  },
];

export function ThemeVariantSelector({
  className,
  onSelect,
}: {
  className?: string;
  onSelect?: (variant: DarkThemeVariant) => void;
}) {
  const { variant, setVariant } = useThemeVariant();

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {VARIANTS.map((item) => {
        const isActive = variant === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setVariant(item.id);
              onSelect?.(item.id);
            }}
            className={cn(
              "group flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 text-left transition-smooth hover:border-primary/50 hover:bg-muted/30",
              isActive && "border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
            )}
          >
            <div
              className="h-20 w-full overflow-hidden rounded-xl shadow-sm"
              style={{ backgroundImage: item.preview }}
            />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground flex items-center justify-between">
                <span>{item.label}</span>
                {isActive && <span className="text-xs uppercase text-primary">Selected</span>}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
            <span
              className={cn(
                "mt-2 inline-flex w-full items-center justify-center rounded-xl border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-smooth",
                isActive
                  ? "border-transparent bg-gradient-to-r from-primary to-accent text-white shadow-inner"
                  : "border-border/60 text-muted-foreground group-hover:text-foreground"
              )}
            >
              {isActive ? "Active" : "Use theme"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
