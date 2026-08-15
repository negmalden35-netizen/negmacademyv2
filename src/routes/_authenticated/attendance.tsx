import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, TableSkeleton } from "@/components/negm/states";
import { ATTENDANCE_LABEL } from "@/lib/negm";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "الحضور والغياب | منصة نجم" },
      { name: "description", content: "تسجيل حضور وغياب الطلاب لكل مجموعة مع سجل تاريخي." },
      { property: "og:title", content: "الحضور والغياب | منصة نجم" },
      { property: "og:description", content: "سجل الحضور اليومي لمجموعاتك." },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const queryClient = useQueryClient();
  const [groupId, setGroupId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, string>>({});

  const groups = useQuery({
    queryKey: ["groups-simple"],
    queryFn: async () => {
      const { data, error } = await supabase.from("groups").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const students = useQuery({
    queryKey: ["attendance-students", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, student_code")
        .eq("group_id", groupId)
        .eq("status", "approved")
        .is("deleted_at", null)
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });

  const existing = useQuery({
    queryKey: ["attendance-day", groupId, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("student_id, status")
        .eq("group_id", groupId)
        .eq("date", date);
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });

  useEffect(() => {
    const next: Record<string, string> = {};
    (existing.data ?? []).forEach((a) => {
      next[a.student_id] = a.status;
    });
    setMarks(next);
  }, [existing.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("no user");
      const rows = (students.data ?? []).map((s) => ({
        teacher_id: uid,
        student_id: s.id,
        group_id: groupId,
        date,
        status: marks[s.id] ?? "present",
      }));
      const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "student_id,date" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حفظ الحضور");
      queryClient.invalidateQueries({ queryKey: ["attendance-day"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-stats"] });
    },
    onError: () => toast.error("تعذر حفظ الحضور"),
  });

  return (
    <TeacherShell title="الحضور والغياب" description="اختر المجموعة والتاريخ ثم سجّل الحضور">
      <Card className="shadow-card">
        <CardContent className="space-y-5 p-4 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>المجموعة</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المجموعة" />
                </SelectTrigger>
                <SelectContent>
                  {(groups.data ?? []).map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {!groupId ? (
            <EmptyState title="اختر مجموعة" description="اختر مجموعة لعرض قائمة الطلاب." />
          ) : students.isLoading ? (
            <TableSkeleton />
          ) : (students.data ?? []).length === 0 ? (
            <EmptyState title="لا يوجد طلاب معتمدون في هذه المجموعة" />
          ) : (
            <>
              <div className="space-y-2">
                {(students.data ?? []).map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{s.full_name}</p>
                      <p dir="ltr" className="font-mono text-xs text-muted-foreground">
                        {s.student_code}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(ATTENDANCE_LABEL).map(([value, label]) => (
                        <Button
                          key={value}
                          size="sm"
                          variant={(marks[s.id] ?? "present") === value ? "default" : "outline"}
                          onClick={() => setMarks((m) => ({ ...m, [s.id]: value }))}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                <Save className="size-4" /> حفظ الحضور
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </TeacherShell>
  );
}
