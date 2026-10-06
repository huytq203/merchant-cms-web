import { CheckCircle2, FilePlus2, History, XCircle } from "lucide-react";
import { Timeline } from "@/components/ui/timeline/Timeline";
import { formatDate } from "@/lib/utils/helper";
import type { Refund } from "../types/type";
import { buildRefundHistory, type RefundHistoryKind } from "../utils/refund-history";
import { SectionTitle } from "./RefundDetailParts";

const KIND_STYLE = {
  created: { variant: "primary", icon: <FilePlus2 /> },
  approved: { variant: "success", icon: <CheckCircle2 /> },
  success: { variant: "success", icon: <CheckCircle2 /> },
  rejected: { variant: "danger", icon: <XCircle /> },
  cancelled: { variant: "danger", icon: <XCircle /> },
} as const satisfies Record<RefundHistoryKind, { variant: string; icon: React.ReactNode }>;

export function RefundHistorySection({ refund }: { refund: Refund }) {
  const items = buildRefundHistory(refund).map((entry) => ({
    title: entry.title,
    ...(entry.actor ? { description: `Bởi ${entry.actor}` } : {}),
    time: formatDate(entry.time),
    ...KIND_STYLE[entry.kind],
  }));
  return (
    <section>
      <SectionTitle icon={History} title="Lịch sử xử lý" />
      <Timeline size="sm" items={items} />
    </section>
  );
}
