import { describe, expect, it } from "vitest";

import { decodeJwtPayload, describeTokenForLog } from "@/lib/auth/jwt";
import { fakeJwt } from "@/test/jwt";

describe("describeTokenForLog", () => {
  it("keeps only non-sensitive claims and the time to expiry", () => {
    const token = fakeJwt({
      exp: 1_700_000_300,
      iat: 1_700_000_000,
      iss: "https://kc.example/realms/ewallet-merchant",
      azp: "ewallet-merchant-portal",
      typ: "Bearer",
      aud: ["account"],
      roles: ["MERCHANT_USER"],
      realm_access: { roles: ["offline_access", "MERCHANT_USER"] },
      sub: "secret-subject",
      email: "person@example.com",
      preferred_username: "person",
    });
    const payload = decodeJwtPayload(token);
    expect(payload).not.toBeNull();
    const described = describeTokenForLog(payload!, 1_700_000_100);
    expect(described).toEqual({
      iss: "https://kc.example/realms/ewallet-merchant",
      azp: "ewallet-merchant-portal",
      typ: "Bearer",
      aud: ["account"],
      roles: ["MERCHANT_USER"],
      realmRoles: ["offline_access", "MERCHANT_USER"],
      iat: 1_700_000_000,
      exp: 1_700_000_300,
      secondsToExpiry: 200,
    });
    expect(JSON.stringify(described)).not.toContain("person");
    expect(JSON.stringify(described)).not.toContain("secret-subject");
  });

  it("reports missing claims as undefined and a negative expiry for an expired token", () => {
    const payload = decodeJwtPayload(fakeJwt({ exp: 100 }));
    expect(describeTokenForLog(payload!, 160)).toMatchObject({ iss: undefined, azp: undefined, typ: undefined, roles: undefined, realmRoles: undefined, secondsToExpiry: -60 });
  });
});
