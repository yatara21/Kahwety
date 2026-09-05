import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Upload, Pencil, Trash2, LoaderCircle } from "lucide-react";

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
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/useEvents";
import { useCafes } from "@/hooks/useCafes";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { uploadApi } from "@/api/upload";
import { getImageUrl } from "@/utils/imageUrl";

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
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useEvents({ page: 1, page_size: 100 });
  const { data: cafesData } = useCafes({ page_size: 1000 });
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
    } catch (err) {
      console.error("Upload error", err);
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
      alert("يرجى اختيار مقهى");
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
        onSuccess: () => { setDialogOpen(false); setEditingEvent(null); reset(); },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { setDialogOpen(false); reset(); },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => { setDeleteTarget(null); queryClient.invalidateQueries({ queryKey: ["events"] }); },
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8" dir="rtl">
      {/* Events Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2f2d29]">إدارة الفعاليات</h2>
          <Button onClick={openCreateDialog} className="bg-[#c8a44e] hover:bg-[#b8943e] text-white">
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
          <p className="text-center text-[#8a7a5c] py-8">لا توجد فعاليات</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl border border-[#e8dcc8]/50 overflow-hidden">
                {event.image_url ? (
                  <img src={getImageUrl(event.image_url)} alt={event.title} className="h-32 w-full object-cover" />
                ) : (
                  <div className="h-32 bg-gradient-to-br from-amber-100 to-amber-50" />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#2f2d29]">{event.title}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditDialog(event)}
                        className="p-1.5 rounded-lg text-[#8a7a5c] hover:bg-[#f0e8d0] transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(event)}
                        className="p-1.5 rounded-lg text-[#8a7a5c] hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#8a7a5c]">
                    <span>تاريخ الفعالية: {new Date(event.event_date).toLocaleDateString("ar-SA")}</span>
                  </div>
                  <p className="text-sm text-[#8a7a5c] mt-1">{event.location}</p>
                  {event.description && (
                    <p className="text-sm text-[#8a7a5c] mt-1 line-clamp-2">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md bg-white text-[#2F2D29] rounded-3xl p-6 border border-[#EAE6DF] shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#2F2D29] text-right mb-2">
              {editingEvent ? "تعديل الفعالية" : "إضافة فعالية"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
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
                className="border-2 border-dashed border-[#E5E0D8] rounded-2xl p-4 text-center hover:border-[#BA9B65] transition-colors cursor-pointer bg-white"
              >
                {currentImageUrl ? (
                  <div className="space-y-2">
                    <img src={getImageUrl(currentImageUrl)} alt="Event Preview" className="h-20 w-auto rounded-lg mx-auto object-cover" />
                    <p className="text-xs text-[#8A7A5C] font-bold">اضغط لتغيير الصورة</p>
                  </div>
                ) : uploading ? (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <LoaderCircle className="animate-spin text-[#BA9B65]" size={20} />
                    <span className="text-xs font-bold text-[#8A7A5C]">جاري رفع الصورة...</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-6 w-6 mx-auto text-[#BA9B65] mb-2" />
                    <p className="text-xs font-bold text-[#8A7A5C]">اضغط هنا لرفع الصورة</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">اسم الفعالية</Label>
              <Input {...register("title")} placeholder="مثال: بطولة الباريستا للاتيه آرت" className="h-11 rounded-xl border-[#E5E0D8] bg-white text-[#2F2D29] placeholder:text-[#8A7A5C]/70" />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">تاريخ الفعالية</Label>
              <Input type="datetime-local" {...register("event_date")} className="h-11 rounded-xl border-[#E5E0D8] bg-white text-[#2F2D29]" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">الموقع</Label>
              <Input {...register("location")} placeholder="الفرع الرئيسي - الرياض" className="h-11 rounded-xl border-[#E5E0D8] bg-white text-[#2F2D29] placeholder:text-[#8A7A5C]/70" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">المقهى</Label>
              <select {...register("cafe_id")} className="w-full h-11 rounded-xl border border-[#E5E0D8] bg-white px-3 text-sm text-[#2F2D29] focus:outline-none focus:border-[#BA9B65]">
                <option value="">اختر المقهى</option>
                {cafes.map((cafe) => (
                  <option key={cafe.id} value={cafe.id}>{cafe.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">نص وصفي</Label>
              <textarea {...register("description")} placeholder="وصف وتفاصيل الفعالية..." rows={3} className="w-full p-3 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#2F2D29] placeholder:text-[#8A7A5C]/70 resize-none focus:outline-none focus:border-[#BA9B65]" />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="flex-1 h-11 bg-[#BA9B65]/15 hover:bg-[#BA9B65] text-[#7A5C28] hover:text-white border border-[#BA9B65] font-bold rounded-xl transition-all shadow-xs"
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold rounded-xl shadow-xs">
                {isSubmitting ? "جاري الإضافة..." : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف الفعالية"
        description={`هل أنت متأكد من حذف "${deleteTarget?.title}"؟`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
