// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { mswServer } from "@/test/msw";
import { terminalQueries } from "../terminal-queries";
import type { TerminalFormValues } from "../schemas";
import { useLockTerminal, useSaveTerminal, useUnlockTerminal } from "./use-terminal-mutations";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const base = "/api/v1/admin/terminals";
const filter = { page: 1, pageSize: 10 };
const detail = { id: "33333333-3333-4333-8333-333333333333", name: "Quầy 1", status: "ACTIVE" };
const detailPath = `${base}/${detail.id}`;
const values: TerminalFormValues = {
  subMerchantId: "11111111-1111-4111-8111-111111111111",
  name: "Quầy 1",
  terminalType: "POS",
  address: "Hà Nội",
  contactPerson: "",
  inheritContactPhone: true,
  contactPhone: "",
  note: "",
};
let listCalls = 0;
let detailCalls = 0;

beforeEach(() => {
  listCalls = 0;
  detailCalls = 0;
  mswServer.use(
    http.get(base, () => {
      listCalls += 1;
      return HttpResponse.json({ rows: [], total: 0 });
    }),
    http.get(detailPath, () => {
      detailCalls += 1;
      return HttpResponse.json(detail);
    }),
  );
});
afterEach(() => vi.clearAllMocks());

async function renderMutation<T>(useMutationHook: () => T) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => ({
    list: useQuery(terminalQueries.list(filter)),
    detail: useQuery(terminalQueries.detail(detail.id)),
    mutation: useMutationHook(),
  }), { wrapper });
  await waitFor(() => expect(hook.result.current.detail.isSuccess).toBe(true));
  await waitFor(() => expect(hook.result.current.list.isSuccess).toBe(true));
  return { client, ...hook };
}

describe("terminal mutation hooks", () => {
  it.each(["create", "update"] as const)("saves %s and refreshes the list and detail", async (mode) => {
    let request: { method: string; body: unknown } | undefined;
    mswServer.use(http[mode === "update" ? "put" : "post"](mode === "update" ? detailPath : base, async ({ request: incoming }) => {
      request = { method: incoming.method, body: await incoming.json() };
      return HttpResponse.json(detail);
    }));
    const { result } = await renderMutation(() => useSaveTerminal(mode === "update" ? detail.id : undefined));
    await act(async () => {
      await result.current.mutation.mutate(values);
    });
    expect(request).toEqual({ method: mode === "update" ? "PUT" : "POST", body: values });
    await waitFor(() => expect(listCalls).toBe(2));
    await waitFor(() => expect(detailCalls).toBe(2));
    expect(toast.success).toHaveBeenCalledOnce();
  });

  it.each(["lock", "unlock"] as const)("%s sends the reason and refreshes the list and detail", async (action) => {
    let body: unknown;
    mswServer.use(http.post(`${detailPath}/${action}`, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(detail);
    }));
    const { result } = await renderMutation(() => (action === "lock" ? useLockTerminal() : useUnlockTerminal()));
    await act(async () => {
      await result.current.mutation.mutate({ id: detail.id, reason: "Lý do hợp lệ" });
    });
    expect(body).toEqual({ reason: "Lý do hợp lệ" });
    await waitFor(() => expect(listCalls).toBe(2));
    await waitFor(() => expect(detailCalls).toBe(2));
    expect(toast.success).toHaveBeenCalledOnce();
  });

  it("keeps cached data, skips refetching and exposes the BE message when saving fails", async () => {
    mswServer.use(http.put(detailPath, () => HttpResponse.json({ message: "Xung đột" }, { status: 409 })));
    const { result, client } = await renderMutation(() => useSaveTerminal(detail.id));
    await act(async () => {
      await expect(result.current.mutation.mutate(values)).rejects.toThrow("Xung đột");
    });
    await waitFor(() => expect(result.current.mutation.error?.message).toBe("Xung đột"));
    expect(client.getQueryData(["terminals", "detail", detail.id])).toEqual(detail);
    expect(listCalls).toBe(1);
    expect(detailCalls).toBe(1);
    expect(toast.success).not.toHaveBeenCalled();
  });
});
