import type { ComplaintStatus } from "../types/types";

export type DeadlineInfo = { tone: "late" | "soon" | "ok"; label: string };

const HOUR_MS = 3_600_000;

/** Only a complaint still open (waiting or in progress) runs against its deadline. */
const OPEN_STATUSES: ReadonlySet<ComplaintStatus> = new Set(["WAITING", "PROCESSING"]);

/** How much time an open complaint has left; closed/cancelled complaints and missing or invalid deadlines show none. */
export function describeDeadline(deadline: string | null | undefined, status: ComplaintStatus, now: Date): DeadlineInfo | null {
  if (!deadline || !OPEN_STATUSES.has(status)) return null;
  const due = new Date(deadline).getTime();
  if (Number.isNaN(due)) return null;
  const diff = due - now.getTime();
  if (diff < 0) {
    const hours = Math.ceil(-diff / HOUR_MS);
    return { tone: "late", label: hours >= 24 ? `Quá hạn ${Math.ceil(hours / 24)} ngày` : `Quá hạn ${hours} giờ` };
  }
  const hours = Math.floor(diff / HOUR_MS);
  const days = Math.floor(hours / 24);
  return { tone: hours <= 24 ? "soon" : "ok", label: days >= 1 ? `Còn ${days} ngày` : `Còn ${hours} giờ` };
}
