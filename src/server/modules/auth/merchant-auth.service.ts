import "server-only";

import type { BeClient, BeResult } from "@/lib/be/client";
import type { BeError } from "@/lib/be/errors";
import { emptySchema } from "@/lib/be/envelope";
import { identityClient } from "@/lib/be/services";
import {
  loginChallengeSchema,
  otpChallengeSchema,
  tokenPairSchema,
  type LoginChallenge,
  type OtpChallenge,
  type TokenPair,
} from "@/server/modules/auth/merchant-auth.dto";

export const MERCHANT_AUTH_PATH = "/api/v1/merchant/auth";

export function isRefreshRejected(error: BeError): boolean {
  return error.status === 400 || error.status === 401;
}

/** Step 1: checks the password and emails an OTP. */
export function requestLoginOtp(
  email: string,
  password: string,
  client: BeClient = identityClient(),
): Promise<BeResult<LoginChallenge>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/login`,
    body: { email, password },
    schema: loginChallengeSchema,
    auth: false,
  });
}

/** Step 2: exchanges a correct OTP for tokens. */
export function verifyLoginOtp(
  requestId: string,
  otp: string,
  client: BeClient = identityClient(),
): Promise<BeResult<TokenPair>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/login/verify-otp`,
    body: { requestId, otp },
    schema: tokenPairSchema,
    auth: false,
  });
}

/** Shared by login and password reset. */
export function resendOtp(
  requestId: string,
  client: BeClient = identityClient(),
): Promise<BeResult<OtpChallenge>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/otp/resend`,
    body: { requestId },
    schema: otpChallengeSchema,
    auth: false,
  });
}

export function refreshTokens(
  refreshToken: string,
  client: BeClient = identityClient(),
): Promise<BeResult<TokenPair>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/refresh`,
    body: { refreshToken },
    schema: tokenPairSchema,
    auth: false,
  });
}

export function logoutSession(
  refreshToken: string,
  client: BeClient = identityClient(),
): Promise<BeResult<undefined>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/logout`,
    body: { refreshToken },
    schema: emptySchema,
    auth: false,
  });
}

const inflightRefreshes = new Map<string, Promise<BeResult<TokenPair>>>();

/**
 * Refresh tokens may rotate, so two parallel requests (prefetch + navigation) must not both spend
 * the same token. Concurrent calls with the same token share one BE request.
 */
export function refreshTokensOnce(
  refreshToken: string,
  client: BeClient = identityClient(),
): Promise<BeResult<TokenPair>> {
  const pending = inflightRefreshes.get(refreshToken);
  if (pending) return pending;
  const started = refreshTokens(refreshToken, client).finally(() => {
    inflightRefreshes.delete(refreshToken);
  });
  inflightRefreshes.set(refreshToken, started);
  return started;
}
