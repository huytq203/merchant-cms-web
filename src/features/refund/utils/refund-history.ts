import type { Refund } from "../types/type";

export type RefundHistoryKind = "created" | "approved" | "rejected" | "success" | "cancelled";

export interface RefundHistoryEntry {
  kind: RefundHistoryKind;
  title: string;
  time: string;
  /** Only the creator stored on the refund; status changes carry no actor in the data. */
  actor?: string;
}

const STATUS_TITLES = {
  approved: "Yêu cầu đã được duyệt",
  rejected: "Yêu cầu bị từ chối",
  success: "Hoàn tiền thành công",
  cancelled: "Yêu cầu đã hủy",
} as const;

/** The timeline holds only what the refund itself stores: creation, then the last status change. */
export function buildRefundHistory(refund: Refund): RefundHistoryEntry[] {
  const created: RefundHistoryEntry = {
    kind: "created",
    title: "Tạo yêu cầu hoàn tiền",
    time: refund.createdAt,
    ...(refund.createdBy ? { actor: refund.createdBy } : {}),
  };
  if (refund.status === "pending" || !refund.updatedAt) return [created];
  return [created, { kind: refund.status, title: STATUS_TITLES[refund.status], time: refund.updatedAt }];
}
