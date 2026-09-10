import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, X, Eye, RefreshCw, Search, Trash2, Ban, Undo2, UserPlus, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState, TableSkeleton } from "@/components/negm/states";
import { approveStudent, regenerateStudentCode, teacherCreateStudent } from "@/lib/negm.functions";
import { STUDENT_STATUS_LABEL, GRADES, formatDate } from "@/lib/negm";
import { useAccess } from "@/hooks/useNegm";

export const Route = createFileRoute("/_authenticated/students")({
  head: () => ({
    meta: [
      { title: "الطلاب | منصة نجم" },
      { name: "description", content: "إدارة طلاب سنترك: الاعتماد والأكواد والمجموعات والحالة." },
      { property: "og:title", content: "الطلاب | منصة نجم" },
      { property: "og:description", content: "إدارة الطلاب على منصة نجم." },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const emptyForm = {
    fullName: "",
    phone: "",
    guardianPhone: "",
    gender: "",
    grade: "",
    section: "",
    school: "",
    subject: "",
    groupId: "",
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);
  const approve = useServerFn(approveStudent);
  const regenerate = useServerFn(regenerateStudentCode);
  const createStudent = useServerFn(teacherCreateStudent);
  const access = useAccess();
  const teacherId = access.data?.teacher?.id ?? "";

  const groups = useQuery({
    queryKey: ["groups-simple"],
    queryFn: async () => {
      const { data, error } = await supabase.from("groups").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });


  const students = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*, groups(name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["students"] });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approve({ data: { studentId: id } }),
    onSuccess: (res) => {
      toast.success(`تم الاعتماد — كود الطالب: ${res.code}`);
      invalidate();
    },
    onError: () => toast.error("تعذر اعتماد الطالب"),
  });

  const regenMutation = useMutation({
    mutationFn: (id: string) => regenerate({ data: { studentId: id } }),
    onSuccess: (res) => {
      toast.success(`تم إصدار كود جديد: ${res.code}`);
      invalidate();
    },
    onError: () => toast.error("تعذر إصدار الكود"),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("students").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة الطالب");
      invalidate();
    },
    onError: () => toast.error("تعذر تحديث الحالة"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("students")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف الطالب");
      invalidate();
    },
    onError: () => toast.error("تعذر حذف الطالب"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createStudent({
        data: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || undefined,
          guardianPhone: form.guardianPhone.trim() || undefined,
          gender: form.gender || undefined,
          grade: form.grade || undefined,
          section: form.section.trim() || undefined,
          school: form.school.trim() || undefined,
          subject: form.subject.trim() || undefined,
          groupId: form.groupId || null,
          notes: form.notes.trim() || undefined,
          approve: true,
        },
      }),
    onSuccess: (res) => {
      toast.success(res.code ? `تمت إضافة الطالب — الكود: ${res.code}` : "تمت إضافة الطالب");
      setAddOpen(false);
      setForm(emptyForm);
      invalidate();
    },
    onError: () => toast.error("تعذر إضافة الطالب"),
  });

  async function copyRegisterLink() {
    if (!teacherId) {
      toast.error("تعذر إنشاء الرابط");
      return;
    }

    const url = `${window.location.origin}/student/register?t=${teacherId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ رابط تسجيل الطلاب");
    } catch {
      toast.error(url);
    }
  }

  const rows = useMemo(() => {
    const list = students.data ?? [];
    const q = search.trim();
    return list.filter((s) => {
      const matchTab = tab === "all" || s.status === tab;
      const matchQ =
        !q ||
        s.full_name.includes(q) ||
        (s.student_code ?? "").toUpperCase().includes(q.toUpperCase()) ||
        (s.phone ?? "").includes(q);
      return matchTab && matchQ;
    });
  }, [students.data, search, tab]);

  return (
    <TeacherShell
      title="الطلاب"
      description="اعتماد الطلاب وإدارة بياناتهم وأكوادهم"
      actions={
        <>
          <Button size="sm" variant="outline" onClick={copyRegisterLink}>
            <Link2 className="size-4" /> رابط التسجيل
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="size-4" /> إضافة طالب
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة طالب جديد</DialogTitle>
                <DialogDescription>سيُضاف الطالب لسنترك مباشرة مع كود دخول.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>الاسم الكامل</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>هاتف الطالب</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>هاتف ولي الأمر</Label>
                  <Input
                    value={form.guardianPhone}
                    onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الصف</Label>
                  <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
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
                  <Label>المجموعة</Label>
                  <Select value={form.groupId} onValueChange={(v) => setForm({ ...form, groupId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="بدون مجموعة" />
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
                  <Label>المادة</Label>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>المدرسة</Label>
                  <Input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>ملاحظات</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    if (form.fullName.trim().length < 3) {
                      toast.error("أدخل اسم الطالب");
                      return;
                    }
                    createMutation.mutate();
                  }}

                  disabled={createMutation.isPending}
                >
                  حفظ الطالب
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      }
    >

      <Card className="shadow-card">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="pending">قيد المراجعة</TabsTrigger>
                <TabsTrigger value="approved">معتمد</TabsTrigger>
                <TabsTrigger value="suspended">موقوف</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pr-9"
                placeholder="بحث بالاسم أو الكود أو الهاتف"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {students.isLoading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState title="لا يوجد طلاب" description="لم يتم العثور على طلاب مطابقين." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الصف</TableHead>
                    <TableHead>المجموعة</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell dir="ltr" className="font-mono text-xs">
                        {s.student_code ?? "—"}
                      </TableCell>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>{s.grade ?? "—"}</TableCell>
                      <TableCell>{s.groups?.name ?? "—"}</TableCell>
                      <TableCell dir="ltr">{s.phone ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.status === "approved"
                              ? "default"
                              : s.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {STUDENT_STATUS_LABEL[s.status] ?? s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(s.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button asChild size="icon" variant="ghost" title="ملف الطالب">
                            <Link to="/students/$id" params={{ id: s.id }}>
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                          {s.status === "pending" ? (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="اعتماد"
                                onClick={() => approveMutation.mutate(s.id)}
                                disabled={approveMutation.isPending}
                              >
                                <Check className="size-4 text-success" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="رفض"
                                onClick={() => statusMutation.mutate({ id: s.id, status: "rejected" })}
                              >
                                <X className="size-4 text-destructive" />
                              </Button>
                            </>
                          ) : null}
                          {s.status === "approved" ? (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="إعادة إصدار الكود"
                                onClick={() => regenMutation.mutate(s.id)}
                              >
                                <RefreshCw className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="إيقاف"
                                onClick={() => statusMutation.mutate({ id: s.id, status: "suspended" })}
                              >
                                <Ban className="size-4 text-warning" />
                              </Button>
                            </>
                          ) : null}
                          {s.status === "suspended" || s.status === "rejected" ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="إعادة تفعيل"
                              onClick={() => statusMutation.mutate({ id: s.id, status: "approved" })}
                            >
                              <Undo2 className="size-4 text-success" />
                            </Button>
                          ) : null}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" title="حذف">
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد حذف الطالب</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيتم حذف «{s.full_name}» من القوائم. يمكن استرجاع البيانات من النسخ الاحتياطية.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(s.id)}>
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TeacherShell>
  );
}
