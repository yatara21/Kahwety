import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Pencil, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAdmins, useCreateAdmin, useUpdateAdmin } from "@/hooks/useAdmins";

const pagePermissions = [
  { id: "dashboard", label: "لوحة التحكم" },
  { id: "cafes", label: "القهاوي" },
  { id: "subscriptions", label: "الاشتراكات" },
  { id: "products", label: "التصنيفات والمنتجات" },
  { id: "users", label: "المستخدمين" },
  { id: "complaints", label: "الشكاوى" },
];

const createAdminSchema = z.object({
  full_name: z.string().min(2, "الاسم يجب أن يكون على الأقل حرفين"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().optional(),
  password: z.string().min(8, "كلمة المرور يجب أن تكون على الأقل 8 أحرف"),
  pages: z.array(z.string()).optional(),
});

const editAdminSchema = z.object({
  full_name: z.string().min(2, "الاسم يجب أن يكون على الأقل حرفين"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().optional(),
  password: z.string().optional(),
  pages: z.array(z.string()).optional(),
});

type CreateAdminFormData = z.infer<typeof createAdminSchema>;
type EditAdminFormData = z.infer<typeof editAdminSchema>;

export default function AdminsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);

  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("page_size") || "10");
  const search = searchParams.get("search") || "";

  const params = {
    page,
    page_size: pageSize,
    ...(search && { search }),
  };

  const { data, isLoading } = useAdmins(params);
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();

  const createForm = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { full_name: "", email: "", phone: "", password: "", pages: [] },
  });

  const editForm = useForm<EditAdminFormData>({
    resolver: zodResolver(editAdminSchema),
    defaultValues: { full_name: "", email: "", phone: "", password: "", pages: [] },
  });

  const watchedCreatePages = createForm.watch("pages") || [];
  const watchedEditPages = editForm.watch("pages") || [];

  const handleSearch = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("search", value);
      else next.delete("search");
      next.set("page", "1");
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(newPage));
      return next;
    });
  };

  const openCreateDialog = () => {
    setEditingAdmin(null);
    createForm.reset({ full_name: "", email: "", phone: "", password: "", pages: [] });
    setDialogOpen(true);
  };

  const openEditDialog = (admin: any) => {
    setEditingAdmin(admin);
    editForm.reset({
      full_name: admin.full_name,
      email: admin.email || "",
      phone: admin.phone || "",
      password: "",
      pages: admin.pages || ["dashboard"],
    });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingAdmin(null);
    createForm.reset();
    editForm.reset();
  };

  const handleCreateSubmit = (values: CreateAdminFormData) => {
    createAdmin.mutate({ ...values, role: "ADMIN", status: "ACTIVE" } as any, {
      onSuccess: () => handleDialogClose(),
    });
  };

  const handleEditSubmit = (values: EditAdminFormData) => {
    if (!editingAdmin) return;
    updateAdmin.mutate({ id: editingAdmin.id, data: values }, {
      onSuccess: () => handleDialogClose(),
    });
  };

  const admins = data?.items || [];
  const totalPages = data?.total_pages || 1;
  const isEditing = !!editingAdmin;
  const isSubmitting = isEditing ? updateAdmin.isPending : createAdmin.isPending;
  const form = isEditing ? editForm : createForm;
  const watchedPages = isEditing ? watchedEditPages : watchedCreatePages;

  const togglePage = (pageId: string) => {
    const current = watchedPages;
    const updated = current.includes(pageId)
      ? current.filter((p) => p !== pageId)
      : [...current, pageId];
    if (isEditing) {
      editForm.setValue("pages", updated);
    } else {
      createForm.setValue("pages", updated);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#2f2d29]">المسؤولين</h2>
        <Button onClick={openCreateDialog} className="bg-[#c8a44e] hover:bg-[#b8943e] text-white">
          إضافة مسؤول
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a7a5c]" />
          <Input placeholder="بحث..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pr-10 border-[#e0d5b8]" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e8dcc8]/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8dcc8]/50 bg-[#f9f6ef]/50">
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">#</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">اسم المسؤول</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">البريد الإلكتروني</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">رقم الجوال</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">عدد الصلاحيات</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">تعديل</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#e8dcc8]/30">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 w-20 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#8a7a5c]">لا يوجد مسؤولون</td>
                </tr>
              ) : (
                admins.map((admin, index) => (
                  <tr key={admin.id} className="border-b border-[#e8dcc8]/30 hover:bg-[#f9f6ef]/30">
                    <td className="px-4 py-3 text-sm text-[#2f2d29]">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-4 py-3 text-sm text-[#2f2d29]">{admin.full_name}</td>
                    <td className="px-4 py-3 text-sm text-[#2f2d29]" dir="ltr">{admin.email || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[#2f2d29]" dir="ltr">{admin.phone || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[#2f2d29]">{admin.pages?.length || 5}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEditDialog(admin)} className="p-1.5 rounded-lg text-[#8a7a5c] hover:bg-[#f0e8d0] transition-colors">
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e8dcc8]/50">
            <span className="text-sm text-[#8a7a5c]">الصفحة/{pageSize}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#e0d5b8] text-sm disabled:opacity-50 hover:bg-[#f9f6ef]">&gt;</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((num) => (
                <button key={num} onClick={() => handlePageChange(num)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${page === num ? "bg-[#c8a44e] text-white" : "border border-[#e0d5b8] hover:bg-[#f9f6ef]"}`}>{num}</button>
              ))}
              <button onClick={() => handlePageChange(page - 1)} disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-[#e0d5b8] text-sm disabled:opacity-50 hover:bg-[#f9f6ef]">&lt;</button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2f2d29]">
              {isEditing ? "تعديل مسؤول" : "إضافة مسؤول"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (isEditing) editForm.handleSubmit(handleEditSubmit)(e);
            else createForm.handleSubmit(handleCreateSubmit)(e);
          }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">اسم المسؤول</Label>
              <Input {...form.register("full_name")} className="border-[#e0d5b8]" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">البريد الإلكتروني</Label>
              <Input type="email" {...form.register("email")} className="border-[#e0d5b8]" dir="ltr" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">رقم الجوال</Label>
              <div className="flex items-center gap-2">
                <Input {...form.register("phone")} className="border-[#e0d5b8]" dir="ltr" />
                <span className="text-sm text-green-600">✓</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">كلمة المرور</Label>
              <Input type="password" {...form.register("password")} className="border-[#e0d5b8]" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">الصفحات التي يصلون إليها</Label>
              <div className="space-y-2 mt-2">
                {pagePermissions.map((perm) => (
                  <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={watchedPages.includes(perm.id)}
                      onChange={() => togglePage(perm.id)}
                      className="w-4 h-4 rounded border-[#e0d5b8] text-[#c8a44e] focus:ring-[#c8a44e]"
                    />
                    <span className="text-sm text-[#2f2d29]">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleDialogClose} className="border-[#e0d5b8]">إلغاء</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#c8a44e] hover:bg-[#b8943e] text-white">
                {isSubmitting ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
