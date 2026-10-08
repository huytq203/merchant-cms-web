// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { BankAccountsContainer } from "../BankAccountsContainer";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/bank-accounts" }));

const merchantId = "11111111-1111-4111-8111-111111111111";
const account = {
  id: "55555555-5555-4555-8555-555555555555",
  version: 4,
  merchantId,
  subMerchantId: null,
  bankCode: "VCB",
  accountNumber: "******7890",
  accountName: "CONG TY A",
  branchName: "Ha Noi",
  isDefault: true,
  status: "ACTIVE",
  linkStatus: "LINKED",
  payable: true,
};

afterEach(cleanup);

describe("bank accounts while the BE has no merchant write route", () => {
  function renderReadOnly() {
    mswServer.use(http.get("/api/v1/admin/bank-accounts", () => HttpResponse.json({ rows: [account], total: 1 })));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={client}>
        <BankAccountsContainer filter={{ page: 1, pageSize: 10, merchantId }} />
      </QueryClientProvider>,
    );
  }

  it("replaces the add button with a note and offers no write action per row", async () => {
    renderReadOnly();
    expect(await screen.findByText("******7890")).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent("Thêm hoặc đổi tài khoản ngân hàng hiện chưa mở trên cổng này");
    expect(screen.queryByRole("button", { name: /Thêm tài khoản/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sửa tài khoản|Không thể sửa|Xoá tài khoản|mặc định/ })).not.toBeInTheDocument();
  });

  it("still opens the read-only detail with the number as the BE masked it", async () => {
    renderReadOnly();
    await userEvent.click(await screen.findByRole("button", { name: /Xem tài khoản/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("******7890");
    expect(screen.queryByRole("button", { name: "Lưu thay đổi" })).not.toBeInTheDocument();
  });
});
