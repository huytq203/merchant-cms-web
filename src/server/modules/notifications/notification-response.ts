import "server-only";

import { NextResponse } from "next/server";
import type { BeResult } from "@/lib/be/client";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";

/** BE data as JSON, or the BE status with a Vietnamese message; keeps the 404 for another user's notification. */
export function toNotificationResponse<T>(result: BeResult<T>): NextResponse {
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
