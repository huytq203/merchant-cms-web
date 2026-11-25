// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { TerminalFormModal } from "../TerminalFormModal";
import type { TerminalDetail } from "../../types";

afterEach(cleanup);

const subMerchantId = "11111111-1111-4111-8111-111111111111";
const detail: TerminalDetail = {
  id: "33333333-3333-4333-8333-333333333333",
  tid: "TML000001",
  name: "Quầy 1",
  terminalType: "QR",
  address: null,
  status: "ACTIVE",
  lockSource: null,
  subMerchantId,
  subMerchantCode: "SM001",
  subMerchantName: "Halo Tech",
  merchantId: "22222222-2222-4222-8222-222222222222",
  contactPhone: { value: "0912345678", source: "SUB_MERCHANT", inherited: true, suspended: false },
  createdAt: null,
  contactPerson: "Nguyễn Văn An",
  note: null,
};

const provincePlaceholder = "Chọn hoặc gõ để tìm tỉnh/thành phố";

function renderForm(props: Partial<React.ComponentProps<typeof TerminalFormModal>> = {}) {
  mswServer.use(http.get("/api/v1/admin/sub-merchants/choices", () => HttpResponse.json([{ id: subMerchantId, code: "SM001", name: "Halo Tech", status: "ACTIVE" }])));
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TerminalFormModal open onOpenChange={vi.fn()} onSubmit={onSubmit} isSubmitting={false} {...props} />
    </QueryClientProvider>,
  );
  return onSubmit;
}

describe("terminal form", () => {
  it("tells the user the code is issued by the system instead of showing a locked field", () => {
    renderForm();
    expect(screen.getByText("Mã Terminal do hệ thống cấp sau khi tạo.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /Mã Terminal/ })).not.toBeInTheDocument();
  });

  it("offers the three types as one-tap options and asks for address and province for POS and QR, not ONLINE", async () => {
    renderForm();
    const types = within(screen.getByRole("group", { name: "Loại Terminal" }));
    expect(types.getByRole("button", { name: "POS" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("textbox", { name: /Địa chỉ đặt máy POS/ })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(provincePlaceholder)).toBeInTheDocument();
    await userEvent.click(types.getByRole("button", { name: "QR" }));
    expect(screen.getByRole("textbox", { name: /Địa chỉ điểm bán/ })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(provincePlaceholder)).toBeInTheDocument();
    await userEvent.click(types.getByRole("button", { name: "Online" }));
    expect(screen.queryByRole("textbox", { name: /Địa chỉ/ })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(provincePlaceholder)).not.toBeInTheDocument();
  });

  it("shows each error under its own field", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Thêm Terminal" }));
    expect(await screen.findByText("Tên Terminal là bắt buộc")).toBeInTheDocument();
    expect(screen.getAllByText("Chọn Sub-merchant")).toHaveLength(2);
    expect(screen.getByText("Terminal POS/QR cần địa chỉ điểm bán")).toBeInTheDocument();
    expect(screen.getAllByText("Vui lòng chọn Tỉnh/Thành phố").length).toBeGreaterThan(0);
  });

  it("inherits the phone from the Sub-merchant by default and asks for one when 'Nhập riêng' is left empty", async () => {
    renderForm();
    expect(screen.getByText(/sẽ lấy từ/)).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole("group", { name: /Nguồn số điện thoại/ })).getByRole("button", { name: "Nhập riêng" }));
    await userEvent.click(screen.getByRole("button", { name: "Thêm Terminal" }));
    expect(await screen.findByText("Nhập số điện thoại hoặc dùng của Sub-merchant")).toBeInTheDocument();
  });

  it("shows the Sub-merchant as read-only, says where the phone comes from, and warns only when the type changes", async () => {
    renderForm({ detail });
    expect(screen.getByRole("textbox", { name: "Sub-merchant" })).toHaveValue("SM001 - Halo Tech");
    expect(screen.getByRole("textbox", { name: "Sub-merchant" })).toHaveAttribute("readonly");
    expect(screen.getByText(/Số điện thoại sẽ lấy từ/)).toHaveTextContent("Sub-merchant");
    expect(screen.queryByRole("textbox", { name: "Số điện thoại" })).not.toBeInTheDocument();
    expect(screen.getByText("TML000001")).toBeInTheDocument();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    await userEvent.click(within(screen.getByRole("group", { name: "Loại Terminal" })).getByRole("button", { name: "Online" }));
    expect(screen.getByRole("note")).toHaveTextContent("Đổi loại Terminal có thể ảnh hưởng thiết bị đã gắn.");
  });

  it("lets only digits into the hand-typed phone, at most 10", async () => {
    renderForm();
    await userEvent.click(within(screen.getByRole("group", { name: /Nguồn số điện thoại/ })).getByRole("button", { name: "Nhập riêng" }));
    const phone = screen.getByRole("textbox", { name: "Số điện thoại" });
    await userEvent.type(phone, "09a1-2 345678999");
    expect(phone).toHaveValue("0912345678");
  });

  it("does not demand a province from an untouched legacy terminal", async () => {
    const onSubmit = renderForm({ detail: { ...detail, terminalType: "POS", address: "Số 1 Lê Lợi", province: null } });
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(screen.queryByText("Vui lòng chọn Tỉnh/Thành phố")).not.toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalled();
  });
});
