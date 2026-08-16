import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { DatabaseBackup, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, TableSkeleton } from "@/components/negm/states";
import { createBackup } from "@/lib/negm.functions";
import { formatDateTime } from "@/lib/negm";

export const Route = createFileRoute("/_authenticated/backup")({
  head: () => ({
    meta: [
      { title: "النسخ الاحتياطي | منصة نجم" },
      { name: "description", content: "إنشاء نسخ احتياطية من بيانات سنترك وتحميلها بصيغة JSON." },
      { property: "og:title", content: "النسخ الاحتياطي | منصة نجم" },
      { property: "og:description", content: "حماية بيانات سنترك بنسخ احتياطية." },
    ],
  }),
  component: BackupPage,
});

function BackupPage() {
  const queryClient = useQueryClient();
  const backup = useServerFn(createBackup);

  const backups = useQuery({
    queryKey: ["backups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backups")
        .select("id, size_kb, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: () => backup(),
    onSuccess: () => {
      toast.success("تم إنشاء نسخة احتياطية");
      queryClient.invalidateQueries({ queryKey: ["backups"] });
    },
    onError: () => toast.error("تعذر إنشاء النسخة"),
  });

  async function download(id: string) {
    const { data, error } = await supabase.from("backups").select("data, created_at").eq("id", id).maybeSingle();
    if (error || !data) {
      toast.error("تعذر تحميل النسخة");
      return;
    }
    const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `negm-backup-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <TeacherShell
      title="النسخ الاحتياطي"
      description="احتفظ بنسخة آمنة من بيانات سنترك"
      actions={
        <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <DatabaseBackup className="size-4" />}
          نسخة جديدة
        </Button>
      }
    >
      <Card className="shadow-card">
        <CardContent className="p-4 md:p-6">
          {backups.isLoading ? (
            <TableSkeleton />
          ) : (backups.data ?? []).length === 0 ? (
            <EmptyState title="لا توجد نسخ احتياطية" description="أنشئ أول نسخة الآن." />
          ) : (
            <div className="space-y-2">
              {(backups.data ?? []).map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{formatDateTime(b.created_at)}</p>
                    <p className="text-xs text-muted-foreground">{Number(b.size_kb)} كيلوبايت</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => download(b.id)}>
                    <Download className="size-4" /> تحميل
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TeacherShell>
  );
}
