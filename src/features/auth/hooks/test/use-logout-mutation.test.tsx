// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { unregisterPush, logoutAction } = vi.hoisted(() => ({ unregisterPush: vi.fn(), logoutAction: vi.fn() }));
vi.mock("@/features/notifications/push/register-push", () => ({ unregisterPush }));
vi.mock("@/features/auth/actions/logout-action", () => ({ logoutAction }));
vi.mock("@/features/auth/components/session-provider", () => ({ useOptionalSession: () => ({ userId: "u1" }) }));
import { saveUnconfirmedOrder, loadUnconfirmedOrder, unconfirmedOrderKey } from "@/features/disbursements/utils/unconfirmed-order-store";
import { useLogoutMutation } from "../use-logout-mutation";

beforeEach(() => {
  vi.clearAllMocks();
  unregisterPush.mockResolvedValue(undefined);
  logoutAction.mockResolvedValue(undefined);
});

describe("useLogoutMutation", () => {
  it("clears the user's saved unconfirmed disbursement orders on sign-out", async () => {
    const order = {
      values: { merchantRequestCode: "MA-01", bankCode: "VCB", accountNumber: "0123456789", accountName: "", amount: "1000000", description: "" },
      inquiry: null,
      mismatchAccepted: false,
      savedAt: 1,
    };
    saveUnconfirmedOrder(unconfirmedOrderKey("u1", "s1"), order);
    saveUnconfirmedOrder(unconfirmedOrderKey("u2", "s1"), order);
    const { result } = renderHook(() => useLogoutMutation());
    act(() => result.current.logout());
    await waitFor(() => expect(logoutAction).toHaveBeenCalled());
    expect(loadUnconfirmedOrder(unconfirmedOrderKey("u1", "s1"))).toBeNull();
    expect(loadUnconfirmedOrder(unconfirmedOrderKey("u2", "s1"))).not.toBeNull();
    localStorage.clear();
  });

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
