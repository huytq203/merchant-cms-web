import { z } from 'zod';

export const newPermissionSchema = z.object({
  name: z.string().min(1, 'Tên nhóm quyền là bắt buộc').max(100),
  permissions: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất một quyền'),
});

export type NewPermissionFormValues = z.infer<typeof newPermissionSchema>;

export const editPermissionSchema = z.object({
  name: z.string().min(1, 'Tên nhóm quyền là bắt buộc').max(100),
  status: z.enum(['active', 'inactive']),
  permissions: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất một quyền'),
});

export type EditPermissionFormValues = z.infer<typeof editPermissionSchema>;
