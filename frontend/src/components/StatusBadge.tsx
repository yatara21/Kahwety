import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED"
  | "RESOLVED"
  | "IN_PROGRESS"
  | "DRAFT"
  | "PUBLISHED"
  | "COMPLETED"
  | "DISABLED";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusLabels: Record<string, string> = {
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
  SUSPENDED: "معلّق",
  PENDING: "قيد الانتظار",
  APPROVED: "موافق عليه",
  REJECTED: "مرفوض",
  EXPIRED: "منتهي الصلاحية",
  CANCELLED: "ملغي",
  RESOLVED: "محلول",
  IN_PROGRESS: "قيد التنفيذ",
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  COMPLETED: "مكتمل",
  DISABLED: "معطّل",
};

const greenStatuses = ["ACTIVE", "APPROVED", "RESOLVED", "PUBLISHED", "COMPLETED"];
const yellowStatuses = ["PENDING", "IN_PROGRESS", "DRAFT"];
const redStatuses = ["INACTIVE", "SUSPENDED", "CANCELLED", "EXPIRED", "REJECTED", "DISABLED"];

function getStatusStyles(status: string): string {
  if (greenStatuses.includes(status)) {
    return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100";
  }
  if (yellowStatuses.includes(status)) {
    return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100";
  }
  if (redStatuses.includes(status)) {
    return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100";
  }
  return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100";
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = statusLabels[status] ?? status;

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full", getStatusStyles(status), className)}
    >
      {label}
    </Badge>
  );
}
