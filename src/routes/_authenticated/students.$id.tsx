import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/negm/states";
import { ATTENDANCE_LABEL, STUDENT_STATUS_LABEL, egp, formatDate } from "@/lib/negm";

export const Route = createFileRoute("/_authenticated/students/$id")({
  head: () => ({
    meta: [
      { title: "ملف الطالب | منصة نجم" },
      { name: "description", content: "ملف الطالب الكامل: البيانات والحضور والمدفوعات ونتائج الاختبارات." },
      { property: "og:title", content: "ملف الطالب | منصة نجم" },
      { property: "og:description", content: "تفاصيل الطالب على منصة نجم." },
    ],
  }),
  component: StudentProfilePage,
});

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

function StudentProfilePage() {
  const { id } = Route.useParams();

  const query = useQuery({
    queryKey: ["student-profile", id],
    queryFn: async () => {
      const [student, attendance, payments, submissions] = await Promise.all([
        supabase.from("students").select("*, groups(name)").eq("id", id).maybeSingle(),
        supabase.from("attendance").select("*").eq("student_id", id).order("date", { ascending: false }),
        supabase.from("payments").select("*").eq("student_id", id).order("created_at", { ascending: false }),
        supabase
          .from("exam_submissions")
          .select("*, exams(title)")
          .eq("student_id", id)
          .order("started_at", { ascending: false }),
      ]);
      return {
        student: student.data,
        attendance: attendance.data ?? [],
        payments: payments.data ?? [],
        submissions: submissions.data ?? [],
      };
    },
  });

  const student = query.data?.student;

  return (
    <TeacherShell
      title={student?.full_name ?? "ملف الطالب"}
      description="كل بيانات الطالب في مكان واحد"
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to="/students">
            <ArrowRight className="size-4" /> رجوع
          </Link>
        </Button>
      }
    >
      {query.isLoading ? (
        <LoadingState />
      ) : !student ? (
        <EmptyState title="لم يتم العثور على الطالب" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="shadow-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                البيانات الأساسية
                <Badge>{STUDENT_STATUS_LABEL[student.status] ?? student.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Row label="كود الطالب" value={student.student_code} />
              <Row label="الصف" value={student.grade} />
              <Row label="المجموعة" value={student.groups?.name} />
              <Row label="المادة" value={student.subject} />
              <Row label="المدرسة" value={student.school} />
              <Row label="الهاتف" value={student.phone} />
              <Row label="هاتف ولي الأمر" value={student.guardian_phone} />
              <Row label="النوع" value={student.gender} />
              <Row label="تاريخ الميلاد" value={formatDate(student.birth_date)} />
              <Row label="العنوان" value={student.address} />
              <Row label="تاريخ التسجيل" value={formatDate(student.created_at)} />
            </CardContent>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">سجل الحضور</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {query.data!.attendance.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا يوجد سجل حضور.</p>
                ) : (
                  query.data!.attendance.slice(0, 12).map((a) => (
                    <div key={a.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                      <span>{formatDate(a.date)}</span>
                      <Badge variant={a.status === "present" ? "default" : "secondary"}>
                        {ATTENDANCE_LABEL[a.status] ?? a.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">المدفوعات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {query.data!.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد مدفوعات مسجلة.</p>
                ) : (
                  query.data!.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                      <span>{formatDate(p.due_date ?? p.created_at)}</span>
                      <span>
                        {egp(p.amount_paid)} / {egp(p.amount_due)}
                      </span>
                      <Badge variant={p.status === "paid" ? "default" : "destructive"}>
                        {p.status === "paid" ? "مدفوع" : "غير مكتمل"}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">نتائج الاختبارات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {query.data!.submissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لم يؤدِ الطالب أي اختبار بعد.</p>
                ) : (
                  query.data!.submissions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                      <span>{s.exams?.title ?? "اختبار"}</span>
                      <span className="font-semibold">{Number(s.percentage).toFixed(0)}%</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </TeacherShell>
  );
}
