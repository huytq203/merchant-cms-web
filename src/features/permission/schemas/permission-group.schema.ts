import { z } from "zod";

export const permissionCategorySchema = z.enum([
  "TRANSACTION",
  "REFUND",
  "DISPUTE",
  "ORDER",
  "FINANCE",
  "ADMINISTRATION",
  "WALLET",
  "APPROVAL",
  "SUB_MERCHANT_TERMINAL",
  "CONNECTION_PAYMENT",
  "FINANCIAL_TERMS",
  "ESCROW_HOLD",
]);

export const permissionCatalogSchema = z.array(z.object({
  code: z.string().min(1),
  category: z.string().min(1),
}));

export const permissionGroupSchema = z.object({
  id: z.uuid(),
  merchantId: z.uuid().nullable(),
  code: z.string().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  system: z.boolean().default(false),
  permissions: z.array(z.string()),
  createdAt: z.string().nullable(),
});

export const permissionGroupUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string(),
  status: z.string(),
});

export const permissionGroupFormSchema = z.object({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{1,49}$/, "Mã nhóm phải viết hoa, dài 2 đến 50 ký tự"),
  name: z.string().trim().min(1, "Tên nhóm là bắt buộc").max(255),
  description: z.string().trim().max(500),
  permissions: z.array(z.string().min(1)).min(1, "Chọn ít nhất một quyền"),
});

export type PermissionCatalogItem = z.infer<typeof permissionCatalogSchema>[number];
export type PermissionGroup = z.infer<typeof permissionGroupSchema>;
export type PermissionGroupUser = z.infer<typeof permissionGroupUserSchema>;
export type PermissionGroupFormValues = z.infer<typeof permissionGroupFormSchema>;
