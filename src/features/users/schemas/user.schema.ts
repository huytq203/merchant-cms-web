import { z } from "zod";

export const merchantUserStatusSchema = z.enum(["PENDING", "ACTIVE", "LOCKED"]);
export const scopeProposalStatusSchema = z.enum(["PENDING_APPROVAL", "APPROVED", "REJECTED"]);

const merchantUserPortalSchema = z.object({
  id: z.uuid(),
  keycloakUserId: z.string(),
  email: z.email(),
  // Older BE builds do not return the full name yet, so it stays optional.
  fullName: z.string().nullish(),
  phone: z.string().nullable(),
  // Jackson serializes the BE `isActive` and `isLocked` booleans as `active` and `locked`.
  active: z.boolean(),
  locked: z.boolean(),
  groups: z.array(z.uuid()),
  merchantIds: z.array(z.uuid()),
  subMerchantIds: z.array(z.uuid()),
  rolesText: z.string(),
  createdAt: z.string(),
}).transform(({ active, locked, fullName, ...user }) => ({
  ...user,
  isActive: active,
  isLocked: locked,
  fullName: fullName?.trim() || user.email,
  status: locked ? "LOCKED" as const : active ? "ACTIVE" as const : "PENDING" as const,
  groupIds: user.groups,
}));

export const merchantUserSchema = merchantUserPortalSchema;

export const scopeProposalSchema = z.object({
  id: z.uuid(),
  merchantUserId: z.uuid(),
  status: scopeProposalStatusSchema,
  merchantIds: z.array(z.uuid()),
  subMerchantIds: z.array(z.uuid()),
  requestReason: z.string(),
  decisionReason: z.string().nullable(),
  createdAt: z.string(),
  decidedAt: z.string().nullable(),
});

export const userFormSchema = z.object({
  email: z.email("Email không hợp lệ"),
  fullName: z.string().trim().min(1, "Vui lòng nhập họ tên").max(255),
  phone: z.union([z.literal(""), z.string().regex(/^\+?[0-9]{9,15}$/, "Số điện thoại không hợp lệ")]).optional(),
  groupIds: z.array(z.string()).min(1, "Vui lòng chọn ít nhất một nhóm quyền"),
  merchantIds: z.array(z.string()).default([]),
  subMerchantIds: z.array(z.string()).default([]),
});

export type MerchantUser = z.infer<typeof merchantUserSchema>;
export type MerchantUserStatus = z.infer<typeof merchantUserStatusSchema>;
export type ScopeProposal = z.infer<typeof scopeProposalSchema>;
export type UserFormValues = z.input<typeof userFormSchema>;
