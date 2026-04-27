import { z } from "zod";

export const userBaseSchema = z.object({
  name: z.string().min(1, "Tên bắt buộc"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(1, "Số điện thoại bắt buộc"),
  permissionGroupId: z.string().min(1, "Nhóm quyền bắt buộc"),
  subMerchantScope: z.enum(["all", "specific"]).default("all"),
  assignedSubMerchantsIds: z.array(z.string()).default([]),
  status: z.enum(["active", "inactive", "locked"]).default("active"),
});

export const createUserSchema = userBaseSchema;
export const updateUserSchema = userBaseSchema.partial();

export const lockUserSchema = z.object({
  lockReason: z.string().min(10, "Lý do phải ít nhất 10 ký tự"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LockUserInput = z.infer<typeof lockUserSchema>;
