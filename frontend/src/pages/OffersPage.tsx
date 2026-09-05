import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Loader2,
  LoaderCircle,
  Upload,
} from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useOffers,
  useCreateOffer,
  useUpdateOffer,
  useDeleteOffer,
} from "@/hooks/useOffers";
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from "@/hooks/useEvents";
import { useCafes } from "@/hooks/useCafes";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { uploadApi } from "@/api/upload";
import { getImageUrl } from "@/utils/imageUrl";

const offerSchema = z.object({
  title: z.string().min(1, "عنوان العرض مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  discount_percentage: z.coerce.number().min(0).max(100).default(10),
  cafe_id: z.string().optional().default(""),
  start_date: z.string().min(1, "تاريخ البداية مطلوب"),
  end_date: z.string().min(1, "تاريخ النهاية مطلوب"),
});

type OfferFormData = z.infer<typeof offerSchema>;

const eventSchema = z.object({
  title: z.string().min(1, "اسم الفعالية مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  location: z.string().optional().default("الفرع الرئيسي"),
  cafe_id: z.string().optional().default(""),
  event_date: z.string().min(1, "تاريخ الفعالية مطلوب"),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function OffersPage() {
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [offerImageUrl, setOfferImageUrl] = useState("");
  const [eventImageUrl, setEventImageUrl] = useState("");
  const [uploadingOfferImg, setUploadingOfferImg] = useState(false);
  const [uploadingEventImg, setUploadingEventImg] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const offerFileInputRef = useRef<HTMLInputElement>(null);
  const eventFileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: offersData, isLoading: offersLoading } = useOffers({ page: 1, page_size: 50 });
  const { data: eventsData, isLoading: eventsLoading } = useEvents({ page: 1, page_size: 50 });
  const { data: cafesData } = useCafes({ page_size: 1000 });

  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const deleteOffer = useDeleteOffer();

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const offers = offersData?.items ?? [];
  const events = eventsData?.items ?? [];
  const cafes = cafesData?.items ?? [];

  const offerForm = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: { title: "", description: "", discount_percentage: 15, cafe_id: "", start_date: "", end_date: "" },
  });

  const eventForm = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: { title: "", description: "", location: "الفرع الرئيسي", cafe_id: "", event_date: "" },
  });

  const openCreateOffer = () => {
    setEditingOffer(null);
    setOfferImageUrl("");
    setFormError(null);
    const defaultCafe = cafes[0]?.id || "";
    offerForm.reset({
      title: "",
      description: "",
      discount_percentage: 15,
      cafe_id: defaultCafe,
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
    });
    setOfferDialogOpen(true);
  };

  const openCreateEvent = () => {
    setEditingEvent(null);
    setEventImageUrl("");
    setFormError(null);
    const defaultCafe = cafes[0]?.id || "";
    eventForm.reset({
      title: "",
      description: "",
      location: "الفرع الرئيسي",
      cafe_id: defaultCafe,
      event_date: new Date().toISOString().slice(0, 16),
    });
    setEventDialogOpen(true);
  };

  const handleOfferFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingOfferImg(true);
    try {
      const res = await uploadApi.uploadImage(file);
      setOfferImageUrl(res.url);
    } catch (err) {
      console.error("Offer upload failed", err);
    } finally {
      setUploadingOfferImg(false);
    }
  };

  const handleEventFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEventImg(true);
    try {
      const res = await uploadApi.uploadImage(file);
      setEventImageUrl(res.url);
    } catch (err) {
      console.error("Event upload failed", err);
    } finally {
      setUploadingEventImg(false);
    }
  };

  const handleOfferSubmit = (formData: OfferFormData) => {
    const targetCafeId = formData.cafe_id || cafes[0]?.id;
    if (!targetCafeId) {
      setFormError("يرجى اختيار مقهى");
      return;
    }
    setFormError(null);
    const payload = {
      title: formData.title,
      description: formData.description,
      discount_percentage: Number(formData.discount_percentage) || 10,
      cafe_id: targetCafeId,
      image_url: offerImageUrl || undefined,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      status: "ACTIVE" as const,
    };
    if (editingOffer) {
      updateOffer.mutate({ id: editingOffer.id, data: payload }, {
        onSuccess: () => {
          setOfferDialogOpen(false);
          setEditingOffer(null);
          queryClient.invalidateQueries({ queryKey: ["offers"] });
        },
        onError: (err: any) => {
          setFormError(err?.response?.data?.message || "حدث خطأ أثناء تعديل العرض");
        },
      });
    } else {
      createOffer.mutate(payload, {
        onSuccess: () => {
          setOfferDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ["offers"] });
        },
        onError: (err: any) => {
          setFormError(err?.response?.data?.message || "حدث خطأ أثناء إضافة العرض");
        },
      });
    }
  };

  const handleEventSubmit = (formData: EventFormData) => {
    const targetCafeId = formData.cafe_id || cafes[0]?.id;
    if (!targetCafeId) {
      setFormError("يرجى اختيار مقهى");
      return;
    }
    setFormError(null);
    const payload = {
      title: formData.title,
      description: formData.description,
      location: formData.location || "الفرع الرئيسي",
      cafe_id: targetCafeId,
      image_url: eventImageUrl || undefined,
      event_date: new Date(formData.event_date).toISOString(),
      status: "PUBLISHED" as const,
    };
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, data: payload }, {
        onSuccess: () => {
          setEventDialogOpen(false);
          setEditingEvent(null);
          queryClient.invalidateQueries({ queryKey: ["events"] });
        },
        onError: (err: any) => {
          setFormError(err?.response?.data?.message || "حدث خطأ أثناء تعديل الفعالية");
        },
      });
    } else {
      createEvent.mutate(payload, {
        onSuccess: () => {
          setEventDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ["events"] });
        },
        onError: (err: any) => {
          setFormError(err?.response?.data?.message || "حدث خطأ أثناء إضافة الفعالية");
        },
      });
    }
  };


  return (
    <div className="space-y-8 pb-12 font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* 1. Offers Section matching Offers and events.png */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#2F2D29]">إدارة العروض</h2>
          <button
            onClick={openCreateOffer}
            className="px-6 py-2.5 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95"
          >
            إضافة عرض
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.length === 0 ? (
            <>
              {/* Sample Card 1 matching Figma */}
              <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE6DF] flex-shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=80"
                      alt="مقهى سيلانترو"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 text-right">
                    <h3 className="text-sm font-extrabold text-[#2F2D29]">مقهى سيلانترو</h3>
                    <p className="text-[11px] text-[#8A7A5C] font-semibold">تاريخ البداية: 30/10/2025</p>
                    <p className="text-[11px] text-[#8A7A5C] font-semibold">تاريخ النهاية: 1/12/2025</p>
                    <p className="text-[11px] text-[#2F2D29] font-bold">التوضيح: 2 قهوة سبريسو + واحد هدية</p>
                  </div>
                </div>
                <button className="text-[#8A7A5C] hover:text-[#2F2D29] p-1">
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* Sample Card 2 matching Figma */}
              <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE6DF] flex-shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&auto=format&fit=crop&q=80"
                      alt="مقهى كارييو"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 text-right">
                    <h3 className="text-sm font-extrabold text-[#2F2D29]">مقهى كارييو</h3>
                    <p className="text-[11px] text-[#8A7A5C] font-semibold">تاريخ البداية: 30/10/2025</p>
                    <p className="text-[11px] text-[#8A7A5C] font-semibold">تاريخ النهاية: 1/12/2025</p>
                    <p className="text-[11px] text-[#2F2D29] font-bold">التوضيح: 2 قهوة باردة + واحد هدية</p>
                  </div>
                </div>
                <button className="text-[#8A7A5C] hover:text-[#2F2D29] p-1">
                  <MoreVertical size={16} />
                </button>
              </div>
            </>
          ) : (
            offers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE6DF] flex-shrink-0">
                    <img
                      src={getImageUrl(offer.image_url) || "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=80"}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 text-right">
                    <h3 className="text-sm font-extrabold text-[#2F2D29]">{offer.title}</h3>
                    <p className="text-[11px] text-[#8A7A5C] font-semibold">تاريخ البداية: {new Date(offer.start_date).toLocaleDateString("en-GB")}</p>
                    <p className="text-[11px] text-[#8A7A5C] font-semibold">تاريخ النهاية: {new Date(offer.end_date).toLocaleDateString("en-GB")}</p>
                    <p className="text-[11px] text-[#2F2D29] font-bold">التوضيح: {offer.description}</p>
                  </div>
                </div>
                <button className="text-[#8A7A5C] hover:text-[#2F2D29] p-1">
                  <MoreVertical size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Events Section matching Offers and events.png */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#2F2D29]">إدارة الفعاليات</h2>
          <button
            onClick={openCreateEvent}
            className="px-6 py-2.5 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95"
          >
            إضافة فعالية
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.length === 0 ? (
            <>
              {/* Sample Event 1 matching Figma */}
              <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE6DF] flex-shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&auto=format&fit=crop&q=80"
                      alt="أسم الفعالية"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 text-right">
                    <h3 className="text-sm font-extrabold text-[#2F2D29]">أسم الفعالية</h3>
                    <p className="text-[11px] text-[#8A7A5C] font-semibold">تاريخ البداية: 30/10/2025</p>
                    <p className="text-[11px] text-[#8A7A5C] font-semibold">تاريخ النهاية: 1/12/2025</p>
                    <p className="text-[11px] text-[#2F2D29] font-bold">التوضيح: مناسبة عيد ميلاد</p>
                  </div>
                </div>
                <button className="text-[#8A7A5C] hover:text-[#2F2D29] p-1">
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* Sample Event 2 matching Figma */}
              <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE6DF] flex-shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&auto=format&fit=crop&q=80"
                      alt="أسم الفعالية"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 text-right">
                    <h3 className="text-sm font-extrabold text-[#2F2D29]">أسم الفعالية</h3>
                    <p className="text-[11px] text-[#8A7A5C] font-semibold">تاريخ البداية: 30/10/2025</p>
                    <p className="text-[11px] text-[#8A7A5C] font-semibold">تاريخ النهاية: 1/12/2025</p>
                    <p className="text-[11px] text-[#2F2D29] font-bold">التوضيح: مناسبة عيد ميلاد</p>
                  </div>
                </div>
                <button className="text-[#8A7A5C] hover:text-[#2F2D29] p-1">
                  <MoreVertical size={16} />
                </button>
              </div>
            </>
          ) : (
            events.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE6DF] flex-shrink-0">
                    <img
                      src={getImageUrl(event.image_url) || "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&auto=format&fit=crop&q=80"}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 text-right">
                    <h3 className="text-sm font-extrabold text-[#2F2D29]">{event.title}</h3>
                    <p className="text-[11px] text-[#8A7A5C] font-semibold">تاريخ الفعالية: {new Date(event.event_date).toLocaleDateString("en-GB")}</p>
                    <p className="text-[11px] text-[#2F2D29] font-bold">التوضيح: {event.description}</p>
                  </div>
                </div>
                <button className="text-[#8A7A5C] hover:text-[#2F2D29] p-1">
                  <MoreVertical size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Offer Dialog matching Add Offer.png */}
      <Dialog open={offerDialogOpen} onOpenChange={(open) => !open && setOfferDialogOpen(false)}>
        <DialogContent className="sm:max-w-md bg-white text-[#2F2D29] rounded-3xl p-6 border border-[#EAE6DF] shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-[#2F2D29] text-right mb-4">
              {editingOffer ? "تعديل العرض" : "إضافة عرض"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={offerForm.handleSubmit(handleOfferSubmit, (err) => { console.warn("Validation error:", err); setFormError("يرجى ملء جميع الحقول المطلوبة بشكل صحيح"); })} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">المقهى</Label>
              <select
                {...offerForm.register("cafe_id")}
                className="w-full h-11 rounded-xl border border-[#E5E0D8] bg-white px-3 text-sm text-[#2F2D29] focus:outline-none focus:border-[#BA9B65]"
              >
                <option value="">اختر المقهى</option>
                {cafes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">صورة العرض</Label>
              <input
                type="file"
                ref={offerFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleOfferFileUpload}
              />
              <div
                onClick={() => offerFileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E5E0D8] rounded-2xl p-4 text-center hover:border-[#BA9B65] transition-colors cursor-pointer bg-white"
              >
                {offerImageUrl ? (
                  <div className="space-y-2">
                    <img src={getImageUrl(offerImageUrl)} alt="Offer Preview" className="h-20 w-auto rounded-lg mx-auto object-cover" />
                    <p className="text-xs text-[#8A7A5C] font-bold">اضغط لتغيير الصورة</p>
                  </div>
                ) : uploadingOfferImg ? (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <LoaderCircle className="animate-spin text-[#BA9B65]" size={20} />
                    <span className="text-xs font-bold text-[#8A7A5C]">جاري رفع الصورة...</span>
                  </div>
                ) : (
                  <div>
                    <Plus className="h-6 w-6 mx-auto text-[#BA9B65] mb-2" />
                    <p className="text-xs font-bold text-[#8A7A5C]">اضغط هنا لرفع الصورة</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">عنوان العرض</Label>
              <Input {...offerForm.register("title")} placeholder="مثال: خصم 20% على جميع أنواع القهوة" className="h-11 rounded-xl border-[#E5E0D8] bg-white text-[#2F2D29] placeholder:text-[#8A7A5C]/70" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#2F2D29]">تاريخ بداية العرض</Label>
                <Input type="date" {...offerForm.register("start_date")} className="h-11 rounded-xl border-[#E5E0D8] bg-white text-[#2F2D29]" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#2F2D29]">تاريخ نهاية العرض</Label>
                <Input type="date" {...offerForm.register("end_date")} className="h-11 rounded-xl border-[#E5E0D8] bg-white text-[#2F2D29]" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">نص توضيحي</Label>
              <textarea {...offerForm.register("description")} placeholder="2 قهوة سبريسو + واحد هدية" rows={3} className="w-full p-3 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#2F2D29] placeholder:text-[#8A7A5C]/70 resize-none focus:outline-none focus:border-[#BA9B65]" required />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={createOffer.isPending || updateOffer.isPending}
                className="flex-1 h-11 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold rounded-xl shadow-xs"
              >
                {createOffer.isPending || updateOffer.isPending ? "جاري الحفظ..." : "إضافة"}
              </Button>
              <Button
                type="button"
                onClick={() => setOfferDialogOpen(false)}
                className="flex-1 h-11 bg-[#BA9B65]/15 hover:bg-[#BA9B65] text-[#7A5C28] hover:text-white border border-[#BA9B65] font-bold rounded-xl transition-all shadow-xs"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog matching Add Event.png */}
      <Dialog open={eventDialogOpen} onOpenChange={(open) => !open && setEventDialogOpen(false)}>
        <DialogContent className="sm:max-w-md bg-white text-[#2F2D29] rounded-3xl p-6 border border-[#EAE6DF] shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-[#2F2D29] text-right mb-4">
              {editingEvent ? "تعديل الفعالية" : "إضافة فعالية"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={eventForm.handleSubmit(handleEventSubmit, (err) => { console.warn("Validation error:", err); setFormError("يرجى ملء جميع الحقول المطلوبة بشكل صحيح"); })} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">المقهى</Label>
              <select
                {...eventForm.register("cafe_id")}
                className="w-full h-11 rounded-xl border border-[#E5E0D8] bg-white px-3 text-sm text-[#2F2D29] focus:outline-none focus:border-[#BA9B65]"
              >
                <option value="">اختر المقهى</option>
                {cafes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">صورة الفعالية</Label>
              <input
                type="file"
                ref={eventFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleEventFileUpload}
              />
              <div
                onClick={() => eventFileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E5E0D8] rounded-2xl p-4 text-center hover:border-[#BA9B65] transition-colors cursor-pointer bg-white"
              >
                {eventImageUrl ? (
                  <div className="space-y-2">
                    <img src={getImageUrl(eventImageUrl)} alt="Event Preview" className="h-20 w-auto rounded-lg mx-auto object-cover" />
                    <p className="text-xs text-[#8A7A5C] font-bold">اضغط لتغيير الصورة</p>
                  </div>
                ) : uploadingEventImg ? (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <LoaderCircle className="animate-spin text-[#BA9B65]" size={20} />
                    <span className="text-xs font-bold text-[#8A7A5C]">جاري رفع الصورة...</span>
                  </div>
                ) : (
                  <div>
                    <Plus className="h-6 w-6 mx-auto text-[#BA9B65] mb-2" />
                    <p className="text-xs font-bold text-[#8A7A5C]">اضغط هنا لرفع الصورة</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">اسم الفعالية</Label>
              <Input {...eventForm.register("title")} placeholder="مثال: بطولة الباريستا للاتيه آرت" className="h-11 rounded-xl border-[#E5E0D8] bg-white text-[#2F2D29] placeholder:text-[#8A7A5C]/70" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#2F2D29]">تاريخ بداية الفعالية</Label>
                <Input type="date" {...eventForm.register("event_date")} className="h-11 rounded-xl border-[#E5E0D8] bg-white text-[#2F2D29]" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#2F2D29]">الموقع</Label>
                <Input {...eventForm.register("location")} placeholder="الفرع الرئيسي" className="h-11 rounded-xl border-[#E5E0D8] bg-white text-[#2F2D29]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">نص توضيحي</Label>
              <textarea {...eventForm.register("description")} placeholder="تفاصيل الفعالية..." rows={3} className="w-full p-3 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#2F2D29] placeholder:text-[#8A7A5C]/70 resize-none focus:outline-none focus:border-[#BA9B65]" required />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={createEvent.isPending || updateEvent.isPending}
                className="flex-1 h-11 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold rounded-xl shadow-xs"
              >
                {createEvent.isPending || updateEvent.isPending ? "جاري الحفظ..." : "إضافة"}
              </Button>
              <Button
                type="button"
                onClick={() => setEventDialogOpen(false)}
                className="flex-1 h-11 bg-[#BA9B65]/15 hover:bg-[#BA9B65] text-[#7A5C28] hover:text-white border border-[#BA9B65] font-bold rounded-xl transition-all shadow-xs"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
