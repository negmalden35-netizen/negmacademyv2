import { supabaseAdmin } from "@/integrations/supabase/client.server";

export function randomCode(len: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function newLicenseKey() {
  return `NEGM-LIFE-${randomCode(4)}-${randomCode(4)}`;
}

export function newStudentCode() {
  return `ST-${randomCode(4)}-${randomCode(4)}`;
}

export async function requireSuperAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (!data) throw new Error("غير مصرح لك بالوصول إلى لوحة مالك المنصة");
  return true;
}

export async function loadAccessState(userId: string) {
  const { data: teacher } = await supabaseAdmin
    .from("teachers")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const { data: trial } = await supabaseAdmin
    .from("trial_sessions")
    .select("*")
    .eq("teacher_id", userId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: license } = await supabaseAdmin
    .from("licenses")
    .select("*")
    .eq("teacher_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isSuperAdmin = (roles ?? []).some((r) => r.role === "super_admin");
  const trialActive = trial ? new Date(trial.ends_at).getTime() > Date.now() : false;
  const licenseActive = teacher?.license_status === "active" && !teacher?.is_suspended;

  return {
    teacher,
    isSuperAdmin,
    license,
    trial,
    trialActive,
    trialEndsAt: trial?.ends_at ?? null,
    hasAccess: isSuperAdmin || licenseActive || trialActive,
    licenseStatus: teacher?.license_status ?? "pending",
    suspended: teacher?.is_suspended ?? false,
  };
}

export async function loadStudentByCode(code: string) {
  const { data: student } = await supabaseAdmin
    .from("students")
    .select("*")
    .eq("student_code", code.trim().toUpperCase())
    .is("deleted_at", null)
    .maybeSingle();
  if (!student) throw new Error("كود الطالب غير صحيح");
  if (student.status !== "approved") throw new Error("لم يتم اعتماد تسجيلك بعد من المعلم");
  const { data: teacher } = await supabaseAdmin
    .from("teachers")
    .select("id, center_name, logo_url, phone, license_status, is_suspended")
    .eq("id", student.teacher_id)
    .maybeSingle();
  return { student, teacher };
}

export async function loadStudentDashboard(code: string) {
  const { student, teacher } = await loadStudentByCode(code);
  const t = student.teacher_id;
  const [group, schedules, attendance, exams, submissions, homework, hwSubs, questions, notifications] =
    await Promise.all([
      student.group_id
        ? supabaseAdmin.from("groups").select("*").eq("id", student.group_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabaseAdmin.from("schedules").select("*").eq("teacher_id", t),
      supabaseAdmin.from("attendance").select("*").eq("student_id", student.id).order("date", { ascending: false }),
      supabaseAdmin
        .from("exams")
        .select("*")
        .eq("teacher_id", t)
        .eq("status", "published")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("exam_submissions").select("*").eq("student_id", student.id),
      supabaseAdmin
        .from("homework")
        .select("*")
        .eq("teacher_id", t)
        .eq("published", true)
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("homework_submissions").select("*").eq("student_id", student.id),
      supabaseAdmin
        .from("student_questions")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("notifications")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  const groupExams = (exams.data ?? []).filter(
    (e) => !e.group_id || e.group_id === student.group_id,
  );
  const groupHomework = (homework.data ?? []).filter(
    (h) => !h.group_id || h.group_id === student.group_id,
  );

  return {
    student,
    teacher,
    group: (group as { data: unknown }).data ?? null,
    schedules: (schedules.data ?? []).filter((s) => !student.group_id || s.group_id === student.group_id),
    attendance: attendance.data ?? [],
    exams: groupExams,
    submissions: submissions.data ?? [],
    homework: groupHomework,
    homeworkSubmissions: hwSubs.data ?? [],
    questions: questions.data ?? [],
    notifications: notifications.data ?? [],
  };
}

export async function loadExamForStudent(code: string, examId: string) {
  const { student } = await loadStudentByCode(code);
  const { data: exam } = await supabaseAdmin
    .from("exams")
    .select("*")
    .eq("id", examId)
    .eq("teacher_id", student.teacher_id)
    .eq("status", "published")
    .maybeSingle();
  if (!exam) throw new Error("الاختبار غير متاح");
  const { data: questions } = await supabaseAdmin
    .from("exam_questions")
    .select("id, type, question, options, score, order_index")
    .eq("exam_id", examId)
    .order("order_index");
  const { data: existing } = await supabaseAdmin
    .from("exam_submissions")
    .select("*")
    .eq("exam_id", examId)
    .eq("student_id", student.id)
    .maybeSingle();
  if (existing && !exam.allow_retake) throw new Error("لقد قمت بحل هذا الاختبار من قبل");
  return { exam, questions: questions ?? [], student };
}

function normalize(value: string) {
  return (value ?? "").toString().trim().replace(/\s+/g, " ").toLowerCase();
}

export async function submitStudentExam(
  code: string,
  examId: string,
  answers: { questionId: string; answer: string }[],
) {
  const { student } = await loadStudentByCode(code);
  const { data: exam } = await supabaseAdmin
    .from("exams")
    .select("*")
    .eq("id", examId)
    .eq("teacher_id", student.teacher_id)
    .maybeSingle();
  if (!exam) throw new Error("الاختبار غير متاح");
  const { data: existing } = await supabaseAdmin
    .from("exam_submissions")
    .select("id")
    .eq("exam_id", examId)
    .eq("student_id", student.id)
    .maybeSingle();
  if (existing && !exam.allow_retake) throw new Error("لا يمكن إرسال الاختبار أكثر من مرة");

  const { data: questions } = await supabaseAdmin
    .from("exam_questions")
    .select("*")
    .eq("exam_id", examId);
  const qMap = new Map((questions ?? []).map((q) => [q.id, q]));

  let score = 0;
  let needsManual = false;
  const rows = answers.map((a) => {
    const q = qMap.get(a.questionId);
    if (!q) return null;
    if (q.type === "essay") {
      needsManual = true;
      return {
        teacher_id: student.teacher_id,
        submission_id: "",
        question_id: q.id,
        answer: a.answer,
        is_correct: null,
        score: 0,
      };
    }
    const correct = normalize(q.correct_answer ?? "") === normalize(a.answer);
    if (correct) score += Number(q.score);
    return {
      teacher_id: student.teacher_id,
      submission_id: "",
      question_id: q.id,
      answer: a.answer,
      is_correct: correct,
      score: correct ? Number(q.score) : 0,
    };
  });

  const total = (questions ?? []).reduce((s, q) => s + Number(q.score), 0) || Number(exam.total_score) || 1;
  const { data: submission, error } = await supabaseAdmin
    .from("exam_submissions")
    .insert({
      teacher_id: student.teacher_id,
      exam_id: examId,
      student_id: student.id,
      submitted_at: new Date().toISOString(),
      score,
      percentage: Math.round((score / total) * 100),
      status: needsManual ? "needs_grading" : "graded",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const withId = rows.filter(Boolean).map((r) => ({ ...r!, submission_id: submission.id }));
  if (withId.length) await supabaseAdmin.from("exam_answers").insert(withId);

  await supabaseAdmin.from("notifications").insert({
    teacher_id: student.teacher_id,
    title: "تم استلام إجابات اختبار",
    body: `${student.full_name} أرسل إجابات اختبار «${exam.title}»`,
  });

  return { ok: true, needsManual };
}
