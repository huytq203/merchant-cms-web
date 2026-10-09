import { describe, expect, it } from "vitest";

import { decideAuthAction, mergeCookieHeader } from "@/lib/auth/auth-routing";

describe("decideAuthAction", () => {
  it.each([
    ["/dashboard", true, false, "allow"],
    ["/dashboard", true, true, "allow"],
    ["/login", true, false, "redirect-dashboard"],
    ["/dashboard", false, true, "refresh"],
    ["/login", false, true, "refresh"],
    ["/dashboard", false, false, "redirect-login"],
    ["/login", false, false, "allow"],
    ["/auth/set-password", false, false, "allow"],
    ["/auth/set-password", false, true, "refresh"],
  ])("%s access=%s refresh=%s → %s", (pathname, hasAccessToken, hasRefreshToken, expected) => {
    expect(decideAuthAction({ pathname, hasAccessToken, hasRefreshToken })).toBe(expected);
  });
});

describe("mergeCookieHeader", () => {
  it("replaces existing cookies, appends new ones and keeps the rest", () => {
    const merged = mergeCookieHeader("theme=dark; refresh_token=old; a=b", [
      { name: "refresh_token", value: "new" },
      { name: "access_token", value: "tok" },
    ]);
    expect(merged.split("; ").sort()).toEqual(
      ["a=b", "access_token=tok", "refresh_token=new", "theme=dark"].sort(),
    );
  });

  it("works with no existing header", () => {
    expect(mergeCookieHeader(null, [{ name: "a", value: "1" }])).toBe("a=1");
  });
});
