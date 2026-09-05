import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Eye,
  Coffee,
  Globe,
  Share2,
  Phone,
  Mail,
  User as UserIcon,
  RotateCcw,
  Sparkles,
  CupSoda,
  Wifi,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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

export default function SuggestedCafesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCafe, setSelectedCafe] = useState<SuggestedCafe | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const queryClient = useQueryClient();

  const params = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: search || undefined,
    }),
    [page, pageSize, search]
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

  const renderStatus = (status: string) => {
    if (status === "APPROVED" || status === "SENT") {
      return <span className="text-xs font-bold text-[#0E9F6E]">تمت المراسلة</span>;
    }
    if (status === "REJECTED") {
      return <span className="text-xs font-bold text-[#3F83F8]">تم الأطلاع</span>;
    }
    return <span className="text-xs font-bold text-[#D97706]">جديد</span>;
  };

  const workingHours = [
    { day: "السبت", hours: "07:30 – 17:30" },
    { day: "الاحد", hours: "07:30 – 17:30" },
    { day: "الاثنين", hours: "07:30 – 17:30" },
    { day: "الثلاثاء", hours: "07:30 – 17:30" },
    { day: "الاربعاء", hours: "07:30 – 17:30" },
    { day: "الخميس", hours: "07:30 – 17:30" },
    { day: "الجمعة", hours: "مغلق", isClosed: true },
  ];

  const cafeProducts = [
    { name: "إسبرسو", icon: <Coffee size={18} className="text-[#BA9B65]" /> },
    { name: "قهوة مرشحة", icon: <Sparkles size={18} className="text-[#BA9B65]" /> },
    { name: "منزوعة الكافيين", icon: <Coffee size={18} className="text-[#BA9B65]" /> },
    { name: "مشروب بارد", icon: <CupSoda size={18} className="text-[#BA9B65]" /> },
    { name: "مكان خارجي", icon: <Globe size={18} className="text-[#BA9B65]" /> },
    { name: "Wi-Fi", icon: <Wifi size={18} className="text-[#BA9B65]" /> },
    { name: "حليب نباتي", icon: <CupSoda size={18} className="text-[#BA9B65]" /> },
    { name: "إسبرسو", icon: <Coffee size={18} className="text-[#BA9B65]" /> },
    { name: "مشروب بارد", icon: <CupSoda size={18} className="text-[#BA9B65]" /> },
    { name: "منزوعة الكافيين", icon: <Coffee size={18} className="text-[#BA9B65]" /> },
    { name: "قهوة مرشحة", icon: <Sparkles size={18} className="text-[#BA9B65]" /> },
    { name: "إسبرسو", icon: <Coffee size={18} className="text-[#BA9B65]" /> },
  ];

  const samplePhotos = [
    "/resources/Cafe.png",
    "/resources/Cafe-1.png",
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80",
  ];

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F2D29]">المقاهي المقترحة</h1>

      {/* Search & Filter Header matching Suggested cafes-1.png */}
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

      {/* Table matching Suggested cafes-1.png from Figma */}
      <div className="bg-white rounded-2xl border border-[#EAE6DF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-[#F0ECE4] text-[#8A7A5C] text-sm font-semibold">
                <th className="py-4 px-6 w-16 text-center">#</th>
                <th className="py-4 px-6 text-center">اسم المقهى</th>
                <th className="py-4 px-6 text-center">المدينة</th>
                <th className="py-4 px-6 text-center">رابط قوقل</th>
                <th className="py-4 px-6 text-center">رقم الجوال</th>
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
                    <td className="py-4 px-6 text-center"><div className="h-4 w-16 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-24 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-28 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-16 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-8 w-8 bg-gray-100 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#8A7A5C] font-semibold text-sm">
                    لا توجد مقاهي مقترحة حالياً
                  </td>
                </tr>
              ) : (
                items.map((cafe, index) => (
                  <tr key={cafe.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {cafe.owner_name || "سيلانترو"}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-[#2F2D29]">
                      {cafe.city || "جدة"}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-[#524E48]" dir="ltr">
                      {cafe.google_link ? (
                        <a href={cafe.google_link} target="_blank" rel="noopener noreferrer" className="hover:underline text-[#BA9B65]">
                          {cafe.google_link.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        "google.com"
                      )}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-[#2F2D29]" dir="ltr">
                      {cafe.phone || "+96658742525"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {renderStatus(cafe.status)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => setSelectedCafe(cafe)}
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

      {/* Suggested Cafe Details Modal matching Suggested cafes.png from Figma */}
      <Dialog open={!!selectedCafe} onOpenChange={() => setSelectedCafe(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6" dir="rtl">
          <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#F0ECE4]">
            <DialogTitle className="text-2xl font-extrabold text-[#2F2D29]">
              ملف المقهى
            </DialogTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedCafe?.google_link || window.location.href);
                  alert("تم نسخ الرابط!");
                }}
                title="مشاركة الرابط"
                className="w-8 h-8 rounded-xl border border-[#E5E0D8] bg-white flex items-center justify-center text-[#8A7A5C] hover:text-[#BA9B65] cursor-pointer"
              >
                <Share2 size={15} />
              </button>
              <button
                onClick={() => {
                  if (selectedCafe?.google_link) {
                    window.open(selectedCafe.google_link, "_blank");
                  } else if (selectedCafe?.owner_name) {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCafe.owner_name + " " + selectedCafe.city)}`, "_blank");
                  }
                }}
                title="الموقع على الخريطة"
                className="w-8 h-8 rounded-xl border border-[#E5E0D8] bg-white flex items-center justify-center text-[#8A7A5C] hover:text-[#BA9B65] cursor-pointer"
              >
                <Globe size={15} />
              </button>
              <button
                onClick={() => {
                  if (selectedCafe?.website) {
                    window.open(selectedCafe.website, "_blank");
                  } else {
                    alert("البريد أو الموقع الإلكتروني غير متوفر");
                  }
                }}
                title="الموقع أو البريد"
                className="w-8 h-8 rounded-xl border border-[#E5E0D8] bg-white flex items-center justify-center text-[#8A7A5C] hover:text-[#BA9B65] cursor-pointer"
              >
                <Mail size={15} />
              </button>
              <button
                onClick={() => {
                  if (selectedCafe?.phone) {
                    window.location.href = `tel:${selectedCafe.phone}`;
                  } else {
                    alert("رقم الهاتف غير متوفر");
                  }
                }}
                title="اتصال هاتفي"
                className="w-8 h-8 rounded-xl border border-[#E5E0D8] bg-white flex items-center justify-center text-[#8A7A5C] hover:text-[#BA9B65] cursor-pointer"
              >
                <Phone size={15} />
              </button>
            </div>
          </DialogHeader>

          {selectedCafe && (
            <div className="space-y-6 pt-2">
              {/* Main Info Card with Accept / Reject Actions */}
              <div className="bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
                          <Coffee size={18} />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-[#8A7A5C]">اسم المقهى</p>
                          <p className="text-base font-extrabold text-[#2F2D29]">{selectedCafe.owner_name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
                          <Globe size={18} />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-[#8A7A5C]">المدينة</p>
                          <p className="text-sm font-extrabold text-[#2F2D29]">{selectedCafe.city}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
                          <Phone size={18} />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-[#8A7A5C]">رقم المسؤول</p>
                          <p className="text-sm font-extrabold text-[#2F2D29]" dir="ltr">
                            {selectedCafe.phone || "غير مسجل"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
                          <Globe size={18} />
                        </div>
                        <div className="max-w-[180px]">
                          <p className="text-[11px] font-semibold text-[#8A7A5C]">رابط الخريطة</p>
                          {selectedCafe.google_link ? (
                            <a
                              href={selectedCafe.google_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-[#BA9B65] underline truncate block"
                            >
                              عرض في Google Maps
                            </a>
                          ) : (
                            <p className="text-sm font-extrabold text-[#8A7A5C]">غير متوفر</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
                          <UserIcon size={18} />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-[#8A7A5C]">مقدم الاقتراح</p>
                          <p className="text-sm font-extrabold text-[#2F2D29]">
                            {selectedCafe.owner_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
                          <RotateCcw size={18} />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-[#8A7A5C]">حالة الطلب</p>
                          <div className="mt-0.5">{renderStatus(selectedCafe.status)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accept / Reject & Convert Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-end min-w-[200px]">
                    <Button
                      onClick={() => {
                        navigate(`/cafes/create?name=${encodeURIComponent(selectedCafe.owner_name)}&city=${encodeURIComponent(selectedCafe.city)}`);
                      }}
                      className="h-10 px-4 rounded-xl bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-xs shadow-xs"
                    >
                      تسجيل كمقهى رسمي
                    </Button>
                    <button
                      onClick={handleApprove}
                      disabled={approve.isPending}
                      className="px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1E5C22] text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      {approve.isPending ? "جاري القبول..." : "قبول"}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={reject.isPending}
                      className="px-5 py-2 rounded-xl bg-[#C93B2B] hover:bg-[#A82E20] text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      {reject.isPending ? "جاري الرفض..." : "رفض"}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Bottom Cards matching Figma */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                {/* Products */}
                <div className="bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-xs flex flex-col">
                  <h4 className="text-base font-bold text-[#2F2D29] mb-3 text-center">منتجات المقهى</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {cafeProducts.slice(0, 9).map((p, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center justify-center p-2 rounded-xl border border-[#E5E0D8] bg-white aspect-square text-center"
                      >
                        <div className="mb-1">{p.icon}</div>
                        <span className="text-[9px] font-bold text-[#2F2D29] line-clamp-1">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Working Hours */}
                <div className="bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-xs flex flex-col justify-between">
                  <h4 className="text-base font-bold text-[#2F2D29] mb-3 text-center">مواعيد المقهى</h4>
                  <div className="divide-y divide-[#F0ECE4] text-xs font-bold">
                    {workingHours.map((wh) => (
                      <div key={wh.day} className="py-2 flex items-center justify-between">
                        <span className="text-[#2F2D29]">{wh.day}</span>
                        <span className={wh.isClosed ? "text-[#C93B2B]" : "text-[#7A746B]"}>
                          {wh.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Photo Carousel */}
                <div className="bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-xs flex flex-col justify-between">
                  <h4 className="text-base font-bold text-[#2F2D29] mb-3 text-center">صور المقهى</h4>
                  <div className="relative rounded-xl overflow-hidden border border-[#EAE6DF] h-48 bg-[#F5F0E8] flex items-center justify-center">
                    <img
                      src={samplePhotos[photoIndex]}
                      alt="صورة المقهى"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setPhotoIndex((prev) => (prev > 0 ? prev - 1 : samplePhotos.length - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-[#2F2D29]"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setPhotoIndex((prev) => (prev < samplePhotos.length - 1 ? prev + 1 : 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-[#2F2D29]"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}