import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo, PoweredBy } from "@/components/negm/Logo";
import { studentLogin } from "@/lib/negm.functions";
import { STUDENT_TOKEN_KEY } from "@/lib/negm";

export const Route = createFileRoute("/student/")({
  head: () => ({
    meta: [
      { title: "دخول الطالب | منصة نجم" },
      { name: "description", content: "ادخل إلى صفحتك على منصة نجم باستخدام كود الطالب الخاص بك." },
      { property: "og:title", content: "دخول الطالب | منصة نجم" },
      { property: "og:description", content: "دخول الطلاب بكود الطالب على منصة نجم." },
    ],
  }),
  component: StudentLogin,
});

function StudentLogin() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const login = useServerFn(studentLogin);

  const mutation = useMutation({
    mutationFn: (value: string) => login({ data: { code: value } }),
    onSuccess: (result, value) => {
      localStorage.setItem(STUDENT_TOKEN_KEY, value);
      toast.success(`أهلًا ${result.name}`);
      navigate({ to: "/student/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message || "تعذر تسجيل الدخول"),
  });

  return (
    <div className="hero-gradient flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Link to="/">
        <Logo size="lg" className="text-primary-foreground" />
      </Link>
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <CardTitle>دخول الطالب</CardTitle>
          <CardDescription>أدخل كود الطالب الذي حصلت عليه من معلمك.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const value = code.trim().toUpperCase();
              if (value.length < 6) {
                toast.error("أدخل كود طالب صحيح");
                return;
              }
              mutation.mutate(value);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="code">كود الطالب</Label>
              <Input id="code" dir="ltr" placeholder="ST-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <Button className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              دخول
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            لست مسجلًا بعد؟{" "}
            <Link to="/student/register" className="font-semibold text-foreground underline">
              تسجيل طالب جديد
            </Link>
          </p>
        </CardContent>
      </Card>
      <PoweredBy className="text-primary-foreground/70" />
    </div>
  );
}
