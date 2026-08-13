import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/* ---------------------------------- المعلم --------------------------------- */

export const getAccessState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadAccessState } = await import("./negm.server");
    return loadAccessState(context.userId);
  });

export const startTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { loadAccessState } = await import("./negm.server");
    const state = await loadAccessState(context.userId);
    if (state.licenseStatus === "active") return state;
    if (state.trial) return state;
    await supabaseAdmin.from("trial_sessions").insert({ teacher_id: context.userId });
    await supabaseAdmin
      .from("teachers")
      .update({ license_status: "trial" })
      .eq("id", context.userId)
      .neq("license_status", "active");
    return loadAccessState(context.userId);
  });

export const activateLicense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().trim().min(6).max(64) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { loadAccessState } = await import("./negm.server");
    const key = data.code.trim().toUpperCase();
    const { data: license } = await supabaseAdmin
      .from("licenses")
      .select("*")
      .eq("license_key", key)
      .maybeSingle();
    if (!license) throw new Error("كود التفعيل غير صحيح");
    if (license.status === "revoked" || license.status === "suspended")
      throw new Error("هذا الترخيص غير صالح للاستخدام، تواصل مع الدعم");
    if (license.teacher_id && license.teacher_id !== context.userId)
      throw new Error("هذا الترخيص مرتبط بمعلم آخر");

    const email = (context.claims?.["email"] as string | undefined)?.toLowerCase() ?? "";
    if (license.email && license.email.toLowerCase() !== email)
      throw new Error("هذا الترخيص مرتبط ببريد إلكتروني آخر");

    await supabaseAdmin
      .from("licenses")
      .update({
        teacher_id: context.userId,
        email: license.email ?? email,
        status: "active",
        activated_at: new Date().toISOString(),
      })
      .eq("id", license.id);
    await supabaseAdmin
      .from("teachers")
      .update({ license_status: "active", is_suspended: false })
      .eq("id", context.userId);
    await supabaseAdmin.from("audit_logs").insert({
      teacher_id: context.userId,
      action: "تفعيل ترخيص",
      entity: "licenses",
      details: { license_key: key },
    });
    return loadAccessState(context.userId);
  });

export const approveStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ studentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { newStudentCode } = await import("./negm.server");
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("*")
      .eq("id", data.studentId)
      .eq("teacher_id", context.userId)
      .maybeSingle();
    if (!student) throw new Error("الطالب غير موجود");
    let code = student.student_code;
    if (!code) {
      for (let i = 0; i < 6; i++) {
        const candidate = newStudentCode();
        const { data: exists } = await supabaseAdmin
          .from("students")
          .select("id")
          .eq("student_code", candidate)
          .maybeSingle();
        if (!exists) {
          code = candidate;
          break;
        }
      }
    }
    await supabaseAdmin
      .from("students")
      .update({ status: "approved", student_code: code })
      .eq("id", student.id);
    await supabaseAdmin.from("notifications").insert({
      teacher_id: context.userId,
      student_id: student.id,
      title: "تم اعتماد تسجيلك",
      body: `كود الدخول الخاص بك: ${code}`,
    });
    await supabaseAdmin.from("audit_logs").insert({
      teacher_id: context.userId,
      action: "اعتماد طالب",
      entity: "students",
      details: { student_id: student.id, code },
    });
    return { code };
  });

export const regenerateStudentCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ studentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { newStudentCode } = await import("./negm.server");
    const code = newStudentCode();
    const { error } = await supabaseAdmin
      .from("students")
      .update({ student_code: code })
      .eq("id", data.studentId)
      .eq("teacher_id", context.userId);
    if (error) throw new Error(error.message);
    return { code };
  });

export const createBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tables = ["students", "groups", "schedules", "attendance", "payments", "exams", "homework"];
    const snapshot: Record<string, unknown> = {};
    for (const table of tables) {
      const { data } = await supabaseAdmin.from(table).select("*").eq("teacher_id", context.userId);
      snapshot[table] = data ?? [];
    }
    const size = Math.round(JSON.stringify(snapshot).length / 1024);
    const { data: backup, error } = await supabaseAdmin
      .from("backups")
      .insert({ teacher_id: context.userId, data: snapshot, size_kb: size })
      .select("id, created_at, size_kb")
      .single();
    if (error) throw new Error(error.message);
    return backup;
  });

export const generateAiExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        subject: z.string().trim().min(1).max(80),
        grade: z.string().trim().min(1).max(80),
        topic: z.string().trim().min(1).max(200),
        count: z.number().int().min(1).max(20),
        difficulty: z.string().trim().min(1).max(40),
        types: z.array(z.string().max(20)).min(1).max(6),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const prompt = `أنت معلم خبير. أنشئ ${data.count} سؤالاً باللغة العربية في مادة ${data.subject} لـ${data.grade} حول موضوع: ${data.topic}. مستوى الصعوبة: ${data.difficulty}. أنواع الأسئلة المسموحة فقط: ${data.types.join(", ")}.
أعد النتيجة بصيغة JSON فقط بدون أي شرح، بالشكل:
{"questions":[{"type":"mcq|truefalse|complete|order|short|essay","question":"نص السؤال","options":["..."],"correct_answer":"الإجابة الصحيحة","score":1}]}
للأسئلة من نوع mcq ضع 4 اختيارات، ولـ truefalse ضع ["صح","خطأ"]، ولباقي الأنواع اترك options فارغة.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        messages: [
          { role: "system", content: "أنت مولد اختبارات تعليمية. أجب بصيغة JSON صالحة فقط." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (res.status === 429) throw new Error("تم تجاوز حد الاستخدام، حاول بعد قليل");
    if (res.status === 402) throw new Error("رصيد الذكاء الاصطناعي غير كافٍ");
    if (!res.ok) throw new Error("تعذر إنشاء الاختبار بالذكاء الاصطناعي");
    const json = (await res.json()) as { choices: { message: { content: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("تعذر قراءة الأسئلة المولدة");
    const parsed = JSON.parse(match[0]) as {
      questions: {
        type: string;
        question: string;
        options?: string[];
        correct_answer?: string;
        score?: number;
      }[];
    };
    return { questions: parsed.questions ?? [] };
  });

/* ------------------------------- مالك المنصة ------------------------------- */

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requireSuperAdmin } = await import("./negm.server");
    await requireSuperAdmin(context.userId);
    const [teachers, licenses, students, groups, exams, trials] = await Promise.all([
      supabaseAdmin.from("teachers").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("licenses").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("students").select("id, teacher_id"),
      supabaseAdmin.from("groups").select("id"),
      supabaseAdmin.from("exams").select("id"),
      supabaseAdmin.from("trial_sessions").select("*").order("started_at", { ascending: false }),
    ]);
    return {
      teachers: teachers.data ?? [],
      licenses: licenses.data ?? [],
      trials: trials.data ?? [],
      counts: {
        teachers: teachers.data?.length ?? 0,
        students: students.data?.length ?? 0,
        groups: groups.data?.length ?? 0,
        exams: exams.data?.length ?? 0,
        licenses: licenses.data?.length ?? 0,
        active: (licenses.data ?? []).filter((l) => l.status === "active").length,
        trial: (licenses.data ?? []).filter((l) => l.status === "trial").length,
        suspended: (licenses.data ?? []).filter((l) => l.status === "suspended").length,
      },
      studentsByTeacher: (students.data ?? []).reduce<Record<string, number>>((acc, s) => {
        acc[s.teacher_id] = (acc[s.teacher_id] ?? 0) + 1;
        return acc;
      }, {}),
    };
  });

export const adminCreateLicense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        teacherName: z.string().trim().min(2).max(120),
        notes: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requireSuperAdmin, newLicenseKey } = await import("./negm.server");
    await requireSuperAdmin(context.userId);
    const { data: teacher } = await supabaseAdmin
      .from("teachers")
      .select("id")
      .ilike("email", data.email)
      .maybeSingle();
    const { data: license, error } = await supabaseAdmin
      .from("licenses")
      .insert({
        license_key: newLicenseKey(),
        email: data.email.toLowerCase(),
        teacher_name: data.teacherName,
        teacher_id: teacher?.id ?? null,
        notes: data.notes ?? null,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return license;
  });

export const adminSetLicenseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        licenseId: z.string().uuid(),
        status: z.enum(["pending", "trial", "active", "suspended", "revoked"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requireSuperAdmin } = await import("./negm.server");
    await requireSuperAdmin(context.userId);
    const { data: license, error } = await supabaseAdmin
      .from("licenses")
      .update({
        status: data.status,
        activated_at: data.status === "active" ? new Date().toISOString() : null,
      })
      .eq("id", data.licenseId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (license.teacher_id) {
      await supabaseAdmin
        .from("teachers")
        .update({
          license_status: data.status,
          is_suspended: data.status === "suspended" || data.status === "revoked",
        })
        .eq("id", license.teacher_id);
    }
    return license;
  });

export const adminSetTeacherSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ teacherId: z.string().uuid(), suspended: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requireSuperAdmin } = await import("./negm.server");
    await requireSuperAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("teachers")
      .update({ is_suspended: data.suspended })
      .eq("id", data.teacherId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------------- الطالب --------------------------------- */

export const listPublicTeachers = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("teachers")
    .select("id, center_name, full_name")
    .eq("is_suspended", false)
    .order("created_at");
  return data ?? [];
});

export const registerStudent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        teacherId: z.string().uuid(),
        fullName: z.string().trim().min(6).max(120),
        gender: z.string().trim().max(20).optional(),
        birthDate: z.string().trim().max(20).optional(),
        phone: z.string().trim().min(6).max(20),
        guardianPhone: z.string().trim().max(20).optional(),
        school: z.string().trim().max(120).optional(),
        grade: z.string().trim().max(80).optional(),
        section: z.string().trim().max(80).optional(),
        address: z.string().trim().max(200).optional(),
        subject: z.string().trim().max(80).optional(),
        groupId: z.string().uuid().optional().nullable(),
        notes: z.string().trim().max(500).optional(),
        photoUrl: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("students").insert({
      teacher_id: data.teacherId,
      full_name: data.fullName,
      gender: data.gender ?? null,
      birth_date: data.birthDate || null,
      phone: data.phone,
      guardian_phone: data.guardianPhone ?? null,
      school: data.school ?? null,
      grade: data.grade ?? null,
      section: data.section ?? null,
      address: data.address ?? null,
      subject: data.subject ?? null,
      group_id: data.groupId || null,
      notes: data.notes ?? null,
      photo_url: data.photoUrl ?? null,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("notifications").insert({
      teacher_id: data.teacherId,
      title: "طلب تسجيل طالب جديد",
      body: `${data.fullName} أرسل طلب تسجيل جديد`,
    });
    return { ok: true };
  });

export const listTeacherGroups = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ teacherId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: groups } = await supabaseAdmin
      .from("groups")
      .select("id, name, grade, subject")
      .eq("teacher_id", data.teacherId);
    return groups ?? [];
  });

const codeSchema = z.string().trim().min(6).max(32);

export const studentLogin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ code: codeSchema }).parse(input))
  .handler(async ({ data }) => {
    const { loadStudentByCode } = await import("./negm.server");
    const { student, teacher } = await loadStudentByCode(data.code);
    return { id: student.id, name: student.full_name, center: teacher?.center_name ?? "" };
  });

export const studentDashboard = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ code: codeSchema }).parse(input))
  .handler(async ({ data }) => {
    const { loadStudentDashboard } = await import("./negm.server");
    return loadStudentDashboard(data.code);
  });

export const studentExam = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ code: codeSchema, examId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { loadExamForStudent } = await import("./negm.server");
    const result = await loadExamForStudent(data.code, data.examId);
    return { exam: result.exam, questions: result.questions };
  });

export const studentSubmitExam = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        code: codeSchema,
        examId: z.string().uuid(),
        answers: z
          .array(z.object({ questionId: z.string().uuid(), answer: z.string().max(4000) }))
          .max(100),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { submitStudentExam } = await import("./negm.server");
    return submitStudentExam(data.code, data.examId, data.answers);
  });

export const studentAskQuestion = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ code: codeSchema, question: z.string().trim().min(3).max(1000) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { loadStudentByCode } = await import("./negm.server");
    const { student } = await loadStudentByCode(data.code);
    const { error } = await supabaseAdmin.from("student_questions").insert({
      teacher_id: student.teacher_id,
      student_id: student.id,
      question: data.question,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("notifications").insert({
      teacher_id: student.teacher_id,
      title: "سؤال جديد من طالب",
      body: `${student.full_name}: ${data.question.slice(0, 80)}`,
    });
    return { ok: true };
  });

export const studentSubmitHomework = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        code: codeSchema,
        homeworkId: z.string().uuid(),
        answers: z.array(z.string().max(4000)).max(50),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { loadStudentByCode } = await import("./negm.server");
    const { student } = await loadStudentByCode(data.code);
    const { error } = await supabaseAdmin.from("homework_submissions").insert({
      teacher_id: student.teacher_id,
      homework_id: data.homeworkId,
      student_id: student.id,
      answers: data.answers,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
