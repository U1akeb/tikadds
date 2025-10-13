import { Home, Video, Briefcase, BarChart3, MessageCircle, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", icon: Home, path: "/" },
  { name: "Upload", icon: Video, path: "/upload" },
  { name: "Job Board", icon: Briefcase, path: "/jobs" },
  { name: "Dashboard", icon: BarChart3, path: "/dashboard" },
  { name: "Messages", icon: MessageCircle, path: "/messages" },
  { name: "Profile", icon: User, path: "/profile" },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-20 border-r border-border bg-sidebar transition-smooth">
      <div className="flex h-full flex-col items-center py-8 gap-8">
        <div className="gradient-primary h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white text-xl">
          A
        </div>
        
        <nav className="flex flex-col gap-4 w-full px-3">
          {navigation.map((item) => (
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
                  <item.icon className={cn(
                    "h-6 w-6 transition-smooth",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <span className={cn(
                    "text-xs font-medium transition-smooth",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
