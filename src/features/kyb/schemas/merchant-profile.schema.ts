import { z } from "zod";
import { enterpriseWalletSchema, storedFileSchema } from "./enterprise-wallet.schema";

export const merchantStatusSchema = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "ACTIVE",
  "REJECTED",
  "LOCKED",
  "TERMINATED",
]);

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const merchantProfileSchema = z.object({
  id: z.uuid(),
  name: z.string().nullish(),
  code: z.string().nullish(),
  status: merchantStatusSchema,
  enterpriseWalletId: z.uuid().nullish(),
  enterpriseWallet: enterpriseWalletSchema.nullish(),
  legalName: z.string().nullish(),
  taxCode: z.string().nullish(),
  mccCode: z.string().nullish(),
  /** Tên ngành chuẩn do BE đặt theo `mccCode`; Portal không gửi lên. */
  businessCategory: z.string().nullish(),
  websiteUrl: z.string().nullish(),
  productDescription: z.string().nullish(),
  supportContact: z.string().nullish(),
  contractSignedWithSub: z.boolean().optional(),
  contractFile: storedFileSchema.nullish(),
  logoFile: storedFileSchema.nullish(),
  productImages: z.array(storedFileSchema).nullish(),
  rejectedReasonDetail: z.string().nullish(),
  rejectedAt: z.string().nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
});

/** Values of the ĐVCNTT form. `adminPassword` is deliberately absent. */
export const merchantFormSchema = z.object({
  mccCode: z.string().trim().min(1, "Nhập mã MCC").max(10, "MCC tối đa 10 ký tự"),
  name: z
    .string()
    .trim()
    .min(1, "Nhập tên hiển thị")
    .max(200, "Tối đa 200 ký tự")
    .regex(/^[^<>]*$/, "Tên không được chứa ký tự < hoặc >"),
  websiteUrl: z
    .string()
    .trim()
    .max(255, "Tối đa 255 ký tự")
    .regex(/^$|^https?:\/\/.+/, "Địa chỉ website phải bắt đầu bằng http:// hoặc https://"),
  supportContact: z.string().trim().min(1, "Nhập người liên hệ").max(50, "Tối đa 50 ký tự"),
  productDescription: optionalText(1000),
  contractSignedWithSub: z.boolean(),
});

export const merchantStagingSchema = z.object({
  logoStagingId: z.uuid().optional(),
  productImageStagingIds: z.array(z.uuid()).optional(),
  contractStagingId: z.uuid().optional(),
});

export const merchantStatusHistorySchema = z.object({
  auditLogId: z.string().nullish(),
  fromStatus: merchantStatusSchema.nullish(),
  // Null when the audit snapshot has no readable status; the BE keeps the row as evidence.
  toStatus: merchantStatusSchema.nullish(),
  reason: z.string().nullish(),
  rejectedReasonDetail: z.string().nullish(),
  actorType: z.string().nullish(),
  occurredAt: z.string().nullish(),
});

export const merchantRejectionReasonSchema = z.object({
  code: z.string(),
  label: z.string().optional(),
  defaultNote: z.string().nullish(),
});
