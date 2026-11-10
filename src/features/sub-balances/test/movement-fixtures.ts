/** BE rows of `GET /sub-balances/{id}/movements` shared by the movement tests (contract 10/11/2026, 2.1 and 2.2). */
export const SUB_ID = "11111111-1111-4111-8111-111111111111";
export const OP_ORDER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
export const OP_WITHDRAWAL = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
export const OP_FREEZE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3";

export const orderMovement = {
  id: OP_ORDER,
  type: "ORDER",
  kind: "ORDER_SETTLED",
  label: "Đơn hàng · quyết toán",
  reference: "DH2611090070",
  occurredAt: "2026-11-10T00:05:00Z",
  amount: 1_330_200,
  balanceAfter: 8_714_500,
};

export const withdrawalMovement = {
  id: OP_WITHDRAWAL,
  type: "WITHDRAWAL",
  kind: "WITHDRAWAL_CREATED",
  label: "Lệnh rút",
  reference: null,
  occurredAt: "2026-11-09T08:00:00Z",
  amount: -2_000_000,
  balanceAfter: 7_384_300,
};

export const freezeMovement = {
  ...withdrawalMovement,
  id: OP_FREEZE,
  type: "FREEZE",
  kind: "FREEZE",
  label: "Đóng băng",
  amount: -500_000,
  reference: "DH2611080001",
};

/** A withdrawal row whose order was partly set off against the Master's escrow. */
export const setoffWithdrawalMovement = { ...withdrawalMovement, reference: "WD2611090001", amount: -1_568_000, setoffAmount: 1_000_000 };

/** Period totals the BE adds next to the page (10/11/2026). */
export const movementTotals = { openingBalance: 0, totalIn: 1_791_000, totalOut: 1_568_000, closingBalance: 223_000, totalsComplete: true };

/** A Spring page as the Merchant Portal BE returns it, with the period totals when given. */
export const movementPage = (content: unknown[], totalElements = content.length, number = 0, totals: Record<string, unknown> = {}) => ({
  success: true,
  data: { content, totalElements, totalPages: Math.max(1, Math.ceil(totalElements / 20)), number, size: 20, ...totals },
});

const line = (label: string, over: Record<string, unknown> = {}) => ({
  label, text: null, amount: null, signed: false, note: null, emphasis: false, indent: false, ...over,
});

export const orderDetail = {
  ...orderMovement,
  lines: [
    line("Thanh toán lúc", { text: "09/11/2026 14:52" }),
    line("Giá trị đơn hàng", { amount: 1_500_000 }),
    line("Phí giao dịch", { amount: -22_000, signed: true }),
    line("Tạm giữ theo quy tắc", { amount: 147_800, indent: true, note: "Giải phóng 17/11/2026" }),
    line("Quyết toán vào khả dụng", { amount: 1_330_200, signed: true, emphasis: true, indent: true }),
  ],
  link: { type: "ORDER", id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1", code: "DH2611090070" },
};
