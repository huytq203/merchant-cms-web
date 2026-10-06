import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { terminalApiRoot } from "./constants/terminal.constants";
import type { TerminalDetail, TerminalListFilter, TerminalListResult } from "./types";

type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseTerminalSearchParams(raw: RawSearchParams): TerminalListFilter {
  const numberParam = (value: string | string[] | undefined, fallback: number, max = Infinity) => {
    const parsed = typeof value === "string" ? Number(value) : NaN;
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : fallback;
  };
  const status = raw.status === "ACTIVE" || raw.status === "INACTIVE" || raw.status === "TERMINATED"
    ? raw.status
    : undefined;
  const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 100) : "";
  const subMerchantId = typeof raw.subMerchantId === "string" ? raw.subMerchantId : undefined;
  return {
    page: numberParam(raw.page, 1),
    pageSize: numberParam(raw.pageSize, 10, 100),
    ...(name ? { name } : {}),
    ...(status ? { status } : {}),
    ...(subMerchantId ? { subMerchantId } : {}),
  };
}

export const terminalQueries = {
  list: (filter: TerminalListFilter) => queryOptions({
    queryKey: ["terminals", "list", filter] as const,
    queryFn: () => apiClient.get<TerminalListResult>(terminalApiRoot, {
      query: {
        page: filter.page,
        pageSize: filter.pageSize,
        subMerchantId: filter.subMerchantId,
        name: filter.name,
        status: filter.status,
      },
    }),
  }),
  detail: (id: string) => queryOptions({
    queryKey: ["terminals", "detail", id] as const,
    queryFn: () => apiClient.get<TerminalDetail>(`${terminalApiRoot}/${encodeURIComponent(id)}`),
  }),
};
