import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer, Search, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState, TableSkeleton } from "@/components/negm/states";
import { formatDate } from "@/lib/negm";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({
    meta: [
      { title: "شهادات التقدير | منصة نجم" },
      { name: "description", content: "إصدار وطباعة شهادات تقدير للطلاب المتميزين في سنترك." },
      { property: "og:title", content: "شهادات التقدير | منصة نجم" },
      { property: "og:description", content: "شهادات تقدير أنيقة لطلابك." },
    ],
  }),
  component: CertificatesPage,
});

function CertificatesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason] = useState("التفوق والانضباط خلال الفصل الدراسي");

  const data = useQuery({
    queryKey: ["certificates-data"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      const [students, teacher, settings] = await Promise.all([
        supabase
          .from("students")
          .select("id, full_name, grade, groups(name)")
          .eq("status", "approved")
          .is("deleted_at", null)
          .order("full_name"),
        supabase.from("teachers").select("center_name, full_name").eq("id", uid ?? "").maybeSingle(),
        supabase.from("settings").select("data").eq("teacher_id", uid ?? "").maybeSingle(),
      ]);
      const prefs = (settings.data?.data ?? {}) as { certificate_title?: string; certificate_signature?: string };
      return {
        students: students.data ?? [],
        center: teacher.data?.center_name ?? "سنتر نجم",
        title: prefs.certificate_title ?? "شهادة تقدير",
        signature: prefs.certificate_signature || teacher.data?.full_name || "إدارة السنتر",
      };
    },
  });

  const rows = useMemo(() => {
    const q = search.trim();
    return (data.data?.students ?? []).filter(
      (s) => !q || s.full_name.includes(q) || (s.groups?.name ?? "").includes(q),
    );
  }, [data.data, search]);

  const chosen = (data.data?.students ?? []).filter((s) => selected.includes(s.id));

  return (
    <TeacherShell
      title="شهادات التقدير"
      description="اختر الطلاب واطبع شهاداتهم"
      actions={
        <Button size="sm" onClick={() => window.print()} disabled={chosen.length === 0}>
          <Printer className="size-4" /> طباعة الشهادات
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card print:hidden lg:col-span-1">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <Label>سبب التكريم</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pr-9"
                placeholder="بحث عن طالب"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {data.isLoading ? (
              <TableSkeleton />
            ) : rows.length === 0 ? (
              <EmptyState title="لا يوجد طلاب" />
            ) : (
              <div className="max-h-96 space-y-1 overflow-y-auto">
                {rows.map((s) => (
                  <label key={s.id} className="flex items-center gap-3 rounded-lg border p-2 text-sm">
                    <Checkbox
                      checked={selected.includes(s.id)}
                      onCheckedChange={(checked) =>
                        setSelected((prev) => (checked ? [...prev, s.id] : prev.filter((x) => x !== s.id)))
                      }
                    />
                    <span className="flex-1">{s.full_name}</span>
                    <span className="text-xs text-muted-foreground">{s.groups?.name ?? "—"}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {chosen.length === 0 ? (
            <EmptyState title="اختر طالبًا أو أكثر" description="ستظهر معاينة الشهادة هنا." />
          ) : (
            chosen.map((s) => (
              <div
                key={s.id}
                className="relative overflow-hidden rounded-2xl border-4 border-accent/60 bg-card p-8 text-center shadow-card"
              >
                <div className="gold-gradient absolute inset-x-0 top-0 h-2" />
                <Star className="mx-auto size-8 fill-accent text-accent" />
                <p className="mt-3 text-2xl font-black">{data.data?.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{data.data?.center} — منصة نجم لإدارة السناتر</p>
                <p className="mt-6 text-sm text-muted-foreground">تُمنح هذه الشهادة للطالب/ة</p>
                <p className="mt-2 text-3xl font-black text-primary">{s.full_name}</p>
                <p className="mt-4 text-sm">تقديرًا لـ{reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {s.grade ?? ""} {s.groups?.name ? `· ${s.groups.name}` : ""}
                </p>
                <div className="mt-8 flex items-end justify-between text-xs">
                  <span>{formatDate(new Date().toISOString())}</span>
                  <span className="font-semibold">{data.data?.signature}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </TeacherShell>
  );
}
