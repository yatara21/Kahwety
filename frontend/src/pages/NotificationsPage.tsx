import { useState } from "react";
import { Bell, Eye, Trash2, Send, Plus, Loader2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useNotifications,
  useCreateNotification,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { SendNotificationModal } from "@/components/SendNotificationModal";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useNotifications({
    page,
    page_size: pageSize,
  });

  const deleteMutation = useDeleteNotification();

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      },
    });
  };

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* Top Header: Title + Send Notification CTA */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F2D29]">تفاصيل الإشعار</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="px-6 py-2.5 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2"
        >
          <Send size={15} />
          إرسال إشعار
        </button>
      </div>

      {/* Top Alert Banner Card matching Notification Details.png from Figma */}
      <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
            <Bell size={20} />
          </div>
          <h2 className="text-base font-extrabold text-[#2F2D29]">
            هناك 4 شكاوى لم تُراجع بعد
          </h2>
        </div>
      </div>

      {/* Table matching Notification Details.png from Figma */}
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
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6 text-center"><div className="h-4 w-6 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-28 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-24 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-32 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-48 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-8 w-8 bg-gray-100 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <>
                  {/* Sample rows matching Notification Details.png */}
                  {[1, 2, 3, 4].map((num) => (
                    <tr key={num} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">{num}</td>
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">احمد محمد</td>
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">سيلانترو</td>
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">ساعات العمل خاطئة</td>
                      <td className="py-4 px-6 text-center text-xs text-[#8A7A5C] font-semibold truncate max-w-[240px]">
                        المواعيد من 7:30 ل 13:30 ولكن كان مغلق..........
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:border-[#BA9B65] text-[#8A7A5C] hover:text-[#BA9B65] flex items-center justify-center mx-auto transition-colors shadow-xs">
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </>
              ) : (
                items.map((notification, index) => (
                  <tr key={notification.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {notification.target_type}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {notification.title}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-[#2F2D29]">
                      إشعار عام
                    </td>
                    <td className="py-4 px-6 text-center text-xs text-[#8A7A5C] font-semibold truncate max-w-[240px]">
                      {notification.message}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:border-red-500 text-[#8A7A5C] hover:text-red-600 flex items-center justify-center mx-auto transition-colors shadow-xs"
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
                  onClick={() => setPage(pageNum)}
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-8 h-8 rounded-lg border border-[#E5E0D8] flex items-center justify-center text-[#2F2D29] disabled:opacity-40 hover:bg-[#FAF8F5]"
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
    </div>
  );
}
