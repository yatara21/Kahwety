import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  email: z.string().min(1, "البريد الإلكتروني مطلوب").email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة").min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
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
        axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || "حدث خطأ أثناء تسجيل الدخول. تأكد من صحة البيانات."
      );
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setApiError(null);
    try {
      await googleLogin({ id_token: credential });
      navigate("/");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      setApiError(
        axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || "حدث خطأ أثناء تسجيل الدخول بحساب جوجل."
      );
    }
  };

  const handleGoogleError = (errorMessage: string) => {
    setApiError(errorMessage);
  };

  return (
    <div className="min-h-screen flex w-full bg-white font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* Right side in RTL (Left side in visual layout): Pattern branding column */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-[#B3996A]"
        style={{
          backgroundImage: "url('/resources/Frame 1984077656.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 flex flex-col items-center justify-center p-8">
          <img
            src="/resources/Asset 50 1.png"
            alt="قهوتي"
            className="w-72 h-auto max-w-[340px] drop-shadow-lg object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-[460px]">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#BA9B65] mb-8 text-right tracking-tight">
            تسجيل الدخول
          </h1>

          {apiError && (
            <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Google Sign-in button at the top (matching Figma) */}
          <div className="mb-6">
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </div>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E0D8]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-[#8A7A5C] font-medium">
                او الدخول عبر البريد الالكتروني
              </span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-[#2F2D29] block text-right">
                البريد الالكتروني
              </Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                placeholder=""
                className="h-12 rounded-xl border-[#E5E0D8] bg-white focus-visible:ring-[#BA9B65] focus-visible:border-[#BA9B65] text-right text-sm text-[#2F2D29]"
                error={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-[#2F2D29] block text-right">
                كلمة المرور
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  placeholder=""
                  className="h-12 rounded-xl border-[#E5E0D8] bg-white focus-visible:ring-[#BA9B65] focus-visible:border-[#BA9B65] text-right text-sm text-[#2F2D29] pl-11"
                  error={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7A5C] hover:text-[#2F2D29] transition-colors p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-base rounded-xl transition-all shadow-sm active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
