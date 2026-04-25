import { z } from "zod";

function resolveApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_LOGIN_URL) {
    return process.env.NEXT_PUBLIC_API_LOGIN_URL;
  }
  // Vercel tự động cung cấp VERCEL_URL, được expose qua next.config.ts
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api`;
  }
  return "http://localhost:3000/api";
}

const publicSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Merchant Admin CMS"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default("https://merchant-cms-web.vercel.app/"),
  NEXT_PUBLIC_API_LOGIN_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_API_LOGIN_URL không được để trống")
    .default(resolveApiUrl()),
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
