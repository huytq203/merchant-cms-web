// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DisbursementTopup } from "../../types/types";
import { TopupList } from "../TopupList";

const row = (over: Partial<DisbursementTopup>): DisbursementTopup => ({
  orderCode: "NT001", purpose: "CHI_HO", amount: 1_000_000, transferReference: "FT1", creditedOn: "2026-11-19",
  status: "Đã ghi nhận", statusCode: "APPROVED", decidedAt: null, decisionReason: null, accountingStatus: "POSTED", ...over,
});
afterEach(cleanup);

describe("TopupList", () => {
  it("shows the Hạch toán column and never offers a Nháp filter", () => {
    render(<TopupList subId="s" page={1} pageSize={10} total={3} rows={[
      row({}),
      row({ orderCode: "NT002", statusCode: "APPROVING", accountingStatus: "UNPOSTED" }),
      row({ orderCode: "NT003", statusCode: "PENDING_APPROVAL", accountingStatus: null }),
    ]} />);
    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Hạch toán" })).toBeInTheDocument();
    expect(within(table).getByText("Đã hạch toán")).toBeInTheDocument();
    expect(within(table).getByText("Chưa hạch toán")).toBeInTheDocument();
    const pending = within(table).getByText("NT003").closest("tr") as HTMLElement;
    expect(within(pending).getByText("Chờ duyệt")).toBeInTheDocument();
    expect(screen.queryByText(/Mới tạo|Nháp/)).not.toBeInTheDocument();
  });
});
