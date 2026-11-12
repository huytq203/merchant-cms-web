import { z } from "zod";
import { pageSchema } from "@/lib/be/envelope";
import { reasonBodySchema } from "@/lib/schemas/reason";

/**
 * Mã QR tĩnh FlexPay theo Sub (có thể gắn Terminal) — thiết kế QR ví FlexPay đợt 1, mục 5.2 (bảng
 * `merchant_static_qr_instruments`). Mỗi phạm vi (Sub, Terminal) chỉ một mã ACTIVE; xoay mã sinh bản mới và tắt bản cũ.
 */
export const staticQrStatusSchema = z.enum(["ACTIVE", "DISABLED"]);

export const staticQrSchema = z.object({
  id: z.uuid(),
  subMerchantId: z.uuid(),
  subMerchantCode: z.string().nullish(),
  subMerchantName: z.string().nullish(),
  terminalId: z.uuid().nullish(),
  terminalCode: z.string().nullish(),
  terminalName: z.string().nullish(),
  /** `SQ` + 10 ký tự base32, không đoán được. */
  code: z.string(),
  qrPayload: z.string(),
  version: z.number().int().nullish(),
  status: staticQrStatusSchema,
  effectiveFrom: z.string().nullish(),
  effectiveTo: z.string().nullish(),
  disabledReason: z.string().nullish(),
  createdAt: z.string().nullish(),
});

/** BE chưa chốt danh sách trả mảng hay Page: nhận cả hai, luôn trả mảng. */
export const staticQrListSchema = z.union([
  z.array(staticQrSchema),
  pageSchema(staticQrSchema).transform((page) => page.content),
]);

export const staticQrCreateSchema = z.object({
  subMerchantId: z.uuid("Chọn Sub-merchant"),
  terminalId: z.uuid().optional(),
});

/** Tắt mã dùng chung quy tắc lý do 10–500 ký tự với các thao tác khóa của Portal. */
export const staticQrDisableSchema = reasonBodySchema;

export type StaticQr = z.infer<typeof staticQrSchema>;
export type StaticQrScope = { subMerchantId: string; terminalId?: string | null };
export type StaticQrCreate = z.infer<typeof staticQrCreateSchema>;
