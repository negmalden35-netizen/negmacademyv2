import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, TableSkeleton } from "@/components/negm/states";
import { egp } from "@/lib/negm";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "التقارير المفصلة | منصة نجم" },
      { name: "description", content: "تقارير تفصيلية عن الحضور والمدفوعات ودرجات الاختبارات لكل طالب." },
      { property: "og:title", content: "التقارير المفصلة | منصة نجم" },
      { property: "og:description", content: "تقارير أداء الطلاب في سنترك." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [search, setSearch] = useState("");
  const [groupId, setGroupId] = useState("all");

  const data = useQuery({
    queryKey: ["reports-data"],
    queryFn: async () => {
      const [students, groups, attendance, payments, submissions] = await Promise.all([
        supabase
          .from("students")
          .select("id, full_name, grade, group_id, groups(name)")
          .is("deleted_at", null)
          .eq("status", "approved"),
        supabase.from("groups").select("id, name"),
        supabase.from("attendance").select("student_id, status"),
        supabase.from("payments").select("student_id, amount_due, amount_paid"),
        supabase.from("exam_submissions").select("student_id, percentage"),
      ]);
      return {
        students: students.data ?? [],
        groups: groups.data ?? [],
        attendance: attendance.data ?? [],
        payments: payments.data ?? [],
        submissions: submissions.data ?? [],
      };
    },
  });

  const rows = useMemo(() => {
    if (!data.data) return [];
    const q = search.trim();
    return data.data.students
      .filter((s) => (groupId === "all" || s.group_id === groupId) && (!q || s.full_name.includes(q)))
      .map((s) => {
        const att = data.data!.attendance.filter((a) => a.student_id === s.id);
        const present = att.filter((a) => a.status === "present" || a.status === "late").length;
        const pays = data.data!.payments.filter((p) => p.student_id === s.id);
        const due = pays.reduce((t, p) => t + Math.max(0, Number(p.amount_due) - Number(p.amount_paid)), 0);
        const paid = pays.reduce((t, p) => t + Number(p.amount_paid), 0);
        const subs = data.data!.submissions.filter((x) => x.student_id === s.id);
        const avg = subs.length
          ? subs.reduce((t, x) => t + Number(x.percentage), 0) / subs.length
          : 0;
        return {
          id: s.id,
          name: s.full_name,
          group: s.groups?.name ?? "—",
          grade: s.grade ?? "—",
          sessions: att.length,
          attendanceRate: att.length ? Math.round((present / att.length) * 100) : 0,
          paid,
          due,
          exams: subs.length,
          avg: Math.round(avg),
        };
      });
  }, [data.data, search, groupId]);

  function exportCsv() {
    const header = ["الطالب", "المجموعة", "الصف", "الحصص", "نسبة الحضور", "المدفوع", "المتأخر", "الاختبارات", "المتوسط"];
    const body = rows.map((r) => [r.name, r.group, r.grade, r.sessions, `${r.attendanceRate}%`, r.paid, r.due, r.exams, `${r.avg}%`]);
    const csv = "\uFEFF" + [header, ...body].map((line) => line.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "negm-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const totals = rows.reduce(
    (acc, r) => {
      acc.paid += r.paid;
      acc.due += r.due;
      acc.avg += r.avg;
      acc.attendance += r.attendanceRate;
      return acc;
    },
    { paid: 0, due: 0, avg: 0, attendance: 0 },
  );

  return (
    <TeacherShell
      title="التقارير المفصلة"
      description="أداء كل طالب: حضور، مدفوعات، ودرجات"
      actions={
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="size-4" /> تصدير CSV
        </Button>
      }
    >
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">عدد الطلاب</p>
            <p className="text-xl font-bold">{rows.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">متوسط الحضور</p>
            <p className="text-xl font-bold">
              {rows.length ? Math.round(totals.attendance / rows.length) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">متوسط الدرجات</p>
            <p className="text-xl font-bold">{rows.length ? Math.round(totals.avg / rows.length) : 0}%</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">المتأخرات</p>
            <p className="text-xl font-bold text-destructive">{egp(totals.due)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pr-9"
                placeholder="بحث باسم الطالب"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المجموعات</SelectItem>
                {(data.data?.groups ?? []).map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {data.isLoading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState title="لا توجد بيانات" description="لم يتم العثور على طلاب مطابقين." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطالب</TableHead>
                    <TableHead>المجموعة</TableHead>
                    <TableHead>الحصص</TableHead>
                    <TableHead>نسبة الحضور</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>المتأخر</TableHead>
                    <TableHead>الاختبارات</TableHead>
                    <TableHead>المتوسط</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.group}</TableCell>
                      <TableCell>{r.sessions}</TableCell>
                      <TableCell className="w-40">
                        <div className="flex items-center gap-2">
                          <Progress value={r.attendanceRate} className="h-2" />
                          <span className="text-xs">{r.attendanceRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{egp(r.paid)}</TableCell>
                      <TableCell className={r.due > 0 ? "text-destructive" : ""}>{egp(r.due)}</TableCell>
                      <TableCell>{r.exams}</TableCell>
                      <TableCell className="font-semibold">{r.avg}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TeacherShell>
  );
}
