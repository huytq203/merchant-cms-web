import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, requestWithdrawalOtp } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  requestWithdrawalOtp: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/withdrawals/withdrawal.service", () => ({ requestWithdrawalOtp }));
import { POST } from "../route";

const session = (permissions: string[]) => ({ merchantIds: ["22222222-2222-4222-8222-222222222222"], subMerchantIds: [], permissions });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session(["CREATE_WITHDRAWAL"]));
  requestWithdrawalOtp.mockResolvedValue({
    success: true,
    data: { otpSessionId: "s", maskedRecipient: "a***@b.vn", expiresInSeconds: 300, canResendAfterSeconds: 60 },
  });
});

describe("withdrawal otp-challenge route", () => {
  it("needs CREATE_WITHDRAWAL, not just permission to view", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_WITHDRAWAL"]));
    expect((await POST()).status).toBe(403);
    getServerSession.mockResolvedValue(null);
    expect((await POST()).status).toBe(401);
    expect(requestWithdrawalOtp).not.toHaveBeenCalled();
  });

  it("asks for the code without taking an operation from the browser", async () => {
    const response = await POST();
    expect(response.status).toBe(200);
    expect(requestWithdrawalOtp).toHaveBeenCalledWith();
    expect(await response.json()).toMatchObject({ otpSessionId: "s" });
  });

  it("never answers 2xx for a failure", async () => {
    requestWithdrawalOtp.mockResolvedValue({ success: false, error: { status: 0, code: "NETWORK", message: "x" } });
    expect((await POST()).status).toBe(502);
  });
});
