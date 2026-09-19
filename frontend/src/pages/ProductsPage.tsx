import { useState, useRef } from "react";
import {
  Pencil,
  Trash2,
  Upload,
  Plus,
  Loader2,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  ImageIcon,
} from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/useProducts";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { uploadApi } from "@/api/upload";
import { getImageUrl } from "@/utils/imageUrl";
import { toast } from "@/hooks/use-toast";

const productSchema = z.object({
  name: z.string().min(1, "اسم المنتج بالعربية مطلوب"),
  name_en: z.string().optional().default(""),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useProducts({
    page,
    page_size: pageSize,
  });

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", name_en: "" },
  });

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const response = await uploadApi.upload(file);
      setImageUrl(response.url);
      toast({
        title: "تم بنجاح",
        description: "تم رفع صورة المنتج بنجاح",
      });
    } catch (error) {
      console.error("Upload failed", error);
      toast({
        title: "خطأ",
        description: "فشل رفع الصورة",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setImageUrl("");
    reset({ name: "", name_en: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setImageUrl(product.image_url || "");
    reset({
      name: product.name,
      name_en: product.name_en || "",
    });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setImageUrl("");
    reset();
  };

  const onSubmit = (formData: ProductFormData) => {
    const payload: any = {
      name: formData.name,
      name_en: formData.name_en || "",
      price: editingProduct?.price || 1,
      cafe_id: editingProduct?.cafe_id || "",
      availability: editingProduct?.availability ?? true,
      image_url: imageUrl,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload }, {
        onSuccess: () => {
          handleDialogClose();
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast({
            title: "تم بنجاح",
            description: "تم تعديل المنتج بنجاح",
          });
        },
        onError: (err: any) => {
          toast({
            title: "خطأ",
            description: err?.response?.data?.message || "فشل تعديل المنتج",
            variant: "destructive",
          });
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          handleDialogClose();
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast({
            title: "تم بنجاح",
            description: "تمت إضافة المنتج بنجاح",
          });
        },
        onError: (err: any) => {
          toast({
            title: "خطأ",
            description: err?.response?.data?.message || "فشل إضافة المنتج",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        toast({
          title: "تم بنجاح",
          description: "تم حذف المنتج بنجاح",
        });
      },
      onError: (err: any) => {
        toast({
          title: "خطأ",
          description: err?.response?.data?.message || "فشل حذف المنتج",
          variant: "destructive",
        });
      },
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl" style={{ fontFamily: "Almarai, sans-serif" }}>
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F2D29]">المنتجات والخدمات</h1>
        <button
          onClick={openCreateDialog}
          className="px-6 py-2.5 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          + منتج جديد
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#EAE6DF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-[#F0ECE4] text-[#8A7A5C] text-sm font-semibold">
                <th className="py-4 px-6 w-16 text-center">#</th>
                <th className="py-4 px-6 text-center">اسم المنتج باللغة العربية</th>
                <th className="py-4 px-6 text-center">اسم المنتج باللغة الانجليزية</th>
                <th className="py-4 px-6 text-center">الصورة</th>
                <th className="py-4 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE4]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6 text-center"><div className="h-4 w-6 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-32 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-28 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-4 w-24 bg-gray-100 rounded mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-8 w-16 bg-gray-100 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[#8A7A5C] font-semibold text-sm">
                    لا توجد منتجات مسجلة حالياً
                  </td>
                </tr>
              ) : (
                items.map((product, index) => (
                  <tr key={product.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-[#2F2D29]">
                      {product.name || "إسبريسو"}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-[#2F2D29]">
                      {product.name_en || "Espresso"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: product.image_url ? getImageUrl(product.image_url) : "/resources/Asset 50 1.png",
                            title: product.name,
                          })
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#007AFF] hover:underline cursor-pointer px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <ImageIcon size={14} />
                        <span>{product.image_url ? "معاينة الصورة" : "لا توجد صورة"}</span>
                      </button>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditDialog(product)}
                          title="تعديل المنتج"
                          className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:border-[#BA9B65] text-[#8A7A5C] hover:text-[#BA9B65] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          title="حذف المنتج"
                          className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:border-red-500 text-[#8A7A5C] hover:text-red-600 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#F0ECE4] text-xs font-bold text-[#2F2D29]">
          <div className="flex items-center gap-2">
            <span className="text-[#8A7A5C]">الصفحة/</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="appearance-none bg-white border border-[#E5E0D8] rounded-lg px-3 py-1.5 pr-6 text-xs font-bold text-[#2F2D29] focus:outline-none cursor-pointer"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <ChevronDown size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8A7A5C] pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="w-8 h-8 rounded-lg border border-[#E5E0D8] flex items-center justify-center text-[#2F2D29] disabled:opacity-40 hover:bg-[#FAF8F5] cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>

            {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => {
              const pageNum = i + 1;
              const isSelected = page === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
                    isSelected
                      ? "border border-[#BA9B65] text-[#BA9B65] bg-white shadow-xs"
                      : "border border-[#E5E0D8] text-[#2F2D29] hover:bg-[#FAF8F5]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-8 h-8 rounded-lg border border-[#E5E0D8] flex items-center justify-center text-[#2F2D29] disabled:opacity-40 hover:bg-[#FAF8F5] cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Product Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-[#EAE6DF] shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#2F2D29] text-right mb-2">
              صورة المنتج: {previewImage?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 bg-[#FAF8F5] rounded-2xl border border-[#EAE6DF] min-h-[220px]">
            {previewImage?.url ? (
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-80 w-auto max-w-full rounded-xl object-contain shadow-xs"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/resources/Asset 50 1.png";
                }}
              />
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="w-12 h-12 text-[#BA9B65]/40 mx-auto mb-2" />
                <p className="text-xs font-bold text-[#8A7A5C]">لا توجد صورة مسجلة لهذا المنتج</p>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewImage(null)}
              className="border-[#E5E0D8] text-[#2F2D29] font-bold rounded-xl px-6 cursor-pointer"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="sm:max-w-md bg-white text-[#2F2D29] rounded-3xl p-6 border border-[#EAE6DF] shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-[#2F2D29] text-right mb-4">
              {editingProduct ? "تعديل المنتج" : "منتج جديد"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">اسم المنتج باللغة العربية</Label>
              <Input {...register("name")} placeholder="إسبريسو" className="h-11 rounded-xl border-[#E5E0D8] bg-white text-[#2F2D29] placeholder:text-[#8A7A5C]/70" required />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">اسم المنتج باللغه الانجليزية</Label>
              <Input {...register("name_en")} placeholder="Espresso" className="h-11 rounded-xl border-[#E5E0D8] bg-white text-[#2F2D29] placeholder:text-[#8A7A5C]/70" dir="ltr" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#2F2D29]">صورة المنتج</Label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E5E0D8] rounded-2xl p-4 text-center hover:border-[#BA9B65] transition-colors cursor-pointer bg-white"
              >
                {imageUrl ? (
                  <div className="space-y-2">
                    <img src={getImageUrl(imageUrl)} alt="Preview" className="h-20 w-auto rounded-lg mx-auto object-cover" />
                    <p className="text-xs text-[#8A7A5C] font-bold">اضغط لتغيير الصورة</p>
                  </div>
                ) : uploadingImage ? (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <LoaderCircle className="animate-spin text-[#BA9B65]" size={20} />
                    <span className="text-xs font-bold text-[#8A7A5C]">جاري رفع الصورة...</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-6 w-6 mx-auto text-[#BA9B65] mb-2" />
                    <p className="text-xs font-bold text-[#8A7A5C]">اضغط هنا لرفع الصورة</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 bg-[#BA9B65] hover:bg-[#A07C28] text-white font-bold rounded-xl shadow-xs"
              >
                {isSubmitting ? "جاري الحفظ..." : "حفظ"}
              </Button>
              <Button
                type="button"
                onClick={handleDialogClose}
                className="flex-1 h-11 bg-[#BA9B65]/15 hover:bg-[#BA9B65] text-[#7A5C28] hover:text-white border border-[#BA9B65] font-bold rounded-xl transition-all shadow-xs"
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
