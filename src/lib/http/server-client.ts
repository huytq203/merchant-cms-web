import "server-only";

import { getAccessToken } from "@/lib/auth/session";
import { apiClient } from "@/lib/http/api-client";

type ApiClient = typeof apiClient;

/**
 * Tạo apiClient đã inject `Authorization: Bearer <token>` từ HTTP-only cookie.
 * Dùng trong Server Component và Server Action.
 *
 * @example
 * const client = await createAuthClient()
 * const orders = await client.get<OrderList>("/v1/admin/orders")
 */
export async function createAuthClient(): Promise<ApiClient> {
  const token = await getAccessToken();
  const bearerHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  function mergeHeaders(
    existing?: HeadersInit,
  ): Record<string, string> {
    const base: Record<string, string> = { ...bearerHeaders };
    if (!existing) return base;
    if (existing instanceof Headers) {
      existing.forEach((v, k) => { base[k] = v; });
    } else if (Array.isArray(existing)) {
      for (const [k, v] of existing) base[k] = v;
    } else {
      Object.assign(base, existing);
    }
    return base;
  }

  return {
    get: (path, opts) =>
      apiClient.get(path, { ...opts, headers: mergeHeaders(opts?.headers) }),
    post: (path, body, opts) =>
      apiClient.post(path, body, {
        ...opts,
        headers: mergeHeaders(opts?.headers),
      }),
    put: (path, body, opts) =>
      apiClient.put(path, body, {
        ...opts,
        headers: mergeHeaders(opts?.headers),
      }),
    patch: (path, body, opts) =>
      apiClient.patch(path, body, {
        ...opts,
        headers: mergeHeaders(opts?.headers),
      }),
    delete: (path, opts) =>
      apiClient.delete(path, {
        ...opts,
        headers: mergeHeaders(opts?.headers),
      }),
  };
}
