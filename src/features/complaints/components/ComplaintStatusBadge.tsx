import { StatusBadge } from "@/components/page/StatusBadge";
import { COMPLAINT_STATUS_OPTIONS } from "../constants/Complaint.constants";
import type { ComplaintStatus } from "../types/types";

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  const option = COMPLAINT_STATUS_OPTIONS.find((item) => item.value === status);
  return <StatusBadge label={option?.label ?? status} tone={option?.tone ?? "neutral"} />;
}
