import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getSubMerchant, updateSubMerchant } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getSubMerchant: vi.fn(),
  updateSubMerchant: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/sub-merchants/sub-merchant.service", () => ({
  getSubMerchant,
  updateSubMerchant,
}));
import { GET, PUT } from "../route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const id = "22222222-2222-4222-8222-222222222222";
const ctx = { params: Promise.resolve({ id }) };
const values = {
  name: "Sub-merchant",
  mccCode: "5812",
  contractStagingId: "",
  inheritPhone: true,
  phone: "",
  inheritAddress: true,
  address: "",
};
const url = `http://localhost/api/v1/admin/sub-merchants/${id}`;
const request = () => new Request(url);
const put = () => new Request(url, { method: "PUT", body: JSON.stringify(values) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({
    merchantIds: [merchantId],
    permissions: ["MANAGE_SUB_MERCHANT"],
  });
  getSubMerchant.mockResolvedValue({ success: true, data: { id, merchantId } });
});

describe("sub merchant detail route", () => {
  it("returns 401 without a session", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(request(), ctx)).status).toBe(401);
    expect(getSubMerchant).not.toHaveBeenCalled();
  });

  it("returns 403 without permission", async () => {
    getServerSession.mockResolvedValue({ merchantIds: [merchantId], permissions: [] });
    expect((await GET(request(), ctx)).status).toBe(403);
    expect(getSubMerchant).not.toHaveBeenCalled();
  });

  it("returns 404 for another merchant before PUT", async () => {
    getSubMerchant.mockResolvedValue({ success: true, data: { id, merchantId: "other" } });
    expect((await PUT(put(), ctx)).status).toBe(404);
    expect(updateSubMerchant).not.toHaveBeenCalled();
  });

  it("returns detail", async () => {
    const response = await GET(request(), ctx);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id, merchantId });
  });

  it("updates own detail", async () => {
    updateSubMerchant.mockResolvedValue({ success: true, data: { id, merchantId, name: "Sub-merchant" } });
    const response = await PUT(put(), ctx);
    expect(response.status).toBe(200);
    expect(updateSubMerchant).toHaveBeenCalledWith(id, values);
  });
});
