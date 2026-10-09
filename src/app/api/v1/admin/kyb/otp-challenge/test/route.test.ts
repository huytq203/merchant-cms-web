import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, requestKybOtp } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  requestKybOtp: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/kyb/kyb.service", () => ({ requestKybOtp }));

import { POST } from "../route";

const challenge = { otpSessionId: "s-1", maskedRecipient: "ow***@example.com", expiresInSeconds: 300, canResendAfterSeconds: 60 };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: ["11111111-1111-4111-8111-111111111111"], permissions: [] });
  requestKybOtp.mockResolvedValue({ success: true, data: challenge });
});

describe("KYB OTP challenge route", () => {
  it("returns 401 without a session", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await POST()).status).toBe(401);
    expect(requestKybOtp).not.toHaveBeenCalled();
  });

  it("returns the challenge for a signed-in merchant user", async () => {
    const response = await POST();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(challenge);
  });

  it("keeps a BE refusal as an error response", async () => {
    requestKybOtp.mockResolvedValue({
      success: false,
      error: { status: 400, code: "MERCHANT_SENSITIVE_OTP_ISSUE_FAILED", message: "Không gửi được OTP" },
    });
    expect((await POST()).status).toBe(400);
  });
});
