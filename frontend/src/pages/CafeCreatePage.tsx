import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, MapPin } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { FormField } from "@/components/FormField";
import {
  LocationPicker,
  emptyLocation,
  type LocationValue,
} from "@/components/LocationPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreateCafe } from "@/hooks/useCafes";

const cafeSchema = z.object({
  name: z.string().min(1, "اسم المقهى مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
});

type CafeFormData = z.infer<typeof cafeSchema>;

export default function CafeCreatePage() {
  const navigate = useNavigate();
  const createCafe = useCreateCafe();
  const [location, setLocation] = useState<LocationValue>(emptyLocation);
  const [locationError, setLocationError] = useState<string | undefined>();

  const form = useForm<CafeFormData>({
    resolver: zodResolver(cafeSchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = (formData: CafeFormData) => {
    if (!location.address) {
      setLocationError("يرجى اختيار موقع المقهى من الخريطة");
      return;
    }
    setLocationError(undefined);

    createCafe.mutate(
      {
        name: formData.name,
        description: formData.description,
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        place_id: location.place_id,
      },
      {
        onSuccess: () => {
          navigate("/cafes");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="إضافة مقهى جديد" backHref="/cafes" />

      <Card className="bg-white shadow-sm rounded-xl max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Store className="h-5 w-5 text-gold-600" />
            بيانات المقهى
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              label="اسم المقهى"
              required
              error={form.formState.errors.name?.message}
            >
              <Input placeholder="مثال: مقهى الريان" {...form.register("name")} />
            </FormField>

            <FormField
              label="الوصف"
              required
              error={form.formState.errors.description?.message}
            >
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="وصف المقهى"
                {...form.register("description")}
              />
            </FormField>

            <FormField
              label="الموقع على الخريطة"
              required
              error={locationError}
              description="ابحث عن عنوان المقهى واختره من قائمة الاقتراحات"
            >
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-gold-600" />
                <span className="text-sm text-muted-foreground">
                  اختر الموقع من خرائط جوجل
                </span>
              </div>
              <LocationPicker
                value={location}
                onChange={(loc) => {
                  setLocation(loc);
                  if (loc.address) setLocationError(undefined);
                }}
                placeholder="ابحث عن عنوان المقهى..."
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/cafes")}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="bg-gold-500 hover:bg-gold-600 text-white"
                disabled={createCafe.isPending}
              >
                {createCafe.isPending ? "جاري الحفظ..." : "إضافة المقهى"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}