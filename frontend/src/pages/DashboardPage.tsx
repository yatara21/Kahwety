import { useState } from "react";
import {
  Bell,
  Users2,
  Coffee,
  Store,
  MessageSquareQuote,
  ShieldCheck,
  UserCheck,
  Star,
  ChevronDown,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { SendNotificationModal } from "@/components/SendNotificationModal";

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboard();
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2024");

  const customersCount = stats?.counts.customers ?? 0;
  const subscribersCount = stats?.counts.active_subscriptions ?? 0;
  const adminsCount = stats?.counts.admins ?? 0;
  const cafesCount = stats?.counts.cafes ?? 0;
  const suggestedCafesCount = stats?.counts.suggested_cafes ?? 0;
  const complaintsCount = stats?.counts.complaints ?? 0;
  const pendingAlertsCount = (stats?.counts.pending_complaints ?? 0) + (stats?.counts.pending_cafes ?? 0) + (stats?.counts.suggested_cafes ?? 0);

  // City bar chart data matching real database distribution
  const citiesData = stats?.analytics.cities_distribution && stats.analytics.cities_distribution.length > 0
    ? stats.analytics.cities_distribution
    : [];

  const maxCityVal = Math.max(...citiesData.map((c) => c.count), 1);

  const alerts = stats?.analytics.recent_alerts && stats.analytics.recent_alerts.length > 0
    ? stats.analytics.recent_alerts
    : [
        stats?.counts.pending_complaints ? `هناك ${stats.counts.pending_complaints} شكاوى لم تُراجع بعد` : "لا توجد شكاوى معلقة حالياً",
        stats?.counts.pending_cafes ? `هناك ${stats.counts.pending_cafes} مقاهٍ جديدة بانتظار الموافقة على طلب الانضمام.` : "جميع طلبات انضمام المقاهي تمت معالجتها.",
        stats?.counts.suggested_cafes ? `يوجد ${stats.counts.suggested_cafes} طلبات مقترحة لمقاهي جديدة.` : "لا توجد اقتراحات مقاهي جديدة.",
      ];

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* Top Header: Title + Red CTA Button matching Figma */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F2D29]">لوحة التحكم</h1>
        <button
          onClick={() => setNotificationModalOpen(true)}
          className="px-5 py-2.5 bg-[#D34036] hover:bg-[#B93229] text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95"
        >
          إرسال إشعار
        </button>
      </div>

      {/* Top Stats Grid: Notifications Card on Right (in RTL), 6 Stat Cards on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Rightmost column in RTL: Notifications Card */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
                <Bell size={20} />
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D34036] text-white text-[11px] font-bold flex items-center justify-center">
                {pendingAlertsCount}
              </span>
            </div>
            <h3 className="text-xl font-bold text-[#2F2D29]">إشعارات</h3>
          </div>
          <ul className="space-y-3 text-xs text-[#524E48] leading-relaxed pr-2">
            {alerts.map((alert, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F2D29] mt-1.5 flex-shrink-0" />
                <span>{alert}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 6 Stat Cards in 2 rows of 3 */}
        <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Row 1 */}
          <div className="bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
              <ShieldCheck size={20} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-extrabold text-[#2F2D29]">{adminsCount}</p>
              <p className="text-xs font-semibold text-[#8A7A5C]">عدد المسؤولين</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
              <UserCheck size={20} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-extrabold text-[#2F2D29]">{subscribersCount}</p>
              <p className="text-xs font-semibold text-[#8A7A5C]">عدد المشتركين</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
              <Users2 size={20} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-extrabold text-[#2F2D29]">{customersCount}</p>
              <p className="text-xs font-semibold text-[#8A7A5C]">المستخدمين</p>
            </div>
          </div>

          {/* Row 2 */}
          <div className="bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
              <MessageSquareQuote size={20} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-extrabold text-[#2F2D29]">{complaintsCount}</p>
              <p className="text-xs font-semibold text-[#8A7A5C]">الشكاوي</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
              <Store size={20} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-extrabold text-[#2F2D29]">{suggestedCafesCount}</p>
              <p className="text-xs font-semibold text-[#8A7A5C]">المقاهي المقترحة</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-[#BA9B65] flex items-center justify-center text-white">
              <Coffee size={20} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-extrabold text-[#2F2D29]">{cafesCount}</p>
              <p className="text-xs font-semibold text-[#8A7A5C]">المقاهي</p>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Donut Chart + Radial Rating Rings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Donut Chart: Coffee categories */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex flex-col justify-between">
          <div className="relative flex items-center justify-center py-4">
            <svg viewBox="0 0 120 120" className="w-44 h-44 -rotate-90">
              {/* Segment 1: Cold Coffee 50% */}
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="transparent"
                stroke="#BA9B65"
                strokeWidth="18"
                strokeDasharray="141.37 282.74"
                strokeDashoffset="0"
              />
              {/* Segment 2: Hot Coffee 30% */}
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="transparent"
                stroke="#5A3E26"
                strokeWidth="18"
                strokeDasharray="84.82 282.74"
                strokeDashoffset="-141.37"
              />
              {/* Segment 3: Specialty Coffee 20% */}
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="transparent"
                stroke="#D8C3A0"
                strokeWidth="18"
                strokeDasharray="56.55 282.74"
                strokeDashoffset="-226.19"
              />
            </svg>
            {/* Percentage labels floating */}
            <span className="absolute top-6 left-12 text-[11px] font-bold text-[#2F2D29]">50%</span>
            <span className="absolute top-8 right-12 text-[11px] font-bold text-[#2F2D29]">30%</span>
            <span className="absolute bottom-6 left-20 text-[11px] font-bold text-[#2F2D29]">20%</span>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs font-bold text-[#2F2D29] pt-2 border-t border-[#F0ECE4]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5A3E26]" />
              <span>القهوة الساخنة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#BA9B65]" />
              <span>القهوة الباردة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D8C3A0]" />
              <span>القهوة المختصة</span>
            </div>
          </div>
        </div>

        {/* 3 Radial Rings */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-xs flex items-center justify-around">
          {/* Ring 1: Most Visited */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex items-center justify-center w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#FDE8E8" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#F05252"
                  strokeWidth="12"
                  strokeDasharray="251.32"
                  strokeDashoffset={251.32 * (1 - 0.81)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-base font-extrabold text-[#2F2D29]">81%</span>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-[#2F2D29]">الأكثر نشاطاً</p>
              <p className="text-xs font-extrabold text-[#BA9B65] mt-0.5 truncate max-w-[120px]">{stats?.analytics.most_visited_cafe || "لا يوجد"}</p>
            </div>
          </div>

          {/* Ring 2: Least active */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex items-center justify-center w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#DEF7EC" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#0E9F6E"
                  strokeWidth="12"
                  strokeDasharray="251.32"
                  strokeDashoffset={251.32 * (1 - 0.22)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-base font-extrabold text-[#2F2D29]">22%</span>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-[#2F2D29]">الأقل نشاطاً</p>
              <p className="text-xs font-extrabold text-[#BA9B65] mt-0.5 truncate max-w-[120px]">{stats?.analytics.least_visited_cafe || "لا يوجد"}</p>
            </div>
          </div>

          {/* Ring 3: Top Product */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex items-center justify-center w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E1EFFE" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#3F83F8"
                  strokeWidth="12"
                  strokeDasharray="251.32"
                  strokeDashoffset={251.32 * (1 - 0.62)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-base font-extrabold text-[#2F2D29]">62%</span>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-[#2F2D29]">المنتج الأكثر طلباً</p>
              <p className="text-xs font-extrabold text-[#BA9B65] mt-0.5 truncate max-w-[120px]">{stats?.analytics.most_purchased_product || "لا يوجد"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row: City Bar Chart ("المقاهي في المدن") */}
      <div className="bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-xs">
        <h3 className="text-lg font-bold text-[#2F2D29] mb-6 text-right">المقاهي في المدن</h3>
        <div className="relative h-64 flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6">
          {/* Background grid lines */}
          <div className="absolute inset-x-0 top-6 border-b border-dashed border-[#E5E0D8]" />
          <div className="absolute inset-x-0 top-20 border-b border-dashed border-[#E5E0D8]" />
          <div className="absolute inset-x-0 top-36 border-b border-dashed border-[#E5E0D8]" />
          <div className="absolute inset-x-0 top-52 border-b border-dashed border-[#E5E0D8]" />

          {citiesData.map((item) => (
            <div key={item.city} className="flex-1 flex flex-col items-center h-full justify-end relative z-10">
              {item.is_highest && item.count > 0 && (
                <div className="mb-1.5 px-2 py-0.5 rounded-md bg-[#4A3B2C] text-white text-[10px] font-bold animate-bounce">
                  {item.count}
                </div>
              )}
              {/* Dual shaded bar */}
              <div
                className="w-full max-w-[40px] rounded-t-lg overflow-hidden flex flex-col justify-end transition-all"
                style={{ height: `${item.count > 0 ? Math.max(15, (item.count / maxCityVal) * 100) : 8}%` }}
              >
                <div className="w-full h-1/3 bg-[#F4EBDC]" />
                <div className="w-full h-2/3 bg-[#B89C66]" />
              </div>
              <span className={`text-[11px] mt-3 font-bold truncate max-w-[48px] ${item.is_highest ? "text-[#2F2D29]" : "text-[#7A746B]"}`}>
                {item.city}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fourth Row: Best Cafe Card + Total Income Area Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column in RTL: Best Cafe of Month */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex flex-col justify-between">
          <h3 className="text-base font-bold text-[#2F2D29] mb-3 text-right">افضل مقهى لهذا الشهر</h3>
          <div className="rounded-xl overflow-hidden mb-3 border border-[#EAE6DF] h-36 bg-[#F5F0E8]">
            <img
              src="/resources/Cafe.png"
              alt={stats?.analytics.most_visited_cafe || "Cafe"}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80";
              }}
            />
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-right">
              <h4 className="text-lg font-extrabold text-[#2F2D29] truncate">{stats?.analytics.most_visited_cafe || "لا توجد مقاهي حالياً"}</h4>
              <p className="text-xs text-[#8A7A5C]">أكثر زيارة ونشاطاً</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-[#7A746B]">(5.00)</span>
              <div className="flex text-[#F59E0B]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="#F59E0B" />
                ))}
              </div>
            </div>
          </div>
          <button className="text-xs text-[#BA9B65] hover:underline font-bold text-center pt-2 border-t border-[#F0ECE4]">
            قراءة تقييمات الزبائن
          </button>
        </div>

        {/* Right column in RTL: Annual Income Area Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-[#F7F4EE] border border-[#E5E0D8] rounded-lg px-3 py-1.5 pr-8 text-xs font-bold text-[#2F2D29] focus:outline-none cursor-pointer"
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
              <ChevronDown size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A7A5C] pointer-events-none" />
            </div>
            <h3 className="text-lg font-bold text-[#2F2D29]">إجمالي الدخل</h3>
          </div>

          {/* Area Chart SVG */}
          <div className="relative h-48 w-full pt-4">
            {/* Tooltip on September 2024 */}
            <div className="absolute top-4 right-[38%] bg-white border border-[#E5E0D8] rounded-xl px-3 py-1.5 shadow-md text-center z-10 pointer-events-none">
              <p className="text-xs font-bold text-[#2F2D29]">SAR 15000</p>
              <p className="text-[10px] text-[#8A7A5C]">سبتمبر 2024</p>
            </div>

            <svg viewBox="0 0 600 160" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BA9B65" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#BA9B65" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Area path */}
              <path
                d="M 0 140 Q 50 110, 100 120 T 200 90 T 300 40 T 400 100 T 500 60 T 600 80 L 600 160 L 0 160 Z"
                fill="url(#incomeGradient)"
              />
              {/* Stroke path */}
              <path
                d="M 0 140 Q 50 110, 100 120 T 200 90 T 300 40 T 400 100 T 500 60 T 600 80"
                fill="transparent"
                stroke="#BA9B65"
                strokeWidth="3"
              />
              {/* Highlight Point */}
              <circle cx="300" cy="40" r="5" fill="#BA9B65" stroke="#FFFFFF" strokeWidth="2" />
            </svg>

            {/* Months Axis */}
            <div className="flex items-center justify-between text-[10px] text-[#8A7A5C] font-semibold pt-2 border-t border-[#F0ECE4]">
              <span>يناير</span>
              <span>فبراير</span>
              <span>مارس</span>
              <span>إبريل</span>
              <span>مايو</span>
              <span>يونية</span>
              <span>يولية</span>
              <span>اغسطس</span>
              <span className="font-bold text-[#2F2D29]">سبتمبر</span>
              <span>أكتوبر</span>
              <span>نوفمبر</span>
              <span>ديسمبر</span>
            </div>
          </div>
        </div>
      </div>

      {/* Send Notification Modal */}
      <SendNotificationModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
      />
    </div>
  );
}
