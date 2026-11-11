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

/**
 * Cấp quản lý của nhóm (BE `scopeLevel`, chốt 11/11): MASTER = người dùng thấy toàn bộ Merchant,
 * SUB = người dùng chỉ thấy các điểm bán được chọn khi tạo.
 */
export const groupScopeLevelSchema = z.enum(["MASTER", "SUB"]);

export const permissionCatalogSchema = z.array(z.object({
  code: z.string().min(1),
  category: z.string().min(1),
  /** False khi người đang đăng nhập chưa có quyền này nên BE sẽ không cho cấp; vắng mặt = không giới hạn. */
  grantable: z.boolean().optional(),
}));

export const permissionGroupSchema = z.object({
  id: z.uuid(),
  merchantId: z.uuid().nullable(),
  code: z.string().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  system: z.boolean().default(false),
  permissions: z.array(z.string()),
  /** Vắng mặt khi BE chưa có V99; BE coi nhóm như vậy là cấp Master. */
  scopeLevel: groupScopeLevelSchema.optional(),
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
  /** Thiếu thì coi là cấp Master, như BE. */
  scopeLevel: groupScopeLevelSchema.default("MASTER"),
});

export type PermissionCatalogItem = z.infer<typeof permissionCatalogSchema>[number];
export type PermissionGroup = z.infer<typeof permissionGroupSchema>;
export type PermissionGroupUser = z.infer<typeof permissionGroupUserSchema>;
export type GroupScopeLevel = z.infer<typeof groupScopeLevelSchema>;
export type PermissionGroupFormValues = z.infer<typeof permissionGroupFormSchema>;
