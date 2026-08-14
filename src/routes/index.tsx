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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo, PoweredBy } from "@/components/negm/Logo";
import { PLATFORM_TAGLINE, WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/negm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نجم | منصة إدارة السناتر والمعلمين والطلاب" },
      {
        name: "description",
        content:
          "منصة نجم لإدارة السناتر: طلاب ومجموعات وحضور ومدفوعات واختبارات تفاعلية بالذكاء الاصطناعي، مساحة مستقلة لكل معلم.",
      },
      { property: "og:title", content: "نجم | منصة إدارة السناتر والمعلمين والطلاب" },
      {
        property: "og:description",
        content: "مساحة مستقلة لكل معلم: طلاب، مجموعات، حضور، مدفوعات، اختبارات وواجبات.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Users, title: "إدارة الطلاب", text: "تسجيل، اعتماد، أكواد دخول، وملف تفصيلي لكل طالب." },
  { icon: CalendarCheck, title: "الحضور والمواعيد", text: "مجموعات ومواعيد وحصص وسجل حضور تاريخي." },
  { icon: Wallet, title: "المدفوعات", text: "اشتراكات ومتأخرات وتقارير لكل مجموعة." },
  { icon: Sparkles, title: "اختبارات بالذكاء الاصطناعي", text: "توليد أسئلة ومراجعتها قبل الإرسال." },
  { icon: ShieldCheck, title: "عزل كامل للبيانات", text: "كل معلم يرى بيانات سنتره فقط، حماية على مستوى قاعدة البيانات." },
  { icon: GraduationCap, title: "صفحة الطالب", text: "مواعيد، اختبارات، واجبات، حضور، وسؤال المعلم." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="hero-gradient text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Logo subtitle="منصة إدارة السناتر" />
          <div className="flex gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link to="/auth">دخول المعلم</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/student">دخول الطالب</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 text-center">
          <p className="mx-auto w-fit rounded-full bg-primary-foreground/10 px-4 py-1 text-xs font-semibold">
            ترخيص مدى الحياة · تجربة مجانية 10 دقائق
          </p>
          <h1 className="mt-6 text-3xl font-black leading-tight md:text-5xl">{PLATFORM_TAGLINE}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/80 md:text-base">
            نظام متكامل يدير سنترك بالكامل: الطلاب، المجموعات، الحضور، المدفوعات، الاختبارات
            التفاعلية والواجبات — مع مساحة مستقلة تمامًا لكل معلم.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gold-gradient text-gold-foreground hover:opacity-90">
              <Link to="/auth">
                ابدأ التجربة المجانية <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/student/register">تسجيل طالب جديد</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold">كل ما يحتاجه سنترك في مكان واحد</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="shadow-card transition-shadow hover:shadow-soft">
              <CardContent className="space-y-2 p-6">
                <div className="grid size-11 place-items-center rounded-xl bg-accent/20 text-accent-foreground">
                  <f.icon className="size-5" />
                </div>
                <p className="pt-2 font-bold">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mt-16 rounded-2xl bg-secondary p-8 text-center">
          <h2 className="text-2xl font-bold">ترخيص مدى الحياة لمنصة نجم</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            جرّب المنصة 10 دقائق مجانًا، وللحصول على الترخيص الدائم تواصل معنا عبر واتساب على الرقم{" "}
            <span className="font-bold text-foreground">{WHATSAPP_NUMBER}</span>
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-success text-success-foreground hover:bg-success/90">
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" /> تواصل عبر واتساب
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/activate">لدي كود تفعيل</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <PoweredBy />
      </footer>
    </div>
  );
}
