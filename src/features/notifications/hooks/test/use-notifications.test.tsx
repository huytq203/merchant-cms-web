// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { notificationQueries } from "../../notification-queries";
import { notificationRow } from "../../test/fixtures";
import type { NotificationListResult } from "../../types";
import { useMarkAllRead, useMarkRead } from "../use-notification-mutations";
import { useUnreadCount } from "../use-unread-count";

const base = "/api/v1/merchant/notifications";
const allFilter = { unreadOnly: false, page: 1, pageSize: 20 };

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

describe("unread count", () => {
  it("returns the number from the BFF", async () => {
    mswServer.use(http.get(`${base}/unread-count`, () => HttpResponse.json({ count: 5 })));
    const { wrapper } = setup();
    const { result } = renderHook(() => useUnreadCount(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(5));
  });

  it("polls every 30 seconds and stops while the tab is hidden", () => {
    const options = notificationQueries.unreadCount();
    expect(options.refetchInterval).toBe(30_000);
    expect(options.refetchIntervalInBackground).toBe(false);
  });
});

describe("mark read mutations", () => {
  it("lowers the badge and marks the row read before the server answers, then refreshes", async () => {
    const row = notificationRow(1);
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    mswServer.use(http.post(`${base}/${row.id}/read`, async () => {
      await gate;
      return HttpResponse.json({ ...row, readAt: "2026-10-20T09:00:00Z" });
    }));
    const { client, wrapper } = setup();
    client.setQueryData(notificationQueries.unreadCount().queryKey, { count: 3 });
    client.setQueryData<NotificationListResult>(notificationQueries.list(allFilter).queryKey, { rows: [row], total: 1 });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useMarkRead(), { wrapper });

    let done: Promise<unknown> = Promise.resolve();
    act(() => { done = result.current.mutateAsync(row); });
    await waitFor(() => expect(client.getQueryData(notificationQueries.unreadCount().queryKey)).toEqual({ count: 2 }));
    expect(client.getQueryData<NotificationListResult>(notificationQueries.list(allFilter).queryKey)?.rows[0]?.readAt).not.toBeNull();

    release();
    await act(async () => { await done; });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["notifications"] });
  });

  it("restores the badge when the server refuses", async () => {
    const row = notificationRow(2);
    mswServer.use(http.post(`${base}/${row.id}/read`, () => HttpResponse.json({ message: "Không tìm thấy thông báo." }, { status: 404 })));
    const { client, wrapper } = setup();
    client.setQueryData(notificationQueries.unreadCount().queryKey, { count: 1 });
    const { result } = renderHook(() => useMarkRead(), { wrapper });
    await act(async () => { await result.current.mutateAsync(row).catch(() => undefined); });
    expect(client.getQueryData(notificationQueries.unreadCount().queryKey)).toEqual({ count: 1 });
  });

  it("does not lower the badge for a row that was already read", async () => {
    const row = notificationRow(3, { readAt: "2026-10-20T09:00:00Z" });
    mswServer.use(http.post(`${base}/${row.id}/read`, () => HttpResponse.json(row)));
    const { client, wrapper } = setup();
    client.setQueryData(notificationQueries.unreadCount().queryKey, { count: 2 });
    const { result } = renderHook(() => useMarkRead(), { wrapper });
    await act(async () => { await result.current.mutateAsync(row); });
    expect(client.getQueryData(notificationQueries.unreadCount().queryKey)).toEqual({ count: 2 });
  });

  it("clears the badge and every cached row when marking all read", async () => {
    mswServer.use(http.post(`${base}/read-all`, () => HttpResponse.json({ updated: 2 })));
    const { client, wrapper } = setup();
    client.setQueryData(notificationQueries.unreadCount().queryKey, { count: 2 });
    client.setQueryData<NotificationListResult>(notificationQueries.list(allFilter).queryKey, { rows: [notificationRow(1), notificationRow(2)], total: 2 });
    const { result } = renderHook(() => useMarkAllRead(), { wrapper });
    await act(async () => { await result.current.mutateAsync(); });
    expect(client.getQueryData(notificationQueries.unreadCount().queryKey)).toEqual({ count: 0 });
    const rows = client.getQueryData<NotificationListResult>(notificationQueries.list(allFilter).queryKey)?.rows ?? [];
    expect(rows.every((row) => row.readAt !== null)).toBe(true);
  });
});
