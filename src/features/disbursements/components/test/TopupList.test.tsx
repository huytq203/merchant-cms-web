// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DisbursementTopup } from "../../types/types";
import { TopupList, topupListHref } from "../TopupList";

const row = (over: Partial<DisbursementTopup>): DisbursementTopup => ({
  orderCode: "NT001", purpose: "CHI_HO", amount: 1_000_000, transferReference: "FT1", creditedOn: "2026-11-19",
  status: "Hoàn thành", statusCode: "APPROVED", decidedAt: null, decisionReason: null, accountingStatus: "POSTED", ...over,
});
afterEach(cleanup);

describe("TopupList", () => {
  it("shows the Hạch toán column and never offers a Nháp filter", () => {
    render(<TopupList subId="s" page={1} pageSize={10} total={3} rows={[
      row({}),
      row({ orderCode: "NT002", accountingStatus: "UNPOSTED" }),
      row({ orderCode: "NT003", statusCode: "PENDING_APPROVAL", accountingStatus: null }),
    ]} />);
    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Hạch toán" })).toBeInTheDocument();
    expect(within(table).getByText("Đã hạch toán")).toBeInTheDocument();
    expect(within(table).getByText("Chưa hạch toán")).toBeInTheDocument();
    const pending = within(table).getByText("NT003").closest("tr") as HTMLElement;
    expect(within(pending).getByText("Chờ phê duyệt")).toBeInTheDocument();
    // Cả hai lệnh đã duyệt đều "Hoàn thành"; hạch toán chỉ khác ở cột riêng.
    expect(within(table).getAllByText("Hoàn thành")).toHaveLength(2);
    expect(screen.queryByText(/Mới tạo|Nháp/)).not.toBeInTheDocument();
  });

  it("keeps purpose and refundId when changing the status filter or page, marks the active chip as the current page", () => {
    render(<TopupList subId="s" page={1} pageSize={10} total={25} status="APPROVED" purpose="HOAN" refundId="r-1" rows={[row({})]} />);
    const filters = screen.getByRole("navigation", { name: "Lọc theo trạng thái" });
    const all = within(filters).getByRole("link", { name: "Tất cả" });
    expect(all).toHaveAttribute("href", "/disbursements/topups?subMerchantId=s&purpose=HOAN&refundId=r-1");
    const active = within(filters).getByRole("link", { current: "page" });
    expect(active.getAttribute("href")).toContain("status=APPROVED");
    const next = screen.getByRole("link", { name: "Trang sau" });
    expect(next).toHaveAttribute("href", "/disbursements/topups?subMerchantId=s&purpose=HOAN&refundId=r-1&status=APPROVED&page=2");
  });

  it("topupListHref keeps the status when switching purpose and drops empty values", () => {
    expect(topupListHref("s", 1, "REJECTED", { purpose: "CHI_HO" })).toBe("/disbursements/topups?subMerchantId=s&purpose=CHI_HO&status=REJECTED");
    expect(topupListHref("s", 1, undefined)).toBe("/disbursements/topups?subMerchantId=s");
  });
});
