import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer, Search, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, TableSkeleton } from "@/components/negm/states";

export const Route = createFileRoute("/_authenticated/cards")({
  head: () => ({
    meta: [
      { title: "كروت الطلاب | منصة نجم" },
      { name: "description", content: "تصميم وطباعة كروت الطلاب بأكواد الدخول وبيانات المجموعة." },
      { property: "og:title", content: "كروت الطلاب | منصة نجم" },
      { property: "og:description", content: "كروت طباعة أنيقة لطلاب سنترك." },
    ],
  }),
  component: CardsPage,
});

function CardsPage() {
  const [search, setSearch] = useState("");

  const data = useQuery({
    queryKey: ["cards-data"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      const [students, teacher, settings] = await Promise.all([
        supabase
          .from("students")
          .select("id, full_name, student_code, grade, phone, groups(name)")
          .eq("status", "approved")
          .is("deleted_at", null)
          .order("full_name"),
        supabase.from("teachers").select("center_name, phone").eq("id", uid ?? "").maybeSingle(),
        supabase.from("settings").select("data").eq("teacher_id", uid ?? "").maybeSingle(),
      ]);
      return {
        students: students.data ?? [],
        center: teacher.data?.center_name ?? "سنتر نجم",
        centerPhone: teacher.data?.phone ?? "",
        note:
          ((settings.data?.data as { card_note?: string } | null)?.card_note ??
            "يرجى الاحتفاظ بالكارت وإحضاره في كل حصة."),
      };
    },
  });

  const rows = useMemo(() => {
    const q = search.trim();
    return (data.data?.students ?? []).filter(
      (s) =>
        !q ||
        s.full_name.includes(q) ||
        (s.student_code ?? "").toUpperCase().includes(q.toUpperCase()) ||
        (s.groups?.name ?? "").includes(q),
    );
  }, [data.data, search]);

  return (
    <TeacherShell
      title="كروت الطلاب"
      description="اطبع كروت الطلاب بأكواد الدخول"
      actions={
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" /> طباعة
        </Button>
      }
    >
      <div className="mb-4 print:hidden">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pr-9"
            placeholder="بحث بالاسم أو الكود أو المجموعة"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {data.isLoading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState title="لا توجد كروت" description="اعتمد الطلاب أولًا لإصدار الكروت." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => (
            <Card key={s.id} className="overflow-hidden border-0 shadow-card">
              <div className="hero-gradient flex items-center justify-between px-4 py-3 text-primary-foreground">
                <div className="flex items-center gap-2">
                  <Star className="size-4 fill-current" />
                  <span className="text-sm font-bold">{data.data?.center}</span>
                </div>
                <span className="text-[10px] opacity-80">منصة نجم</span>
              </div>
              <CardContent className="space-y-2 p-4">
                <p className="text-lg font-bold">{s.full_name}</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>الصف: {s.grade ?? "—"}</span>
                  <span>المجموعة: {s.groups?.name ?? "—"}</span>
                  <span dir="ltr">{s.phone ?? "—"}</span>
                </div>
                <div className="rounded-lg bg-accent/20 px-3 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">كود الدخول</p>
                  <p dir="ltr" className="font-mono text-base font-bold tracking-widest">
                    {s.student_code}
                  </p>
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground">{data.data?.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </TeacherShell>
  );
}
