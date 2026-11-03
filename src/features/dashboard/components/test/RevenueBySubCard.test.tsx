// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { RevenueBySubCard } from "../RevenueBySubCard";

const path = "/api/v1/admin/merchants/revenue-stats";
const LANG = "5dcda5e6-afd1-4201-a02f-7187164f0f86";
const requests: URL[] = [];

const point = (overrides: Record<string, unknown>) => ({
  subMerchantId: LANG,
  subMerchantCode: "MC000001-S001",
  subMerchantName: "Halo Láng",
  period: "2026-11-02",
  transactionCount: 1,
  grossAmount: 1_500_000,
  feeAmount: 30_000,
  netAmount: 1_470_000,
  ...overrides,
});

function answer(points: unknown[], granularity = "DAY") {
  mswServer.use(
    http.get(path, ({ request }) => {
      requests.push(new URL(request.url));
      const asked = new URL(request.url).searchParams.get("granularity") ?? granularity;
      return HttpResponse.json({ granularity: asked, from: "2026-10-05", to: "2026-11-03", points });
    }),
  );
}

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RevenueBySubCard />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  requests.length = 0;
  mswServer.use(http.get("/api/v1/admin/sub-merchants", () => HttpResponse.json({ rows: [], total: 0 })));
});
afterEach(() => cleanup());

describe("RevenueBySubCard", () => {
  it("opens on the last 30 days and lists each Sub's gross, fee and net with a total", async () => {
    answer([point({}), point({ subMerchantId: "1311ae27-4ecb-447d-8c78-f3eb1307684c", subMerchantCode: "MC000001-S002", subMerchantName: "Halo Cầu Giấy", grossAmount: 700_000, feeAmount: 0, netAmount: 700_000 })]);
    renderCard();

    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Halo Láng");
    expect(rows[1]).toHaveTextContent("1.500.000");
    expect(rows[1]).toHaveTextContent("30.000");
    expect(rows[1]).toHaveTextContent("1.470.000");
    expect(rows[2]).toHaveTextContent("Halo Cầu Giấy");
    expect(screen.getByText("Tổng cộng")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Doanh thu gộp theo ngày/ })).toBeInTheDocument();
    expect(requests[0]!.searchParams.get("granularity")).toBe("DAY");
    expect(requests[0]!.searchParams.has("subMerchantId")).toBe(false);
  });

  it("switches to the last 12 months", async () => {
    answer([point({ period: "2026-11" })]);
    renderCard();
    await screen.findByRole("table");

    await userEvent.click(screen.getByRole("button", { name: "Theo tháng" }));

    await screen.findByRole("img", { name: /Doanh thu gộp theo tháng/ });
    expect(requests.at(-1)!.searchParams.get("granularity")).toBe("MONTH");
  });

  it("says when there is no payment yet and shows the BE error with a retry", async () => {
    answer([]);
    const empty = renderCard();
    expect(await screen.findByText(/Chưa có giao dịch thanh toán nào/)).toBeInTheDocument();
    empty.unmount();

    mswServer.use(http.get(path, () => HttpResponse.json({ message: "Không tìm thấy điểm bán" }, { status: 404 })));
    renderCard();
    expect(await screen.findByText(/Không tìm thấy điểm bán/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
