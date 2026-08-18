import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Plus, Search, ShieldBan, ShieldCheck } from "lucide-react";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { EmptyState, LoadingState } from "@/components/negm/states";
import {
  adminCreateLicense,
  adminOverview,
  adminSetLicenseStatus,
  adminSetTeacherSuspended,
  checkSuperAdmin,
} from "@/lib/negm.functions";
import { LICENSE_STATUS_LABEL, formatDateTime } from "@/lib/negm";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة مالك المنصة | منصة نجم" },
      { name: "description", content: "إدارة السناتر والمعلمين والتراخيص والتفعيل على منصة نجم." },
      { property: "og:title", content: "لوحة مالك المنصة | منصة نجم" },
      { property: "og:description", content: "تحكم كامل في تراخيص السناتر." },
    ],
  }),
  beforeLoad: async () => {
    try {
      await checkSuperAdmin();
      return { isSuperAdmin: true };
    } catch {
      throw new Error("ليس لديك صلاحية للوصول إلى هذه الصفحة");
    }
  },
  errorComponent: AdminAccessDenied,
  component: AdminPage,
});

function AdminAccessDenied() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <ShieldBan className="size-12 text-destructive" />
      <h1 className="text-xl font-bold">ليس لديك صلاحية للوصول إلى هذه الصفحة</h1>
      <p className="text-sm text-muted-foreground">
        هذه اللوحة متاحة لمالك المنصة فقط. إذا كان لديك حساب مالك المنصة فسجل الدخول به.
      </p>
      <Button asChild>
        <Link to="/dashboard">العودة إلى لوحة المعلم</Link>
      </Button>
    </div>
  );
}

function AdminPage() {
  const queryClient = useQueryClient();
  const overviewFn = useServerFn(adminOverview);
  const createFn = useServerFn(adminCreateLicense);
  const statusFn = useServerFn(adminSetLicenseStatus);
  const suspendFn = useServerFn(adminSetTeacherSuspended);

  const [teacherSearch, setTeacherSearch] = useState("");
  const [licenseSearch, setLicenseSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", teacherName: "", notes: "" });

  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => overviewFn(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-overview"] });

  const createLicense = useMutation({
    mutationFn: () => createFn({ data: form }),
    onSuccess: (license) => {
      toast.success(`تم إنشاء الترخيص: ${license.license_key}`);
      setForm({ email: "", teacherName: "", notes: "" });
      setOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "تعذر إنشاء الترخيص"),
  });

  const setStatus = useMutation({
    mutationFn: (v: { licenseId: string; status: "pending" | "trial" | "active" | "suspended" | "revoked" }) =>
      statusFn({ data: v }),
    onSuccess: () => {
      toast.success("تم تحديث حالة الترخيص");
      invalidate();
    },
    onError: () => toast.error("تعذر تحديث الترخيص"),
  });

  const setSuspended = useMutation({
    mutationFn: (v: { teacherId: string; suspended: boolean }) => suspendFn({ data: v }),
    onSuccess: () => {
      toast.success("تم تحديث حالة المعلم");
      invalidate();
    },
    onError: () => toast.error("تعذر تحديث حالة المعلم"),
  });

  const teachers = useMemo(() => {
    const q = teacherSearch.trim();
    return (overview.data?.teachers ?? []).filter(
      (t) =>
        !q ||
        t.full_name.includes(q) ||
        (t.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
        t.center_name.includes(q),
    );
  }, [overview.data, teacherSearch]);

  const licenses = useMemo(() => {
    const q = licenseSearch.trim();
    return (overview.data?.licenses ?? []).filter(
      (l) =>
        !q ||
        l.license_key.toUpperCase().includes(q.toUpperCase()) ||
        (l.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (l.teacher_name ?? "").includes(q),
    );
  }, [overview.data, licenseSearch]);

  if (overview.isLoading) {
    return (
      <TeacherShell title="لوحة مالك المنصة">
        <LoadingState />
      </TeacherShell>
    );
  }

  if (overview.isError) {
    return (
      <TeacherShell title="لوحة مالك المنصة">
        <EmptyState title="غير مصرح" description="هذه اللوحة متاحة لمالك المنصة فقط." />
      </TeacherShell>
    );
  }

  const counts = overview.data!.counts;

  return (
    <TeacherShell
      title="لوحة مالك المنصة"
      description="إدارة السناتر والتراخيص والتفعيل"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" /> ترخيص جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إصدار كود تفعيل</DialogTitle>
              <DialogDescription>يُرسل الكود للمعلم بعد الدفع.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>بريد المعلم</Label>
                <Input dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>اسم المعلم / السنتر</Label>
                <Input value={form.teacherName} onChange={(e) => setForm({ ...form, teacherName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createLicense.mutate()} disabled={createLicense.isPending}>
                إصدار الكود
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "المعلمون / السناتر", value: counts.teachers },
          { label: "التراخيص المفعّلة", value: counts.active },
          { label: "إجمالي الطلاب", value: counts.students },
          { label: "الاختبارات", value: counts.exams },
        ].map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="teachers">
        <TabsList>
          <TabsTrigger value="teachers">السناتر والمعلمون</TabsTrigger>
          <TabsTrigger value="licenses">التراخيص</TabsTrigger>
        </TabsList>

        <TabsContent value="teachers">
          <Card className="shadow-card">
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="relative w-full sm:w-72">
                <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pr-9"
                  placeholder="بحث بالاسم أو البريد أو السنتر"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                />
              </div>
              {teachers.length === 0 ? (
                <EmptyState title="لا يوجد معلمون" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المعلم</TableHead>
                        <TableHead>السنتر</TableHead>
                        <TableHead>البريد</TableHead>
                        <TableHead>الطلاب</TableHead>
                        <TableHead>الترخيص</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teachers.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.full_name || "—"}</TableCell>
                          <TableCell>{t.center_name}</TableCell>
                          <TableCell dir="ltr" className="text-xs">
                            {t.email ?? "—"}
                          </TableCell>
                          <TableCell>{overview.data!.studentsByTeacher[t.id] ?? 0}</TableCell>
                          <TableCell>
                            <Badge variant={t.is_suspended ? "destructive" : "default"}>
                              {t.is_suspended ? "موقوف" : LICENSE_STATUS_LABEL[t.license_status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSuspended.mutate({ teacherId: t.id, suspended: !t.is_suspended })}
                            >
                              {t.is_suspended ? (
                                <>
                                  <ShieldCheck className="size-4 text-success" /> تفعيل
                                </>
                              ) : (
                                <>
                                  <ShieldBan className="size-4 text-destructive" /> إيقاف
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses">
          <Card className="shadow-card">
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="relative w-full sm:w-72">
                <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pr-9"
                  placeholder="بحث بالكود أو البريد"
                  value={licenseSearch}
                  onChange={(e) => setLicenseSearch(e.target.value)}
                />
              </div>
              {licenses.length === 0 ? (
                <EmptyState title="لا توجد تراخيص" description="أصدر أول كود تفعيل." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>كود التفعيل</TableHead>
                        <TableHead>المعلم</TableHead>
                        <TableHead>البريد</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ الإصدار</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {licenses.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell dir="ltr" className="font-mono text-xs">
                            <button
                              className="inline-flex items-center gap-1 hover:underline"
                              onClick={() => {
                                navigator.clipboard.writeText(l.license_key);
                                toast.success("تم نسخ الكود");
                              }}
                            >
                              {l.license_key}
                              <Copy className="size-3" />
                            </button>
                          </TableCell>
                          <TableCell>{l.teacher_name ?? "—"}</TableCell>
                          <TableCell dir="ltr" className="text-xs">
                            {l.email ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={l.status === "active" ? "default" : "secondary"}>
                              {LICENSE_STATUS_LABEL[l.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{formatDateTime(l.created_at)}</TableCell>
                          <TableCell>
                            <Select
                              value={l.status}
                              onValueChange={(v) =>
                                setStatus.mutate({
                                  licenseId: l.id,
                                  status: v as "pending" | "trial" | "active" | "suspended" | "revoked",
                                })
                              }
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(LICENSE_STATUS_LABEL).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </TeacherShell>
  );
}
