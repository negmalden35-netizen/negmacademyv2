import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/negm/states";
import { LICENSE_STATUS_LABEL, WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/negm";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "إعدادات المعلم | منصة نجم" },
      { name: "description", content: "إعدادات السنتر: الاسم والشعار وبيانات التواصل وتفضيلات المنصة." },
      { property: "og:title", content: "إعدادات المعلم | منصة نجم" },
      { property: "og:description", content: "خصص منصتك حسب سنترك." },
    ],
  }),
  component: SettingsPage,
});

type Prefs = {
  certificate_title: string;
  certificate_signature: string;
  card_note: string;
  auto_approve: boolean;
  show_results: boolean;
};

const DEFAULT_PREFS: Prefs = {
  certificate_title: "شهادة تقدير",
  certificate_signature: "",
  card_note: "يرجى الاحتفاظ بالكارت وإحضاره في كل حصة.",
  auto_approve: false,
  show_results: true,
};

function SettingsPage() {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState({ full_name: "", center_name: "", phone: "", logo_url: "" });
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  const data = useQuery({
    queryKey: ["teacher-settings"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("no user");
      const [teacher, settings] = await Promise.all([
        supabase.from("teachers").select("*").eq("id", uid).maybeSingle(),
        supabase.from("settings").select("*").eq("teacher_id", uid).maybeSingle(),
      ]);
      return { uid, teacher: teacher.data, settings: settings.data };
    },
  });

  useEffect(() => {
    if (!data.data?.teacher) return;
    const t = data.data.teacher;
    setProfile({
      full_name: t.full_name ?? "",
      center_name: t.center_name ?? "",
      phone: t.phone ?? "",
      logo_url: t.logo_url ?? "",
    });
    setPrefs({ ...DEFAULT_PREFS, ...((data.data.settings?.data as Partial<Prefs>) ?? {}) });
  }, [data.data]);

  const save = useMutation({
    mutationFn: async () => {
      const uid = data.data?.uid;
      if (!uid) throw new Error("no user");
      const { error } = await supabase
        .from("teachers")
        .update({
          full_name: profile.full_name.trim(),
          center_name: profile.center_name.trim() || "سنتر نجم",
          phone: profile.phone.trim() || null,
          logo_url: profile.logo_url.trim() || null,
        })
        .eq("id", uid);
      if (error) throw error;
      const { error: sError } = await supabase
        .from("settings")
        .upsert({ teacher_id: uid, data: prefs, updated_at: new Date().toISOString() });
      if (sError) throw sError;
    },
    onSuccess: () => {
      toast.success("تم حفظ الإعدادات");
      queryClient.invalidateQueries({ queryKey: ["teacher-settings"] });
      queryClient.invalidateQueries({ queryKey: ["access"] });
    },
    onError: () => toast.error("تعذر حفظ الإعدادات"),
  });

  if (data.isLoading) return <TeacherShell title="الإعدادات"><LoadingState /></TeacherShell>;

  return (
    <TeacherShell title="الإعدادات" description="بيانات السنتر وتفضيلات المنصة">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">بيانات السنتر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المعلم</Label>
              <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>اسم السنتر</Label>
              <Input value={profile.center_name} onChange={(e) => setProfile({ ...profile, center_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input dir="ltr" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>رابط الشعار</Label>
              <Input dir="ltr" value={profile.logo_url} onChange={(e) => setProfile({ ...profile, logo_url: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">تفضيلات المنصة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان شهادة التقدير</Label>
              <Input value={prefs.certificate_title} onChange={(e) => setPrefs({ ...prefs, certificate_title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>اسم التوقيع على الشهادة</Label>
              <Input value={prefs.certificate_signature} onChange={(e) => setPrefs({ ...prefs, certificate_signature: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>ملاحظة كارت الطالب</Label>
              <Textarea rows={3} value={prefs.card_note} onChange={(e) => setPrefs({ ...prefs, card_note: e.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">اعتماد الطلاب تلقائيًا</p>
                <p className="text-xs text-muted-foreground">قبول طلبات التسجيل الجديدة بدون مراجعة.</p>
              </div>
              <Switch checked={prefs.auto_approve} onCheckedChange={(v) => setPrefs({ ...prefs, auto_approve: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">إظهار نتائج الاختبارات للطلاب</p>
                <p className="text-xs text-muted-foreground">يمكن التحكم بكل اختبار على حدة أيضًا.</p>
              </div>
              <Switch checked={prefs.show_results} onCheckedChange={(v) => setPrefs({ ...prefs, show_results: v })} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">الاشتراك والدعم</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">
              حالة الترخيص: {LICENSE_STATUS_LABEL[data.data?.teacher?.license_status ?? "pending"]}
            </Badge>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-success underline"
              dir="ltr"
            >
              {WHATSAPP_NUMBER}
            </a>
          </CardContent>
        </Card>
      </div>

      <Button className="mt-4" onClick={() => save.mutate()} disabled={save.isPending}>
        <Save className="size-4" /> حفظ الإعدادات
      </Button>
    </TeacherShell>
  );
}
