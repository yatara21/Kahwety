import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  loadGoogleIdentityServices,
  getGoogleClientId,
  type GoogleCredentialResponse,
} from "@/lib/googleAuth";

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => Promise<void> | void;
  onError?: (errorMessage: string) => void;
  disabled?: boolean;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const clientId = getGoogleClientId();

    if (!clientId) {
      setLoadError("لم يتم ضبط معرف Google Client ID (VITE_GOOGLE_CLIENT_ID)");
      setIsLoading(false);
      onError?.("لم يتم ضبط معرف Google Client ID (VITE_GOOGLE_CLIENT_ID)");
      return;
    }

    loadGoogleIdentityServices()
      .then((gsi) => {
        if (!isMounted || !containerRef.current) return;

        try {
          gsi.initialize({
            client_id: clientId,
            callback: async (response: GoogleCredentialResponse) => {
              if (response.credential) {
                try {
                  await onSuccess(response.credential);
                } catch (err: unknown) {
                  const errorMsg =
                    (err as { message?: string })?.message ||
                    "حدث خطأ أثناء المصادقة بحساب Google";
                  onError?.(errorMsg);
                }
              } else {
                onError?.("لم يتم استلام رمز المصادقة من Google");
              }
            },
            cancel_on_tap_outside: true,
          });

          // Render official Google button
          containerRef.current.innerHTML = "";
          gsi.renderButton(containerRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 384,
            locale: "ar",
          });

          setIsLoading(false);
        } catch (initErr) {
          if (isMounted) {
            setLoadError("تعذر تهيئة تسجيل الدخول عبر Google");
            setIsLoading(false);
            onError?.("تعذر تهيئة تسجيل الدخول عبر Google");
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          const msg =
            (err as Error)?.message || "تعذر تحميل خدمة Google Identity Services";
          setLoadError(msg);
          setIsLoading(false);
          onError?.(msg);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onSuccess, onError]);

  if (loadError) {
    return (
      <div className="w-full text-center p-3 text-xs text-amber-800 bg-amber-50 rounded-xl border border-amber-200">
        <span>{loadError}</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[44px] relative">
      {isLoading && (
        <div className="w-full h-11 flex items-center justify-center gap-2 border border-[#e0d5b8] bg-[#faf8f3] text-[#8a7a5c] rounded-xl text-sm animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-[#c8a44e]" />
          <span>جاري تحميل زر Google...</span>
        </div>
      )}
      <div
        ref={containerRef}
        className={`w-full flex justify-center ${isLoading ? "hidden" : "block"} ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
      />
    </div>
  );
}
