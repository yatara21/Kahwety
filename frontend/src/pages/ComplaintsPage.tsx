import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Eye,
  Phone,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useComplaints,
  useSendNotification,
  useTransferComplaint,
  useResolveComplaint,
} from "@/hooks/useComplaints";
import type { Complaint } from "@/types";

export default function ComplaintsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [messageText, setMessageText] = useState("");
  const queryClient = useQueryClient();

  const params = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: search || undefined,
    }),
    [page, pageSize, search]
  );

  const { data, isLoading } = useComplaints(params);
  const sendNotification = useSendNotification();
  const transfer = useTransferComplaint();
  const resolve = useResolveComplaint();

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["complaints"] });
    queryClient.invalidateQueries({ queryKey: ["complaint"] });
  };

  const handleSendNotification = () => {
    if (!selectedComplaint || !messageText.trim()) return;
    sendNotification.mutate(
      { id: selectedComplaint.id, message: messageText },
      {
        onSuccess: () => {
          refresh();
          setSelectedComplaint(null);
          setMessageText("");
        },
      }
    );
  };

  const handleTransfer = () => {
    if (!selectedComplaint) return;
    transfer.mutate(selectedComplaint.id, {
      onSuccess: () => {
        refresh();
        setSelectedComplaint(null);
      },
    });
  };

  const handleResolve = () => {
    if (!selectedComplaint) return;
    resolve.mutate(selectedComplaint.id, {
      onSuccess: () => {
        refresh();
        setSelectedComplaint(null);
      },
    });
  };

  const renderStatusBadge = (status: string) => {
    if (status === "RESOLVED") {
      return <span className="text-xs font-bold text-[#2E7D32]">تم الحل</span>;
    }
    if (status === "TRANSFERRED_TO_CAFE") {
      return <span className="text-xs font-bold text-[#F59E0B]">محول للمقهى</span>;
    }
    if (status === "NOTIFICATION_SENT") {
      return <span className="text-xs font-bold text-[#007AFF]">تم ارسال اشعار</span>;
    }
    return <span className="text-xs font-bold text-[#8A7A5C]">قيد المراجعة</span>;
  };

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F2D29]">الشكاوي</h1>

      {/* Search & Filter Header matching Complaints.png */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex items-center w-full max-w-sm">
          <div className="relative w-full">
            <Input
              placeholder="بحث..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-11 pr-10 pl-10 rounded-xl border border-[#E5E0D8] bg-white text-sm focus-visible:ring-[#BA9B65] text-right"
            />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7A5C]" />
            <button className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7A5C] hover:text-[#2F2D29]">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table matching Complaints.png from Figma */}
      <div className="bg-white rounded-2xl border border-[#EAE6DF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-[#F0ECE4] text-[#8A7A5C] text-sm font-semibold">
                <th className="py-4 px-6 w-16 text-center">#</th>
                <th className="py-4 px-6 text-center">اسم المستخدم</th>
                <th className="py-4 px-6 text-center">اسم المقهى</th>
                <th className="py-4 px-6 text-center">المشكلة</th>
                <th className="py-4 px-6 text-center">الحالة</th>
                <th className="py-4 px-6 text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE4]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6 text-center"><div className="h-4 w-6 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-28 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-24 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-36 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-20 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-8 w-8 bg-gray-100 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#8A7A5C] font-semibold text-sm">
                    لا توجد شكاوى حالياً
                  </td>
                </tr>
              ) : (
                items.map((complaint, index) => (
                  <tr key={complaint.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {complaint.customer?.full_name || "احمد محمد"}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {complaint.cafe?.name || "سيلانترو"}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-[#524E48]">
                      {complaint.subject || "ساعات العمل خاطئة"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {renderStatusBadge(complaint.status)}
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

      {/* Complaint Response Dialog matching Response to the complaint.png */}
      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="sm:max-w-2xl rounded-3xl p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-[#2F2D29] text-right mb-4">
              الرد علي الشكوى
            </DialogTitle>
          </DialogHeader>

          {selectedComplaint && (
            <div className="space-y-5">
              {/* Customer Card matching Figma */}
              <div className="flex items-center justify-between p-5 rounded-2xl border border-[#EAE6DF] bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#EAE6DF] flex items-center justify-center text-[#8A7A5C]">
                    <UserIcon size={28} />
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-[#2F2D29]">
                      {selectedComplaint.customer?.full_name || "احمد محمد"}
                    </p>
                    <p className="text-xs text-[#8A7A5C] font-semibold">مستخدم</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-left" dir="ltr">
                  <p className="text-sm font-bold text-[#2F2D29]">
                    {selectedComplaint.customer?.phone || "+201221131049"}
                  </p>
                  <div className="w-9 h-9 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
                    <Phone size={16} />
                  </div>
                </div>
              </div>

              {/* Complaint Details Row Table */}
              <div className="border border-[#EAE6DF] rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-[#F0ECE4] text-xs font-bold text-[#8A7A5C]">
                      <th className="py-3 px-4">اسم المقهى</th>
                      <th className="py-3 px-4">عنوان الشكوى</th>
                      <th className="py-3 px-4">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-xs text-[#2F2D29] font-medium border-b border-[#F0ECE4]">
                      <td className="py-3.5 px-4 font-bold">{selectedComplaint.cafe?.name || "سيلانترو"}</td>
                      <td className="py-3.5 px-4 font-bold">{selectedComplaint.subject || "ساعات العمل خاطئة"}</td>
                      <td className="py-3.5 px-4 text-[#524E48] leading-relaxed">
                        {selectedComplaint.description || "الخدمة كانت بطيئة جدًا، وانتظرت أكثر من 20 دقيقة بدون ما حد يجي ياخد الطلب. أرجو التعامل مع الموقف وتحسين مستوى الخدمة"}
                      </td>
                    </tr>
                    {(selectedComplaint.status === "RESOLVED" || selectedComplaint.cafe_response || selectedComplaint.admin_response) && (
                      <tr className="text-xs font-bold bg-[#FAF8F5]/50">
                        <td className="py-3 px-4 text-[#8A7A5C]">الرد</td>
                        <td colSpan={2} className="py-3 px-4 text-[#2E7D32]">
                          {selectedComplaint.cafe_response || selectedComplaint.admin_response || "تم حل المشكلة"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 3 Action Buttons matching Figma */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleSendNotification}
                  disabled={sendNotification.isPending}
                  className="h-11 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold text-xs flex items-center justify-center shadow-xs transition-all active:scale-95"
                >
                  إرسال اشعار للعميل
                </button>

                <button
                  type="button"
                  onClick={handleTransfer}
                  disabled={transfer.isPending}
                  className="h-11 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs flex items-center justify-center shadow-xs transition-all active:scale-95"
                >
                  تحويل للمقهى
                </button>

                <button
                  type="button"
                  onClick={handleResolve}
                  disabled={resolve.isPending}
                  className="h-11 rounded-xl bg-[#2E7D32] hover:bg-[#1E5C22] text-white font-bold text-xs flex items-center justify-center shadow-xs transition-all active:scale-95"
                >
                  تم الحل
                </button>
              </div>

              {/* "اكتب توضيحاً" Text Area Section matching Figma */}
              <div className="space-y-3 pt-2">
                <h4 className="text-base font-extrabold text-[#2F2D29]">اكتب توضيحاً</h4>
                <textarea
                  rows={3}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="اكتب تنبيهاً أو رسالة توضيحية....."
                  className="w-full p-4 rounded-2xl border border-[#E5E0D8] bg-white text-xs text-[#2F2D29] focus:outline-none focus:border-[#BA9B65] resize-none"
                />
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={handleSendNotification}
                    disabled={!messageText.trim() || sendNotification.isPending}
                    className="px-8 py-2.5 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-sm rounded-xl transition-all shadow-xs disabled:opacity-50"
                  >
                    {sendNotification.isPending ? "جاري الإرسال..." : "إرسال"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}