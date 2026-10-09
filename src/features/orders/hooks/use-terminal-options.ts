import { useQuery } from "@tanstack/react-query";
import { terminalQueries } from "@/features/terminals/terminal-queries";

/** Active Terminals of one Sub-merchant; nothing is fetched until a Sub-merchant is known. */
export function useTerminalOptions(subMerchantId: string) {
  return useQuery({
    ...terminalQueries.list({ page: 1, pageSize: 100, subMerchantId, status: "ACTIVE" }),
    enabled: Boolean(subMerchantId),
    select: (data) => data.rows.map(({ id, tid, name }) => ({ value: id, label: `${tid} — ${name}` })),
  });
}
