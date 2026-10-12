import { CircleDollarSign, Clock, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card/Card";
import { domainErrorMessage } from "@/lib/be/errors";
import { formatAmount } from "@/lib/utils/helper";
import { getOrderSnapshot } from "@/server/modules/dashboard/dashboard.service";
import { vnDay } from "../utils/order-week";
import { describeChange } from "../utils/format";
import { RegionError } from "./RegionError";
import { StatCard } from "./StatCard";

export async function OrderStatCards() {
  const result = await getOrderSnapshot();
  if (!result.success) {
    return (
      <Card className="sm:col-span-2 xl:col-span-3">
        <RegionError compact message={`Không tải được số liệu đơn hàng. ${domainErrorMessage(result.error)}`} />
      </Card>
    );
  }
  const { today, yesterday, waiting, week } = result.data;
  const change = describeChange(today, yesterday);
  const day = vnDay(new Date().toISOString()) as string;
  return (
    <>
      <StatCard
        title="Đơn hôm nay"
        value={String(today)}
        hint={change.text}
        hintTone={change.direction}
        icon={<ShoppingCart aria-hidden />}
        tone="primary"
        href={`/order?createdFrom=${day}&createdTo=${day}`}
      />
      <StatCard
        title="Doanh thu 7 ngày"
        value={formatAmount(week.revenue)}
        hint={`từ ${week.totals.paid} đơn đã thanh toán`}
        icon={<CircleDollarSign aria-hidden />}
        tone="success"
      />
      <StatCard
        title="Chờ thanh toán"
        value={String(waiting)}
        hint="bấm để xem danh sách"
        icon={<Clock aria-hidden />}
        tone="warning"
        href="/order?status=ACTIVE"
      />
    </>
  );
}
