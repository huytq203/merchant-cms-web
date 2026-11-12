import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { listBusinessCategories } from "../business-category.service";

const BASE = "https://merchant.test";

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", BASE);
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
});

describe("business category service", () => {
  it("reads the catalogue from the merchant endpoint and unwraps the envelope", async () => {
    const data = [{ mccCode: "5812", name: "Nhà hàng, ăn uống" }];
    mswServer.use(http.get(`${BASE}/api/v1/merchant/business-categories`, () => HttpResponse.json({ success: true, data })));
    expect(await listBusinessCategories()).toEqual({ success: true, data });
  });

  it("passes a BE failure through as a failed result", async () => {
    mswServer.use(http.get(`${BASE}/api/v1/merchant/business-categories`, () => HttpResponse.json({ success: false, message: "Lỗi hệ thống" }, { status: 500 })));
    expect((await listBusinessCategories()).success).toBe(false);
  });
});
