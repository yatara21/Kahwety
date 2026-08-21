import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Coffee,
  MessageSquare,
  Tag,
  Calendar,
  CreditCard,
  Package,
  Clock,
  Store,
  Wallet,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, icon, color, bgColor }: StatCardProps) {
  return (
    <Card className="border-[#e8dcc8]/50 bg-white">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ backgroundColor: bgColor }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#8a7a5c] truncate">{title}</p>
            <p className="text-xl font-bold text-[#2f2d29]">
              {typeof value === "number" ? value.toLocaleString("ar-EG") : value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="border-[#e8dcc8]/50 bg-white">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#f0e8d0] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 bg-[#f0e8d0] rounded animate-pulse" />
            <div className="h-5 w-12 bg-[#f0e8d0] rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useDashboard();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#2f2d29]">حدث خطأ في تحميل البيانات</h3>
          <p className="text-[#8a7a5c] text-sm mt-1">يرجى المحاولة مرة أخرى</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-lg bg-[#c8a44e] text-white font-medium hover:bg-[#b8943e] transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="عدد الأعضاء"
              value={(stats?.counts.customers ?? 0) + (stats?.counts.cafe_owners ?? 0)}
              icon={<Users className="h-5 w-5" />}
              color="#b49b68"
              bgColor="#fdf8ef"
            />
            <StatCard
              title="عدد المستخدمين"
              value={stats?.counts.customers ?? 0}
              icon={<Users className="h-5 w-5" />}
              color="#3b82f6"
              bgColor="#eff6ff"
            />
            <StatCard
              title="عدد المقاهي"
              value={stats?.counts.cafes ?? 0}
              icon={<Coffee className="h-5 w-5" />}
              color="#c8a44e"
              bgColor="#fdf8ed"
            />
            <StatCard
              title="المقاهي المعلقة"
              value={stats?.counts.pending_cafes ?? 0}
              icon={<Clock className="h-5 w-5" />}
              color="#eab308"
              bgColor="#fefce8"
            />
          </>
        )}
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="الشكاوى"
              value={stats?.counts.complaints ?? 0}
              icon={<MessageSquare className="h-5 w-5" />}
              color="#ef4444"
              bgColor="#fef2f2"
            />
            <StatCard
              title="العروض النشطة"
              value={stats?.counts.offers ?? 0}
              icon={<Tag className="h-5 w-5" />}
              color="#22c55e"
              bgColor="#f0fdf4"
            />
            <StatCard
              title="الفعاليات النشطة"
              value={stats?.counts.events ?? 0}
              icon={<Calendar className="h-5 w-5" />}
              color="#a855f7"
              bgColor="#faf5ff"
            />
            <StatCard
              title="الاشتراكات"
              value={stats?.counts.subscriptions ?? 0}
              icon={<CreditCard className="h-5 w-5" />}
              color="#c8a44e"
              bgColor="#fdf8ed"
            />
          </>
        )}
      </div>

      {/* Operational stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="الاشتراكات النشطة"
              value={stats?.counts.active_subscriptions ?? 0}
              icon={<CreditCard className="h-5 w-5" />}
              color="#22c55e"
              bgColor="#f0fdf4"
            />
            <StatCard
              title="اشتراكات شهرية"
              value={stats?.counts.monthly_subscriptions ?? 0}
              icon={<Calendar className="h-5 w-5" />}
              color="#3b82f6"
              bgColor="#eff6ff"
            />
            <StatCard
              title="اشتراكات سنوية"
              value={stats?.counts.annual_subscriptions ?? 0}
              icon={<Calendar className="h-5 w-5" />}
              color="#a855f7"
              bgColor="#faf5ff"
            />
            <StatCard
              title="إيرادات الاشتراكات"
              value={`${(stats?.counts.subscription_revenue ?? 0).toLocaleString("ar-SA")} ر.س`}
              icon={<Wallet className="h-5 w-5" />}
              color="#c8a44e"
              bgColor="#fdf8ed"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="مشتركو العملاء"
              value={stats?.counts.customer_subscribers ?? 0}
              icon={<Users className="h-5 w-5" />}
              color="#22c55e"
              bgColor="#f0fdf4"
            />
            <StatCard
              title="مشتركو أصحاب المقاهي"
              value={stats?.counts.cafe_subscribers ?? 0}
              icon={<Store className="h-5 w-5" />}
              color="#c8a44e"
              bgColor="#fdf8ed"
            />
            <StatCard
              title="المقاهي المقترحة"
              value={stats?.counts.suggested_cafes ?? 0}
              icon={<Store className="h-5 w-5" />}
              color="#a855f7"
              bgColor="#faf5ff"
            />
            <StatCard
              title="المنتجات والخدمات"
              value={stats?.counts.products ?? 0}
              icon={<Package className="h-5 w-5" />}
              color="#3b82f6"
              bgColor="#eff6ff"
            />
          </>
        )}
      </div>

      {/* Operational breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-[#e8dcc8]/50 bg-white">
          <div className="p-4 border-b border-[#e8dcc8]/30">
            <h3 className="font-semibold text-[#2f2d29]">حالة الشكاوى</h3>
          </div>
          <CardContent className="p-6">
            <div className="space-y-5">
              {[
                { label: "قيد المراجعة", value: stats?.counts.pending_complaints ?? 0, color: "#eab308" },
                { label: "تم الحل", value: stats?.counts.resolved_complaints ?? 0, color: "#22c55e" },
                {
                  label: "حالات أخرى",
                  value: Math.max(
                    0,
                    (stats?.counts.complaints ?? 0) -
                      (stats?.counts.pending_complaints ?? 0) -
                      (stats?.counts.resolved_complaints ?? 0)
                  ),
                  color: "#3b82f6",
                },
              ].map((item) => {
                const total = Math.max(stats?.counts.complaints ?? 0, 1);
                const percentage = Math.round((item.value / total) * 100);
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-[#2f2d29]">{item.label}</span>
                      <span className="text-[#8a7a5c]">{item.value} ({percentage}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#f0e8d0] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e8dcc8]/50 bg-white">
          <div className="p-4 border-b border-[#e8dcc8]/30">
            <h3 className="font-semibold text-[#2f2d29]">ملخص الاشتراكات</h3>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div
                className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#22c55e ${Math.min(
                    ((stats?.counts.active_subscriptions ?? 0) / Math.max(stats?.counts.subscriptions ?? 0, 1)) * 100,
                    100
                  )}%, #f0e8d0 0)`,
                }}
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-xl font-bold text-[#2f2d29]">
                  {stats?.counts.active_subscriptions ?? 0}
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[#8a7a5c]">إجمالي الاشتراكات</p>
                  <p className="text-lg font-bold text-[#2f2d29]">{stats?.counts.subscriptions ?? 0}</p>
                </div>
                <div>
                  <p className="text-[#8a7a5c]">النشطة</p>
                  <p className="text-lg font-bold text-green-600">{stats?.counts.active_subscriptions ?? 0}</p>
                </div>
                <div>
                  <p className="text-[#8a7a5c]">شهري / سنوي</p>
                  <p className="text-lg font-bold text-[#2f2d29]">
                    {(stats?.counts.monthly_subscriptions ?? 0)} / {(stats?.counts.annual_subscriptions ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[#8a7a5c]">عملاء / أصحاب مقاهي</p>
                  <p className="text-lg font-bold text-[#2f2d29]">
                    {(stats?.counts.customer_subscribers ?? 0)} / {(stats?.counts.cafe_subscribers ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
