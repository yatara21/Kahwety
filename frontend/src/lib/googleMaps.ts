let mapsPromise: Promise<typeof google.maps> | null = null;

const API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();

export function getGoogleMapsApiKey(): string {
  return API_KEY;
}

function ensureLibraries(): Promise<typeof google.maps> {
  return Promise.all([
    window.google.maps.importLibrary("maps"),
    window.google.maps.importLibrary("places"),
  ]).then(() => window.google.maps);
}

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (mapsPromise) {
    return mapsPromise;
  }

  if (typeof window === "undefined") {
    mapsPromise = Promise.reject(
      new Error("Google Maps is only available in the browser")
    );
    return mapsPromise;
  }

  if ((window as any).google?.maps?.importLibrary) {
    mapsPromise = ensureLibraries();
    return mapsPromise;
  }

  if (!API_KEY) {
    mapsPromise = Promise.reject(
      new Error("VITE_GOOGLE_MAPS_API_KEY is not set. Add it to frontend/.env")
    );
    return mapsPromise;
  }

  mapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-google-maps-api]"
    );
    const start = Date.now();
    let rejected = false;

    const fail = (err: Error) => {
      if (!rejected) {
        rejected = true;
        reject(err);
      }
    };

    window.addEventListener("gm_authFailure", () =>
      fail(
        new Error(
          "Google Maps API key authentication failed (key restricted or invalid)"
        )
      )
    );

    const poll = () => {
      if ((window as any).google?.maps?.importLibrary) {
        ensureLibraries().then(resolve, fail);
        return;
      }
      if (Date.now() - start > 20000) {
        fail(
          new Error("Google Maps API did not initialize within 20 seconds")
        );
        return;
      }
      setTimeout(poll, 100);
    };

    if (existing) {
      existing.addEventListener("error", () =>
        fail(new Error("Failed to load Google Maps API"))
      );
      poll();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,maps&loading=async`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-google-maps-api", "true");
    script.addEventListener("error", () =>
      fail(new Error("Failed to load Google Maps API"))
    );
    document.head.appendChild(script);
    poll();
  });

  return mapsPromise;
}