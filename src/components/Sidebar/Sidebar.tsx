import { useCallback, useMemo, type ComponentType } from "react";
import { Home, Briefcase, User, Menu, LogOut, Settings as SettingsIcon, Search as SearchIcon } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

interface NavigationItem {
  name: string;
  icon: ComponentType<{ className?: string }>;
  path: string;
  requiresAuth?: boolean;
}

function MobileNav({
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
    <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-border bg-sidebar/90 px-4 py-3 backdrop-blur md:hidden">
      <div className="gradient-primary h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white text-xl">
        A
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
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
    <aside className="hidden md:fixed md:left-0 md:top-0 md:z-40 md:flex md:h-screen md:w-[12.5vw] md:min-w-[12rem] md:max-w-xs md:flex-col md:items-center md:gap-8 md:border-r md:border-border md:bg-sidebar md:py-8">
      <div className="gradient-primary h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white text-xl">
        A
      </div>
      <ThemeToggle />

      <nav className="flex flex-col gap-4 w-full px-3">
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

      <div className="mt-auto w-full px-3">
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

  const navigation = useMemo<NavigationItem[]>(() => {
    const items: NavigationItem[] = [
      { name: "Home", icon: Home, path: "/" },
      { name: "Profile", icon: User, path: "/profile", requiresAuth: true },
      { name: "Job Board", icon: Briefcase, path: "/jobs" },
      { name: "Search", icon: SearchIcon, path: "/search" },
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
