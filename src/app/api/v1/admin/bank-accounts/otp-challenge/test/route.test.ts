import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getBankAccount, requestSensitiveOtp } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getBankAccount: vi.fn(),
  requestSensitiveOtp: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/bank-accounts/bank-account.service", () => ({ getBankAccount, requestSensitiveOtp }));
import { POST } from "../route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const targetId = "55555555-5555-4555-8555-555555555555";
const challenge = { otpSessionId: "session-1", maskedRecipient: "0912•••678", expiresInSeconds: 300, canResendAfterSeconds: 60 };
const request = (body?: unknown) =>
  new Request("http://localhost/api/v1/admin/bank-accounts/otp-challenge", {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId], subMerchantIds: [], permissions: ["MANAGE_BANK_ACCOUNT"] });
  requestSensitiveOtp.mockResolvedValue({ success: true, data: challenge });
});

describe("bank otp challenge route", () => {
  it("is refused without permission", async () => {
    getServerSession.mockResolvedValue({ merchantIds: [merchantId], subMerchantIds: [], permissions: [] });
    expect((await POST(request())).status).toBe(403);
    expect(requestSensitiveOtp).not.toHaveBeenCalled();
  });

  it("always requests the bank change operation, never one chosen by the client", async () => {
    const response = await POST(request({ operation: "BANK_ACCOUNT_CHANGE_APPROVAL" }));
    expect(response.status).toBe(200);
    expect(requestSensitiveOtp).toHaveBeenCalledWith("BANK_ACCOUNT_CHANGE", undefined);
    expect(await response.json()).toEqual(challenge);
  });

  it("only targets an account of the session Master", async () => {
    getBankAccount.mockResolvedValue({
      success: true,
      data: { id: targetId, merchantId: "22222222-2222-4222-8222-222222222222" },
    });
    expect((await POST(request({ targetId }))).status).toBe(404);
    expect(requestSensitiveOtp).not.toHaveBeenCalled();
    getBankAccount.mockResolvedValue({ success: true, data: { id: targetId, merchantId: merchantId } });
    expect((await POST(request({ targetId }))).status).toBe(200);
    expect(requestSensitiveOtp).toHaveBeenCalledWith("BANK_ACCOUNT_CHANGE", targetId);
  });

  it("rejects a target that is not a UUID", async () => {
    expect((await POST(request({ targetId: "not-a-uuid" }))).status).toBe(400);
    expect(requestSensitiveOtp).not.toHaveBeenCalled();
  });
});
