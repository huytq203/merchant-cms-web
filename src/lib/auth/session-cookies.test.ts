import { describe, expect, it } from "vitest";

import { buildSessionCookies } from "@/lib/auth/session-cookies";
import { fakeJwt } from "@/test/jwt";

const NOW_MS = 1_700_000_000_000;
const nowSeconds = NOW_MS / 1000;

describe("buildSessionCookies", () => {
  it("expires the access cookie with the JWT exp and the refresh cookie with refreshExpiresIn", () => {
    const accessToken = fakeJwt({ exp: nowSeconds + 300 });
    const [access, refresh] = buildSessionCookies(
      { accessToken, expiresIn: 9999, refreshToken: "r-1", refreshExpiresIn: 86_400 },
      { secure: true, nowMs: NOW_MS },
    );
    expect(access).toMatchObject({
      name: "access_token",
      value: accessToken,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true, maxAge: 300 },
    });
    expect(refresh).toMatchObject({
      name: "refresh_token",
      value: "r-1",
      options: { httpOnly: true, secure: true, maxAge: 86_400 },
    });
  });

  it("never produces a negative maxAge for an already expired token", () => {
    const [access] = buildSessionCookies(
      { accessToken: fakeJwt({ exp: nowSeconds - 10 }), expiresIn: 300, refreshToken: "r", refreshExpiresIn: 60 },
      { secure: false, nowMs: NOW_MS },
    );
    expect(access?.options.maxAge).toBe(0);
  });

  it("falls back to expiresIn when the token has no readable exp", () => {
    const [access] = buildSessionCookies(
      { accessToken: "opaque-token", expiresIn: 120, refreshToken: "r", refreshExpiresIn: 60 },
      { secure: false, nowMs: NOW_MS },
    );
    expect(access?.options.maxAge).toBe(120);
  });
});
