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
import { useOffers, useCreateOffer, useUpdateOffer, useDeleteOffer } from "@/hooks/useOffers";
import { useCafes } from "@/hooks/useCafes";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const offerSchema = z.object({
  title: z.string().min(1, "اسم العرض مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  discount_percentage: z.number({ invalid_type_error: "النسبة يجب أن تكون رقمًا" }).min(1).max(100),
  image_url: z.string().optional().default(""),
  cafe_id: z.string().min(1, "المقهى مطلوب"),
  start_date: z.string().min(1, "تاريخ البداية مطلوب"),
  end_date: z.string().min(1, "تاريخ النهاية مطلوب"),
});

type OfferFormData = z.infer<typeof offerSchema>;

export default function OffersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useOffers({ page: 1, page_size: 100 });
  const { data: cafesData } = useCafes({ page_size: 1000 });
  const createMutation = useCreateOffer();
  const updateMutation = useUpdateOffer();
  const deleteMutation = useDeleteOffer();

  const offers = data?.items ?? [];
  const cafes = cafesData?.items ?? [];

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: { title: "", description: "", discount_percentage: 0, image_url: "", cafe_id: "", start_date: "", end_date: "" },
  });

  const openCreateDialog = () => {
    setEditingOffer(null);
    reset({ title: "", description: "", discount_percentage: 0, image_url: "", cafe_id: "", start_date: "", end_date: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (offer: any) => {
    setEditingOffer(offer);
    reset({
      title: offer.title,
      description: offer.description,
      discount_percentage: Number(offer.discount_percentage),
      image_url: offer.image_url || "",
      cafe_id: offer.cafe_id,
      start_date: new Date(offer.start_date).toISOString().slice(0, 10),
      end_date: new Date(offer.end_date).toISOString().slice(0, 10),
    });
    setDialogOpen(true);
  };

  const onSubmit = (formData: OfferFormData) => {
    const payload = {
      ...formData,
      image_url: formData.image_url || null,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      status: "ACTIVE" as const,
    };
    if (editingOffer) {
      updateMutation.mutate({ id: editingOffer.id, data: payload }, {
        onSuccess: () => { setDialogOpen(false); setEditingOffer(null); reset(); },
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
      onSuccess: () => { setDeleteTarget(null); queryClient.invalidateQueries({ queryKey: ["offers"] }); },
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8" dir="rtl">
      {/* Offers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2f2d29]">إدارة العروض</h2>
          <Button onClick={openCreateDialog} className="bg-[#c8a44e] hover:bg-[#b8943e] text-white">
            إضافة عرض
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e8dcc8]/50 p-4 animate-pulse">
                <div className="h-32 bg-gray-100 rounded-xl mb-3" />
                <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <p className="text-center text-[#8a7a5c] py-8">لا توجد عروض</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-2xl border border-[#e8dcc8]/50 overflow-hidden">
                {offer.image_url ? (
                  <img src={offer.image_url} alt={offer.title} className="h-32 w-full object-cover" />
                ) : (
                  <div className="h-32 bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                    <span className="text-3xl font-bold text-[#c8a44e]">{offer.discount_percentage}%</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#2f2d29]">{offer.title}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditDialog(offer)}
                        className="p-1.5 rounded-lg text-[#8a7a5c] hover:bg-[#f0e8d0] transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(offer)}
                        className="p-1.5 rounded-lg text-[#8a7a5c] hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#8a7a5c]">
                    <span>تاريخ البداية: {new Date(offer.start_date).toLocaleDateString("ar-SA")}</span>
                    <span>تاريخ النهاية: {new Date(offer.end_date).toLocaleDateString("ar-SA")}</span>
                  </div>
                  <p className="text-sm text-[#8a7a5c] mt-1">{offer.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2f2d29]">
              {editingOffer ? "تعديل العرض" : "إضافة عرض"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">صورة العرض (رابط)</Label>
              <Input {...register("image_url")} placeholder="https://example.com/offer.jpg" className="border-[#e0d5b8]" dir="ltr" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">اسم العرض</Label>
              <Input {...register("title")} className="border-[#e0d5b8]" />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#2f2d29]">تاريخ بداية العرض</Label>
                <Input type="date" {...register("start_date")} className="border-[#e0d5b8]" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#2f2d29]">تاريخ نهاية العرض</Label>
                <Input type="date" {...register("end_date")} className="border-[#e0d5b8]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">نسبة الخصم (%)</Label>
              <Input type="number" {...register("discount_percentage", { valueAsNumber: true })} className="border-[#e0d5b8]" />
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
        title="حذف العرض"
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
