import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Pencil,
  Eye,
  EyeOff,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
} from "@/components/ui/dialog";
import { useAdmins, useCreateAdmin, useUpdateAdmin } from "@/hooks/useAdmins";

const AVAILABLE_PAGES = [
  { id: "Dashboard", label: "لوحة التحكم" },
  { id: "Cafes", label: "المقاهي" },
  { id: "Admins", label: "المسؤولون" },
  { id: "Subscriptions", label: "الاشتراكات" },
  { id: "Customers", label: "المستخدمين" },
  { id: "Complaints", label: "الشكاوي" },
  { id: "Products", label: "المنتجات والخدمات" },
  { id: "Offers", label: "العروض والفعاليات" },
  { id: "Suggested Cafes", label: "المقاهي المقترحة" },
];

const createAdminSchema = z.object({
  full_name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().optional(),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  pages: z.array(z.string()).optional(),
});

type CreateAdminFormData = z.infer<typeof createAdminSchema>;

export default function AdminsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

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
  const queryClient = useQueryClient();

  const form = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      password: "",
      pages: ["Dashboard", "Cafes", "Customers"],
    },
  });

  const watchedPages = form.watch("pages") || [];

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
    form.reset({
      full_name: "",
      email: "",
      phone: "",
      password: "",
      pages: ["Dashboard", "Cafes", "Customers"],
    });
    setDialogOpen(true);
  };

  const openEditDialog = (admin: any) => {
    setEditingAdmin(admin);
    form.reset({
      full_name: admin.full_name,
      email: admin.email || "",
      phone: admin.phone || "",
      password: "",
      pages: admin.pages || ["Dashboard", "Cafes", "Customers"],
    });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingAdmin(null);
    form.reset();
  };

  const handleSubmit = (values: CreateAdminFormData) => {
    if (editingAdmin) {
      updateAdmin.mutate(
        { id: editingAdmin.id, data: values },
        {
          onSuccess: () => {
            handleDialogClose();
            queryClient.invalidateQueries({ queryKey: ["admins"] });
          },
        }
      );
    } else {
      createAdmin.mutate(
        { ...values, role: "ADMIN", status: "ACTIVE" } as any,
        {
          onSuccess: () => {
            handleDialogClose();
            queryClient.invalidateQueries({ queryKey: ["admins"] });
          },
        }
      );
    }
  };

  const togglePage = (pageId: string) => {
    const current = watchedPages;
    const updated = current.includes(pageId)
      ? current.filter((p) => p !== pageId)
      : [...current, pageId];
    form.setValue("pages", updated);
  };

  const admins = data?.items || [];
  const totalPages = data?.total_pages || 1;
  const isEditing = !!editingAdmin;
  const isSubmitting = isEditing ? updateAdmin.isPending : createAdmin.isPending;

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* Top Header: Title + Add Admin Button matching Admin.png */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F2D29]">المسؤولين</h1>
        <button
          onClick={openCreateDialog}
          className="px-6 py-2.5 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95"
        >
          إضافة مسؤول
        </button>
      </div>

      {/* Search & Filter Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex items-center w-full max-w-sm">
          <div className="relative w-full">
            <Input
              placeholder="بحث..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-11 pr-10 pl-10 rounded-xl border border-[#E5E0D8] bg-white text-sm focus-visible:ring-[#BA9B65] text-right"
            />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7A5C]" />
            <button className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7A5C] hover:text-[#2F2D29]">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table matching Admin.png from Figma */}
      <div className="bg-white rounded-2xl border border-[#EAE6DF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-[#F0ECE4] text-[#8A7A5C] text-sm font-semibold">
                <th className="py-4 px-6 w-16 text-center">#</th>
                <th className="py-4 px-6 text-center">اسم المسؤول</th>
                <th className="py-4 px-6 text-center">البريد الالكتروني</th>
                <th className="py-4 px-6 text-center">رقم الجوال</th>
                <th className="py-4 px-6 text-center">عدد الصفحات</th>
                <th className="py-4 px-6 text-center">تعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE4]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6 text-center"><div className="h-4 w-6 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-32 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-36 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-28 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-12 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-8 w-8 bg-gray-100 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#8A7A5C] font-semibold text-sm">
                    لا يوجد مسؤولون حالياً
                  </td>
                </tr>
              ) : (
                admins.map((admin: any, index: number) => (
                  <tr key={admin.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {admin.full_name || "أحمد محمد أحمد"}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-[#2F2D29]" dir="ltr">
                      {admin.email || "ahmed@gmail.com"}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-[#2F2D29]" dir="ltr">
                      {admin.phone || "+996 12345678910"}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {admin.pages?.length || 5}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => openEditDialog(admin)}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:border-[#BA9B65] text-[#8A7A5C] hover:text-[#BA9B65] flex items-center justify-center mx-auto transition-colors shadow-xs"
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination matching Figma */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#F0ECE4] text-xs font-bold text-[#2F2D29]">
          <div className="flex items-center gap-2">
            <span className="text-[#8A7A5C]">الصفحة/</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("page_size", e.target.value);
                    next.set("page", "1");
                    return next;
                  });
                }}
                className="appearance-none bg-white border border-[#E5E0D8] rounded-lg px-3 py-1.5 pr-6 text-xs font-bold text-[#2F2D29] focus:outline-none cursor-pointer"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <ChevronDown size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8A7A5C] pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="w-8 h-8 rounded-lg border border-[#E5E0D8] flex items-center justify-center text-[#2F2D29] disabled:opacity-40 hover:bg-[#FAF8F5]"
            >
              <ChevronRight size={14} />
            </button>

            {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => {
              const pageNum = i + 1;
              const isSelected = page === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                    isSelected
                      ? "border border-[#BA9B65] text-[#BA9B65] bg-white shadow-xs"
                      : "border border-[#E5E0D8] text-[#2F2D29] hover:bg-[#FAF8F5]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="w-8 h-8 rounded-lg border border-[#E5E0D8] flex items-center justify-center text-[#2F2D29] disabled:opacity-40 hover:bg-[#FAF8F5]"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Admin Dialog matching Add Admin.png from Figma */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-[#2F2D29] text-right mb-4">
              {isEditing ? "تعديل مسؤول" : "إضافة مسؤول"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">اسم المسؤول</Label>
              <Input
                {...form.register("full_name")}
                className="h-11 rounded-xl border-[#E5E0D8] bg-white text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">البريد الالكتروني</Label>
              <Input
                type="email"
                dir="ltr"
                {...form.register("email")}
                className="h-11 rounded-xl border-[#E5E0D8] bg-white text-sm text-right"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">رقم الجوال</Label>
              <div className="relative">
                <Input
                  dir="ltr"
                  {...form.register("phone")}
                  placeholder="123 654 789"
                  className="h-11 rounded-xl border-[#E5E0D8] bg-white text-sm text-right pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8A7A5C] flex items-center gap-1 border-l border-[#E5E0D8] pl-2">
                  🇸🇦
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">كلمة المرور</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  {...form.register("password")}
                  className="h-11 rounded-xl border-[#E5E0D8] bg-white text-sm text-right pl-11"
                  required={!isEditing}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7A5C] hover:text-[#2F2D29] p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Page Permissions Box with checkboxes matching Figma */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-bold text-[#2F2D29]">الصفحات المسموح بالوصول إليها</Label>
              <div className="p-4 rounded-2xl border border-[#E5E0D8] bg-white max-h-48 overflow-y-auto space-y-3">
                {AVAILABLE_PAGES.map((page) => {
                  const checked = watchedPages.includes(page.id);
                  return (
                    <label key={page.id} className="flex items-center justify-between cursor-pointer group">
                      <span className="text-xs font-bold text-[#2F2D29] group-hover:text-[#BA9B65] transition-colors">
                        {page.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePage(page.id)}
                        className="w-4 h-4 rounded-md border-[#E5E0D8] text-[#BA9B65] focus:ring-[#BA9B65] cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons matching Figma */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold rounded-xl shadow-xs"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </span>
                ) : (
                  "حفظ"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDialogClose}
                className="flex-1 h-11 border-[#E5E0D8] text-[#2F2D29] font-bold rounded-xl"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
