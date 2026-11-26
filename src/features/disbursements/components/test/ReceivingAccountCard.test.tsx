// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ReceivingAccountCard } from "../ReceivingAccountCard";

const account = { bankCode: "VCB", bankName: "Vietcombank", accountNumber: "0011000123456", accountName: "CONG TY BEAM", subCode: "SUB001" };
afterEach(cleanup);

describe("ReceivingAccountCard", () => {
  it("shows the Chi hộ guide, the account and the Sub code as the transfer content", () => {
    render(<ReceivingAccountCard accounts={[account]} purpose="CHI_HO" />);
    expect(screen.getByText(/Chuyển tiền nạp để chi hộ/)).toBeInTheDocument();
    const region = screen.getByRole("region", { name: "Tài khoản nhận tiền Vietcombank" });
    expect(within(region).getByText("0011000123456")).toBeInTheDocument();
    expect(within(region).getByText("Nội dung chuyển khoản")).toBeInTheDocument();
    expect(within(region).getByText("SUB001")).toBeInTheDocument();
  });

  it("shows the Hoàn guide when the purpose is HOAN", () => {
    render(<ReceivingAccountCard accounts={[{ ...account, accountNumber: "0011000654321" }]} purpose="HOAN" />);
    expect(screen.getByText(/Chuyển tiền nạp để hoàn/)).toBeInTheDocument();
    expect(screen.getByText("0011000654321")).toBeInTheDocument();
    expect(screen.queryByText(/để chi hộ/)).not.toBeInTheDocument();
  });

  it("groups by source of the original order when no refund is chosen", () => {
    render(<ReceivingAccountCard purpose="HOAN" groupBySource accounts={[
      { ...account, accountNumber: "0011000654321", accountType: "WALLET_ESCROW" },
      { ...account, accountType: "COLLECTION_DISBURSEMENT" },
    ]} />);
    const wallet = screen.getByRole("heading", { name: "Đơn thanh toán bằng ví FlexPay" }).closest("section") as HTMLElement;
    const other = screen.getByRole("heading", { name: "Đơn thanh toán bằng nguồn khác" }).closest("section") as HTMLElement;
    expect(within(wallet).getByText("0011000654321")).toBeInTheDocument();
    expect(within(other).getByText("0011000123456")).toBeInTheDocument();
    expect(within(other).getByText("SUB001")).toBeInTheDocument();
  });

  it("puts accounts without a known type under Tài khoản khác, never under a source group", () => {
    render(<ReceivingAccountCard purpose="HOAN" groupBySource accounts={[
      { ...account, accountNumber: "0011000654321", accountType: "WALLET_ESCROW" },
      { ...account, accountType: null },
      { ...account, accountNumber: "0011000999999", accountType: "SOMETHING_NEW" },
    ]} />);
    const other = screen.getByRole("heading", { name: "Tài khoản khác" }).closest("section") as HTMLElement;
    expect(within(other).getByText("0011000123456")).toBeInTheDocument();
    expect(within(other).getByText("0011000999999")).toBeInTheDocument();
    // Thứ bậc tiêu đề: khối h2 → nhóm h3 → từng TK h4.
    expect(screen.getByRole("heading", { level: 2, name: "Tài khoản nhận tiền nạp" })).toBeInTheDocument();
    expect(within(other).getAllByRole("heading", { level: 4 })).toHaveLength(2);
  });

  it("falls back to a flat list when no account has a known type", () => {
    render(<ReceivingAccountCard purpose="HOAN" groupBySource accounts={[{ ...account, accountType: null }]} />);
    expect(screen.queryByText(/Chưa cấu hình/)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Đơn thanh toán bằng ví FlexPay" })).not.toBeInTheDocument();
    expect(screen.getByText("0011000123456")).toBeInTheDocument();
  });

  it("says not configured when no account of that purpose exists", () => {
    render(<ReceivingAccountCard accounts={[]} purpose="HOAN" />);
    expect(screen.getByText("Chưa cấu hình tài khoản nhận tiền")).toBeInTheDocument();
  });
});
