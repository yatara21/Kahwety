import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Bell, Send } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormField } from "@/components/FormField";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  useNotifications,
  useCreateNotification,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { formatDateTime } from "@/lib/utils";
import type { Notification } from "@/types";

const notificationSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  message: z.string().min(1, "الرسالة مطلوبة"),
  target_type: z.enum(["ALL", "CUSTOMER", "CAFE_OWNER", "USER"], {
    required_error: "الشريحة المستهدفة مطلوبة",
  }),
  target_id: z.string().optional(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

const targetTypeLabels: Record<string, string> = {
  ALL: "الجميع",
  CUSTOMER: "عميل",
  CAFE_OWNER: "صاحب مقهى",
  USER: "مستخدم",
};

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);
  const pageSize = 10;

  const { data, isLoading, error, refetch } = useNotifications({
    page,
    page_size: pageSize,
  });

  const createMutation = useCreateNotification();
  const deleteMutation = useDeleteNotification();

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 0;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: "",
      message: "",
      target_type: "ALL",
      target_id: "",
    },
  });

  const watchedTargetType = watch("target_type");

  const openCreateDialog = () => {
    reset({
      title: "",
      message: "",
      target_type: "ALL",
      target_id: "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (formData: NotificationFormData) => {
    const payload = {
      ...formData,
      target_id: formData.target_id || undefined,
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        setDialogOpen(false);
        reset();
      },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const columns = [
    {
      key: "title",
      title: "العنوان",
      render: (notification: Notification) => (
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gold-500 shrink-0" />
          <span className="font-medium text-ink-900">
            {notification.title}
          </span>
        </div>
      ),
    },
    {
      key: "message",
      title: "الرسالة",
      render: (notification: Notification) => (
        <span className="text-sm text-muted-foreground line-clamp-2 max-w-xs block">
          {notification.message}
        </span>
      ),
    },
    {
      key: "target_type",
      title: "الشريحة",
      render: (notification: Notification) => (
        <span className="inline-flex items-center rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-medium text-gold-700 border border-gold-200">
          {targetTypeLabels[notification.target_type] ??
            notification.target_type}
        </span>
      ),
    },
    {
      key: "created_at",
      title: "التاريخ",
      render: (notification: Notification) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(notification.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      title: "الإجراءات",
      render: (notification: Notification) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(notification);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="الإشعارات" subtitle="إدارة إشعارات النظام" />
        <ErrorState message="فشل في تحميل الإشعارات" onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإشعارات"
        subtitle="إدارة إشعارات النظام"
        action={
          <Button
            onClick={openCreateDialog}
            className="bg-gold-500 hover:bg-gold-600 text-white"
          >
            <Send className="h-4 w-4 ms-2" />
            إرسال إشعار
          </Button>
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={items}
            keyExtractor={(item) => item.id}
            emptyMessage="لا توجد إشعارات"
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              إرسال إشعار جديد
            </DialogTitle>
            <DialogDescription>
              أدخل بيانات الإشعار الجديد
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              label="العنوان"
              required
              error={errors.title?.message}
            >
              <Input placeholder="عنوان الإشعار" {...register("title")} />
            </FormField>

            <FormField
              label="الرسالة"
              required
              error={errors.message?.message}
            >
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="نص الإشعار"
                {...register("message")}
              />
            </FormField>

            <FormField
              label="الشريحة المستهدفة"
              required
              error={errors.target_type?.message}
            >
              <Select
                value={watchedTargetType}
                onValueChange={(val) =>
                  setValue("target_type", val as NotificationFormData["target_type"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشريحة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">الجميع</SelectItem>
                  <SelectItem value="CUSTOMER">عميل</SelectItem>
                  <SelectItem value="CAFE_OWNER">صاحب مقهى</SelectItem>
                  <SelectItem value="USER">مستخدم</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {watchedTargetType !== "ALL" && (
              <FormField
                label="المعرّف المستهدف"
                error={errors.target_id?.message}
              >
                <Input
                  placeholder="أدخل المعرّف"
                  {...register("target_id")}
                />
              </FormField>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  reset();
                }}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="bg-gold-500 hover:bg-gold-600 text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "جاري الإرسال..." : "إرسال"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="حذف الإشعار"
        description={`هل أنت متأكد من حذف الإشعار "${deleteTarget?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
