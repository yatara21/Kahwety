import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Ticket,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useSubscriptions,
  useSubscriptionPlans,
  useCreatePlan,
  useUpdatePlan,
} from "@/hooks/useSubscriptions";
import { useCoupons, useCreateCoupon } from "@/hooks/useCoupons";
import type { SubscriptionPlan } from "@/types";

const couponSchema = z.object({
  code: z.string().min(1, "رمز الكوبون مطلوب"),
  discount_percent: z
    .number({ invalid_type_error: "النسبة يجب أن تكون رقمًا" })
    .min(1)
    .max(100),
  end_date: z.string().min(1, "تاريخ الانتهاء مطلوب"),
});

type CouponFormData = z.infer<typeof couponSchema>;

const planSchema = z.object({
  name: z.string().min(1, "اسم الباقة مطلوب"),
  description: z.string().optional(),
  subscriber_type: z.enum(["CAFE_OWNER", "CUSTOMER"]).default("CAFE_OWNER"),
  billing_cycle: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"),
  price: z.number({ invalid_type_error: "السعر يجب أن يكون رقمًا" }).min(0, "السعر لا يمكن أن يكون سالبًا"),
  duration_days: z.number({ invalid_type_error: "المدة يجب أن تكون رقمًا" }).min(1, "المدة يجب أن تكون يومًا واحدًا على الأقل"),
  currency: z.string().default("SAR"),
});

type PlanFormData = z.infer<typeof planSchema>;

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [createPlanModalOpen, setCreatePlanModalOpen] = useState(false);
  const [editPlanModalOpen, setEditPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);

  const { data: subsData, isLoading } = useSubscriptions({ page, page_size: pageSize });
  const { data: plansData } = useSubscriptionPlans({ page: 1, page_size: 50 });
  const { data: couponsData } = useCoupons();

  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const createCoupon = useCreateCoupon();

  const subs = subsData?.items ?? [];
  const totalPages = subsData?.total_pages ?? 1;
  const coupons = couponsData ?? [];
  const plans = plansData?.items ?? [];

  const couponForm = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discount_percent: 15,
      end_date: "",
    },
  });

  const planForm = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      description: "",
      subscriber_type: "CAFE_OWNER",
      billing_cycle: "MONTHLY",
      price: 99,
      duration_days: 30,
      currency: "SAR",
    },
  });

  const handleCreatePlan = (values: PlanFormData) => {
    createPlan.mutate(
      {
        name: values.name,
        description: values.description || null,
        subscriber_type: values.subscriber_type,
        billing_cycle: values.billing_cycle,
        price: Number(values.price),
        currency: values.currency || "SAR",
        duration_days: Number(values.duration_days),
        is_active: true,
      },
      {
        onSuccess: () => {
          setCreatePlanModalOpen(false);
          planForm.reset();
        },
      }
    );
  };

  const handleCreateCoupon = (values: CouponFormData) => {
    createCoupon.mutate(
      {
        code: values.code,
        discount_percent: values.discount_percent,
        start_date: new Date().toISOString(),
        end_date: new Date(values.end_date).toISOString(),
        is_active: true,
      },
      {
        onSuccess: () => {
          setCouponDialogOpen(false);
          couponForm.reset();
        },
      }
    );
  };

  const openEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setEditPrice(Number(plan.price));
    setEditPlanModalOpen(true);
  };

  const handleSavePlanPrice = () => {
    if (!selectedPlan) return;
    updatePlan.mutate(
      { id: selectedPlan.id, data: { price: editPrice } },
      {
        onSuccess: () => {
          setEditPlanModalOpen(false);
          setSelectedPlan(null);
        },
      }
    );
  };

  const renderStatusPill = (status: string, expiresAt: string | null) => {
    if (status === "ACTIVE") {
      if (expiresAt) {
        const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 3600 * 24));
        if (days <= 7 && days > 0) {
          return (
            <span className="px-4 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706]">
              علي وشك الانتهاء
            </span>
          );
        }
      }
      return (
        <span className="px-4 py-1 rounded-full text-xs font-bold bg-[#DEF7EC] text-[#0E9F6E]">
          نشط
        </span>
      );
    }
    return (
      <span className="px-4 py-1 rounded-full text-xs font-bold bg-[#F3F4F6] text-[#6B7280]">
        منتهي
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-12 font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* 1. Coupons Section matching subscription.png */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#2F2D29]">إدارة الكوبونات</h2>
          <button
            onClick={() => setCouponDialogOpen(true)}
            className="px-6 py-2.5 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95"
          >
            إضافة كوبون
          </button>
        </div>

        {/* Coupon Ticket Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Coupon 1 */}
          <div className="relative bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between overflow-hidden">
            {/* Cutout circles on sides for ticket feel */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#EAE6DF]" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#EAE6DF]" />

            {/* Left part: Logo */}
            <div className="flex items-center gap-2 pl-4">
              <img src="/resources/Asset 50 1.png" alt="قهوتي" className="w-8 h-8 object-contain" />
              <span className="text-base font-extrabold text-[#BA9B65]">قهوتي</span>
            </div>

            {/* Dotted divider */}
            <div className="h-12 border-l border-dashed border-[#E5E0D8]" />

            {/* Right part: Discount info */}
            <div className="pr-4 text-right">
              <p className="text-xl font-extrabold text-[#2F2D29]">خصم 25%</p>
              <p className="text-[11px] text-[#8A7A5C] font-semibold mt-0.5">سارية حتي 17 مايو 2025</p>
            </div>
          </div>

          {/* Coupon 2 */}
          <div className="relative bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between overflow-hidden">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#EAE6DF]" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#EAE6DF]" />

            <div className="flex items-center gap-2 pl-4">
              <img src="/resources/Asset 50 1.png" alt="قهوتي" className="w-8 h-8 object-contain" />
              <span className="text-base font-extrabold text-[#BA9B65]">قهوتي</span>
            </div>

            <div className="h-12 border-l border-dashed border-[#E5E0D8]" />

            <div className="pr-4 text-right">
              <p className="text-xl font-extrabold text-[#2F2D29]">خصم 15%</p>
              <p className="text-[11px] text-[#8A7A5C] font-semibold mt-0.5">سارية حتي 17 مايو 2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Subscription Plans Section matching subscription.png */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#2F2D29]">إدارة الاشتراكات</h2>
          <button
            onClick={() => {
              planForm.reset({
                name: "",
                description: "",
                subscriber_type: "CAFE_OWNER",
                billing_cycle: "MONTHLY",
                price: 99,
                duration_days: 30,
                currency: "SAR",
              });
              setCreatePlanModalOpen(true);
            }}
            className="px-6 py-2.5 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>إضافة باقة</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.length === 0 ? (
            <>
              {/* Default Plan 1: Basic */}
              <div className="bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-xs flex flex-col justify-between relative">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-base font-extrabold text-[#2F2D29]">الباقة الاساسية</h3>
                </div>
                <ul className="space-y-2.5 text-xs text-[#524E48] font-semibold mb-6 pr-2 leading-relaxed flex-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2F2D29] rounded-xs" />
                    <span>الظهور في قائمة Top List في التطبيق للعملاء.</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-[#F0ECE4] flex items-center justify-between">
                  <p className="text-sm font-extrabold text-[#BA9B65]">
                    2 <span className="text-xs">ريال يومياً</span>
                  </p>
                </div>
              </div>

              {/* Default Plan 2: Premium */}
              <div className="bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-xs flex flex-col justify-between relative">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-base font-extrabold text-[#2F2D29]">الباقة البريميوم</h3>
                </div>
                <ul className="space-y-2.5 text-xs text-[#524E48] font-semibold mb-6 pr-2 leading-relaxed flex-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2F2D29] rounded-xs" />
                    <span>الظهور في قائمة المقاهي داخل التطبيق</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2F2D29] rounded-xs" />
                    <span>قسم لكتابة العروض</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2F2D29] rounded-xs" />
                    <span>أولوية الظهور في نفس المدينة.</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-[#F0ECE4] flex items-center justify-between">
                  <p className="text-sm font-extrabold text-[#BA9B65]">
                    5 <span className="text-xs">ريال يومياً</span>
                  </p>
                </div>
              </div>
            </>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-xs flex flex-col justify-between relative hover:border-[#BA9B65]/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-[#2F2D29]">{plan.name}</h3>
                    <p className="text-[11px] text-[#8A7A5C] font-semibold mt-0.5">
                      {plan.subscriber_type === "CAFE_OWNER" ? "أصحاب المقاهي" : "العملاء"} • {plan.billing_cycle === "ANNUAL" ? "سنوي" : "شهري"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-[#8A7A5C] hover:text-[#2F2D29] p-1 rounded-lg hover:bg-[#FAF8F5]">
                        <MoreVertical size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-right">
                      <DropdownMenuItem onClick={() => openEditPlan(plan)}>
                        تعديل السعر
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 text-xs text-[#524E48] font-semibold mb-6 pr-2 leading-relaxed flex-1">
                  {plan.description ? (
                    <p className="whitespace-pre-line leading-relaxed">{plan.description}</p>
                  ) : (
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#2F2D29] rounded-xs" />
                        <span>الظهور في قائمة المقاهي داخل التطبيق</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#2F2D29] rounded-xs" />
                        <span>قسم لكتابة العروض والفعاليات</span>
                      </li>
                    </ul>
                  )}
                </div>

                <div className="pt-4 border-t border-[#F0ECE4] flex items-center justify-between">
                  <p className="text-sm font-extrabold text-[#BA9B65]">
                    {plan.price} <span className="text-xs">{plan.currency || "ريال"} / {plan.billing_cycle === "ANNUAL" ? "سنوياً" : "شهرياً"}</span>
                  </p>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${plan.is_active ? "bg-[#DEF7EC] text-[#0E9F6E]" : "bg-gray-100 text-gray-500"}`}>
                    {plan.is_active ? "مفعلة" : "غير مفعلة"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Subscriptions Table Section matching subscription.png */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#2F2D29]">الاشتراكات</h2>

        <div className="bg-white rounded-2xl border border-[#EAE6DF] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-[#F0ECE4] text-[#8A7A5C] text-sm font-semibold">
                  <th className="py-4 px-6 w-16 text-center">#</th>
                  <th className="py-4 px-6 text-center">اسم المقهى</th>
                  <th className="py-4 px-6 text-center">نوع الاشتراك</th>
                  <th className="py-4 px-6 text-center">تاريخ البداية</th>
                  <th className="py-4 px-6 text-center">تاريخ الانتهاء</th>
                  <th className="py-4 px-6 text-center">طريقة الدفع</th>
                  <th className="py-4 px-6 text-center">المبلغ المدفوع</th>
                  <th className="py-4 px-6 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4]">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-6 text-center"><div className="h-4 w-6 bg-gray-100 rounded mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><div className="h-4 w-24 bg-gray-100 rounded mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><div className="h-4 w-16 bg-gray-100 rounded mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><div className="h-4 w-20 bg-gray-100 rounded mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><div className="h-4 w-20 bg-gray-100 rounded mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><div className="h-4 w-24 bg-gray-100 rounded mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><div className="h-4 w-20 bg-gray-100 rounded mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><div className="h-6 w-20 bg-gray-100 rounded-full mx-auto" /></td>
                    </tr>
                  ))
                ) : subs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[#8A7A5C] font-semibold text-sm">
                      لا توجد اشتراكات مسجلة حالياً
                    </td>
                  </tr>
                ) : (
                  subs.map((sub, index) => (
                    <tr key={sub.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                        {sub.user?.full_name || "سيلانترو 1"}
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-[#2F2D29]">
                        {sub.plan?.billing_cycle === "ANNUAL" ? "سنوي" : "شهري"}
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-[#524E48]" dir="ltr">
                        {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString("en-GB") : "6/8/2025"}
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-[#524E48]" dir="ltr">
                        {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString("en-GB") : "6/8/2026"}
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-[#2F2D29]">
                        محفظة الكترونية
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                        {sub.plan?.price || 50} ريال سعودي
                      </td>
                      <td className="py-4 px-6 text-center">
                        {renderStatusPill(sub.status, sub.expires_at)}
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
      </div>

      {/* Edit Plan Dialog matching Edit subscription.png */}
      <Dialog open={editPlanModalOpen} onOpenChange={(open) => !open && setEditPlanModalOpen(false)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-[#2F2D29] text-right mb-4">
              تعديل الباقة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">مبلغ الاشتراك</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  placeholder="500 ريال"
                  className="h-11 rounded-xl border-[#E5E0D8] bg-white text-sm text-right pr-4"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Button
                onClick={handleSavePlanPrice}
                disabled={updatePlan.isPending}
                className="flex-1 h-11 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold rounded-xl shadow-xs"
              >
                {updatePlan.isPending ? "جاري الحفظ..." : "تعديل"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditPlanModalOpen(false)}
                className="flex-1 h-11 border-[#E5E0D8] text-[#2F2D29] font-bold rounded-xl"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Subscription Plan Dialog matching Figma */}
      <Dialog open={createPlanModalOpen} onOpenChange={(open) => !open && setCreatePlanModalOpen(false)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-[#2F2D29] text-right mb-4">
              إضافة باقة اشتراك جديدة
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={planForm.handleSubmit(handleCreatePlan)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">اسم الباقة</Label>
              <Input {...planForm.register("name")} placeholder="الباقة الماسية" className="h-11 rounded-xl border-[#E5E0D8] bg-white text-xs font-bold" required />
              {planForm.formState.errors.name && (
                <p className="text-xs text-red-500">{planForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#2F2D29]">الفئة المستهدفة</Label>
                <div className="relative">
                  <select {...planForm.register("subscriber_type")} className="w-full h-11 px-3 rounded-xl border border-[#E5E0D8] bg-white text-xs font-bold text-[#2F2D29] focus:outline-none">
                    <option value="CAFE_OWNER">أصحاب المقاهي</option>
                    <option value="CUSTOMER">العملاء</option>
                  </select>
                  <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7A5C] pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#2F2D29]">دورة الفوترة</Label>
                <div className="relative">
                  <select {...planForm.register("billing_cycle")} className="w-full h-11 px-3 rounded-xl border border-[#E5E0D8] bg-white text-xs font-bold text-[#2F2D29] focus:outline-none">
                    <option value="MONTHLY">شهري</option>
                    <option value="ANNUAL">سنوي</option>
                  </select>
                  <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7A5C] pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#2F2D29]">مبلغ الاشتراك (ريال)</Label>
                <Input type="number" step="any" {...planForm.register("price", { valueAsNumber: true })} placeholder="150" className="h-11 rounded-xl border-[#E5E0D8] bg-white text-xs font-bold" required />
                {planForm.formState.errors.price && (
                  <p className="text-xs text-red-500">{planForm.formState.errors.price.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#2F2D29]">مدة الباقة (بالأيام)</Label>
                <Input type="number" {...planForm.register("duration_days", { valueAsNumber: true })} placeholder="30" className="h-11 rounded-xl border-[#E5E0D8] bg-white text-xs font-bold" required />
                {planForm.formState.errors.duration_days && (
                  <p className="text-xs text-red-500">{planForm.formState.errors.duration_days.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">وصف / ميزات الباقة</Label>
              <textarea {...planForm.register("description")} placeholder="أولوية الظهور في نفس المدينة&#10;معرفة الاحصائيات&#10;قسم لكتابة العروض والفعاليات" rows={3} className="w-full p-3 rounded-xl border border-[#E5E0D8] bg-white text-xs resize-none" />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={createPlan.isPending}
                className="flex-1 h-11 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold rounded-xl shadow-xs"
              >
                {createPlan.isPending ? "جاري الإضافة..." : "إضافة الباقة"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreatePlanModalOpen(false)}
                className="flex-1 h-11 border-[#E5E0D8] text-[#2F2D29] font-bold rounded-xl"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Coupon Dialog matching subscription-1.png */}
      <Dialog open={couponDialogOpen} onOpenChange={(open) => !open && setCouponDialogOpen(false)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-[#2F2D29] text-right mb-4">
              إضافة كوبون
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={couponForm.handleSubmit(handleCreateCoupon)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">رمز الكوبون</Label>
              <Input {...couponForm.register("code")} className="h-11 rounded-xl border-[#E5E0D8] bg-white" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">نسبة الخصم</Label>
              <Input type="number" {...couponForm.register("discount_percent", { valueAsNumber: true })} className="h-11 rounded-xl border-[#E5E0D8] bg-white" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">نوع الباقة</Label>
              <div className="relative">
                <select className="w-full h-11 px-3 rounded-xl border border-[#E5E0D8] bg-white text-xs font-bold text-[#2F2D29] focus:outline-none">
                  <option value="basic">الاساسية</option>
                  <option value="premium">البريميوم</option>
                </select>
                <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7A5C] pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">عدد مرات الاستخدام</Label>
              <Input type="number" defaultValue={5} className="h-11 rounded-xl border-[#E5E0D8] bg-white" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">تاريخ بداية الكوبون</Label>
              <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} className="h-11 rounded-xl border-[#E5E0D8] bg-white" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">تاريخ نهاية الكوبون</Label>
              <Input type="date" {...couponForm.register("end_date")} className="h-11 rounded-xl border-[#E5E0D8] bg-white" required />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={createCoupon.isPending}
                className="flex-1 h-11 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold rounded-xl shadow-xs"
              >
                {createCoupon.isPending ? "جاري الإنشاء..." : "إنشاء"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCouponDialogOpen(false)}
                className="flex-1 h-11 border-[#E5E0D8] text-[#2F2D29] font-bold rounded-xl"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
