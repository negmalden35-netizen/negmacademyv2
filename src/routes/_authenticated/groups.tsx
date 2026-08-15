import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState, TableSkeleton } from "@/components/negm/states";
import { GRADES, WEEK_DAYS, egp } from "@/lib/negm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/groups")({
  head: () => ({
    meta: [
      { title: "المجموعات | منصة نجم" },
      { name: "description", content: "إنشاء وإدارة مجموعات الطلاب والمواعيد والقاعات وقيمة الاشتراك." },
      { property: "og:title", content: "المجموعات | منصة نجم" },
      { property: "og:description", content: "إدارة المجموعات والمواعيد." },
    ],
  }),
  component: GroupsPage,
});

const EMPTY = {
  name: "",
  grade: "",
  subject: "",
  days: [] as string[],
  class_time: "",
  room: "",
  fee: "0",
  payment_day: "",
};

function GroupsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const groups = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*, students(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("no user");
      const { error } = await supabase.from("groups").insert({
        teacher_id: uid,
        name: form.name.trim(),
        grade: form.grade || null,
        subject: form.subject || null,
        days: form.days,
        class_time: form.class_time || null,
        room: form.room || null,
        fee: Number(form.fee) || 0,
        payment_day: form.payment_day || null,
      });
      if (error) throw error;
      if (form.days.length) {
        await supabase.from("schedules").insert(
          form.days.map((d) => ({
            teacher_id: uid,
            day: d,
            start_time: form.class_time || null,
            room: form.room || null,
          })),
        );
      }
    },
    onSuccess: () => {
      toast.success("تم إنشاء المجموعة");
      setForm(EMPTY);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: () => toast.error("تعذر إنشاء المجموعة"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف المجموعة");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: () => toast.error("تعذر حذف المجموعة"),
  });

  return (
    <TeacherShell
      title="المجموعات"
      description="مجموعات الدراسة والمواعيد والاشتراكات"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" /> مجموعة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء مجموعة</DialogTitle>
              <DialogDescription>حدد بيانات المجموعة وأيام الحصص.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>اسم المجموعة</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>الصف</Label>
                <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المادة</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>موعد الحصة</Label>
                <Input type="time" value={form.class_time} onChange={(e) => setForm({ ...form, class_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>القاعة</Label>
                <Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>قيمة الاشتراك</Label>
                <Input type="number" min="0" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>موعد الدفع</Label>
                <Input placeholder="مثال: أول كل شهر" value={form.payment_day} onChange={(e) => setForm({ ...form, payment_day: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>أيام الدراسة</Label>
                <div className="flex flex-wrap gap-3">
                  {WEEK_DAYS.map((d) => (
                    <label key={d} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.days.includes(d)}
                        onCheckedChange={(checked) =>
                          setForm({
                            ...form,
                            days: checked ? [...form.days, d] : form.days.filter((x) => x !== d),
                          })
                        }
                      />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (form.name.trim().length < 2) {
                    toast.error("اكتب اسم المجموعة");
                    return;
                  }
                  createMutation.mutate();
                }}
                disabled={createMutation.isPending}
              >
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {groups.isLoading ? (
        <TableSkeleton />
      ) : (groups.data ?? []).length === 0 ? (
        <EmptyState title="لا توجد مجموعات" description="ابدأ بإنشاء أول مجموعة لطلابك." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(groups.data ?? []).map((g) => (
            <Card key={g.id} className="shadow-card">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{g.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.grade ?? "—"} · {g.subject ?? "—"}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(g.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(g.days ?? []).map((d: string) => (
                    <Badge key={d} variant="secondary">
                      {d}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>الموعد: {g.class_time ?? "—"}</span>
                  <span>القاعة: {g.room ?? "—"}</span>
                  <span>الاشتراك: {egp(g.fee)}</span>
                  <span>الدفع: {g.payment_day ?? "—"}</span>
                </div>
                <Badge>{g.students?.length ?? 0} طالب</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </TeacherShell>
  );
}
