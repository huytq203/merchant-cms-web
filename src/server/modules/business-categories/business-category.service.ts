import "server-only";

import { merchantClient } from "@/lib/be/services";
import type { BeResult } from "@/lib/be/client";
import { businessCategoryListSchema, type BusinessCategory } from "@/features/business-categories/schemas";
import { businessCategoryPaths } from "./business-category.paths";

export const listBusinessCategories = (): Promise<BeResult<BusinessCategory[]>> =>
  merchantClient().get({ path: businessCategoryPaths.list, schema: businessCategoryListSchema });
