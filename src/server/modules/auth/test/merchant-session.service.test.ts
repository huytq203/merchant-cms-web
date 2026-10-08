import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createBeClient } from "@/lib/be/client";
import { fetchMerchantSession } from "@/server/modules/auth/merchant-session.service";
import { mswServer } from "@/test/msw";

const BASE = "https://merchant.test";
const client = createBeClient({ baseUrl: BASE, getAccessToken: async () => "tok-1" });

describe("fetchMerchantSession", () => {
  it("loads /merchant/me with the bearer token and maps it", async () => {
    let auth: string | null = null;
    mswServer.use(
      http.get(`${BASE}/api/v1/merchant/me`, ({ request }) => {
        auth = request.headers.get("authorization");
        return HttpResponse.json({
          success: true,
          message: "success",
          data: {
            merchantUserId: "u-1",
            email: "an@shop.vn",
            fullName: "An",
            status: "ACTIVE",
            merchantIds: [],
            subMerchantIds: [],
            permissions: ["VIEW_ORDER"],
            authorizationVersion: 1,
          },
        });
      }),
    );
    const result = await fetchMerchantSession(client);
    expect(auth).toBe("Bearer tok-1");
    expect(result).toMatchObject({ success: true, data: { userId: "u-1", permissions: ["VIEW_ORDER"] } });
  });

  it("returns the BE error for an expired token", async () => {
    mswServer.use(
      http.get(`${BASE}/api/v1/merchant/me`, () => HttpResponse.json({ message: "UNAUTHORIZED" }, { status: 401 })),
    );
    const result = await fetchMerchantSession(client);
    expect(result).toMatchObject({ success: false, error: { status: 401 } });
  });
});
