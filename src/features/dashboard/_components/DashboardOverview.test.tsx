// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { DashboardOverview } from "./DashboardOverview";
import RevenueChart from "./RevenueChart";
import type { DashboardOverview as Overview } from "../types/Dashboard.type";

const overviewPath = "/api/v1/admin/dashboard";
const chartPath = "/api/v1/admin/dashboard/revenue-chart";
const overview: Overview = {
  summary: {
    balance: 1_250_000,
    balanceChangePercent: 12,
    revenueToday: 45_800,
    revenueChangePercent: 5,
    successfulTransactionsToday: 1204,
    successfulTransactionsChangePercent: -2,
    conversionRatePercent: 94.2,
    conversionChangePercent: 0.5,
    masterMerchantCount: 1,
    subMerchantCount: 6,
    terminalCount: 24,
  },
  recentTransactions: [
    {
      id: "t-1",
      code: "TRX-1",
      customerName: "Khách hàng mẫu 001",
      cardType: "visa",
      amount: 150000,
      createdAt: "2026-09-30T08:00:00.000Z",
      status: "success",
    },
  ],
};

function renderWith(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

const chartSlot = <div data-slot-marker>biểu đồ</div>;

afterEach(cleanup);

describe("dashboard overview states", () => {
  it("shows loading, unsupported, empty and data states", async () => {
    mswServer.use(http.get(overviewPath, () => new Promise(() => {})));
    const loading = renderWith(<DashboardOverview chart={chartSlot} />);
    expect(screen.getByRole("status", { busy: true })).toBeInTheDocument();
    loading.unmount();

    mswServer.use(http.get(overviewPath, () => HttpResponse.json({ message: "x" }, { status: 501 })));
    const unsupported = renderWith(<DashboardOverview chart={chartSlot} />);
    expect(await screen.findByText("Chưa hỗ trợ")).toBeInTheDocument();
    expect(screen.getByText("biểu đồ")).toBeInTheDocument();
    unsupported.unmount();

    mswServer.use(http.get(overviewPath, () => HttpResponse.json({ ...overview, recentTransactions: [] })));
    const empty = renderWith(<DashboardOverview chart={chartSlot} />);
    expect(await screen.findByText("Chưa có giao dịch nào gần đây")).toBeInTheDocument();
    empty.unmount();

    mswServer.use(http.get(overviewPath, () => HttpResponse.json(overview)));
    renderWith(<DashboardOverview chart={chartSlot} />);
    expect(await screen.findByText("TRX-1")).toBeInTheDocument();
    expect(screen.getByText("1.250.000 đ")).toBeInTheDocument();
    expect(screen.getByText("6 đơn vị")).toBeInTheDocument();
    expect(screen.getByText("24 điểm bán")).toBeInTheDocument();
  });
});

describe("revenue chart states", () => {
  it("shows the unsupported notice instead of an empty chart", async () => {
    mswServer.use(http.get(chartPath, () => HttpResponse.json({ message: "x" }, { status: 501 })));
    renderWith(<RevenueChart />);
    expect(await screen.findByText("Chưa hỗ trợ")).toBeInTheDocument();
  });

  it("shows the failure message with a retry button", async () => {
    mswServer.use(http.get(chartPath, () => HttpResponse.json({ message: "Sự cố" }, { status: 502 })));
    renderWith(<RevenueChart />);
    expect(await screen.findByRole("alert", {}, { timeout: 4000 })).toHaveTextContent("Sự cố");
    expect(screen.getByRole("button", { name: /thử lại/i })).toBeInTheDocument();
  });
});
