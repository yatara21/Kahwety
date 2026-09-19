import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Coffee,
  Globe,
  Share2,
  Phone,
  Mail,
  User,
  RotateCcw,
  Store,
  MessageSquareQuote,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import { useCafe, useApproveCafe, useRejectCafe } from "@/hooks/useCafes";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/utils/imageUrl";
import { toast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

function parseWorkingHours(wh?: Record<string, string> | null) {
  if (!wh || typeof wh !== "object" || Object.keys(wh).length === 0) {
    return null;
  }

  if (wh.daily || wh["يومياً"] || wh["طوال الأسبوع"]) {
    const hours = wh.daily || wh["يومياً"] || wh["طوال الأسبوع"];
    return [
      { day: "طوال أيام الأسبوع", hours, isClosed: hours.includes("مغلق") },
    ];
  }

  if (wh.weekdays || wh.weekends || wh["أيام العمل"] || wh["نهاية الأسبوع"]) {
    const result = [];
    if (wh.weekdays || wh["أيام العمل"]) {
      const hours = wh.weekdays || wh["أيام العمل"];
      result.push({
        day: "أيام الأسبوع (الأحد - الخميس)",
        hours,
        isClosed: hours.includes("مغلق"),
      });
    }
    if (wh.weekends || wh["نهاية الأسبوع"]) {
      const hours = wh.weekends || wh["نهاية الأسبوع"];
      result.push({
        day: "نهاية الأسبوع (الجمعة - السبت)",
        hours,
        isClosed: hours.includes("مغلق"),
      });
    }
    return result;
  }

  const daysList = [
    { label: "السبت", keys: ["saturday", "السبت"] },
    { label: "الأحد", keys: ["sunday", "الأحد"] },
    { label: "الاثنين", keys: ["monday", "الاثنين", "الإثنين"] },
    { label: "الثلاثاء", keys: ["tuesday", "الثلاثاء"] },
    { label: "الأربعاء", keys: ["wednesday", "الأربعاء"] },
    { label: "الخميس", keys: ["thursday", "الخميس"] },
    { label: "الجمعة", keys: ["friday", "الجمعة"] },
  ];

  const parsedDays: { day: string; hours: string; isClosed: boolean }[] = [];
  let foundAny = false;
  for (const d of daysList) {
    let hoursVal: string | undefined;
    for (const k of d.keys) {
      if (wh[k] || wh[k.toLowerCase()]) {
        hoursVal = wh[k] || wh[k.toLowerCase()];
        break;
      }
    }
    if (hoursVal) {
      foundAny = true;
      parsedDays.push({
        day: d.label,
        hours: hoursVal,
        isClosed: hoursVal.includes("مغلق"),
      });
    }
  }

  if (foundAny) {
    return parsedDays;
  }

  return Object.entries(wh).map(([key, val]) => ({
    day: key,
    hours: String(val),
    isClosed: String(val).includes("مغلق"),
  }));
}

export default function CafeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cafe, isLoading, isError } = useCafe(id || "");
  const approveCafe = useApproveCafe();
  const rejectCafe = useRejectCafe();

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-[#BA9B65]" />
      </div>
    );
  }

  if (isError || !cafe) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-[#EAE6DF]" dir="rtl">
        <p className="text-[#8A7A5C] font-bold">لم يتم العثور على المقهى</p>
        <Button onClick={() => navigate("/cafes")} className="mt-4 bg-[#BA9B65] text-white rounded-xl">
          العودة لقائمة المقاهي
        </Button>
      </div>
    );
  }

  const isPending = cafe.registration_status === "PENDING";

  // Contact button actions
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "تم النسخ",
      description: "تم نسخ رابط صفحة المقهى بنجاح!",
    });
  };

  const handleOpenMap = () => {
    if (cafe.latitude && cafe.longitude) {
      window.open(`https://www.google.com/maps?q=${cafe.latitude},${cafe.longitude}`, "_blank");
    } else if (cafe.address || cafe.name) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafe.name + " " + (cafe.address || ""))}`, "_blank");
    } else {
      toast({
        title: "تنبيه",
        description: "موقع المقهى الجغرافي غير متوفر",
        variant: "destructive",
      });
    }
  };

  const handleEmail = () => {
    if (cafe.owner?.email) {
      window.location.href = `mailto:${cafe.owner.email}`;
    } else {
      toast({
        title: "تنبيه",
        description: "البريد الإلكتروني لمسؤول المقهى غير مسجل حالياً",
        variant: "destructive",
      });
    }
  };

  const handlePhone = () => {
    if (cafe.owner?.phone) {
      window.location.href = `tel:${cafe.owner.phone}`;
    } else {
      toast({
        title: "تنبيه",
        description: "رقم هاتف مسؤول المقهى غير مسجل حالياً",
        variant: "destructive",
      });
    }
  };

  const handleApprove = () => {
    approveCafe.mutate(cafe.id, {
      onSuccess: () => {
        toast({
          title: "تم الاعتماد",
          description: `تم قبول واعتماد مقهى "${cafe.name}" بنجاح`,
        });
      },
      onError: (err: any) => {
        toast({
          title: "خطأ",
          description: err?.response?.data?.message || "فشل اعتماد المقهى",
          variant: "destructive",
        });
      },
    });
  };

  const handleConfirmReject = () => {
    rejectCafe.mutate(cafe.id, {
      onSuccess: () => {
        setRejectConfirmOpen(false);
        toast({
          title: "تم الرفض",
          description: `تم رفض مقهى "${cafe.name}"`,
        });
      },
      onError: (err: any) => {
        setRejectConfirmOpen(false);
        toast({
          title: "خطأ",
          description: err?.response?.data?.message || "فشل رفض المقهى",
          variant: "destructive",
        });
      },
    });
  };

  const workingHoursDisplay = parseWorkingHours(cafe.working_hours);

  // Real photos from products
  const realPhotos = (cafe.products || [])
    .map((p) => p.image_url)
    .filter((url): url is string => Boolean(url))
    .map((url) => getImageUrl(url));

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* Top Header: Title + Social Links */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F2D29]">ملف المقهى</h1>

        {/* Action Contact Icons row */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            title="مشاركة رابط المقهى"
            className="w-9 h-9 rounded-xl border border-[#E5E0D8] bg-white flex items-center justify-center text-[#8A7A5C] hover:text-[#BA9B65] hover:border-[#BA9B65] transition-colors active:scale-95 cursor-pointer"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={handleOpenMap}
            title="الموقع على الخريطة"
            className="w-9 h-9 rounded-xl border border-[#E5E0D8] bg-white flex items-center justify-center text-[#8A7A5C] hover:text-[#BA9B65] hover:border-[#BA9B65] transition-colors active:scale-95 cursor-pointer"
          >
            <Globe size={16} />
          </button>
          <button
            onClick={handleEmail}
            title="إرسال بريد إلكتروني"
            className="w-9 h-9 rounded-xl border border-[#E5E0D8] bg-white flex items-center justify-center text-[#8A7A5C] hover:text-[#BA9B65] hover:border-[#BA9B65] transition-colors active:scale-95 cursor-pointer"
          >
            <Mail size={16} />
          </button>
          <button
            onClick={handlePhone}
            title="اتصال هاتفي"
            className="w-9 h-9 rounded-xl border border-[#E5E0D8] bg-white flex items-center justify-center text-[#8A7A5C] hover:text-[#BA9B65] hover:border-[#BA9B65] transition-colors active:scale-95 cursor-pointer"
          >
            <Phone size={16} />
          </button>
        </div>
      </div>

      {/* Top 3 Stat Cards from real DB data */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Products Count */}
        <div className="bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
          <div className="w-11 h-11 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
            <Coffee size={20} />
          </div>
          <div className="text-left">
            <p className="text-2xl font-extrabold text-[#2F2D29]">{cafe.products?.length ?? 0}</p>
            <p className="text-xs font-semibold text-[#8A7A5C]">عدد المنتجات</p>
          </div>
        </div>

        {/* Complaints Count */}
        <div className="bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
          <div className="w-11 h-11 rounded-full bg-[#FDE8E8] text-[#F05252] flex items-center justify-center">
            <MessageSquareQuote size={20} />
          </div>
          <div className="text-left">
            <p className="text-2xl font-extrabold text-[#2F2D29]">{cafe.complaints_count ?? 0}</p>
            <p className="text-xs font-semibold text-[#8A7A5C]">عدد الشكاوي</p>
          </div>
        </div>

        {/* Branches Count */}
        <div className="bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
          <div className="w-11 h-11 rounded-full bg-[#E1EFFE] text-[#3F83F8] flex items-center justify-center">
            <Store size={20} />
          </div>
          <div className="text-left">
            <p className="text-2xl font-extrabold text-[#2F2D29]">{(cafe.branches?.length ?? 0) + 1}</p>
            <p className="text-xs font-semibold text-[#8A7A5C]">إجمالي الفروع</p>
          </div>
        </div>
      </div>

      {/* Cafe Information Main Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Info Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1">
            {/* Column 1 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
                  <Coffee size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#8A7A5C]">اسم المقهى</p>
                  <p className="text-base font-extrabold text-[#2F2D29]">{cafe.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#8A7A5C]">حالة الاشتراك</p>
                  <p className="text-sm font-extrabold text-[#2F2D29]">
                    {cafe.is_subscribed ? (
                      <span className="text-[#2E7D32]">مشترك نشط</span>
                    ) : (
                      <span className="text-[#8A7A5C]">غير مشترك</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#8A7A5C]">رقم المسؤول</p>
                  <p className="text-sm font-extrabold text-[#2F2D29]" dir="ltr">
                    {cafe.owner?.phone || "غير مسجل"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#8A7A5C]">البريد الالكتروني للمسؤول</p>
                  <p className="text-sm font-extrabold text-[#2F2D29]" dir="ltr">
                    {cafe.owner?.email || "غير مسجل"}
                  </p>
                </div>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#8A7A5C]">اسم المسؤول</p>
                  <p className="text-sm font-extrabold text-[#2F2D29]">
                    {cafe.owner?.full_name || "غير محدد"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons (Approve / Reject if pending) or Real Branch dropdown */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-3 justify-center min-w-[200px]">
            {isPending ? (
              <div className="flex items-center gap-3 w-full justify-end">
                <button
                  onClick={handleApprove}
                  disabled={approveCafe.isPending}
                  className="px-6 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1E5C22] text-white font-bold text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  {approveCafe.isPending ? "جاري الاعتماد..." : "قبول"}
                </button>
                <button
                  onClick={() => setRejectConfirmOpen(true)}
                  disabled={rejectCafe.isPending}
                  className="px-6 py-2 rounded-xl bg-[#C93B2B] hover:bg-[#A82E20] text-white font-bold text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  {rejectCafe.isPending ? "جاري الرفض..." : "رفض"}
                </button>
              </div>
            ) : (
              <div className="w-full">
                <p className="text-xs font-bold text-[#8A7A5C] mb-1.5 text-right">بيانات الفروع</p>
                <div className="relative">
                  <select className="w-full appearance-none bg-white border border-[#E5E0D8] rounded-xl px-4 py-2.5 pr-8 text-xs font-bold text-[#2F2D29] focus:outline-none cursor-pointer">
                    <option value="main">الفرع الرئيسي: {cafe.address || cafe.name}</option>
                    {cafe.branches && cafe.branches.length > 0 && cafe.branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} - {b.address}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7A5C] pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3 Bottom Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Column 1: Products Grid from real DB */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex flex-col">
          <h3 className="text-lg font-bold text-[#2F2D29] mb-4 text-center">منتجات المقهى</h3>
          {cafe.products && cafe.products.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {cafe.products.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:border-[#BA9B65] transition-colors aspect-square text-center"
                >
                  {p.image_url ? (
                    <img src={getImageUrl(p.image_url)} alt={p.name} className="w-8 h-8 rounded-lg object-cover mb-1.5" />
                  ) : (
                    <div className="mb-1.5"><Sparkles size={20} className="text-[#BA9B65]" /></div>
                  )}
                  <span className="text-[10px] font-bold text-[#2F2D29] leading-tight line-clamp-1">
                    {p.name}
                  </span>
                  {p.price != null && (
                    <span className="text-[10px] text-[#BA9B65] font-extrabold mt-0.5">
                      {p.price} ر.س
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <Coffee size={32} className="text-[#BA9B65]/40 mb-2" />
              <p className="text-xs font-bold text-[#8A7A5C]">لا توجد منتجات مسجلة لهذا المقهى حالياً</p>
            </div>
          )}
        </div>

        {/* Column 2: Working Hours Table */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex flex-col justify-between">
          <h3 className="text-lg font-bold text-[#2F2D29] mb-4 text-center">مواعيد المقهى</h3>
          {workingHoursDisplay && workingHoursDisplay.length > 0 ? (
            <div className="divide-y divide-[#F0ECE4] text-sm font-bold">
              {workingHoursDisplay.map((wh) => (
                <div key={wh.day} className="py-2.5 flex items-center justify-between">
                  <span className="text-[#2F2D29]">{wh.day}</span>
                  <span className={wh.isClosed ? "text-[#C93B2B]" : "text-[#7A746B]"}>
                    {wh.hours}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <Clock size={32} className="text-[#BA9B65]/40 mb-2" />
              <p className="text-xs font-bold text-[#8A7A5C]">لم يتم تحديد مواعيد العمل لهذا المقهى</p>
            </div>
          )}
        </div>

        {/* Column 3: Cafe Photos Carousel */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex flex-col justify-between">
          <h3 className="text-lg font-bold text-[#2F2D29] mb-4 text-center">صور المقهى</h3>
          {realPhotos.length > 0 ? (
            <>
              <div className="relative rounded-2xl overflow-hidden border border-[#EAE6DF] h-64 bg-[#FAF8F5] flex items-center justify-center">
                <img
                  src={realPhotos[selectedPhotoIndex]}
                  alt="صورة المقهى"
                  className="w-full h-full object-cover transition-all duration-300"
                />
                {/* Left arrow */}
                {realPhotos.length > 1 && (
                  <button
                    onClick={() => setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : realPhotos.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-[#2F2D29] hover:bg-white shadow-sm transition-all cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}
                {/* Right arrow */}
                {realPhotos.length > 1 && (
                  <button
                    onClick={() => setSelectedPhotoIndex((prev) => (prev < realPhotos.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-[#2F2D29] hover:bg-white shadow-sm transition-all cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
              {realPhotos.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-3">
                  {realPhotos.map((_, i) => (
                    <span
                      key={i}
                      onClick={() => setSelectedPhotoIndex(i)}
                      className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${
                        selectedPhotoIndex === i ? "bg-[#BA9B65] w-4" : "bg-[#E5E0D8]"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-center text-[#BA9B65] mb-2">
                <ImageIcon size={24} />
              </div>
              <p className="text-xs font-bold text-[#8A7A5C]">لا توجد صور لهذا المقهى</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        open={rejectConfirmOpen}
        onOpenChange={setRejectConfirmOpen}
        title="تأكيد رفض المقهى"
        description={`هل أنت متأكد من رغبتك في رفض مقهى "${cafe.name}"؟`}
        confirmText="رفض المقهى"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={handleConfirmReject}
        isLoading={rejectCafe.isPending}
      />
    </div>
  );
}
