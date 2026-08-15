import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  UserCheck,
  Boxes,
  CalendarCheck,
  FileQuestion,
  BookOpen,
  MessagesSquare,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/negm/states";
import { egp, WEEK_DAYS } from "@/lib/negm";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة المعلم | منصة نجم" },
      { name: "description", content: "لوحة تحكم المعلم على منصة نجم: إحصائيات الطلاب والحضور والمدفوعات." },
      { property: "og:title", content: "لوحة المعلم | منصة نجم" },
      { property: "og:description", content: "إحصائيات سنترك في مكان واحد." },
    ],
  }),
  component: DashboardPage,
});

function useStats() {
  return useQuery({
    queryKey: ["teacher-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const dayName = WEEK_DAYS[(new Date().getDay() + 1) % 7];
      const [students, groups, attendance, exams, homework, questions, payments, schedules] =
        await Promise.all([
          supabase.from("students").select("id, status, created_at").is("deleted_at", null),
          supabase.from("groups").select("id"),
          supabase.from("attendance").select("id, status").eq("date", today),
          supabase.from("exams").select("id, status"),
          supabase.from("homework").select("id"),
          supabase.from("student_questions").select("id, status"),
          supabase.from("payments").select("amount_due, amount_paid, status"),
          supabase.from("schedules").select("id, day"),
        ]);
      const all = students.data ?? [];
      const pay = payments.data ?? [];
      return {
        total: all.length,
        pending: all.filter((s) => s.status === "pending").length,
        approved: all.filter((s) => s.status === "approved").length,
        groups: groups.data?.length ?? 0,
        presentToday: (attendance.data ?? []).filter((a) => a.status === "present").length,
        absentToday: (attendance.data ?? []).filter((a) => a.status === "absent").length,
        exams: exams.data?.length ?? 0,
        homework: homework.data?.length ?? 0,
        newQuestions: (questions.data ?? []).filter((q) => q.status === "new").length,
        paid: pay.reduce((s, p) => s + Number(p.amount_paid), 0),
        due: pay.reduce((s, p) => s + Math.max(0, Number(p.amount_due) - Number(p.amount_paid)), 0),
        todayClasses: (schedules.data ?? []).filter((s) => s.day === dayName).length,
      };
    },
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
  to,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  tone?: "default" | "gold" | "success" | "danger";
  to?: string;
}) {
  const toneClass =
    tone === "gold"
      ? "bg-accent/20 text-accent-foreground"
      : tone === "success"
        ? "bg-success/15 text-success"
        : tone === "danger"
          ? "bg-destructive/10 text-destructive"
          : "bg-secondary text-secondary-foreground";
  const body = (
    <Card className="h-full shadow-card transition-shadow hover:shadow-soft">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${toneClass}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function DashboardPage() {
  const { data, isLoading } = useStats();

  return (
    <TeacherShell title="لوحة التحكم" description="نظرة سريعة على سنترك اليوم">
      {isLoading || !data ? (
        <LoadingState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard icon={Users} label="إجمالي الطلاب" value={data.total} to="/students" />
          <StatCard icon={UserPlus} label="طلبات تسجيل جديدة" value={data.pending} tone="gold" to="/students" />
          <StatCard icon={UserCheck} label="الطلاب المعتمدون" value={data.approved} tone="success" to="/students" />
          <StatCard icon={Boxes} label="المجموعات" value={data.groups} to="/groups" />
          <StatCard icon={CalendarCheck} label="حصص اليوم" value={data.todayClasses} to="/groups" />
          <StatCard icon={UserCheck} label="حضور اليوم" value={data.presentToday} tone="success" to="/attendance" />
          <StatCard icon={AlertCircle} label="غياب اليوم" value={data.absentToday} tone="danger" to="/attendance" />
          <StatCard icon={FileQuestion} label="الاختبارات" value={data.exams} to="/exams" />
          <StatCard icon={BookOpen} label="الواجبات" value={data.homework} to="/homework" />
          <StatCard icon={MessagesSquare} label="أسئلة جديدة" value={data.newQuestions} tone="gold" to="/questions" />
          <StatCard icon={Wallet} label="إجمالي المدفوعات" value={egp(data.paid)} tone="success" to="/payments" />
          <StatCard icon={AlertCircle} label="المتأخرات" value={egp(data.due)} tone="danger" to="/payments" />
        </div>
      )}
    </TeacherShell>
  );
}
