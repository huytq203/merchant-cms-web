import "server-only";

import { createBeClient, type BeClient } from "@/lib/be/client";
import { readAccessToken } from "@/lib/auth/session-cookies";
import { getServerEnv } from "@/lib/env/server";

export function identityClient(): BeClient {
  return createBeClient({
    baseUrl: getServerEnv().IDENTITY_BASE_URL,
    getAccessToken: readAccessToken,
  });
}

export function merchantClient(): BeClient {
  return createBeClient({
    baseUrl: getServerEnv().MERCHANT_BASE_URL,
    getAccessToken: readAccessToken,
  });
}
