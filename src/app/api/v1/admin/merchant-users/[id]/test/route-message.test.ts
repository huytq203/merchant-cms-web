import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));
import { PUT } from "../route";

const id = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";
const groupId = "33333333-3333-4333-8333-333333333333";
const base = `https://merchant.test/api/v1/merchant/merchant-users/${id}`;
const detail = {
  id, keycloakUserId: "kc", email: "user@example.com", fullName: "User", phone: null, active: false, locked: false,
  groups: [groupId], merchantIds: [merchantId], subMerchantIds: [], rolesText: "Vận hành", createdAt: "2026-10-05T10:00:00",
};

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  getServerSession.mockResolvedValue({ userId: "actor", permissions: ["MANAGE_USER"], merchantIds: [merchantId], subMerchantIds: [] });
});

describe("merchant user PUT route", () => {
  it("hands the BE message to the browser in X-Api-Message", async () => {
    mswServer.use(
      http.get(base, () => HttpResponse.json({ success: true, message: "success", detail: "Get success", data: detail })),
      http.put(base, () => HttpResponse.json({ success: true, message: "success", detail: "Update success", data: { id } })),
    );
    const request = new Request(`http://localhost${new URL(base).pathname}`, {
      method: "PUT",
      body: JSON.stringify({ fullName: "User", phone: "" }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id }) });
    expect(response.status).toBe(200);
    expect(decodeURIComponent(response.headers.get("X-Api-Message") ?? "")).toBe("Update success");
  });
});
