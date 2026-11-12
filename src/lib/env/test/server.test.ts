import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env/server";

describe("parseServerEnv", () => {
  it("defaults to live mode in production", () => {
    const env = parseServerEnv({
      IDENTITY_BASE_URL: "https://identity.test",
      MERCHANT_BASE_URL: "https://merchant.test",
      NODE_ENV: "production",
    });
    expect(env.MERCHANT_API_MODE).toBe("live");
  });
  it("trims trailing slashes and defaults the mode to fixture", () => {
    const env = parseServerEnv({
      IDENTITY_BASE_URL: "https://identity.test/",
      MERCHANT_BASE_URL: "https://merchant.test//",
    });
    expect(env).toEqual({
      IDENTITY_BASE_URL: "https://identity.test",
      MERCHANT_BASE_URL: "https://merchant.test",
      MERCHANT_API_MODE: "fixture",
    });
  });

  it("drops a legacy /api/v1/admin or /api/v1/merchant suffix", () => {
    const env = parseServerEnv({
      IDENTITY_BASE_URL: "https://host.test/identity/api/v1/admin",
      MERCHANT_BASE_URL: "https://host.test/merchant/api/v1/merchant/",
    });
    expect(env.IDENTITY_BASE_URL).toBe("https://host.test/identity");
    expect(env.MERCHANT_BASE_URL).toBe("https://host.test/merchant");
  });

  it("accepts live mode", () => {
    const env = parseServerEnv({
      IDENTITY_BASE_URL: "https://identity.test",
      MERCHANT_BASE_URL: "https://merchant.test",
      MERCHANT_API_MODE: "live",
    });
    expect(env.MERCHANT_API_MODE).toBe("live");
  });

  it("names the invalid keys without echoing their values", () => {
    expect(() =>
      parseServerEnv({ IDENTITY_BASE_URL: "not-a-url-secret", MERCHANT_BASE_URL: undefined }),
    ).toThrowError(/IDENTITY_BASE_URL.*MERCHANT_BASE_URL/);
    expect(() => parseServerEnv({ IDENTITY_BASE_URL: "not-a-url-secret" })).not.toThrowError(
      /not-a-url-secret/,
    );
  });
});

describe("NOTIFICATION_BASE_URL", () => {
  const base = { IDENTITY_BASE_URL: "https://identity.test", MERCHANT_BASE_URL: "https://merchant.test" };
  it("is optional and an empty value counts as unset", () => {
    expect(parseServerEnv(base).NOTIFICATION_BASE_URL).toBeUndefined();
    expect(parseServerEnv({ ...base, NOTIFICATION_BASE_URL: "" }).NOTIFICATION_BASE_URL).toBeUndefined();
  });
  it("trims trailing slashes when set", () => {
    expect(parseServerEnv({ ...base, NOTIFICATION_BASE_URL: "https://noti.test/" }).NOTIFICATION_BASE_URL).toBe("https://noti.test");
  });
});
