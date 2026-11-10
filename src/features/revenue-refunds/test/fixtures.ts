/** BE revenue refunds shared by this feature's tests. */
export const orderId = "7c1f2a3e-1111-4222-8333-444455556666";
export const pendingId = "0b6f5f0e-5a31-4c1e-9a4e-1d2f3a4b5c6d";
export const subId = "aaaaaaaa-0000-4000-8000-0000000000b2";

const base = {
  orderId,
  subMerchantId: subId,
  fullRefund: false,
  feeRefund: null,
  cancelledHold: null,
  fromAvailable: null,
  outcomeCode: null,
  payoutStatus: null,
  createdAt: "2026-10-13T02:20:00Z",
  createdSource: "PORTAL",
  createdBy: "user-creator",
};

export const pendingRefund = { ...base, id: pendingId, refundCode: "MRF7A21C3D8E4B90F11", amount: 120_000, fullRefund: true, status: "PENDING_APPROVAL", reason: "Giao sai sản phẩm" };
export const processingRefund = { ...base, id: "11111111-2222-4333-8444-555555555555", refundCode: "MRF55D0A9B1C2E3F4A07", amount: 80_000, status: "PROCESSING", feeRefund: 880, reason: "Khách hủy một món" };
export const succeededRefund = {
  ...base, id: "22222222-3333-4444-8555-666666666666", refundCode: "MRF0B6F5F0E5A311C4E", amount: 40_000, status: "SUCCEEDED",
  feeRefund: 440, cancelledHold: 0, fromAvailable: 40_000, outcomeCode: "OK", payoutStatus: "PENDING", reason: "Khách trả hàng",
};
export const queuedRefund = { ...base, id: "33333333-4444-4555-8666-777777777777", refundCode: "MRF91E7B2C4D5A6F3809", amount: 300_000, status: "ACCOUNTING_QUEUE", outcomeCode: "INSUFFICIENT_AVAILABLE", reason: "Hoàn theo thỏa thuận" };

export const challengeFixture = { otpSessionId: "otp-1", maskedRecipient: "an•••@cuahang.vn", expiresInSeconds: 300, canResendAfterSeconds: 60 };
