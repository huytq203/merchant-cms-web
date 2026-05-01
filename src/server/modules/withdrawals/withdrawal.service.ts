"server-only";
import { findAllWithdrawals, findWithdrawalById, type FindWithdrawalParams } from "./withdrawal.repository";

export async function getWithdrawalList(params: FindWithdrawalParams) {
  return findAllWithdrawals(params);
}

export async function getWithdrawalDetail(id: string) {
  return findWithdrawalById(id);
}
