import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/Card";
import { ChartBar, ChartPie } from "@/components/ui/chart/Chart";
import { Notice } from "@/components/page/Notice";
import { ResultState } from "@/components/page/ResultState";
import { domainErrorMessage } from "@/lib/be/errors";
import { getOrderSnapshot } from "@/server/modules/dashboard/dashboard.service";
import { ORDER_BUCKETS } from "../constants/order-buckets";
import { RegionError } from "./RegionError";

const SERIES = ORDER_BUCKETS.map(({ key, label, color }) => ({ key, name: label, color }));

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        <p className="text-[13px] text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">{children}</CardContent>
    </Card>
  );
}

export async function OrderCharts() {
  const result = await getOrderSnapshot();
  if (!result.success) {
    const message = `Không tải được biểu đồ đơn hàng. ${domainErrorMessage(result.error)}`;
    return (
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <ChartCard title="Đơn theo ngày" description="7 ngày gần nhất, tách theo trạng thái"><RegionError message={message} /></ChartCard>
        <ChartCard title="Tỷ lệ trạng thái" description="Trong tuần"><RegionError message={message} /></ChartCard>
      </div>
    );
  }
  const { week, truncated } = result.data;
  if (week.count === 0) {
    return (
      <ChartCard title="Đơn theo ngày" description="7 ngày gần nhất, tách theo trạng thái">
        <ResultState state="empty" emptyMessage="Chưa có đơn hàng nào trong 7 ngày qua. Biểu đồ sẽ xuất hiện khi có đơn." />
      </ChartCard>
    );
  }
  const summary = ORDER_BUCKETS.map(({ key, label }) => `${label}: ${week.totals[key]}`).join("; ");
  return (
    <div className="space-y-4">
      {truncated && (
        <Notice tone="warning">
          Tuần này có hơn {week.count} đơn. Biểu đồ và doanh thu 7 ngày chỉ tính {week.count} đơn mới nhất nên có thể thấp hơn thực tế. Số đơn hôm nay và chờ thanh toán vẫn đầy đủ.
        </Notice>
      )}
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <ChartCard title="Đơn theo ngày" description="7 ngày gần nhất, tách theo trạng thái">
          <div role="img" aria-label={`Số đơn theo ngày trong 7 ngày. Tổng cộng ${summary}`}>
            <ChartBar data={week.days} xKey="label" series={SERIES} stacked allowDecimals={false} height={300} />
          </div>
        </ChartCard>
        <ChartCard title="Tỷ lệ trạng thái" description={`Trong ${week.count} đơn của tuần`}>
          <div role="img" aria-label={`Tỷ lệ trạng thái đơn. ${summary}`}>
            <ChartPie
              data={ORDER_BUCKETS.map(({ key, label, color }) => ({ name: label, value: week.totals[key], color }))}
              donut
              showLabel={false}
              height={300}
            />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
