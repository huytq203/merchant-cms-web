import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { revenueSeriesSchema, type RevenueQuery } from "./schemas/revenue.schema";

export const revenueQueries = {
  series: (query: RevenueQuery) =>
    queryOptions({
      queryKey: ["dashboard", "revenue", query] as const,
      queryFn: async () =>
        revenueSeriesSchema.parse(await apiClient.get<unknown>("/v1/admin/merchants/revenue-stats", { query: { ...query } })),
    }),
};
