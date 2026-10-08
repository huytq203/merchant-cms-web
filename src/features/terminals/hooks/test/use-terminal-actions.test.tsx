// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { mswServer } from "@/test/msw";
import type { TerminalFormValues } from "../../schemas";
import type { TerminalRow } from "../../types";
import { useTerminalActions } from "../use-terminal-actions";
import { useTerminalDialogs } from "../use-terminal-dialogs";

const base = "/api/v1/admin/terminals";
const row = { id: "33333333-3333-4333-8333-333333333333", name: "Quầy 1" } as TerminalRow;
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
const unhandled = vi.fn();

function setup(dialog: "lock" | "unlock" | "edit" | "create") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => {
    const dialogs = useTerminalDialogs();
    return { dialogs, actions: useTerminalActions(dialogs) };
  }, { wrapper });
  act(() => {
    if (dialog === "create") hook.result.current.dialogs.openCreate();
    else hook.result.current.dialogs.openFor(dialog, row);
  });
  return hook;
}

beforeEach(() => process.on("unhandledRejection", unhandled));
afterEach(() => {
  process.off("unhandledRejection", unhandled);
  unhandled.mockClear();
});

describe("terminal actions", () => {
  it.each(["lock", "unlock"] as const)("keeps the dialog open and does not reject when %s fails", async (action) => {
    mswServer.use(http.post(`${base}/${row.id}/${action}`, () => HttpResponse.json({ message: "Xung đột trạng thái" }, { status: 409 })));
    const { result } = setup(action);
    const confirm = action === "lock" ? result.current.actions.confirmLock : result.current.actions.confirmUnlock;
    await act(async () => {
      await expect(confirm("Lý do hợp lệ")).resolves.toBeUndefined();
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(unhandled).not.toHaveBeenCalled();
    expect(result.current.dialogs.activeDialog).toBe(action);
    const failed = action === "lock" ? result.current.actions.lock : result.current.actions.unlock;
    expect(failed.error?.message).toBe("Xung đột trạng thái");
  });

  it.each(["lock", "unlock"] as const)("sends the reason and closes the dialog when %s succeeds", async (action) => {
    let body: unknown;
    mswServer.use(http.post(`${base}/${row.id}/${action}`, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ id: row.id });
    }));
    const { result } = setup(action);
    const confirm = action === "lock" ? result.current.actions.confirmLock : result.current.actions.confirmUnlock;
    await act(async () => confirm("Lý do hợp lệ"));
    expect(body).toEqual({ reason: "Lý do hợp lệ" });
    expect(result.current.dialogs.activeDialog).toBeNull();
  });

  it("keeps the form open and exposes the error when saving fails", async () => {
    mswServer.use(http.post(base, () => HttpResponse.json({ message: "Đã tồn tại" }, { status: 409 })));
    const { result } = setup("create");
    await act(async () => {
      await expect(result.current.actions.submitSave(values)).resolves.toBeUndefined();
    });
    expect(unhandled).not.toHaveBeenCalled();
    expect(result.current.dialogs.activeDialog).toBe("create");
    expect(result.current.actions.save.error?.message).toBe("Đã tồn tại");
  });

  it("clears a previous error when the dialog is closed", async () => {
    mswServer.use(http.post(`${base}/${row.id}/lock`, () => HttpResponse.json({ message: "Lỗi" }, { status: 500 })));
    const { result } = setup("lock");
    await act(async () => result.current.actions.confirmLock("Lý do hợp lệ"));
    expect(result.current.actions.lock.error).not.toBeNull();
    act(() => result.current.actions.closeDialog());
    await waitFor(() => expect(result.current.actions.lock.error).toBeNull());
    expect(result.current.dialogs.activeDialog).toBeNull();
  });
});
