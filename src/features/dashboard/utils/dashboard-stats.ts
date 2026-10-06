import type { DashboardSummary } from "../types/Dashboard.type";

export type StatCardKey = "balance" | "revenue" | "successful" | "conversion";

export type StatCardValues = {
  key: StatCardKey;
  title: string;
  value: string;
  trend: { value: string; direction: "up" | "down"; label: string };
};

const integerFormat = new Intl.NumberFormat("vi-VN");
const percentFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

function formatMoney(amount: number): string {
  return `${integerFormat.format(amount)} đ`;
}

function toTrend(changePercent: number, label: string): StatCardValues["trend"] {
  return {
    value: `${percentFormat.format(Math.abs(changePercent))}%`,
    direction: changePercent >= 0 ? "up" : "down",
    label,
  };
}

/** Summary numbers to the text shown on the four headline cards. */
export function toStatCardValues(summary: DashboardSummary): StatCardValues[] {
  return [
    {
      key: "balance",
      title: "Số dư hiện tại",
      value: formatMoney(summary.balance),
      trend: toTrend(summary.balanceChangePercent, "so với tháng trước"),
    },
    {
      key: "revenue",
      title: "Doanh thu hôm nay",
      value: formatMoney(summary.revenueToday),
      trend: toTrend(summary.revenueChangePercent, "· đã trừ phí (Net)"),
    },
    {
      key: "successful",
      title: "Giao dịch thành công",
      value: integerFormat.format(summary.successfulTransactionsToday),
      trend: toTrend(summary.successfulTransactionsChangePercent, "hôm qua"),
    },
    {
      key: "conversion",
      title: "Tỷ lệ chuyển đổi",
      value: `${percentFormat.format(summary.conversionRatePercent)}%`,
      trend: toTrend(summary.conversionChangePercent, "· thành công / khởi tạo"),
    },
  ];
}
