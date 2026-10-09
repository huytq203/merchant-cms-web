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
});

export const subMerchantFilterSchema = z.object({
  code: z.string().max(100).optional(),
  name: z.string().max(100).optional(),
  status: subMerchantStatusSchema.optional(),
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
