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
import { useCoupons, useCreateCoupon, useTerminateCoupon } from "@/hooks/useCoupons";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "@/hooks/use-toast";
import type { SubscriptionPlan, Coupon } from "@/types";

const couponSchema = z.object({
  code: z.string().min(1, "رمز الكوبون مطلوب"),
  discount_percent: z
    .number({ invalid_type_error: "النسبة يجب أن تكون رقمًا" })
    .min(1)
    .max(100),
  max_uses: z.number({ invalid_type_error: "عدد المرات يجب أن يكون رقمًا" }).min(0).default(5),
  start_date: z.string().optional(),
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
  const [terminatingCoupon, setTerminatingCoupon] = useState<Coupon | null>(null);

  const { data: subsData, isLoading } = useSubscriptions({ page, page_size: pageSize });
  const { data: plansData } = useSubscriptionPlans({ page: 1, page_size: 50 });
  const { data: couponsData } = useCoupons();

  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const createCoupon = useCreateCoupon();
  const terminateCoupon = useTerminateCoupon();

  const subs = subsData?.items ?? [];
  const totalPages = subsData?.total_pages ?? 1;
  const coupons: Coupon[] = (couponsData as any)?.items ?? (Array.isArray(couponsData) ? couponsData : []);
  const plans = plansData?.items ?? [];

  const couponForm = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discount_percent: 15,
      max_uses: 5,
      start_date: new Date().toISOString().split("T")[0],
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

  const editPlanForm = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
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
          toast({
            title: "تم بنجاح",
            description: "تمت إضافة باقة الاشتراك بنجاح",
          });
        },
        onError: (err: any) => {
          toast({
            title: "خطأ",
            description: err?.response?.data?.message || "فشل إضافة الباقة",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCreateCoupon = (values: CouponFormData) => {
    const startDate = values.start_date
      ? new Date(values.start_date).toISOString()
      : new Date().toISOString();

    createCoupon.mutate(
      {
        code: values.code.trim(),
        discount_percent: Number(values.discount_percent),
        max_uses: Number(values.max_uses || 0),
        start_date: startDate,
        end_date: new Date(values.end_date).toISOString(),
        is_active: true,
      },
      {
        onSuccess: () => {
          setCouponDialogOpen(false);
          couponForm.reset();
          toast({
            title: "تم بنجاح",
            description: `تم إنشاء الكوبون "${values.code}" بنجاح ويظهر الآن في القائمة`,
          });
        },
        onError: (err: any) => {
          toast({
            title: "خطأ",
            description: err?.response?.data?.message || "فشل إنشاء الكوبون",
            variant: "destructive",
          });
        },
      }
    );
  };

  const openEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    editPlanForm.reset({
      name: plan.name,
      description: plan.description || "",
      subscriber_type: plan.subscriber_type,
      billing_cycle: plan.billing_cycle,
      price: Number(plan.price),
      duration_days: Number(plan.duration_days),
      currency: plan.currency || "SAR",
    });
    setEditPlanModalOpen(true);
  };

  const handleUpdatePlan = (values: PlanFormData) => {
    if (!selectedPlan) return;
    updatePlan.mutate(
      {
        id: selectedPlan.id,
        data: {
          name: values.name,
          description: values.description || null,
          subscriber_type: values.subscriber_type,
          billing_cycle: values.billing_cycle,
          price: Number(values.price),
          duration_days: Number(values.duration_days),
          currency: values.currency || "SAR",
        },
      },
      {
        onSuccess: () => {
          setEditPlanModalOpen(false);
          setSelectedPlan(null);
          toast({
            title: "تم بنجاح",
            description: "تم تحديث باقة الاشتراك بنجاح",
          });
        },
        onError: (err: any) => {
          toast({
            title: "خطأ",
            description: err?.response?.data?.message || "فشل تحديث باقة الاشتراك",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleConfirmTerminate = () => {
    if (!terminatingCoupon) return;
    terminateCoupon.mutate(terminatingCoupon.id, {
      onSuccess: () => {
        toast({
          title: "تم بنجاح",
          description: `تم إنهاء الكوبون "${terminatingCoupon.code}" بنجاح`,
        });
        setTerminatingCoupon(null);
      },
      onError: (err: any) => {
        toast({
          title: "خطأ",
          description: err?.response?.data?.message || "فشل إنهاء الكوبون",
          variant: "destructive",
        });
        setTerminatingCoupon(null);
      },
    });
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

  const renderCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active || coupon.status === "TERMINATED") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDE8E8] text-[#C93B2B]">
          ملغي / متوقف
        </span>
      );
    }
    const isExpired = coupon.status === "EXPIRED" || new Date(coupon.end_date).getTime() < Date.now();
    if (isExpired) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
          منتهي الصلاحية
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DEF7EC] text-[#0E9F6E]">
        نشط
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
            onClick={() => {
              couponForm.reset({
                code: "",
                discount_percent: 15,
                max_uses: 5,
                start_date: new Date().toISOString().split("T")[0],
                end_date: "",
              });
              setCouponDialogOpen(true);
            }}
            className="px-6 py-2.5 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            إضافة كوبون
          </button>
        </div>

        {/* Real Dynamic Coupon Ticket Cards */}
        {coupons.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-[#EAE6DF] text-center">
            <Ticket className="w-10 h-10 text-[#BA9B65]/40 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#8A7A5C]">لا توجد كوبونات مسجلة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => {
              const isActive = coupon.is_active && coupon.status !== "TERMINATED" && new Date(coupon.end_date).getTime() >= Date.now();
              return (
                <div
                  key={coupon.id}
                  className="relative bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex flex-col justify-between overflow-hidden"
                >
                  {/* Cutout circles on sides for ticket feel */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#EAE6DF]" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#EAE6DF]" />

                  <div className="flex items-center justify-between pb-3">
                    {/* Left part: Logo */}
                    <div className="flex items-center gap-2 pl-4">
                      <img src="/resources/Asset 50 1.png" alt="قهوتي" className="w-8 h-8 object-contain" />
                      <span className="text-base font-extrabold text-[#BA9B65]">قهوتي</span>
                    </div>

                    {/* Dotted divider */}
                    <div className="h-12 border-l border-dashed border-[#E5E0D8]" />

                    {/* Right part: Discount info */}
                    <div className="pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <p className="text-xl font-extrabold text-[#2F2D29]">خصم {coupon.discount_percent}%</p>
                      </div>
                      <p className="text-[11px] text-[#8A7A5C] font-semibold mt-0.5">
                        سارية حتى {new Date(coupon.end_date).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#F0ECE4] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[#8A7A5C]">الرمز:</span>
                      <span className="font-bold text-[#2F2D29] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E5E0D8]" dir="ltr">
                        {coupon.code}
                      </span>
                      {renderCouponStatus(coupon)}
                    </div>

                    {isActive && (
                      <button
                        onClick={() => setTerminatingCoupon(coupon)}
                        className="text-[11px] font-bold text-[#C93B2B] hover:text-[#A82E20] hover:underline cursor-pointer"
                      >
                        إنهاء الكوبون
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
            className="px-6 py-2.5 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} />
            <span>إضافة باقة</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
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
                    <button className="text-[#8A7A5C] hover:text-[#2F2D29] p-1 rounded-lg hover:bg-[#FAF8F5] cursor-pointer">
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-right">
                    <DropdownMenuItem onClick={() => openEditPlan(plan)} className="cursor-pointer">
                      تعديل الباقة
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
          ))}
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
                        {sub.user?.full_name || "مقهى مسجل"}
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-[#2F2D29]">
                        {sub.plan?.billing_cycle === "ANNUAL" ? "سنوي" : "شهري"}
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-[#524E48]" dir="ltr">
                        {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString("en-GB") : "-"}
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-[#524E48]" dir="ltr">
                        {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString("en-GB") : "-"}
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-[#2F2D29]">
                        محفظة الكترونية
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                        {sub.plan?.price || 0} ريال سعودي
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

          {/* Pagination */}
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
                className="w-8 h-8 rounded-lg border border-[#E5E0D8] flex items-center justify-center text-[#2F2D29] disabled:opacity-40 hover:bg-[#FAF8F5] cursor-pointer"
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
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
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
                className="w-8 h-8 rounded-lg border border-[#E5E0D8] flex items-center justify-center text-[#2F2D29] disabled:opacity-40 hover:bg-[#FAF8F5] cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Plan Dialog matching Phase 3 Full Plan Configuration */}
      <Dialog open={editPlanModalOpen} onOpenChange={(open) => !open && setEditPlanModalOpen(false)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-[#2F2D29] text-right mb-4">
              تعديل باقة الاشتراك
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editPlanForm.handleSubmit(handleUpdatePlan)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">اسم الباقة</Label>
              <Input
                {...editPlanForm.register("name")}
                placeholder="اسم الباقة"
                className="h-11 rounded-xl border-[#E5E0D8] bg-white text-xs font-bold"
                required
              />
              {editPlanForm.formState.errors.name && (
                <p className="text-xs text-red-500">{editPlanForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#2F2D29]">الفئة المستهدفة</Label>
                <div className="relative">
                  <select
                    {...editPlanForm.register("subscriber_type")}
                    className="w-full h-11 px-3 rounded-xl border border-[#E5E0D8] bg-white text-xs font-bold text-[#2F2D29] focus:outline-none"
                  >
                    <option value="CAFE_OWNER">أصحاب المقاهي</option>
                    <option value="CUSTOMER">العملاء</option>
                  </select>
                  <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7A5C] pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#2F2D29]">دورة الفوترة</Label>
                <div className="relative">
                  <select
                    {...editPlanForm.register("billing_cycle")}
                    className="w-full h-11 px-3 rounded-xl border border-[#E5E0D8] bg-white text-xs font-bold text-[#2F2D29] focus:outline-none"
                  >
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
                <Input
                  type="number"
                  step="any"
                  {...editPlanForm.register("price", { valueAsNumber: true })}
                  placeholder="150"
                  className="h-11 rounded-xl border-[#E5E0D8] bg-white text-xs font-bold"
                  required
                />
                {editPlanForm.formState.errors.price && (
                  <p className="text-xs text-red-500">{editPlanForm.formState.errors.price.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#2F2D29]">مدة الباقة (بالأيام)</Label>
                <Input
                  type="number"
                  {...editPlanForm.register("duration_days", { valueAsNumber: true })}
                  placeholder="30"
                  className="h-11 rounded-xl border-[#E5E0D8] bg-white text-xs font-bold"
                  required
                />
                {editPlanForm.formState.errors.duration_days && (
                  <p className="text-xs text-red-500">{editPlanForm.formState.errors.duration_days.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">وصف / ميزات الباقة</Label>
              <textarea
                {...editPlanForm.register("description")}
                placeholder="تفاصيل وميزات الباقة..."
                rows={3}
                className="w-full p-3 rounded-xl border border-[#E5E0D8] bg-white text-xs resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={updatePlan.isPending}
                className="flex-1 h-11 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold rounded-xl shadow-xs"
              >
                {updatePlan.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
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
          </form>
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
              إضافة كوبون جديد
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={couponForm.handleSubmit(handleCreateCoupon)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">رمز الكوبون (Code)</Label>
              <Input {...couponForm.register("code")} placeholder="مثال: SUMMER2025" className="h-11 rounded-xl border-[#E5E0D8] bg-white text-xs font-bold" required />
              {couponForm.formState.errors.code && (
                <p className="text-xs text-red-500">{couponForm.formState.errors.code.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#2F2D29]">نسبة الخصم (%)</Label>
                <Input type="number" {...couponForm.register("discount_percent", { valueAsNumber: true })} className="h-11 rounded-xl border-[#E5E0D8] bg-white text-xs font-bold" required />
                {couponForm.formState.errors.discount_percent && (
                  <p className="text-xs text-red-500">{couponForm.formState.errors.discount_percent.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#2F2D29]">الحد الأقصى للاستخدام</Label>
                <Input type="number" {...couponForm.register("max_uses", { valueAsNumber: true })} className="h-11 rounded-xl border-[#E5E0D8] bg-white text-xs font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#2F2D29]">تاريخ بداية الكوبون</Label>
                <Input type="date" {...couponForm.register("start_date")} className="h-11 rounded-xl border-[#E5E0D8] bg-white text-xs font-bold" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#2F2D29]">تاريخ نهاية الكوبون</Label>
                <Input type="date" {...couponForm.register("end_date")} className="h-11 rounded-xl border-[#E5E0D8] bg-white text-xs font-bold" required />
                {couponForm.formState.errors.end_date && (
                  <p className="text-xs text-red-500">{couponForm.formState.errors.end_date.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={createCoupon.isPending}
                className="flex-1 h-11 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold rounded-xl shadow-xs"
              >
                {createCoupon.isPending ? "جاري الإنشاء..." : "إنشاء الكوبون"}
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

      {/* Confirmation Dialog for Coupon Termination */}
      <ConfirmDialog
        open={!!terminatingCoupon}
        onOpenChange={(open) => !open && setTerminatingCoupon(null)}
        title="تأكيد إنهاء الكوبون"
        description={`هل أنت متأكد من رغبتك في إنهاء الكوبون "${terminatingCoupon?.code}" قبل موعد انتهائه؟ سيتم إيقاف تفعيله فوراً ولن يتمكن العملاء من استخدامه بعد الآن.`}
        confirmText="إنهاء الكوبون"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={handleConfirmTerminate}
        isLoading={terminateCoupon.isPending}
      />
    </div>
  );
}
