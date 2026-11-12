// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/api-client";

const { openDisplay, fetchDisplayStatus } = vi.hoisted(() => ({ openDisplay: vi.fn(), fetchDisplayStatus: vi.fn() }));
vi.mock("../../customer-display-api", () => ({ openDisplay, fetchDisplayStatus }));
import { useCustomerDisplay } from "../use-customer-display";

const orderDisplay = {
  displayToken: "tok",
  kind: "ORDER",
  qrPayload: "000201",
  shop: { name: "Halo tech", terminalName: "Quầy 01" },
  orderCode: "DH-1",
  amount: 150000,
  fee: 0,
  payableAmount: 150000,
  expiresAt: "2026-11-12T10:15:00",
};
const staticDisplay = { ...orderDisplay, kind: "STATIC_QR", amount: null, payableAmount: null, expiresAt: null, orderCode: "SQABC" };
const waiting = { status: "WAITING", orderStatus: "ACTIVE" };
const flush = () => act(() => vi.advanceTimersByTimeAsync(0));
const after = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-11-12T10:00:00+07:00") });
  vi.clearAllMocks();
  fetchDisplayStatus.mockResolvedValue(waiting);
});
afterEach(() => vi.useRealTimers());

describe("useCustomerDisplay — order", () => {
  beforeEach(() => openDisplay.mockResolvedValue(orderDisplay));

  it("opens the display then asks the status every 3 seconds", async () => {
    const { result } = renderHook(() => useCustomerDisplay({ kind: "order", id: "o1" }));
    expect(result.current.status).toBe("loading");
    await flush();
    expect(result.current).toMatchObject({ status: "ready", phase: "waiting" });
    expect(openDisplay).toHaveBeenCalledWith({ kind: "order", id: "o1" });
    expect(fetchDisplayStatus).toHaveBeenCalledTimes(1);
    await after(3000);
    expect(fetchDisplayStatus).toHaveBeenCalledTimes(2);
    expect(fetchDisplayStatus).toHaveBeenCalledWith("tok");
  });

  it("switches to paid and stops asking", async () => {
    const { result } = renderHook(() => useCustomerDisplay({ kind: "order", id: "o1" }));
    await flush();
    fetchDisplayStatus.mockResolvedValue({ status: "PAID", orderStatus: "SUCCESS", paidAt: "2026-11-12T10:01:00", paidAmount: 150000 });
    await after(3000);
    expect(result.current.phase).toBe("paid");
    expect(result.current.payment).toMatchObject({ paidAmount: 150000 });
    const calls = fetchDisplayStatus.mock.calls.length;
    await after(9000);
    expect(fetchDisplayStatus).toHaveBeenCalledTimes(calls);
  });

  it("closes the QR when the order expires or is cancelled", async () => {
    fetchDisplayStatus.mockResolvedValue({ status: "CANCELLED", paidAt: null });
    const { result } = renderHook(() => useCustomerDisplay({ kind: "order", id: "o1" }));
    await flush();
    expect(result.current.phase).toBe("closed");
  });

  it("closes the QR at the expiry time even before the BE says so", async () => {
    const { result } = renderHook(() => useCustomerDisplay({ kind: "order", id: "o1" }));
    await flush();
    await after(15 * 60_000);
    expect(result.current.phase).toBe("closed");
  });

  it("flags a lost connection after three failed polls and keeps trying", async () => {
    const { result } = renderHook(() => useCustomerDisplay({ kind: "order", id: "o1" }));
    await flush();
    fetchDisplayStatus.mockRejectedValue(new TypeError("offline"));
    await after(9000);
    expect(result.current.offline).toBe(true);
    expect(result.current.phase).toBe("waiting");
    fetchDisplayStatus.mockResolvedValue(waiting);
    await after(3000);
    expect(result.current.offline).toBe(false);
  });

  it.each([401, 403, 404])("closes and stops asking when the token is rejected with %s", async (status) => {
    const { result } = renderHook(() => useCustomerDisplay({ kind: "order", id: "o1" }));
    await flush();
    fetchDisplayStatus.mockRejectedValue(new ApiError(status, "Mã hiển thị không hợp lệ hoặc đã hết hạn"));
    await after(3000);
    expect(result.current.phase).toBe("closed");
    const calls = fetchDisplayStatus.mock.calls.length;
    await after(9000);
    expect(fetchDisplayStatus).toHaveBeenCalledTimes(calls);
  });

  it("keeps asking after a rate limit (429)", async () => {
    const { result } = renderHook(() => useCustomerDisplay({ kind: "order", id: "o1" }));
    await flush();
    fetchDisplayStatus.mockRejectedValueOnce(new ApiError(429, "Màn hình hỏi trạng thái quá nhiều"));
    await after(3000);
    expect(result.current.phase).toBe("waiting");
    await after(3000);
    expect(fetchDisplayStatus).toHaveBeenCalledTimes(3);
  });

  it("reports an open failure and retries on demand", async () => {
    openDisplay.mockRejectedValueOnce(new ApiError(409, "Đơn hàng không còn chờ thanh toán"));
    const { result } = renderHook(() => useCustomerDisplay({ kind: "order", id: "o1" }));
    await flush();
    expect(result.current).toMatchObject({ status: "error", error: "Đơn hàng không còn chờ thanh toán" });
    act(() => result.current.retry());
    await flush();
    expect(result.current.status).toBe("ready");
  });
});

describe("useCustomerDisplay — static QR", () => {
  beforeEach(() => openDisplay.mockResolvedValue(staticDisplay));

  it("shows paid for 5 seconds then returns to the code, once per payment", async () => {
    const { result } = renderHook(() => useCustomerDisplay({ kind: "static-qr", id: "s1" }));
    await flush();
    const paid = { status: "PAID", paidAt: "2026-11-12T10:00:03", paidAmount: 45000 };
    fetchDisplayStatus.mockResolvedValue(paid);
    await after(3000);
    expect(result.current.phase).toBe("paid");
    await after(5000);
    expect(result.current.phase).toBe("waiting");
    // Cùng lần trả vẫn nằm trong cửa sổ 10 giây của BE: không nháy lại.
    await after(3000);
    expect(result.current.phase).toBe("waiting");
    fetchDisplayStatus.mockResolvedValue({ ...paid, paidAt: "2026-11-12T10:00:20" });
    await after(3000);
    expect(result.current.phase).toBe("paid");
  });

  it("closes when the static code is disabled or rotated (CANCELLED) or the token is rejected", async () => {
    const { result } = renderHook(() => useCustomerDisplay({ kind: "static-qr", id: "s1" }));
    await flush();
    fetchDisplayStatus.mockResolvedValue({ status: "CANCELLED" });
    await after(3000);
    expect(result.current.phase).toBe("closed");
    const calls = fetchDisplayStatus.mock.calls.length;
    await after(9000);
    expect(fetchDisplayStatus).toHaveBeenCalledTimes(calls);
  });

  it("closes a static display whose 12-hour token expired", async () => {
    const { result } = renderHook(() => useCustomerDisplay({ kind: "static-qr", id: "s1" }));
    await flush();
    fetchDisplayStatus.mockRejectedValue(new ApiError(403, "x"));
    await after(3000);
    expect(result.current.phase).toBe("closed");
  });

  it("never closes a static code on its own", async () => {
    const { result } = renderHook(() => useCustomerDisplay({ kind: "static-qr", id: "s1" }));
    await flush();
    await after(60 * 60_000);
    expect(result.current.phase).toBe("waiting");
  });
});
