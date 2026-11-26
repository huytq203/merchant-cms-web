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

  it("says not configured when no account of that purpose exists", () => {
    render(<ReceivingAccountCard accounts={[]} purpose="HOAN" />);
    expect(screen.getByText("Chưa cấu hình tài khoản nhận tiền")).toBeInTheDocument();
  });
});
