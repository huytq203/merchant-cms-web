// @vitest-environment jsdom
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/api-client";

const requests = vi.hoisted(() => ({
  validateBatch: vi.fn(),
  batchOtpChallenge: vi.fn(),
  submitBatch: vi.fn(),
}));
vi.mock("../../disbursement-queries", async () => {
  const actual = await vi.importActual<typeof import("../../disbursement-queries")>("../../disbursement-queries");
  return { ...actual, disbursementRequests: { ...actual.disbursementRequests, ...requests } };
});

import { useBatchSubmit, useBatchUpload } from "../use-disbursement-batch";
import { BATCH_ID, SUB_ID } from "../../test/fixtures";

const challenge = { otpSessionId: "batch-session", maskedRecipient: "a***@x.vn", expiresInSeconds: 300, canResendAfterSeconds: 60 };
const csv = (name = "lo.csv", size = 10) => new File([new Uint8Array(size).fill(65)], name, { type: "text/csv" });

let client: QueryClient;
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  Object.values(requests).forEach((fn) => fn.mockReset());
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

describe("useBatchUpload", () => {
  it("blocks a non-CSV file in the browser without calling the BFF", async () => {
    const onUploaded = vi.fn();
    const { result } = renderHook(() => useBatchUpload(SUB_ID, onUploaded), { wrapper });
    act(() => result.current.choose([csv("lo.xlsx")]));
    expect(result.current.error).toBe("Chỉ nhận file CSV (.csv)");
    expect(result.current.canUpload).toBe(false);
    await act(async () => { await result.current.upload(); });
    expect(requests.validateBatch).not.toHaveBeenCalled();
  });

  it("replaces the English file-picker rejection with a Vietnamese sentence", () => {
    const { result } = renderHook(() => useBatchUpload(SUB_ID, vi.fn()), { wrapper });
    act(() => result.current.choose([csv()]));
    act(() => result.current.reject());
    expect(result.current.file).toBeNull();
    expect(result.current.error).toBe("File không hợp lệ: chỉ nhận một file CSV, tối đa 2MB");
  });

  it("uploads a valid CSV for the chosen Sub and hands the result to the caller", async () => {
    const uploaded = { batchId: BATCH_ID, batchCode: "LO-001", totalRows: 2, validRows: 2, invalidRows: 0, totalAmount: 2, hasErrors: false, version: 1 };
    requests.validateBatch.mockResolvedValue(uploaded);
    const onUploaded = vi.fn();
    const { result } = renderHook(() => useBatchUpload(SUB_ID, onUploaded), { wrapper });
    const file = csv();
    act(() => result.current.choose([file]));
    expect(result.current.canUpload).toBe(true);
    await act(async () => { await result.current.upload(); });
    expect(requests.validateBatch).toHaveBeenCalledWith(SUB_ID, file);
    expect(onUploaded).toHaveBeenCalledWith(uploaded);
  });

  it("shows the BE Vietnamese message when the batch is refused and keeps the file", async () => {
    requests.validateBatch.mockRejectedValue(new ApiError(400, "File vượt quá 1.000 dòng", "6324"));
    const onUploaded = vi.fn();
    const { result } = renderHook(() => useBatchUpload(SUB_ID, onUploaded), { wrapper });
    act(() => result.current.choose([csv()]));
    await act(async () => { await result.current.upload(); });
    expect(result.current.error).toBe("File vượt quá 1.000 dòng");
    expect(onUploaded).not.toHaveBeenCalled();
    expect(result.current.file).not.toBeNull();
  });
});

describe("useBatchSubmit", () => {
  const batch = { batchId: BATCH_ID, version: 7 };

  it("asks for the OTP of this batch, then submits with the latest version and the OTP session", async () => {
    requests.batchOtpChallenge.mockResolvedValue(challenge);
    requests.submitBatch.mockResolvedValue({});
    const { result } = renderHook(() => useBatchSubmit(batch), { wrapper });
    await act(async () => { await result.current.requestCode(); });
    expect(requests.batchOtpChallenge).toHaveBeenCalledWith(BATCH_ID);
    expect(result.current.challenge).toEqual(challenge);
    await act(async () => { await result.current.submit("123456"); });
    expect(requests.submitBatch).toHaveBeenCalledWith(BATCH_ID, {
      expectedVersion: 7,
      sensitiveOtp: { otpSessionId: "batch-session", otp: "123456" },
    });
    expect(result.current.challenge).toBeNull();
  });

  it("sends the version of the batch passed on the latest render, not the one at mount", async () => {
    requests.batchOtpChallenge.mockResolvedValue(challenge);
    requests.submitBatch.mockResolvedValue({});
    const { result, rerender } = renderHook(({ version }) => useBatchSubmit({ batchId: BATCH_ID, version }), {
      wrapper,
      initialProps: { version: 7 },
    });
    await act(async () => { await result.current.requestCode(); });
    rerender({ version: 8 });
    await act(async () => { await result.current.submit("123456"); });
    expect(requests.submitBatch.mock.calls[0]?.[1]).toMatchObject({ expectedVersion: 8 });
  });

  it("refetches the batch even when the submit fails, so the screen shows the real state", async () => {
    requests.batchOtpChallenge.mockResolvedValue(challenge);
    requests.submitBatch.mockRejectedValue(new ApiError(409, "Lô không còn ở trạng thái chờ gửi", "6325"));
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useBatchSubmit(batch), { wrapper });
    await act(async () => { await result.current.requestCode(); });
    await act(async () => { await result.current.submit("123456"); });
    expect(result.current.failure).toBe("Lô không còn ở trạng thái chờ gửi");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["disbursements"] });
  });

  it("người không tải lô lên bấm Gửi: hiện nguyên câu 403 của BE và không phát OTP (chốt 20/11 điểm 6)", async () => {
    // DTO lô chưa có người tải lên nên FE không biết trước; BE chặn ở otp-challenge (FORBIDDEN, mã 2002).
    const text = "Chỉ người tải lên lô này mới được gửi duyệt";
    requests.batchOtpChallenge.mockRejectedValue(new ApiError(403, text, "FORBIDDEN"));
    const { result } = renderHook(() => useBatchSubmit(batch), { wrapper });
    await act(async () => { await result.current.requestCode(); });
    expect(result.current.failure).toBe(text);
    expect(result.current.challenge).toBeNull();
    // Cùng câu khi BE chặn ở bước gửi (ví dụ OTP đã phát trước khi đổi người).
    requests.batchOtpChallenge.mockResolvedValue(challenge);
    requests.submitBatch.mockRejectedValue(new ApiError(403, text, "FORBIDDEN"));
    await act(async () => { await result.current.requestCode(); });
    await act(async () => { await result.current.submit("123456"); });
    expect(result.current.failure).toBe(text);
  });

  it("lỗi 503 BE có câu riêng: hiện nguyên câu, không thay bằng câu lỗi hệ thống chung", async () => {
    const text = "Chưa đọc được dữ liệu chi hộ từ hệ thống chi, vui lòng thử lại sau ít phút";
    requests.batchOtpChallenge.mockRejectedValue(new ApiError(503, text, "MERCHANT_DISBURSEMENT_UNAVAILABLE"));
    const { result } = renderHook(() => useBatchSubmit(batch), { wrapper });
    await act(async () => { await result.current.requestCode(); });
    expect(result.current.failure).toBe(text);
  });

  it("does not send without an OTP challenge and rejects a malformed code before calling the BFF", async () => {
    requests.batchOtpChallenge.mockResolvedValue(challenge);
    const { result } = renderHook(() => useBatchSubmit(batch), { wrapper });
    await act(async () => { await result.current.submit("123456"); });
    expect(requests.submitBatch).not.toHaveBeenCalled();
    await act(async () => { await result.current.requestCode(); });
    await act(async () => { await result.current.submit("12"); });
    expect(requests.submitBatch).not.toHaveBeenCalled();
    expect(result.current.failure).toBeTruthy();
  });

  it("cancel drops the challenge", async () => {
    requests.batchOtpChallenge.mockResolvedValue(challenge);
    const { result } = renderHook(() => useBatchSubmit(batch), { wrapper });
    await act(async () => { await result.current.requestCode(); });
    act(() => result.current.cancel());
    expect(result.current.challenge).toBeNull();
  });
});
