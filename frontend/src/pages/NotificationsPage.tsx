import { useState } from "react";
import { Bell, Trash2, Send, ChevronLeft, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useNotifications, useDeleteNotification } from "@/hooks/useNotifications";
import { useDashboard } from "@/hooks/useDashboard";
import { SendNotificationModal } from "@/components/SendNotificationModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "@/hooks/use-toast";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useNotifications({
    page,
    page_size: pageSize,
  });

  const { data: dashboardData } = useDashboard();
  const openComplaints = dashboardData?.counts?.open_complaints ?? 0;

  const deleteMutation = useDeleteNotification();

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  const handleDeleteConfirm = () => {
    if (!notificationToDelete) return;
    deleteMutation.mutate(notificationToDelete.id, {
      onSuccess: () => {
        setDeleteConfirmOpen(false);
        setNotificationToDelete(null);
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        toast({
          title: "تم الحذف",
          description: "تم حذف الإشعار بنجاح",
        });
      },
      onError: (err: any) => {
        setDeleteConfirmOpen(false);
        toast({
          title: "خطأ",
          description: err?.response?.data?.message || "فشل حذف الإشعار",
          variant: "destructive",
        });
      },
    });
  };

  const getTargetBadge = (type: string) => {
    switch (type) {
      case "ALL":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#2E7D32]">الجميع</span>;
      case "CUSTOMER":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E3F2FD] text-[#1976D2]">العملاء</span>;
      case "CAFE_OWNER":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF3E0] text-[#E65100]">أصحاب المقاهي</span>;
      case "CAFE":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F3E5F5] text-[#7B1FA2]">مقهى محدد</span>;
      case "USER":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F5F5F5] text-[#616161]">مستخدم محدد</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{type}</span>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* Top Header: Title + Send Notification CTA */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F2D29]">تفاصيل الإشعار</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="px-6 py-2.5 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Send size={15} />
          إرسال إشعار
        </button>
      </div>

      {/* Top Alert Banner Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
            <Bell size={20} />
          </div>
          <h2 className="text-base font-extrabold text-[#2F2D29]">
            {openComplaints > 0
              ? `هناك ${openComplaints} شكاوى لم تُراجع بعد`
              : "لا توجد شكاوى معلقة بحاجة إلى مراجعة"}
          </h2>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#EAE6DF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-[#F0ECE4] text-[#8A7A5C] text-sm font-semibold">
                <th className="py-4 px-6 w-16 text-center">#</th>
                <th className="py-4 px-6 text-center">المرسل إليه</th>
                <th className="py-4 px-6 text-center">عنوان الإشعار</th>
                <th className="py-4 px-6 text-center">تفاصيل الإشعار</th>
                <th className="py-4 px-6 text-center">تاريخ الإرسال</th>
                <th className="py-4 px-6 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE4]">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6 text-center"><div className="h-4 w-6 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-20 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-28 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-48 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-24 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-8 w-8 bg-gray-100 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8A7A5C]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Bell className="w-8 h-8 text-[#BA9B65]/40" />
                      <p className="text-sm font-bold">لا توجد إشعارات مرسلة بعد</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((notification, index) => (
                  <tr key={notification.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {getTargetBadge(notification.target_type)}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {notification.title}
                    </td>
                    <td className="py-4 px-6 text-center text-xs text-[#8A7A5C] font-semibold truncate max-w-[240px]" title={notification.message}>
                      {notification.message}
                    </td>
                    <td className="py-4 px-6 text-center text-xs text-[#8A7A5C] font-semibold" dir="ltr">
                      {formatDate(notification.created_at)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => {
                          setNotificationToDelete(notification);
                          setDeleteConfirmOpen(true);
                        }}
                        title="حذف الإشعار"
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:border-red-500 text-[#8A7A5C] hover:text-red-600 flex items-center justify-center mx-auto transition-colors shadow-xs cursor-pointer"
                      >
                        <Trash2 size={15} />
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
                  setPageSize(Number(e.target.value));
                  setPage(1);
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="w-8 h-8 rounded-lg border border-[#E5E0D8] flex items-center justify-center text-[#2F2D29] disabled:opacity-40 hover:bg-[#FAF8F5] cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>

            {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => {
              const pageNum = i + 1;
              const isSelected = page === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-8 h-8 rounded-lg border border-[#E5E0D8] flex items-center justify-center text-[#2F2D29] disabled:opacity-40 hover:bg-[#FAF8F5] cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      </div>

      <SendNotificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["notifications"] })}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="تأكيد حذف الإشعار"
        description={`هل أنت متأكد من رغبتك في حذف الإشعار "${notificationToDelete?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف الإشعار"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
