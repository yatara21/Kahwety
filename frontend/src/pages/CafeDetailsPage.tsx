import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  User,
  Building2,
  Store,
  Tag,
  Calendar,
  CreditCard,
  Percent,
  CalendarDays,
  FileText,
  Send,
  Ban,
  CheckCircle2,
  Hash,
} from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormField } from "@/components/FormField";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useCafe, useApproveCafe, useRejectCafe } from "@/hooks/useCafes";
import {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/useProducts";
import {
  useCreateOffer,
  useUpdateOffer,
  useDeleteOffer,
} from "@/hooks/useOffers";
import {
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from "@/hooks/useEvents";
import {
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from "@/hooks/useBranches";
import {
  LocationPicker,
  emptyLocation,
  type LocationValue,
} from "@/components/LocationPicker";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Product, Offer, CafeEvent, Branch } from "@/types";

const branchSchema = z.object({
  name: z.string().min(1, "اسم الفرع مطلوب"),
});

type BranchFormData = z.infer<typeof branchSchema>;

const productSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  description: z.string().min(1, "وصف المنتج مطلوب"),
  price: z
    .number({ invalid_type_error: "السعر يجب أن يكون رقمًا" })
    .min(0.01, "السعر يجب أن يكون أكبر من صفر"),
  availability: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

const offerSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  discount_percentage: z
    .number({ invalid_type_error: "النسبة يجب أن تكون رقمًا" })
    .min(1, "النسبة يجب أن تكون على الأقل 1%")
    .max(100, "النسبة لا يمكن أن تتجاوز 100%"),
  start_date: z.string().min(1, "تاريخ البداية مطلوب"),
  end_date: z.string().min(1, "تاريخ النهاية مطلوب"),
  status: z.enum(["DRAFT", "ACTIVE"], {
    required_error: "الحالة مطلوبة",
  }),
});

type OfferFormData = z.infer<typeof offerSchema>;

const eventSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  location: z.string().min(1, "الموقع مطلوب"),
  event_date: z.string().min(1, "التاريخ مطلوب"),
  status: z.enum(["DRAFT", "PUBLISHED"], {
    required_error: "الحالة مطلوبة",
  }),
});

type EventFormData = z.infer<typeof eventSchema>;

function toDateString(iso: string): string {
  return iso ? new Date(iso).toISOString().split("T")[0] : "";
}

function toDatetimeLocalString(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function renderWorkingHours(hours: Record<string, string> | null) {
  if (!hours || Object.keys(hours).length === 0) {
    return <span className="text-sm text-muted-foreground">غير محدد</span>;
  }
  return (
    <div className="space-y-1">
      {Object.entries(hours).map(([day, time]) => (
        <div key={day} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{day}</span>
          <span className="font-medium text-ink-900">{time}</span>
        </div>
      ))}
    </div>
  );
}

export default function CafeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cafe, isLoading, error, refetch } = useCafe(id || "");
  const approveCafe = useApproveCafe();
  const rejectCafe = useRejectCafe();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const deleteOffer = useDeleteOffer();

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchLocation, setBranchLocation] =
    useState<LocationValue>(emptyLocation);
  const [branchLocationError, setBranchLocationError] = useState<
    string | undefined
  >();
  const [deleteBranchTarget, setDeleteBranchTarget] = useState<Branch | null>(
    null
  );

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);

  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deleteOfferTarget, setDeleteOfferTarget] = useState<Offer | null>(null);

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CafeEvent | null>(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState<CafeEvent | null>(null);

  const [activeTab, setActiveTab] = useState("branches");

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      availability: true,
    },
  });

  const offerForm = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      title: "",
      description: "",
      discount_percentage: 0,
      start_date: "",
      end_date: "",
      status: "DRAFT",
    },
  });

  const eventForm = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      event_date: "",
      status: "DRAFT",
    },
  });

  const branchForm = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: "" },
  });

  const watchedOfferStatus = offerForm.watch("status");
  const watchedEventStatus = eventForm.watch("status");
  const watchedAvailability = productForm.watch("availability");

  const invalidateCafe = () => {
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["cafe", id] });
    }
  };

  const handleApprove = () => {
    if (!id) return;
    approveCafe.mutate(id, {
      onSuccess: () => {
        setApproveDialogOpen(false);
        invalidateCafe();
      },
    });
  };

  const handleReject = () => {
    if (!id) return;
    rejectCafe.mutate(id, {
      onSuccess: () => {
        setRejectDialogOpen(false);
        invalidateCafe();
      },
    });
  };

  const openCreateProduct = () => {
    setEditingProduct(null);
    productForm.reset({
      name: "",
      description: "",
      price: 0,
      availability: true,
    });
    setProductDialogOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    productForm.reset({
      name: product.name,
      description: product.description,
      price: product.price,
      availability: product.availability,
    });
    setProductDialogOpen(true);
  };

  const onSubmitProduct = (formData: ProductFormData) => {
    if (editingProduct) {
      updateProduct.mutate(
        { id: editingProduct.id, data: { ...formData, cafe_id: id } },
        {
          onSuccess: () => {
            setProductDialogOpen(false);
            setEditingProduct(null);
            productForm.reset();
            invalidateCafe();
          },
        }
      );
    } else {
      createProduct.mutate(
        { ...formData, cafe_id: id },
        {
          onSuccess: () => {
            setProductDialogOpen(false);
            productForm.reset();
            invalidateCafe();
          },
        }
      );
    }
  };

  const handleDeleteProduct = () => {
    if (!deleteProductTarget) return;
    deleteProduct.mutate(deleteProductTarget.id, {
      onSuccess: () => {
        setDeleteProductTarget(null);
        invalidateCafe();
      },
    });
  };

  const openCreateOffer = () => {
    setEditingOffer(null);
    offerForm.reset({
      title: "",
      description: "",
      discount_percentage: 0,
      start_date: "",
      end_date: "",
      status: "DRAFT",
    });
    setOfferDialogOpen(true);
  };

  const openEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    offerForm.reset({
      title: offer.title,
      description: offer.description,
      discount_percentage: offer.discount_percentage,
      start_date: toDateString(offer.start_date),
      end_date: toDateString(offer.end_date),
      status:
        offer.status === "EXPIRED" || offer.status === "DISABLED"
          ? "DRAFT"
          : (offer.status as "DRAFT" | "ACTIVE"),
    });
    setOfferDialogOpen(true);
  };

  const onSubmitOffer = (formData: OfferFormData) => {
    const payload = {
      ...formData,
      cafe_id: id,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
    };

    if (editingOffer) {
      updateOffer.mutate(
        { id: editingOffer.id, data: payload },
        {
          onSuccess: () => {
            setOfferDialogOpen(false);
            setEditingOffer(null);
            offerForm.reset();
            invalidateCafe();
          },
        }
      );
    } else {
      createOffer.mutate(payload, {
        onSuccess: () => {
          setOfferDialogOpen(false);
          offerForm.reset();
          invalidateCafe();
        },
      });
    }
  };

  const handleDeleteOffer = () => {
    if (!deleteOfferTarget) return;
    deleteOffer.mutate(deleteOfferTarget.id, {
      onSuccess: () => {
        setDeleteOfferTarget(null);
        invalidateCafe();
      },
    });
  };

  const openCreateEvent = () => {
    setEditingEvent(null);
    eventForm.reset({
      title: "",
      description: "",
      location: "",
      event_date: "",
      status: "DRAFT",
    });
    setEventDialogOpen(true);
  };

  const openEditEvent = (event: CafeEvent) => {
    setEditingEvent(event);
    eventForm.reset({
      title: event.title,
      description: event.description,
      location: event.location,
      event_date: toDatetimeLocalString(event.event_date),
      status:
        event.status === "CANCELLED" || event.status === "COMPLETED"
          ? "DRAFT"
          : (event.status as "DRAFT" | "PUBLISHED"),
    });
    setEventDialogOpen(true);
  };

  const onSubmitEvent = (formData: EventFormData) => {
    const payload = {
      ...formData,
      cafe_id: id,
      event_date: new Date(formData.event_date).toISOString(),
    };

    if (editingEvent) {
      updateEvent.mutate(
        { id: editingEvent.id, data: payload },
        {
          onSuccess: () => {
            setEventDialogOpen(false);
            setEditingEvent(null);
            eventForm.reset();
            invalidateCafe();
          },
        }
      );
    } else {
      createEvent.mutate(payload, {
        onSuccess: () => {
          setEventDialogOpen(false);
          eventForm.reset();
          invalidateCafe();
        },
      });
    }
  };

  const handleDeleteEvent = () => {
    if (!deleteEventTarget) return;
    deleteEvent.mutate(deleteEventTarget.id, {
      onSuccess: () => {
        setDeleteEventTarget(null);
        invalidateCafe();
      },
    });
  };

  const openCreateBranch = () => {
    setEditingBranch(null);
    branchForm.reset({ name: "" });
    setBranchLocation(emptyLocation);
    setBranchLocationError(undefined);
    setBranchDialogOpen(true);
  };

  const openEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    branchForm.reset({ name: branch.name });
    setBranchLocation({
      address: branch.address,
      latitude: branch.latitude,
      longitude: branch.longitude,
      place_id: branch.place_id,
    });
    setBranchLocationError(undefined);
    setBranchDialogOpen(true);
  };

  const onSubmitBranch = (formData: BranchFormData) => {
    if (!branchLocation.address) {
      setBranchLocationError("يرجى اختيار موقع الفرع من الخريطة");
      return;
    }
    setBranchLocationError(undefined);

    const payload = {
      name: formData.name,
      address: branchLocation.address,
      latitude: branchLocation.latitude,
      longitude: branchLocation.longitude,
      place_id: branchLocation.place_id,
    };

    if (editingBranch) {
      updateBranch.mutate(
        { id: editingBranch.id, data: payload },
        {
          onSuccess: () => {
            setBranchDialogOpen(false);
            setEditingBranch(null);
            branchForm.reset();
            setBranchLocation(emptyLocation);
            invalidateCafe();
          },
        }
      );
    } else {
      createBranch.mutate(
        { cafeId: id || "", data: payload },
        {
          onSuccess: () => {
            setBranchDialogOpen(false);
            branchForm.reset();
            setBranchLocation(emptyLocation);
            invalidateCafe();
          },
        }
      );
    }
  };

  const handleDeleteBranch = () => {
    if (!deleteBranchTarget) return;
    deleteBranch.mutate(deleteBranchTarget.id, {
      onSuccess: () => {
        setDeleteBranchTarget(null);
        invalidateCafe();
      },
    });
  };

  const branchColumns = [
    {
      key: "name",
      title: "اسم الفرع",
      render: (branch: Branch) => (
        <span className="font-medium text-ink-900">{branch.name}</span>
      ),
    },
    {
      key: "address",
      title: "العنوان",
      render: (branch: Branch) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{branch.address}</span>
        </div>
      ),
    },
    {
      key: "coordinates",
      title: "الإحداثيات",
      render: (branch: Branch) => (
        <span className="text-sm text-muted-foreground">
          {branch.latitude !== null && branch.longitude !== null
            ? `${branch.latitude.toFixed(5)}, ${branch.longitude.toFixed(5)}`
            : "—"}
        </span>
      ),
    },
    {
      key: "working_hours",
      title: "ساعات العمل",
      render: (branch: Branch) => renderWorkingHours(branch.working_hours),
    },
    {
      key: "actions",
      title: "الإجراءات",
      render: (branch: Branch) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-gold-600"
            onClick={(e) => {
              e.stopPropagation();
              openEditBranch(branch);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteBranchTarget(branch);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const productColumns = [
    {
      key: "name",
      title: "المنتج",
      render: (product: Product) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-ink-900">{product.name}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {product.description}
          </span>
        </div>
      ),
    },
    {
      key: "price",
      title: "السعر",
      render: (product: Product) => (
        <span className="font-medium text-gold-700">
          {formatCurrency(product.price)}
        </span>
      ),
    },
    {
      key: "availability",
      title: "التوفر",
      render: (product: Product) => (
        <Badge
          variant="outline"
          className={
            product.availability
              ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
              : "bg-red-100 text-red-800 border-red-200 hover:bg-red-100"
          }
        >
          {product.availability ? "متاح" : "غير متاح"}
        </Badge>
      ),
    },
    {
      key: "actions",
      title: "الإجراءات",
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-gold-600"
            onClick={(e) => {
              e.stopPropagation();
              openEditProduct(product);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteProductTarget(product);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const offerColumns = [
    {
      key: "title",
      title: "العنوان",
      render: (offer: Offer) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-ink-900">{offer.title}</span>
          <Badge
            variant="secondary"
            className="w-fit text-xs bg-gold-100 text-gold-700 border-gold-200"
          >
            <Percent className="h-3 w-3 ms-1" />
            {offer.discount_percentage}% خصم
          </Badge>
        </div>
      ),
    },
    {
      key: "discount_percentage",
      title: "النسبة",
      render: (offer: Offer) => (
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gold-500"
              style={{ width: `${offer.discount_percentage}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gold-700">
            {offer.discount_percentage}%
          </span>
        </div>
      ),
    },
    {
      key: "period",
      title: "الفترة",
      render: (offer: Offer) => (
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          <span>{formatDate(offer.start_date)}</span>
          <span>إلى {formatDate(offer.end_date)}</span>
        </div>
      ),
    },
    {
      key: "status",
      title: "الحالة",
      render: (offer: Offer) => <StatusBadge status={offer.status} />,
    },
    {
      key: "actions",
      title: "الإجراءات",
      render: (offer: Offer) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-gold-600"
            onClick={(e) => {
              e.stopPropagation();
              openEditOffer(offer);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteOfferTarget(offer);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const eventColumns = [
    {
      key: "title",
      title: "العنوان",
      render: (event: CafeEvent) => (
        <span className="font-medium text-ink-900">{event.title}</span>
      ),
    },
    {
      key: "event_date",
      title: "التاريخ",
      render: (event: CafeEvent) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>{formatDate(event.event_date)}</span>
        </div>
      ),
    },
    {
      key: "location",
      title: "الموقع",
      render: (event: CafeEvent) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-gold-500" />
          <span>{event.location}</span>
        </div>
      ),
    },
    {
      key: "status",
      title: "الحالة",
      render: (event: CafeEvent) => <StatusBadge status={event.status} />,
    },
    {
      key: "actions",
      title: "الإجراءات",
      render: (event: CafeEvent) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-gold-600"
            onClick={(e) => {
              e.stopPropagation();
              openEditEvent(event);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteEventTarget(event);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="تفاصيل المقهى" backHref="/cafes" />
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !cafe) {
    return (
      <div className="space-y-6">
        <PageHeader title="تفاصيل المقهى" backHref="/cafes" />
        <ErrorState
          message="فشل في تحميل بيانات المقهى"
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={cafe.name}
        backHref="/cafes"
        action={
          <div className="flex items-center gap-2">
            {cafe.registration_status === "PENDING" && (
              <>
                <Button
                  onClick={() => setApproveDialogOpen(true)}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4" />
                  اعتماد
                </Button>
                <Button
                  onClick={() => setRejectDialogOpen(true)}
                  variant="destructive"
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  رفض
                </Button>
              </>
            )}
          </div>
        }
      />

      <Card className="bg-white shadow-sm rounded-xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100 shrink-0">
                <Store className="h-5 w-5 text-gold-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">اسم المقهى</p>
                <p className="font-semibold text-ink-900">{cafe.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100 shrink-0">
                <FileText className="h-5 w-5 text-gold-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الوصف</p>
                <p className="text-sm text-ink-900">{cafe.description || "لا يوجد وصف"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100 shrink-0">
                <MapPin className="h-5 w-5 text-gold-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">العنوان</p>
                <p className="text-sm text-ink-900">{cafe.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100 shrink-0">
                <User className="h-5 w-5 text-gold-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المالك</p>
                <p className="text-sm text-ink-900">{cafe.owner?.full_name || "—"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100 shrink-0">
                <CheckCircle className="h-5 w-5 text-gold-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">حالة التسجيل</p>
                <div className="mt-1">
                  <StatusBadge status={cafe.registration_status} />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100 shrink-0">
                <Hash className="h-5 w-5 text-gold-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الإحداثيات</p>
                <p className="text-sm text-ink-900">
                  {cafe.latitude && cafe.longitude
                    ? `${cafe.latitude}, ${cafe.longitude}`
                    : "غير محدد"}
                </p>
              </div>
            </div>

            {cafe.working_hours && Object.keys(cafe.working_hours).length > 0 && (
              <div className="md:col-span-2 lg:col-span-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100 shrink-0">
                    <Clock className="h-5 w-5 text-gold-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">ساعات العمل</p>
                    {renderWorkingHours(cafe.working_hours)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border rounded-xl p-1 h-auto flex-wrap">
          <TabsTrigger value="branches" className="gap-2">
            <Building2 className="h-4 w-4" />
            الفروع
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Tag className="h-4 w-4" />
            المنتجات
          </TabsTrigger>
          <TabsTrigger value="offers" className="gap-2">
            <Percent className="h-4 w-4" />
            العروض
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="h-4 w-4" />
            الفعاليات
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="h-4 w-4" />
            الاشتراك
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branches" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={openCreateBranch}
              className="gap-2 bg-gold-500 hover:bg-gold-600 text-white"
            >
              <Plus className="h-4 w-4" />
              إضافة فرع
            </Button>
          </div>
          <DataTable
            columns={branchColumns}
            data={cafe.branches || []}
            keyExtractor={(branch) => branch.id}
            emptyMessage="لا توجد فروع مسجلة"
          />
        </TabsContent>

        <TabsContent value="products" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={openCreateProduct}
              className="gap-2 bg-gold-500 hover:bg-gold-600 text-white"
            >
              <Plus className="h-4 w-4" />
              إضافة منتج
            </Button>
          </div>
          <DataTable
            columns={productColumns}
            data={cafe.products || []}
            keyExtractor={(product) => product.id}
            emptyMessage="لا توجد منتجات"
          />
        </TabsContent>

        <TabsContent value="offers" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={openCreateOffer}
              className="gap-2 bg-gold-500 hover:bg-gold-600 text-white"
            >
              <Plus className="h-4 w-4" />
              إضافة عرض
            </Button>
          </div>
          <DataTable
            columns={offerColumns}
            data={cafe.offers || []}
            keyExtractor={(offer) => offer.id}
            emptyMessage="لا توجد عروض"
          />
        </TabsContent>

        <TabsContent value="events" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={openCreateEvent}
              className="gap-2 bg-gold-500 hover:bg-gold-600 text-white"
            >
              <Plus className="h-4 w-4" />
              إضافة فعالية
            </Button>
          </div>
          <DataTable
            columns={eventColumns}
            data={cafe.events || []}
            keyExtractor={(event) => event.id}
            emptyMessage="لا توجد فعاليات"
          />
        </TabsContent>

        <TabsContent value="subscription" className="mt-4">
          {cafe.subscription ? (
            <Card className="bg-white shadow-sm rounded-xl">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100 shrink-0">
                      <CreditCard className="h-5 w-5 text-gold-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">الخطة</p>
                      <p className="font-semibold text-ink-900">
                        {cafe.subscription.plan?.name || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100 shrink-0">
                      <CheckCircle className="h-5 w-5 text-gold-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">الحالة</p>
                      <div className="mt-1">
                        <StatusBadge status={cafe.subscription.status} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100 shrink-0">
                      <CalendarDays className="h-5 w-5 text-gold-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">تاريخ البداية</p>
                      <p className="text-sm text-ink-900">
                        {cafe.subscription.starts_at
                          ? formatDate(cafe.subscription.starts_at)
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100 shrink-0">
                      <CalendarDays className="h-5 w-5 text-gold-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                      <p className="text-sm text-ink-900">
                        {cafe.subscription.expires_at
                          ? formatDate(cafe.subscription.expires_at)
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold-100 shrink-0">
                      <CreditCard className="h-5 w-5 text-gold-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">المستخدم</p>
                      <p className="text-sm text-ink-900 font-mono">
                        {cafe.subscription.user_id?.slice(0, 8) || cafe.owner_id?.slice(0, 8) || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={<CreditCard className="h-8 w-8 text-muted-foreground" />}
              title="لا يوجد اشتراك"
              description="اشتراكات أصحاب المقاهي تُدار عبر الدفع بـ Moyasar من تطبيق الموبايل"
            />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>اعتماد المقهى</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من اعتماد مقهى "{cafe.name}"؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={approveCafe.isPending}
              onClick={handleApprove}
            >
              {approveCafe.isPending ? "جاري المعالجة..." : "اعتماد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>رفض المقهى</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رفض مقهى "{cafe.name}"؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={rejectCafe.isPending}
              onClick={handleReject}
            >
              {rejectCafe.isPending ? "جاري المعالجة..." : "رفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "قم بتعديل بيانات المنتج أدناه"
                : "أدخل بيانات المنتج الجديد"}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={productForm.handleSubmit(onSubmitProduct)}
            className="space-y-4"
          >
            <FormField
              label="اسم المنتج"
              required
              error={productForm.formState.errors.name?.message}
            >
              <Input placeholder="اسم المنتج" {...productForm.register("name")} />
            </FormField>

            <FormField
              label="الوصف"
              required
              error={productForm.formState.errors.description?.message}
            >
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="وصف المنتج"
                {...productForm.register("description")}
              />
            </FormField>

            <FormField
              label="السعر"
              required
              error={productForm.formState.errors.price?.message}
            >
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                {...productForm.register("price", { valueAsNumber: true })}
              />
            </FormField>

            <FormField label="التوفر" description="فعّل أوعطّل توفر المنتج">
              <button
                type="button"
                onClick={() =>
                  productForm.setValue("availability", !watchedAvailability)
                }
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors border
                  ${
                    watchedAvailability
                      ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                      : "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                  }
                `}
              >
                {watchedAvailability ? "متاح" : "غير متاح"}
              </button>
            </FormField>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setProductDialogOpen(false);
                  setEditingProduct(null);
                  productForm.reset();
                }}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="bg-gold-500 hover:bg-gold-600 text-white"
                disabled={createProduct.isPending || updateProduct.isPending}
              >
                {createProduct.isPending || updateProduct.isPending
                  ? "جاري الحفظ..."
                  : editingProduct
                    ? "تحديث"
                    : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingOffer ? "تعديل العرض" : "إضافة عرض جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingOffer
                ? "قم بتعديل بيانات العرض أدناه"
                : "أدخل بيانات العرض الجديد"}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={offerForm.handleSubmit(onSubmitOffer)}
            className="space-y-4"
          >
            <FormField
              label="العنوان"
              required
              error={offerForm.formState.errors.title?.message}
            >
              <Input placeholder="عنوان العرض" {...offerForm.register("title")} />
            </FormField>

            <FormField
              label="الوصف"
              required
              error={offerForm.formState.errors.description?.message}
            >
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="وصف العرض"
                {...offerForm.register("description")}
              />
            </FormField>

            <FormField
              label="نسبة الخصم (%)"
              required
              error={offerForm.formState.errors.discount_percentage?.message}
            >
              <Input
                type="number"
                min={1}
                max={100}
                placeholder="مثال: 25"
                {...offerForm.register("discount_percentage", {
                  valueAsNumber: true,
                })}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="تاريخ البداية"
                required
                error={offerForm.formState.errors.start_date?.message}
              >
                <Input type="date" {...offerForm.register("start_date")} />
              </FormField>

              <FormField
                label="تاريخ النهاية"
                required
                error={offerForm.formState.errors.end_date?.message}
              >
                <Input type="date" {...offerForm.register("end_date")} />
              </FormField>
            </div>

            <FormField
              label="الحالة"
              required
              error={offerForm.formState.errors.status?.message}
            >
              <Select
                value={watchedOfferStatus}
                onValueChange={(val) =>
                  offerForm.setValue("status", val as "DRAFT" | "ACTIVE")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">مسودة</SelectItem>
                  <SelectItem value="ACTIVE">نشط</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOfferDialogOpen(false);
                  setEditingOffer(null);
                  offerForm.reset();
                }}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="bg-gold-500 hover:bg-gold-600 text-white"
                disabled={createOffer.isPending || updateOffer.isPending}
              >
                {createOffer.isPending || updateOffer.isPending
                  ? "جاري الحفظ..."
                  : editingOffer
                    ? "تحديث"
                    : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingEvent ? "تعديل الفعالية" : "إضافة فعالية جديدة"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent
                ? "قم بتعديل بيانات الفعالية أدناه"
                : "أدخل بيانات الفعالية الجديدة"}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={eventForm.handleSubmit(onSubmitEvent)}
            className="space-y-4"
          >
            <FormField
              label="العنوان"
              required
              error={eventForm.formState.errors.title?.message}
            >
              <Input
                placeholder="عنوان الفعالية"
                {...eventForm.register("title")}
              />
            </FormField>

            <FormField
              label="الوصف"
              required
              error={eventForm.formState.errors.description?.message}
            >
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="وصف الفعالية"
                {...eventForm.register("description")}
              />
            </FormField>

            <FormField
              label="الموقع"
              required
              error={eventForm.formState.errors.location?.message}
            >
              <Input
                placeholder="مكان الفعالية"
                {...eventForm.register("location")}
              />
            </FormField>

            <FormField
              label="التاريخ والوقت"
              required
              error={eventForm.formState.errors.event_date?.message}
            >
              <Input
                type="datetime-local"
                {...eventForm.register("event_date")}
              />
            </FormField>

            <FormField
              label="الحالة"
              required
              error={eventForm.formState.errors.status?.message}
            >
              <Select
                value={watchedEventStatus}
                onValueChange={(val) =>
                  eventForm.setValue("status", val as "DRAFT" | "PUBLISHED")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">مسودة</SelectItem>
                  <SelectItem value="PUBLISHED">منشور</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEventDialogOpen(false);
                  setEditingEvent(null);
                  eventForm.reset();
                }}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="bg-gold-500 hover:bg-gold-600 text-white"
                disabled={createEvent.isPending || updateEvent.isPending}
              >
                {createEvent.isPending || updateEvent.isPending
                  ? "جاري الحفظ..."
                  : editingEvent
                    ? "تحديث"
                    : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingBranch ? "تعديل الفرع" : "إضافة فرع جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingBranch
                ? "قم بتعديل بيانات الفرع أدناه"
                : "أدخل بيانات الفرع الجديد"}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={branchForm.handleSubmit(onSubmitBranch)}
            className="space-y-4"
          >
            <FormField
              label="اسم الفرع"
              required
              error={branchForm.formState.errors.name?.message}
            >
              <Input
                placeholder="مثال: الفرع الرئيسي"
                {...branchForm.register("name")}
              />
            </FormField>

            <FormField
              label="الموقع على الخريطة"
              required
              error={branchLocationError}
              description="ابحث عن عنوان الفرع واختره من قائمة الاقتراحات"
            >
              <LocationPicker
                value={branchLocation}
                onChange={(loc) => {
                  setBranchLocation(loc);
                  if (loc.address) setBranchLocationError(undefined);
                }}
                placeholder="ابحث عن عنوان الفرع..."
              />
            </FormField>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBranchDialogOpen(false);
                  setEditingBranch(null);
                  branchForm.reset();
                  setBranchLocation(emptyLocation);
                }}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="bg-gold-500 hover:bg-gold-600 text-white"
                disabled={createBranch.isPending || updateBranch.isPending}
              >
                {createBranch.isPending || updateBranch.isPending
                  ? "جاري الحفظ..."
                  : editingBranch
                    ? "تحديث"
                    : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteProductTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteProductTarget(null);
        }}
        title="حذف المنتج"
        description={`هل أنت متأكد من حذف المنتج "${deleteProductTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={handleDeleteProduct}
        isLoading={deleteProduct.isPending}
      />

      <ConfirmDialog
        open={!!deleteOfferTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteOfferTarget(null);
        }}
        title="حذف العرض"
        description={`هل أنت متأكد من حذف العرض "${deleteOfferTarget?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={handleDeleteOffer}
        isLoading={deleteOffer.isPending}
      />

      <ConfirmDialog
        open={!!deleteEventTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteEventTarget(null);
        }}
        title="حذف الفعالية"
        description={`هل أنت متأكد من حذف الفعالية "${deleteEventTarget?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={handleDeleteEvent}
        isLoading={deleteEvent.isPending}
      />

      <ConfirmDialog
        open={!!deleteBranchTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteBranchTarget(null);
        }}
        title="حذف الفرع"
        description={`هل أنت متأكد من حذف الفرع "${deleteBranchTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={handleDeleteBranch}
        isLoading={deleteBranch.isPending}
      />
    </div>
  );
}
