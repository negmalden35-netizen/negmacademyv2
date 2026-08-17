import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Wallet,
  CalendarCheck,
  MessageCircle,
  ArrowLeft,
  Users,
  Crown,
  IdCard,
  Award,
  BarChart3,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo, PoweredBy } from "@/components/negm/Logo";
import { PLATFORM_TAGLINE, TRIAL_MINUTES, WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/negm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منصة نجم لإدارة السناتر" },
      {
        name: "description",
        content:
          "منصة نجم لإدارة السناتر: بوابة مالك المنصة، بوابة المعلم/السنتر، وبوابة الطالب — طلاب ومجموعات وحضور ومدفوعات واختبارات وتقارير.",
      },
      { property: "og:title", content: "منصة نجم لإدارة السناتر" },
      {
        property: "og:description",
        content: "ثلاث بوابات: مالك المنصة، المعلم/السنتر، والطالب — إدارة كاملة لسنترك.",
      },
    ],
  }),
  component: Landing,
});

const DOORS = [
  {
    to: "/admin",
    icon: Crown,
    title: "بوابة مالك المنصة",
    text: "تفعيل السناتر، إصدار أكواد التراخيص، وإدارة كل المعلمين والاشتراكات.",
    cta: "دخول مالك المنصة",
    tone: "gold",
  },
  {
    to: "/auth",
    icon: GraduationCap,
    title: "بوابة المعلم / السنتر",
    text: "طلاب، مجموعات، حضور، مدفوعات، اختبارات، كروت، شهادات وتقارير مفصلة.",
    cta: "دخول المعلم",
    tone: "primary",
  },
  {
    to: "/student",
    icon: Users,
    title: "بوابة الطالب",
    text: "المواعيد والاختبارات والواجبات والحضور وسؤال المعلم بكود الطالب.",
    cta: "دخول الطالب",
    tone: "muted",
  },
] as const;

const FEATURES = [
  { icon: Users, title: "إدارة الطلاب", text: "تسجيل، اعتماد، أكواد دخول، وملف تفصيلي لكل طالب." },
  { icon: CalendarCheck, title: "الحضور والمواعيد", text: "مجموعات ومواعيد وحصص وسجل حضور تاريخي." },
  { icon: Wallet, title: "المدفوعات", text: "اشتراكات ومتأخرات وتحصيل بضغطة واحدة." },
  { icon: Sparkles, title: "اختبارات بالذكاء الاصطناعي", text: "توليد أسئلة متنوعة وتصحيح تلقائي." },
  { icon: IdCard, title: "كروت الطلاب", text: "كروت جاهزة للطباعة بأكواد الدخول وبيانات المجموعة." },
  { icon: Award, title: "شهادات التقدير", text: "شهادات أنيقة باسم سنترك وتوقيعك." },
  { icon: BarChart3, title: "تقارير مفصلة", text: "حضور ودرجات ومدفوعات لكل طالب مع تصدير CSV." },
  { icon: ShieldCheck, title: "عزل كامل للبيانات", text: "كل معلم يرى بيانات سنتره فقط بحماية على مستوى قاعدة البيانات." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient relative overflow-hidden text-primary-foreground">
        <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-0 size-80 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Logo subtitle="لإدارة السناتر" />
          <div className="hidden gap-2 sm:flex">
            <Button asChild variant="secondary" size="sm">
              <Link to="/auth">دخول المعلم</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/student">دخول الطالب</Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-1.5 text-xs font-semibold">
            <Star className="size-3.5 fill-current" /> تجربة مجانية {TRIAL_MINUTES} دقيقة ثم التفعيل مدى الحياة
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">منصة نجم لإدارة السناتر</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-primary-foreground/85 sm:text-lg">
            {PLATFORM_TAGLINE} — ثلاث بوابات منفصلة: مالك المنصة، المعلم/السنتر، والطالب.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-10 max-w-6xl space-y-16 px-4 pb-16">
        <section className="grid gap-4 md:grid-cols-3">
          {DOORS.map((d) => (
            <Card
              key={d.to}
              className="group relative overflow-hidden border-0 shadow-soft transition-transform hover:-translate-y-1"
            >
              <div
                className={
                  d.tone === "gold"
                    ? "gold-gradient h-1.5"
                    : d.tone === "primary"
                      ? "h-1.5 bg-primary"
                      : "h-1.5 bg-muted-foreground/40"
                }
              />
              <CardContent className="space-y-4 p-6">
                <div
                  className={`grid size-12 place-items-center rounded-2xl ${
                    d.tone === "gold"
                      ? "bg-accent/25 text-accent-foreground"
                      : d.tone === "primary"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <d.icon className="size-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{d.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.text}</p>
                </div>
                <Button asChild className="w-full" variant={d.tone === "muted" ? "outline" : "default"}>
                  <Link to={d.to}>
                    {d.cta} <ArrowLeft className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <section>
          <h2 className="text-center text-2xl font-black sm:text-3xl">كل ما يحتاجه سنترك في مكان واحد</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="h-full shadow-card">
                <CardContent className="space-y-2 p-5">
                  <f.icon className="size-5 text-primary" />
                  <p className="font-bold">{f.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-secondary p-8 text-center">
          <h2 className="text-2xl font-black">جرّب المنصة مجانًا لمدة ساعة</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            بعد انتهاء التجربة يتم إغلاق اللوحة حتى تفعيل الترخيص بكود يُرسل إليك بعد الدفع.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">ابدأ الآن</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" /> واتساب {WHATSAPP_NUMBER}
              </a>
            </Button>
          </div>
        </section>

        <PoweredBy />
      </main>
    </div>
  );
}
