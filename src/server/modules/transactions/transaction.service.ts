import "server-only";

import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import { transactionSchema } from "@/features/transactions/schemas/transaction.schema";
import type { TransactionListFilter, TransactionListResult } from "@/features/transactions/types";

// Merchant Portal endpoint: scoped by the session (assigned Master or Subs), never by a merchantId from the client.
// Filters BE reads: keyword, status, subMerchantId, paymentMethod, createdFrom/createdTo (yyyy-MM-dd), pagination.
const TRANSACTIONS = "/api/v1/merchant/transactions";

/** Payments the session's merchants received (their orders); there is no customer phone filter on the BE. */
export async function listTransactions(filter: TransactionListFilter): Promise<BeResult<TransactionListResult>> {
  const result = await merchantClient().get({
    path: TRANSACTIONS,
    schema: pageSchema(transactionSchema),
    query: {
      page: filter.page,
      size: filter.pageSize,
      keyword: filter.keyword,
      status: filter.status,
      paymentMethod: filter.paymentMethod,
      subMerchantId: filter.subMerchantId,
      createdFrom: filter.createdFrom,
      createdTo: filter.createdTo,
    },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}
