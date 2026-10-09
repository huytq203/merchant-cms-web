import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Merchant Admin CMS"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .refine((v) => URL.canParse(v), "NEXT_PUBLIC_APP_URL phải là URL hợp lệ")
    .default("https://merchant-cms-web.vercel.app/"),
});

const parsed = publicSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`[env] Public env không hợp lệ:\n${issues}`);
}

export const publicEnv = parsed.data;
