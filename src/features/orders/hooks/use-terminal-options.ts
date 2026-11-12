import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { terminalApiRoot } from "@/features/terminals/constants/terminal.constants";
import type { TerminalListResult } from "@/features/terminals/types";

/**
 * Active Terminals of one Sub-merchant; nothing is fetched until a Sub-merchant is known.
 *
 * Sends the single `subMerchantId` filter (understood by every BE version, unlike the newer
 * `subMerchantIds`) and keeps only rows of that Sub: a Terminal belongs to exactly one Sub, so an
 * order must never be offered a Terminal of another Sub even if BE ignores the filter.
 */
export function useTerminalOptions(subMerchantId: string) {
  return useQuery({
    queryKey: ["terminals", "order-options", subMerchantId] as const,
    queryFn: () => apiClient.get<TerminalListResult>(terminalApiRoot, {
      query: { page: 1, pageSize: 100, subMerchantId, status: "ACTIVE" },
    }),
    enabled: Boolean(subMerchantId),
    select: (data) => data.rows
      .filter((row) => row.subMerchantId === subMerchantId)
      .map(({ id, tid, name }) => ({ value: id, label: `${tid} — ${name}` })),
  });
}
