// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { mswServer } from "@/test/msw";
import { userQueries } from "../../user-queries";
import {
  useAssignUserGroups,
  useCreateUser,
  useLockUser,
  useResetUserPassword,
  useUnlockUser,
  useUpdateUser,
} from "../use-user-mutations";

const base = "/api/v1/merchant/merchant-users";
const id = "11111111-1111-4111-8111-111111111111";
const filter = { page: 1, pageSize: 10 };
const createValues = {
  email: "user@example.com",
  fullName: "Test User",
  groupIds: ["group-1"],
  merchantIds: [],
  subMerchantIds: [],
};
let listCalls = 0;

beforeEach(() => {
  listCalls = 0;
  mswServer.use(http.get(base, () => {
    listCalls += 1;
    return HttpResponse.json({ rows: [], total: 0 });
  }));
});

async function renderMutation<T>(useMutationHook: () => T) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(
    () => ({ list: useQuery(userQueries.list(filter)), mutation: useMutationHook() }),
    { wrapper },
  );
  await waitFor(() => expect(hook.result.current.list.isSuccess).toBe(true));
  return { client, ...hook };
}

/** Captures the body (or its absence) of the next request to `path`. */
function captureBody(method: "post" | "put", path: string) {
  const captured: { body?: string } = {};
  mswServer.use(http[method](path, async ({ request }) => {
    captured.body = await request.text();
    return HttpResponse.json({ id });
  }));
  return captured;
}

describe("user mutations", () => {
  it("creates a user with the form body and refreshes the list", async () => {
    const sent = captureBody("post", base);
    const { result } = await renderMutation(useCreateUser);
    await act(async () => {
      await result.current.mutation.mutateAsync(createValues);
    });
    expect(JSON.parse(sent.body ?? "null")).toEqual(createValues);
    await waitFor(() => expect(listCalls).toBe(2));
  });

  it("updates only the editable fields", async () => {
    const sent = captureBody("put", `${base}/${id}`);
    const { result } = await renderMutation(useUpdateUser);
    await act(async () => {
      await result.current.mutation.mutateAsync({ id, values: { fullName: "Updated User" } });
    });
    expect(JSON.parse(sent.body ?? "null")).toEqual({ fullName: "Updated User" });
    await waitFor(() => expect(listCalls).toBe(2));
  });

  it("locks with a reason and refreshes the list", async () => {
    const sent = captureBody("post", `${base}/${id}/lock`);
    const { result } = await renderMutation(useLockUser);
    await act(async () => {
      await result.current.mutation.mutateAsync({ id, reason: "Valid lock reason" });
    });
    expect(JSON.parse(sent.body ?? "null")).toEqual({ reason: "Valid lock reason" });
    await waitFor(() => expect(listCalls).toBe(2));
  });

  it("unlocks without a body and refreshes the list", async () => {
    const sent = captureBody("post", `${base}/${id}/unlock`);
    const { result } = await renderMutation(useUnlockUser);
    await act(async () => {
      await result.current.mutation.mutateAsync({ id });
    });
    expect(sent.body).toBe("");
    await waitFor(() => expect(listCalls).toBe(2));
  });

  it("resets a password without a request body and refreshes the list", async () => {
    const sent = captureBody("post", `${base}/${id}/reset-password`);
    const { result } = await renderMutation(useResetUserPassword);
    await act(async () => {
      await result.current.mutation.mutateAsync({ id });
    });
    expect(sent.body).toBe("");
    await waitFor(() => expect(listCalls).toBe(2));
  });

  it("assigns groups as an id list", async () => {
    const sent = captureBody("post", `${base}/${id}/assign-groups`);
    const { result } = await renderMutation(useAssignUserGroups);
    await act(async () => {
      await result.current.mutation.mutateAsync({ id, groupIds: ["group-1"] });
    });
    expect(JSON.parse(sent.body ?? "null")).toEqual({ ids: ["group-1"] });
  });

  it("keeps the cached list and skips refetching when the BE rejects", async () => {
    mswServer.use(http.post(`${base}/${id}/lock`, () => HttpResponse.json({ message: "Xung đột" }, { status: 409 })));
    const { result, client } = await renderMutation(useLockUser);
    const before = client.getQueryData(userQueries.list(filter).queryKey);
    await act(async () => {
      await expect(result.current.mutation.mutateAsync({ id, reason: "Valid lock reason" })).rejects.toThrow("Xung đột");
    });
    expect(client.getQueryData(userQueries.list(filter).queryKey)).toBe(before);
    expect(listCalls).toBe(1);
  });
});
