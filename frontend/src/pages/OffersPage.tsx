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
  Eye,
  Tag,
  MapPin,
  Coffee,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { toast } from "@/hooks/use-toast";

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
  const [selectedViewOffer, setSelectedViewOffer] = useState<any>(null);
  const [selectedViewEvent, setSelectedViewEvent] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "OFFER" | "EVENT"; id: string; title: string } | null>(null);

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
  const { data: cafesData } = useCafes({ page_size: 100 });

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

  const openEditOffer = (offer: any) => {
    setEditingOffer(offer);
    setOfferImageUrl(offer.image_url || "");
    setFormError(null);
    offerForm.reset({
      title: offer.title,
      description: offer.description,
      discount_percentage: offer.discount_percentage,
      cafe_id: offer.cafe_id,
      start_date: offer.start_date ? new Date(offer.start_date).toISOString().split("T")[0] : "",
      end_date: offer.end_date ? new Date(offer.end_date).toISOString().split("T")[0] : "",
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

  const openEditEvent = (event: any) => {
    setEditingEvent(event);
    setEventImageUrl(event.image_url || "");
    setFormError(null);
    eventForm.reset({
      title: event.title,
      description: event.description,
      location: event.location || "الفرع الرئيسي",
      cafe_id: event.cafe_id,
      event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : "",
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
      toast({ title: "تم بنجاح", description: "تم رفع صورة العرض بنجاح" });
    } catch (err) {
      console.error("Offer upload failed", err);
      toast({ title: "خطأ", description: "فشل رفع صورة العرض", variant: "destructive" });
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
      toast({ title: "تم بنجاح", description: "تم رفع صورة الفعالية بنجاح" });
    } catch (err) {
      console.error("Event upload failed", err);
      toast({ title: "خطأ", description: "فشل رفع صورة الفعالية", variant: "destructive" });
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
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast({ title: "تم بنجاح", description: "تم تعديل العرض بنجاح" });
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
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast({ title: "تم بنجاح", description: "تمت إضافة العرض بنجاح" });
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
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast({ title: "تم بنجاح", description: "تم تعديل الفعالية بنجاح" });
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
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast({ title: "تم بنجاح", description: "تمت إضافة الفعالية بنجاح" });
        },
        onError: (err: any) => {
          setFormError(err?.response?.data?.message || "حدث خطأ أثناء إضافة الفعالية");
        },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "OFFER") {
      deleteOffer.mutate(deleteTarget.id, {
        onSuccess: () => {
          setDeleteTarget(null);
          queryClient.invalidateQueries({ queryKey: ["offers"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast({ title: "تم بنجاح", description: "تم حذف العرض بنجاح" });
        },
        onError: (err: any) => {
          toast({ title: "خطأ", description: err?.response?.data?.message || "فشل حذف العرض", variant: "destructive" });
        },
      });
    } else if (deleteTarget.type === "EVENT") {
      deleteEvent.mutate(deleteTarget.id, {
        onSuccess: () => {
          setDeleteTarget(null);
          queryClient.invalidateQueries({ queryKey: ["events"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast({ title: "تم بنجاح", description: "تم حذف الفعالية بنجاح" });
        },
        onError: (err: any) => {
          toast({ title: "خطأ", description: err?.response?.data?.message || "فشل حذف الفعالية", variant: "destructive" });
        },
      });
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* 1. Offers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#2F2D29]">إدارة العروض</h2>
          <button
            onClick={openCreateOffer}
            className="px-6 py-2.5 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>إضافة عرض</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offersLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-[#EAE6DF] animate-pulse h-28" />
            ))
          ) : offers.length === 0 ? (
            <div className="col-span-2 bg-white rounded-2xl p-8 border border-[#EAE6DF] text-center">
              <Tag className="w-10 h-10 text-[#BA9B65]/40 mx-auto mb-2" />
              <p className="text-sm font-bold text-[#8A7A5C]">لا توجد عروض مسجلة حالياً</p>
            </div>
          ) : (
            offers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE6DF] flex-shrink-0">
                    <img
                      src={offer.image_url ? getImageUrl(offer.image_url) : "/resources/Cafe.png"}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/resources/Cafe.png";
                      }}
                    />
                  </div>
                  <div className="space-y-1 text-right">
                    <h3 className="text-sm font-extrabold text-[#2F2D29]">{offer.title}</h3>
                    <p className="text-[11px] text-[#8A7A5C] font-semibold">تاريخ البداية: {new Date(offer.start_date).toLocaleDateString("en-GB")}</p>
                    <p className="text-[11px] text-[#8A7A5C] font-semibold">تاريخ النهاية: {new Date(offer.end_date).toLocaleDateString("en-GB")}</p>
                    <p className="text-[11px] text-[#2F2D29] font-bold">التوضيح: {offer.description}</p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-[#8A7A5C] hover:text-[#2F2D29] p-2 rounded-lg hover:bg-[#FAF8F5] cursor-pointer">
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-right">
                    <DropdownMenuItem onClick={() => setSelectedViewOffer(offer)} className="cursor-pointer">
                      عرض التفاصيل
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditOffer(offer)} className="cursor-pointer">
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteTarget({ type: "OFFER", id: offer.id, title: offer.title })}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Events Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#2F2D29]">إدارة الفعاليات</h2>
          <button
            onClick={openCreateEvent}
            className="px-6 py-2.5 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>إضافة فعالية</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventsLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-[#EAE6DF] animate-pulse h-28" />
            ))
          ) : events.length === 0 ? (
            <div className="col-span-2 bg-white rounded-2xl p-8 border border-[#EAE6DF] text-center">
              <Calendar className="w-10 h-10 text-[#BA9B65]/40 mx-auto mb-2" />
              <p className="text-sm font-bold text-[#8A7A5C]">لا توجد فعاليات مسجلة حالياً</p>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE6DF] flex-shrink-0">
                    <img
                      src={event.image_url ? getImageUrl(event.image_url) : "/resources/Cafe-1.png"}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/resources/Cafe-1.png";
                      }}
                    />
                  </div>
                  <div className="space-y-1 text-right">
                    <h3 className="text-sm font-extrabold text-[#2F2D29]">{event.title}</h3>
                    <p className="text-[11px] text-[#8A7A5C] font-semibold">تاريخ الفعالية: {new Date(event.event_date).toLocaleDateString("en-GB")}</p>
                    <p className="text-[11px] text-[#2F2D29] font-bold">التوضيح: {event.description}</p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-[#8A7A5C] hover:text-[#2F2D29] p-2 rounded-lg hover:bg-[#FAF8F5] cursor-pointer">
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-right">
                    <DropdownMenuItem onClick={() => setSelectedViewEvent(event)} className="cursor-pointer">
                      عرض التفاصيل
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditEvent(event)} className="cursor-pointer">
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteTarget({ type: "EVENT", id: event.id, title: event.title })}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </div>

      {/* View Offer Details Dialog */}
      <Dialog open={!!selectedViewOffer} onOpenChange={(open) => !open && setSelectedViewOffer(null)}>
        <DialogContent className="sm:max-w-md bg-white text-[#2F2D29] rounded-3xl p-6 border border-[#EAE6DF] shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#2F2D29] text-right mb-2">
              تفاصيل العرض: {selectedViewOffer?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedViewOffer?.image_url && (
              <img
                src={getImageUrl(selectedViewOffer.image_url)}
                alt={selectedViewOffer.title}
                className="w-full h-44 object-cover rounded-2xl"
              />
            )}
            <div className="space-y-2 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8A7A5C] font-bold">نسبة الخصم:</span>
                <span className="font-extrabold text-[#BA9B65]">{selectedViewOffer?.discount_percentage}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8A7A5C] font-bold">تاريخ البداية:</span>
                <span className="font-extrabold text-[#2F2D29]">
                  {selectedViewOffer?.start_date ? new Date(selectedViewOffer.start_date).toLocaleDateString("ar-SA") : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8A7A5C] font-bold">تاريخ النهاية:</span>
                <span className="font-extrabold text-[#2F2D29]">
                  {selectedViewOffer?.end_date ? new Date(selectedViewOffer.end_date).toLocaleDateString("ar-SA") : "-"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#8A7A5C]">التوضيح:</Label>
              <p className="text-xs text-[#2F2D29] leading-relaxed p-3 bg-white border border-[#EAE6DF] rounded-xl">
                {selectedViewOffer?.description || "لا يوجد توضيح"}
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedViewOffer(null)}
              className="border-[#E5E0D8] text-[#2F2D29] font-bold rounded-xl"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Event Details Dialog */}
      <Dialog open={!!selectedViewEvent} onOpenChange={(open) => !open && setSelectedViewEvent(null)}>
        <DialogContent className="sm:max-w-md bg-white text-[#2F2D29] rounded-3xl p-6 border border-[#EAE6DF] shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#2F2D29] text-right mb-2">
              تفاصيل الفعالية: {selectedViewEvent?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedViewEvent?.image_url && (
              <img
                src={getImageUrl(selectedViewEvent.image_url)}
                alt={selectedViewEvent.title}
                className="w-full h-44 object-cover rounded-2xl"
              />
            )}
            <div className="space-y-2 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8A7A5C] font-bold">تاريخ الفعالية:</span>
                <span className="font-extrabold text-[#2F2D29]">
                  {selectedViewEvent?.event_date ? new Date(selectedViewEvent.event_date).toLocaleString("ar-SA") : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8A7A5C] font-bold">الموقع:</span>
                <span className="font-extrabold text-[#2F2D29]">{selectedViewEvent?.location || "الفرع الرئيسي"}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#8A7A5C]">الوصف:</Label>
              <p className="text-xs text-[#2F2D29] leading-relaxed p-3 bg-white border border-[#EAE6DF] rounded-xl">
                {selectedViewEvent?.description || "لا يوجد وصف"}
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedViewEvent(null)}
              className="border-[#E5E0D8] text-[#2F2D29] font-bold rounded-xl"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Offer Dialog */}
      <Dialog open={offerDialogOpen} onOpenChange={(open) => !open && setOfferDialogOpen(false)}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92vh] overflow-y-auto bg-white text-[#2F2D29] rounded-3xl p-6 sm:p-7 border border-[#EAE6DF] shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-extrabold text-[#2F2D29] text-right mb-1">
              {editingOffer ? "تعديل العرض" : "إضافة عرض"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={offerForm.handleSubmit(handleOfferSubmit, (err) => { console.warn("Validation error:", err); setFormError("يرجى ملء جميع الحقول المطلوبة بشكل صحيح"); })} className="space-y-4 pt-1">
            {formError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Column 1: Offer Details */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#2F2D29]">عنوان العرض</Label>
                  <Input {...offerForm.register("title")} placeholder="مثال: خصم 20% على القهوة المقطرة" className="h-10 rounded-xl border-[#E5E0D8] bg-white text-xs text-[#2F2D29] placeholder:text-[#8A7A5C]/70" required />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#2F2D29]">المقهى</Label>
                  <select
                    {...offerForm.register("cafe_id")}
                    className="w-full h-10 rounded-xl border border-[#E5E0D8] bg-white px-3 text-xs text-[#2F2D29] focus:outline-none focus:border-[#BA9B65]"
                  >
                    <option value="">اختر المقهى</option>
                    {cafes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} {c.address ? `(${c.address})` : ""}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#2F2D29]">بداية العرض</Label>
                    <Input type="date" {...offerForm.register("start_date")} className="h-10 rounded-xl border-[#E5E0D8] bg-white text-xs text-[#2F2D29]" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#2F2D29]">نهاية العرض</Label>
                    <Input type="date" {...offerForm.register("end_date")} className="h-10 rounded-xl border-[#E5E0D8] bg-white text-xs text-[#2F2D29]" required />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#2F2D29]">نسبة الخصم (%)</Label>
                  <Input type="number" {...offerForm.register("discount_percentage")} className="h-10 rounded-xl border-[#E5E0D8] bg-white text-xs text-[#2F2D29]" />
                </div>
              </div>

              {/* Column 2: Image & Description */}
              <div className="space-y-3">
                <div className="space-y-1">
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
                    className="border-2 border-dashed border-[#E5E0D8] rounded-xl p-3 text-center hover:border-[#BA9B65] transition-colors cursor-pointer bg-[#FAF8F5]/60 min-h-[90px] flex items-center justify-center"
                  >
                    {offerImageUrl ? (
                      <div className="space-y-1 py-1">
                        <img src={getImageUrl(offerImageUrl)} alt="Offer Preview" className="h-14 w-auto rounded-lg mx-auto object-cover" />
                        <p className="text-[10px] text-[#8A7A5C] font-bold">اضغط لتغيير الصورة</p>
                      </div>
                    ) : uploadingOfferImg ? (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <LoaderCircle className="animate-spin text-[#BA9B65]" size={16} />
                        <span className="text-xs font-bold text-[#8A7A5C]">جاري رفع الصورة...</span>
                      </div>
                    ) : (
                      <div className="py-1">
                        <Plus className="h-5 w-5 mx-auto text-[#BA9B65] mb-1" />
                        <p className="text-xs font-bold text-[#8A7A5C]">اضغط لرفع صورة العرض</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#2F2D29]">نص توضيحي</Label>
                  <textarea {...offerForm.register("description")} placeholder="اكتب تفاصيل العرض هنا..." rows={4} className="w-full p-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#2F2D29] placeholder:text-[#8A7A5C]/70 resize-none focus:outline-none focus:border-[#BA9B65]" required />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-[#F0ECE4]">
              <Button
                type="submit"
                disabled={createOffer.isPending || updateOffer.isPending}
                className="flex-1 h-10 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold rounded-xl shadow-xs cursor-pointer text-sm"
              >
                {createOffer.isPending || updateOffer.isPending ? "جاري الحفظ..." : "حفظ العرض"}
              </Button>
              <Button
                type="button"
                onClick={() => setOfferDialogOpen(false)}
                className="flex-1 h-10 border-[#E5E0D8] text-[#2F2D29] font-bold rounded-xl cursor-pointer text-sm"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={(open) => !open && setEventDialogOpen(false)}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92vh] overflow-y-auto bg-white text-[#2F2D29] rounded-3xl p-6 sm:p-7 border border-[#EAE6DF] shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-extrabold text-[#2F2D29] text-right mb-1">
              {editingEvent ? "تعديل الفعالية" : "إضافة فعالية"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={eventForm.handleSubmit(handleEventSubmit, (err) => { console.warn("Validation error:", err); setFormError("يرجى ملء جميع الحقول المطلوبة بشكل صحيح"); })} className="space-y-4 pt-1">
            {formError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Column 1: Event Details */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#2F2D29]">اسم الفعالية</Label>
                  <Input {...eventForm.register("title")} placeholder="مثال: بطولة الباريستا للاتيه آرت" className="h-10 rounded-xl border-[#E5E0D8] bg-white text-xs text-[#2F2D29] placeholder:text-[#8A7A5C]/70" required />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#2F2D29]">المقهى</Label>
                  <select
                    {...eventForm.register("cafe_id")}
                    className="w-full h-10 rounded-xl border border-[#E5E0D8] bg-white px-3 text-xs text-[#2F2D29] focus:outline-none focus:border-[#BA9B65]"
                  >
                    <option value="">اختر المقهى</option>
                    {cafes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} {c.address ? `(${c.address})` : ""}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#2F2D29]">تاريخ ووقت الفعالية</Label>
                  <Input type="datetime-local" {...eventForm.register("event_date")} className="h-10 rounded-xl border-[#E5E0D8] bg-white text-xs text-[#2F2D29]" required />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#2F2D29]">الموقع</Label>
                  <Input {...eventForm.register("location")} placeholder="الفرع الرئيسي" className="h-10 rounded-xl border-[#E5E0D8] bg-white text-xs text-[#2F2D29]" />
                </div>
              </div>

              {/* Column 2: Image & Description */}
              <div className="space-y-3">
                <div className="space-y-1">
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
                    className="border-2 border-dashed border-[#E5E0D8] rounded-xl p-3 text-center hover:border-[#BA9B65] transition-colors cursor-pointer bg-[#FAF8F5]/60 min-h-[90px] flex items-center justify-center"
                  >
                    {eventImageUrl ? (
                      <div className="space-y-1 py-1">
                        <img src={getImageUrl(eventImageUrl)} alt="Event Preview" className="h-14 w-auto rounded-lg mx-auto object-cover" />
                        <p className="text-[10px] text-[#8A7A5C] font-bold">اضغط لتغيير الصورة</p>
                      </div>
                    ) : uploadingEventImg ? (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <LoaderCircle className="animate-spin text-[#BA9B65]" size={16} />
                        <span className="text-xs font-bold text-[#8A7A5C]">جاري رفع الصورة...</span>
                      </div>
                    ) : (
                      <div className="py-1">
                        <Plus className="h-5 w-5 mx-auto text-[#BA9B65] mb-1" />
                        <p className="text-xs font-bold text-[#8A7A5C]">اضغط لرفع صورة الفعالية</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#2F2D29]">الوصف</Label>
                  <textarea {...eventForm.register("description")} placeholder="تفاصيل الفعالية..." rows={4} className="w-full p-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#2F2D29] placeholder:text-[#8A7A5C]/70 resize-none focus:outline-none focus:border-[#BA9B65]" required />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-[#F0ECE4]">
              <Button
                type="submit"
                disabled={createEvent.isPending || updateEvent.isPending}
                className="flex-1 h-10 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold rounded-xl shadow-xs cursor-pointer text-sm"
              >
                {createEvent.isPending || updateEvent.isPending ? "جاري الحفظ..." : "حفظ الفعالية"}
              </Button>
              <Button
                type="button"
                onClick={() => setEventDialogOpen(false)}
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
        title={deleteTarget?.type === "OFFER" ? "حذف العرض" : "حذف الفعالية"}
        description={`هل أنت متأكد من حذف "${deleteTarget?.title}"؟`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteOffer.isPending || deleteEvent.isPending}
      />
    </div>
  );
}
