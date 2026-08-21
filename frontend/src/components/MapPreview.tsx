import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { loadGoogleMaps, getGoogleMapsApiKey } from "@/lib/googleMaps";
import { cn } from "@/lib/utils";

export interface MapLocation {
  address: string;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
}

const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 };

interface MapPreviewProps {
  latitude: number | null;
  longitude: number | null;
  address?: string | null;
  placeId?: string | null;
  onChange?: (value: MapLocation) => void;
  className?: string;
}

export function MapPreview({
  latitude,
  longitude,
  address,
  placeId,
  onChange,
  className,
}: MapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const lastEmittedRef = useRef<{ lat: number; lng: number } | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    let cancelled = false;

    setStatus("loading");
    setErrorMessage(null);
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current || mapInstanceRef.current) return;

        try {
          const hasLocation =
            latitude !== null && longitude !== null;
          const map = new maps.Map(mapRef.current, {
            center: hasLocation
              ? { lat: latitude as number, lng: longitude as number }
              : DEFAULT_CENTER,
            zoom: hasLocation ? 15 : 11,
            gestureHandling: "greedy",
            mapTypeControl: true,
            fullscreenControl: true,
            streetViewControl: false,
          });
          mapInstanceRef.current = map;

          const ensureMarker = (position: google.maps.LatLngLiteral) => {
            if (!markerRef.current) {
              markerRef.current = new maps.Marker({
                position,
                map,
                draggable: Boolean(onChangeRef.current),
                title: address || undefined,
              });
              if (onChangeRef.current) {
                markerRef.current.addListener("dragend", () => {
                  const markerPosition = markerRef.current?.getPosition();
                  if (markerPosition) emitFromLatLng(markerPosition);
                });
              }
            } else {
              markerRef.current.setPosition(position);
            }
            return markerRef.current;
          };

          const emitFromLatLng = (latLng: google.maps.LatLng) => {
            const lat = latLng.lat();
            const lng = latLng.lng();
            lastEmittedRef.current = { lat, lng };
            ensureMarker({ lat, lng });
            if (!onChangeRef.current) return;

            if (typeof maps.Geocoder === "function") {
              try {
                const geocoder = new maps.Geocoder();
                geocoder.geocode(
                  { location: latLng },
                  (results, geocodeStatus) => {
                    if (geocodeStatus === "OK" && results?.[0]) {
                      onChangeRef.current?.({
                        address: results[0].formatted_address,
                        latitude: lat,
                        longitude: lng,
                        place_id: null,
                      });
                    } else {
                      onChangeRef.current?.({
                        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                        latitude: lat,
                        longitude: lng,
                        place_id: null,
                      });
                    }
                  }
                );
                return;
              } catch {
                // fall through to the plain coordinate fallback
              }
            }
            onChangeRef.current?.({
              address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              latitude: lat,
              longitude: lng,
              place_id: null,
            });
          };

          if (hasLocation) {
            ensureMarker({ lat: latitude as number, lng: longitude as number });
            lastEmittedRef.current = {
              lat: latitude as number,
              lng: longitude as number,
            };
          }

          if (onChangeRef.current) {
            map.addListener("click", (event: google.maps.MapMouseEvent) => {
              if (event.latLng) emitFromLatLng(event.latLng);
            });

            try {
              const SearchElement = (maps.places as any)
                ?.PlaceAutocompleteElement;
              if (typeof SearchElement === "function") {
                const searchDiv = document.createElement("div");
                searchDiv.style.margin = "10px";
                searchDiv.style.width = "250px";
                const autocomplete: any = new SearchElement();
                autocomplete.style.width = "100%";
                autocomplete.addEventListener(
                  "gmp-select",
                  async (event: Event) => {
                    const selectEvent =
                      event as google.maps.places.PlacePredictionSelectEvent;
                    const place = selectEvent.placePrediction.toPlace();
                    const applyPlace = (details: any) => {
                      const location = details.location;
                      if (!location || !onChangeRef.current) return;
                      const lat = location.lat();
                      const lng = location.lng();
                      lastEmittedRef.current = { lat, lng };
                      ensureMarker({ lat, lng });
                      map.panTo({ lat, lng });
                      map.setZoom(15);
                      onChangeRef.current({
                        address:
                          details.formattedAddress || details.displayName || "",
                        latitude: lat,
                        longitude: lng,
                        place_id: details.id || null,
                      });
                    };
                    try {
                      const { place: placeDetails } =
                        await place.fetchFields({
                          fields: [
                            "displayName",
                            "formattedAddress",
                            "location",
                            "id",
                          ],
                        });
                      applyPlace(placeDetails);
                    } catch {
                      applyPlace(place);
                    }
                  }
                );
                searchDiv.appendChild(autocomplete);
                map.controls[google.maps.ControlPosition.TOP_LEFT].push(
                  searchDiv
                );
              } else if (typeof maps.places?.SearchBox === "function") {
                const input = document.createElement("input");
                input.type = "text";
                input.placeholder = "ابحث في الخريطة...";
                input.style.cssText =
                  "box-sizing:border-box;width:250px;margin:10px;padding:8px 10px;font-size:14px;border:1px solid #ccc;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,.3);font-family:inherit;";
                const searchBox = new maps.places.SearchBox(input);
                searchBox.addListener("places_changed", () => {
                  const places = searchBox.getPlaces();
                  const first = places?.[0];
                  const location = first?.geometry?.location;
                  if (!location || !onChangeRef.current) return;
                  const lat = location.lat();
                  const lng = location.lng();
                  lastEmittedRef.current = { lat, lng };
                  ensureMarker({ lat, lng });
                  map.panTo({ lat, lng });
                  map.setZoom(15);
                  onChangeRef.current({
                    address: first.formatted_address || first.name || "",
                    latitude: lat,
                    longitude: lng,
                    place_id: first.place_id || null,
                  });
                });
                map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
              }
            } catch {
              // in-map search is optional; the map itself still works
            }
          }

          setStatus("ready");
        } catch (err) {
          if (!cancelled) {
            setErrorMessage(
              err instanceof Error ? err.message : String(err)
            );
            setStatus("error");
          }
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setErrorMessage(err.message);
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || latitude === null || longitude === null) return;
    if (
      lastEmittedRef.current &&
      lastEmittedRef.current.lat === latitude &&
      lastEmittedRef.current.lng === longitude
    ) {
      return;
    }
    const position = { lat: latitude, lng: longitude };
    if (!markerRef.current && map) {
      const maps = window.google.maps;
      markerRef.current = new maps.Marker({
        position,
        map,
        draggable: Boolean(onChangeRef.current),
        title: address || undefined,
      });
      if (onChangeRef.current) {
        markerRef.current.addListener("dragend", () => {
          const markerPosition = markerRef.current?.getPosition();
          if (markerPosition) {
            const lat = markerPosition.lat();
            const lng = markerPosition.lng();
            lastEmittedRef.current = { lat, lng };
            onChangeRef.current?.({
              address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              latitude: lat,
              longitude: lng,
              place_id: null,
            });
          }
        });
      }
    } else {
      markerRef.current?.setPosition(position);
    }
    map.panTo(position);
  }, [latitude, longitude, address]);

  if (status === "error") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50 py-10 px-4 text-sm text-red-600",
          className
        )}
      >
        <MapPin className="h-5 w-5 mb-2" />
        تعذر تحميل الخريطة
        {errorMessage && (
          <code className="mt-2 max-w-full break-words text-[11px] text-red-500">
            {errorMessage}
          </code>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={mapRef}
        className="h-72 w-full rounded-xl overflow-hidden border border-[#e0d5b8]"
      />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#faf7f0]/80 rounded-xl">
          <Loader2 className="h-6 w-6 animate-spin text-gold-600" />
        </div>
      )}
      {status === "ready" && onChange && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          اضغط على الخريطة أو اسحب العلامة لتحديد الموقع — أو ابحث من داخل
          الخريطة
        </p>
      )}
    </div>
  );
}

export function isGoogleMapsConfigured(): boolean {
  return Boolean(getGoogleMapsApiKey());
}