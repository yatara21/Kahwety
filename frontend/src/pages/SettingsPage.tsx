import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Clock,
  Globe,
  Palette,
  Type,
  Bell,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { formatDateTime } from "@/lib/utils";

const roleLabels: Record<string, string> = {
  ADMIN: "مدير",
  SUPER_ADMIN: "مشرف أعلى",
  CAFE_OWNER: "صاحب مقهى",
  CUSTOMER: "عميل",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
  SUSPENDED: "معلّق",
};

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    new_password: z
      .string()
      .min(8, "كلمة المرور الجديدة يجب أن تكون على الأقل 8 أحرف"),
    confirm_password: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirm_password"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const handlePasswordSubmit = (_values: ChangePasswordFormData) => {
    setPasswordSuccess(true);
    reset();
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="الإعدادات"
        subtitle="إعدادات الحساب والنظام"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gold-600" />
              <CardTitle>معلومات الحساب</CardTitle>
            </div>
            <CardDescription>بيانات حسابك الشخصي</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100">
                <User className="h-5 w-5 text-gold-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">الاسم</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.full_name || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100">
                <Mail className="h-5 w-5 text-gold-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  البريد الإلكتروني
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100">
                <Phone className="h-5 w-5 text-gold-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.phone || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100">
                <Shield className="h-5 w-5 text-gold-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">الدور</p>
                <Badge
                  variant="outline"
                  className="text-xs font-medium mt-1"
                >
                  {roleLabels[user?.role || ""] || user?.role || "-"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100">
                <CheckCircle className="h-5 w-5 text-gold-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">الحالة</p>
                <Badge
                  variant="outline"
                  className={`text-xs font-medium mt-1 ${
                    user?.status === "ACTIVE"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-red-100 text-red-800 border-red-200"
                  }`}
                >
                  {statusLabels[user?.status || ""] || user?.status || "-"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100">
                <Clock className="h-5 w-5 text-gold-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  آخر تسجيل دخول
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.last_login
                    ? formatDateTime(user.last_login)
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-gold-600" />
                <CardTitle>الإعدادات العامة</CardTitle>
              </div>
              <CardDescription>تفضيلات العرض والنظام</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100">
                    <Globe className="h-5 w-5 text-gold-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      اللغة
                    </p>
                    <p className="text-xs text-muted-foreground">
                      لغة واجهة النظام
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    العربية
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    قريباً
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100">
                    <Palette className="h-5 w-5 text-gold-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      المظهر
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {theme === "dark" ? "الوضع الداكن" : "الوضع الفاتح"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? "فاتح" : "داكن"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100">
                    <Type className="h-5 w-5 text-gold-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      حجم الخط
                    </p>
                    <p className="text-xs text-muted-foreground">
                      الحجم الحالي: افتراضي
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  قريباً
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gold-600" />
                <CardTitle>الإشعارات</CardTitle>
              </div>
              <CardDescription>تفضيلات الإشعارات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100">
                    <Mail className="h-5 w-5 text-gold-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      إشعارات البريد الإلكتروني
                    </p>
                    <p className="text-xs text-muted-foreground">
                      تلقي إشعارات عبر البريد
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={emailNotifications}
                    onClick={() =>
                      setEmailNotifications((prev) => !prev)
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      emailNotifications ? "bg-gold-500" : "bg-input"
                    }`}
                  >
                    <span
                      className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                        emailNotifications
                          ? "translate-x-0 rtl:-translate-x-5"
                          : "translate-x-5 rtl:-translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100">
                    <Bell className="h-5 w-5 text-gold-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      الإشعارات الفورية
                    </p>
                    <p className="text-xs text-muted-foreground">
                      تلقي إشعارات مباشرة
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pushNotifications}
                    onClick={() =>
                      setPushNotifications((prev) => !prev)
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      pushNotifications ? "bg-gold-500" : "bg-input"
                    }`}
                  >
                    <span
                      className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                        pushNotifications
                          ? "translate-x-0 rtl:-translate-x-5"
                          : "translate-x-5 rtl:-translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="text-center pt-2">
                <Badge variant="secondary" className="text-[10px]">
                  إعدادات الإشعارات قريباً
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-gold-600" />
            <CardTitle>تغيير كلمة المرور</CardTitle>
          </div>
          <CardDescription>قم بتحديث كلمة المرور لحسابك</CardDescription>
        </CardHeader>
        <CardContent>
          {passwordSuccess && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">
                تم تحديث كلمة المرور بنجاح (mock - لا يوجد API بعد)
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit(handlePasswordSubmit)}
            className="space-y-4 max-w-lg"
          >
            <div className="space-y-2">
              <Label htmlFor="current_password">كلمة المرور الحالية</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showCurrentPassword ? "text" : "password"}
                  {...register("current_password")}
                  placeholder="أدخل كلمة المرور الحالية"
                  error={!!errors.current_password}
                  className="pl-10"
                />
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setShowCurrentPassword((prev) => !prev)
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.current_password && (
                <p className="text-sm text-destructive">
                  {errors.current_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? "text" : "password"}
                  {...register("new_password")}
                  placeholder="أدخل كلمة المرور الجديدة"
                  error={!!errors.new_password}
                  className="pl-10"
                />
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setShowNewPassword((prev) => !prev)
                  }
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.new_password && (
                <p className="text-sm text-destructive">
                  {errors.new_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">
                تأكيد كلمة المرور الجديدة
              </Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirm_password")}
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  error={!!errors.confirm_password}
                  className="pl-10"
                />
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-sm text-destructive">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            <div>
              <Button type="submit" className="gap-2">
                <Lock className="h-4 w-4" />
                تغيير كلمة المرور
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
