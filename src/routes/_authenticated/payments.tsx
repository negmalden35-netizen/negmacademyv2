import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/negm/TeacherShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { EmptyState, TableSkeleton } from "@/components/negm/states";
import { egp, formatDate } from "@/lib/negm";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "المدفوعات | منصة نجم" },
      { name: "description", content: "متابعة اشتراكات الطلاب والمدفوعات والمتأخرات شهريًا." },
      { property: "og:title", content: "المدفوعات | منصة نجم" },
      { property: "og:description", content: "إدارة مدفوعات الطلاب." },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [amountDue, setAmountDue] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [dueDate, setDueDate] = useState("");

  const students = useQuery({
    queryKey: ["students-simple"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, group_id")
        .eq("status", "approved")
        .is("deleted_at", null)
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const payments = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, students(full_name), groups(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totals = (payments.data ?? []).reduce(
    (acc, p) => {
      acc.paid += Number(p.amount_paid);
      acc.due += Math.max(0, Number(p.amount_due) - Number(p.amount_paid));
      return acc;
    },
    { paid: 0, due: 0 },
  );

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("no user");
      const student = students.data?.find((s) => s.id === studentId);
      const due = Number(amountDue) || 0;
      const paid = Number(amountPaid) || 0;
      const { error } = await supabase.from("payments").insert({
        teacher_id: uid,
        student_id: studentId,
        group_id: student?.group_id ?? null,
        amount_due: due,
        amount_paid: paid,
        due_date: dueDate || null,
        paid_at: paid >= due && due > 0 ? new Date().toISOString() : null,
        status: paid >= due && due > 0 ? "paid" : "unpaid",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة");
      setOpen(false);
      setStudentId("");
      setAmountDue("");
      setAmountPaid("");
      setDueDate("");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-stats"] });
    },
    onError: () => toast.error("تعذر تسجيل الدفعة"),
  });

  const markPaid = useMutation({
    mutationFn: async (p: { id: string; amount_due: number }) => {
      const { error } = await supabase
        .from("payments")
        .update({ amount_paid: p.amount_due, status: "paid", paid_at: new Date().toISOString() })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث الدفعة");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: () => toast.error("تعذر تحديث الدفعة"),
  });

  return (
    <TeacherShell
      title="المدفوعات"
      description="تسجيل الاشتراكات ومتابعة المتأخرات"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" /> دفعة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تسجيل دفعة</DialogTitle>
              <DialogDescription>اختر الطالب وحدد المبالغ.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>الطالب</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الطالب" />
                  </SelectTrigger>
                  <SelectContent>
                    {(students.data ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>المطلوب</Label>
                  <Input type="number" min="0" value={amountDue} onChange={(e) => setAmountDue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>المدفوع</Label>
                  <Input type="number" min="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>تاريخ الاستحقاق</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (!studentId) {
                    toast.error("اختر الطالب");
                    return;
                  }
                  create.mutate();
                }}
                disabled={create.isPending}
              >
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">إجمالي المحصل</p>
            <p className="text-2xl font-bold text-success">{egp(totals.paid)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">إجمالي المتأخرات</p>
            <p className="text-2xl font-bold text-destructive">{egp(totals.due)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 shadow-card">
        <CardContent className="p-4 md:p-6">
          {payments.isLoading ? (
            <TableSkeleton />
          ) : (payments.data ?? []).length === 0 ? (
            <EmptyState title="لا توجد مدفوعات" description="ابدأ بتسجيل أول دفعة." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطالب</TableHead>
                    <TableHead>المجموعة</TableHead>
                    <TableHead>المطلوب</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>الاستحقاق</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(payments.data ?? []).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.students?.full_name ?? "—"}</TableCell>
                      <TableCell>{p.groups?.name ?? "—"}</TableCell>
                      <TableCell>{egp(p.amount_due)}</TableCell>
                      <TableCell>{egp(p.amount_paid)}</TableCell>
                      <TableCell className="text-xs">{formatDate(p.due_date)}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "paid" ? "default" : "destructive"}>
                          {p.status === "paid" ? "مدفوع" : "غير مكتمل"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.status !== "paid" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markPaid.mutate({ id: p.id, amount_due: Number(p.amount_due) })}
                          >
                            <CheckCircle2 className="size-4 text-success" /> تحصيل
                          </Button>
                        ) : null}
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
