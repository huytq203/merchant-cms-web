import { z } from "zod";
import { sensitiveOtpSchema } from "@/lib/schemas/sensitive-otp";

export const withdrawalStatusSchema = z.enum([
  "PENDING",
  "FUNDS_RESERVING",
  "FUNDS_RESERVED",
  "BANK_SUBMITTING",
  "BANK_ACCEPTED",
  "BANK_REJECTED",
  // alias chuyển tiếp, gỡ sau 1 sprint: BE đã bỏ trạng thái này (thành PROCESSING), giữ để bản BE cũ vẫn parse được.
  "RECONCILIATION_REQUIRED",
  "LEDGER_CAPTURING",
  "FUNDS_RELEASING",
  "APPROVED",
  "REJECTED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const withdrawalStatusGroupSchema = z.enum(["PENDING", "PROCESSING", "COMPLETED", "REJECTED"]);

export const withdrawalRequestTypeSchema = z.enum(["MANUAL", "AUTO_SWEEP"]);

/**
 * GĐ6 (chi hộ): tiền của một Sub nằm ở hai ngăn. WALLET = "Số dư thu hộ ví" (lệnh gọi là "Yêu cầu chi tiền"),
 * OTHER = "Số dư thu-chi hộ khác" (lệnh gọi là "Lệnh rút"). Mỗi lệnh rút lấy tiền từ đúng một ngăn.
 */
export const withdrawalPocketSchema = z.enum(["WALLET", "OTHER"]);
export type WithdrawalPocket = z.infer<typeof withdrawalPocketSchema>;

/** A pocket value this FE does not know (a newer BE) reads as "no pocket" instead of failing the whole record. */
const optionalPocket = withdrawalPocketSchema.nullish().catch(null).transform((value) => value ?? null);

/**
 * Một dòng "Tiền nạp và hoàn trả" của lệnh rút ngăn thu-chi hộ khác (CC-02, 19/11): tiền nạp chi hộ / nạp để hoàn,
 * ngân hàng hoàn trả lệnh chi, hoàn trả ký quỹ đã được lấy vào lệnh. `sourceTypeLabel` do BE viết sẵn bằng tiếng Việt;
 * `included` là số đưa vào lệnh (có thể nhỏ hơn `availableAtCreation` ở lô cuối bị lấy một phần).
 */
export const withdrawalFundLineSchema = z.object({
  lotId: z.string(),
  sourceType: z.string(),
  sourceTypeLabel: z.string(),
  sourceCode: z.string().nullish().transform((value) => value ?? null),
  postedAt: z.string().nullish().transform((value) => value ?? null),
  availableAtCreation: z.number().int(),
  included: z.number().int(),
});
export type WithdrawalFundLine = z.infer<typeof withdrawalFundLineSchema>;

/** Every field of the BE `MerchantWithdrawalPortalResponse`; ledger, gateway and actor fields are not sent. */
const withdrawalRecordSchema = z.object({
  id: z.uuid(),
  merchantId: z.uuid(),
  transactionCode: z.string().nullish(),
  requestType: withdrawalRequestTypeSchema,
  amount: z.number().int().nonnegative(),
  fee: z.number().int().nonnegative().nullish(),
  /** Part of the amount set off against the Master's escrow (inside `amount`); missing from an older BE = 0. */
  setoffAmount: z.number().int().nonnegative().nullish(),
  /** What the bank pays out (BE `receivedAmount`): DEDUCT = amount − setoff − fee, ADD_ON = amount − setoff. */
  receivedAmount: z.number().int().nullish(),
  /** DEDUCT: fee inside the amount (every Sub request); ADD_ON: fee charged on top (old requests, column default). */
  payoutFeeMode: z.string().nullish(),
  currency: z.string(),
  bankCode: z.string(),
  bankAccountNumber: z.string(),
  bankAccountName: z.string(),
  status: withdrawalStatusSchema,
  /** Ngăn lệnh lấy tiền; null/missing = lệnh trước GĐ6 (không phân nguồn). */
  pocket: optionalPocket,
  /** Tên gọi lệnh theo ngăn do BE viết ("Yêu cầu chi tiền" / "Lệnh rút"); null cho lệnh cũ. */
  pocketLabel: z.string().nullish(),
  /** CC-02: chỉ ở chi tiết lệnh ngăn khác; null ở danh sách, lệnh ngăn ví và BE cũ. */
  fundsTotal: z.number().int().nullish(),
  funds: z.array(withdrawalFundLineSchema).nullish(),
  bankRefId: z.string().nullish(),
  reason: z.string().nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
});

/** What the browser needs. BE already masks the account number, so it is passed through (masking again would hide it all). */
export const withdrawalResponseSchema = withdrawalRecordSchema.transform((record) => ({
  id: record.id,
  merchantId: record.merchantId,
  transactionCode: record.transactionCode ?? null,
  requestType: record.requestType,
  amount: record.amount,
  fee: record.fee ?? null,
  setoffAmount: record.setoffAmount ?? 0,
  netReceived: record.receivedAmount ?? null,
  // Unknown or missing mode reads as ADD_ON, like BE (MerchantWithdrawalRequestMapper.receivedAmount) and the DB default.
  payoutFeeMode: record.payoutFeeMode === "DEDUCT" ? ("DEDUCT" as const) : ("ADD_ON" as const),
  currency: record.currency,
  bankCode: record.bankCode,
  bankAccountMasked: record.bankAccountNumber,
  bankAccountName: record.bankAccountName,
  status: record.status,
  pocket: record.pocket,
  pocketLabel: record.pocketLabel ?? null,
  fundsTotal: record.fundsTotal ?? null,
  funds: record.funds ?? null,
  bankRefId: record.bankRefId ?? null,
  reason: record.reason ?? null,
  createdAt: record.createdAt ?? null,
  updatedAt: record.updatedAt ?? null,
}));

/**
 * SRS v2 (18/11/2026): mỗi Sub đúng 1 TK nên lệnh rút gắn với Sub (`subMerchantId` bắt buộc — một TK có thể dùng chung
 * nhiều Sub). `bankAccountId` tùy chọn: nếu gửi phải đúng TK đang gán cho Sub, BE kiểm và trả 400 nếu sai.
 */
export const withdrawalFormSchema = z.object({
  subMerchantId: z.uuid("Chọn Sub-merchant"),
  bankAccountId: z.uuid("Tài khoản nhận tiền không hợp lệ").optional(),
  /**
   * Nguồn tiền của lệnh (GĐ6). Luồng tạo lệnh luôn gửi; BE từ chối 6336 nếu thiếu nên schema không ép ở tầng BFF
   * (để lệnh phát lại cũ vẫn đi qua) mà để BE trả câu tiếng Việt.
   */
  pocket: withdrawalPocketSchema.optional(),
  amount: z.coerce
    .number<number>("Số tiền không hợp lệ")
    .int("Số tiền phải là số nguyên")
    .min(1, "Số tiền phải lớn hơn 0")
    .max(Number.MAX_SAFE_INTEGER, "Số tiền quá lớn"),
  reason: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự").optional(),
});

/** The browser sends the key so a retried request replays the same BE record instead of making a second one. */
export const withdrawalCreateBodySchema = withdrawalFormSchema.extend({
  idempotencyKey: z.string().trim().min(1, "Thiếu mã chống gửi trùng").max(100),
  otp: sensitiveOtpSchema,
  /** Sent only after the merchant accepted a request that pays out nothing. */
  confirmZeroNet: z.boolean().optional(),
});

/**
 * Số liệu rút của MỘT ngăn (BE `PocketWithdrawalView`). `withdrawableAmount` là số lệnh sẽ đòi (đã cắt theo trần ngăn);
 * `overdraft`, `disbursementReserved`, `displayBalance` chỉ có ở ngăn OTHER (WALLET = null), `displayBalance` có thể âm.
 */
export const pocketWithdrawalViewSchema = z.object({
  pocket: withdrawalPocketSchema,
  orderLabel: z.string(),
  balanceLabel: z.string(),
  available: z.number().int(),
  readyAmount: z.number().int().nonnegative(),
  withdrawableAmount: z.number().int().nonnegative(),
  setoff: z.number().int().nonnegative(),
  fee: z.number().int().nonnegative().nullish().transform((value) => value ?? null),
  netReceived: z.number().int().nullish().transform((value) => value ?? null),
  zeroNet: z.boolean(),
  escrowShortfallBefore: z.number().int().nonnegative().nullish().transform((value) => value ?? null),
  escrowShortfallAfter: z.number().int().nonnegative().nullish().transform((value) => value ?? null),
  blocker: z.string().nullish().transform((value) => value ?? null),
  blockerMessage: z.string().nullish().transform((value) => value ?? null),
  disbursementReserved: z.number().int().nullish().transform((value) => value ?? null),
  overdraft: z.number().int().nullish().transform((value) => value ?? null),
  displayBalance: z.number().int().nullish().transform((value) => value ?? null),
  /** CC-02: phần tiền nạp / hoàn trả đã nằm trong `withdrawableAmount` (chỉ ngăn OTHER; null ở ngăn ví và BE cũ). */
  fundsAmount: z.number().int().nullish().transform((value) => value ?? null),
});

export type PocketWithdrawalView = z.infer<typeof pocketWithdrawalViewSchema>;

/** Mã `blocker` BE gửi khi dư nợ Trả sau phủ hết khả dụng ngăn khác (lỗi 6331 nếu vẫn gửi lệnh). */
export const OVERDRAFT_OUTSTANDING_BLOCKER = "OVERDRAFT_OUTSTANDING";

/**
 * `pockets` đọc từng ngăn BE gửi; khoá lạ hoặc ngăn hỏng bị bỏ để một ngăn lạ không làm hỏng cả màn. BE cũ (hoặc
 * wallet-core chưa trả ngăn) không gửi/gửi rỗng → {} và màn rút quay về số cũ.
 */
const pocketsSchema = z
  .record(z.string(), z.unknown())
  .nullish()
  .transform((raw) => {
    const out: Partial<Record<WithdrawalPocket, PocketWithdrawalView>> = {};
    for (const key of withdrawalPocketSchema.options) {
      const parsed = pocketWithdrawalViewSchema.safeParse(raw?.[key]);
      if (parsed.success) out[key] = parsed.data;
    }
    return out;
  });

const nullableCount = z.number().int().nonnegative().nullish().transform((value) => value ?? null);

/**
 * What one Sub can withdraw now (`MerchantWithdrawalBalanceResponse`). `readyAmount` is the amount the next
 * request must carry; `netReceived` is `readyAmount - setoff - fee`. A limit is null when no ceiling applies.
 */
export const withdrawalBalanceSchema = z.object({
  subMerchantId: z.uuid(),
  availableBalance: z.number().int().nonnegative(),
  heldBalance: z.number().int().nonnegative(),
  pendingSettlement: z.number().int().nonnegative(),
  readyAmount: z.number().int().nonnegative(),
  setoff: z.number().int().nonnegative(),
  /**
   * null (11/11) when no account is chosen yet and the Sub has no default one (`blocker` = BANK_ACCOUNT_REQUIRED): the
   * fee depends on the account's bank, so BE does not guess it. `netReceived` is null together with it.
   */
  fee: z.number().int().nonnegative().nullable(),
  netReceived: z.number().int().nullable(),
  zeroNet: z.boolean(),
  dailyLimitRemaining: nullableCount,
  dailyCountRemaining: nullableCount,
  minimumAmount: nullableCount,
  maximumAmount: nullableCount,
  /**
   * Rút tự động (chốt 03/11/2026): true when the Sub's effective settlement mode is "Tự động theo chu kỳ". The system
   * makes the AUTO_SWEEP requests and BE refuses a manual one (5782), so the screen blocks it up front. A BE that does
   * not send the field yet is read as manual.
   */
  automaticSettlement: z.boolean().nullish().transform((value) => value ?? false),
  asOf: z.string(),
  /**
   * Cấn trừ ký quỹ (10/11/2026): how much the Master's escrow is short before this request, and what is still short
   * after its setoff (carried to the next withdrawal). 0 when set-off is off; null when nothing is ready (BE did not read
   * the escrow) or when the BE does not send them yet.
   */
  escrowShortfallBefore: nullableCount,
  escrowShortfallAfter: nullableCount,
  /**
   * Why BE would refuse a request although money is ready, e.g. `FEE_EXCEEDS_REMAINDER` (what is left after the setoff
   * cannot pay the fee) or `BANK_ACCOUNT_REQUIRED` (choose a receiving account first). `blockerMessage` is the Vietnamese sentence to show. Both null when nothing blocks.
   */
  blocker: z.string().nullish().transform((value) => value ?? null),
  blockerMessage: z.string().nullish().transform((value) => value ?? null),
  /** Ngăn đã hỏi (query `pocket`); có thì các số cấp trên là của ngăn đó. null = không hỏi ngăn / BE cũ. */
  pocket: optionalPocket,
  /** Số liệu từng ngăn; {} khi BE chưa tách ngăn. */
  pockets: pocketsSchema,
});

/** The code is issued for one (Sub, amount) pair; the account id is optional (v2: BE reads the Sub's assigned account). */
export const withdrawalOtpChallengeBodySchema = z.object({
  subMerchantId: z.uuid("Chọn Sub-merchant"),
  bankAccountId: z.uuid("Tài khoản nhận tiền không hợp lệ").optional(),
  /** Mã chỉ dùng được cho đúng ngăn đã phát (OTP gắn ngăn); Portal và Admin dựng context bằng cùng một hàm ở BE. */
  pocket: withdrawalPocketSchema.optional(),
  amount: z.number().int("Số tiền phải là số nguyên").min(1, "Số tiền phải lớn hơn 0").max(Number.MAX_SAFE_INTEGER),
});

export type WithdrawalOtpChallengeBody = z.infer<typeof withdrawalOtpChallengeBodySchema>;

export type WithdrawalStatus = z.infer<typeof withdrawalStatusSchema>;
export type WithdrawalStatusGroup = z.infer<typeof withdrawalStatusGroupSchema>;
export type WithdrawalBalance = z.infer<typeof withdrawalBalanceSchema>;
export type Withdrawal = z.infer<typeof withdrawalResponseSchema>;
export type WithdrawalFormValues = z.input<typeof withdrawalFormSchema>;
export type WithdrawalFormData = z.output<typeof withdrawalFormSchema>;
export type WithdrawalCreateBody = z.output<typeof withdrawalCreateBodySchema>;
