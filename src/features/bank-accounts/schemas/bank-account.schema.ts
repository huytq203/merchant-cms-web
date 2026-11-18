import { z } from "zod";

/**
 * Trạng thái TK theo SRS Quản trị merchant v2 (chốt 18/11/2026):
 * - PENDING_VERIFICATION "Chờ xác minh": VẪN rút được; tự lên VERIFIED khi lệnh rút đầu tiên thành công (thực nhận > 0).
 * - VERIFIED "Đã xác minh".
 * - LOCKED "Khóa": chặn rút và chặn gán Sub mới (Sub đang gán vẫn giữ). Chỉ Admin khóa/mở khóa, Portal không có thao tác này.
 */
export const bankAccountStatusSchema = z.enum(["PENDING_VERIFICATION", "VERIFIED", "LOCKED"]);

/** Một Sub đang dùng TK; Portal chỉ nhận các Sub trong phạm vi của người dùng. */
export const bankAssignedSubSchema = z.object({
  id: z.uuid(),
  code: z.string().nullish(),
  name: z.string().nullish(),
}).transform(({ id, code, name }) => ({ id, code: code ?? "", name: name ?? "" }));

/**
 * `MerchantBankAccountPortalResponse` (v2). TK thuộc danh mục của Master và gán cho 0..N Sub; mỗi Sub đúng 1 TK.
 * Các trường của mô hình cũ (subMerchantId sở hữu, level, status, linkStatus, pendingChangeRequest) không còn: zod
 * bỏ chúng nếu BE cũ còn gửi.
 */
export const bankAccountSchema = z.object({
  id: z.uuid(),
  version: z.number().int().nonnegative(),
  merchantId: z.uuid(),
  bankCode: z.string(),
  /** Đã che ở BE; hiển thị nguyên văn. */
  accountNumber: z.string(),
  accountName: z.string(),
  branchName: z.string().nullish(),
  isDefault: z.boolean().nullish(),
  /** Lombok `isDefault` có thể được Jackson ghi thành `default`. */
  default: z.boolean().nullish(),
  accountStatus: bankAccountStatusSchema,
  /** = accountStatus != LOCKED theo BE. */
  payable: z.boolean().optional(),
  assignedSubMerchants: z.array(bankAssignedSubSchema).nullish(),
  verifiedAt: z.string().nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
}).transform(({ isDefault, default: dtoDefault, assignedSubMerchants, ...account }) => ({
  ...account,
  isDefault: isDefault ?? dtoDefault ?? false,
  assignedSubMerchants: assignedSubMerchants ?? [],
}));

/**
 * PUT trả `{account, applied: true, pendingChangeRequest: null}`: v2 áp dụng ngay sau OTP, không còn đề xuất chờ
 * Flexpay duyệt, nên chỉ giữ `account`.
 */
export const bankUpdateResponseSchema = z.object({ account: bankAccountSchema }).transform(({ account }) => ({ account }));

/** POST có thể trả thẳng TK (201) hoặc bọc như PUT. */
export const bankCreateResponseSchema = z.union([
  bankUpdateResponseSchema,
  bankAccountSchema.transform((account) => ({ account })),
]);

export { sensitiveOtpChallengeSchema } from "@/lib/schemas/sensitive-otp";
