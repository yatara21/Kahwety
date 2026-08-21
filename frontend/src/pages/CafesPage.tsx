import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Coffee,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Plus,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useCafes,
  useApproveCafe,
  useRejectCafe,
} from "@/hooks/useCafes";
import { formatDate } from "@/lib/utils";
import type { Cafe } from "@/types";

export default function CafesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    cafeId: string;
    cafeName: string;
  } | null>(null);

  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("page_size") || "10");
  const search = searchParams.get("search") || "";
  const registrationStatus = searchParams.get("registration_status") || "";

  const params = {
    page,
    page_size: pageSize,
    ...(search && { search }),
    ...(registrationStatus && { registration_status: registrationStatus }),
  };

  const { data, isLoading } = useCafes(params);
  const approveCafe = useApproveCafe();
  const rejectCafe = useRejectCafe();

  const cafes = data?.items || [];
  const totalCafes = data?.total || 0;

  const pendingCount = cafes.filter(
    (c) => c.registration_status === "PENDING"
  ).length;
  const approvedCount = cafes.filter(
    (c) => c.registration_status === "APPROVED"
  ).length;
  const rejectedCount = cafes.filter(
    (c) => c.registration_status === "REJECTED"
  ).length;

  const updateParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        if (key !== "page") {
          next.set("page", "1");
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const handleSearch = useCallback(
    (value: string) => {
      updateParam("search", value);
    },
    [updateParam]
  );

  const handleStatusFilter = useCallback(
    (value: string) => {
      updateParam("registration_status", value === "ALL" ? "" : value);
    },
    [updateParam]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateParam("page", String(newPage));
    },
    [updateParam]
  );

  const openApproveConfirm = (cafe: Cafe) => {
    setConfirmAction({
      type: "approve",
      cafeId: cafe.id,
      cafeName: cafe.name,
    });
    setConfirmDialogOpen(true);
  };

  const openRejectConfirm = (cafe: Cafe) => {
    setConfirmAction({
      type: "reject",
      cafeId: cafe.id,
      cafeName: cafe.name,
    });
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "approve") {
      approveCafe.mutate(confirmAction.cafeId, {
        onSuccess: () => {
          setConfirmDialogOpen(false);
          setConfirmAction(null);
        },
      });
    } else {
      rejectCafe.mutate(confirmAction.cafeId, {
        onSuccess: () => {
          setConfirmDialogOpen(false);
          setConfirmAction(null);
        },
      });
    }
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
    setConfirmAction(null);
  };

  const columns = [
    {
      key: "name",
      title: "اسم المقهى",
      render: (cafe: Cafe) => (
        <div className="min-w-0">
          <p className="font-medium text-ink-900 truncate">{cafe.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground truncate">
              {cafe.address}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "owner",
      title: "المالك",
      render: (cafe: Cafe) => (
        <span className="text-sm text-ink-900">
          {cafe.owner?.full_name || "-"}
        </span>
      ),
    },
    {
      key: "registration_status",
      title: "الحالة",
      render: (cafe: Cafe) => (
        <StatusBadge status={cafe.registration_status} />
      ),
    },
    {
      key: "created_at",
      title: "تاريخ التسجيل",
      render: (cafe: Cafe) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(cafe.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      title: "الإجراءات",
      render: (cafe: Cafe) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="عرض التفاصيل"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/cafes/${cafe.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {cafe.registration_status === "PENDING" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700"
                title="اعتماد"
                onClick={(e) => {
                  e.stopPropagation();
                  openApproveConfirm(cafe);
                }}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700"
                title="رفض"
                onClick={(e) => {
                  e.stopPropagation();
                  openRejectConfirm(cafe);
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const isProcessing =
    confirmAction?.type === "approve"
      ? approveCafe.isPending
      : confirmAction?.type === "reject"
        ? rejectCafe.isPending
        : false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="المقاهي"
        subtitle="إدارة المقاهي المسجلة"
        action={
          <Button
            onClick={() => navigate("/cafes/new")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة مقهى
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المقاهي"
          value={totalCafes}
          icon={<Coffee className="h-6 w-6" />}
          color="gold"
        />
        <StatCard
          title="معلق"
          value={pendingCount}
          icon={<Clock className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="معتمد"
          value={approvedCount}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="مرفوض"
          value={rejectedCount}
          icon={<XCircle className="h-6 w-6" />}
          color="red"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="بحث بالاسم أو العنوان..."
          className="sm:w-72"
        />
        <Select
          value={registrationStatus || "ALL"}
          onValueChange={handleStatusFilter}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="جميع الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">الكل</SelectItem>
            <SelectItem value="PENDING">معلق</SelectItem>
            <SelectItem value="APPROVED">معتمد</SelectItem>
            <SelectItem value="REJECTED">مرفوض</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={cafes}
        isLoading={isLoading}
        keyExtractor={(cafe) => cafe.id}
        onRowClick={(cafe) => navigate(`/cafes/${cafe.id}`)}
        emptyMessage="لا توجد مقاهي"
      />

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            عرض {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, data.total)} من {data.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              السابق
            </Button>
            {Array.from({ length: data.total_pages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === data.total_pages ||
                  Math.abs(p - page) <= 1
              )
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (
                  idx > 0 &&
                  typeof arr[idx - 1] === "number" &&
                  p - (arr[idx - 1] as number) > 1
                ) {
                  acc.push("...");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                typeof p === "string" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </Button>
                )
              )}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.total_pages}
              onClick={() => handlePageChange(page + 1)}
            >
              التالي
            </Button>
          </div>
        </div>
      )}

      <Dialog open={confirmDialogOpen} onOpenChange={(open) => !open && handleConfirmDialogClose()}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "approve"
                ? "اعتماد المقهى"
                : "رفض المقهى"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "approve"
                ? `هل أنت متأكد من اعتماد مقهى "${confirmAction?.cafeName}"؟`
                : `هل أنت متأكد من رفض مقهى "${confirmAction?.cafeName}"؟`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleConfirmDialogClose}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant={
                confirmAction?.type === "approve" ? "default" : "destructive"
              }
              disabled={isProcessing}
              onClick={handleConfirmAction}
            >
              {isProcessing
                ? "جاري المعالجة..."
                : confirmAction?.type === "approve"
                  ? "اعتماد"
                  : "رفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
