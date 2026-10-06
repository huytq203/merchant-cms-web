import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getMerchant, updateWallet, submitWallet } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getMerchant: vi.fn(),
  updateWallet: vi.fn(),
  submitWallet: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/kyb/kyb.service", () => ({ getMerchant, updateWallet, submitWallet }));

import { PUT } from "./route";
import { POST as SUBMIT } from "./submit/route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const walletId = "22222222-2222-4222-8222-222222222222";
const otherWalletId = "88888888-8888-4888-8888-888888888888";
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const url = `http://localhost/api/v1/admin/kyb/wallets/${walletId}`;

function put(body: unknown) {
  return new Request(url, { method: "PUT", body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId] });
  getMerchant.mockResolvedValue({
    success: true,
    data: { id: merchantId, status: "ACTIVE", enterpriseWalletId: walletId },
  });
  updateWallet.mockResolvedValue({ success: true, data: { id: walletId, verificationStatus: "DRAFT" } });
  submitWallet.mockResolvedValue({ success: true, data: { id: walletId, verificationStatus: "PENDING_APPROVAL" } });
});

describe("KYB wallet routes", () => {
  it("returns 401 without a session", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await PUT(put({}), context(walletId))).status).toBe(401);
    expect(updateWallet).not.toHaveBeenCalled();
  });

  it("answers 404 for a malformed wallet id", async () => {
    expect((await PUT(put({}), context("not-a-uuid"))).status).toBe(404);
    expect(getMerchant).not.toHaveBeenCalled();
  });

  it("answers 404 and does not write for a wallet the session merchants do not sit on", async () => {
    expect((await PUT(put({ legalName: "Công ty A" }), context(otherWalletId))).status).toBe(404);
    expect((await SUBMIT(new Request(url, { method: "POST" }), context(otherWalletId))).status).toBe(404);
    expect(updateWallet).not.toHaveBeenCalled();
    expect(submitWallet).not.toHaveBeenCalled();
  });

  it("rejects an oversized field before checking ownership", async () => {
    expect((await PUT(put({ legalName: "a".repeat(201) }), context(walletId))).status).toBe(400);
    expect(getMerchant).not.toHaveBeenCalled();
    expect(updateWallet).not.toHaveBeenCalled();
  });

  it("updates an owned wallet", async () => {
    const response = await PUT(put({ legalName: "Công ty A", internalWallet: false }), context(walletId));
    expect(response.status).toBe(200);
    expect(updateWallet).toHaveBeenCalledWith(walletId, { legalName: "Công ty A", internalWallet: false });
  });

  it("answers 403 instead of 401 (which would end the session) when the merchant lookup fails", async () => {
    getMerchant.mockResolvedValue({
      success: false,
      error: { status: 401, code: "UNAUTHORIZED", message: "Chưa được cấp quyền" },
    });
    expect((await PUT(put({}), context(walletId))).status).toBe(403);
    expect(updateWallet).not.toHaveBeenCalled();
  });

  it("submits an owned wallet", async () => {
    const response = await SUBMIT(new Request(url, { method: "POST" }), context(walletId));
    expect(response.status).toBe(200);
    expect(submitWallet).toHaveBeenCalledWith(walletId);
  });
});
