import { z } from "zod";
import { inheritedFieldSchema, lockSourceSchema, subMerchantStatusSchema } from "@/lib/be/node-schemas";

export const terminalTypeSchema = z.enum(["POS", "ONLINE", "QR"]);

export const terminalSummarySchema = z.object({
  id: z.uuid(),
  tid: z.string(),
  name: z.string(),
  terminalType: terminalTypeSchema,
  address: z.string().nullish(),
  status: subMerchantStatusSchema,
  lockSource: lockSourceSchema.nullish(),
  subMerchantId: z.uuid(),
  subMerchantCode: z.string().nullish(),
  subMerchantName: z.string().nullish(),
  merchantId: z.uuid(),
  contactPhone: inheritedFieldSchema(z.string()).nullish(),
  createdAt: z.string().nullish(),
});

export const terminalDetailSchema = terminalSummarySchema.extend({
  contactPerson: z.string().nullish(),
  note: z.string().nullish(),
  merchantCode: z.string().nullish(),
  merchantName: z.string().nullish(),
  typeChangeWarning: z.string().nullish(),
  updatedAt: z.string().nullish(),
});

export const terminalFormSchema = z.object({
  subMerchantId: z.uuid(),
  name: z.string().trim().min(1, "Tên Terminal là bắt buộc").max(100),
  terminalType: terminalTypeSchema,
  address: z.string().trim().max(400),
  contactPerson: z.string().trim().max(50),
  inheritContactPhone: z.boolean(),
  contactPhone: z.string().trim().max(15),
  note: z.string().trim().max(500),
}).superRefine((value, context) => {
  if (value.terminalType === "POS" && !value.address) {
    context.addIssue({ code: "custom", path: ["address"], message: "Địa chỉ là bắt buộc cho POS" });
  }
  if (!value.inheritContactPhone && !value.contactPhone) {
    context.addIssue({ code: "custom", path: ["contactPhone"], message: "Nhập số điện thoại hoặc chọn kế thừa" });
  }
});

export type TerminalFormValues = z.infer<typeof terminalFormSchema>;
