import { z } from "zod";
import { subMerchantIdsParam } from "@/features/sub-merchants/utils/sub-merchant-ids";
import { bankLinkStatusSchema } from "./bank-account.schema";

export const OTP_LENGTH = 6;

/** A confirmation is accepted only when both halves are present; half of one never reaches the BE. */
export const bankOtpSchema = z.object({
  otpSessionId: z.string().trim().min(1, "Phiên OTP không hợp lệ"),
  otp: z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Mã OTP gồm ${OTP_LENGTH} chữ số`),
});

const accountNumber = z.string().regex(/^\d{6,20}$/, "Số tài khoản phải có 6–20 chữ số");
const bankCode = z.string().trim().min(1, "Chọn ngân hàng").max(50);
const accountName = z.string().trim().min(1, "Nhập tên chủ tài khoản").max(100);
const branchName = z.string().trim().max(100);
const reason = z.string().trim().max(500, "Lý do tối đa 500 ký tự");

export const createBankBodySchema = z.object({
  merchantId: z.uuid().optional(),
  subMerchantId: z.uuid().optional(),
  bankCode,
  accountNumber,
  accountName,
  branchName: branchName.optional(),
  isDefault: z.boolean().optional(),
  otp: bankOtpSchema,
});

export const updateBankBodySchema = z.object({
  version: z.number().int().nonnegative(),
  bankCode: bankCode.optional(),
  accountNumber: accountNumber.optional(),
  accountName: accountName.optional(),
  branchName: branchName.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  reason: reason.optional(),
  otp: bankOtpSchema.optional(),
});

export const bankReasonBodySchema = z.object({ reason: reason.optional() });

export const bankChallengeBodySchema = z.object({ targetId: z.uuid().optional() });

export const bankListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  merchantId: z.uuid().optional(),
  // Danh sách Sub nối dấu phẩy; BE giao với phạm vi người dùng nên Sub ngoài phạm vi bị bỏ.
  subMerchantIds: subMerchantIdsParam,
  linkStatus: bankLinkStatusSchema.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
