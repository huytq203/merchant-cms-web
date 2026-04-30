import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Merchant Admin CMS"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .refine((v) => URL.canParse(v), "NEXT_PUBLIC_APP_URL phải là URL hợp lệ")
    .default("https://merchant-cms-web.vercel.app/"),
  // Chỉ dùng ở server-side. Client-side luôn gọi relative URL /api (same-origin).
  NEXT_PUBLIC_API_LOGIN_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_API_LOGIN_URL không được để trống")
    .default("http://localhost:3000/api"),
});

const parsed = publicSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_LOGIN_URL: process.env.NEXT_PUBLIC_API_LOGIN_URL,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`[env] Public env không hợp lệ:\n${issues}`);
}

export const publicEnv = parsed.data;
