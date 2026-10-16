import { beforeEach, describe, expect, it, vi } from "vitest";
import { orderId, pendingRefund, subId } from "@/features/revenue-refunds/test/fixtures";

const { getServerSession, listRevenueRefunds, createRevenueRefund } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listRevenueRefunds: vi.fn(),
  createRevenueRefund: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/revenue-refunds/revenue-refund.service", () => ({ listRevenueRefunds, createRevenueRefund }));
import { GET, POST } from "../route";

const session = { permissions: ["VIEW_REFUND", "CREATE_REFUND"], merchantIds: ["m"], subMerchantIds: [subId] };
const otp = { otpSessionId: "otp-1", otp: "123456" };
const body = {
  orderId, amount: 40_000, reason: "Khách trả hàng, đã xác nhận", beneficiaryBankCode: "VCB",
  beneficiaryAccountNumber: "0123456789", beneficiaryAccountName: "NGUYEN VAN A", sensitiveOtp: otp,
};
const get = (query = "") => GET(new Request(`http://localhost/api/v1/admin/revenue-refunds${query}`));
const post = (payload: unknown) => POST(new Request("http://localhost/api/v1/admin/revenue-refunds", { method: "POST", body: JSON.stringify(payload) }));

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session);
  listRevenueRefunds.mockResolvedValue({ success: true, data: [pendingRefund] });
  createRevenueRefund.mockResolvedValue({ success: true, data: pendingRefund });
});

describe("revenue refunds collection route", () => {
  it("lists only with VIEW_REFUND and forwards the filter", async () => {
    const response = await get(`?status=PENDING_APPROVAL&orderId=${orderId}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ rows: [pendingRefund] });
    expect(listRevenueRefunds).toHaveBeenCalledWith({ status: "PENDING_APPROVAL", orderId });
    getServerSession.mockResolvedValue({ ...session, permissions: ["CREATE_REFUND"] });
    expect((await get()).status).toBe(403);
  });

  it("creates only with CREATE_REFUND and a complete OTP", async () => {
    expect((await post(body)).status).toBe(201);
    expect(createRevenueRefund).toHaveBeenCalledWith(body);
    expect((await post({ ...body, sensitiveOtp: { otpSessionId: "otp-1", otp: "" } })).status).toBe(400);
    getServerSession.mockResolvedValue({ ...session, permissions: ["VIEW_REFUND"] });
    expect((await post(body)).status).toBe(403);
    expect(createRevenueRefund).toHaveBeenCalledTimes(1);
  });

  it("keeps the BE code so the dialog can tell a wrong OTP from a refund limit", async () => {
    createRevenueRefund.mockResolvedValue({ success: false, error: { status: 400, code: "MERCHANT_REFUND_EXCEEDS_PAYMENT", message: "Có thể hoàn tối đa 60.000 đồng cho giao dịch này" } });
    const response = await post(body);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Có thể hoàn tối đa 60.000 đồng cho giao dịch này", code: "MERCHANT_REFUND_EXCEEDS_PAYMENT" });
  });
});
