import { useCallback, useMemo, useState, useEffect, type ComponentType, type FormEvent } from "react";
import { Home, Briefcase, User, Menu, LogOut, Settings as SettingsIcon, Search as SearchIcon } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/context/SearchContext";
import { useTheme } from "next-themes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ThemeVariantSelector } from "@/components/theme/ThemeVariantSelector";
import { useUser } from "@/context/UserContext";

interface NavigationItem {
  name: string;
  icon: ComponentType<{ className?: string }>;
  path: string;
  requiresAuth?: boolean;
}

function ThemeVariantLauncher({ className }: { className?: string }) {
  const { currentUser } = useUser();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  const initial = currentUser?.name?.charAt(0)?.toUpperCase() ?? "A";
  const isDark = theme === "dark";

  useEffect(() => {
    if (!isDark && open) {
      setOpen(false);
    }
  }, [isDark, open]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next && !isDark) {
          return;
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-lg font-bold text-white shadow-sm transition-smooth",
            !isDark && "cursor-default opacity-90",
            className,
          )}
          aria-label={isDark ? "Choose dark mode theme" : undefined}
        >
          {initial}
        </button>
      </PopoverTrigger>
      {isDark && (
        <PopoverContent className="w-[20rem] space-y-4 border-border/70 bg-popover/95 backdrop-blur">
          <div>
            <p className="text-sm font-semibold">Dark mode themes</p>
            <p className="text-xs text-muted-foreground">Pick the palette that matches your vibe.</p>
          </div>
          <ThemeVariantSelector />
        </PopoverContent>
      )}
    </Popover>
  );
}

function MobileNav({
  items,
  onLogout,
  isAuthenticated,
  onNav,
  currentPath,
}: {
  items: NavigationItem[];
  onLogout: () => void;
  isAuthenticated: boolean;
  onNav: (item: NavigationItem) => boolean;
  currentPath: string;
}) {
  const { input, setInput, submit } = useSearch();
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = input.trim();
    if (!next) {
      submit("");
      navigate("/search");
      return;
    }
    submit(next);
    navigate(`/search?q=${encodeURIComponent(next)}`);
  };

  const shouldShowSearch = currentPath === "/" || currentPath === "/jobs" || currentPath === "/search";

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-border bg-sidebar/90 px-4 py-3 backdrop-blur md:hidden">
      <ThemeVariantLauncher />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {shouldShowSearch && (
          <form onSubmit={handleSubmit} className="flex items-center">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={input}
                onChange={(event) => {
                  const value = event.target.value;
                  setInput(value);
                }}
                placeholder="Search"
                className="w-36 rounded-full bg-background/80 pl-9 pr-10 text-sm shadow-sm backdrop-blur"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <SearchIcon className="h-3 w-3" />
              </button>
            </div>
          </form>
        )}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border px-4 py-4 text-left">
              <SheetTitle className="text-lg font-semibold">Navigation</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-3">
              {items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-smooth",
                      "hover:bg-sidebar-accent",
                      isActive ? "bg-sidebar-accent text-primary" : "text-muted-foreground"
                    )
                  }
                  onClick={(event) => {
                    if (!onNav(item)) {
                      event.preventDefault();
                    }
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-border p-3">
              {isAuthenticated ? (
                <Button variant="outline" className="w-full" onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </Button>
              ) : (
                <Button asChild className="w-full gradient-primary text-white">
                  <NavLink to="/login">Sign in</NavLink>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

function DesktopNav({
  items,
  onLogout,
  isAuthenticated,
  onNav,
}: {
  items: NavigationItem[];
  onLogout: () => void;
  isAuthenticated: boolean;
  onNav: (item: NavigationItem) => boolean;
}) {
  return (
    <aside className="hidden md:fixed md:left-0 md:top-0 md:z-40 md:flex md:h-screen md:w-[12.5vw] md:min-w-[12rem] md:max-w-xs md:flex-col md:border-r md:border-border md:bg-sidebar md:px-4 md:py-10">
      <div className="flex flex-col items-center gap-4">
        <ThemeVariantLauncher />
        <ThemeToggle />
      </div>

      <nav className="mt-10 flex w-full flex-1 flex-col justify-center gap-4 px-1">
        {items.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl transition-smooth group",
                "hover:bg-sidebar-accent",
                isActive && "bg-sidebar-accent text-primary"
              )
            }
            onClick={(event) => {
              if (!onNav(item)) {
                event.preventDefault();
              }
            }}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    "h-6 w-6 transition-smooth",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium transition-smooth",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto w-full px-1">
        {isAuthenticated ? (
          <Button variant="outline" className="w-full" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </Button>
        ) : (
          <Button asChild className="w-full gradient-primary text-white">
            <NavLink to="/login">Sign in</NavLink>
          </Button>
        )}
      </div>
    </aside>
  );
}

export function Sidebar() {
  const { authUser, logout, sessionMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = useMemo<NavigationItem[]>(() => {
    const items: NavigationItem[] = [
      { name: "Home", icon: Home, path: "/" },
      { name: "Profile", icon: User, path: "/profile", requiresAuth: true },
      { name: "Job Board", icon: Briefcase, path: "/jobs" },
      { name: "Settings", icon: SettingsIcon, path: "/settings", requiresAuth: true },
    ];

    return items;
  }, []);

  const handleNav = useCallback(
    (item: NavigationItem) => {
      if (item.requiresAuth && sessionMode === "guest") {
        toast.info("Sign in to access your profile");
        navigate("/login");
        return false;
      }
      return true;
    },
    [navigate, sessionMode],
  );

  return (
    <>
      <MobileNav
        items={navigation}
        isAuthenticated={Boolean(authUser)}
        onLogout={() => {
          logout();
          navigate("/login");
        }}
        onNav={handleNav}
        currentPath={location.pathname}
      />
      <DesktopNav
        items={navigation}
        isAuthenticated={Boolean(authUser)}
        onLogout={() => {
          logout();
          navigate("/login");
        }}
        onNav={handleNav}
      />
      <div className="h-16 md:hidden" />
    </>
  );
}
