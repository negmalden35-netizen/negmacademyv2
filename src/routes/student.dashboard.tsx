import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CalendarCheck,
  FileQuestion,
  BookOpen,
  MessagesSquare,
  Bell,
  LogOut,
  Search,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo, PoweredBy } from "@/components/negm/Logo";
import { EmptyState, LoadingState } from "@/components/negm/states";
import { useStudentCode } from "@/hooks/useNegm";
import { studentAskQuestion, studentDashboard, studentSubmitHomework } from "@/lib/negm.functions";
import { ATTENDANCE_LABEL, STUDENT_TOKEN_KEY, formatDate, formatDateTime } from "@/lib/negm";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({
    meta: [
      { title: "صفحة الطالب | منصة نجم" },
      { name: "description", content: "مواعيد الحصص والاختبارات والواجبات والحضور وأسئلة المعلم للطالب." },
      { property: "og:title", content: "صفحة الطالب | منصة نجم" },
      { property: "og:description", content: "كل ما يخص الطالب في مكان واحد." },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const { code, ready } = useStudentCode();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loadDashboard = useServerFn(studentDashboard);
  const ask = useServerFn(studentAskQuestion);
  const submitHw = useServerFn(studentSubmitHomework);

  const [question, setQuestion] = useState("");
  const [search, setSearch] = useState("");
  const [hwAnswers, setHwAnswers] = useState<Record<string, string>>({});

  const dashboard = useQuery({
    queryKey: ["student-dashboard", code],
    queryFn: () => loadDashboard({ data: { code: code! } }),
    enabled: !!code,
  });

  const askMutation = useMutation({
    mutationFn: () => ask({ data: { code: code!, question: question.trim() } }),
    onSuccess: () => {
      toast.success("تم إرسال سؤالك للمعلم");
      setQuestion("");
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
    },
    onError: () => toast.error("تعذر إرسال السؤال"),
  });

  const hwMutation = useMutation({
    mutationFn: (homeworkId: string) =>
      submitHw({ data: { code: code!, homeworkId, answers: [hwAnswers[homeworkId] ?? ""] } }),
    onSuccess: () => {
      toast.success("تم تسليم الواجب");
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
    },
    onError: () => toast.error("تعذر تسليم الواجب"),
  });

  const data = dashboard.data;

  const filteredExams = useMemo(() => {
    const q = search.trim();
    return (data?.exams ?? []).filter((e) => !q || e.title.includes(q));
  }, [data, search]);

  if (!ready) return <LoadingState />;
  if (!code) {
    return (
      <div className="hero-gradient flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center shadow-soft">
          <CardContent className="space-y-4 p-6">
            <p className="font-semibold">يجب تسجيل الدخول بكود الطالب</p>
            <Button asChild className="w-full">
              <Link to="/student">دخول الطالب</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient text-primary-foreground">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5">
          <Logo subtitle={data?.teacher?.center_name ?? "منصة نجم"} />
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{data?.student?.full_name ?? "طالب"}</Badge>
            <Button
              size="sm"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => {
                localStorage.removeItem(STUDENT_TOKEN_KEY);
                navigate({ to: "/student", replace: true });
              }}
            >
              <LogOut className="size-4" /> خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        {dashboard.isLoading ? (
          <LoadingState />
        ) : dashboard.isError ? (
          <EmptyState title="تعذر تحميل بياناتك" description="تأكد من صحة كود الطالب أو تواصل مع معلمك." />
        ) : (
          <Tabs defaultValue="schedule">
            <TabsList className="flex w-full flex-wrap">
              <TabsTrigger value="schedule">
                <CalendarCheck className="size-4" /> المواعيد
              </TabsTrigger>
              <TabsTrigger value="exams">
                <FileQuestion className="size-4" /> الاختبارات
              </TabsTrigger>
              <TabsTrigger value="homework">
                <BookOpen className="size-4" /> الواجبات
              </TabsTrigger>
              <TabsTrigger value="attendance">الحضور</TabsTrigger>
              <TabsTrigger value="questions">
                <MessagesSquare className="size-4" /> أسئلتي
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="size-4" /> الإشعارات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedule">
              <Card className="shadow-card">
                <CardContent className="space-y-2 p-5">
                  <p className="text-sm text-muted-foreground">
                    المجموعة: {(data?.group as { name?: string } | null)?.name ?? "غير محددة"}
                  </p>
                  {(data?.schedules ?? []).length === 0 ? (
                    <EmptyState title="لا توجد مواعيد" />
                  ) : (
                    (data?.schedules ?? []).map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <span className="font-medium">{s.day}</span>
                        <span>{s.start_time ?? "—"}</span>
                        <span className="text-muted-foreground">{s.room ?? "—"}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exams">
              <Card className="shadow-card">
                <CardContent className="space-y-3 p-5">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pr-9"
                      placeholder="بحث في الاختبارات"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  {filteredExams.length === 0 ? (
                    <EmptyState title="لا توجد اختبارات متاحة" />
                  ) : (
                    filteredExams.map((e) => {
                      const sub = (data?.submissions ?? []).find((s) => s.exam_id === e.id);
                      return (
                        <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                          <div>
                            <p className="font-semibold">{e.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {e.subject ?? "—"} · {e.duration_minutes} دقيقة · {e.total_score} درجة
                            </p>
                          </div>
                          {sub && !e.allow_retake ? (
                            <Badge variant="secondary">
                              {e.results_published ? `النتيجة: ${Number(sub.percentage).toFixed(0)}%` : "تم التسليم"}
                            </Badge>
                          ) : (
                            <Button asChild size="sm">
                              <Link to="/student/exam/$id" params={{ id: e.id }}>
                                بدء الاختبار
                              </Link>
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="homework">
              <Card className="shadow-card">
                <CardContent className="space-y-3 p-5">
                  {(data?.homework ?? []).length === 0 ? (
                    <EmptyState title="لا توجد واجبات" />
                  ) : (
                    (data?.homework ?? []).map((h) => {
                      const done = (data?.homeworkSubmissions ?? []).some((s) => s.homework_id === h.id);
                      return (
                        <div key={h.id} className="space-y-2 rounded-lg border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold">{h.title}</p>
                            <Badge variant={done ? "default" : "secondary"}>
                              {done ? "تم التسليم" : `تسليم ${formatDate(h.due_date)}`}
                            </Badge>
                          </div>
                          {h.description ? (
                            <p className="text-sm text-muted-foreground">{h.description}</p>
                          ) : null}
                          {!done ? (
                            <div className="space-y-2">
                              <Textarea
                                rows={3}
                                placeholder="اكتب إجابتك..."
                                value={hwAnswers[h.id] ?? ""}
                                onChange={(e) => setHwAnswers((a) => ({ ...a, [h.id]: e.target.value }))}
                              />
                              <Button size="sm" onClick={() => hwMutation.mutate(h.id)} disabled={hwMutation.isPending}>
                                <Send className="size-4" /> تسليم
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <Card className="shadow-card">
                <CardContent className="space-y-2 p-5">
                  {(data?.attendance ?? []).length === 0 ? (
                    <EmptyState title="لا يوجد سجل حضور" />
                  ) : (
                    (data?.attendance ?? []).map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <span>{formatDate(a.date)}</span>
                        <Badge variant={a.status === "present" ? "default" : "secondary"}>
                          {ATTENDANCE_LABEL[a.status] ?? a.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="questions">
              <Card className="shadow-card">
                <CardContent className="space-y-3 p-5">
                  <Textarea
                    rows={3}
                    placeholder="اكتب سؤالك للمعلم..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      if (question.trim().length < 3) {
                        toast.error("اكتب سؤالك أولًا");
                        return;
                      }
                      askMutation.mutate();
                    }}
                    disabled={askMutation.isPending}
                  >
                    <Send className="size-4" /> إرسال السؤال
                  </Button>
                  <div className="space-y-2">
                    {(data?.questions ?? []).map((q) => (
                      <div key={q.id} className="space-y-1 rounded-lg border p-3 text-sm">
                        <p className="font-medium">{q.question}</p>
                        {q.answer ? (
                          <p className="rounded bg-success/10 p-2">{q.answer}</p>
                        ) : (
                          <Badge variant="secondary">بانتظار رد المعلم</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="shadow-card">
                <CardContent className="space-y-2 p-5">
                  {(data?.notifications ?? []).length === 0 ? (
                    <EmptyState title="لا توجد إشعارات" />
                  ) : (
                    (data?.notifications ?? []).map((n) => (
                      <div key={n.id} className="rounded-lg border p-3">
                        <p className="font-semibold">{n.title}</p>
                        {n.body ? <p className="text-sm text-muted-foreground">{n.body}</p> : null}
                        <p className="text-xs text-muted-foreground">{formatDateTime(n.created_at)}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
        <PoweredBy />
      </main>
    </div>
  );
}
