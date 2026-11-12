// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { unregisterPush, logoutAction } = vi.hoisted(() => ({ unregisterPush: vi.fn(), logoutAction: vi.fn() }));
vi.mock("@/features/notifications/push/register-push", () => ({ unregisterPush }));
vi.mock("@/features/auth/actions/logout-action", () => ({ logoutAction }));
import { useLogoutMutation } from "../use-logout-mutation";

beforeEach(() => {
  vi.clearAllMocks();
  unregisterPush.mockResolvedValue(undefined);
  logoutAction.mockResolvedValue(undefined);
});

describe("useLogoutMutation", () => {
  it("removes the push token before the session is cleared", async () => {
    const order: string[] = [];
    unregisterPush.mockImplementation(async () => { order.push("unregister"); });
    logoutAction.mockImplementation(async () => { order.push("logout"); });
    const { result } = renderHook(() => useLogoutMutation());
    act(() => result.current.logout());
    await waitFor(() => expect(logoutAction).toHaveBeenCalled());
    expect(order).toEqual(["unregister", "logout"]);
  });

  it("does not wait forever for a stalled token removal", async () => {
    vi.useFakeTimers();
    try {
      unregisterPush.mockReturnValue(new Promise(() => undefined));
      const { result } = renderHook(() => useLogoutMutation());
      act(() => result.current.logout());
      expect(logoutAction).not.toHaveBeenCalled();
      await act(async () => { await vi.advanceTimersByTimeAsync(3_100); });
      expect(logoutAction).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("still signs out when removing the token fails", async () => {
    unregisterPush.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useLogoutMutation());
    act(() => result.current.logout());
    await waitFor(() => expect(logoutAction).toHaveBeenCalled());
  });
});
