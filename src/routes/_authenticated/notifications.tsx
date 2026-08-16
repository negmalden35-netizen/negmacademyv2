import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Send, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, TableSkeleton } from "@/components/negm/states";
import { formatDateTime } from "@/lib/negm";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات | منصة نجم" },
      { name: "description", content: "أرسل إشعارات لطلابك وتابع سجل الإشعارات السابقة." },
      { property: "og:title", content: "الإشعارات | منصة نجم" },
      { property: "og:description", content: "إشعارات الطلاب على منصة نجم." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");

  const students = useQuery({
    queryKey: ["students-simple"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("status", "approved")
        .is("deleted_at", null)
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, students(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("no user");
      const rows =
        target === "all"
          ? (students.data ?? []).map((s) => ({
              teacher_id: uid,
              student_id: s.id,
              title: title.trim(),
              body: body.trim() || null,
            }))
          : [{ teacher_id: uid, student_id: target, title: title.trim(), body: body.trim() || null }];
      if (rows.length === 0) throw new Error("لا يوجد طلاب");
      const { error } = await supabase.from("notifications").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إرسال الإشعار");
      setTitle("");
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => toast.error("تعذر إرسال الإشعار"),
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const rows = useMemo(() => {
    const q = search.trim();
    return (notifications.data ?? []).filter(
      (n) =>
        !q ||
        n.title.includes(q) ||
        (n.body ?? "").includes(q) ||
        (n.students?.full_name ?? "").includes(q),
    );
  }, [notifications.data, search]);

  return (
    <TeacherShell title="الإشعارات" description="تواصل سريع مع طلابك">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-1">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <Label>المستلم</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الطلاب</SelectItem>
                  {(students.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>النص</Label>
              <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (title.trim().length < 2) {
                  toast.error("اكتب عنوان الإشعار");
                  return;
                }
                send.mutate();
              }}
              disabled={send.isPending}
            >
              <Send className="size-4" /> إرسال
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardContent className="space-y-4 p-5">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pr-9"
                placeholder="بحث في الإشعارات"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {notifications.isLoading ? (
              <TableSkeleton />
            ) : rows.length === 0 ? (
              <EmptyState title="لا توجد إشعارات" />
            ) : (
              <div className="space-y-2">
                {rows.map((n) => (
                  <div key={n.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{n.title}</p>
                      {n.body ? <p className="text-sm text-muted-foreground">{n.body}</p> : null}
                      <p className="text-xs text-muted-foreground">
                        {n.students?.full_name ?? "كل الطلاب"} · {formatDateTime(n.created_at)}
                      </p>
                    </div>
                    {n.is_read ? (
                      <Badge variant="secondary">مقروء</Badge>
                    ) : (
                      <Button size="icon" variant="ghost" onClick={() => markRead.mutate(n.id)}>
                        <CheckCheck className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TeacherShell>
  );
}
