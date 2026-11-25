import { z } from "zod";
import { groupScopeLevelSchema } from "@/features/permission/schemas/permission-group.schema";

export const merchantUserStatusSchema = z.enum(["PENDING", "ACTIVE", "LOCKED"]);
export const scopeProposalStatusSchema = z.enum(["PENDING_APPROVAL", "APPROVED", "REJECTED"]);

/**
 * The BE `MerchantUserPortalResponse`, field for field. Nothing is renamed, derived or filled in:
 * the BE sends no `status` and no `groupIds`, and `fullName` only if it adds the field (kept optional).
 * Jackson serializes the BE `isActive` and `isLocked` booleans as `active` and `locked`.
 */
export const merchantUserSchema = z.object({
  id: z.uuid(),
  /** Bound only once the BE has provisioned the Keycloak account, so a new user has none yet. */
  keycloakUserId: z.string().nullish(),
  email: z.email(),
  fullName: z.string().nullish(),
  /** Trạng thái BE nếu có (chỉ để nhận ra bản nháp DRAFT của Admin, không hiện ở Portal). */
  status: z.string().nullish(),
  phone: z.string().nullable(),
  active: z.boolean(),
  locked: z.boolean(),
  groups: z.array(z.uuid()),
  /** Group names with their permission count (BE `groupSummaries`), so the list needs no extra group call. */
  groupSummaries: z.array(z.object({ id: z.uuid(), name: z.string(), permissionCount: z.number().int() })).optional(),
  merchantIds: z.array(z.uuid()),
  subMerchantIds: z.array(z.uuid()),
  rolesText: z.string(),
  createdAt: z.string(),
  /** True when the user no longer holds any merchant or sub-merchant, e.g. after a termination; an admin must reassign or lock them. */
  noMerchantScope: z.boolean().optional(),
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

/**
 * Answer to a scope change. Adding access waits for approval and carries the proposal id; a change that only
 * narrows the scope is applied at once (`APPROVED`) and has no proposal, so `id` is null.
 */
export const scopeChangeResultSchema = z.object({
  id: z.uuid().nullable(),
  status: scopeProposalStatusSchema.optional(),
});

/** The BE `MerchantAssignableGroupResponse`: only what a group picker needs, with permission names. */
export const assignableGroupSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  system: z.boolean(),
  permissions: z.array(z.string()),
  /** Cấp quản lý của nhóm; vắng mặt khi BE chưa có V99 thì màn tạo người dùng giữ cách chọn phạm vi cũ. */
  scopeLevel: groupScopeLevelSchema.optional(),
});

/** Body of PUT .../merchants and .../sub-merchants: the full target list of one scope axis. */
export const scopeAssignmentBodySchema = z.object({ ids: z.array(z.uuid()) }).strict();

/** Answer of those PUTs: a pending proposal (202) or a narrowing applied at once (200, `APPROVED`, `id` null). */
export const scopeAssignmentResultSchema = z.object({
  id: z.uuid().nullable(),
  merchantUserId: z.uuid(),
  status: scopeProposalStatusSchema,
  merchantIds: z.array(z.uuid()),
  subMerchantIds: z.array(z.uuid()),
  requestReason: z.string().nullish(),
  decisionReason: z.string().nullish(),
  createdAt: z.string().nullish(),
  decidedAt: z.string().nullish(),
});

export const SCOPE_REASON_MIN_LENGTH = 10;

/** Body of a request to change a user's sub-merchant scope; the BE queues it for approval. */
export const scopeProposalFormSchema = z.object({
  subMerchantIds: z.array(z.uuid()).default([]),
  reason: z.string().trim().min(SCOPE_REASON_MIN_LENGTH, `Nhập tối thiểu ${SCOPE_REASON_MIN_LENGTH} ký tự`).max(500),
});

/** Gộp khoảng trắng liên tiếp và cắt hai đầu, giống bước chuẩn hóa của BE. */
const collapseSpaces = (value: string) => value.trim().replace(/\s+/g, " ");

/** Viết hoa chữ cái đầu mỗi từ (giữ nguyên phần còn lại để không làm hỏng tên viết hoa sẵn). */
export const capitalizeWords = (value: string) =>
  value.replace(/(^|\s)(\p{L})/gu, (_match, space: string, letter: string) => space + letter.toLocaleUpperCase("vi"));

/** Chuẩn hóa họ tên khi rời ô: gộp khoảng trắng rồi viết hoa chữ đầu mỗi từ. */
export const normalizeFullName = (value: string) => capitalizeWords(collapseSpaces(value));

/** Họ tên (C-U2): 2-100 ký tự, chỉ chữ cái và khoảng trắng; mỗi lần chỉ báo một câu để form không đè lẫn nhau. */
export const userFullNameSchema = z
  .string()
  .transform(normalizeFullName)
  .superRefine((value, context) => {
    if (!value) context.addIssue({ code: "custom", message: "Họ tên không được để trống." });
    else if (!/^[\p{L} ]+$/u.test(value)) context.addIssue({ code: "custom", message: "Họ tên không được chứa số hoặc ký tự đặc biệt." });
    else if (value.length < 2 || value.length > 100) context.addIssue({ code: "custom", message: "Họ tên phải từ 2 đến 100 ký tự." });
  });

/** SĐT bắt buộc (C-U2, SRS 2.8): 10-11 chữ số, bắt đầu 0, số thứ hai từ 3 đến 9. */
export const userPhoneSchema = z
  .string()
  .transform((value) => value.trim())
  .superRefine((value, context) => {
    if (!/^\d{10,11}$/.test(value)) context.addIssue({ code: "custom", message: "SĐT phải có 10-11 chữ số." });
    else if (!/^0[3-9]/.test(value)) context.addIssue({ code: "custom", message: "Đầu số không đúng định dạng VN." });
  });

export const userFormSchema = z.object({
  email: z.email("Email không hợp lệ"),
  fullName: userFullNameSchema,
  phone: userPhoneSchema,
  groupIds: z.array(z.string()).min(1, "Vui lòng chọn ít nhất một nhóm quyền"),
  merchantIds: z.array(z.string()).default([]),
  subMerchantIds: z.array(z.string()).default([]),
});

export type MerchantUser = z.infer<typeof merchantUserSchema>;
export type MerchantUserStatus = z.infer<typeof merchantUserStatusSchema>;
export type ScopeProposal = z.infer<typeof scopeProposalSchema>;
export type AssignableGroup = z.infer<typeof assignableGroupSchema>;
export type ScopeAssignmentResult = z.infer<typeof scopeAssignmentResultSchema>;
export type ScopeChangeResult = z.infer<typeof scopeChangeResultSchema>;
export type ScopeProposalFormValues = z.input<typeof scopeProposalFormSchema>;
export type UserFormValues = z.input<typeof userFormSchema>;
