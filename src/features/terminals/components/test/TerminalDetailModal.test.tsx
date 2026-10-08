// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TerminalDetailModal } from "../TerminalDetailModal";
import type { TerminalDetail } from "../../types";

const detail: TerminalDetail = {
  id: "33333333-3333-4333-8333-333333333333",
  tid: "TML000001",
  name: "Quầy 1",
  terminalType: "ONLINE",
  address: null,
  status: "INACTIVE",
  lockSource: "DIRECT",
  subMerchantId: "11111111-1111-4111-8111-111111111111",
  subMerchantCode: "SM001",
  subMerchantName: "Điểm bán",
  merchantId: "22222222-2222-4222-8222-222222222222",
  contactPhone: null,
  createdAt: null,
  contactPerson: null,
  note: null,
};

afterEach(cleanup);

describe("terminal detail modal", () => {
  it("shows readable type and status instead of raw enum codes", () => {
    render(<TerminalDetailModal open onOpenChange={vi.fn()} detail={detail} />);
    expect(screen.queryByText("ONLINE")).not.toBeInTheDocument();
    expect(screen.queryByText("INACTIVE")).not.toBeInTheDocument();
    expect(screen.getByText("TML000001")).toBeInTheDocument();
  });

  it("reports a load error and no loading indicator", () => {
    render(<TerminalDetailModal open onOpenChange={vi.fn()} error="Không tải được" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Không tải được");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
