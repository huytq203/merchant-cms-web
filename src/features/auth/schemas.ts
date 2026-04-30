import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Vui lòng nhập tên tài khoản")
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(6, "Mật khẩu tối thiểu 6 ký tự")
    .max(72, "Mật khẩu tối đa 72 ký tự"),
});

export type LoginInput = z.infer<typeof loginSchema>;
