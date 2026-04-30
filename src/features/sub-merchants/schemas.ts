import { z } from 'zod';

export const subMerchantFilterSchema = z.object({
  keyword: z.string().max(100).optional(),
  status: z.string().optional(),
});

export const subMerchantFormSchema = z.object({
  name: z.string().min(1, 'Tên sub-merchant là bắt buộc').max(100),
  businessType: z.string().min(1, 'Loại hình kinh doanh là bắt buộc'),
  contact: z.string().min(1, 'Thông tin liên hệ là bắt buộc').max(50),
  status: z.enum(['active', 'inactive', 'locked']),
});

export const newSubMerchantSchema = z.object({
  // Section 1 – Thông tin chung
  name: z.string().min(1, 'Tên Sub-merchant là bắt buộc').max(100),
  businessType: z.string().min(1, 'Lĩnh vực kinh doanh là bắt buộc'),
  taxCode: z.string().optional(),
  representative: z.string().optional(),
  address: z.string().min(1, 'Địa chỉ trụ sở là bắt buộc'),
  logo: z.any().optional(),
  // Section 2 – Key kết nối
  webhookUrl: z.string().optional(),
  // Section 3 – Tài khoản ngân hàng
  bankName: z.string().min(1, 'Ngân hàng thụ hưởng là bắt buộc'),
  bankBranch: z.string().optional(),
  accountNumber: z.string().min(1, 'Số tài khoản là bắt buộc'),
  accountName: z.string().min(1, 'Tên chủ tài khoản là bắt buộc'),
  status: z.string().optional(),
  // Section 4 – Cấu hình thông báo vận hành
  notifyEnabled: z.boolean(),
  notifyTxSuccess: z.boolean(),
  notifyTxFailed: z.boolean(),
  notifyDispute: z.boolean(),
  notifyFreeze: z.boolean(),
  notifyPolicyChange: z.boolean(),
  notifyEmails: z.string().optional(),
  // Section 4 – Hóa đơn điện tử
  eInvoiceEnabled: z.boolean(),
  eInvoiceEmails: z.string().optional(),
});

export type SubMerchantFilterValues = z.infer<typeof subMerchantFilterSchema>;
export type SubMerchantFormValues = z.infer<typeof subMerchantFormSchema>;
export type NewSubMerchantFormValues = z.infer<typeof newSubMerchantSchema>;
