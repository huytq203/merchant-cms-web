import { z } from "zod";

export const merchantUserStatusSchema = z.enum(["PENDING", "ACTIVE", "LOCKED"]);
export const scopeProposalStatusSchema = z.enum(["PENDING_APPROVAL", "APPROVED", "REJECTED"]);

/**
 * The BE `MerchantUserPortalResponse`, field for field. Nothing is renamed, derived or filled in:
 * the BE sends no `status` and no `groupIds`, and `fullName` only if it adds the field (kept optional).
 * Jackson serializes the BE `isActive` and `isLocked` booleans as `active` and `locked`.
 */
export const merchantUserSchema = z.object({
  id: z.uuid(),
  keycloakUserId: z.string(),
  email: z.email(),
  fullName: z.string().nullish(),
  phone: z.string().nullable(),
  active: z.boolean(),
  locked: z.boolean(),
  groups: z.array(z.uuid()),
  merchantIds: z.array(z.uuid()),
  subMerchantIds: z.array(z.uuid()),
  rolesText: z.string(),
  createdAt: z.string(),
});

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

export const SCOPE_REASON_MIN_LENGTH = 10;

/** Body of a request to change a user's sub-merchant scope; the BE queues it for approval. */
export const scopeProposalFormSchema = z.object({
  subMerchantIds: z.array(z.uuid()).default([]),
  reason: z.string().trim().min(SCOPE_REASON_MIN_LENGTH, `Nhập tối thiểu ${SCOPE_REASON_MIN_LENGTH} ký tự`).max(500),
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
export type ScopeProposalFormValues = z.input<typeof scopeProposalFormSchema>;
export type UserFormValues = z.input<typeof userFormSchema>;
