// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { escrowContributionSchema } from "../../schemas";
import { contributionsFixture } from "../../test/fixtures";
import { EscrowContributionsTable } from "../EscrowContributionsTable";

afterEach(cleanup);

const SETOFF_SUB = {
  subMerchantId: "bbbbbbbb-0000-4000-8000-000000000003",
  subCode: "MC000001-S001",
  subName: "Halo tech",
  amount: 1_000_000,
  byForm: { SETOFF: 1_000_000 },
};

const parse = (rows: unknown[]) => escrowContributionSchema.array().parse(rows);

describe("EscrowContributionsTable", () => {
  it("counts a withdrawal set-off in the 'Từ doanh thu Sub' column and says so underneath", () => {
    render(<EscrowContributionsTable rows={parse([SETOFF_SUB])} masterName="Halo" />);
    const row = screen.getByText(/Halo tech/).closest("tr") as HTMLElement;
    const cells = within(row).getAllByRole("cell");
    // Contributor, Chuyển khoản, Từ doanh thu Sub, Tổng
    expect(cells[2]).toHaveTextContent("1.000.000");
    expect(cells[2]).toHaveTextContent("trong đó cấn trừ khi rút 1.000.000");
  });

  it("adds revenue and set-off, and totals every column in the last row", () => {
    const rows = parse([
      ...contributionsFixture,
      { ...SETOFF_SUB, byForm: { SUB_REVENUE: 400_000, SETOFF: 600_000 } },
    ]);
    render(<EscrowContributionsTable rows={rows} masterName="Halo" />);
    const mixed = screen.getByText(/Halo tech/).closest("tr") as HTMLElement;
    expect(within(mixed).getAllByRole("cell")[2]).toHaveTextContent("1.000.000");
    expect(within(mixed).getAllByRole("cell")[2]).toHaveTextContent("trong đó cấn trừ khi rút 600.000");

    const total = screen.getAllByRole("row").at(-1) as HTMLElement;
    const cells = within(total).getAllByRole("cell");
    expect(cells[1]).toHaveTextContent("30.000.000");
    expect(cells[2]).toHaveTextContent("31.000.000");
    expect(cells[2]).toHaveTextContent("trong đó cấn trừ khi rút 600.000");
    expect(cells[3]).toHaveTextContent("61.000.000");
  });

  it("shows no set-off note when nothing was set off", () => {
    render(<EscrowContributionsTable rows={parse(contributionsFixture)} masterName="Halo" />);
    expect(screen.queryByText(/cấn trừ khi rút/)).not.toBeInTheDocument();
  });
});
