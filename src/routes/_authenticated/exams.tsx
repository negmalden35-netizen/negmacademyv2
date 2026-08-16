import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Loader2, Trash2, Send, EyeOff } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, TableSkeleton } from "@/components/negm/states";
import { GRADES, QUESTION_TYPES, formatDate } from "@/lib/negm";
import { generateAiExam } from "@/lib/negm.functions";

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({
    meta: [
      { title: "الاختبارات | منصة نجم" },
      { name: "description", content: "إنشاء اختبارات إلكترونية بالذكاء الاصطناعي ونشر النتائج للطلاب." },
      { property: "og:title", content: "الاختبارات | منصة نجم" },
      { property: "og:description", content: "اختبارات ذكية لطلابك." },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    grade: "",
    topic: "",
    count: "5",
    difficulty: "متوسط",
    duration: "30",
    groupId: "",
    types: ["mcq"] as string[],
  });
  const generate = useServerFn(generateAiExam);

  const groups = useQuery({
    queryKey: ["groups-simple"],
    queryFn: async () => {
      const { data, error } = await supabase.from("groups").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const exams = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*, groups(name), exam_questions(id), exam_submissions(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createAi = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("no user");
      const result = await generate({
        data: {
          subject: form.subject,
          grade: form.grade,
          topic: form.topic,
          count: Number(form.count),
          difficulty: form.difficulty,
          types: form.types,
        },
      });
      const totalScore = result.questions.reduce((s, q) => s + (Number(q.score) || 1), 0);
      const { data: exam, error } = await supabase
        .from("exams")
        .insert({
          teacher_id: uid,
          group_id: form.groupId || null,
          title: form.title || `اختبار ${form.topic}`,
          subject: form.subject,
          grade: form.grade,
          duration_minutes: Number(form.duration) || 30,
          total_score: totalScore,
          status: "draft",
          source: "ai",
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: qError } = await supabase.from("exam_questions").insert(
        result.questions.map((q, i) => ({
          teacher_id: uid,
          exam_id: exam.id,
          type: q.type,
          question: q.question,
          options: q.options ?? [],
          correct_answer: q.correct_answer ?? null,
          score: Number(q.score) || 1,
          order_index: i,
        })),
      );
      if (qError) throw qError;
    },
    onSuccess: () => {
      toast.success("تم إنشاء الاختبار بالذكاء الاصطناعي");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
    onError: (e: Error) => toast.error(e.message || "تعذر إنشاء الاختبار"),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { status?: string; results_published?: boolean } }) => {
      const { error } = await supabase.from("exams").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم التحديث");
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
    onError: () => toast.error("تعذر التحديث"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف الاختبار");
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
    onError: () => toast.error("تعذر الحذف"),
  });

  return (
    <TeacherShell
      title="الاختبارات"
      description="أنشئ اختبارات إلكترونية بالذكاء الاصطناعي وانشرها لطلابك"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Sparkles className="size-4" /> اختبار بالذكاء الاصطناعي
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء اختبار ذكي</DialogTitle>
              <DialogDescription>حدد الموضوع وعدد الأسئلة وسيتم توليدها تلقائيًا.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>عنوان الاختبار</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>المادة</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
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
              <div className="space-y-2 sm:col-span-2">
                <Label>الموضوع / الدرس</Label>
                <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>عدد الأسئلة</Label>
                <Input type="number" min="1" max="20" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>مدة الاختبار (دقيقة)</Label>
                <Input type="number" min="5" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>الصعوبة</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="سهل">سهل</SelectItem>
                    <SelectItem value="متوسط">متوسط</SelectItem>
                    <SelectItem value="صعب">صعب</SelectItem>
                  </SelectContent>
                </Select>
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
              <div className="space-y-2 sm:col-span-2">
                <Label>أنواع الأسئلة</Label>
                <div className="flex flex-wrap gap-3">
                  {QUESTION_TYPES.map((t) => (
                    <label key={t.value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.types.includes(t.value)}
                        onCheckedChange={(checked) =>
                          setForm({
                            ...form,
                            types: checked
                              ? [...form.types, t.value]
                              : form.types.filter((x) => x !== t.value),
                          })
                        }
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (!form.subject || !form.grade || !form.topic || form.types.length === 0) {
                    toast.error("أكمل بيانات الاختبار");
                    return;
                  }
                  createAi.mutate();
                }}
                disabled={createAi.isPending}
              >
                {createAi.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                توليد الاختبار
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {exams.isLoading ? (
        <TableSkeleton />
      ) : (exams.data ?? []).length === 0 ? (
        <EmptyState title="لا توجد اختبارات" description="ابدأ بإنشاء اختبار بالذكاء الاصطناعي." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(exams.data ?? []).map((e) => (
            <Card key={e.id} className="shadow-card">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.subject ?? "—"} · {e.grade ?? "—"} · {e.groups?.name ?? "كل المجموعات"}
                    </p>
                  </div>
                  <Badge variant={e.status === "published" ? "default" : "secondary"}>
                    {e.status === "published" ? "منشور" : "مسودة"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>الأسئلة: {e.exam_questions?.length ?? 0}</span>
                  <span>المدة: {e.duration_minutes} د</span>
                  <span>الدرجة: {e.total_score}</span>
                  <span>المحاولات: {e.exam_submissions?.length ?? 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(e.created_at)}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={e.status === "published" ? "outline" : "default"}
                    onClick={() =>
                      update.mutate({
                        id: e.id,
                        patch: { status: e.status === "published" ? "draft" : "published" },
                      })
                    }
                  >
                    {e.status === "published" ? <EyeOff className="size-4" /> : <Send className="size-4" />}
                    {e.status === "published" ? "إلغاء النشر" : "نشر"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => update.mutate({ id: e.id, patch: { results_published: !e.results_published } })}
                  >
                    {e.results_published ? "إخفاء النتائج" : "نشر النتائج"}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(e.id)}>
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
