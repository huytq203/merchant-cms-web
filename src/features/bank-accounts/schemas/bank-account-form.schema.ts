import { z } from "zod";

export const bankAccountFormSchema = z.object({
  bankCode: z.string().trim().min(1, "Chọn ngân hàng").max(50),
  accountNumber: z.string().regex(/^\d{6,20}$/, "Số tài khoản phải có 6–20 chữ số"),
  accountName: z.string().trim().min(1, "Nhập tên chủ tài khoản").max(100),
  branchName: z.string().trim().max(100),
  /** Chỉ khi thêm mới; sửa mặc định dùng thao tác "Đặt làm mặc định" riêng. */
  isDefault: z.boolean().optional(),
  /** Các Sub dùng TK sau khi lưu (SRS v2: một TK gán 0..N Sub). Rỗng = TK chưa gán Sub nào. */
  assignSubMerchantIds: z.array(z.string()),
});
