export const AUTH_COOKIES = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
} as const;

export type AuthCookieName =
  (typeof AUTH_COOKIES)[keyof typeof AUTH_COOKIES];

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
};
