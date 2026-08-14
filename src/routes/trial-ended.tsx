import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MessageCircle, KeyRound, Timer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo, PoweredBy } from "@/components/negm/Logo";
import { LoadingState } from "@/components/negm/states";
import { useAccess } from "@/hooks/useNegm";
import { startTrial } from "@/lib/negm.functions";
import { LICENSE_STATUS_LABEL, TRIAL_MINUTES, WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/negm";

export const Route = createFileRoute("/trial-ended")({
  head: () => ({
    meta: [
      { title: "التجربة والتفعيل | منصة نجم" },
      { name: "description", content: "ابدأ تجربة منصة نجم المجانية أو فعّل ترخيصك مدى الحياة." },
      { property: "og:title", content: "التجربة والتفعيل | منصة نجم" },
      { property: "og:description", content: "تجربة مجانية وتفعيل ترخيص منصة نجم." },
    ],
  }),
  component: TrialEnded,
});

function TrialEnded() {
  const { data, isLoading } = useAccess();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const start = useServerFn(startTrial);

  const mutation = useMutation({
    mutationFn: () => start(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["access"] });
      toast.success(`بدأت تجربتك المجانية لمدة ${TRIAL_MINUTES} دقائق`);
      navigate({ to: "/dashboard" });
    },
    onError: () => toast.error("تعذر بدء التجربة"),
  });

  if (isLoading) return <LoadingState />;

  const neverTried = !data?.trial;
  const suspended = data?.suspended || data?.licenseStatus === "suspended" || data?.licenseStatus === "revoked";

  return (
    <div className="hero-gradient flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Link to="/">
        <Logo size="lg" className="text-primary-foreground" />
      </Link>
      <Card className="w-full max-w-lg shadow-soft">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {suspended
              ? "تم إيقاف الترخيص"
              : neverTried
                ? "ابدأ تجربتك المجانية"
                : "انتهت الفترة التجريبية"}
          </CardTitle>
          <CardDescription>
            {suspended
              ? "ترخيص هذا الحساب موقوف حاليًا. تواصل مع إدارة منصة نجم لإعادة التفعيل."
              : neverTried
                ? `جرّب كل مزايا منصة نجم لمدة ${TRIAL_MINUTES} دقائق.`
                : "يمكنك الحصول على ترخيص منصة نجم مدى الحياة."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {neverTried && !suspended ? (
            <Button className="w-full" size="lg" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Timer className="size-4" />}
              ابدأ التجربة ({TRIAL_MINUTES} دقائق)
            </Button>
          ) : null}

          <div className="rounded-xl bg-secondary p-4 text-center text-sm">
            للتفعيل والتواصل عبر واتساب:{" "}
            <span className="font-bold" dir="ltr">
              {WHATSAPP_NUMBER}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              حالة الترخيص الحالية: {LICENSE_STATUS_LABEL[data?.licenseStatus ?? "pending"]}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild size="lg" className="bg-success text-success-foreground hover:bg-success/90">
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" /> تواصل عبر واتساب
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/activate">
                <KeyRound className="size-4" /> لدي كود تفعيل
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <PoweredBy className="text-primary-foreground/70" />
    </div>
  );
}
