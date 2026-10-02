const DEFAULT_REDIRECT = "/dashboard";

/** Accepts only same-origin relative paths so a login link cannot redirect off-site. */
export function safeCallback(url: string | null): string {
  if (!url) return DEFAULT_REDIRECT;
  if (!url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) return DEFAULT_REDIRECT;
  return url;
}
