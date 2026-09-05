import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Crown,
  GraduationCap,
  Users,
  KeyRound,
  MessageCircle,
  ArrowLeft,
  CircleCheck as CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo, PoweredBy } from "@/components/negm/Logo";
import { SUPER_ADMIN_EMAIL, TRIAL_MINUTES, WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/negm";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "دليل الاستخدام | منصة نجم لإدارة السناتر" },
      {
        name: "description",
        content:
          "دليل كامل لطريقة الدخول والعمل على منصة نجم: بوابة مالك المنصة، بوابة المعلم/السنتر، وبوابة الطالب، وخطوات بيع وتفعيل التراخيص.",
      },
      { property: "og:title", content: "دليل الاستخدام | منصة نجم" },
      {
        property: "og:description",
        content: "خطوات الدخول لكل بوابة وطريقة إصدار وتفعيل أكواد التراخيص.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuidePage,
});

const SECTIONS = [
  {
    icon: Crown,
    tone: "gold",
    title: "١) بوابة مالك المنصة (Super Admin)",
    entry: "الدخول: الصفحة الرئيسية → «دخول مالك المنصة» → صفحة الدخول ثم يتم تحويلك تلقائيًا إلى /admin",
    steps: [
      `أنشئ حسابًا واحدًا فقط بالبريد ${SUPER_ADMIN_EMAIL} — هذا البريد يحصل على صلاحية مالك المنصة تلقائيًا.`,
      "يمكنك الدخول بجوجل مباشرة بنفس البريد، أو بالبريد وكلمة المرور.",
      "في حالة فقدان كلمة المرور: اضغط «نسيت كلمة المرور؟» في صفحة الدخول ليصلك رابط الاستعادة على بريدك ثم تعيّن كلمة جديدة.",
      "بعد الدخول تفتح لوحة المالك مباشرة: إحصائيات المنصة، السناتر والمعلمون، والتراخيص.",
      "تبويب «السناتر/المعلمون»: بحث بالاسم أو البريد، وإيقاف أو إعادة تفعيل أي معلم فورًا دون حذف بياناته.",
      "تبويب «التراخيص»: إصدار كود ترخيص جديد، نسخه، وإيقافه أو إلغاؤه في أي وقت — الأكواد السرية تظهر هنا مع زر نسخ.",
      "أي حساب آخر يحاول فتح /admin تظهر له رسالة «ليس لديك صلاحية».",
    ],
  },
  {
    icon: GraduationCap,
    tone: "primary",
    title: "٢) بوابة المعلم / السنتر",
    entry: "الدخول: الصفحة الرئيسية → «دخول المعلم» → تسجيل حساب جديد أو دخول بالبريد وكلمة المرور أو جوجل",
    steps: [
      `عند أول دخول تبدأ تجربة مجانية ${TRIAL_MINUTES} دقيقة، ويظهر العدّاد أعلى اللوحة.`,
      "بعد انتهاء التجربة تُغلق اللوحة وتُحوَّل إلى صفحة التفعيل حتى إدخال كود الترخيص.",
      "التبويبات: الرئيسية، الطلاب، المجموعات، الحضور، المدفوعات، الاختبارات (بالذكاء الاصطناعي)، الواجبات، أسئلة الطلاب، كروت الطلاب، شهادات التقدير، التقارير، الإشعارات، النسخ الاحتياطي، الإعدادات.",
      "من «الإعدادات» تضبط اسم السنتر والشعار والتوقيع واعتماد الطلاب تلقائيًا.",
      "عند اعتماد أي طالب يصدر له كود دخول يُسلَّم له لاستخدامه في بوابة الطالب.",
    ],
  },
  {
    icon: Users,
    tone: "muted",
    title: "٣) بوابة الطالب",
    entry: "الدخول: الصفحة الرئيسية → «دخول الطالب» → إدخال كود الطالب الذي أعطاه له المعلم",
    steps: [
      "الطالب الجديد يسجّل بياناته من «تسجيل طالب جديد» ثم ينتظر اعتماد المعلم.",
      "بعد الاعتماد يدخل بالكود ليرى: مواعيد المجموعة، الاختبارات، الواجبات، سجل الحضور، والإشعارات.",
      "يستطيع أداء الاختبارات الإلكترونية ورؤية النتيجة بعد نشر المعلم للنتائج.",
      "يمكنه إرسال سؤال للمعلم ومتابعة الرد داخل نفس البوابة.",
    ],
  },
];

const LICENSE_STEPS = [
  "المعلم يتواصل معك ويدفع قيمة الترخيص.",
  "من لوحة المالك → التراخيص → «إصدار كود» وأدخل بريد المعلم واسمه (اختياري) وملاحظات.",
  "انسخ الكود وأرسله للمعلم عبر واتساب أو البريد.",
  "المعلم يفتح صفحة التفعيل من لوحته ويُدخل الكود فيتحول حسابه إلى «مفعّل مدى الحياة».",
  "الأكواد الموقوفة أو الملغاة لا تعمل، وكل تفعيل يُسجَّل في سجل العمليات.",
];

function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <Link to="/">
            <Logo subtitle="لإدارة السناتر" className="text-primary-foreground" />
          </Link>
          <Button asChild variant="secondary" size="sm">
            <Link to="/">
              الرئيسية <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-12 pt-4 text-center">
          <h1 className="text-3xl font-black sm:text-4xl">دليل الاستخدام وطريقة الدخول</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
            شرح كامل للنوافذ الثلاث: مالك المنصة، المعلم/السنتر، والطالب — وطريقة بيع وتفعيل التراخيص.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-8 max-w-5xl space-y-6 px-4 pb-16">
        {SECTIONS.map((s) => (
          <Card key={s.title} className="overflow-hidden border-0 shadow-soft">
            <div
              className={
                s.tone === "gold"
                  ? "gold-gradient h-1.5"
                  : s.tone === "primary"
                    ? "h-1.5 bg-primary"
                    : "h-1.5 bg-muted-foreground/40"
              }
            />
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div
                className={`grid size-11 place-items-center rounded-2xl ${
                  s.tone === "gold"
                    ? "bg-accent/25 text-accent-foreground"
                    : s.tone === "primary"
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-secondary-foreground"
                }`}
              >
                <s.icon className="size-5" />
              </div>
              <CardTitle className="text-lg">{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="rounded-xl bg-secondary p-3 text-sm font-semibold">{s.entry}</p>
              <ul className="space-y-2">
                {s.steps.map((t) => (
                  <li key={t} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        <Card className="border-0 shadow-soft">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="grid size-11 place-items-center rounded-2xl bg-accent/25 text-accent-foreground">
              <KeyRound className="size-5" />
            </div>
            <CardTitle className="text-lg">بيع وتفعيل الترخيص خطوة بخطوة</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {LICENSE_STEPS.map((t, i) => (
                <li key={t} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <section className="rounded-3xl bg-secondary p-8 text-center">
          <h2 className="text-xl font-black">جاهز للبدء؟</h2>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">دخول المعلم / المالك</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/student">دخول الطالب</Link>
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
