import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  Phone,
  Coffee,
  Heart,
  AlertCircle,
  Star,
  Eye,
  Loader2,
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
import { useUser, useUpdateUser } from "@/hooks/useUsers";
import { useComplaints } from "@/hooks/useComplaints";
import type { Complaint } from "@/types";

const editUserSchema = z.object({
  full_name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useUser(id || "");
  const { data: complaintsData } = useComplaints({ page: 1, page_size: 10 });
  const updateUser = useUpdateUser();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      full_name: "",
      phone: "",
    },
  });

  const openEditModal = () => {
    if (!user) return;
    editForm.reset({
      full_name: user.full_name,
      phone: user.phone || "",
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = (values: EditUserFormData) => {
    if (!user) return;
    updateUser.mutate(
      {
        id: user.id,
        data: {
          full_name: values.full_name,
          phone: values.phone || null,
        },
      },
      {
        onSuccess: () => {
          setEditModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["user", user.id] });
          queryClient.invalidateQueries({ queryKey: ["users"] });
        },
      }
    );
  };

  const handleToggleStatus = () => {
    if (!user) return;
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    updateUser.mutate(
      { id: user.id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["user", user.id] });
          queryClient.invalidateQueries({ queryKey: ["users"] });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-[#BA9B65]" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-[#EAE6DF]" dir="rtl">
        <p className="text-[#8A7A5C] font-bold">لم يتم العثور على المستخدم</p>
        <Button onClick={() => navigate("/users")} className="mt-4 bg-[#BA9B65] text-white rounded-xl">
          العودة لقائمة المستخدمين
        </Button>
      </div>
    );
  }

  const complaints = complaintsData?.items ?? [];

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* Top Header: Title + Action Buttons matching Users-1.png */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F2D29]">الملف الشخصي</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={openEditModal}
            className="px-6 py-2.5 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-sm rounded-xl transition-all shadow-xs active:scale-95"
          >
            تعديل الحساب
          </button>
          <button
            onClick={handleToggleStatus}
            disabled={updateUser.isPending}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-xs active:scale-95 ${
              user.status === "ACTIVE"
                ? "bg-[#C93B2B] hover:bg-[#A82E20]"
                : "bg-[#2E7D32] hover:bg-[#1E5C22]"
            }`}
          >
            {user.status === "ACTIVE" ? "إيقاف الحساب" : "تفعيل الحساب"}
          </button>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-[#73706B] flex items-center justify-center text-white overflow-hidden shadow-inner">
              {user.profile_image ? (
                <img src={user.profile_image} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={44} className="text-[#EAE6DF]" />
              )}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-extrabold text-[#2F2D29]">{user.full_name}</h2>
              <p className="text-xs font-semibold text-[#8A7A5C] mt-1">مستخدم</p>
            </div>
          </div>

          {/* Phone Badge */}
          <div className="flex items-center gap-3" dir="ltr">
            <p className="text-base font-extrabold text-[#2F2D29]">{user.phone || "+96652185256"}</p>
            <div className="w-11 h-11 rounded-full bg-[#BA9B65] flex items-center justify-center text-white shadow-xs">
              <Phone size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stat Badges matching Users-1.png */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nearby Cafes */}
        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
          <div className="w-12 h-12 rounded-full bg-[#F5EEDD] text-[#BA9B65] flex items-center justify-center">
            <Coffee size={22} />
          </div>
          <div className="text-left">
            <p className="text-2xl font-extrabold text-[#2F2D29]">15</p>
            <p className="text-xs font-semibold text-[#8A7A5C]">المقاهي القريبة</p>
          </div>
        </div>

        {/* Favorite Cafes */}
        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
          <div className="w-12 h-12 rounded-full bg-[#DEF7EC] text-[#0E9F6E] flex items-center justify-center">
            <Heart size={22} />
          </div>
          <div className="text-left">
            <p className="text-2xl font-extrabold text-[#2F2D29]">150</p>
            <p className="text-xs font-semibold text-[#8A7A5C]">المقاهي المفضلة</p>
          </div>
        </div>

        {/* Complaints Count */}
        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
          <div className="w-12 h-12 rounded-full bg-[#FDE8E8] text-[#F05252] flex items-center justify-center">
            <AlertCircle size={22} />
          </div>
          <div className="text-left">
            <p className="text-2xl font-extrabold text-[#2F2D29]">150</p>
            <p className="text-xs font-semibold text-[#8A7A5C]">عدد الشكاوي</p>
          </div>
        </div>

        {/* Ratings Count */}
        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
          <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#F59E0B] flex items-center justify-center">
            <Star size={22} />
          </div>
          <div className="text-left">
            <p className="text-2xl font-extrabold text-[#2F2D29]">5</p>
            <p className="text-xs font-semibold text-[#8A7A5C]">عدد التقييمات</p>
          </div>
        </div>
      </div>

      {/* Complaints Table Section matching Users-1.png */}
      <div className="space-y-4">
        <h3 className="text-xl font-extrabold text-[#2F2D29]">الشكاوي</h3>

        <div className="bg-white rounded-2xl border border-[#EAE6DF] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-[#F0ECE4] text-[#8A7A5C] text-sm font-semibold">
                  <th className="py-4 px-6 w-16 text-center">#</th>
                  <th className="py-4 px-6 text-center">اسم المستخدم</th>
                  <th className="py-4 px-6 text-center">اسم المقهى</th>
                  <th className="py-4 px-6 text-center">المشكلة</th>
                  <th className="py-4 px-6 text-center">التفاصيل</th>
                  <th className="py-4 px-6 text-center">القبول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4]">
                {complaints.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">{i + 1}</td>
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">{user.full_name}</td>
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">سيلانترو</td>
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">ساعات العمل خاطئة</td>
                      <td className="py-4 px-6 text-center text-xs text-[#8A7A5C] font-semibold truncate max-w-[240px]">
                        المواعيد من 7:30 ل 13:30 ولكن كان مغلق...........
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => setSelectedComplaint({
                            id: String(i + 1),
                            customer_id: user.id,
                            cafe_id: "cafe-1",
                            subject: "ساعات العمل خاطئة",
                            description: "المواعيد من 7:30 ل 13:30 ولكن كان مغلق",
                            status: "PENDING",
                            admin_response: null,
                            cafe_response: null,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            customer: user,
                            cafe: { name: "سيلانترو" } as any,
                          })}
                          className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:border-[#BA9B65] text-[#8A7A5C] hover:text-[#BA9B65] flex items-center justify-center mx-auto transition-colors shadow-xs"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  complaints.map((complaint, index) => (
                    <tr key={complaint.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">{index + 1}</td>
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                        {complaint.customer?.full_name || user.full_name}
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                        {complaint.cafe?.name || "سيلانترو"}
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                        {complaint.subject || "ساعات العمل خاطئة"}
                      </td>
                      <td className="py-4 px-6 text-center text-xs text-[#8A7A5C] font-semibold truncate max-w-[240px]">
                        {complaint.description || "المواعيد من 7:30 ل 13:30 ولكن كان مغلق..........."}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => setSelectedComplaint(complaint)}
                          className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:border-[#BA9B65] text-[#8A7A5C] hover:text-[#BA9B65] flex items-center justify-center mx-auto transition-colors shadow-xs"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit User Modal matching Edit Users.png from Figma */}
      <Dialog open={editModalOpen} onOpenChange={(open) => !open && setEditModalOpen(false)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6" dir="rtl">
          <DialogHeader className="flex flex-row items-center justify-between pb-2">
            <DialogTitle className="text-2xl font-extrabold text-[#2F2D29] text-right">
              تعديل الملفة الشخصي
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">الاسم</Label>
              <Input
                {...editForm.register("full_name")}
                className="h-11 rounded-xl border-[#E5E0D8] bg-white text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">رقم الجوال</Label>
              <div className="relative">
                <Input
                  dir="ltr"
                  {...editForm.register("phone")}
                  placeholder="123 654 789"
                  className="h-11 rounded-xl border-[#E5E0D8] bg-white text-sm text-right pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8A7A5C] flex items-center gap-1 border-l border-[#E5E0D8] pl-2">
                  🇸🇦
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={updateUser.isPending}
                className="flex-1 h-11 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold rounded-xl shadow-xs"
              >
                {updateUser.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
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
