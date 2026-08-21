import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Upload, Pencil, Trash2 } from "lucide-react";

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
  const queryClient = useQueryClient();

  const { data, isLoading } = useEvents({ page: 1, page_size: 100 });
  const { data: cafesData } = useCafes({ page_size: 1000 });
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const events = data?.items ?? [];
  const cafes = cafesData?.items ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: { title: "", description: "", location: "", image_url: "", event_date: "", cafe_id: "" },
  });

  const openCreateDialog = () => {
    setEditingEvent(null);
    reset({ title: "", description: "", location: "", image_url: "", event_date: "", cafe_id: "" });
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
    const payload = {
      ...formData,
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
                  <img src={event.image_url} alt={event.title} className="h-32 w-full object-cover" />
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
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2f2d29]">
              {editingEvent ? "تعديل الفعالية" : "إضافة فعالية"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">صورة الفعالية (رابط)</Label>
              <Input {...register("image_url")} placeholder="https://example.com/event.jpg" className="border-[#e0d5b8]" dir="ltr" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">اسم الفعالية</Label>
              <Input {...register("title")} className="border-[#e0d5b8]" />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">تاريخ الفعالية</Label>
              <Input type="datetime-local" {...register("event_date")} className="border-[#e0d5b8]" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">الموقع</Label>
              <Input {...register("location")} className="border-[#e0d5b8]" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">المقهى</Label>
              <select {...register("cafe_id")} className="w-full rounded-xl border border-[#e0d5b8] p-2 text-sm">
                <option value="">اختر المقهى</option>
                {cafes.map((cafe) => (
                  <option key={cafe.id} value={cafe.id}>{cafe.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">نص وصفي</Label>
              <textarea {...register("description")} className="w-full min-h-[100px] rounded-xl border border-[#e0d5b8] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a44e]" />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-[#e0d5b8]">إلغاء</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#c8a44e] hover:bg-[#b8943e] text-white">
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
