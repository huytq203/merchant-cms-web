import { z } from "zod";

/** `GET /api/v1/merchant/business-categories`: một ngành nghề trong danh mục MCC chuẩn của Flexpay. */
export const businessCategorySchema = z.object({
  mccCode: z.string(),
  name: z.string(),
});

export const businessCategoryListSchema = z.array(businessCategorySchema);

export type BusinessCategory = z.infer<typeof businessCategorySchema>;
