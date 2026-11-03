import { StatusBadge } from "@/components/page/StatusBadge";
import { describeComplaintStatus } from "../constants/Complaint.constants";
import type { Complaint } from "../types/types";

/** Status and verdict in one badge, e.g. "Đã kết thúc – Chấp nhận". */
export function ComplaintStatusBadge({ complaint }: { complaint: Pick<Complaint, "status" | "verdict"> }) {
  const { label, tone } = describeComplaintStatus(complaint);
  return <StatusBadge label={label} tone={tone} />;
}
