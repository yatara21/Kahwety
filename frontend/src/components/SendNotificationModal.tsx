import { useState } from "react";
import { X, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notificationsApi } from "@/api/notifications";
import { NotificationTargetType } from "@/types";
import { useCafes } from "@/hooks/useCafes";
import { toast } from "@/hooks/use-toast";

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SendNotificationModal({
  isOpen,
  onClose,
  onSuccess,
}: SendNotificationModalProps) {
  const [targetType, setTargetType] = useState<string>("ALL");
  const [targetId, setTargetId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [sendDate, setSendDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { data: cafesData } = useCafes({ page_size: 100 });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("يرجى ملء عنوان الإشعار وتفاصيل الإشعار");
      return;
    }

    if ((targetType === "CAFE" || targetType === "USER") && !targetId.trim()) {
      setError(targetType === "CAFE" ? "يرجى اختيار المقهى المستهدف" : "يرجى إدخال معرف المستخدم المستهدف");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await notificationsApi.create({
        title,
        message,
        target_type: targetType as NotificationTargetType,
        target_id: (targetType === "CAFE" || targetType === "USER") ? targetId : undefined,
      });
      toast({
        title: "تم بنجاح",
        description: "تم إرسال الإشعار بنجاح",
      });
      onSuccess?.();
      onClose();
      // Reset form
      setTitle("");
      setMessage("");
      setSendDate("");
      setTargetId("");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errMsg = axiosErr.response?.data?.message || "حدث خطأ أثناء إرسال الإشعار";
      setError(errMsg);
      toast({
        title: "خطأ",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-[500px] shadow-2xl border border-[#EAE6DF] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[#F0ECE4]">
          <h2 className="text-2xl font-bold text-[#2F2D29]">إرسال إشعار</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8A7A5C] hover:bg-[#FAF8F5] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Target Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#2F2D29]">المرسل إليه</Label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-[#E5E0D8] bg-white text-sm text-[#2F2D29] focus:outline-none focus:border-[#BA9B65]"
            >
              <option value="ALL">الجميع (كافة العملاء وأصحاب المقاهي)</option>
              <option value="CUSTOMER">العملاء فقط</option>
              <option value="CAFE_OWNER">أصحاب المقاهي فقط</option>
              <option value="CAFE">مقهى محدد</option>
              <option value="USER">مستخدم محدد (بالمعرف)</option>
            </select>
          </div>

          {targetType === "CAFE" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">اختر المقهى المستهدف</Label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-[#E5E0D8] bg-white text-sm text-[#2F2D29] focus:outline-none focus:border-[#BA9B65]"
                required
              >
                <option value="">-- اختر المقهى --</option>
                {cafesData?.items?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.address ? `(${c.address})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === "USER" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">معرف المستخدم (User ID)</Label>
              <Input
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="أدخل معرف المستخدم..."
                className="h-11 rounded-xl border-[#E5E0D8] text-sm"
                required
              />
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#2F2D29]">عنوان الإشعار</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="أدخل عنوان الإشعار..."
              className="h-11 rounded-xl border-[#E5E0D8] text-sm"
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#2F2D29]">تفاصيل الإشعار</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب نص الإشعار هنا..."
              rows={4}
              className="w-full p-3 rounded-xl border border-[#E5E0D8] bg-white text-sm text-[#2F2D29] focus:outline-none focus:border-[#BA9B65] resize-none"
              required
            />
          </div>

          {/* Send Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#2F2D29]">تاريخ الإرسال</Label>
            <div className="relative">
              <Input
                type="date"
                value={sendDate}
                onChange={(e) => setSendDate(e.target.value)}
                className="h-11 rounded-xl border-[#E5E0D8] text-sm pr-10"
              />
              <Calendar size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7A5C] pointer-events-none" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#F0ECE4]">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold rounded-xl transition-all shadow-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </span>
              ) : (
                "إرسال"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 border-[#E5E0D8] bg-white text-[#2F2D29] hover:bg-[#FAF8F5] font-bold rounded-xl"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
