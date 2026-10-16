// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ledgerFixture } from "../../test/fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/escrow" }));
import { EscrowLedgerTable } from "../EscrowLedgerTable";

afterEach(cleanup);

describe("EscrowLedgerTable", () => {
  it("shows signed movements and asks the server for the next ledger page", async () => {
    render(<EscrowLedgerTable rows={ledgerFixture} total={45} page={1} pageSize={20} />);
    expect(screen.getByText("−15.000.000")).toBeInTheDocument();
    expect(screen.getAllByText("Nạp chuyển khoản")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: /Next|Trang sau/i }));
    expect(push).toHaveBeenCalledWith("/escrow?page=2&pageSize=20");
  });
});
