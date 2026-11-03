import type { Complaint } from "../types/types";

export type ComplaintDetailActions = {
  /** Reply box and the "Từ chối" button. */
  canAct: boolean;
  /** The note shown instead of the actions, if any. */
  note: string | null;
};

/**
 * What the detail offers: replying and rejecting only on a PROCESSING complaint (the BE refuses any other
 * state with 6205) and only with REPLY_DISPUTE. A waiting complaint says it has not been accepted yet.
 */
export function complaintDetailActions(complaint: Pick<Complaint, "status">, canReply: boolean): ComplaintDetailActions {
  switch (complaint.status) {
    case "WAITING":
      return { canAct: false, note: "Đang chờ tiếp nhận" };
    case "PROCESSING":
      return { canAct: canReply, note: null };
    case "CLOSED":
      return { canAct: false, note: "Khiếu nại đã kết thúc, không thể phản hồi thêm." };
    case "CANCELLED":
      return { canAct: false, note: "Khiếu nại đã bị hủy, không thể phản hồi thêm." };
  }
}
