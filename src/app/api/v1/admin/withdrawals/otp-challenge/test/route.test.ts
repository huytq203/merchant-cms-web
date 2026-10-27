import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, requestWithdrawalOtp } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  requestWithdrawalOtp: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/withdrawals/withdrawal.service", () => ({ requestWithdrawalOtp }));
import { POST } from "../route";

const bankAccountId = "44444444-4444-4444-8444-444444444444";
const session = (permissions: string[]) => ({ merchantIds: ["22222222-2222-4222-8222-222222222222"], subMerchantIds: [], permissions });
const call = (body: unknown = { bankAccountId, amount: 6_000_000 }) =>
  POST(new Request("http://localhost/api/v1/admin/withdrawals/otp-challenge", { method: "POST", body: JSON.stringify(body) }));

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
    expect((await call()).status).toBe(403);
    getServerSession.mockResolvedValue(null);
    expect((await call()).status).toBe(401);
    expect(requestWithdrawalOtp).not.toHaveBeenCalled();
  });

  it("forwards only the account and amount the code is tied to", async () => {
    const response = await call({ bankAccountId, amount: 6_000_000, operation: "OTHER", merchantId: "x" });
    expect(response.status).toBe(200);
    expect(requestWithdrawalOtp).toHaveBeenCalledWith({ bankAccountId, amount: 6_000_000 });
    expect(await response.json()).toMatchObject({ otpSessionId: "s" });
  });

  it("answers 400 for a missing, malformed or non-positive body without asking BE", async () => {
    expect((await call(null)).status).toBe(400);
    expect((await call({ amount: 10 })).status).toBe(400);
    expect((await call({ bankAccountId: "x", amount: 10 })).status).toBe(400);
    expect((await call({ bankAccountId, amount: 0 })).status).toBe(400);
    expect((await call({ bankAccountId, amount: 1.5 })).status).toBe(400);
    expect(requestWithdrawalOtp).not.toHaveBeenCalled();
  });

  it("never answers 2xx for a failure", async () => {
    requestWithdrawalOtp.mockResolvedValue({ success: false, error: { status: 0, code: "NETWORK", message: "x" } });
    expect((await call()).status).toBe(502);
  });
});
