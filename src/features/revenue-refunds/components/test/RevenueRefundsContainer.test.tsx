// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { challengeFixture, pendingId, pendingRefund, processingRefund, queuedRefund, subId, succeededRefund } from "../../test/fixtures";
import { RevenueRefundsContainer } from "../RevenueRefundsContainer";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/revenue-refunds" }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const base = "/api/v1/admin/revenue-refunds";
const rows = [pendingRefund, processingRefund, succeededRefund, queuedRefund];

function renderContainer(canApprove = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RevenueRefundsContainer filter={{}} canApprove={canApprove} subNames={{ [subId]: "SUB001 · Cửa hàng A" }} />
    </QueryClientProvider>,
  );
}

async function typeCode(code: string) {
  await userEvent.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
  await userEvent.keyboard(code);
}

beforeEach(() => {
  mswServer.use(http.get(base, () => HttpResponse.json({ rows })));
});
afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("revenue refunds container", () => {
  it("shows loading, then each status with what it means for the merchant", async () => {
    renderContainer();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    const table = await screen.findByRole("table");
    expect(within(table).getByText("Chờ phê duyệt")).toBeInTheDocument();
    expect(within(table).getByText("Chờ kế toán xử lý")).toBeInTheDocument();
    expect(within(table).getByText(/chưa trừ tiền/i)).toBeInTheDocument();
    expect(within(table).getByText("Chờ chuyển tiền")).toBeInTheDocument();
  });

  it("explains an empty list", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [] })));
    renderContainer();
    expect(await screen.findByText(/Chưa có yêu cầu hoàn tiền nào/)).toBeInTheDocument();
  });

  it("only offers approval on a pending request, and not at all without APPROVE_REFUND", async () => {
    const view = renderContainer();
    await screen.findByRole("table");
    expect(screen.getByRole("button", { name: "Phê duyệt MRF7A21C3D8E4B90F11" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Phê duyệt MRF55D0A9B1C2E3F4A07" })).toBeDisabled();
    view.unmount();
    renderContainer(false);
    await screen.findByRole("table");
    expect(screen.queryByRole("button", { name: /Phê duyệt/ })).not.toBeInTheDocument();
  });

  it("approves after showing the consequence and taking the emailed code", async () => {
    let body: unknown;
    mswServer.use(
      http.post(`${base}/${pendingId}/otp-challenge`, () => HttpResponse.json(challengeFixture)),
      http.post(`${base}/${pendingId}/approve`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...pendingRefund, status: "PROCESSING" });
      }),
    );
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Phê duyệt MRF7A21C3D8E4B90F11" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("SUB001 · Cửa hàng A");
    expect(dialog).toHaveTextContent("120.000");
    await userEvent.click(within(dialog).getByRole("button", { name: "Gửi mã OTP" }));
    await typeCode("123456");
    await userEvent.click(within(dialog).getByRole("button", { name: "Phê duyệt" }));
    await waitFor(() => expect(body).toEqual({ sensitiveOtp: { otpSessionId: "otp-1", otp: "123456" } }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps the dialog open and shows a wrong code", async () => {
    mswServer.use(
      http.post(`${base}/${pendingId}/otp-challenge`, () => HttpResponse.json(challengeFixture)),
      http.post(`${base}/${pendingId}/approve`, () => HttpResponse.json(
        { message: "Mã OTP không đúng hoặc đã hết hạn", code: "MERCHANT_SENSITIVE_OTP_INVALID" }, { status: 400 },
      )),
    );
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Phê duyệt MRF7A21C3D8E4B90F11" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Gửi mã OTP" }));
    await typeCode("000000");
    await userEvent.click(within(dialog).getByRole("button", { name: "Phê duyệt" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Mã OTP không đúng hoặc đã hết hạn");
  });

  it("filters by status through the URL", async () => {
    renderContainer();
    await screen.findByRole("table");
    await userEvent.click(screen.getByRole("combobox", { name: /Trạng thái/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Từ chối" }));
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenCalledWith("/revenue-refunds?status=REJECTED");
  });
});
