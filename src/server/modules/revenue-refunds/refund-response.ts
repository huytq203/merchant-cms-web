import "server-only";

import { NextResponse } from "next/server";
import { domainErrorMessage, toDomainHttpStatus, type BeError } from "@/lib/be/errors";

/** Keeps the BE code so the dialog can tell a wrong OTP from a refund limit; a BE 401 never logs the user out. */
export function refundErrorResponse(error: BeError): NextResponse {
  return NextResponse.json({ message: domainErrorMessage(error), code: error.code }, { status: toDomainHttpStatus(error) });
}

export const badRequest = (message: string) => NextResponse.json({ message }, { status: 400 });
