// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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
      return HttpResponse.json({ granularity, from: "2026-10-05", to: "2026-11-03", points });
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
  mswServer.use(http.get("/api/v1/admin/sub-merchants/choices", () => HttpResponse.json([])));
});
afterEach(() => cleanup());

describe("RevenueBySubCard", () => {
  it("opens on the last 7 days and lists each Sub's gross, fee and net with a total", async () => {
    answer([point({}), point({ subMerchantId: "1311ae27-4ecb-447d-8c78-f3eb1307684c", subMerchantCode: "MC000001-S002", subMerchantName: "Halo Cầu Giấy", grossAmount: 700_000, feeAmount: 0, netAmount: 700_000 })]);
    renderCard();

    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Halo Láng");
    expect(rows[1]).toHaveTextContent("1.500.000");
    expect(rows[1]).toHaveTextContent("30.000");
    expect(rows[1]).toHaveTextContent("1.470.000");
    expect(rows[2]).toHaveTextContent("Halo Cầu Giấy");
    expect(screen.getByRole("list", { name: "Tổng kỳ" })).toHaveTextContent("2.200.000");
    expect(screen.getByRole("img", { name: /Doanh thu gộp theo ngày/ })).toBeInTheDocument();
    expect(requests[0]!.searchParams.get("preset")).toBe("DAY_7");
    expect(requests[0]!.searchParams.has("subMerchantIds")).toBe(false);
  });

  it("asks only for the chosen Subs once some are ticked", async () => {
    const first = "1311ae27-4ecb-447d-8c78-f3eb1307684c";
    mswServer.use(http.get("/api/v1/admin/sub-merchants/choices", () => HttpResponse.json([
      { id: first, code: "S2", name: "Halo Cầu Giấy", status: "ACTIVE" },
      { id: LANG, code: "S1", name: "Halo Láng", status: "ACTIVE" },
    ])));
    answer([point({})]);
    renderCard();
    await screen.findByRole("table");
    await userEvent.click(screen.getByRole("button", { name: /Sub-merchant/ }));
    await userEvent.click(await screen.findByRole("checkbox", { name: /Halo Cầu Giấy/ }));
    await userEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("subMerchantIds")).toBe(first));
  });

  it("picks the period from one row of choices, including this and last month, and sends that preset", async () => {
    answer([point({})]);
    renderCard();
    await screen.findByRole("table");

    // Không còn cặp "Theo ngày / Theo tháng": mọi kỳ nằm trong một nhóm nút.
    expect(screen.queryByRole("button", { name: "Theo tháng" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "30 ngày" }));
    await waitFor(() => expect(requests.at(-1)!.searchParams.get("preset")).toBe("DAY_30"));

    await userEvent.click(screen.getByRole("button", { name: "Tháng trước" }));
    await waitFor(() => expect(requests.at(-1)!.searchParams.get("preset")).toBe("LAST_MONTH"));
    expect(screen.getByText(/^Tháng \d{2}\/\d{4}, theo ngày thanh toán/)).toBeInTheDocument();
  });

  it("charts net or transaction count without asking the server again", async () => {
    answer([point({})]);
    renderCard();
    await screen.findByRole("table");
    const asked = requests.length;

    await userEvent.click(screen.getByRole("button", { name: "Thực nhận" }));
    expect(screen.getByRole("img", { name: /Thực nhận theo ngày/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Số giao dịch" }));
    expect(screen.getByRole("img", { name: /Số giao dịch theo ngày/ })).toBeInTheDocument();
    expect(requests.length).toBe(asked);
  });

  it("sums the period in summary tiles above the chart", async () => {
    answer([point({}), point({ subMerchantId: "1311ae27-4ecb-447d-8c78-f3eb1307684c", subMerchantCode: "MC000001-S002", subMerchantName: "nhinty12", transactionCount: 2, grossAmount: 700_000, feeAmount: 14_000, netAmount: 686_000 })]);
    renderCard();
    await screen.findByRole("table");

    const tiles = screen.getByRole("list", { name: "Tổng kỳ" });
    expect(within(tiles).getByText("Doanh thu gộp").parentElement).toHaveTextContent("2.200.000");
    expect(within(tiles).getByText("Phí").parentElement).toHaveTextContent("44.000");
    expect(within(tiles).getByText("Thực nhận").parentElement).toHaveTextContent("2.156.000");
    expect(within(tiles).getByText("Số giao dịch").parentElement).toHaveTextContent("3");
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
