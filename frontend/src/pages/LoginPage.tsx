import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  email: z.string().min(1, "البريد الإلكتروني مطلوب").email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة").min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      await login(data);
      navigate("/");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      setApiError(
        axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى."
      );
    }
  };

  const handleGoogleLogin = async () => {
    setApiError(null);
    try {
      await googleLogin({ id_token: "placeholder-token" });
      navigate("/");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      setApiError(
        axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || "حدث خطأ أثناء تسجيل الدخول بحساب جوجل."
      );
    }
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left side - Logo/Branding (dark background with pattern) */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #2f2d29 0%, #3a362e 50%, #2f2d29 100%)",
        }}
      >
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 400" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="coffee-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="30" fill="none" stroke="#c8a44e" strokeWidth="1" />
                <circle cx="50" cy="50" r="20" fill="none" stroke="#c8a44e" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#coffee-pattern)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10 text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #c8a44e, #a07c28)" }}
          >
            <span className="text-white text-6xl font-bold">ق</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">قهوي</h1>
          <p className="text-[#c8a44e] text-lg">لوحة إدارة المقاهي</p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
              style={{ background: "linear-gradient(135deg, #c8a44e, #a07c28)" }}
            >
              <span className="text-white text-3xl font-bold">ق</span>
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "#b8942e" }}>قهوي</h1>
          </div>

          <h2 className="text-2xl font-bold text-[#2f2d29] mb-8 text-center lg:text-right">
            تسجيل الدخول
          </h2>

          {apiError && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#2f2d29]">
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="أدخل البريد الإلكتروني"
                dir="ltr"
                className="h-12 border-[#e0d5b8] focus-visible:ring-[#c8a44e] text-right"
                error={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#2f2d29]">
                كلمة المرور
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة المرور"
                  dir="ltr"
                  className="h-12 border-[#e0d5b8] focus-visible:ring-[#c8a44e] text-right pl-10"
                  error={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7a5c] hover:text-[#2f2d29]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-[#c8a44e] to-[#a07c28] hover:from-[#b8943e] hover:to-[#906c18] text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري تسجيل الدخول...
                </span>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e0d5b8]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-[#8a7a5c]">أو</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full h-12 border-[#e0d5b8] text-[#2f2d29] hover:bg-[#f9f6ef] font-medium rounded-xl transition-all duration-200"
          >
            <svg className="ml-2" width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            تسجيل الدخول بحساب جوجل
          </Button>

          <p className="text-center text-sm text-[#8a7a5c] mt-8">
            © 2024 قهوي - جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
}
