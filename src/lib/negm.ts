export const PLATFORM_NAME = "نجم";
export const PLATFORM_TAGLINE = "منصة نجم لإدارة السناتر والمعلمين والطلاب";
export const WHATSAPP_NUMBER = "01015174084";
export const WHATSAPP_LINK = `https://wa.me/2${WHATSAPP_NUMBER}`;
export const TRIAL_MINUTES = 10;

export const STUDENT_TOKEN_KEY = "negm_student_code";

export const GRADES = [
  "الصف الأول الابتدائي",
  "الصف الثاني الابتدائي",
  "الصف الثالث الابتدائي",
  "الصف الرابع الابتدائي",
  "الصف الخامس الابتدائي",
  "الصف السادس الابتدائي",
  "الصف الأول الإعدادي",
  "الصف الثاني الإعدادي",
  "الصف الثالث الإعدادي",
  "الصف الأول الثانوي",
  "الصف الثاني الثانوي",
  "الصف الثالث الثانوي",
];

export const WEEK_DAYS = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

export const STUDENT_STATUS_LABEL: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  suspended: "موقوف",
};

export const LICENSE_STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار التفعيل",
  trial: "تجريبي",
  active: "مفعّل",
  suspended: "موقوف",
  revoked: "ملغي",
};

export const ATTENDANCE_LABEL: Record<string, string> = {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  excused: "بعذر",
};

export const QUESTION_TYPES: { value: string; label: string }[] = [
  { value: "mcq", label: "اختيار من متعدد" },
  { value: "truefalse", label: "صح وخطأ" },
  { value: "complete", label: "أكمل" },
  { value: "order", label: "ترتيب" },
  { value: "short", label: "إجابة قصيرة" },
  { value: "essay", label: "سؤال مقالي" },
];

export function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(value),
    );
  } catch {
    return value;
  }
}

export function egp(value: number | null | undefined) {
  return `${Number(value ?? 0).toLocaleString("ar-EG")} ج.م`;
}
