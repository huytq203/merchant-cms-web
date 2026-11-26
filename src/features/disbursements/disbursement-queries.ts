import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { sensitiveOtpChallengeSchema, type SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import type { BatchSubmitBody } from "./schemas/disbursement.schema";
import { toExportBody, toSearchBody } from "./utils/disbursement-filter-mapper";
import type {
  BatchDetail,
  BatchListFilter,
  BatchListResult,
  OrderDetail,
  OrderListFilter,
  OrderSearchPage,
  BatchSummaryData,
  BatchValidateResult,
  CreateBody,
  DisbursementOverview,
  DisbursementPreview,
  DisbursementView,
  NameInquiry,
  NameInquiryBody,
  OtpChallengeBody,
  PreviewBody,
  ReceivingAccount,
  TopupListFilter,
  TopupListResult,
} from "./types/types";

/** Các route Next (BFF) kiểm quyền theo phiên rồi chuyển sang `/api/v1/merchant/disbursements` của BE. */
export const DISBURSEMENTS_ENDPOINT = "/v1/admin/disbursements";

const id = encodeURIComponent;

/** Mọi ghi đều tự hiện kết quả/lỗi ngay trên màn hình nên không bật toast chung của apiClient. */
const NO_TOAST = { toast: false } as const;

export const disbursementQueries = {
  overview: (subId: string) => queryOptions({
    queryKey: ["disbursements", "overview", subId] as const,
    queryFn: () => apiClient.get<DisbursementOverview>(`${DISBURSEMENTS_ENDPOINT}/subs/${id(subId)}/overview`),
    enabled: subId !== "",
  }),
  topups: (subId: string, filter: TopupListFilter) => queryOptions({
    queryKey: ["disbursements", "topups", subId, filter] as const,
    queryFn: () => apiClient.get<TopupListResult>(`${DISBURSEMENTS_ENDPOINT}/subs/${id(subId)}/topups`, {
      query: { page: filter.page, pageSize: filter.pageSize, ...(filter.status ? { status: filter.status } : {}) },
    }),
    enabled: subId !== "",
  }),
  receivingAccounts: (subId: string, purpose: string, refundId?: string) => queryOptions({
    queryKey: ["disbursements", "receiving-accounts", subId, purpose, refundId ?? null] as const,
    queryFn: () => apiClient.get<ReceivingAccount[]>(`${DISBURSEMENTS_ENDPOINT}/receiving-accounts`, {
      query: { subId, purpose, ...(refundId ? { refundId } : {}) },
    }),
  }),
  /**
   * Danh sách lệnh. POST để mã lệnh / mã YC / Ref tìm kiếm không nằm trên URL hay log truy cập; trang gửi lên 0-based.
   * Lỗi 503 (6323) của BE là "chưa đọc được dữ liệu chi hộ", đọc không có tác dụng phụ nên chỉ cần thử lại.
   */
  orders: (filter: OrderListFilter) => queryOptions({
    queryKey: ["disbursements", "orders", filter] as const,
    queryFn: () => apiClient.post<OrderSearchPage>(`${DISBURSEMENTS_ENDPOINT}/search`, toSearchBody(filter), NO_TOAST),
  }),
  /** Chi tiết một lệnh; BE trả 404 khi lệnh của Sub ngoài phạm vi phiên. */
  order: (operationId: string) => queryOptions({
    queryKey: ["disbursements", "order", operationId] as const,
    queryFn: () => apiClient.get<OrderDetail>(`${DISBURSEMENTS_ENDPOINT}/orders/${id(operationId)}`),
    enabled: operationId !== "",
  }),
  /** Danh sách lô kèm tổng hợp trạng thái lệnh; trang 1-based như các danh sách khác của Portal. */
  batches: (filter: BatchListFilter) => queryOptions({
    queryKey: ["disbursements", "batches", filter] as const,
    queryFn: () => apiClient.get<BatchListResult>(`${DISBURSEMENTS_ENDPOINT}/batches`, {
      query: {
        page: filter.page,
        pageSize: filter.pageSize,
        ...(filter.subId ? { subId: filter.subId } : {}),
        ...(filter.status ? { status: filter.status } : {}),
      },
    }),
  }),
  /** Chi tiết lô; trang đang xem lô SUBMITTING sẽ tự hỏi lại đến khi gửi xong. */
  batch: (batchId: string) => queryOptions({
    queryKey: ["disbursements", "batch", batchId] as const,
    queryFn: () => apiClient.get<BatchDetail>(`${DISBURSEMENTS_ENDPOINT}/batches/${id(batchId)}`),
    enabled: batchId !== "",
  }),
};

/** Các lệnh ghi/tra của luồng tạo lệnh và lô; tách khỏi hook để test được độc lập với React. */
export const disbursementRequests = {
  inquireName: (body: NameInquiryBody) =>
    apiClient.post<NameInquiry>(`${DISBURSEMENTS_ENDPOINT}/name-inquiry`, body, NO_TOAST),
  preview: (body: PreviewBody) =>
    apiClient.post<DisbursementPreview>(`${DISBURSEMENTS_ENDPOINT}/preview`, body, NO_TOAST),
  /** Mã OTP gắn đúng (Sub, mã yêu cầu, số tiền, người nhận); đổi một trong số đó phải xin mã mới. */
  otpChallenge: async (body: OtpChallengeBody): Promise<SensitiveOtpChallenge> =>
    sensitiveOtpChallengeSchema.parse(await apiClient.post(`${DISBURSEMENTS_ENDPOINT}/otp-challenge`, body, NO_TOAST)),
  create: (body: CreateBody) => apiClient.post<DisbursementView>(DISBURSEMENTS_ENDPOINT, body, NO_TOAST),
  /** Tra lại lệnh theo mã yêu cầu (sau khi chưa xác nhận được kết quả). 404 = chắc chắn chưa có lệnh. */
  find: (subId: string, merchantRequestCode: string) =>
    apiClient.get<DisbursementView>(`${DISBURSEMENTS_ENDPOINT}/subs/${id(subId)}/requests/${id(merchantRequestCode)}`),
  validateBatch: (subId: string, file: File) => {
    const form = new FormData();
    form.append("subId", subId);
    form.append("file", file);
    return apiClient.post<BatchValidateResult>(`${DISBURSEMENTS_ENDPOINT}/batches/validate`, form, NO_TOAST);
  },
  batchOtpChallenge: async (batchId: string): Promise<SensitiveOtpChallenge> =>
    sensitiveOtpChallengeSchema.parse(
      await apiClient.post(`${DISBURSEMENTS_ENDPOINT}/batches/${id(batchId)}/otp-challenge`, undefined, NO_TOAST),
    ),
  submitBatch: (batchId: string, body: BatchSubmitBody) =>
    apiClient.post<BatchSummaryData>(`${DISBURSEMENTS_ENDPOINT}/batches/${id(batchId)}/submit`, body, NO_TOAST),
};

/**
 * Xuất CSV mọi lệnh khớp bộ lọc hiện tại (không phân trang; BE tối đa 50.000 dòng, STK che, UTF-8 có BOM). Đọc blob nên
 * đi thẳng bằng `fetch`; lỗi giữ nguyên câu tiếng Việt của BE (ví dụ vượt số dòng tối đa) để màn hình hiện lại.
 */
export async function downloadDisbursementsCsv(filter: OrderListFilter): Promise<void> {
  const send = () => fetch(`/api${DISBURSEMENTS_ENDPOINT}/export`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "text/csv, application/json" },
    body: JSON.stringify(toExportBody(filter)),
  });
  let response = await send();
  if (response.status === 401) {
    // Cùng cách của apiClient: làm mới phiên một lần; không được thì về trang đăng nhập (đường xoá cookie rồi chuyển hướng).
    const refreshed = await fetch("/api/v1/admin/auth/refresh", { method: "POST", credentials: "include" }).then((r) => r.ok, () => false);
    if (refreshed) response = await send();
    if (response.status === 401) window.location.assign(new URL("/api/v1/admin/auth/session-expired", window.location.origin).href);
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Không xuất được file, vui lòng thử lại");
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = /filename="?([^";]+)"?/i.exec(response.headers.get("content-disposition") ?? "")?.[1]?.trim() ?? "chi-ho.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
