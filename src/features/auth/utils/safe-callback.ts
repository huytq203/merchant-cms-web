const DEFAULT_REDIRECT = "/dashboard";

/** Accepts only same-origin relative paths so a login link cannot redirect off-site. */
export function safeCallback(url: string | null): string {
  if (!url) return DEFAULT_REDIRECT;
  if (!url.startsWith("/") || url.startsWith("//") || /[\u0000-\u001f\u007f\\]/.test(url) || url.startsWith("/login") || url.startsWith("/api/")) return DEFAULT_REDIRECT;
  return url;
}
