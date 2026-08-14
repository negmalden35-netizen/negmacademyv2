import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo, PoweredBy } from "@/components/negm/Logo";
import { listPublicTeachers, listTeacherGroups, registerStudent } from "@/lib/negm.functions";
import { GRADES } from "@/lib/negm";

export const Route = createFileRoute("/student/register")({
  head: () => ({
    meta: [
      { title: "تسجيل طالب جديد | منصة نجم" },
      { name: "description", content: "سجّل بياناتك كطالب جديد لدى معلمك على منصة نجم وانتظر اعتماد التسجيل." },
      { property: "og:title", content: "تسجيل طالب جديد | منصة نجم" },
      { property: "og:description", content: "استمارة تسجيل الطلاب على منصة نجم." },
    ],
  }),
  component: StudentRegister,
});

function StudentRegister() {
  const navigate = useNavigate();
  const fetchTeachers = useServerFn(listPublicTeachers);
  const fetchGroups = useServerFn(listTeacherGroups);
  const register = useServerFn(registerStudent);

  const [teacherId, setTeacherId] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    birthDate: "",
    phone: "",
    guardianPhone: "",
    school: "",
    grade: "",
    section: "",
    address: "",
    subject: "",
    groupId: "",
    notes: "",
    photoUrl: "",
  });

  const teachers = useQuery({ queryKey: ["public-teachers"], queryFn: () => fetchTeachers() });
  const groups = useQuery({
    queryKey: ["public-groups", teacherId],
    queryFn: () => fetchGroups({ data: { teacherId } }),
    enabled: !!teacherId,
  });

  const mutation = useMutation({
    mutationFn: () =>
      register({
        data: {
          teacherId,
          fullName: form.fullName.trim(),
          gender: form.gender || undefined,
          birthDate: form.birthDate || undefined,
          phone: form.phone.trim(),
          guardianPhone: form.guardianPhone || undefined,
          school: form.school || undefined,
          grade: form.grade || undefined,
          section: form.section || undefined,
          address: form.address || undefined,
          subject: form.subject || undefined,
          groupId: form.groupId || null,
          notes: form.notes || undefined,
          photoUrl: form.photoUrl || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("تم إرسال طلب التسجيل، بانتظار اعتماد المعلم");
      navigate({ to: "/student" });
    },
    onError: () => toast.error("تعذر إرسال طلب التسجيل"),
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-gradient px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Link to="/">
            <Logo className="text-primary-foreground" subtitle="تسجيل طالب جديد" />
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>استمارة تسجيل الطالب</CardTitle>
            <CardDescription>
              بعد الإرسال يظل طلبك «قيد المراجعة» حتى يعتمده المعلم ويصدر لك كود الدخول.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!teacherId) {
                  toast.error("اختر المعلم / السنتر");
                  return;
                }
                if (form.fullName.trim().split(/\s+/).length < 4) {
                  toast.error("اكتب الاسم رباعيًا");
                  return;
                }
                if (form.phone.trim().length < 6) {
                  toast.error("أدخل رقم هاتف صحيح");
                  return;
                }
                mutation.mutate();
              }}
            >
              <div className="space-y-2 sm:col-span-2">
                <Label>المعلم / السنتر</Label>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المعلم" />
                  </SelectTrigger>
                  <SelectContent>
                    {(teachers.data ?? []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.center_name} {t.full_name ? `— ${t.full_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>الاسم رباعي</Label>
                <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>النوع</Label>
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ذكر">ذكر</SelectItem>
                    <SelectItem value="أنثى">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>تاريخ الميلاد</Label>
                <Input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>رقم ولي الأمر</Label>
                <Input dir="ltr" value={form.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>المدرسة</Label>
                <Input value={form.school} onChange={(e) => set("school", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>الصف</Label>
                <Select value={form.grade} onValueChange={(v) => set("grade", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الشعبة</Label>
                <Input value={form.section} onChange={(e) => set("section", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>المادة</Label>
                <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>المجموعة</Label>
                <Select value={form.groupId} onValueChange={(v) => set("groupId", v)} disabled={!teacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المجموعة" />
                  </SelectTrigger>
                  <SelectContent>
                    {(groups.data ?? []).map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>رابط الصورة (اختياري)</Label>
                <Input dir="ltr" value={form.photoUrl} onChange={(e) => set("photoUrl", e.target.value)} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>العنوان</Label>
                <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>ملاحظات</Label>
                <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
              </div>

              <div className="sm:col-span-2">
                <Button className="w-full" size="lg" disabled={mutation.isPending}>
                  {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                  إرسال طلب التسجيل
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <PoweredBy className="mt-8" />
      </div>
    </div>
  );
}
