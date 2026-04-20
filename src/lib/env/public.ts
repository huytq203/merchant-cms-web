import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Merchant Admin CMS"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default("https://mechant-owner.ewallet.devops.beamewa.com.vn/"),
  NEXT_PUBLIC_API_LOGIN_URL: z
    .string()
    .url("NEXT_PUBLIC_API_LOGIN_URL phải là URL hợp lệ")
    .default("https://identity.ewallet.devops.beamewa.com.vn/api"),
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
