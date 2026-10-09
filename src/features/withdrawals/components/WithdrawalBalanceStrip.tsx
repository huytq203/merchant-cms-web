"use client";

import { useQuery } from "@tanstack/react-query";
import { withdrawalQueries } from "../withdrawal-queries";
import { WithdrawalBalanceTiles } from "./WithdrawalBalanceTiles";

/** The wallet position at the top of the list; its own query so a slow wallet never holds the table back. */
export function WithdrawalBalanceStrip() {
  const balance = useQuery(withdrawalQueries.balance());
  return <WithdrawalBalanceTiles balance={balance} />;
}
