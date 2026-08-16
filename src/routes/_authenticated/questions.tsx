import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, TableSkeleton } from "@/components/negm/states";
import { formatDateTime } from "@/lib/negm";

export const Route = createFileRoute("/_authenticated/questions")({
  head: () => ({
    meta: [
      { title: "أسئلة الطلاب | منصة نجم" },
      { name: "description", content: "استقبل أسئلة طلابك وأجب عليها مباشرة من لوحة المعلم." },
      { property: "og:title", content: "أسئلة الطلاب | منصة نجم" },
      { property: "og:description", content: "الرد على أسئلة الطلاب." },
    ],
  }),
  component: QuestionsPage,
});

function QuestionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questions = useQuery({
    queryKey: ["student-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_questions")
        .select("*, students(full_name, student_code)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const answer = useMutation({
    mutationFn: async ({ id, text, studentId }: { id: string; text: string; studentId: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      const { error } = await supabase
        .from("student_questions")
        .update({ answer: text, answered_at: new Date().toISOString(), status: "answered" })
        .eq("id", id);
      if (error) throw error;
      if (uid) {
        await supabase.from("notifications").insert({
          teacher_id: uid,
          student_id: studentId,
          title: "تم الرد على سؤالك",
          body: text.slice(0, 120),
        });
      }
    },
    onSuccess: () => {
      toast.success("تم إرسال الرد");
      queryClient.invalidateQueries({ queryKey: ["student-questions"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-stats"] });
    },
    onError: () => toast.error("تعذر إرسال الرد"),
  });

  const rows = useMemo(() => {
    const q = search.trim();
    return (questions.data ?? []).filter(
      (item) =>
        !q ||
        item.question.includes(q) ||
        (item.students?.full_name ?? "").includes(q) ||
        (item.students?.student_code ?? "").toUpperCase().includes(q.toUpperCase()),
    );
  }, [questions.data, search]);

  return (
    <TeacherShell title="أسئلة الطلاب" description="أجب على استفسارات طلابك">
      <Card className="shadow-card">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pr-9"
              placeholder="بحث في الأسئلة أو أسماء الطلاب"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {questions.isLoading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState title="لا توجد أسئلة" description="ستظهر هنا أسئلة الطلاب فور إرسالها." />
          ) : (
            <div className="space-y-3">
              {rows.map((q) => (
                <div key={q.id} className="space-y-3 rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{q.students?.full_name ?? "طالب"}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(q.created_at)}</p>
                    </div>
                    <Badge variant={q.status === "answered" ? "default" : "secondary"}>
                      {q.status === "answered" ? "تم الرد" : "جديد"}
                    </Badge>
                  </div>
                  <p className="rounded-lg bg-muted/60 p-3 text-sm">{q.question}</p>
                  {q.answer ? (
                    <p className="rounded-lg bg-success/10 p-3 text-sm">{q.answer}</p>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        rows={3}
                        placeholder="اكتب ردك..."
                        value={answers[q.id] ?? ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const text = (answers[q.id] ?? "").trim();
                          if (text.length < 2) {
                            toast.error("اكتب الرد أولًا");
                            return;
                          }
                          answer.mutate({ id: q.id, text, studentId: q.student_id });
                        }}
                        disabled={answer.isPending}
                      >
                        <Send className="size-4" /> إرسال الرد
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TeacherShell>
  );
}
