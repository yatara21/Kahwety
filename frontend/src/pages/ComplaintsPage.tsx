import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Eye, Bell, ArrowRightLeft, CheckCircle2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
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

const statusLabels: Record<string, string> = {
  PENDING: "قيد المراجعة",
  IN_PROGRESS: "جارٍ المعالجة",
  NOTIFICATION_SENT: "تم إرسال إشعار",
  TRANSFERRED_TO_CAFE: "محول للمقهى",
  RESOLVED: "تم الحل",
};

const statusColors: Record<string, string> = {
  PENDING: "text-yellow-600",
  IN_PROGRESS: "text-blue-600",
  NOTIFICATION_SENT: "text-purple-600",
  TRANSFERRED_TO_CAFE: "text-orange-600",
  RESOLVED: "text-green-600",
};

export default function ComplaintsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showMessageForm, setShowMessageForm] = useState(false);
  const pageSize = 10;
  const queryClient = useQueryClient();

  const params = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: search || undefined,
    }),
    [page, search]
  );

  const { data, isLoading } = useComplaints(params);
  const sendNotification = useSendNotification();
  const transfer = useTransferComplaint();
  const resolve = useResolveComplaint();

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowMessageForm(false);
    setMessageText("");
  };

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
          setShowMessageForm(false);
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

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a7a5c]" />
        <Input
          placeholder="بحث..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pr-10 border-[#e0d5b8]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e8dcc8]/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8dcc8]/50 bg-[#f9f6ef]/50">
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">#</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">اسم العميل</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">اسم المقهى</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">موضوع الشكوى</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">الحالة</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#e8dcc8]/30">
                    <td className="px-4 py-3"><div className="h-4 w-8 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-32 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-28 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-36 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#8a7a5c]">
                    لا توجد شكاوى بعد
                  </td>
                </tr>
              ) : (
                items.map((complaint, index) => (
                  <tr key={complaint.id} className="border-b border-[#e8dcc8]/30 hover:bg-[#f9f6ef]/30">
                    <td className="px-4 py-3 text-sm text-[#2f2d29]">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#2f2d29]">{complaint.customer?.full_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[#2f2d29]">{complaint.cafe?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[#2f2d29] max-w-[180px] truncate">{complaint.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${statusColors[complaint.status] || ""}`}>
                        {statusLabels[complaint.status] || complaint.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewComplaint(complaint)}
                        className="p-1.5 rounded-lg text-[#8a7a5c] hover:bg-[#f0e8d0] transition-colors"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e8dcc8]/50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8a7a5c]">الصفحة/{pageSize}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(page + 1)}
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
                    onClick={() => setPage(pageNum)}
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
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-[#e0d5b8] text-sm disabled:opacity-50 hover:bg-[#f9f6ef]"
              >
                &lt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Complaint Detail Dialog */}
      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2f2d29]">الرد على الشكوى</DialogTitle>
          </DialogHeader>

          {selectedComplaint && (
            <div className="space-y-4">
              {/* User info */}
              <div className="flex items-center gap-4 p-4 bg-[#f9f6ef]/50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-[#c8a44e] flex items-center justify-center text-white font-bold">
                  {selectedComplaint.customer?.full_name?.charAt(0) || "م"}
                </div>
                <div>
                  <p className="font-semibold text-[#2f2d29]">{selectedComplaint.customer?.full_name || "—"}</p>
                  <p className="text-sm text-[#8a7a5c]">مستخدم</p>
                </div>
                <div className="mr-auto text-left">
                  <p className="text-sm text-[#8a7a5c]">رقم الجوال</p>
                  <p className="font-medium text-[#2f2d29]">{selectedComplaint.customer?.phone || "—"}</p>
                </div>
              </div>

              {/* Complaint details */}
              <div className="border border-[#e8dcc8]/50 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e8dcc8]/50 bg-[#f9f6ef]/50">
                      <th className="text-right px-4 py-2 text-sm font-medium text-[#8a7a5c]">اسم المقهى</th>
                      <th className="text-right px-4 py-2 text-sm font-medium text-[#8a7a5c]">موضوع الشكوى</th>
                      <th className="text-right px-4 py-2 text-sm font-medium text-[#8a7a5c]">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#e8dcc8]/30">
                      <td className="px-4 py-3 text-sm text-[#2f2d29]">{selectedComplaint.cafe?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-[#2f2d29]">{selectedComplaint.subject}</td>
                      <td className="px-4 py-3 text-sm text-[#8a7a5c]">{selectedComplaint.description}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Current status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#8a7a5c]">الحالة الحالية:</span>
                <span className={`text-sm font-medium ${statusColors[selectedComplaint.status] || ""}`}>
                  {statusLabels[selectedComplaint.status] || selectedComplaint.status}
                </span>
              </div>

              {/* Admin response / cafe response display */}
              {selectedComplaint.admin_response && (
                <div className="p-3 rounded-xl bg-[#f9f6ef] border border-[#e8dcc8]/50">
                  <p className="text-sm font-semibold text-[#2f2d29] mb-1">رد الإدارة:</p>
                  <p className="text-sm text-[#8a7a5c]">{selectedComplaint.admin_response}</p>
                </div>
              )}
              {selectedComplaint.cafe_response && (
                <div className="p-3 rounded-xl bg-[#f0f7f0] border border-[#dce8dc]/50">
                  <p className="text-sm font-semibold text-[#2f2d29] mb-1">رد المقهى:</p>
                  <p className="text-sm text-[#8a7a5c]">{selectedComplaint.cafe_response}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => {
                    setShowMessageForm((v) => !v);
                    setMessageText("");
                  }}
                  className="bg-[#c8a44e] hover:bg-[#b8943e] text-white"
                >
                  <Bell className="ml-2 h-4 w-4" />
                  إرسال اشعار للعميل
                </Button>
                <Button
                  onClick={handleTransfer}
                  disabled={transfer.isPending}
                  className="bg-[#f97316] hover:bg-[#ea580c] text-white"
                >
                  <ArrowRightLeft className="ml-2 h-4 w-4" />
                  تحويل للمقهى
                </Button>
                <Button
                  onClick={handleResolve}
                  disabled={resolve.isPending}
                  className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
                >
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                  تم الحل
                </Button>
              </div>

              {/* Message form for notification */}
              {showMessageForm && (
                <div className="space-y-3 pt-4 border-t border-[#e8dcc8]/50">
                  <p className="font-semibold text-[#2f2d29]">اكتب الاشعار:</p>
                  <textarea
                    className="w-full min-h-[100px] rounded-xl border border-[#e0d5b8] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a44e]"
                    placeholder="اكتب نص الإشعار الذي سيُرسل للعميل..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSendNotification}
                      disabled={!messageText.trim() || sendNotification.isPending}
                      className="bg-[#c8a44e] hover:bg-[#b8943e] text-white"
                    >
                      <Send className="ml-2 h-4 w-4" />
                      {sendNotification.isPending ? "جاري الإرسال..." : "إرسال"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}