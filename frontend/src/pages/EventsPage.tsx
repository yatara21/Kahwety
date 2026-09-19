import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Upload, Pencil, Trash2, Eye, LoaderCircle, Calendar, MapPin, Coffee } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/useEvents";
import { useCafes } from "@/hooks/useCafes";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { uploadApi } from "@/api/upload";
import { getImageUrl } from "@/utils/imageUrl";
import { toast } from "@/hooks/use-toast";

const eventSchema = z.object({
  title: z.string().min(1, "اسم الفعالية مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  location: z.string().min(1, "الموقع مطلوب"),
  image_url: z.string().optional().default(""),
  event_date: z.string().min(1, "التاريخ مطلوب"),
  cafe_id: z.string().min(1, "المقهى مطلوب"),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function EventsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewEvent, setViewEvent] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useEvents({ page: 1, page_size: 100 });
  const { data: cafesData, isLoading: cafesLoading } = useCafes({ page_size: 100 });
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const events = data?.items ?? [];
  const cafes = cafesData?.items ?? [];

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: { title: "", description: "", location: "", image_url: "", event_date: "", cafe_id: "" },
  });

  const currentImageUrl = watch("image_url");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      setValue("image_url", res.url);
      toast({
        title: "تم بنجاح",
        description: "تم رفع صورة الفعالية بنجاح",
      });
    } catch (err) {
      console.error("Upload error", err);
      toast({
        title: "خطأ",
        description: "فشل رفع الصورة",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingEvent(null);
    reset({
      title: "",
      description: "",
      location: "الفرع الرئيسي",
      image_url: "",
      event_date: new Date().toISOString().slice(0, 16),
      cafe_id: cafes[0]?.id || "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (event: any) => {
    setEditingEvent(event);
    reset({
      title: event.title,
      description: event.description,
      location: event.location,
      image_url: event.image_url || "",
      event_date: new Date(event.event_date).toISOString().slice(0, 16),
      cafe_id: event.cafe_id,
    });
    setDialogOpen(true);
  };

  const onSubmit = (formData: EventFormData) => {
    const targetCafeId = formData.cafe_id || cafes[0]?.id;
    if (!targetCafeId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مقهى",
        variant: "destructive",
      });
      return;
    }
    const payload = {
      ...formData,
      cafe_id: targetCafeId,
      image_url: formData.image_url || null,
      event_date: new Date(formData.event_date).toISOString(),
      status: "PUBLISHED" as const,
    };
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: payload }, {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingEvent(null);
          reset();
          queryClient.invalidateQueries({ queryKey: ["events"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast({
            title: "تم بنجاح",
            description: "تم تعديل الفعالية بنجاح",
          });
        },
        onError: (err: any) => {
          toast({
            title: "خطأ",
            description: err?.response?.data?.message || "فشل تعديل الفعالية",
            variant: "destructive",
          });
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setDialogOpen(false);
          reset();
          queryClient.invalidateQueries({ queryKey: ["events"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast({
            title: "تم بنجاح",
            description: "تمت إضافة الفعالية بنجاح",
          });
        },
        onError: (err: any) => {
          toast({
            title: "خطأ",
            description: err?.response?.data?.message || "فشل إضافة الفعالية",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        queryClient.invalidateQueries({ queryKey: ["events"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        toast({
          title: "تم بنجاح",
          description: "تم حذف الفعالية بنجاح",
        });
      },
      onError: (err: any) => {
        toast({
          title: "خطأ",
          description: err?.response?.data?.message || "فشل حذف الفعالية",
          variant: "destructive",
        });
      },
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8 pb-12 font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* Events Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#2f2d29]">إدارة الفعاليات</h2>
          <Button onClick={openCreateDialog} className="bg-[#ba9b65] hover:bg-[#a07c28] text-white font-bold rounded-xl cursor-pointer">
            <Plus size={16} className="ml-1" />
            إضافة فعالية
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e8dcc8]/50 p-4 animate-pulse">
                <div className="h-32 bg-gray-100 rounded-xl mb-3" />
                <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-center text-[#8a7a5c] py-8 font-bold">لا توجد فعاليات مسجلة حالياً</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl border border-[#e8dcc8]/50 overflow-hidden shadow-xs flex flex-col justify-between">
                <div>
                  {event.image_url ? (
                    <img src={getImageUrl(event.image_url)} alt={event.title} className="h-36 w-full object-cover" />
                  ) : (
                    <div className="h-36 bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center text-[#ba9b65] font-bold">
                      قهوتي
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-base text-[#2f2d29]">{event.title}</h3>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewEvent(event)}
                          title="عرض التفاصيل"
                          className="p-1.5 rounded-lg text-[#8a7a5c] hover:bg-[#f0e8d0] hover:text-[#2f2d29] transition-colors cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditDialog(event)}
                          title="تعديل الفعالية"
                          className="p-1.5 rounded-lg text-[#8a7a5c] hover:bg-[#f0e8d0] hover:text-[#2f2d29] transition-colors cursor-pointer"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(event)}
                          title="حذف الفعالية"
                          className="p-1.5 rounded-lg text-[#8a7a5c] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#8a7a5c]">
                      <Calendar size={13} />
                      <span>تاريخ الفعالية: {new Date(event.event_date).toLocaleDateString("ar-SA")}</span>
                    </div>
                    {(event.cafe?.name || cafes.find((c) => c.id === event.cafe_id)?.name) && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#ba9b65] font-bold">
                        <Coffee size={13} />
                        <span>{event.cafe?.name || cafes.find((c) => c.id === event.cafe_id)?.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#8a7a5c]">
                      <MapPin size={13} />
                      <span>{event.location}</span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-[#524e48] mt-2 line-clamp-2 leading-relaxed">{event.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Event Details Dialog */}
      <Dialog open={!!viewEvent} onOpenChange={(open) => !open && setViewEvent(null)}>
        <DialogContent className="sm:max-w-md bg-white text-[#2F2D29] rounded-3xl p-6 border border-[#EAE6DF] shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#2F2D29] text-right mb-2">
              تفاصيل الفعالية: {viewEvent?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {viewEvent?.image_url && (
              <img
                src={getImageUrl(viewEvent.image_url)}
                alt={viewEvent.title}
                className="w-full h-44 object-cover rounded-2xl"
              />
            )}
            <div className="space-y-2 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8A7A5C] font-bold">التاريخ:</span>
                <span className="font-extrabold text-[#2F2D29]">
                  {viewEvent?.event_date ? new Date(viewEvent.event_date).toLocaleString("ar-SA") : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8A7A5C] font-bold">الموقع:</span>
                <span className="font-extrabold text-[#2F2D29]">{viewEvent?.location || "الفرع الرئيسي"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8A7A5C] font-bold">الحالة:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DEF7EC] text-[#0E9F6E]">
                  {viewEvent?.status || "منشورة"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#8A7A5C]">الوصف:</Label>
              <p className="text-xs text-[#2F2D29] leading-relaxed whitespace-pre-line p-3 bg-white border border-[#EAE6DF] rounded-xl">
                {viewEvent?.description || "لا يوجد وصف"}
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewEvent(null)}
              className="border-[#E5E0D8] text-[#2F2D29] font-bold rounded-xl"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92vh] overflow-y-auto bg-white text-[#2F2D29] rounded-3xl p-6 sm:p-7 border border-[#EAE6DF] shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-extrabold text-[#2F2D29] text-right mb-1">
              {editingEvent ? "تعديل الفعالية" : "إضافة فعالية"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Column 1: Core Event Details */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#2F2D29]">اسم الفعالية</Label>
                  <Input
                    {...register("title")}
                    placeholder="مثال: بطولة الباريستا للاتيه آرت"
                    className="h-10 rounded-xl border-[#E5E0D8] bg-white text-xs text-[#2F2D29] placeholder:text-[#8A7A5C]/70"
                  />
                  {errors.title && <p className="text-[11px] text-red-500 font-semibold">{errors.title.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#2F2D29]">المقهى</Label>
                  <select
                    {...register("cafe_id")}
                    className="w-full h-10 rounded-xl border border-[#E5E0D8] bg-white px-3 text-xs text-[#2F2D29] focus:outline-none focus:border-[#BA9B65]"
                  >
                    <option value="">
                      {cafesLoading ? "جاري تحميل المقاهي..." : cafes.length === 0 ? "لا توجد مقاهي متاحة" : "اختر المقهى"}
                    </option>
                    {cafes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.address ? `(${c.address})` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.cafe_id && <p className="text-[11px] text-red-500 font-semibold">{errors.cafe_id.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#2F2D29]">تاريخ ووقت الفعالية</Label>
                  <Input
                    type="datetime-local"
                    {...register("event_date")}
                    className="h-10 rounded-xl border-[#E5E0D8] bg-white text-xs text-[#2F2D29]"
                  />
                  {errors.event_date && <p className="text-[11px] text-red-500 font-semibold">{errors.event_date.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#2F2D29]">الموقع</Label>
                  <Input
                    {...register("location")}
                    placeholder="الفرع الرئيسي - الرياض"
                    className="h-10 rounded-xl border-[#E5E0D8] bg-white text-xs text-[#2F2D29] placeholder:text-[#8A7A5C]/70"
                  />
                  {errors.location && <p className="text-[11px] text-red-500 font-semibold">{errors.location.message}</p>}
                </div>
              </div>

              {/* Column 2: Image Upload & Description */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#2F2D29]">صورة الفعالية</Label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#E5E0D8] rounded-xl p-3 text-center hover:border-[#BA9B65] transition-colors cursor-pointer bg-[#FAF8F5]/60 min-h-[90px] flex items-center justify-center"
                  >
                    {currentImageUrl ? (
                      <div className="space-y-1 py-1">
                        <img src={getImageUrl(currentImageUrl)} alt="Event Preview" className="h-14 w-auto rounded-lg mx-auto object-cover" />
                        <p className="text-[10px] text-[#8A7A5C] font-bold">اضغط لتغيير الصورة</p>
                      </div>
                    ) : uploading ? (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <LoaderCircle className="animate-spin text-[#BA9B65]" size={16} />
                        <span className="text-xs font-bold text-[#8A7A5C]">جاري رفع الصورة...</span>
                      </div>
                    ) : (
                      <div className="py-1">
                        <Upload className="h-5 w-5 mx-auto text-[#BA9B65] mb-1" />
                        <p className="text-xs font-bold text-[#8A7A5C]">اضغط لرفع صورة الفعالية</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#2F2D29]">الوصف</Label>
                  <textarea
                    {...register("description")}
                    placeholder="اكتب تفاصيل ومحتوى الفعالية هنا..."
                    rows={4}
                    className="w-full p-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#2F2D29] placeholder:text-[#8A7A5C]/70 resize-none focus:outline-none focus:border-[#BA9B65]"
                  />
                  {errors.description && <p className="text-[11px] text-red-500 font-semibold">{errors.description.message}</p>}
                </div>
              </div>
            </div>

            {/* Action buttons - always visible */}
            <div className="flex items-center gap-3 pt-3 border-t border-[#F0ECE4]">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-10 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold rounded-xl shadow-xs cursor-pointer text-sm"
              >
                {isSubmitting ? "جاري الحفظ..." : "حفظ الفعالية"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 h-10 border-[#E5E0D8] text-[#2F2D29] font-bold rounded-xl cursor-pointer text-sm"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف الفعالية"
        description={`هل أنت متأكد من حذف الفعالية "${deleteTarget?.title}"؟`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
