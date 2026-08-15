import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Send, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, TableSkeleton } from "@/components/negm/states";
import { formatDate } from "@/lib/negm";

export const Route = createFileRoute("/_authenticated/homework")({
  head: () => ({
    meta: [
      { title: "الواجبات | منصة نجم" },
      { name: "description", content: "إنشاء الواجبات المنزلية ومتابعة تسليمات الطلاب وتصحيحها." },
      { property: "og:title", content: "الواجبات | منصة نجم" },
      { property: "og:description", content: "إدارة الواجبات والتسليمات." },
    ],
  }),
  component: HomeworkPage,
});

function HomeworkPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", groupId: "", questions: "" });

  const groups = useQuery({
    queryKey: ["groups-simple"],
    queryFn: async () => {
      const { data, error } = await supabase.from("groups").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const homework = useQuery({
    queryKey: ["homework"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homework")
        .select("*, groups(name), homework_questions(id), homework_submissions(id, grade, students(full_name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("no user");
      const { data: hw, error } = await supabase
        .from("homework")
        .insert({
          teacher_id: uid,
          group_id: form.groupId || null,
          title: form.title.trim(),
          description: form.description || null,
          due_date: form.dueDate || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      const questions = form.questions
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean);
      if (questions.length) {
        const { error: qError } = await supabase.from("homework_questions").insert(
          questions.map((q, i) => ({
            teacher_id: uid,
            homework_id: hw.id,
            question: q,
            order_index: i,
          })),
        );
        if (qError) throw qError;
      }
    },
    onSuccess: () => {
      toast.success("تم إنشاء الواجب");
      setOpen(false);
      setForm({ title: "", description: "", dueDate: "", groupId: "", questions: "" });
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
    onError: () => toast.error("تعذر إنشاء الواجب"),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("homework").update({ published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["homework"] }),
    onError: () => toast.error("تعذر التحديث"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("homework").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف الواجب");
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
    onError: () => toast.error("تعذر الحذف"),
  });

  return (
    <TeacherShell
      title="الواجبات"
      description="أنشئ واجبات لطلابك وتابع التسليمات"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" /> واجب جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء واجب</DialogTitle>
              <DialogDescription>اكتب كل سؤال في سطر منفصل.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>عنوان الواجب</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>تاريخ التسليم</Label>
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>المجموعة</Label>
                  <Select value={form.groupId} onValueChange={(v) => setForm({ ...form, groupId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="كل المجموعات" />
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
              </div>
              <div className="space-y-2">
                <Label>الأسئلة (سطر لكل سؤال)</Label>
                <Textarea
                  rows={5}
                  value={form.questions}
                  onChange={(e) => setForm({ ...form, questions: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (form.title.trim().length < 2) {
                    toast.error("اكتب عنوان الواجب");
                    return;
                  }
                  create.mutate();
                }}
                disabled={create.isPending}
              >
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {homework.isLoading ? (
        <TableSkeleton />
      ) : (homework.data ?? []).length === 0 ? (
        <EmptyState title="لا توجد واجبات" description="ابدأ بإنشاء أول واجب." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(homework.data ?? []).map((h) => (
            <Card key={h.id} className="shadow-card">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{h.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.groups?.name ?? "كل المجموعات"} · تسليم {formatDate(h.due_date)}
                    </p>
                  </div>
                  <Badge variant={h.published ? "default" : "secondary"}>
                    {h.published ? "منشور" : "مسودة"}
                  </Badge>
                </div>
                {h.description ? <p className="text-sm text-muted-foreground">{h.description}</p> : null}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>الأسئلة: {h.homework_questions?.length ?? 0}</span>
                  <span>التسليمات: {h.homework_submissions?.length ?? 0}</span>
                </div>
                {(h.homework_submissions ?? []).length > 0 ? (
                  <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-xs">
                    {(h.homework_submissions ?? []).slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-center justify-between">
                        <span>{s.students?.full_name ?? "طالب"}</span>
                        <span>{s.grade != null ? `${s.grade} درجة` : "بانتظار التصحيح"}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={h.published ? "outline" : "default"}
                    onClick={() => toggle.mutate({ id: h.id, published: !h.published })}
                  >
                    {h.published ? <EyeOff className="size-4" /> : <Send className="size-4" />}
                    {h.published ? "إلغاء النشر" : "نشر"}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(h.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </TeacherShell>
  );
}
