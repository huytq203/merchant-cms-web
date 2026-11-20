// @vitest-environment jsdom
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/api-client";

const requests = vi.hoisted(() => ({
  inquireName: vi.fn(),
  preview: vi.fn(),
  otpChallenge: vi.fn(),
  create: vi.fn(),
  find: vi.fn(),
}));
vi.mock("../../disbursement-queries", async () => {
  const actual = await vi.importActual<typeof import("../../disbursement-queries")>("../../disbursement-queries");
  return { ...actual, disbursementRequests: { ...actual.disbursementRequests, ...requests } };
});

import { useDisbursementCreateFlow } from "../use-disbursement-create-flow";
import { loadUnconfirmedOrder, unconfirmedOrderKey } from "../../utils/unconfirmed-order-store";
import { SUB_ID, previewFixture, verifiedInquiry, viewFixture } from "../../test/fixtures";

const challenge = { otpSessionId: "session-1", maskedRecipient: "a***@x.vn", expiresInSeconds: 300, canResendAfterSeconds: 60 };

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
}

/** Đưa form tới bước nhập OTP: tra tên đúng, xem trước được, đã xin mã. */
async function reachOtpStep() {
  const hook = renderHook(() => useDisbursementCreateFlow(SUB_ID), { wrapper });
  act(() => {
    hook.result.current.change("bankCode", "VCB");
    hook.result.current.change("accountNumber", "0123456789");
    hook.result.current.change("amount", "1000000");
  });
  await act(async () => { await hook.result.current.inquire(); });
  await act(async () => { await hook.result.current.review(); });
  await act(async () => { await hook.result.current.sendCode(); });
  return hook;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// Không có SessionProvider trong test: hook dùng khoá "anonymous" cho user.
const STORE_KEY = unconfirmedOrderKey("anonymous", SUB_ID);
const ORDER_NOT_FOUND = new ApiError(404, "Không tìm thấy lệnh chi hộ", "RESOURCE_NOT_FOUND");

beforeEach(() => {
  Object.values(requests).forEach((fn) => fn.mockReset());
  requests.inquireName.mockResolvedValue(verifiedInquiry);
  requests.preview.mockResolvedValue(previewFixture);
  requests.otpChallenge.mockResolvedValue(challenge);
});

describe("useDisbursementCreateFlow", () => {
  it("generates a request code when the form opens and lets the user edit it", () => {
    const { result } = renderHook(() => useDisbursementCreateFlow(SUB_ID), { wrapper });
    expect(result.current.values.merchantRequestCode).toMatch(/^P\d{12}[A-Z0-9]{4}$/);
    act(() => result.current.change("merchantRequestCode", "MA-CUA-TOI-01"));
    expect(result.current.values.merchantRequestCode).toBe("MA-CUA-TOI-01");
  });

  it("error503KeepsSameRequestCodeForRetry", async () => {
    // Thực tế: OTP là một lần, lần gửi đầu đã tiêu nó nên gửi lại bằng mã cũ bị từ chối; phải xin OTP mới, giữ mã YC.
    requests.create
      .mockRejectedValueOnce(new ApiError(503, "Hệ thống đang gặp sự cố", "6323"))
      .mockRejectedValueOnce(new ApiError(400, "Mã OTP không đúng hoặc đã hết hạn", "5732"))
      .mockResolvedValueOnce(viewFixture);
    requests.otpChallenge
      .mockResolvedValueOnce(challenge)
      .mockResolvedValueOnce({ ...challenge, otpSessionId: "session-2" });
    const { result } = await reachOtpStep();
    const code = result.current.values.merchantRequestCode;

    await act(async () => { await result.current.confirm("123456"); });
    expect(result.current.step).toBe("otp");
    expect(result.current.failure).toMatch(/cùng mã yêu cầu/);
    expect(result.current.outcomeUnknown).toBe(true);
    expect(result.current.values.merchantRequestCode).toBe(code);

    // Gửi lại với OTP cũ: BE từ chối 5732, cờ "chưa xác nhận" phải còn nguyên.
    await act(async () => { await result.current.confirm("123456"); });
    expect(result.current.outcomeUnknown).toBe(true);
    expect(result.current.failure).toMatch(/OTP/);

    // Xin OTP mới rồi gửi lại cùng mã YC.
    await act(async () => { await result.current.sendCode(); });
    expect(result.current.outcomeUnknown).toBe(true);
    await act(async () => { await result.current.confirm("654321"); });
    expect(requests.create).toHaveBeenCalledTimes(3);
    expect(requests.create.mock.calls[2]?.[0]).toMatchObject({
      merchantRequestCode: code,
      sensitiveOtp: { otpSessionId: "session-2", otp: "654321" },
    });
    expect(result.current.step).toBe("result");
    expect(result.current.outcomeUnknown).toBe(false);
  });

  it("locks the request code and the order fields while the outcome is unconfirmed", async () => {
    requests.create.mockRejectedValueOnce(new ApiError(503, "x", "6323"));
    const { result } = await reachOtpStep();
    const before = result.current.values;
    await act(async () => { await result.current.confirm("123456"); });
    act(() => result.current.back());
    act(() => result.current.back());
    expect(result.current.outcomeUnknown).toBe(true);
    act(() => {
      result.current.change("merchantRequestCode", "MA-MOI");
      result.current.change("amount", "5000000");
      result.current.change("accountNumber", "999");
    });
    expect(result.current.values).toEqual(before);
    expect(result.current.preview).not.toBeNull();
  });

  it("a lookup that finds no order keeps the whole lock (same code, same content) and says so", async () => {
    requests.create.mockRejectedValueOnce(new ApiError(503, "x", "6323"));
    requests.find.mockRejectedValueOnce(ORDER_NOT_FOUND);
    const { result } = await reachOtpStep();
    const before = result.current.values;
    await act(async () => { await result.current.confirm("123456"); });
    await act(async () => { await result.current.checkExisting(); });
    expect(result.current.outcomeUnknown).toBe(true);
    expect(result.current.failure).toMatch(/Chưa có lệnh nào/);
    expect(result.current.canAbandon).toBe(true);
    act(() => result.current.change("amount", "2000000"));
    expect(result.current.values).toEqual(before);
    expect(loadUnconfirmedOrder(STORE_KEY)).not.toBeNull();
  });

  it("another 404 (Sub not found) is not read as 'no such order'", async () => {
    requests.create.mockRejectedValueOnce(new ApiError(503, "x", "6323"));
    requests.find.mockRejectedValueOnce(new ApiError(404, "Không tìm thấy Sub-merchant", "RESOURCE_NOT_FOUND"));
    const { result } = await reachOtpStep();
    await act(async () => { await result.current.confirm("123456"); });
    await act(async () => { await result.current.checkExisting(); });
    expect(result.current.failure).toBe("Không tìm thấy Sub-merchant");
    expect(result.current.outcomeUnknown).toBe(true);
  });

  it("persists the unconfirmed order (without the OTP) and restores it after the flow remounts", async () => {
    requests.create.mockRejectedValueOnce(new ApiError(503, "x", "6323"));
    const first = await reachOtpStep();
    const code = first.result.current.values.merchantRequestCode;
    await act(async () => { await first.result.current.confirm("123456"); });
    expect(loadUnconfirmedOrder(STORE_KEY)?.values.merchantRequestCode).toBe(code);
    expect(localStorage.getItem(STORE_KEY)).not.toMatch(/otp|session-1/i);
    first.unmount();

    const second = renderHook(() => useDisbursementCreateFlow(SUB_ID), { wrapper });
    expect(second.result.current.outcomeUnknown).toBe(true);
    expect(second.result.current.values).toMatchObject({ merchantRequestCode: code, bankCode: "VCB", accountNumber: "0123456789", amount: "1000000" });
    expect(second.result.current.inquiry).toEqual(verifiedInquiry);
    // Đã khôi phục khoá: không sửa được mã YC, nhưng vẫn đi được tới OTP mới cùng mã.
    act(() => second.result.current.change("merchantRequestCode", "MA-MOI"));
    expect(second.result.current.values.merchantRequestCode).toBe(code);
    await act(async () => { await second.result.current.review(); });
    await act(async () => { await second.result.current.sendCode(); });
    expect(requests.otpChallenge).toHaveBeenLastCalledWith(expect.objectContaining({ merchantRequestCode: code }));
  });

  it("does not restore an order saved for another Sub", async () => {
    requests.create.mockRejectedValueOnce(new ApiError(503, "x", "6323"));
    const first = await reachOtpStep();
    await act(async () => { await first.result.current.confirm("123456"); });
    first.unmount();
    const other = renderHook(() => useDisbursementCreateFlow("99999999-9999-4999-8999-999999999999"), { wrapper });
    expect(other.result.current.outcomeUnknown).toBe(false);
  });

  it("clears the saved order when the send succeeds, the lookup finds it, or the user abandons it", async () => {
    // 1) gửi lại thành công
    requests.create.mockRejectedValueOnce(new ApiError(503, "x", "6323")).mockResolvedValueOnce(viewFixture);
    const a = await reachOtpStep();
    await act(async () => { await a.result.current.confirm("123456"); });
    expect(loadUnconfirmedOrder(STORE_KEY)).not.toBeNull();
    await act(async () => { await a.result.current.confirm("123456"); });
    expect(loadUnconfirmedOrder(STORE_KEY)).toBeNull();
    a.unmount();

    // 2) tra lại ra lệnh
    requests.create.mockRejectedValueOnce(new ApiError(503, "x", "6323"));
    requests.find.mockResolvedValueOnce(viewFixture);
    const b = await reachOtpStep();
    await act(async () => { await b.result.current.confirm("123456"); });
    await act(async () => { await b.result.current.checkExisting(); });
    expect(loadUnconfirmedOrder(STORE_KEY)).toBeNull();
    b.unmount();

    // 3) bỏ lệnh sau khi đã tra
    requests.create.mockRejectedValueOnce(new ApiError(503, "x", "6323"));
    requests.find.mockRejectedValueOnce(ORDER_NOT_FOUND);
    const c = await reachOtpStep();
    await act(async () => { await c.result.current.confirm("123456"); });
    await act(async () => { await c.result.current.checkExisting(); });
    act(() => c.result.current.abandonUnconfirmed());
    expect(loadUnconfirmedOrder(STORE_KEY)).toBeNull();
  });

  it("keeps the lock in memory when the storage throws", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    requests.create.mockRejectedValueOnce(new ApiError(503, "x", "6323"));
    const { result } = await reachOtpStep();
    await act(async () => { await result.current.confirm("123456"); });
    expect(result.current.outcomeUnknown).toBe(true);
    vi.restoreAllMocks();
  });

  it("saves the order BEFORE the create call, so a reload while sending still finds the lock", async () => {
    let release: (value: unknown) => void = () => undefined;
    requests.create.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
    const first = await reachOtpStep();
    const code = first.result.current.values.merchantRequestCode;
    let pending: Promise<void> = Promise.resolve();
    act(() => { pending = first.result.current.confirm("123456"); });
    expect(loadUnconfirmedOrder(STORE_KEY)?.values.merchantRequestCode).toBe(code);
    // Đang gửi: rời trang phải bị cảnh báo.
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    first.unmount();

    const second = renderHook(() => useDisbursementCreateFlow(SUB_ID), { wrapper });
    expect(second.result.current.outcomeUnknown).toBe(true);
    expect(second.result.current.values.merchantRequestCode).toBe(code);
    release(viewFixture);
    await act(async () => { await pending; });
  });

  it("drops the pre-saved order on success or on a definite 4xx that cannot have created the order", async () => {
    requests.create.mockResolvedValueOnce(viewFixture);
    const ok = await reachOtpStep();
    await act(async () => { await ok.result.current.confirm("123456"); });
    expect(loadUnconfirmedOrder(STORE_KEY)).toBeNull();
    ok.unmount();

    requests.create.mockRejectedValueOnce(new ApiError(400, "Mã OTP không đúng hoặc đã hết hạn", "5732"));
    const bad = await reachOtpStep();
    await act(async () => { await bad.result.current.confirm("000000"); });
    expect(bad.result.current.outcomeUnknown).toBe(false);
    expect(loadUnconfirmedOrder(STORE_KEY)).toBeNull();
  });

  it("keeps the lock when a wrong OTP follows an unconfirmed send", async () => {
    requests.create
      .mockRejectedValueOnce(new ApiError(503, "x", "6323"))
      .mockRejectedValueOnce(new ApiError(400, "Mã OTP không đúng hoặc đã hết hạn", "5732"));
    const { result } = await reachOtpStep();
    await act(async () => { await result.current.confirm("123456"); });
    await act(async () => { await result.current.confirm("000000"); });
    expect(result.current.outcomeUnknown).toBe(true);
    expect(loadUnconfirmedOrder(STORE_KEY)).not.toBeNull();
  });

  it("locks an already-open tab when another tab saves an unconfirmed order (storage event)", async () => {
    const { result } = renderHook(() => useDisbursementCreateFlow(SUB_ID), { wrapper });
    expect(result.current.outcomeUnknown).toBe(false);
    const saved = { values: { merchantRequestCode: "MA-TAB-A", bankCode: "VCB", accountNumber: "0123456789", accountName: "", amount: "1000000", description: "" }, inquiry: verifiedInquiry, mismatchAccepted: false, savedAt: 1 };
    act(() => {
      localStorage.setItem(STORE_KEY, JSON.stringify(saved));
      window.dispatchEvent(new StorageEvent("storage", { key: STORE_KEY, newValue: JSON.stringify(saved) }));
    });
    expect(result.current.outcomeUnknown).toBe(true);
    expect(result.current.values.merchantRequestCode).toBe("MA-TAB-A");
  });

  it("ignores storage events for other keys", () => {
    const { result } = renderHook(() => useDisbursementCreateFlow(SUB_ID), { wrapper });
    act(() => { window.dispatchEvent(new StorageEvent("storage", { key: "other", newValue: "{}" })); });
    expect(result.current.outcomeUnknown).toBe(false);
  });

  it("warns before the page unloads only while the order is unconfirmed", async () => {
    requests.create.mockRejectedValueOnce(new ApiError(503, "x", "6323"));
    const { result } = await reachOtpStep();
    const fire = () => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(fire()).toBe(false);
    await act(async () => { await result.current.confirm("123456"); });
    expect(fire()).toBe(true);
  });

  it("a failed lookup keeps the lock, and 'create another' is only offered after a lookup", async () => {
    requests.create.mockRejectedValueOnce(new ApiError(503, "x", "6323"));
    requests.find.mockRejectedValueOnce(new ApiError(503, "x", "6323"));
    const { result } = await reachOtpStep();
    const code = result.current.values.merchantRequestCode;
    await act(async () => { await result.current.confirm("123456"); });
    expect(result.current.canAbandon).toBe(false);
    act(() => result.current.abandonUnconfirmed());
    expect(result.current.outcomeUnknown).toBe(true);
    expect(result.current.values.merchantRequestCode).toBe(code);

    await act(async () => { await result.current.checkExisting(); });
    expect(result.current.outcomeUnknown).toBe(true);
    expect(result.current.canAbandon).toBe(true);

    act(() => result.current.abandonUnconfirmed());
    expect(result.current.outcomeUnknown).toBe(false);
    expect(result.current.step).toBe("form");
    expect(result.current.values.merchantRequestCode).not.toBe(code);
    expect(result.current.values.amount).toBe("");
  });

  it("sends the OTP session, the typed code and the name-mismatch flag, then shows the result", async () => {
    requests.inquireName.mockResolvedValue({ status: "NAME_MISMATCH", bankAccountName: "TRAN THI B" });
    requests.create.mockResolvedValue(viewFixture);
    const hook = renderHook(() => useDisbursementCreateFlow(SUB_ID), { wrapper });
    act(() => {
      hook.result.current.change("bankCode", "VCB");
      hook.result.current.change("accountNumber", "0123456789");
      hook.result.current.change("accountName", "Nguyen Van A");
      hook.result.current.change("amount", "1000000");
    });
    await act(async () => { await hook.result.current.inquire(); });
    // Tên khác: chưa tick thì không sang bước xem trước.
    await act(async () => { await hook.result.current.review(); });
    expect(hook.result.current.step).toBe("form");
    act(() => hook.result.current.acceptMismatch(true));
    await act(async () => { await hook.result.current.review(); });
    await act(async () => { await hook.result.current.sendCode(); });
    await act(async () => { await hook.result.current.confirm("123456"); });
    expect(requests.create).toHaveBeenCalledWith(expect.objectContaining({
      subId: SUB_ID,
      amount: 1_000_000,
      nameMismatchAccepted: true,
      sensitiveOtp: { otpSessionId: "session-1", otp: "123456" },
    }));
    expect(hook.result.current.step).toBe("result");
  });

  it("an unknown name inquiry never reaches the preview step", async () => {
    requests.inquireName.mockResolvedValue({ status: "UNKNOWN", bankAccountName: null });
    const hook = renderHook(() => useDisbursementCreateFlow(SUB_ID), { wrapper });
    act(() => {
      hook.result.current.change("bankCode", "VCB");
      hook.result.current.change("accountNumber", "0123456789");
      hook.result.current.change("amount", "1000000");
    });
    await act(async () => { await hook.result.current.inquire(); });
    await act(async () => { await hook.result.current.review(); });
    expect(hook.result.current.step).toBe("form");
    expect(requests.preview).not.toHaveBeenCalled();
  });

  it("changing the receiver after a name inquiry drops the inquiry and the ticked confirmation", async () => {
    requests.inquireName.mockResolvedValue({ status: "NAME_MISMATCH", bankAccountName: "TRAN THI B" });
    const hook = renderHook(() => useDisbursementCreateFlow(SUB_ID), { wrapper });
    act(() => {
      hook.result.current.change("bankCode", "VCB");
      hook.result.current.change("accountNumber", "0123456789");
    });
    await act(async () => { await hook.result.current.inquire(); });
    act(() => hook.result.current.acceptMismatch(true));
    act(() => hook.result.current.change("accountNumber", "0123456780"));
    expect(hook.result.current.inquiry).toBeNull();
    expect(hook.result.current.mismatchAccepted).toBe(false);
  });

  it("a 4xx refusal after the OTP lets the user fix the order, and the code may change", async () => {
    requests.create.mockRejectedValueOnce(new ApiError(409, "Mã yêu cầu đã được dùng cho lệnh khác", "DISBURSEMENT_REFUSED"));
    const { result } = await reachOtpStep();
    await act(async () => { await result.current.confirm("123456"); });
    expect(result.current.outcomeUnknown).toBe(false);
    expect(result.current.failure).toBe("Mã yêu cầu đã được dùng cho lệnh khác");
  });

  it("looks the order up by its code after an unconfirmed send", async () => {
    requests.create.mockRejectedValueOnce(new ApiError(503, "x", "6323"));
    requests.find.mockResolvedValueOnce(viewFixture);
    const { result } = await reachOtpStep();
    await act(async () => { await result.current.confirm("123456"); });
    await act(async () => { await result.current.checkExisting(); });
    expect(result.current.step).toBe("result");
  });
});
