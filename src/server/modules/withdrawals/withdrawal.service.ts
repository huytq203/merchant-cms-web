"server-only";
import { findAllWithdrawals, type FindWithdrawalParams } from "./withdrawal.repository";

export async function getWithdrawalList(params: FindWithdrawalParams) {
  return findAllWithdrawals(params);
}
