// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { mswServer } from "@/test/msw";
import { ComplaintsContainer } from "../ComplaintsContainer";
import { BE_COMPLAINT, BE_COMPLAINT_ROW } from "../../test/complaint.fixtures";
import type { Complaint, ComplaintListFilter } from "../../types/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/complaint" }));
vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));
vi.mock("@/features/sub-merchants/hooks/use-sub-merchant-options", () => ({ useSubMerchantOptions: () => ({ data: [] }) }));

const listPath = "/api/v1/admin/merchants/complaints";
const detailPath = `${listPath}/${BE_COMPLAINT.id}`;
const filter: ComplaintListFilter = { page: 1, pageSize: 10 };
const CODE = BE_COMPLAINT.complaintCode;

let listCalls = 0;
let detailCalls = 0;

function renderContainer(abilities: { canReply?: boolean; canCreate?: boolean } = {}, currentFilter = filter) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ComplaintsContainer filter={currentFilter} abilities={{ canReply: true, canCreate: false, ...abilities }} />
    </QueryClientProvider>,
  );
}

function serve(rows: Complaint[], detail: Complaint = BE_COMPLAINT) {
  mswServer.use(
    http.get(listPath, () => {
      listCalls += 1;
      return HttpResponse.json({ rows, total: rows.length });
    }),
    http.get(detailPath, () => {
      detailCalls += 1;
      return HttpResponse.json(detail);
    }),
  );
}

async function openDetail() {
  await userEvent.click(await screen.findByRole("button", { name: CODE }));
  const dialog = await screen.findByRole("dialog");
  await within(dialog).findByText("Vui lòng cung cấp sao kê");
  return dialog;
}

beforeEach(() => {
  listCalls = 0;
  detailCalls = 0;
  serve([BE_COMPLAINT_ROW]);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("list", () => {
  it("shows loading, error, empty and data states", async () => {
    mswServer.use(http.get(listPath, () => new Promise(() => {})));
    const loading = renderContainer();
    expect(screen.getByRole("status", { busy: true })).toBeInTheDocument();
    loading.unmount();

    mswServer.use(http.get(listPath, () => HttpResponse.json({ message: "Hệ thống đang gặp sự cố" }, { status: 502 })));
    const failed = renderContainer();
    // The list retries once before showing the error.
    expect(await screen.findByText("Hệ thống đang gặp sự cố", undefined, { timeout: 4000 })).toBeInTheDocument();
    failed.unmount();

    serve([]);
    const empty = renderContainer();
    expect(await screen.findByText("Không tìm thấy khiếu nại nào phù hợp")).toBeInTheDocument();
    empty.unmount();

    serve([BE_COMPLAINT_ROW]);
    renderContainer();
    expect(await screen.findByText(CODE)).toBeInTheDocument();
  });

  it("shows reason, sender, status with who it waits on, and the verdict of a closed complaint", async () => {
    serve([
      BE_COMPLAINT_ROW,
      { ...BE_COMPLAINT_ROW, id: "c-2", complaintCode: "KN2", status: "CLOSED", verdict: "ACCEPTED", waitingOn: null },
    ]);
    renderContainer();
    await screen.findByText(CODE);
    expect(screen.getAllByText("Sai lệch số tiền")).toHaveLength(2);
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
    expect(screen.getByText("Chờ Merchant")).toBeInTheDocument();
    expect(screen.getByText("Đã kết thúc – Chấp nhận")).toBeInTheDocument();
  });

  it("writes the BE filters into the URL from the first page", async () => {
    renderContainer();
    await screen.findByText(CODE);
    const filters = screen.getByRole("form", { name: "Bộ lọc tìm kiếm" });
    await userEvent.click(within(filters).getByRole("combobox", { name: /Trạng thái/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Đang xử lý" }));
    await userEvent.click(within(filters).getByRole("combobox", { name: /Chờ phản hồi/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Chờ Merchant" }));
    await userEvent.click(within(filters).getByRole("combobox", { name: /Người gửi/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Admin" }));
    await userEvent.click(within(filters).getByRole("button", { name: "Tìm kiếm" }));
    const url = new URL(String(push.mock.calls[0]?.[0]), "http://localhost");
    expect(url.pathname).toBe("/complaint");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ page: "1", status: "PROCESSING", waitingOn: "MERCHANT", reporterType: "ADMIN" });
  });

  it("downloads the CSV of the current filter, without paging", async () => {
    let exported: URL | null = null;
    mswServer.use(
      http.get(`${listPath}/export`, ({ request }) => {
        exported = new URL(request.url);
        return new HttpResponse("﻿a\n", { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="kn.csv"' } });
      }),
    );
    const createObjectURL = vi.fn(() => "blob:kn");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderContainer({}, { page: 2, pageSize: 20, status: "CLOSED" });
    await userEvent.click(within(screen.getByRole("banner")).getByRole("button", { name: "Xuất file" }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(Object.fromEntries(exported!.searchParams)).toEqual({ status: "CLOSED" });
    expect(createObjectURL).toHaveBeenCalled();
    click.mockRestore();
  });
});

describe("detail", () => {
  it("loads the conversation, the transaction card, the request source and the creation attachments", async () => {
    renderContainer();
    const dialog = await openDetail();
    expect(detailCalls).toBe(1);
    expect(dialog).toHaveTextContent("FM2611030001");
    expect(dialog).toHaveTextContent("150.000");
    expect(within(dialog).getByText("Ngân hàng")).toBeInTheDocument();
    expect(within(dialog).getByText("FlexPay (Admin)")).toBeInTheDocument();
    // bien-lai.pdf came with the complaint; sao-ke.png belongs to the Admin message.
    expect(within(dialog).getByRole("button", { name: "Xem chứng từ bien-lai.pdf" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Xem chứng từ sao-ke.png" })).toBeInTheDocument();
  });

  it("opens an attachment through a fresh link", async () => {
    mswServer.use(
      http.get(`${detailPath}/attachments/:aid/link`, ({ params }) =>
        HttpResponse.json({ url: `https://s3.test/${String(params.aid)}`, ttlSeconds: 300 }),
      ),
    );
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    renderContainer();
    const dialog = await openDetail();
    await userEvent.click(within(dialog).getByRole("button", { name: "Xem chứng từ bien-lai.pdf" }));
    await waitFor(() =>
      expect(open).toHaveBeenCalledWith(`https://s3.test/${BE_COMPLAINT.attachments![0]!.id}`, "_blank", "noopener,noreferrer"),
    );
    open.mockRestore();
  });

  it("offers reply and reject on a PROCESSING complaint only with REPLY_DISPUTE", async () => {
    renderContainer();
    let dialog = await openDetail();
    expect(within(dialog).getByRole("button", { name: "Gửi phản hồi" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Từ chối" })).toBeInTheDocument();
    cleanup();
    renderContainer({ canReply: false });
    dialog = await openDetail();
    expect(within(dialog).queryByRole("button", { name: "Gửi phản hồi" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Từ chối" })).not.toBeInTheDocument();
  });

  it("says a WAITING complaint is waiting to be accepted, without actions", async () => {
    serve([{ ...BE_COMPLAINT_ROW, status: "WAITING" }], { ...BE_COMPLAINT, status: "WAITING", waitingOn: null });
    renderContainer();
    const dialog = await openDetail();
    expect(within(dialog).getByText("Đang chờ tiếp nhận")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Gửi phản hồi" })).not.toBeInTheDocument();
  });

  it("shows the verdict of a closed complaint and no actions", async () => {
    const closed = { status: "CLOSED" as const, verdict: "REJECTED" as const, verdictContent: "Giao dịch hợp lệ", closedByParty: "MERCHANT" as const, waitingOn: null };
    serve([{ ...BE_COMPLAINT_ROW, ...closed }], { ...BE_COMPLAINT, ...closed, closedAt: "2026-11-04T02:00:00Z" });
    renderContainer();
    const dialog = await openDetail();
    expect(within(dialog).getAllByText("Đã kết thúc – Từ chối").length).toBeGreaterThan(0);
    expect(within(dialog).getByText("Giao dịch hợp lệ")).toBeInTheDocument();
    expect(within(dialog).getByText(/đã kết thúc, không thể phản hồi/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Gửi phản hồi" })).not.toBeInTheDocument();
  });

  it("sends a reply with its evidence, then refetches the detail and the list", async () => {
    const bodies: unknown[] = [];
    mswServer.use(
      http.post(`${listPath}/attachments`, () => HttpResponse.json({ attachmentId: "staging-9" }, { status: 201 })),
      http.post(`${detailPath}/replies`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ ...BE_COMPLAINT, waitingOn: "ADMIN" });
      }),
    );
    const { container } = renderContainer();
    const dialog = await openDetail();
    const [listBefore, detailBefore] = [listCalls, detailCalls];
    await userEvent.type(within(dialog).getByRole("textbox", { name: "Nội dung phản hồi" }), "Đã gửi sao kê");
    const input = container.ownerDocument.querySelector<HTMLInputElement>('[role="dialog"] input[type="file"]')!;
    await userEvent.upload(input, new File(["png"], "sao-ke.png", { type: "image/png" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Gửi phản hồi" }));
    await waitFor(() => expect(bodies).toEqual([{ content: "Đã gửi sao kê", attachmentIds: ["staging-9"] }]));
    await waitFor(() => expect(listCalls).toBeGreaterThan(listBefore));
    expect(detailCalls).toBeGreaterThan(detailBefore);
    expect(toast.success).toHaveBeenCalledWith("Đã gửi phản hồi");
  });

  it("keeps the draft and shows the BE sentence when a reply fails", async () => {
    mswServer.use(
      http.post(`${detailPath}/replies`, () =>
        HttpResponse.json({ message: "Khiếu nại đang ở trạng thái không cho phép thao tác này" }, { status: 409 }),
      ),
    );
    renderContainer();
    const dialog = await openDetail();
    const box = within(dialog).getByRole("textbox", { name: "Nội dung phản hồi" });
    await userEvent.type(box, "Đã kiểm tra");
    await userEvent.click(within(dialog).getByRole("button", { name: "Gửi phản hồi" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Khiếu nại đang ở trạng thái không cho phép thao tác này");
    expect(box).toHaveValue("Đã kiểm tra");
  });

  it("asks to confirm a rejection with a mandatory reason", async () => {
    const bodies: unknown[] = [];
    mswServer.use(
      http.post(`${detailPath}/reject`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ ...BE_COMPLAINT, status: "CLOSED", verdict: "REJECTED" });
      }),
    );
    renderContainer();
    const dialog = await openDetail();
    await userEvent.click(within(dialog).getByRole("button", { name: "Từ chối" }));
    const confirm = await screen.findByRole("alertdialog");
    await userEvent.click(within(confirm).getByRole("button", { name: "Xác nhận từ chối" }));
    expect(await within(confirm).findByText("Vui lòng nhập lý do từ chối")).toBeInTheDocument();
    expect(bodies).toEqual([]);
    await userEvent.type(within(confirm).getByRole("textbox", { name: /Lý do từ chối/ }), "Giao dịch hợp lệ");
    await userEvent.click(within(confirm).getByRole("button", { name: "Xác nhận từ chối" }));
    await waitFor(() => expect(bodies).toEqual([{ reason: "Giao dịch hợp lệ" }]));
    expect(toast.success).toHaveBeenCalledWith("Đã từ chối khiếu nại");
  });
});

describe("create", () => {
  async function openCreate() {
    renderContainer({ canCreate: true });
    await userEvent.click(screen.getByRole("button", { name: "Tạo khiếu nại mới" }));
    return screen.findByRole("dialog");
  }

  async function fill(dialog: HTMLElement) {
    await userEvent.type(within(dialog).getByRole("textbox", { name: /Mã giao dịch/ }), "FM2611030001");
    await userEvent.click(within(dialog).getByRole("combobox", { name: /Lý do/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Nghi ngờ gian lận" }));
    await userEvent.type(within(dialog).getByRole("textbox", { name: /Nội dung khiếu nại/ }), "Khách báo gian lận");
  }

  it("is offered only with CREATE_DISPUTE", async () => {
    renderContainer();
    await screen.findByText(CODE);
    expect(screen.queryByRole("button", { name: "Tạo khiếu nại mới" })).not.toBeInTheDocument();
  });

  it("checks the required fields before sending anything", async () => {
    const dialog = await openCreate();
    await userEvent.click(within(dialog).getByRole("button", { name: "Gửi yêu cầu" }));
    expect(await within(dialog).findByText("Vui lòng nhập mã giao dịch hoặc mã đơn hàng")).toBeInTheDocument();
    expect(within(dialog).getByText("Vui lòng chọn lý do khiếu nại")).toBeInTheDocument();
    expect(within(dialog).getByText("Vui lòng nhập nội dung khiếu nại")).toBeInTheDocument();
  });

  it("uploads the evidence, creates the complaint with its ids and opens it", async () => {
    const bodies: unknown[] = [];
    mswServer.use(
      http.post(`${listPath}/attachments`, () => HttpResponse.json({ attachmentId: "staging-1" }, { status: 201 })),
      http.post(listPath, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ ...BE_COMPLAINT, status: "WAITING" }, { status: 201 });
      }),
    );
    const dialog = await openCreate();
    await fill(dialog);
    const input = dialog.querySelector<HTMLInputElement>('input[type="file"]')!;
    await userEvent.upload(input, new File(["%PDF"], "bien-lai.pdf", { type: "application/pdf" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Gửi yêu cầu" }));
    await waitFor(() =>
      expect(bodies).toEqual([
        { transactionCode: "FM2611030001", reasonCode: "FRAUD", content: "Khách báo gian lận", attachmentIds: ["staging-1"] },
      ]),
    );
    expect(toast.success).toHaveBeenCalledWith(`Đã gửi khiếu nại ${CODE}`);
    // The new complaint opens in the detail sheet.
    expect(await screen.findByText(`#${CODE}`)).toBeInTheDocument();
  });

  it("shows the BE sentence of a refused creation and keeps the form", async () => {
    mswServer.use(http.post(listPath, () => HttpResponse.json({ message: "Chỉ hỗ trợ tra soát giao dịch Thành công" }, { status: 422 })));
    const dialog = await openCreate();
    await fill(dialog);
    await userEvent.click(within(dialog).getByRole("button", { name: "Gửi yêu cầu" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Chỉ hỗ trợ tra soát giao dịch Thành công");
    expect(within(dialog).getByRole("textbox", { name: /Mã giao dịch/ })).toHaveValue("FM2611030001");
  });
});
