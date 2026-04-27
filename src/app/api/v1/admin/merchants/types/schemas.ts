import { z } from "zod";

export const subMerchantBaseSchema = z.object({
  name: z.string().min(1, "Tên bắt buộc"),
  businessType: z.string().min(1, "Loại hình kinh doanh bắt buộc"),
  contact: z.string().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
  taxCode: z.string().default(""),
  representative: z.string().default(""),
  address: z.string().default(""),
  merchantId: z.string().optional(),
  accessKey: z.string().default(""),
  secretKey: z.string().default(""),
  webhookUrl: z.string().default(""),
  bankName: z.string().default(""),
  bankBranch: z.string().default(""),
  accountNumber: z.string().default(""),
  accountName: z.string().default(""),
  notifyEnabled: z.boolean().default(false),
  notifyTxSuccess: z.boolean().default(true),
  notifyTxFailed: z.boolean().default(false),
  notifyDispute: z.boolean().default(true),
  notifyFreeze: z.boolean().default(true),
  notifyPolicyChange: z.boolean().default(false),
  notifyEmails: z.string().default(""),
  eInvoiceEnabled: z.boolean().default(false),
  eInvoiceEmails: z.string().default(""),
});

export const createSubMerchantSchema = subMerchantBaseSchema;
export const updateSubMerchantSchema = subMerchantBaseSchema.partial();

export type CreateSubMerchantInput = z.infer<typeof createSubMerchantSchema>;
export type UpdateSubMerchantInput = z.infer<typeof updateSubMerchantSchema>;
