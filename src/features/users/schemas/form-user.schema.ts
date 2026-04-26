import { z } from 'zod'

export const formUserSchema = z.object({
  name: z.string().min(1, 'Họ và tên là bắt buộc').max(255),
  phone: z.string().min(1, 'Số điện thoại là bắt buộc').regex(/^[\d\s+\-()]+$/, 'Số điện thoại không hợp lệ'),
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  permissionGroupId: z.string().min(1, 'Nhóm quyền là bắt buộc'),
  subMerchantScope: z.enum(['all', 'specific']),
  assignedSubMerchants: z.array(z.string()),
})

export type FormUserValues = z.infer<typeof formUserSchema>
