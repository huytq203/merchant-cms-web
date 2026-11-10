import "server-only";

import { NextResponse } from "next/server";
import type { BeResult } from "@/lib/be/client";
import { toDomainHttpStatus } from "@/lib/be/errors";
import { subBalanceErrorMessage } from "@/features/sub-balances/utils/sub-balance-error";

/** BE data as JSON, or the BE status with a Vietnamese message (404 for a Sub or operation outside the session scope, 503 when the ledger cannot be read). */
export function toSubBalanceResponse<T>(result: BeResult<T>): NextResponse {
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: subBalanceErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
