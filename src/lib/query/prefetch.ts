import "server-only";
import { dehydrate, type DehydratedState, type QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";

import type { BeResult } from "@/lib/be/client";
import { makeQueryClient } from "@/lib/query/query-client";

const SESSION_EXPIRED_PATH = "/api/v1/admin/auth/session-expired";

/**
 * For a server `queryFn` override: returns the data, sends an expired session to the
 * cookie-clearing route, and turns any other failure into a thrown error that
 * `prefetchQuery` swallows so the client refetches and renders its Error state.
 */
export function unwrapOrRedirect<T>(result: BeResult<T>): T {
  if (result.success) return result.data;
  if (result.error.status === 401) redirect(SESSION_EXPIRED_PATH);
  throw new Error(result.error.code);
}

/** Creates a request-scoped client, runs the prefetches and returns the state for `HydrationBoundary`. */
export async function prefetchDehydrated(
  prefetch: (client: QueryClient) => Promise<void>,
): Promise<DehydratedState> {
  const client = makeQueryClient();
  await prefetch(client);
  return dehydrate(client);
}
