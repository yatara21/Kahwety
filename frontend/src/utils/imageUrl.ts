/**
 * Resolves an image URL to an absolute URL accessible by the browser.
 * If the image path is relative (e.g. "/static/uploads/abc.png"), it prepends
 * the backend API host origin.
 */
export function getImageUrl(url?: string | null): string {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  const apiBase =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
  // Remove trailing /api/v1 or /api/v1/ to get backend origin (e.g. http://localhost:8000)
  const origin = apiBase.replace(/\/api\/v1\/?$/, "");
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${origin}${cleanPath}`;
}
