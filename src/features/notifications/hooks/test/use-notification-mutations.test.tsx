// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { useMarkAllNotificationsRead, useMarkNotificationRead } from "../use-notification-mutations";

const id = "11111111-1111-4111-8111-111111111111";

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

describe("notification mutation hooks", () => {
  it("marks one notification read and refreshes the list and the count", async () => {
    let called = false;
    mswServer.use(http.post(`/api/v1/admin/notifications/${id}/read`, () => {
      called = true;
      return HttpResponse.json({ id });
    }));
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(id);
    });
    expect(called).toBe(true);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["notifications"] });
  });

  it("marks everything read and refreshes the list and the count", async () => {
    mswServer.use(http.post("/api/v1/admin/notifications/read-all", () => HttpResponse.json({ updated: 4 })));
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useMarkAllNotificationsRead(), { wrapper });
    await act(async () => {
      expect(await result.current.mutateAsync()).toEqual({ updated: 4 });
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["notifications"] });
  });

  it("leaves the cache alone when the BE refuses", async () => {
    mswServer.use(http.post(`/api/v1/admin/notifications/${id}/read`, () => HttpResponse.json({ message: "Không tìm thấy" }, { status: 404 })));
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync(id)).rejects.toMatchObject({ status: 404 });
    });
    expect(invalidate).not.toHaveBeenCalled();
  });
});
