"server-only";

import {
  findAllTransactions,
  type FindTransactionParams,
} from "./transaction.repository";

export async function getTransactionList(params: FindTransactionParams) {
  return findAllTransactions(params);
}
