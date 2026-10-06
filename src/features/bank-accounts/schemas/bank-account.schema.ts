import { z } from "zod";

export const bankStatusSchema = z.enum(["ACTIVE", "INACTIVE", "VERIFIED"]);
export const bankLinkStatusSchema = z.enum(["PENDING_VERIFICATION", "LINKED", "LINK_FAILED"]);
/** Mirrors the BE MerchantHierarchyLevel. */
export const bankHierarchyLevelSchema = z.enum(["SYSTEM_DEFAULT", "MASTER", "SUB", "TERMINAL"]);
export const bankChangeStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const bankAccountSchema = z.object({
  id: z.uuid(),
  version: z.number().int().nonnegative(),
  merchantId: z.uuid(),
  subMerchantId: z.uuid().nullish(),
  level: bankHierarchyLevelSchema.optional(),
  bankCode: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
  branchName: z.string().nullish(),
  isDefault: z.boolean().nullish(),
  default: z.boolean().nullish(),
  status: bankStatusSchema,
  linkStatus: bankLinkStatusSchema,
  payable: z.boolean().optional(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
}).transform(({ isDefault, default: dtoDefault, ...account }) => ({
  ...account,
  isDefault: isDefault ?? dtoDefault ?? false,
}));

export const bankChangeRequestSchema = z.object({
  id: z.uuid(),
  bankAccountId: z.uuid(),
  changeType: z.string(),
  status: bankChangeStatusSchema,
  decisionReason: z.string().nullish(),
  requestReason: z.string().nullish(),
}).passthrough();

export const bankUpdateResponseSchema = z.object({
  account: bankAccountSchema,
  applied: z.boolean(),
  pendingChangeRequest: bankChangeRequestSchema.nullish(),
});

export const bankCreateResponseSchema = z.union([
  bankUpdateResponseSchema,
  bankAccountSchema.transform((account) => ({ account, applied: true, pendingChangeRequest: null })),
]);

export const sensitiveOtpChallengeSchema = z.object({
  otpSessionId: z.string().min(1),
  maskedRecipient: z.string(),
  expiresInSeconds: z.number().nonnegative(),
  canResendAfterSeconds: z.number().nonnegative(),
});
