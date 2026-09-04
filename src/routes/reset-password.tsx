import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo, PoweredBy } from "@/components/negm/Logo";
import { Loader as Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "إعادة تعيين كلمة المرور | منصة نجم" },
      { name: "description", content: "اختر كلمة مرور جديدة لحسابك على منصة نجم لإدارة السناتر." },
      { property: "og:title", content: "إعادة تعيين كلمة المرور | منصة نجم" },
      { property: "og:description", content: "استعادة الدخول إلى حسابك على منصة نجم." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setHasSession(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().min(6, "كلمة المرور 6 أحرف على الأقل").max(72).safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    if (password !== confirm) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("تعذر تغيير كلمة المرور، اطلب رابطًا جديدًا");
      return;
    }
    toast.success("تم تغيير كلمة المرور بنجاح");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="hero-gradient flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo size="lg" subtitle="لإدارة السناتر" className="text-primary-foreground" />
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <CardTitle>كلمة مرور جديدة</CardTitle>
          <CardDescription>
            {ready && !hasSession
              ? "افتح رابط الاستعادة من بريدك الإلكتروني أولًا ثم اختر كلمة المرور الجديدة."
              : "اختر كلمة مرور جديدة لحسابك."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="np">كلمة المرور الجديدة</Label>
              <Input id="np" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="np2">تأكيد كلمة المرور</Label>
              <Input id="np2" type="password" dir="ltr" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button className="w-full" disabled={loading || (ready && !hasSession)}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null} حفظ كلمة المرور
            </Button>
          </form>
        </CardContent>
      </Card>
      <PoweredBy className="text-primary-foreground/70" />
    </div>
  );
}
