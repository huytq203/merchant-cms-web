import { beforeEach, expect, it, vi } from "vitest";

const { getServerSession, getSubMerchant, unlockSubMerchant } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getSubMerchant: vi.fn(),
  unlockSubMerchant: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/sub-merchants/sub-merchant.service", () => ({
  getSubMerchant,
  unlockSubMerchant,
}));
import { POST } from "./route";

const id = "22222222-2222-4222-8222-222222222222";
const merchantId = "11111111-1111-4111-8111-111111111111";
const ctx = { params: Promise.resolve({ id }) };
const request = () => new Request(
  `http://localhost/api/v1/admin/sub-merchants/${id}/unlock`,
  { method: "POST", body: JSON.stringify({ reason: "Lý do hợp lệ" }) },
);

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({
    merchantIds: [merchantId],
    permissions: ["MANAGE_SUB_MERCHANT"],
  });
  getSubMerchant.mockResolvedValue({ success: true, data: { id, merchantId } });
});

it("returns 404 for another merchant without calling unlock", async () => {
  getSubMerchant.mockResolvedValue({ success: true, data: { id, merchantId: "other" } });
  expect((await POST(request(), ctx)).status).toBe(404);
  expect(unlockSubMerchant).not.toHaveBeenCalled();
});

it("unlocks own sub merchant", async () => {
  unlockSubMerchant.mockResolvedValue({ success: true, data: { id, merchantId } });
  expect((await POST(request(), ctx)).status).toBe(200);
  expect(unlockSubMerchant).toHaveBeenCalledWith(id, "Lý do hợp lệ");
});
