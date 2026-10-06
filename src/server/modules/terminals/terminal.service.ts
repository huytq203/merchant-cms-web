import "server-only";

import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import { terminalDetailSchema, terminalSummarySchema, type TerminalFormValues } from "@/features/terminals/schemas";
import type { TerminalDetail, TerminalListFilter, TerminalListResult } from "@/features/terminals/types";
import { toCreateTerminalRequest, toUpdateTerminalRequest } from "@/features/terminals/utils/terminal-mapper";
import { terminalPaths } from "./terminal.paths";

export async function listTerminals(filter: TerminalListFilter): Promise<BeResult<TerminalListResult>> {
  const result = await merchantClient().get({
    path: terminalPaths.list,
    schema: pageSchema(terminalSummarySchema),
    query: {
      page: filter.page,
      size: filter.pageSize,
      subMerchantId: filter.subMerchantId,
      name: filter.name,
      status: filter.status,
    },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

export const getTerminal = (id: string): Promise<BeResult<TerminalDetail>> =>
  merchantClient().get({ path: terminalPaths.detail(id), schema: terminalDetailSchema });

export const createTerminal = (values: TerminalFormValues): Promise<BeResult<TerminalDetail>> =>
  merchantClient().post({ path: terminalPaths.create, schema: terminalDetailSchema, body: toCreateTerminalRequest(values) });

export const updateTerminal = (id: string, values: TerminalFormValues): Promise<BeResult<TerminalDetail>> =>
  merchantClient().put({ path: terminalPaths.update(id), schema: terminalDetailSchema, body: toUpdateTerminalRequest(values) });

export const lockTerminal = (id: string, reason: string): Promise<BeResult<TerminalDetail>> =>
  merchantClient().post({ path: terminalPaths.lock(id), schema: terminalDetailSchema, body: { reason } });

export const unlockTerminal = (id: string, reason: string): Promise<BeResult<TerminalDetail>> =>
  merchantClient().post({ path: terminalPaths.unlock(id), schema: terminalDetailSchema, body: { reason } });
