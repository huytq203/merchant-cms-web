import "server-only";
import { dehydrate, type DehydratedState, type QueryClient } from "@tanstack/react-query";

import type { BeResult } from "@/lib/be/client";
import { makeQueryClient } from "@/lib/query/query-client";

/**
 * For a server `queryFn` override: returns the data, or throws the BE error code so `prefetchQuery`
 * swallows it and the client refetches and renders its Error state. An expired session is handled
 * by the CMS layout, so a BE 401 here is the BE chain refusing the call and must not end the session.
 */
export function unwrapOrRedirect<T>(result: BeResult<T>): T {
  if (result.success) return result.data;
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
