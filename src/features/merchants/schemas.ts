import { z } from 'zod';

export const merchantFilterSchema = z.object({
  keyword: z.string().max(100).optional(),
  businessType: z.string().optional(),
  registeredFrom: z.date().nullable().optional(),
  registeredTo: z.date().nullable().optional(),
  activatedFrom: z.date().nullable().optional(),
  activatedTo: z.date().nullable().optional(),
  salesStaffId: z.string().optional(),
  status: z.string().optional(),
});

export type MerchantFilterValues = z.infer<typeof merchantFilterSchema>;

export const createMerchantSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email là bắt buộc')
      .max(100, 'Tối đa 100 ký tự')
      .email('Email không hợp lệ'),
    phone: z
      .string()
      .min(1, 'Số điện thoại là bắt buộc')
      .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải 10-11 chữ số'),
    name: z
      .string()
      .min(1, 'Tên merchant là bắt buộc')
      .max(200, 'Tối đa 200 ký tự')
      .regex(/^[^<>&"']*$/, 'Tên không được chứa ký tự đặc biệt'),
    merchantType: z.enum(['individual', 'household', 'business'] as const, {
      error: 'Loại merchant là bắt buộc',
    }),
    taxCode: z.string().optional(),
    businessType: z.string().min(1, 'Lĩnh vực kinh doanh là bắt buộc'),
    copyEmail: z.boolean().optional(),
    emailReconciliation: z
      .string()
      .min(1, 'Email đối soát là bắt buộc')
      .max(100)
      .email('Email không hợp lệ'),
    emailInvoice: z
      .string()
      .min(1, 'Email hóa đơn là bắt buộc')
      .max(100)
      .email('Email không hợp lệ'),
    address: z
      .string()
      .min(10, 'Địa chỉ tối thiểu 10 ký tự')
      .max(500, 'Tối đa 500 ký tự'),
    representativeName: z.string().min(1, 'Họ tên người đại diện là bắt buộc').max(100),
    representativePosition: z.string().min(1, 'Chức vụ là bắt buộc').max(50),
    representativeCccd: z
      .string()
      .min(1, 'Số CCCD là bắt buộc')
      .regex(/^[0-9]{9}$|^[0-9]{12}$/, 'CCCD phải có 9 hoặc 12 chữ số'),
    representativeCccdExpiry: z.string().min(1, 'Ngày hết hạn CCCD là bắt buộc'),
    representativeOtpPhone: z
      .string()
      .min(1, 'SĐT nhận OTP là bắt buộc')
      .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải 10-11 chữ số'),
  })
  .superRefine((data, ctx) => {
    if (data.merchantType !== 'individual') {
      if (!data.taxCode || data.taxCode.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Mã số thuế là bắt buộc với loại hình này',
          path: ['taxCode'],
        });
      } else if (!/^[0-9-]{10}$|^[0-9-]{13}$/.test(data.taxCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Mã số thuế phải có 10 hoặc 13 ký tự',
          path: ['taxCode'],
        });
      }
    }
    if (data.representativeCccdExpiry) {
      const expiry = new Date(data.representativeCccdExpiry);
      if (expiry <= new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Giấy tờ đã hết hạn',
          path: ['representativeCccdExpiry'],
        });
      }
    }
  });

export type CreateMerchantValues = z.infer<typeof createMerchantSchema>;

export const rejectMerchantSchema = z.object({
  reason: z.string().min(1, 'Vui lòng chọn lý do từ chối'),
  note: z.string().min(1, 'Vui lòng nhập ghi chú').max(500, 'Tối đa 500 ký tự'),
});

export type RejectMerchantValues = z.infer<typeof rejectMerchantSchema>;

export const lockMerchantSchema = z.object({
  reason: z
    .string()
    .min(10, 'Lý do phải tối thiểu 10 ký tự')
    .max(500, 'Tối đa 500 ký tự'),
});

export type LockMerchantValues = z.infer<typeof lockMerchantSchema>;
