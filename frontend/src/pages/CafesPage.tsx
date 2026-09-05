import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Filter, Eye, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useCafes } from "@/hooks/useCafes";
import { Input } from "@/components/ui/input";

export default function CafesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("page_size") || "10");
  const search = searchParams.get("search") || "";

  const params = {
    page,
    page_size: pageSize,
    ...(search && { search }),
  };

  const { data, isLoading } = useCafes(params);
  const cafes = data?.items || [];
  const totalPages = data?.total_pages || 1;

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

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F2D29]">المقاهي</h1>

      {/* Search & Filter Header matching Cafe-1.png */}
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

      {/* Table matching Cafe-1.png from Figma */}
      <div className="bg-white rounded-2xl border border-[#EAE6DF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-[#F0ECE4] text-[#8A7A5C] text-sm font-semibold">
                <th className="py-4 px-6 w-16 text-center">#</th>
                <th className="py-4 px-6 text-center">اسم المقهى</th>
                <th className="py-4 px-6 text-center">عدد الفروع</th>
                <th className="py-4 px-6 text-center">تاريخ الإضافة</th>
                <th className="py-4 px-6 text-center">المسؤول</th>
                <th className="py-4 px-6 text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE4]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6 text-center"><div className="h-4 w-6 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-28 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-12 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-24 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-28 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-8 w-8 bg-gray-100 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : cafes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#8A7A5C] font-semibold text-sm">
                    لا توجد مقاهي مسجلة حالياً
                  </td>
                </tr>
              ) : (
                cafes.map((cafe, index) => (
                  <tr key={cafe.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {cafe.name || "سيلانترو"}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {cafe.branches?.length || 4}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-[#524E48]" dir="ltr">
                      {cafe.created_at ? new Date(cafe.created_at).toLocaleDateString("en-GB") : "2/5/2025"}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {cafe.owner?.full_name || "احمد محمد"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => navigate(`/cafes/${cafe.id}`)}
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

        {/* Pagination matching Cafe-1.png from Figma */}
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
    </div>
  );
}
