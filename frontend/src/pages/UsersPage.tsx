import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, Pencil, Loader2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { useUsers, useUpdateUser } from "@/hooks/useUsers";
import type { User as UserType } from "@/types";

const editUserSchema = z.object({
  full_name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().optional(),
  status: z.string().min(1, "الحالة مطلوبة"),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("page_size") || "10");
  const search = searchParams.get("search") || "";

  const params = {
    page,
    page_size: pageSize,
    ...(search && { search }),
  };

  const { data, isLoading } = useUsers(params);
  const updateUser = useUpdateUser();

  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      status: "ACTIVE",
    },
  });

  const handleSearch = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set("search", value);
      } else {
        next.delete("search");
      }
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

  const openEditDialog = (user: UserType) => {
    setEditingUser(user);
    editForm.reset({
      full_name: user.full_name,
      email: user.email || "",
      phone: user.phone || "",
      status: user.status,
    });
    setDialogOpen(true);
  };

  const handleEditSubmit = (values: EditUserFormData) => {
    if (!editingUser) return;
    updateUser.mutate(
      {
        id: editingUser.id,
        data: {
          full_name: values.full_name,
          email: values.email,
          phone: values.phone || null,
          status: values.status,
        },
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingUser(null);
          queryClient.invalidateQueries({ queryKey: ["users"] });
        },
      }
    );
  };

  const handleToggleStatus = (user: UserType) => {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    updateUser.mutate(
      { id: user.id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["users"] });
        },
      }
    );
  };

  const users = data?.items || [];
  const totalPages = data?.total_pages || 1;

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F2D29]">المستخدمين</h1>

      {/* Search & Filter Header matching Figma */}
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

      {/* Table matching Users.png from Figma */}
      <div className="bg-white rounded-2xl border border-[#EAE6DF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-[#F0ECE4] text-[#8A7A5C] text-sm font-semibold">
                <th className="py-4 px-6 w-16 text-center">#</th>
                <th className="py-4 px-6">اسم المستخدم</th>
                <th className="py-4 px-6 text-center">رقم الجوال</th>
                <th className="py-4 px-6 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE4]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6 text-center"><div className="h-4 w-6 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-36 bg-gray-100 rounded" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-28 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-8 w-24 bg-gray-100 rounded-xl mx-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-[#8A7A5C] font-semibold text-sm">
                    لا يوجد مستخدمين حالياً
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-[#2F2D29]">
                      <div className="flex items-center gap-2">
                        <span>{user.full_name}</span>
                        <button
                          onClick={() => openEditDialog(user)}
                          className="opacity-0 hover:opacity-100 transition-opacity p-1 text-[#8A7A5C] hover:text-[#BA9B65]"
                          title="تعديل"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-[#2F2D29]" dir="ltr">
                      {user.phone || "+966 12345678910"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={updateUser.isPending}
                        className={`px-5 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs active:scale-95 ${
                          user.status === "ACTIVE"
                            ? "bg-[#C93B2B] hover:bg-[#A82E20]"
                            : "bg-[#2E7D32] hover:bg-[#1E5C22]"
                        }`}
                      >
                        {user.status === "ACTIVE" ? "إيقاف الحساب" : "تفعيل الحساب"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination matching Users.png from Figma */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#F0ECE4] text-xs font-bold text-[#2F2D29]">
          {/* Page size selector */}
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

          {/* Page number buttons */}
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

      {/* Edit User Modal */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2F2D29] text-right">
              تعديل بيانات المستخدم
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">الاسم</Label>
              <Input
                {...editForm.register("full_name")}
                className="h-11 rounded-xl border-[#E5E0D8]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">البريد الإلكتروني</Label>
              <Input
                type="email"
                dir="ltr"
                {...editForm.register("email")}
                className="h-11 rounded-xl border-[#E5E0D8] text-right"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">رقم الجوال</Label>
              <Input
                dir="ltr"
                {...editForm.register("phone")}
                className="h-11 rounded-xl border-[#E5E0D8] text-right"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-[#E5E0D8] rounded-xl font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={updateUser.isPending}
                className="bg-[#BA9B65] hover:bg-[#A07C28] text-white rounded-xl font-bold"
              >
                {updateUser.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </span>
                ) : (
                  "حفظ التغييرات"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
