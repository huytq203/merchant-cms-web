import { z } from "zod";

/**
 * Hợp đồng màn "Hiển thị cho khách" theo BE flex.merchant (`CustomerDisplayContracts`, bàn giao 12/11/2026):
 * - Mở màn đơn: `{ displayToken, tokenExpiresAt, orderId, orderCode, qrPayload, shop, amount, fee, feeBearer, payableAmount, expiresAt }`.
 * - Mở màn QR tĩnh: `{ displayToken, tokenExpiresAt, staticQrId, code, qrPayload, shop }`.
 * - BE sẽ thêm `kind` (ORDER/STATIC_QR) cho cả hai; khi thiếu, FE suy theo đường mở màn (xem `withKind`).
 */

/** Cửa hàng in trên màn; tên hiển thị là tên Sub, không có thì tên Master. */
const shopSchema = z
  .object({
    merchantName: z.string().nullish(),
    subMerchantCode: z.string().nullish(),
    subMerchantName: z.string().nullish(),
    terminalName: z.string().nullish(),
  })
  .nullish()
  .transform((shop) => ({
    name: shop?.subMerchantName || shop?.merchantName || "Cửa hàng",
    terminalName: shop?.terminalName ?? null,
  }));

export const displayKindSchema = z.enum(["ORDER", "STATIC_QR"]);

/** MERCHANT = cửa hàng chịu phí (ẩn dòng phí); SENDER = khách chịu phí (hiện Đơn + Phí = Tổng). */
export const feeBearerSchema = z.enum(["MERCHANT", "SENDER"]);

export const customerDisplaySchema = z
  .object({
    kind: displayKindSchema.optional(),
    /** Token ký HMAC chỉ đọc được trạng thái đúng đơn/mã này. */
    displayToken: z.string().min(1),
    tokenExpiresAt: z.string().nullish(),
    /** VietQR của đơn (null nếu đơn chưa có QR) hoặc chuỗi EMVCo của mã tĩnh. */
    qrPayload: z.string().nullish(),
    shop: shopSchema,
    // Màn đơn
    orderId: z.string().nullish(),
    orderCode: z.string().nullish(),
    amount: z.number().int().nonnegative().nullish(),
    fee: z.number().int().nonnegative().nullish(),
    feeBearer: feeBearerSchema.nullish(),
    payableAmount: z.number().int().nonnegative().nullish(),
    expiresAt: z.string().nullish(),
    // Màn QR tĩnh
    staticQrId: z.string().nullish(),
    code: z.string().nullish(),
  })
  .transform((data) => ({
    ...data,
    // Một khóa dùng chung cho phần hiển thị và chọn Flexie: mã đơn, hoặc mã SQ… của QR tĩnh.
    displayCode: data.orderCode ?? data.code ?? null,
  }));

/**
 * `status`: WAITING | PAID | EXPIRED | CANCELLED | FAILED. Với QR tĩnh, PAID nghĩa là có một lần trả trong 10 giây
 * gần nhất (kèm `orderCode`, `paidAmount`); CANCELLED nghĩa là mã đã bị tắt hoặc xoay. Trường null bị BE bỏ khỏi JSON.
 */
export const customerDisplayStatusSchema = z.object({
  status: z.string().min(1),
  orderStatus: z.string().nullish(),
  orderCode: z.string().nullish(),
  paidAt: z.string().nullish(),
  paidAmount: z.number().int().nonnegative().nullish(),
  /** FLEXPAY_WALLET (ví) hoặc QR (chuyển khoản ngân hàng). */
  paymentMethod: z.string().nullish(),
});

type ParsedDisplay = z.output<typeof customerDisplaySchema>;
export type DisplayKind = z.infer<typeof displayKindSchema>;
export type CustomerDisplay = Omit<ParsedDisplay, "kind"> & { kind: DisplayKind };
export type CustomerDisplayStatus = z.output<typeof customerDisplayStatusSchema>;

/** Dùng `kind` của BE nếu có; BE chưa trả thì suy theo đường mở màn (đơn hay mã QR tĩnh). */
export function withKind(display: ParsedDisplay, fallback: DisplayKind): CustomerDisplay {
  return { ...display, kind: display.kind ?? fallback };
}
