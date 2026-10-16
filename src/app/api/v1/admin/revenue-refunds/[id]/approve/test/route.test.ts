import { beforeEach, describe, expect, it, vi } from "vitest";
import { pendingId, processingRefund } from "@/features/revenue-refunds/test/fixtures";

const { getServerSession, approveRevenueRefund, requestApproveOtp } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  approveRevenueRefund: vi.fn(),
  requestApproveOtp: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/revenue-refunds/revenue-refund.service", () => ({ approveRevenueRefund, requestApproveOtp }));
import { POST as approve } from "../route";
import { POST as challenge } from "../../otp-challenge/route";

const context = (id = pendingId) => ({ params: Promise.resolve({ id }) });
const otp = { otpSessionId: "otp-1", otp: "123456" };
const request = (body?: unknown) => new Request("http://localhost", { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: ["APPROVE_REFUND"], merchantIds: ["m"], subMerchantIds: [] });
  approveRevenueRefund.mockResolvedValue({ success: true, data: processingRefund });
  requestApproveOtp.mockResolvedValue({ success: true, data: { otpSessionId: "otp-1", maskedRecipient: "a", expiresInSeconds: 300, canResendAfterSeconds: 60 } });
});

describe("revenue refund approval routes", () => {
  it("need APPROVE_REFUND; CREATE_REFUND alone is refused", async () => {
    getServerSession.mockResolvedValue({ permissions: ["CREATE_REFUND", "VIEW_REFUND"], merchantIds: ["m"], subMerchantIds: [] });
    expect((await challenge(request(), context())).status).toBe(403);
    expect((await approve(request({ sensitiveOtp: otp }), context())).status).toBe(403);
    expect(approveRevenueRefund).not.toHaveBeenCalled();
  });

  it("answer 404 for a malformed id", async () => {
    expect((await approve(request({ sensitiveOtp: otp }), context("..%2f"))).status).toBe(404);
    expect((await challenge(request(), context("..%2f"))).status).toBe(404);
  });

  it("issue a code bound to the refund, then approve with it", async () => {
    expect((await challenge(request(), context())).status).toBe(200);
    expect(requestApproveOtp).toHaveBeenCalledWith(pendingId);
    const response = await approve(request({ sensitiveOtp: otp }), context());
    expect(response.status).toBe(200);
    expect(approveRevenueRefund).toHaveBeenCalledWith(pendingId, otp);
  });

  it("refuses an approval without a complete code", async () => {
    expect((await approve(request({}), context())).status).toBe(400);
    expect(approveRevenueRefund).not.toHaveBeenCalled();
  });
});
