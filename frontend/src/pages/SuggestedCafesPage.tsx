import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Eye, MapPin, Phone, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useSuggestedCafes,
  useApproveSuggestedCafe,
  useRejectSuggestedCafe,
} from "@/hooks/useSuggestedCafes";
import type { SuggestedCafe } from "@/types";

const statusLabels: Record<string, string> = {
  NEW: "جديد",
  SENT: "مرسل",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

const statusColors: Record<string, string> = {
  NEW: "text-blue-600",
  SENT: "text-purple-600",
  APPROVED: "text-green-600",
  REJECTED: "text-red-600",
};

export default function SuggestedCafesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCafe, setSelectedCafe] = useState<SuggestedCafe | null>(null);
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

  const { data, isLoading } = useSuggestedCafes(params);
  const approve = useApproveSuggestedCafe();
  const reject = useRejectSuggestedCafe();

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["suggested-cafes"] });
    queryClient.invalidateQueries({ queryKey: ["suggested-cafe"] });
  };

  const handleApprove = () => {
    if (!selectedCafe) return;
    approve.mutate(selectedCafe.id, {
      onSuccess: () => {
        refresh();
        setSelectedCafe(null);
      },
    });
  };

  const handleReject = () => {
    if (!selectedCafe) return;
    reject.mutate(selectedCafe.id, {
      onSuccess: () => {
        refresh();
        setSelectedCafe(null);
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a7a5c]" />
        <Input
          placeholder="بحث بالاسم أو الجوال..."
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
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">اسم صاحب المقهى</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">الدينة</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">رقم الجوال</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">رابط جوجل</th>
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
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-28 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#8a7a5c]">
                    لا توجد مقاهي مقترحة بعد
                  </td>
                </tr>
              ) : (
                items.map((cafe, index) => (
                  <tr key={cafe.id} className="border-b border-[#e8dcc8]/30 hover:bg-[#f9f6ef]/30">
                    <td className="px-4 py-3 text-sm text-[#2f2d29]">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#2f2d29]">{cafe.owner_name}</td>
                    <td className="px-4 py-3 text-sm text-[#2f2d29]">{cafe.city}</td>
                    <td className="px-4 py-3 text-sm text-[#2f2d29]">{cafe.phone}</td>
                    <td className="px-4 py-3">
                      {cafe.google_link ? (
                        <a
                          href={cafe.google_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#c8a44e] hover:underline inline-flex items-center gap-1"
                        >
                          <MapPin size={14} />
                          {cafe.google_link}
                        </a>
                      ) : (
                        <span className="text-sm text-[#8a7a5c]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${statusColors[cafe.status] || ""}`}>
                        {statusLabels[cafe.status] || cafe.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedCafe(cafe)}
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedCafe} onOpenChange={() => setSelectedCafe(null)}>
        <DialogContent className="sm:max-w-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2f2d29]">تفاصيل المقهى المقترح</DialogTitle>
          </DialogHeader>

          {selectedCafe && (
            <div className="space-y-4">
              {/* Owner info */}
              <div className="flex items-center gap-4 p-4 bg-[#f9f6ef]/50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-[#c8a44e] flex items-center justify-center text-white font-bold">
                  {selectedCafe.owner_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#2f2d29]">{selectedCafe.owner_name}</p>
                  <p className="text-sm text-[#8a7a5c]">صاحب مقهى</p>
                </div>
                <span className={`text-sm font-medium ${statusColors[selectedCafe.status] || ""}`}>
                  {statusLabels[selectedCafe.status] || selectedCafe.status}
                </span>
              </div>

              {/* Contact details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-[#e8dcc8]/50 rounded-xl">
                  <p className="text-xs text-[#8a7a5c] mb-1">المدينة</p>
                  <p className="text-sm font-medium text-[#2f2d29]">{selectedCafe.city}</p>
                </div>
                <div className="p-3 border border-[#e8dcc8]/50 rounded-xl">
                  <p className="text-xs text-[#8a7a5c] mb-1">رقم الجوال</p>
                  <p className="text-sm font-medium text-[#2f2d29] inline-flex items-center gap-1">
                    <Phone size={14} className="text-[#8a7a5c]" />
                    {selectedCafe.phone}
                  </p>
                </div>
              </div>

              {selectedCafe.google_link && (
                <div className="p-3 border border-[#e8dcc8]/50 rounded-xl">
                  <p className="text-xs text-[#8a7a5c] mb-1">رابط جوجل</p>
                  <a
                    href={selectedCafe.google_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#c8a44e] hover:underline inline-flex items-center gap-1 break-all"
                  >
                    <MapPin size={14} />
                    {selectedCafe.google_link}
                  </a>
                </div>
              )}

              {/* Social links */}
              {(selectedCafe.website || selectedCafe.facebook || selectedCafe.instagram || selectedCafe.telegram) && (
                <div className="p-3 border border-[#e8dcc8]/50 rounded-xl">
                  <p className="text-xs text-[#8a7a5c] mb-2">روابط التواصل</p>
                  <div className="space-y-1">
                    {selectedCafe.website && (
                      <p className="text-sm text-[#2f2d29]">الموقع: <span className="text-[#c8a44e]">{selectedCafe.website}</span></p>
                    )}
                    {selectedCafe.facebook && (
                      <p className="text-sm text-[#2f2d29]">فيسبوك: <span className="text-[#c8a44e]">{selectedCafe.facebook}</span></p>
                    )}
                    {selectedCafe.instagram && (
                      <p className="text-sm text-[#2f2d29]">انستغرام: <span className="text-[#c8a44e]">{selectedCafe.instagram}</span></p>
                    )}
                    {selectedCafe.telegram && (
                      <p className="text-sm text-[#2f2d29]">تيليجرام: <span className="text-[#c8a44e]">{selectedCafe.telegram}</span></p>
                    )}
                  </div>
                </div>
              )}

              {selectedCafe.admin_notes && (
                <div className="p-3 rounded-xl bg-[#f9f6ef] border border-[#e8dcc8]/50">
                  <p className="text-sm font-semibold text-[#2f2d29] mb-1">ملاحظات الإدارة:</p>
                  <p className="text-sm text-[#8a7a5c]">{selectedCafe.admin_notes}</p>
                </div>
              )}

              {/* Actions */}
              {selectedCafe.status !== "APPROVED" && selectedCafe.status !== "REJECTED" && (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={approve.isPending}
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white flex-1"
                  >
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                    قبول
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={reject.isPending}
                    className="bg-[#ef4444] hover:bg-[#dc2626] text-white flex-1"
                  >
                    <XCircle className="ml-2 h-4 w-4" />
                    رفض
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}