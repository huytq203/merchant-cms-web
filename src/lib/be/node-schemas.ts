import { z } from "zod";

export const subMerchantStatusSchema = z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]);
export const lockSourceSchema = z.enum(["DIRECT", "CASCADE"]);

export const inheritedFieldSchema = <T extends z.ZodType>(value: T) =>
  z.object({
    value: value.nullish(),
    source: z.string().nullish(),
    inherited: z.boolean(),
    suspended: z.boolean(),
  });
