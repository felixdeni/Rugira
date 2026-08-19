import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Moon, PlusCircle, Sun, BarChart3 } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/useTheme";
import { Logo } from "@/components/Brand";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/useAuth";

export function AppShell({
  children,
  role,
  name,
}: {
  children: ReactNode;
  role: Role | null;
  name: string;
}) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(role === "employee" ? [{ to: "/record", label: "Record", icon: PlusCircle }] : []),
    { to: "/reports", label: "Reports", icon: BarChart3 },
  ];

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-dvh pb-24 sm:pb-8">
      <header className="sticky top-0 z-20 border-b border-glass-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Logo className="size-10 rounded-xl text-xl" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="font-display text-lg font-extrabold brand-text">Rwema</p>
            <p className="truncate text-xs text-muted-foreground">
              {name} · {role === "boss" ? "Boss" : "Employee"}
            </p>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-primary/15 text-primary" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" size="sm" onClick={toggle} aria-label="Toggle dark mode">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-glass-border bg-background/85 backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-md">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium text-muted-foreground",
              )}
              activeProps={{ className: "text-primary" }}
            >
              <l.icon className="size-5" />
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
