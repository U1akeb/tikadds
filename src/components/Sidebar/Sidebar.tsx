import { useMemo, type ComponentType } from "react";
import { Home, Briefcase, User, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface NavigationItem {
  name: string;
  icon: ComponentType<{ className?: string }>;
  path: string;
}

function MobileNav({ items }: { items: NavigationItem[] }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-border bg-sidebar/90 px-4 py-3 backdrop-blur md:hidden">
      <div className="gradient-primary h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white text-xl">
        A
      </div>
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
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DesktopNav({ items }: { items: NavigationItem[] }) {
  return (
    <aside className="hidden md:fixed md:left-0 md:top-0 md:z-40 md:flex md:h-screen md:w-24 md:flex-col md:items-center md:gap-8 md:border-r md:border-border md:bg-sidebar md:py-8">
      <div className="gradient-primary h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white text-xl">
        A
      </div>

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
    </aside>
  );
}

export function Sidebar() {
  const { isContentRequester } = useUser();

  const navigation = useMemo<NavigationItem[]>(() => {
    const items: NavigationItem[] = [
      { name: "Home", icon: Home, path: "/" },
      { name: "Profile", icon: User, path: "/profile" },
      { name: "Job Board", icon: Briefcase, path: "/jobs" },
    ];

    return items;
  }, []);

  return (
    <>
      <MobileNav items={navigation} />
      <DesktopNav items={navigation} />
      <div className="h-16 md:hidden" />
    </>
  );
}
