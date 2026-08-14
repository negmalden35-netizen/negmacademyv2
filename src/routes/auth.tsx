import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo, PoweredBy } from "@/components/negm/Logo";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "دخول المعلم | منصة نجم" },
      { name: "description", content: "سجل دخولك إلى مساحة سنترك على منصة نجم أو أنشئ حسابًا جديدًا." },
      { property: "og:title", content: "دخول المعلم | منصة نجم" },
      { property: "og:description", content: "دخول وتسجيل المعلمين على منصة نجم." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("بريد إلكتروني غير صحيح").max(255);
const passwordSchema = z.string().min(6, "كلمة المرور 6 أحرف على الأقل").max(72);

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [centerName, setCenterName] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.object({ email: emailSchema, password: passwordSchema }).safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0]!.message);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password });
    setLoading(false);
    if (error) return toast.error("بيانات الدخول غير صحيحة");
    toast.success("تم تسجيل الدخول بنجاح");
    navigate({ to: "/dashboard" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z
      .object({
        email: emailSchema,
        password: passwordSchema,
        fullName: z.string().trim().min(3, "الاسم مطلوب").max(120),
        centerName: z.string().trim().max(120),
      })
      .safeParse({ email, password, fullName, centerName });
    if (!parsed.success) return toast.error(parsed.error.issues[0]!.message);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.fullName, center_name: parsed.data.centerName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message.includes("already") ? "هذا البريد مسجل بالفعل" : "تعذر إنشاء الحساب");
    if (data.session) {
      toast.success("تم إنشاء الحساب");
      navigate({ to: "/dashboard" });
    } else {
      toast.success("تم إرسال رسالة تأكيد إلى بريدك الإلكتروني، فعّل حسابك ثم سجّل الدخول");
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setLoading(false);
      return toast.error("تعذر تسجيل الدخول عبر جوجل");
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="hero-gradient flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Link to="/">
        <Logo size="lg" subtitle="منصة إدارة السناتر" className="text-primary-foreground" />
      </Link>
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <CardTitle>بوابة المعلم</CardTitle>
          <CardDescription>سجّل دخولك أو أنشئ حسابك للبدء بتجربة 10 دقائق مجانية.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="signup">حساب جديد</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form className="space-y-4 pt-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input id="password" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null} دخول
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="space-y-4 pt-4" onSubmit={handleSignup}>
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المعلم</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="center">اسم السنتر (اختياري)</Label>
                  <Input id="center" value={centerName} onChange={(e) => setCenterName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">البريد الإلكتروني</Label>
                  <Input id="email2" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">كلمة المرور</Label>
                  <Input id="password2" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null} إنشاء الحساب
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> أو <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            المتابعة باستخدام جوجل
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            طالب؟{" "}
            <Link to="/student" className="font-semibold text-foreground underline">
              الدخول بكود الطالب
            </Link>
          </p>
        </CardContent>
      </Card>
      <PoweredBy className="text-primary-foreground/70" />
    </div>
  );
}
