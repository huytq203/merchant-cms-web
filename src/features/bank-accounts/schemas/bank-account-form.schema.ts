import { z } from "zod";

export const bankAccountFormSchema = z.object({
  bankCode: z.string().trim().min(1, "Chọn ngân hàng").max(50),
  accountNumber: z.string().regex(/^\d{6,20}$/, "Số tài khoản phải có 6–20 chữ số"),
  accountName: z.string().trim().min(1, "Nhập tên chủ tài khoản").max(100),
  branchName: z.string().trim().max(100),
  isDefault: z.boolean().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  reason: z.string().trim().max(500).optional(),
});
