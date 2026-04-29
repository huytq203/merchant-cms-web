"server-only";
import { findAllRefunds, type FindRefundParams } from "./refund.repository";

export async function getRefundList(params: FindRefundParams) {
  return findAllRefunds(params);
}
