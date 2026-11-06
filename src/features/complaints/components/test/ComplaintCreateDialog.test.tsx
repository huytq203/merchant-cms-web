// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { ComplaintCreateDialog } from "../ComplaintCreateDialog";

vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));

const base = "/api/v1/admin/merchants/complaints";
const NOT_OWNED = "Merchant của bạn không phát sinh mã giao dịch này";

afterEach(() => cleanup());

function renderDialog(props: { transactionCode?: string } = {}) {
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
    await user.type(screen.getByPlaceholderText("Nhập mã giao dịch"), "FM-X");
    await user.tab();
    expect(await screen.findByText(NOT_OWNED)).toBeTruthy();
  });

  it("stays silent for a code of this merchant", async () => {
    let calls = 0;
    mswServer.use(
      http.get(`${base}/transaction-check`, () => {
        calls += 1;
        return HttpResponse.json({ transactionId: "t1", transactionCode: "FM1", amount: 1, status: "SUCCESS" });
      }),
    );
    renderDialog();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Nhập mã giao dịch"), "FM1");
    await user.tab();
    await waitFor(() => expect(calls).toBe(1));
    expect(screen.queryByText(NOT_OWNED)).toBeNull();
  });

  it("does not check an empty code nor a code fixed by the Tra soát entry", async () => {
    let calls = 0;
    mswServer.use(http.get(`${base}/transaction-check`, () => { calls += 1; return HttpResponse.json({}); }));
    const first = renderDialog();
    const user = userEvent.setup();
    await user.click(screen.getByPlaceholderText("Nhập mã giao dịch"));
    await user.tab();
    first.unmount();
    renderDialog({ transactionCode: "FM9" });
    expect(screen.queryByPlaceholderText("Nhập mã giao dịch")).toBeNull();
    expect(calls).toBe(0);
  });
});
