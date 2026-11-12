// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { TerminalsContainer } from "../TerminalsContainer";
import type { TerminalRow } from "../../types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/terminals" }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
const subMerchantId = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";
const row: TerminalRow = {
  id: "33333333-3333-4333-8333-333333333333",
  tid: "TML000001",
  name: "Quầy 1",
  terminalType: "POS",
  address: "Hà Nội",
  status: "ACTIVE",
  lockSource: null,
  subMerchantId,
  subMerchantCode: "SM001",
  subMerchantName: "Điểm bán",
  merchantId,
  contactPhone: null,
  createdAt: null,
};
const base = "/api/v1/admin/terminals";
const filter = { page: 1, pageSize: 10, subMerchantIds: [subMerchantId] };

function renderContainer(canManage = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TerminalsContainer filter={filter} canManage={canManage} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mswServer.use(http.get(base, () => HttpResponse.json({ rows: [row], total: 1 })));
  mswServer.use(http.get("/api/v1/admin/sub-merchants/choices", () => HttpResponse.json([{ id: subMerchantId, code: "SM001", name: "Điểm bán", status: "ACTIVE" }])));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("terminals container", () => {
  it("shows a busy indicator while the list loads", async () => {
    mswServer.use(http.get(base, () => new Promise(() => {})));
    renderContainer();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("reports a list error and recovers on retry", async () => {
    let failing = true;
    mswServer.use(http.get(base, () => (
      failing
        ? HttpResponse.json({ message: "Không tải được" }, { status: 500 })
        : HttpResponse.json({ rows: [row], total: 1 })
    )));
    renderContainer();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");
    failing = false;
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders no table for an empty list and a row table for data", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [], total: 0 })));
    const empty = renderContainer();
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    empty.unmount();
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [row], total: 1 })));
    renderContainer();
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem chi tiết Quầy 1" })).toBeInTheDocument();
  });

  it("requests the list through the shared client with the filter in the query string", async () => {
    let search: URLSearchParams | undefined;
    mswServer.use(http.get(base, ({ request }) => {
      search = new URL(request.url).searchParams;
      return HttpResponse.json({ rows: [row], total: 1 });
    }));
    renderContainer();
    await screen.findByRole("table");
    expect(Object.fromEntries(search!)).toEqual({ page: "1", pageSize: "10", subMerchantIds: subMerchantId });
  });

  it("keeps a conflict visible in the lock modal", async () => {
    let body: unknown;
    mswServer.use(http.post(`${base}/${row.id}/lock`, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ message: "Xung đột trạng thái" }, { status: 409 });
    }));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Khóa Quầy 1" }));
    await userEvent.type(await screen.findByRole("textbox", { name: /Lý do/ }), "Lý do khóa hợp lệ");
    await userEvent.click(screen.getByRole("button", { name: "Khóa Terminal" }));
    await waitFor(() => expect(body).toEqual({ reason: "Lý do khóa hợp lệ" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Xung đột trạng thái");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("requires a POS address and creates with the selected parent", async () => {
    let body: unknown;
    mswServer.use(http.post(base, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(row);
    }));
    renderContainer();
    await userEvent.click(screen.getByRole("button", { name: /Thêm Terminal/ }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(await screen.findByRole("textbox", { name: /Tên Terminal/ }), "Quầy mới");
    await userEvent.click(within(dialog).getAllByRole("combobox")[0]!);
    await userEvent.click(await screen.findByRole("option", { name: /SM001/ }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Thêm Terminal" }));
    expect(await within(dialog).findByText("Nhập địa chỉ đặt máy POS")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox", { name: /Địa chỉ đặt máy POS/ }), "Hà Nội");
    await userEvent.click(within(dialog).getByRole("button", { name: "Thêm Terminal" }));
    await waitFor(() => expect(body).toMatchObject({ subMerchantId, terminalType: "POS", address: "Hà Nội" }));
  });

  it("hides create, edit, lock and unlock when the session may only view", async () => {
    renderContainer(false);
    expect(await screen.findByRole("button", { name: "Xem chi tiết Quầy 1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Thêm Terminal/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sửa/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Khóa|Mở khóa/ })).not.toBeInTheDocument();
    mswServer.use(http.get(`${base}/${row.id}`, () => HttpResponse.json({ ...row, note: null, updatedAt: null })));
    await userEvent.click(screen.getByRole("button", { name: "Xem chi tiết Quầy 1" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: /Sửa|Khóa|Mở khóa/ })).not.toBeInTheDocument();
  });

  it("disables a cascade unlock", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [{ ...row, status: "INACTIVE", lockSource: "CASCADE" }], total: 1 })));
    renderContainer();
    expect(await screen.findByRole("button", { name: /Mở khóa/ })).toBeDisabled();
  });

  it("shows a loading modal when editing while the detail is still loading", async () => {
    mswServer.use(http.get(`${base}/${row.id}`, () => new Promise(() => {})));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Sửa Quầy 1" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("status")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Lưu thay đổi" })).not.toBeInTheDocument();
  });

  it("shows the error in a modal when the detail fails to load for editing", async () => {
    mswServer.use(http.get(`${base}/${row.id}`, () => HttpResponse.json({ message: "Không tải được chi tiết" }, { status: 500 })));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Sửa Quầy 1" }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Không tải được chi tiết");
  });
});
