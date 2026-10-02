export type AuthAction = "allow" | "redirect-login" | "redirect-dashboard" | "refresh";

export const LOGIN_PATH = "/login";
export const DASHBOARD_PATH = "/dashboard";

const PUBLIC_PATHS: ReadonlySet<string> = new Set([LOGIN_PATH]);

export function decideAuthAction(input: {
  pathname: string;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
}): AuthAction {
  if (input.hasAccessToken) {
    return input.pathname === LOGIN_PATH ? "redirect-dashboard" : "allow";
  }
  if (input.hasRefreshToken) return "refresh";
  return PUBLIC_PATHS.has(input.pathname) ? "allow" : "redirect-login";
}

/** Returns a `Cookie` header with `updates` applied over `existing`. */
export function mergeCookieHeader(
  existing: string | null,
  updates: ReadonlyArray<{ name: string; value: string }>,
): string {
  const jar = new Map<string, string>();
  for (const part of (existing ?? "").split(";")) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator > 0) jar.set(trimmed.slice(0, separator), trimmed.slice(separator + 1));
  }
  for (const update of updates) jar.set(update.name, update.value);
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}
