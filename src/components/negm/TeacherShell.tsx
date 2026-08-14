import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Boxes,
  CalendarCheck,
  Wallet,
  FileQuestion,
  BookOpen,
  MessagesSquare,
  Bell,
  Settings,
  DatabaseBackup,
  Crown,
  LogOut,
  Moon,
  Sun,
  Menu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccess, toggleTheme } from "@/hooks/useNegm";
import { Logo, PoweredBy } from "@/components/negm/Logo";
import { LoadingState } from "@/components/negm/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { LICENSE_STATUS_LABEL } from "@/lib/negm";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/students", label: "الطلاب", icon: Users },
  { to: "/groups", label: "المجموعات", icon: Boxes },
  { to: "/attendance", label: "الحضور والغياب", icon: CalendarCheck },
  { to: "/payments", label: "المدفوعات", icon: Wallet },
  { to: "/exams", label: "الاختبارات", icon: FileQuestion },
  { to: "/homework", label: "الواجبات", icon: BookOpen },
  { to: "/questions", label: "أسئلة الطلاب", icon: MessagesSquare },
  { to: "/notifications", label: "الإشعارات", icon: Bell },
  { to: "/backup", label: "النسخ الاحتياطي", icon: DatabaseBackup },
  { to: "/settings", label: "الإعدادات", icon: Settings },
] as const;

function TrialCountdown({ endsAt }: { endsAt: string }) {
  const [left, setLeft] = useState(() => new Date(endsAt).getTime() - Date.now());
  const navigate = useNavigate();
  useEffect(() => {
    const id = setInterval(() => {
      const ms = new Date(endsAt).getTime() - Date.now();
      setLeft(ms);
      if (ms <= 0) navigate({ to: "/trial-ended" });
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt, navigate]);
  const total = Math.max(0, Math.floor(left / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return (
    <div className="flex items-center gap-2 rounded-lg bg-warning/15 px-3 py-1.5 text-xs font-semibold text-warning-foreground">
      التجربة المجانية: {m}:{s}
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data } = useAccess();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            pathname === item.to && "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
      {data?.isSuperAdmin ? (
        <Link
          to="/admin"
          onClick={onNavigate}
          className={cn(
            "mt-2 flex items-center gap-3 rounded-lg bg-sidebar-primary/15 px-3 py-2 text-sm font-semibold text-sidebar-primary",
            pathname === "/admin" && "bg-sidebar-primary/25",
          )}
        >
          <Crown className="size-4" />
          لوحة مالك المنصة
        </Link>
      ) : null}
    </nav>
  );
}

export function TeacherShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { data, isLoading } = useAccess();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (!isLoading && data && !data.hasAccess) navigate({ to: "/trial-ended" });
  }, [isLoading, data, navigate]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between bg-sidebar p-4 lg:flex">
        <div>
          <Logo subtitle={data?.teacher?.center_name ?? ""} className="mb-6 px-1 text-sidebar-foreground" />
          <NavLinks />
        </div>
        <div className="space-y-3">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground" onClick={signOut}>
            <LogOut className="size-4" /> تسجيل الخروج
          </Button>
          <PoweredBy className="text-sidebar-foreground/60" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-card/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-sidebar p-4">
                <SheetTitle className="sr-only">القائمة</SheetTitle>
                <Logo subtitle={data?.teacher?.center_name ?? ""} className="mb-6 text-sidebar-foreground" />
                <NavLinks onNavigate={() => setOpen(false)} />
                <Button variant="ghost" className="mt-4 w-full justify-start text-sidebar-foreground" onClick={signOut}>
                  <LogOut className="size-4" /> تسجيل الخروج
                </Button>
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-lg font-bold">{title}</h1>
              {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data?.licenseStatus === "trial" && data?.trialEndsAt ? (
              <TrialCountdown endsAt={data.trialEndsAt} />
            ) : (
              <Badge variant="secondary">
                {LICENSE_STATUS_LABEL[data?.licenseStatus ?? "pending"]}
              </Badge>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                toggleTheme();
                setDark((d) => !d);
              }}
              aria-label="تبديل المظهر"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            {actions}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
