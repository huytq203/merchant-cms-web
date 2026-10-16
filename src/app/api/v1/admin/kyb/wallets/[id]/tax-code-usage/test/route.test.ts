import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getMerchant, getTaxCodeUsage } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getMerchant: vi.fn(),
  getTaxCodeUsage: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/kyb/kyb.service", () => ({ getMerchant, getTaxCodeUsage }));

import { GET } from "../route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const walletId = "22222222-2222-4222-8222-222222222222";
const otherWalletId = "88888888-8888-4888-8888-888888888888";
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const request = (taxCode: string) =>
  new Request(`http://localhost/api/v1/admin/kyb/wallets/${walletId}/tax-code-usage?taxCode=${taxCode}`);

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId], permissions: ["MANAGE_SUB_MERCHANT"] });
  getMerchant.mockResolvedValue({ success: true, data: { id: merchantId, status: "ACTIVE", enterpriseWalletId: walletId } });
  getTaxCodeUsage.mockResolvedValue({ success: true, data: ["Công ty Khác"] });
});

describe("KYB tax code usage route", () => {
  it("returns 403 without MANAGE_SUB_MERCHANT", async () => {
    getServerSession.mockResolvedValue({ merchantIds: [merchantId], permissions: ["VIEW_ORDER"] });
    expect((await GET(request("0123456789"), context(walletId))).status).toBe(403);
    expect(getTaxCodeUsage).not.toHaveBeenCalled();
  });

  it("returns 401 without a session", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(request("0123456789"), context(walletId))).status).toBe(401);
  });

  it("refuses a malformed tax code before any lookup", async () => {
    expect((await GET(request("abc"), context(walletId))).status).toBe(400);
    expect(getTaxCodeUsage).not.toHaveBeenCalled();
  });

  it("answers 404 for a wallet the session does not own", async () => {
    expect((await GET(request("0123456789"), context(otherWalletId))).status).toBe(404);
    expect(getTaxCodeUsage).not.toHaveBeenCalled();
  });

  it("returns the other wallets using the code", async () => {
    const response = await GET(request("0123456789"), context(walletId));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(["Công ty Khác"]);
    expect(getTaxCodeUsage).toHaveBeenCalledWith(walletId, "0123456789");
  });
});
