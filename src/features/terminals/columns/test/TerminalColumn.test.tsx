// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Table } from "@/components/ui/table/Table";
import type { TerminalRow } from "../../types";
import { getTerminalColumns } from "../TerminalColumn";

afterEach(cleanup);

const base: TerminalRow = {
  id: "33333333-3333-4333-8333-333333333333",
  tid: "T0001",
  name: "Quầy 1",
  terminalType: "QR",
  address: "12 Lê Lợi, Q1",
  status: "ACTIVE",
  lockSource: null,
  subMerchantId: "11111111-1111-4111-8111-111111111111",
  subMerchantCode: "S1",
  subMerchantName: "Halo tech",
  merchantId: "22222222-2222-4222-8222-222222222222",
  contactPhone: null,
  createdAt: null,
};

function renderRows(rows: TerminalRow[]) {
  render(<Table data={rows} columns={getTerminalColumns({ onView: vi.fn() }, 1, 10)} enableSorting={false} pagination={false} />);
}

describe("terminal columns", () => {
  it("shows the type pill, the 7-day count with its total and the latest transaction time", () => {
    renderRows([{ ...base, txnCount7d: 4, txnAmount7d: 1750000, lastTxnAt: "2026-11-10T16:13:00" }]);
    expect(screen.getByText("QR")).toBeInTheDocument();
    expect(screen.getByText(/4 · 1\.750\.000/)).toBeInTheDocument();
    expect(screen.getByText("10/11 16:13")).toBeInTheDocument();
  });

  it("shows a plain 0 and a dash for a terminal that has not traded", () => {
    renderRows([{ ...base, terminalType: "POS", txnCount7d: 0, txnAmount7d: 0, lastTxnAt: null }]);
    expect(screen.getByText("POS")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByText(/vnđ/)).not.toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
