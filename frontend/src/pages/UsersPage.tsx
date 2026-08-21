import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Eye, Ban, CheckCircle, Pencil, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUsers, useCreateUser, useUpdateUser } from "@/hooks/useUsers";
import type { User as UserType } from "@/types";

const createUserSchema = z.object({
  full_name: z.string().min(2, "الاسم يجب أن يكون على الأقل حرفين"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().optional(),
  role: z.string().min(1, "الدور مطلوب"),
  status: z.string().min(1, "الحالة مطلوبة"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف"),
});

const editUserSchema = z.object({
  full_name: z.string().min(2, "الاسم يجب أن يكون على الأقل حرفين"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().optional(),
  role: z.string().min(1, "الدور مطلوب"),
  status: z.string().min(1, "الحالة مطلوبة"),
  password: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

const roleLabels: Record<string, string> = {
  ADMIN: "مدير",
  SUPER_ADMIN: "مشرف",
  CAFE_OWNER: "صاحب مقهى",
  CUSTOMER: "عميل",
};

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
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      role: "CUSTOMER",
      status: "ACTIVE",
      password: "",
    },
  });

  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      role: "",
      status: "",
      password: "",
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

  const openCreateDialog = () => {
    setEditingUser(null);
    createForm.reset();
    setDialogOpen(true);
  };

  const openEditDialog = (user: UserType) => {
    setEditingUser(user);
    editForm.reset({
      full_name: user.full_name,
      email: user.email || "",
      phone: user.phone || "",
      role: user.role,
      status: user.status,
      password: "",
    });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingUser(null);
    createForm.reset();
    editForm.reset();
  };

  const handleCreateSubmit = (values: CreateUserFormData) => {
    createUser.mutate(values, {
      onSuccess: () => {
        handleDialogClose();
      },
    });
  };

  const handleEditSubmit = (values: EditUserFormData) => {
    if (!editingUser) return;
    const payload: Record<string, unknown> = {
      full_name: values.full_name,
      email: values.email,
      phone: values.phone || null,
      role: values.role,
      status: values.status,
    };
    if (values.password) {
      payload.password = values.password;
    }
    updateUser.mutate(
      { id: editingUser.id, data: payload },
      {
        onSuccess: () => {
          handleDialogClose();
        },
      }
    );
  };

  const handleToggleBlock = (user: UserType) => {
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

  const isEditing = !!editingUser;
  const activeForm = isEditing ? editForm : createForm;
  const isSubmitting = isEditing ? updateUser.isPending : createUser.isPending;

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a7a5c]" />
          <Input
            placeholder="بحث..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pr-10 border-[#e0d5b8]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e8dcc8]/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8dcc8]/50 bg-[#f9f6ef]/50">
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">#</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">اسم المستخدم</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">رقم الجوال</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">حذف</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#e8dcc8]/30">
                    <td className="px-4 py-3"><div className="h-4 w-8 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-32 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-28 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-[#8a7a5c]">
                    لا يوجد مستخدمين
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} className="border-b border-[#e8dcc8]/30 hover:bg-[#f9f6ef]/30">
                    <td className="px-4 py-3 text-sm text-[#2f2d29]">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#2f2d29]">{user.full_name}</td>
                    <td className="px-4 py-3 text-sm text-[#2f2d29]" dir="ltr">{user.phone || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditDialog(user)}
                          className="p-1.5 rounded-lg text-[#8a7a5c] hover:bg-[#f0e8d0] transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleBlock(user)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            user.status === "ACTIVE"
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {user.status === "ACTIVE" ? "حظر المستخدم" : "تفعيل المستخدم"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e8dcc8]/50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8a7a5c]">الصفحة/{pageSize}</span>
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
                className="border border-[#e0d5b8] rounded-lg px-2 py-1 text-sm"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#e0d5b8] text-sm disabled:opacity-50 hover:bg-[#f9f6ef]"
              >
                &gt;
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      page === pageNum
                        ? "bg-[#c8a44e] text-white"
                        : "border border-[#e0d5b8] hover:bg-[#f9f6ef]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-[#e0d5b8] text-sm disabled:opacity-50 hover:bg-[#f9f6ef]"
              >
                &lt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2f2d29]">
              {isEditing ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
            </DialogTitle>
            <DialogDescription className="text-[#8a7a5c]">
              {isEditing ? "قم بتعديل بيانات المستخدم" : "أدخل بيانات المستخدم الجديد"}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isEditing) {
                editForm.handleSubmit(handleEditSubmit)(e);
              } else {
                createForm.handleSubmit(handleCreateSubmit)(e);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium text-[#2f2d29]">الاسم الكامل</Label>
              <Input
                id="full_name"
                {...(isEditing ? editForm.register("full_name") : createForm.register("full_name"))}
                placeholder="أدخل الاسم الكامل"
                className="border-[#e0d5b8]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#2f2d29]">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                {...(isEditing ? editForm.register("email") : createForm.register("email"))}
                placeholder="example@email.com"
                dir="ltr"
                className="border-[#e0d5b8] text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-[#2f2d29]">رقم الجوال</Label>
              <Input
                id="phone"
                {...(isEditing ? editForm.register("phone") : createForm.register("phone"))}
                placeholder="123 654 789"
                dir="ltr"
                className="border-[#e0d5b8] text-right"
              />
            </div>

            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#2f2d29]">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  {...createForm.register("password")}
                  placeholder="••••••••"
                  className="border-[#e0d5b8]"
                />
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleDialogClose} className="border-[#e0d5b8]">
                إلغاء
              </Button>
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
