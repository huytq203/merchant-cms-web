import { useState } from "react";
import type { BankChangeRequest } from "../types";

/**
 * The BE returns a pending change request only in the response of the call that created it:
 * the list and detail endpoints do not carry it. The badge therefore lives for the session.
 */
export function usePendingBankChanges() {
  const [byAccountId, setByAccountId] = useState<Record<string, BankChangeRequest>>({});

  const remember = (request: BankChangeRequest | null | undefined) => {
    if (request?.status !== "PENDING") return;
    setByAccountId((current) => ({ ...current, [request.bankAccountId]: request }));
  };

  return { byAccountId, remember };
}
