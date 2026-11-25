import { z } from "zod";
import { TERMINAL_ADDRESS_MAX, terminalProvinces } from "./constants/terminal.constants";
import type { TerminalDetail } from "./types";
import { inheritedFieldSchema, lockSourceSchema, subMerchantStatusSchema } from "@/lib/be/node-schemas";

export const terminalTypeSchema = z.enum(["POS", "ONLINE", "QR"]);

export const terminalSummarySchema = z.object({
  id: z.uuid(),
  tid: z.string(),
  name: z.string(),
  terminalType: terminalTypeSchema,
  address: z.string().nullish(),
  /** Tỉnh/Thành phố của điểm bán; null với Terminal cũ và Terminal ONLINE. */
  province: z.string().nullish(),
  status: subMerchantStatusSchema,
  lockSource: lockSourceSchema.nullish(),
  subMerchantId: z.uuid(),
  subMerchantCode: z.string().nullish(),
  subMerchantName: z.string().nullish(),
  merchantId: z.uuid(),
  contactPhone: inheritedFieldSchema(z.string()).nullish(),
  createdAt: z.string().nullish(),
  /** Successful orders of the last 7 days, their total (VND) and the time of the latest one; list rows only. */
  txnCount7d: z.number().int().nullish(),
  txnAmount7d: z.number().nullish(),
  lastTxnAt: z.string().nullish(),
});

export const terminalDetailSchema = terminalSummarySchema.extend({
  contactPerson: z.string().nullish(),
  note: z.string().nullish(),
  merchantCode: z.string().nullish(),
  merchantName: z.string().nullish(),
  typeChangeWarning: z.string().nullish(),
  updatedAt: z.string().nullish(),
});

const baseFormSchema = z.object({
  subMerchantId: z.uuid("Chọn Sub-merchant"),
  name: z.string().trim().min(1, "Tên Terminal là bắt buộc").max(100),
  terminalType: terminalTypeSchema,
  address: z.string().trim(),
  province: z.string(),
  contactPerson: z.string().trim().max(50),
  inheritContactPhone: z.boolean(),
  contactPhone: z.string().trim(),
  note: z.string().trim().max(500),
});

const PHONE_PATTERN = /^0\d{9}$/;
const normalize = (value: string | null | undefined) => (value ?? "").trim();

type Baseline = Pick<TerminalDetail, "terminalType" | "address" | "province"> | null | undefined;

/**
 * Luật form theo BE (C-T1, C-T2). Khi sửa Terminal cũ chưa có tỉnh (`baseline` là bản đang sửa), chỉ bắt chọn tỉnh
 * và chỉ áp giới hạn 200 ký tự khi người dùng đổi địa chỉ hoặc đổi loại sang POS/QR, để vẫn sửa được các trường khác.
 */
export function terminalFormSchemaFor(baseline?: Baseline) {
  return baseFormSchema.superRefine((value, context) => {
    if (value.terminalType !== "ONLINE") {
      const address = normalize(value.address);
      const addressChanged = !baseline || address !== normalize(baseline.address);
      const typeChanged = !baseline || value.terminalType !== baseline.terminalType;
      if (!address) {
        context.addIssue({ code: "custom", path: ["address"], message: "Terminal POS/QR cần địa chỉ điểm bán" });
      } else if (addressChanged && address.length > TERMINAL_ADDRESS_MAX) {
        context.addIssue({ code: "custom", path: ["address"], message: "Địa chỉ tối đa 200 ký tự" });
      }
      if (!value.province) {
        // Terminal đã có tỉnh luôn được điền sẵn; chỉ Terminal cũ chưa có tỉnh được miễn khi không đổi gì.
        if (addressChanged || typeChanged || normalize(baseline?.province)) {
          context.addIssue({ code: "custom", path: ["province"], message: "Vui lòng chọn Tỉnh/Thành phố" });
        }
      } else if (!(terminalProvinces as readonly string[]).includes(value.province)) {
        context.addIssue({ code: "custom", path: ["province"], message: "Tỉnh/Thành phố không hợp lệ" });
      }
    }
    if (!value.inheritContactPhone) {
      if (!value.contactPhone) {
        context.addIssue({ code: "custom", path: ["contactPhone"], message: "Nhập số điện thoại hoặc dùng của Sub-merchant" });
      } else if (!PHONE_PATTERN.test(value.contactPhone)) {
        context.addIssue({ code: "custom", path: ["contactPhone"], message: "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0" });
      }
    }
  });
}

/** Schema cho Terminal tạo mới: mọi điều kiện đều áp dụng. */
export const terminalFormSchema = terminalFormSchemaFor(null);

export type TerminalFormValues = z.infer<typeof terminalFormSchema>;
