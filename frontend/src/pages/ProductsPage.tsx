import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Pencil, Trash2, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";

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
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/useProducts";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const productSchema = z.object({
  name: z.string().min(1, "اسم المنتج بالعربية مطلوب"),
  name_en: z.string().optional().default(""),
  image: z.any().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const pageSize = 10;
  const queryClient = useQueryClient();

  const { data, isLoading } = useProducts({
    page,
    page_size: pageSize,
    search: search || undefined,
  });

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", name_en: "", image: null },
  });

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  const openCreateDialog = () => {
    setEditingProduct(null);
    setImagePreview(null);
    reset({ name: "", name_en: "", image: null });
    setDialogOpen(true);
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setImagePreview(product.image_url || product.image || null);
    reset({
      name: product.name,
      name_en: product.name_en || "",
      image: null,
    });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setImagePreview(null);
    reset();
  };

  const onSubmit = (formData: ProductFormData) => {
    const payload: any = {
      name: formData.name,
      name_en: formData.name_en || "",
      price: editingProduct?.price || 1,
      cafe_id: editingProduct?.cafe_id || "",
      availability: editingProduct?.availability ?? true,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload }, {
        onSuccess: () => handleDialogClose(),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => handleDialogClose(),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        queryClient.invalidateQueries({ queryKey: ["products"] });
      },
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#2f2d29]">المنتجات والخدمات</h2>
        <Button onClick={openCreateDialog} className="bg-[#c8a44e] hover:bg-[#b8943e] text-white">
          منتج جديد +
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#e8dcc8]/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8dcc8]/50 bg-[#f9f6ef]/50">
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">#</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">اسم المنتج باللغة العربية</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">اسم المنتج باللغة الإنجليزية</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">الصورة</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#8a7a5c]">حذف</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#e8dcc8]/30">
                    <td className="px-4 py-3"><div className="h-4 w-8 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-32 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-28 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[#8a7a5c]">
                    لا توجد منتجات
                  </td>
                </tr>
              ) : (
                items.map((product, index) => (
                  <tr key={product.id} className="border-b border-[#e8dcc8]/30 hover:bg-[#f9f6ef]/30">
                    <td className="px-4 py-3 text-sm text-[#2f2d29]">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#2f2d29]">{product.name}</td>
                    <td className="px-4 py-3 text-sm text-[#2f2d29]">{product.name_en || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[#c8a44e]">
                      {product.image_url || product.image || "Espresso.png"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditDialog(product)}
                          className="p-1.5 rounded-lg text-[#8a7a5c] hover:bg-[#f0e8d0] transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="p-1.5 rounded-lg text-[#8a7a5c] hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e8dcc8]/50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8a7a5c]">الصفحة/{pageSize}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#e0d5b8] text-sm disabled:opacity-50 hover:bg-[#f9f6ef]"
              >
                &gt;
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    page === num ? "bg-[#c8a44e] text-white" : "border border-[#e0d5b8] hover:bg-[#f9f6ef]"
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-[#e0d5b8] text-sm disabled:opacity-50 hover:bg-[#f9f6ef]"
              >
                &lt;
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2f2d29]">
              {editingProduct ? "تعديل المنتج" : "منتج جديد"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">اسم المنتج باللغة العربية</Label>
              <Input {...register("name")} placeholder="اسم المنتج" className="border-[#e0d5b8]" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">اسم المنتج باللغة الإنجليزية</Label>
              <Input {...register("name_en")} placeholder="Product name" className="border-[#e0d5b8]" dir="ltr" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2f2d29]">صورة المنتج</Label>
              <div className="border-2 border-dashed border-[#e0d5b8] rounded-xl p-4 text-center hover:border-[#c8a44e] transition-colors cursor-pointer">
                <Upload className="h-6 w-6 mx-auto text-[#8a7a5c] mb-1" />
                <p className="text-sm text-[#8a7a5c]">اسحب صورة هنا أو انقر للتحميل</p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleDialogClose} className="border-[#e0d5b8]">
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#c8a44e] hover:bg-[#b8943e] text-white">
                {isSubmitting ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف المنتج"
        description={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
