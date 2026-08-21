import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { loadGoogleMaps, getGoogleMapsApiKey } from "@/lib/googleMaps";
import { MapPreview } from "@/components/MapPreview";
import { cn } from "@/lib/utils";

export interface LocationValue {
  address: string;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
}

export const emptyLocation: LocationValue = {
  address: "",
  latitude: null,
  longitude: null,
  place_id: null,
};

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  error?: string;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
}

export function LocationPicker({
  value,
  onChange,
  error,
  placeholder = "ابحث عن عنوان أو مكان...",
  className,
  showPreview = true,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let autocompleteEl: HTMLElement | null = null;

    const attachAutocomplete = async (maps: typeof google.maps) => {
      if (cancelled || !containerRef.current) return;
      containerRef.current.innerHTML = "";

      // Google Places Autocomplete (New) - PlaceAutocompleteElement web component
      const isNewApi =
        typeof maps.places.PlaceAutocompleteElement === "function";

      if (isNewApi) {
        const autocomplete = new maps.places.PlaceAutocompleteElement({
          placeholder,
        });
        autocompleteEl = autocomplete;

        autocomplete.addEventListener(
          "gmp-select",
          async (event: Event) => {
            const selectEvent =
              event as google.maps.places.PlacePredictionSelectEvent;
            const place = selectEvent.placePrediction.toPlace();
            try {
              const { place: placeDetails } = await place.fetchFields({
                fields: [
                  "displayName",
                  "formattedAddress",
                  "location",
                  "id",
                ],
              });
              onChange({
                address:
                  placeDetails.formattedAddress ||
                  placeDetails.displayName ||
                  "",
                latitude: placeDetails.location
                  ? placeDetails.location.lat()
                  : null,
                longitude: placeDetails.location
                  ? placeDetails.location.lng()
                  : null,
                place_id: placeDetails.id || null,
              });
            } catch {
              // fall back to the prediction data if fetchFields fails
              onChange({
                address: place.displayName || "",
                latitude: null,
                longitude: null,
                place_id: place.id || null,
              });
            }
          }
        );

        containerRef.current.appendChild(autocomplete);
      } else {
        // Fallback: classic Places Autocomplete widget (legacy)
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = placeholder;
        input.className =
          "flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
        containerRef.current.appendChild(input);

        const autocomplete = new maps.places.Autocomplete(input, {
          fields: ["formatted_address", "geometry", "place_id", "name"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const location = place.geometry?.location;
          onChange({
            address: place.formatted_address || place.name || "",
            latitude: location ? location.lat() : null,
            longitude: location ? location.lng() : null,
            place_id: place.place_id || null,
          });
        });
      }
    };

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled) return;
        try {
          attachAutocomplete(maps);
          setLoadError(null);
        } catch (err) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load search"
          );
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });

    return () => {
      cancelled = true;
      if (autocompleteEl) {
        autocompleteEl.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <div
          ref={containerRef}
          className="w-full [&>*]:w-full [&>gmpx-place-picker]:w-full [&_input]:w-full [&_input]:h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-input [&_input]:bg-white [&_input]:px-3 [&_input]:text-sm"
        />
        {loadError && (
          <div className="text-xs text-destructive mt-1">
            {loadError}
          </div>
        )}
        {!loadError && !value.address && (
          <div className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4" />
          </div>
        )}
      </div>

      {value.address && (
        <div className="flex items-center gap-2 text-sm text-ink-900">
          <MapPin className="h-4 w-4 text-gold-600 shrink-0" />
          <span className="truncate">{value.address}</span>
        </div>
      )}

      {value.latitude !== null && value.longitude !== null && (
        <p className="text-xs text-muted-foreground">
          خط العرض: {value.latitude.toFixed(6)} — خط الطول:{" "}
          {value.longitude.toFixed(6)}
          {value.place_id ? ` — Place ID: ${value.place_id.slice(0, 16)}…` : ""}
        </p>
      )}

      {showPreview && (
        <MapPreview
          latitude={value.latitude}
          longitude={value.longitude}
          address={value.address}
          placeId={value.place_id}
          onChange={onChange}
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function LocationPickerSkeleton() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      جاري تحميل خرائط جوجل...
    </div>
  );
}