import "server-only";

import { NextResponse } from "next/server";
import type { BeResult } from "@/lib/be/client";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";

/**
 * Shared answer of the inbox route handlers: the data on success, otherwise the BE message with a
 * domain status (a BE 401 becomes 403 so the browser does not end a session the guard just validated).
 */
export function notificationResponse<T>(result: BeResult<T>): NextResponse {
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
