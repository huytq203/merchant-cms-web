// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { ComplaintCreateDialog } from "../ComplaintCreateDialog";

vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));

const base = "/api/v1/admin/merchants/complaints";
const NOT_OWNED = "Mã giao dịch không tồn tại";

afterEach(() => cleanup());

function renderDialog(props: { transactionCode?: string; orderCode?: string } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ComplaintCreateDialog open onOpenChange={() => {}} {...props} />
    </QueryClientProvider>,
  );
}

describe("ComplaintCreateDialog transaction check", () => {
  it("shows the BE sentence under the code field as soon as the field loses focus", async () => {
    mswServer.use(http.get(`${base}/transaction-check`, () => HttpResponse.json({ message: NOT_OWNED }, { status: 404 })));
    renderDialog();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Nhập mã giao dịch (FM…) hoặc mã đơn hàng"), "FM-X");
    await user.tab();
    expect(await screen.findByText(NOT_OWNED)).toBeTruthy();
  });

  it("shows a confirmation card with both codes when the typed order code is found", async () => {
    let asked = "";
    mswServer.use(
      http.get(`${base}/transaction-check`, ({ request }) => {
        asked = new URL(request.url).searchParams.get("transactionCode") ?? "";
        return HttpResponse.json({
          transactionId: "t1", transactionCode: "FM26M7Q2A", orderCode: "DH261110-6965", subMerchantName: "Halo tech",
          terminalCode: "T0001", amount: 150_000, status: "SUCCESS", paidAt: "2026-11-10T04:05:00Z",
        });
      }),
    );
    renderDialog();
    const user = userEvent.setup();
    expect(screen.getByPlaceholderText("Nhập mã giao dịch (FM…) hoặc mã đơn hàng")).toBeTruthy();
    await user.type(screen.getByPlaceholderText("Nhập mã giao dịch (FM…) hoặc mã đơn hàng"), "DH261110-6965");
    await user.tab();
    const card = await screen.findByRole("status");
    expect(asked).toBe("DH261110-6965");
    expect(card).toHaveTextContent("Đơn DH261110-6965");
    expect(card).toHaveTextContent("Mã GD FM26M7Q2A");
    expect(card).toHaveTextContent("Halo tech");
    expect(card).toHaveTextContent("T0001");
    expect(card).toHaveTextContent("150.000");
    expect(card).toHaveTextContent("Thành công");
    expect(screen.queryByText(NOT_OWNED)).toBeNull();
    // Gõ lại mã thì thẻ của mã cũ biến mất, không đứng sai chỗ.
    await user.type(screen.getByPlaceholderText("Nhập mã giao dịch (FM…) hoặc mã đơn hàng"), "9");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("warns on the card when the found order is not successful", async () => {
    mswServer.use(http.get(`${base}/transaction-check`, () => HttpResponse.json({ transactionId: "t2", transactionCode: "FM2", orderCode: "DH2", status: "PENDING" })));
    renderDialog();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Nhập mã giao dịch (FM…) hoặc mã đơn hàng"), "DH2");
    await user.tab();
    expect(await screen.findByText("Chỉ hỗ trợ tra soát giao dịch Thành công")).toBeTruthy();
  });

  it("labels a fixed code as the transaction code, with the order code beside it", () => {
    renderDialog({ transactionCode: "FM9", orderCode: "DH9" });
    expect(screen.getByText(/Mã giao dịch:/)).toBeTruthy();
    expect(screen.getByText("FM9")).toBeTruthy();
    expect(screen.getByText("DH9")).toBeTruthy();
  });

  it("does not check an empty code nor a code fixed by the Tra soát entry", async () => {
    let calls = 0;
    mswServer.use(http.get(`${base}/transaction-check`, () => { calls += 1; return HttpResponse.json({}); }));
    const first = renderDialog();
    const user = userEvent.setup();
    await user.click(screen.getByPlaceholderText("Nhập mã giao dịch (FM…) hoặc mã đơn hàng"));
    await user.tab();
    first.unmount();
    renderDialog({ transactionCode: "FM9" });
    expect(screen.queryByPlaceholderText("Nhập mã giao dịch (FM…) hoặc mã đơn hàng")).toBeNull();
    expect(calls).toBe(0);
  });
});
