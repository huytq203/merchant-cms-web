// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { mswServer } from "@/test/msw";
import { ComplaintsContainer } from "../ComplaintsContainer";
import type { Complaint, ComplaintListFilter } from "../../types/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/complaint" }));
vi.mock("sonner", () => ({ toast: { info: vi.fn() } }));

const listPath = "/api/v1/admin/merchants/complaints";
const filter: ComplaintListFilter = { page: 1, pageSize: 10 };
const row: Complaint = {
  id: "c-1",
  ticketCode: "TRS-1",
  transactionId: null,
  transactionCode: null,
  subMerchantName: "Đơn vị mẫu 01",
  reason: "Sai lệch số tiền",
  source: "gateway",
  content: "Nội dung mẫu",
  status: "processing",
  deadline: null,
  note: null,
  lastUpdatedAt: null,
  createdAt: "2026-09-02T01:30:00.000Z",
  messages: [
    { id: "m-1", role: "admin", senderName: "Cổng Thanh Toán (mẫu)", content: "Tin nhắn mẫu", time: "2026-09-12T09:00:00.000Z" },
  ],
};

function renderContainer(canReply = true, canCreate = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ComplaintsContainer filter={filter} abilities={{ canReply, canCreate }} />
    </QueryClientProvider>,
  );
}

function listReturns(rows: Complaint[]) {
  mswServer.use(http.get(listPath, () => HttpResponse.json({ rows, total: rows.length })));
}

beforeEach(() => listReturns([row]));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("complaints container states", () => {
  it("shows loading, unsupported, empty and data states", async () => {
    mswServer.use(http.get(listPath, () => new Promise(() => {})));
    const loading = renderContainer();
    expect(screen.getByRole("status", { busy: true })).toBeInTheDocument();
    loading.unmount();

    mswServer.use(http.get(listPath, () => HttpResponse.json({ message: "x" }, { status: 501 })));
    const unsupported = renderContainer();
    expect(await screen.findByText("Chưa hỗ trợ")).toBeInTheDocument();
    unsupported.unmount();

    listReturns([]);
    const empty = renderContainer();
    expect(await screen.findByText("Không tìm thấy khiếu nại nào phù hợp")).toBeInTheDocument();
    empty.unmount();

    listReturns([row]);
    renderContainer();
    expect(await screen.findByText("TRS-1")).toBeInTheDocument();
  });
});

describe("complaints container behavior", () => {
  it("writes the filter into the URL starting from the first page", async () => {
    renderContainer();
    await screen.findByText("TRS-1");
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenCalledTimes(1);
    const url = new URL(String(push.mock.calls[0]?.[0]), "http://localhost");
    expect(url.pathname).toBe("/complaint");
    expect(url.searchParams.get("page")).toBe("1");
  });

  it("shows creation only with permission and keeps its dialog open after unsupported submit", async () => {
    renderContainer();
    expect(screen.queryByRole("button", { name: "Tạo khiếu nại mới" })).not.toBeInTheDocument();
    cleanup();
    renderContainer(true, true);
    await userEvent.click(screen.getByRole("button", { name: "Tạo khiếu nại mới" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox", { name: /Mã giao dịch/ }), "TRX-1");
    await userEvent.type(screen.getByRole("textbox", { name: /Ghi chú/ }), "Mô tả mẫu");
    await userEvent.click(screen.getByRole("button", { name: "Gửi yêu cầu" }));
    expect(toast.info).toHaveBeenCalledWith(expect.stringMatching(/chưa được hỗ trợ/));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens the detail with the conversation, and hides the reply box without permission", async () => {
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Chi tiết và phản hồi khiếu nại TRS-1/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Tin nhắn mẫu");
    expect(screen.getByRole("button", { name: "Gửi phản hồi" })).toBeInTheDocument();
    cleanup();
    renderContainer(false);
    await userEvent.click(await screen.findByRole("button", { name: /Chi tiết và phản hồi khiếu nại TRS-1/ }));
    await screen.findByRole("dialog");
    expect(screen.queryByRole("button", { name: "Gửi phản hồi" })).not.toBeInTheDocument();
  });
});

describe("complaints list redesign", () => {
  it("puts export and create in the page header", async () => {
    renderContainer(true, true);
    await screen.findByText("TRS-1");
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("button", { name: "Xuất Excel" })).toBeInTheDocument();
    expect(within(header).getByRole("button", { name: "Tạo khiếu nại mới" })).toBeInTheDocument();
  });

  it("filters the created date with one range field", async () => {
    renderContainer();
    await screen.findByText("TRS-1");
    const filters = screen.getByRole("form", { name: "Bộ lọc tìm kiếm" });
    expect(within(filters).getByText("Ngày tạo")).toBeInTheDocument();
    expect(within(filters).queryByText("Từ ngày")).not.toBeInTheDocument();
  });

  it("searches by source and status chosen in the filter", async () => {
    renderContainer();
    await screen.findByText("TRS-1");
    const filters = screen.getByRole("form", { name: "Bộ lọc tìm kiếm" });
    await userEvent.click(within(filters).getByRole("combobox", { name: /Nguồn/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Cổng" }));
    await userEvent.click(within(filters).getByRole("combobox", { name: /Trạng thái/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Đã xử lý" }));
    await userEvent.click(within(filters).getByRole("button", { name: "Tìm kiếm" }));
    const url = new URL(String(push.mock.calls[0]?.[0]), "http://localhost");
    expect(url.searchParams.get("source")).toBe("gateway");
    expect(url.searchParams.get("status")).toBe("resolved");
  });

  it("shows the source and how late an open complaint is", async () => {
    listReturns([{ ...row, deadline: "2020-01-01T00:00:00.000Z" }]);
    renderContainer();
    await screen.findByText("TRS-1");
    expect(screen.getByText("Cổng")).toBeInTheDocument();
    expect(screen.getByText(/Quá hạn/)).toBeInTheDocument();
  });

  it("shows no deadline for a closed complaint", async () => {
    listReturns([{ ...row, status: "resolved", deadline: "2020-01-01T00:00:00.000Z" }]);
    renderContainer();
    await screen.findByText("TRS-1");
    expect(screen.queryByText(/Quá hạn/)).not.toBeInTheDocument();
  });

  it("opens the detail from the complaint code", async () => {
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "TRS-1" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Tin nhắn mẫu");
  });

  it("puts the overdue warning first in the detail", async () => {
    listReturns([{ ...row, deadline: "2020-01-01T00:00:00.000Z" }]);
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "TRS-1" }));
    expect(await within(await screen.findByRole("dialog")).findByText(/Hạn xử lý/)).toHaveTextContent(/Quá hạn/);
  });

  it("closes the reply box for a resolved complaint and says why", async () => {
    listReturns([{ ...row, status: "resolved" }]);
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "TRS-1" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Gửi phản hồi" })).not.toBeInTheDocument();
    expect(within(dialog).getByText(/đã xử lý xong/)).toBeInTheDocument();
  });
});

describe("complaint reply and reject", () => {
  async function openDetail() {
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Chi tiết và phản hồi khiếu nại TRS-1/ }));
    return screen.findByRole("dialog");
  }

  it("keeps the draft and says sending is unsupported", async () => {
    const dialog = await openDetail();
    const send = screen.getByRole("button", { name: "Gửi phản hồi" });
    expect(send).toBeDisabled();
    const box = screen.getByRole("textbox");
    await userEvent.type(box, "Đã kiểm tra");
    await userEvent.click(send);
    expect(toast.info).toHaveBeenCalledWith(expect.stringMatching(/chưa được hỗ trợ/));
    expect(box).toHaveValue("Đã kiểm tra");
    expect(dialog).toBeInTheDocument();
  });

  it("says rejecting is unsupported and keeps the dialog open", async () => {
    await openDetail();
    await userEvent.click(screen.getByRole("button", { name: "Từ chối" }));
    expect(toast.info).toHaveBeenCalledWith(expect.stringMatching(/chưa được hỗ trợ/));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
