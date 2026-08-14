import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo, PoweredBy } from "@/components/negm/Logo";
import { activateLicense } from "@/lib/negm.functions";
import { useSession } from "@/hooks/useNegm";
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/negm";

export const Route = createFileRoute("/activate")({
  head: () => ({
    meta: [
      { title: "تفعيل الترخيص | منصة نجم" },
      { name: "description", content: "أدخل كود ترخيص منصة نجم لتفعيل حسابك مدى الحياة." },
      { property: "og:title", content: "تفعيل الترخيص | منصة نجم" },
      { property: "og:description", content: "تفعيل ترخيص منصة نجم مدى الحياة." },
    ],
  }),
  component: ActivatePage,
});

function ActivatePage() {
  const [code, setCode] = useState("");
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activate = useServerFn(activateLicense);

  const mutation = useMutation({
    mutationFn: (value: string) => activate({ data: { code: value } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["access"] });
      toast.success("تم تفعيل الترخيص بنجاح");
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message || "تعذر تفعيل الترخيص"),
  });

  return (
    <div className="hero-gradient flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Link to="/">
        <Logo size="lg" className="text-primary-foreground" />
      </Link>
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <CardTitle>تفعيل الترخيص</CardTitle>
          <CardDescription>أدخل كود الترخيص المرتبط ببريدك الإلكتروني.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loading && !user ? (
            <div className="rounded-lg bg-secondary p-4 text-center text-sm">
              يجب تسجيل الدخول أولًا لتفعيل الترخيص.
              <div className="mt-3">
                <Button asChild size="sm">
                  <Link to="/auth">تسجيل الدخول</Link>
                </Button>
              </div>
            </div>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!user) {
                toast.error("سجّل الدخول أولًا");
                return;
              }
              if (code.trim().length < 6) {
                toast.error("أدخل كود ترخيص صحيح");
                return;
              }
              mutation.mutate(code.trim().toUpperCase());
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="code">كود الترخيص</Label>
              <Input
                id="code"
                dir="ltr"
                placeholder="NEGM-LIFE-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <Button className="w-full" disabled={mutation.isPending || !user}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              تفعيل
            </Button>
          </form>

          <div className="rounded-lg bg-secondary p-4 text-center text-xs text-muted-foreground">
            للحصول على ترخيص مدى الحياة تواصل عبر واتساب:{" "}
            <span dir="ltr" className="font-bold text-foreground">
              {WHATSAPP_NUMBER}
            </span>
            <div className="mt-3">
              <Button asChild size="sm" className="bg-success text-success-foreground hover:bg-success/90">
                <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" /> تواصل عبر واتساب
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <PoweredBy className="text-primary-foreground/70" />
    </div>
  );
}
