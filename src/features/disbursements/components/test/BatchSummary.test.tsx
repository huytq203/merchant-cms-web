// @vitest-environment jsdom
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BatchDetail } from "../../types/types";
import { batchAggregateFixture, batchDetailFixture } from "../../test/fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
import { BatchSummary } from "../BatchSummary";

function renderBatch(detail: BatchDetail, canCreate = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const wrap = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return render(<BatchSummary initial={detail} canCreate={canCreate} />, { wrapper: wrap });
}
const withBatch = (patch: Partial<BatchDetail["batch"]>): BatchDetail => ({ ...batchDetailFixture, batch: { ...batchDetailFixture.batch, ...patch } });

afterEach(cleanup);

describe("BatchSummary", () => {
  it("shows the counts and the Send button for a live draft with valid rows and CREATE permission", () => {
    renderBatch(batchDetailFixture);
    expect(screen.getByRole("button", { name: "Gửi lô" })).toBeInTheDocument();
    expect(screen.getByText("Tổng số dòng").nextSibling).toHaveTextContent("4");
    expect(screen.getByText("Lỗi dữ liệu", { selector: "dt" }).nextSibling).toHaveTextContent("1");
  });

  it("hides Send without CREATE_DISBURSEMENT, and the error file with it", () => {
    renderBatch(batchDetailFixture, false);
    expect(screen.queryByRole("button", { name: "Gửi lô" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Tải file lỗi" })).not.toBeInTheDocument();
  });

  it.each(["SUBMITTING", "COMPLETED", "EXPIRED"])("hides Send when the batch is %s", (status) => {
    renderBatch(withBatch({ status }));
    expect(screen.queryByRole("button", { name: "Gửi lô" })).not.toBeInTheDocument();
  });

  it("hides Send when the draft has no valid row", () => {
    renderBatch(withBatch({ validRows: 0, invalidRows: 4 }));
    expect(screen.queryByRole("button", { name: "Gửi lô" })).not.toBeInTheDocument();
  });

  it("hides Send and explains when the 30-minute draft is past its expiry", () => {
    renderBatch(withBatch({ expiresAt: new Date(Date.now() - 60_000).toISOString() }));
    expect(screen.queryByRole("button", { name: "Gửi lô" })).not.toBeInTheDocument();
    expect(screen.getByText(/đã hết hạn/i)).toBeInTheDocument();
  });

  it("shows the draft expiry time while it is still valid", () => {
    renderBatch(batchDetailFixture);
    expect(screen.getByText(/Hết hạn lúc/)).toBeInTheDocument();
  });

  it("links the error file only when there are error rows", () => {
    renderBatch(batchDetailFixture);
    expect(screen.getByRole("link", { name: "Tải file lỗi" })).toHaveAttribute("href", expect.stringContaining(`/batches/${batchDetailFixture.batch.batchId}/errors`));
    cleanup();
    renderBatch(withBatch({ invalidRows: 0, totalRows: 3 }));
    expect(screen.queryByRole("link", { name: "Tải file lỗi" })).not.toBeInTheDocument();
  });

  it("lists the lines with their Vietnamese status and notes", () => {
    renderBatch(batchDetailFixture);
    expect(screen.getByText("Thiếu số tài khoản")).toBeInTheDocument();
  });

  it("batchProgressFromSummary: a submitted batch shows the order progress by status and links to its orders", () => {
    renderBatch({ ...withBatch({ status: "SUBMITTING" }), summary: batchAggregateFixture });
    const progress = screen.getByRole("region", { name: "Tiến độ chi" });
    expect(within(progress).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "60");
    expect(within(progress).getByText("Thành công", { selector: "dt" }).nextSibling).toHaveTextContent("4");
    expect(within(progress).getByText("Chưa rõ kết quả", { selector: "dt" }).nextSibling).toHaveTextContent("1");
    expect(within(progress).getByText(/4\.000\.000/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Xem các lệnh của lô/ })).toHaveAttribute(
      "href",
      `/disbursements/orders?batchId=${batchDetailFixture.batch.batchId}`,
    );
  });

  it("has no progress block for a draft, and says so when the progress could not be read", () => {
    renderBatch(batchDetailFixture);
    expect(screen.queryByRole("region", { name: "Tiến độ chi" })).not.toBeInTheDocument();
    cleanup();
    renderBatch({ ...withBatch({ status: "SUBMITTING" }), summary: null, summaryUnavailable: true });
    expect(screen.getByText(/Chưa đọc được tiến độ chi/)).toBeInTheDocument();
  });
});
