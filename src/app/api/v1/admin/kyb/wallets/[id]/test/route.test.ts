import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getMerchant, updateWallet, submitWallet } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getMerchant: vi.fn(),
  updateWallet: vi.fn(),
  submitWallet: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/kyb/kyb.service", () => ({ getMerchant, updateWallet, submitWallet }));

import { PUT } from "../route";
import { POST as SUBMIT } from "../submit/route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const walletId = "22222222-2222-4222-8222-222222222222";
const otherWalletId = "88888888-8888-4888-8888-888888888888";
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const url = `http://localhost/api/v1/admin/kyb/wallets/${walletId}`;

function submitRequest() {
  return new Request(`${url}/submit`, {
    method: "POST",
    body: JSON.stringify({ otp: { otpSessionId: "s-1", otp: "123456" } }),
  });
}

function put(body: unknown) {
  return new Request(url, { method: "PUT", body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId], permissions: ["MANAGE_SUB_MERCHANT"] });
  getMerchant.mockResolvedValue({
    success: true,
    data: { id: merchantId, status: "ACTIVE", enterpriseWalletId: walletId },
  });
  updateWallet.mockResolvedValue({ success: true, data: { id: walletId, verificationStatus: "DRAFT" } });
  submitWallet.mockResolvedValue({ success: true, data: { id: walletId, verificationStatus: "PENDING_APPROVAL" } });
});

describe("KYB wallet routes", () => {
  it("returns 403 without MANAGE_SUB_MERCHANT and does not forward", async () => {
    getServerSession.mockResolvedValue({ merchantIds: [merchantId], permissions: ["VIEW_ORDER"] });
    expect((await PUT(put({}), context(walletId))).status).toBe(403);
    expect((await SUBMIT(submitRequest(), context(walletId))).status).toBe(403);
    expect(updateWallet).not.toHaveBeenCalled();
    expect(submitWallet).not.toHaveBeenCalled();
  });

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
    expect((await SUBMIT(submitRequest(), context(otherWalletId))).status).toBe(404);
    expect(updateWallet).not.toHaveBeenCalled();
    expect(submitWallet).not.toHaveBeenCalled();
  });

  it("rejects an oversized field before checking ownership", async () => {
    expect((await PUT(put({ legalName: "a".repeat(201) }), context(walletId))).status).toBe(400);
    expect(getMerchant).not.toHaveBeenCalled();
    expect(updateWallet).not.toHaveBeenCalled();
  });

  it("updates an owned wallet", async () => {
    const response = await PUT(put({ legalName: "Công ty A" }), context(walletId));
    expect(response.status).toBe(200);
    expect(updateWallet).toHaveBeenCalledWith(walletId, { legalName: "Công ty A" }, undefined);
  });

  it("passes the email OTP of a verified dossier edit to the service", async () => {
    const otp = { otpSessionId: "s-1", otp: "123456" };
    expect((await PUT(put({ legalName: "Công ty A", otp }), context(walletId))).status).toBe(200);
    expect(updateWallet).toHaveBeenCalledWith(walletId, { legalName: "Công ty A" }, otp);
  });

  it("refuses a malformed OTP before anything is written", async () => {
    expect((await PUT(put({ legalName: "Công ty A", otp: { otpSessionId: "s-1", otp: "12" } }), context(walletId))).status).toBe(400);
    expect(updateWallet).not.toHaveBeenCalled();
  });

  it("answers 403 instead of 401 (which would end the session) when the merchant lookup fails", async () => {
    getMerchant.mockResolvedValue({
      success: false,
      error: { status: 401, code: "UNAUTHORIZED", message: "Chưa được cấp quyền" },
    });
    expect((await PUT(put({}), context(walletId))).status).toBe(403);
    expect(updateWallet).not.toHaveBeenCalled();
  });

  it("submits an owned wallet with its OTP", async () => {
    const response = await SUBMIT(submitRequest(), context(walletId));
    expect(response.status).toBe(200);
    expect(submitWallet).toHaveBeenCalledWith(walletId, { otpSessionId: "s-1", otp: "123456" });
  });

  it("refuses a submit that carries no OTP", async () => {
    expect((await SUBMIT(new Request(url, { method: "POST" }), context(walletId))).status).toBe(400);
    expect(submitWallet).not.toHaveBeenCalled();
  });
});
