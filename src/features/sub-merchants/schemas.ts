import { z } from "zod";
import { inheritedFieldSchema, lockSourceSchema, subMerchantStatusSchema } from "@/lib/be/node-schemas";

export { inheritedFieldSchema, lockSourceSchema, subMerchantStatusSchema } from "@/lib/be/node-schemas";

/**
 * Summary row from `GET /api/v1/merchant/sub-merchants` (and the admin list, same shape plus extras).
 * The merchant DTO is a Lombok bean with `private boolean isDefault`, which Jackson serialises as
 * `default`; the admin record keeps `isDefault`. Accept both and expose one `isDefault`.
 */
export const subMerchantSummarySchema = z
  .object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    status: subMerchantStatusSchema,
    isDefault: z.boolean().optional(),
    default: z.boolean().optional(),
    lockSource: lockSourceSchema.nullish(),
    merchantId: z.uuid().nullish(),
    merchantCode: z.string().nullish(),
    merchantName: z.string().nullish(),
    phone: inheritedFieldSchema(z.string()).nullish(),
    createdAt: z.string().nullish(),
    /** Overview columns of the Portal list (BE `MerchantSubMerchantSummaryResponse`); absent on an older BE and in the admin shape. */
    businessField: z.string().nullish(),
    terminalCount: z.number().int().nullish(),
    /** Always POS / ONLINE / QR when present. */
    terminalCountByType: z.record(z.string(), z.number().int()).nullish(),
    /** The Sub's receiving account with the number already masked by the BE; null when it has none. */
    settlementBankAccount: z
      .object({
        bankCode: z.string(),
        maskedAccountNo: z.string().nullish(),
        linkStatus: z.enum(["PENDING_VERIFICATION", "LINKED", "LINK_FAILED"]),
      })
      .nullish(),
    /** Gross revenue of the last 7 days from the settlement lines (VND, before fees and refunds). */
    revenue7d: z.number().nullish(),
  })
  .transform(({ default: legacyDefault, isDefault, ...rest }) => ({
    ...rest,
    isDefault: isDefault ?? legacyDefault ?? false,
  }));

/** `MerchantSubMerchantDetailResponse`: a record, so the key is `isDefault`; createdBy/updatedBy are not sent. */
export const subMerchantDetailSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  businessField: z.string().nullish(),
  status: subMerchantStatusSchema,
  isDefault: z.boolean(),
  lockSource: lockSourceSchema.nullish(),
  merchantId: z.uuid(),
  merchantCode: z.string().nullish(),
  merchantName: z.string().nullish(),
  legalName: z.string().nullish(),
  taxCode: z.string().nullish(),
  legalRepresentativeName: z.string().nullish(),
  taxCodeEditable: z.boolean(),
  phone: inheritedFieldSchema(z.string()),
  address: inheritedFieldSchema(z.string()),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
  /** Only a create response carries these; a later read returns null for both. */
  settlementBankAccountId: z.uuid().nullish(),
  settlementBankAccountWarning: z.string().nullish(),
});

export const subMerchantFilterSchema = z.object({
  code: z.string().max(100).optional(),
  name: z.string().max(100).optional(),
  status: subMerchantStatusSchema.optional(),
  hasBankAccount: z.boolean().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
});

export const subMerchantFormSchema = z
  .object({
    name: z.string().trim().min(1, "Tên Sub-merchant là bắt buộc").max(255, "Tối đa 255 ký tự"),
    businessField: z.string().trim().max(100, "Tối đa 100 ký tự"),
    inheritPhone: z.boolean(),
    phone: z.string().trim().max(15, "Tối đa 15 ký tự"),
    inheritAddress: z.boolean(),
    address: z.string().trim().max(500, "Tối đa 500 ký tự"),
  })
  .superRefine((value, ctx) => {
    if (!value.inheritPhone && value.phone === "") {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Nhập số điện thoại hoặc chọn kế thừa" });
    }
    if (!value.inheritAddress && value.address === "") {
      ctx.addIssue({ code: "custom", path: ["address"], message: "Nhập địa chỉ hoặc chọn kế thừa" });
    }
  });

export type SubMerchantFilterValues = z.infer<typeof subMerchantFilterSchema>;
export type SubMerchantFormValues = z.infer<typeof subMerchantFormSchema>;
