import "server-only";

import { meResponseSchema } from "@/features/auth/schemas";
import { toSessionUser } from "@/features/auth/utils/session-mapper";
import type { BeClient, BeResult } from "@/lib/be/client";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { SessionUser } from "@/types/auth";

export async function fetchMerchantSession(
  client: BeClient = merchantClient(),
): Promise<BeResult<SessionUser>> {
  const result = await client.get({ path: "/api/v1/merchant/me", schema: meResponseSchema });
  return result.success ? ok(toSessionUser(result.data)) : result;
}
