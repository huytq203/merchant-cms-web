import { Card } from "@/components/ui/card/Card";
import { StatusBadge } from "@/components/page/StatusBadge";
import { ORDER_STATUS_DISPLAY_OPTIONS, labelOf } from "@/features/orders/constants/Order.constants";
import { domainErrorMessage } from "@/lib/be/errors";
import { formatAmount } from "@/lib/utils/helper";
import { getOrderSnapshot } from "@/server/modules/dashboard/dashboard.service";
import { bucketOf } from "../utils/order-week";
import { formatVnTime } from "../utils/format";
import { RegionError } from "./RegionError";
import { RecentList } from "./RecentList";

const BUCKET_TONE = { paid: "success", waiting: "warning", failed: "danger", closed: "neutral" } as const;

export async function RecentOrders() {
  const result = await getOrderSnapshot();
  if (!result.success) {
    return <Card><RegionError message={`Không tải được đơn hàng gần nhất. ${domainErrorMessage(result.error)}`} /></Card>;
  }
  const rows = result.data.recent.map((order) => ({
    id: order.id,
    primary: order.orderCode,
    secondary: `${order.subMerchantName ?? order.merchantName ?? "—"} · ${formatVnTime(order.createdAt)}`,
    badge: <StatusBadge label={labelOf(ORDER_STATUS_DISPLAY_OPTIONS, order.status)} tone={BUCKET_TONE[bucketOf(order.status)]} />,
    amount: formatAmount(order.amount),
  }));
  return <RecentList title="Đơn hàng gần nhất" href="/order" rows={rows} emptyMessage="Chưa có đơn hàng nào trong 7 ngày qua." />;
}

