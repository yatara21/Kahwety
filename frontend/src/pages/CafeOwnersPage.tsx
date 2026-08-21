import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Coffee,
  Store,
  UserCheck,
  Eye,
  Plus,
  Ban,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useUsers, useUpdateUser } from "@/hooks/useUsers";
import { useCafes } from "@/hooks/useCafes";
import { formatDate } from "@/lib/utils";
import type { User as UserType } from "@/types";

export default function CafeOwnersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("page_size") || "10");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const params = {
    page,
    page_size: pageSize,
    role: "CAFE_OWNER",
    ...(search && { search }),
    ...(status && { status }),
  };

  const { data, isLoading } = useUsers(params);
  const updateUser = useUpdateUser();

  const owners = data?.items || [];
  const totalOwners = data?.total || 0;

  const activeCount = owners.filter((u) => u.status === "ACTIVE").length;
  const inactiveCount = owners.filter((u) => u.status === "INACTIVE").length;
  const suspendedCount = owners.filter((u) => u.status === "SUSPENDED").length;

  const cafeCountParams = { page_size: 1000 };
  const { data: cafeData } = useCafes(cafeCountParams);
  const allCafes = cafeData?.items || [];

  const getCafeCountForOwner = (ownerId: string): number => {
    return allCafes.filter((cafe) => cafe.owner_id === ownerId).length;
  };

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
      updateParam("status", value === "ALL" ? "" : value);
    },
    [updateParam]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateParam("page", String(newPage));
    },
    [updateParam]
  );

  const handleViewCafes = (ownerId: string) => {
    navigate(`/cafes?owner=${ownerId}`);
  };

  const handleToggleBlock = (user: UserType) => {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    updateUser.mutate(
      { id: user.id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["users"] });
        },
      }
    );
  };

  const columns = [
    {
      key: "full_name",
      title: "المستخدم",
      render: (user: UserType) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-sm">
              {user.full_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-ink-900 truncate">
              {user.full_name}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {user.email || "-"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      title: "الحالة",
      render: (user: UserType) => <StatusBadge status={user.status} />,
    },
    {
      key: "cafe_count",
      title: "عدد المقاهي",
      render: (user: UserType) => (
        <span className="text-sm font-medium text-ink-900">
          {getCafeCountForOwner(user.id)}
        </span>
      ),
    },
    {
      key: "created_at",
      title: "تاريخ التسجيل",
      render: (user: UserType) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(user.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      title: "الإجراءات",
      render: (user: UserType) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="عرض المقاهي"
            onClick={(e) => {
              e.stopPropagation();
              handleViewCafes(user.id);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${user.status === "ACTIVE" ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}`}
            title={user.status === "ACTIVE" ? "حظر" : "تفعيل"}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleBlock(user);
            }}
          >
            {user.status === "ACTIVE" ? (
              <Ban className="h-4 w-4" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="أصحاب المقاهي"
        subtitle="إدارة حسابات أصحاب المقاهي"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي أصحاب المقاهي"
          value={totalOwners}
          icon={<Store className="h-6 w-6" />}
          color="gold"
        />
        <StatCard
          title="نشط"
          value={activeCount}
          icon={<UserCheck className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="غير نشط"
          value={inactiveCount}
          icon={<Coffee className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="معلّق"
          value={suspendedCount}
          icon={<Ban className="h-6 w-6" />}
          color="red"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="بحث بالاسم أو البريد..."
          className="sm:w-72"
        />
        <Select value={status || "ALL"} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="جميع الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">جميع الحالات</SelectItem>
            <SelectItem value="ACTIVE">نشط</SelectItem>
            <SelectItem value="INACTIVE">غير نشط</SelectItem>
            <SelectItem value="SUSPENDED">معلّق</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={owners}
        isLoading={isLoading}
        keyExtractor={(user) => user.id}
        onRowClick={(user) => handleViewCafes(user.id)}
        emptyMessage="لا يوجد أصحاب مقاهي"
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
    </div>
  );
}
