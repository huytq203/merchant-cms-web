import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getMerchantStatusHistory } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getMerchantStatusHistory: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/kyb/kyb.service", () => ({ getMerchantStatusHistory, getMerchant: vi.fn() }));

import { GET } from "../route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const request = (query = "") => new Request(`http://localhost/api/v1/admin/kyb/merchants/${merchantId}/status-history${query}`);

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId] });
  getMerchantStatusHistory.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
});

describe("KYB status history route", () => {
  it("answers 404 for a merchant outside the session scope", async () => {
    const outside = "99999999-9999-4999-8999-999999999999";
    expect((await GET(request(), context(outside))).status).toBe(404);
    expect(getMerchantStatusHistory).not.toHaveBeenCalled();
  });

  it("rejects an invalid page", async () => {
    expect((await GET(request("?page=0"), context(merchantId))).status).toBe(400);
  });

  it("returns the page of history", async () => {
    const response = await GET(request("?page=2"), context(merchantId));
    expect(response.status).toBe(200);
    expect(getMerchantStatusHistory).toHaveBeenCalledWith(merchantId, 2);
    expect(await response.json()).toEqual({ rows: [], total: 0 });
  });
});
