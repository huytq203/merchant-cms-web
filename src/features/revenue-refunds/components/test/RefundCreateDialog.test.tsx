// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { challengeFixture, orderId, pendingRefund } from "../../test/fixtures";
import { RefundCreateDialog } from "../RefundCreateDialog";

const base = "/api/v1/admin/revenue-refunds";
const order = { id: orderId, orderCode: "MO20261012000987", amount: 250_000, subMerchantName: "Cửa hàng A" };
const onClose = vi.fn();

function renderDialog() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RefundCreateDialog order={order} onClose={onClose} />
    </QueryClientProvider>,
  );
}

async function fillForm(amount = "40000") {
  const dialog = screen.getByRole("dialog");
  await userEvent.type(within(dialog).getByRole("textbox", { name: /Số tiền hoàn/ }), amount);
  await userEvent.type(within(dialog).getByRole("textbox", { name: /Lý do/ }), "Khách trả hàng, đã xác nhận");
  await userEvent.click(within(dialog).getByRole("combobox", { name: /Ngân hàng/ }));
  await userEvent.click(await screen.findByRole("option", { name: "Vietcombank" }));
  await userEvent.type(within(dialog).getByRole("textbox", { name: /Số tài khoản/ }), "0123456789");
  await userEvent.type(within(dialog).getByRole("textbox", { name: /Tên chủ tài khoản/ }), "nguyen van a");
}

async function typeCode(code: string) {
  await userEvent.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
  await userEvent.keyboard(code);
}

afterEach(() => {
  cleanup();
  onClose.mockClear();
});

describe("RefundCreateDialog", () => {
  it("checks the form before asking for a code", async () => {
    let challenged = false;
    mswServer.use(http.post(`${base}/otp-challenge`, () => { challenged = true; return HttpResponse.json(challengeFixture); }));
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    expect(await screen.findByText("Lý do hoàn tiền phải từ 10 đến 500 ký tự")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng chọn ngân hàng nhận")).toBeInTheDocument();
    expect(challenged).toBe(false);
  });

  it("refuses more than the order amount before spending a code", async () => {
    renderDialog();
    await fillForm("300000");
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    expect(await screen.findByText(/Không vượt quá 250.000/)).toBeInTheDocument();
  });

  it("asks a code bound to the order and amount, then creates and shows the result", async () => {
    let challengeBody: unknown;
    let createBody: unknown;
    mswServer.use(
      http.post(`${base}/otp-challenge`, async ({ request }) => { challengeBody = await request.json(); return HttpResponse.json(challengeFixture); }),
      http.post(base, async ({ request }) => { createBody = await request.json(); return HttpResponse.json(pendingRefund, { status: 201 }); }),
    );
    renderDialog();
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("NGUYEN VAN A")).toBeInTheDocument();
    expect(challengeBody).toEqual({ orderId, amount: 40_000 });
    await typeCode("123456");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tạo yêu cầu" }));
    await waitFor(() => expect(createBody).toEqual({
      orderId, amount: 40_000, reason: "Khách trả hàng, đã xác nhận", beneficiaryBankCode: "VCB",
      beneficiaryAccountNumber: "0123456789", beneficiaryAccountName: "NGUYEN VAN A",
      sensitiveOtp: { otpSessionId: "otp-1", otp: "123456" },
    }));
    expect(await screen.findByText("MRF7A21C3D8E4B90F11")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem trong danh sách" })).toHaveAttribute("href", `/revenue-refunds?orderId=${orderId}`);
  });

  it("goes back to the amount with the BE limit when the refund is too large", async () => {
    mswServer.use(
      http.post(`${base}/otp-challenge`, () => HttpResponse.json(challengeFixture)),
      http.post(base, () => HttpResponse.json({ message: "Có thể hoàn tối đa 20.000 đồng cho giao dịch này", code: "MERCHANT_REFUND_EXCEEDS_PAYMENT" }, { status: 400 })),
    );
    renderDialog();
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    await typeCode("123456");
    await userEvent.click(await screen.findByRole("button", { name: "Tạo yêu cầu" }));
    expect(await screen.findByText("Có thể hoàn tối đa 20.000 đồng cho giao dịch này")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Số tiền hoàn/ })).toBeInTheDocument();
  });
});
