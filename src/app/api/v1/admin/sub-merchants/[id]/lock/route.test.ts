import { beforeEach, expect, it, vi } from "vitest";

const { getServerSession, getSubMerchant, lockSubMerchant } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getSubMerchant: vi.fn(),
  lockSubMerchant: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/sub-merchants/sub-merchant.service", () => ({
  getSubMerchant,
  lockSubMerchant,
}));
import { POST } from "./route";

const id = "22222222-2222-4222-8222-222222222222";
const merchantId = "11111111-1111-4111-8111-111111111111";
const ctx = { params: Promise.resolve({ id }) };
const request = (reason: string) => new Request(
  `http://localhost/api/v1/admin/sub-merchants/${id}/lock`,
  { method: "POST", body: JSON.stringify({ reason }) },
);

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({
    merchantIds: [merchantId],
    permissions: ["MANAGE_SUB_MERCHANT"],
  });
  getSubMerchant.mockResolvedValue({ success: true, data: { id, merchantId } });
});

it("returns 404 for another merchant without calling lock", async () => {
  getSubMerchant.mockResolvedValue({ success: true, data: { id, merchantId: "other" } });
  expect((await POST(request("Lý do hợp lệ"), ctx)).status).toBe(404);
  expect(lockSubMerchant).not.toHaveBeenCalled();
});

it("validates reason", async () => {
  expect((await POST(request("short"), ctx)).status).toBe(400);
  expect(lockSubMerchant).not.toHaveBeenCalled();
});

it("locks own sub merchant", async () => {
  lockSubMerchant.mockResolvedValue({ success: true, data: { id, merchantId } });
  expect((await POST(request("Lý do hợp lệ"), ctx)).status).toBe(200);
  expect(lockSubMerchant).toHaveBeenCalledWith(id, "Lý do hợp lệ");
});
