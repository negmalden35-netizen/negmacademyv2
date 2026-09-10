import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, TableSkeleton } from "@/components/negm/states";

export const Route = createFileRoute("/_authenticated/subjects")({
  head: () => ({
    meta: [
      { title: "المواد | منصة نجم" },
      { name: "description", content: "فصل الطلاب حسب المادة والمجموعة مع التجميع النهائي للأعداد والنتائج." },
      { property: "og:title", content: "المواد | منصة نجم" },
      { property: "og:description", content: "تقسيم طلاب السنتر حسب المواد الدراسية." },
    ],
  }),
  component: SubjectsPage,
});

const NO_SUBJECT = "بدون مادة";

function SubjectsPage() {
  const [search, setSearch] = useState("");

  const students = useQuery({
    queryKey: ["subjects-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, subject, grade, status, groups(name)")
        .is("deleted_at", null);
      if (error) throw error;
      return data;
    },
  });

  const submissions = useQuery({
    queryKey: ["subjects-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_submissions")
        .select("percentage, student_id, exams(subject)");
      if (error) throw error;
      return data;
    },
  });

  const groupsBySubject = useMemo(() => {
    const list = students.data ?? [];
    const q = search.trim();
    const map = new Map<
      string,
      { subject: string; students: typeof list; approved: number; grades: Set<string> }
    >();
    for (const s of list) {
      if (q && !s.full_name.includes(q) && !(s.subject ?? "").includes(q)) continue;
      const key = s.subject?.trim() || NO_SUBJECT;
      const entry = map.get(key) ?? { subject: key, students: [], approved: 0, grades: new Set<string>() };
      entry.students.push(s);
      if (s.status === "approved") entry.approved += 1;
      if (s.grade) entry.grades.add(s.grade);
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.students.length - a.students.length);
  }, [students.data, search]);

  const avgBySubject = useMemo(() => {
    const acc = new Map<string, { sum: number; n: number }>();
    for (const sub of submissions.data ?? []) {
      const key = sub.exams?.subject?.trim() || NO_SUBJECT;
      const cur = acc.get(key) ?? { sum: 0, n: 0 };
      cur.sum += Number(sub.percentage) || 0;
      cur.n += 1;
      acc.set(key, cur);
    }
    return acc;
  }, [submissions.data]);

  const totalStudents = groupsBySubject.reduce((s, g) => s + g.students.length, 0);

  return (
    <TeacherShell title="المواد" description="فصل الطلاب حسب المادة مع التجميع النهائي">
      <div className="space-y-4">
        <Card className="shadow-card">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span>عدد المواد: <b>{groupsBySubject.length}</b></span>
              <span>إجمالي الطلاب: <b>{totalStudents}</b></span>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pr-9"
                placeholder="بحث بالمادة أو اسم الطالب"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {students.isLoading ? (
          <TableSkeleton />
        ) : groupsBySubject.length === 0 ? (
          <EmptyState title="لا توجد مواد" description="أضف المادة لكل طالب لتظهر هنا." />
        ) : (
          groupsBySubject.map((g) => {
            const avg = avgBySubject.get(g.subject);
            return (
              <Card key={g.subject} className="shadow-card">
                <CardContent className="space-y-3 p-4 md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-bold">{g.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        الصفوف: {g.grades.size ? [...g.grades].join(" · ") : "—"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">الطلاب: {g.students.length}</Badge>
                      <Badge>المعتمدون: {g.approved}</Badge>
                      <Badge variant="outline">
                        متوسط النتائج: {avg && avg.n ? `${Math.round(avg.sum / avg.n)}%` : "—"}
                      </Badge>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الاسم</TableHead>
                          <TableHead>الصف</TableHead>
                          <TableHead>المجموعة</TableHead>
                          <TableHead>الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {g.students.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.full_name}</TableCell>
                            <TableCell>{s.grade ?? "—"}</TableCell>
                            <TableCell>{s.groups?.name ?? "—"}</TableCell>
                            <TableCell>{s.status === "approved" ? "معتمد" : s.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </TeacherShell>
  );
}
