import { useMemo, useState } from "react";
import { Plus, Pencil, Power, PowerOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useSubscriptions,
  useSubscriptionPlans,
  useCreatePlan,
  useUpdatePlan,
  useActivatePlan,
  useDeactivatePlan,
} from "@/hooks/useSubscriptions";
import { useCoupons, useCreateCoupon, useDeleteCoupon } from "@/hooks/useCoupons";
import type { BillingCycle, SubscriberType, SubscriptionPlan } from "@/types";

const planSchema = z.object({
  name: z.string().min(1, "اسم الخطة مطلوب"),
  description: z.string().optional().default(""),
  subscriber_type: z.enum(["CUSTOMER", "CAFE_OWNER"]),
  billing_cycle: z.enum(["MONTHLY", "ANNUAL"]),
  price: z.number({ invalid_type_error: "السعر يجب أن يكون رقمًا" }).gt(0, "السعر مطلوب"),
  currency: z.string().min(3).max(3).default("SAR"),
  duration_days: z.number({ invalid_type_error: "المدة يجب أن تكون رقمًا" }).min(1, "المدة مطلوبة"),
});

type PlanFormData = z.infer<typeof planSchema>;

const couponSchema = z.object({
  code: z.string().min(1, "رمز الكوبون مطلوب"),
  discount_percent: z
    .number({ invalid_type_error: "النسبة يجب أن تكون رقمًا" })
    .min(1, "النسبة مطلوبة")
    .max(100, "النسبة لا تتجاوز 100"),
  plan_id: z.string().optional(),
  max_uses: z.number({ invalid_type_error: "عدد مرات الاستخدام يجب أن يكون رقمًا" }).min(0),
  start_date: z.string().min(1, "تاريخ البداية مطلوب"),
  end_date: z.string().min(1, "تاريخ النهاية مطلوب"),
});

type CouponFormData = z.infer<typeof couponSchema>;

const statusLabels: Record<string, string> = {
  ACTIVE: "نشط",
  CANCELLED: "ملغي",
  EXPIRED: "منتهي",
  PENDING: "في الانتظار",
};

const subscriberLabels: Record<SubscriberType, string> = {
  CUSTOMER: "عميل",
  CAFE_OWNER: "صاحب مقهى",
};

const billingLabels: Record<BillingCycle, string> = {
  MONTHLY: "شهري",
  ANNUAL: "سنوي",
};

function getStatusStyle(
  status: string,
  expiresAt: string | null
): { label: string; className: string } {
  if (status === "ACTIVE") {
    if (expiresAt) {
      const daysLeft = Math.ceil(
        (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft <= 7 && daysLeft > 0) {
        return { label: "على وشك الانتهاء", className: "text-orange-600 bg-orange-50" };
      }
    }
    return { label: "نشط", className: "text-green-700 bg-green-50" };
  }
  if (status === "PENDING") return { label: "في الانتظار", className: "text-amber-700 bg-amber-50" };
  if (status === "EXPIRED") return { label: "منتهي", className: "text-gray-500 bg-gray-100" };
  if (status === "CANCELLED") return { label: "ملغي", className: "text-gray-500 bg-gray-100" };
  return { label: statusLabels[status] || status, className: "text-gray-500 bg-gray-100" };
}

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subscriberFilter, setSubscriberFilter] = useState<string>("all");

  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editPriceOpen, setEditPriceOpen] = useState(false);
  const [editPricePlan, setEditPricePlan] = useState<SubscriptionPlan | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<number>(0);

  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [deleteCouponTarget, setDeleteCouponTarget] = useState<any>(null);

  const listParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    }),
    [page, pageSize, statusFilter]
  );

  const planParams = useMemo(
    () => ({
      page: 1,
      page_size: 100,
      ...(subscriberFilter !== "all"
        ? { subscriber_type: subscriberFilter as SubscriberType }
        : {}),
    }),
    [subscriberFilter]
  );

  const { data: subsData, isLoading } = useSubscriptions(listParams);
  const { data: plansData } = useSubscriptionPlans(planParams);
  const { data: couponsData } = useCoupons();
  const createPlanMutation = useCreatePlan();
  const updatePlanMutation = useUpdatePlan();
  const activatePlanMutation = useActivatePlan();
  const deactivatePlanMutation = useDeactivatePlan();
  const createCouponMutation = useCreateCoupon();
  const deleteCouponMutation = useDeleteCoupon();

  const subs = subsData?.items ?? [];
  const totalPages = subsData?.total_pages ?? 1;
  const plans = plansData?.items ?? [];
  const coupons = couponsData?.items ?? [];

  const planForm = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      description: "",
      subscriber_type: "CUSTOMER",
      billing_cycle: "MONTHLY",
      price: 1,
      currency: "SAR",
      duration_days: 30,
    },
  });

  const couponForm = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discount_percent: 0,
      max_uses: 0,
      start_date: "",
      end_date: "",
    },
  });

  const openCreatePlan = () => {
    setEditingPlan(null);
    planForm.reset({
      name: "",
      description: "",
      subscriber_type: "CUSTOMER",
      billing_cycle: "MONTHLY",
      price: 1,
      currency: "SAR",
      duration_days: 30,
    });
    setPlanDialogOpen(true);
  };

  const openEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    planForm.reset({
      name: plan.name,
      description: plan.description || "",
      subscriber_type: plan.subscriber_type,
      billing_cycle: plan.billing_cycle,
      price: Number(plan.price),
      currency: plan.currency || "SAR",
      duration_days: plan.duration_days,
    });
    setPlanDialogOpen(true);
  };

  const onPlanSubmit = (formData: PlanFormData) => {
    const payload = {
      name: formData.name,
      description: formData.description || null,
      subscriber_type: formData.subscriber_type,
      billing_cycle: formData.billing_cycle,
      price: formData.price,
      currency: (formData.currency || "SAR").toUpperCase(),
      duration_days: formData.duration_days,
    };

    if (editingPlan) {
      updatePlanMutation.mutate(
        { id: editingPlan.id, data: payload },
        {
          onSuccess: () => {
            setPlanDialogOpen(false);
            setEditingPlan(null);
            planForm.reset();
          },
        }
      );
    } else {
      createPlanMutation.mutate(
        { ...payload, is_active: true },
        {
          onSuccess: () => {
            setPlanDialogOpen(false);
            planForm.reset();
          },
        }
      );
    }
  };

  const onCouponSubmit = (formData: CouponFormData) => {
    createCouponMutation.mutate(
      {
        ...formData,
        is_active: true,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      },
      {
        onSuccess: () => {
          setCouponDialogOpen(false);
          couponForm.reset();
        },
      }
    );
  };

  const openEditPrice = (plan: SubscriptionPlan) => {
    setEditPricePlan(plan);
    setEditPriceValue(Number(plan.price));
    setEditPriceOpen(true);
  };

  const handleSavePrice = () => {
    if (!editPricePlan) return;
    updatePlanMutation.mutate(
      { id: editPricePlan.id, data: { price: Number(editPriceValue) } },
      {
        onSuccess: () => {
          setEditPriceOpen(false);
          setEditPricePlan(null);
        },
      }
    );
  };

  const togglePlanActive = (plan: SubscriptionPlan) => {
    if (plan.is_active) {
      deactivatePlanMutation.mutate(plan.id);
    } else {
      activatePlanMutation.mutate(plan.id);
    }
  };

  const isPlanSubmitting = createPlanMutation.isPending || updatePlanMutation.isPending;
  const isCouponSubmitting = createCouponMutation.isPending;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Coupons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2f2d29]">إدارة الكوبونات</h2>
          <Button
            onClick={() => {
              couponForm.reset();
              setCouponDialogOpen(true);
            }}
            className="bg-[#c8a44e] hover:bg-[#b8943e] text-white"
          >
            إضافة كوبون
          </Button>
        </div>
        {coupons.length === 0 ? (
          <p className="text-sm text-[#8a7a5c]">لا توجد كوبونات بعد</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="bg-white rounded-2xl border-2 border-dashed border-[#e8dcc8] p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-2xl font-bold text-[#2f2d29]">خصم {coupon.discount_percent}%</p>
                  <button
                    onClick={() => setDeleteCouponTarget(coupon)}
                    className="text-[#8a7a5c] hover:text-red-600 text-xs"
                  >
                    حذف
                  </button>
                </div>
                <p className="text-sm font-mono text-[#2f2d29]">{coupon.code}</p>
                <p className="text-xs text-[#8a7a5c] mt-1">
                  صالح حتى {new Date(coupon.end_date).toLocaleDateString("ar-SA")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plans */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[#2f2d29]">باقات الاشتراك (Moyasar)</h2>
          <div className="flex items-center gap-2">
            <Select value={subscriberFilter} onValueChange={setSubscriberFilter}>
              <SelectTrigger className="w-40 h-9 border-[#e0d5b8]">
                <SelectValue placeholder="نوع المشترك" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="CUSTOMER">عملاء</SelectItem>
                <SelectItem value="CAFE_OWNER">أصحاب مقاهي</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openCreatePlan} className="bg-[#c8a44e] hover:bg-[#b8943e] text-white">
              <Plus size={16} /> باقة جديدة
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border p-6 ${
                plan.is_active ? "border-[#e8dcc8]/50" : "border-gray-200 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-bold text-[#2f2d29]">{plan.name}</h3>
                  <p className="text-xs text-[#8a7a5c] mt-1">
                    {subscriberLabels[plan.subscriber_type]} · {billingLabels[plan.billing_cycle]}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    plan.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {plan.is_active ? "مفعّلة" : "معطّلة"}
                </span>
              </div>

              {plan.description && (
                <p className="text-sm text-[#5c5346] mb-3 line-clamp-2">{plan.description}</p>
              )}

              <div className="flex items-end justify-between pt-3 border-t border-[#e8dcc8]/30">
                <div>
                  <p className="font-bold text-[#c8a44e] text-lg">
                    {Number(plan.price).toLocaleString("ar-SA")} {plan.currency || "SAR"}
                  </p>
                  <p className="text-xs text-[#8a7a5c]">{plan.duration_days} يوم</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditPrice(plan)}
                    className="text-[#8a7a5c] hover:text-[#c8a44e] p-1"
                    title="تعديل السعر"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => openEditPlan(plan)}
                    className="text-[#8a7a5c] hover:text-[#c8a44e] text-xs underline"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => togglePlanActive(plan)}
                    className="text-[#8a7a5c] hover:text-[#c8a44e] p-1"
                    title={plan.is_active ? "تعطيل" : "تفعيل"}
                  >
                    {plan.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <p className="text-sm text-[#8a7a5c] col-span-full">لا توجد باقات بعد</p>
          )}
        </div>
      </div>

      {/* Subscriptions table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[#2f2d29]">الاشتراكات</h2>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40 h-9 border-[#e0d5b8]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="ACTIVE">نشط</SelectItem>
              <SelectItem value="PENDING">في الانتظار</SelectItem>
              <SelectItem value="EXPIRED">منتهي</SelectItem>
              <SelectItem value="CANCELLED">ملغي</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white rounded-xl border border-[#e8dcc8]/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e8dcc8]/50 bg-[#f9f6ef]/50">
                  <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">#</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">المستخدم</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">الخطة</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">تاريخ البداية</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">تاريخ الانتهاء</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#e8dcc8]/30">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : subs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[#8a7a5c]">
                      لا توجد اشتراكات
                    </td>
                  </tr>
                ) : (
                  subs.map((sub, index) => {
                    const statusInfo = getStatusStyle(sub.status, sub.expires_at);
                    return (
                      <tr
                        key={sub.id}
                        className="border-b border-[#e8dcc8]/30 hover:bg-[#f9f6ef]/30"
                      >
                        <td className="px-4 py-3 text-sm text-[#2f2d29]">
                          {(page - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#2f2d29]">
                          {sub.user?.full_name || sub.user_id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#2f2d29]">
                          {sub.plan?.name || sub.plan_id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#8a7a5c]">
                          {sub.starts_at
                            ? new Date(sub.starts_at).toLocaleDateString("ar-SA")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#8a7a5c]">
                          {sub.expires_at
                            ? new Date(sub.expires_at).toLocaleDateString("ar-SA")
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#e8dcc8]/50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#8a7a5c]">الصفحة/{pageSize}</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8 text-sm border-[#e0d5b8]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-[#e0d5b8] text-sm disabled:opacity-50"
                >
                  &lt;
                </button>
                <span className="text-sm px-2">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-[#e0d5b8] text-sm disabled:opacity-50"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Plan */}
      <Dialog open={planDialogOpen} onOpenChange={(open) => !open && setPlanDialogOpen(false)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2f2d29]">
              {editingPlan ? "تعديل الباقة" : "إضافة باقة جديدة"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={planForm.handleSubmit(onPlanSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الباقة</Label>
              <Input {...planForm.register("name")} className="border-[#e0d5b8]" />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <textarea
                {...planForm.register("description")}
                className="w-full min-h-[80px] rounded-xl border border-[#e0d5b8] p-3 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>نوع المشترك</Label>
                <Select
                  value={planForm.watch("subscriber_type")}
                  onValueChange={(v) =>
                    planForm.setValue("subscriber_type", v as SubscriberType)
                  }
                >
                  <SelectTrigger className="border-[#e0d5b8]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">عميل</SelectItem>
                    <SelectItem value="CAFE_OWNER">صاحب مقهى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>دورة الفوترة</Label>
                <Select
                  value={planForm.watch("billing_cycle")}
                  onValueChange={(v) => {
                    const cycle = v as BillingCycle;
                    planForm.setValue("billing_cycle", cycle);
                    if (cycle === "MONTHLY" && planForm.getValues("duration_days") < 28) {
                      planForm.setValue("duration_days", 30);
                    }
                    if (cycle === "ANNUAL" && planForm.getValues("duration_days") < 365) {
                      planForm.setValue("duration_days", 365);
                    }
                  }}
                >
                  <SelectTrigger className="border-[#e0d5b8]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">شهري</SelectItem>
                    <SelectItem value="ANNUAL">سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>السعر</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...planForm.register("price", { valueAsNumber: true })}
                  className="border-[#e0d5b8]"
                />
              </div>
              <div className="space-y-2">
                <Label>العملة</Label>
                <Input {...planForm.register("currency")} className="border-[#e0d5b8]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>المدة (أيام)</Label>
              <Input
                type="number"
                {...planForm.register("duration_days", { valueAsNumber: true })}
                className="border-[#e0d5b8]"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPlanDialogOpen(false)}
                className="border-[#e0d5b8]"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isPlanSubmitting}
                className="bg-[#c8a44e] hover:bg-[#b8943e] text-white"
              >
                {isPlanSubmitting ? "جاري الحفظ..." : editingPlan ? "تعديل" : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Coupon dialog */}
      <Dialog open={couponDialogOpen} onOpenChange={(open) => !open && setCouponDialogOpen(false)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة كوبون</DialogTitle>
          </DialogHeader>
          <form onSubmit={couponForm.handleSubmit(onCouponSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>رمز الكوبون</Label>
              <Input {...couponForm.register("code")} className="border-[#e0d5b8]" />
            </div>
            <div className="space-y-2">
              <Label>نسبة الخصم</Label>
              <Input
                type="number"
                {...couponForm.register("discount_percent", { valueAsNumber: true })}
                className="border-[#e0d5b8]"
              />
            </div>
            <div className="space-y-2">
              <Label>الباقة (اختياري)</Label>
              <Select
                value={couponForm.watch("plan_id") || "none"}
                onValueChange={(v) =>
                  couponForm.setValue("plan_id", v === "none" ? undefined : v)
                }
              >
                <SelectTrigger className="border-[#e0d5b8]">
                  <SelectValue placeholder="اختر الباقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون باقة محددة</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>عدد مرات الاستخدام</Label>
              <Input
                type="number"
                {...couponForm.register("max_uses", { valueAsNumber: true })}
                className="border-[#e0d5b8]"
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ البداية</Label>
              <Input type="date" {...couponForm.register("start_date")} className="border-[#e0d5b8]" />
            </div>
            <div className="space-y-2">
              <Label>تاريخ النهاية</Label>
              <Input type="date" {...couponForm.register("end_date")} className="border-[#e0d5b8]" />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCouponDialogOpen(false)}
                className="border-[#e0d5b8]"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isCouponSubmitting}
                className="bg-[#c8a44e] hover:bg-[#b8943e] text-white"
              >
                {isCouponSubmitting ? "جاري الإنشاء..." : "إنشاء"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit price */}
      <Dialog open={editPriceOpen} onOpenChange={(open) => !open && setEditPriceOpen(false)}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل السعر</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>مبلغ الاشتراك</Label>
              <Input
                type="number"
                step="0.01"
                value={editPriceValue}
                onChange={(e) => setEditPriceValue(Number(e.target.value))}
                className="border-[#e0d5b8]"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setEditPriceOpen(false)}
                className="border-[#e0d5b8]"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSavePrice}
                className="bg-[#c8a44e] hover:bg-[#b8943e] text-white"
              >
                حفظ
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteCouponTarget}
        onOpenChange={(open) => !open && setDeleteCouponTarget(null)}
      >
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>حذف الكوبون</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#5c5346]">
            هل أنت متأكد من حذف كوبون "{deleteCouponTarget?.code}"؟
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteCouponTarget(null)}
              className="border-[#e0d5b8]"
            >
              إلغاء
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteCouponMutation.isPending}
              onClick={() => {
                if (!deleteCouponTarget) return;
                deleteCouponMutation.mutate(deleteCouponTarget.id, {
                  onSuccess: () => setDeleteCouponTarget(null),
                });
              }}
            >
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
