import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/negm/Logo";
import { EmptyState, LoadingState } from "@/components/negm/states";
import { useStudentCode } from "@/hooks/useNegm";
import { studentExam, studentSubmitExam } from "@/lib/negm.functions";

export const Route = createFileRoute("/student/exam/$id")({
  head: () => ({
    meta: [
      { title: "أداء الاختبار | منصة نجم" },
      { name: "description", content: "صفحة أداء الاختبار الإلكتروني للطالب على منصة نجم." },
      { property: "og:title", content: "أداء الاختبار | منصة نجم" },
      { property: "og:description", content: "اختبار إلكتروني تفاعلي." },
    ],
  }),
  component: StudentExamPage,
});

function StudentExamPage() {
  const { id } = Route.useParams();
  const { code, ready } = useStudentCode();
  const navigate = useNavigate();
  const load = useServerFn(studentExam);
  const submit = useServerFn(studentSubmitExam);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const exam = useQuery({
    queryKey: ["student-exam", id, code],
    queryFn: () => load({ data: { code: code!, examId: id } }),
    enabled: !!code,
  });

  const submission = useMutation({
    mutationFn: () =>
      submit({
        data: {
          code: code!,
          examId: id,
          answers: (exam.data?.questions ?? []).map((q) => ({
            questionId: q.id,
            answer: answers[q.id] ?? "",
          })),
        },
      }),
    onSuccess: (result: { percentage?: number }) => {
      toast.success(
        result?.percentage != null ? `تم التسليم — نتيجتك ${Math.round(result.percentage)}%` : "تم تسليم الاختبار",
      );
      navigate({ to: "/student/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message || "تعذر تسليم الاختبار"),
  });

  if (!ready) return <LoadingState />;
  if (!code) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Button asChild>
          <Link to="/student">دخول الطالب</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient text-primary-foreground">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
          <Logo subtitle={exam.data?.exam?.title ?? "اختبار"} />
          {exam.data?.exam ? <Badge variant="secondary">{exam.data.exam.duration_minutes} دقيقة</Badge> : null}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {exam.isLoading ? (
          <LoadingState />
        ) : exam.isError || !exam.data?.exam ? (
          <EmptyState title="تعذر فتح الاختبار" description="قد يكون غير متاح أو تم إغلاقه." />
        ) : (
          <>
            {(exam.data.questions ?? []).map((q, index) => (
              <Card key={q.id} className="shadow-card">
                <CardContent className="space-y-3 p-5">
                  <p className="font-semibold">
                    {index + 1}. {q.question}
                  </p>
                  {Array.isArray(q.options) && q.options.length > 0 ? (
                    <div className="grid gap-2">
                      {(q.options as string[]).map((opt) => (
                        <label
                          key={opt}
                          className={`cursor-pointer rounded-lg border p-3 text-sm transition-colors ${
                            answers[q.id] === opt ? "border-primary bg-primary/10" : "hover:bg-muted"
                          }`}
                        >
                          <input
                            type="radio"
                            className="ml-2"
                            name={q.id}
                            checked={answers[q.id] === opt}
                            onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : q.type === "essay" ? (
                    <Textarea
                      rows={4}
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
            <Button className="w-full" size="lg" onClick={() => submission.mutate()} disabled={submission.isPending}>
              <Send className="size-4" /> تسليم الاختبار
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
