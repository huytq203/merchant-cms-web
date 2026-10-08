// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { useDeleteBankAccount, useSetDefaultBankAccount, useUpdateBankAccount } from "../use-bank-account-mutations";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const id = "55555555-5555-4555-8555-555555555555";
const base = "/api/v1/admin/bank-accounts";

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

afterEach(() => vi.clearAllMocks());

describe("bank account mutation hooks", () => {
  it("invalidates the list and the edited detail after an update", async () => {
    mswServer.use(http.put(`${base}/${id}`, () => HttpResponse.json({ account: {}, applied: true })));
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUpdateBankAccount(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id, request: { version: 1, branchName: "A" } });
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["bank-accounts", "list"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["bank-accounts", "detail", id] });
  });

  it("sends the reason only when there is one", async () => {
    const bodies: unknown[] = [];
    mswServer.use(http.put(`${base}/${id}/default`, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ account: {}, applied: true });
    }));
    const { wrapper } = setup();
    const { result } = renderHook(() => useSetDefaultBankAccount(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id });
      await result.current.mutateAsync({ id, reason: "Đổi tài khoản chính" });
    });
    expect(bodies).toEqual([{}, { reason: "Đổi tài khoản chính" }]);
  });

  it("drops the detail of a deleted account and refreshes the list", async () => {
    mswServer.use(http.delete(`${base}/${id}`, () => new HttpResponse(null, { status: 204 })));
    const { client, wrapper } = setup();
    client.setQueryData(["bank-accounts", "detail", id], { id });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useDeleteBankAccount(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id });
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["bank-accounts", "list"] });
    expect(client.getQueryData(["bank-accounts", "detail", id])).toBeUndefined();
  });
});
