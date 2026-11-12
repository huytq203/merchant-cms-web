// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
import { NotificationSheet } from "../NotificationSheet";

const list = "/api/v1/admin/notifications";
const base = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const notice = (n: number, readAt: string | null = null, extra: Record<string, unknown> = {}) => ({
  id: base(n),
  type: "TRANSACTION_RESULT",
  category: "PAYMENT",
  targetType: "NONE",
  targetId: null,
  title: `Đơn DH00${n} đã thanh toán`,
  body: `Nội dung ${n}`,
  orderId: null,
  subMerchantId: null,
  createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  readAt,
  ...extra,
});

type ByCategory = { PAYMENT: number; WITHDRAWAL: number; OTHER: number };
type Server = { rows?: ReturnType<typeof notice>[]; total?: number; unread?: number; failList?: boolean; byCategory?: ByCategory };

function serve({ rows = [], total = rows.length, unread = 0, failList = false, byCategory = { PAYMENT: unread, WITHDRAWAL: 0, OTHER: 0 } }: Server = {}) {
  const requests: string[] = [];
  mswServer.use(
    http.get(list, ({ request }) => {
      requests.push(new URL(request.url).search);
      return failList ? HttpResponse.json({ message: "Hệ thống bận" }, { status: 502 }) : HttpResponse.json({ rows, total });
    }),
    http.get(`${list}/unread-count`, () => HttpResponse.json({ count: unread, byCategory })),
  );
  return requests;
}

function renderSheet(onOpenChange: (open: boolean) => void = () => undefined, pushSlot?: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <NotificationSheet open onOpenChange={onOpenChange} pushSlot={pushSlot} />
    </QueryClientProvider>,
  );
}

/** Stubs `POST /:id/read` and returns the ids it was called with. */
function serveRead() {
  const reads: string[] = [];
  mswServer.use(http.post(`${list}/:id/read`, ({ params }) => {
    reads.push(String(params.id));
    return HttpResponse.json(notice(1, "2026-10-26T02:00:00Z"));
  }));
  return reads;
}

beforeEach(() => push.mockReset());
afterEach(cleanup);

describe("NotificationSheet", () => {
  it("shows the notifications once they load", async () => {
    serve({ rows: [notice(1), notice(2, "2026-10-26T01:00:00Z")], unread: 1 });
    renderSheet();
    expect(await screen.findByText("Đơn DH001 đã thanh toán")).toBeInTheDocument();
    expect(screen.getByText("Đơn DH002 đã thanh toán")).toBeInTheDocument();
  });

  it("tells assistive technology which notification is unread, not only through color", async () => {
    serve({ rows: [notice(1), notice(2, "2026-10-26T01:00:00Z")], unread: 1 });
    renderSheet();
    expect(await screen.findByRole("button", { name: /Đơn DH001.*Chưa đọc/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đơn DH002/ }).textContent).not.toContain("Chưa đọc");
  });

  it("shows an empty state for an empty inbox", async () => {
    serve();
    renderSheet();
    expect(await screen.findByText("Chưa có thông báo nào")).toBeInTheDocument();
  });

  it("shows an error with a retry that loads the list again", async () => {
    const user = userEvent.setup();
    serve({ failList: true });
    renderSheet();
    expect(await screen.findByText("Không tải được thông báo")).toBeInTheDocument();
    serve({ rows: [notice(1)], unread: 1 });
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Đơn DH001 đã thanh toán")).toBeInTheDocument();
  });

  it("asks only for unread notifications when the unread switch is on", async () => {
    const user = userEvent.setup();
    const requests = serve({ rows: [notice(1)], unread: 1 });
    renderSheet();
    await screen.findByText("Đơn DH001 đã thanh toán");
    await user.click(screen.getByRole("switch", { name: "Chỉ chưa đọc" }));
    await waitFor(() => expect(requests.some((search) => search.includes("unreadOnly=true"))).toBe(true));
    expect(requests[0]).not.toContain("unreadOnly");
  });

  it("has the four tabs and sends the category of the tab that is opened", async () => {
    const user = userEvent.setup();
    const requests = serve({ rows: [notice(1)], unread: 1 });
    renderSheet();
    await screen.findByText("Đơn DH001 đã thanh toán");
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent?.replace(/\d.*/, "").trim())).toEqual([
      "Tất cả",
      "Thanh toán",
      "Rút tiền",
      "Khác",
    ]);
    expect(requests[0]).not.toContain("category");
    await user.click(screen.getByRole("tab", { name: /Rút tiền/ }));
    await waitFor(() => expect(requests.some((search) => search.includes("category=WITHDRAWAL"))).toBe(true));
    await user.click(screen.getByRole("tab", { name: /Khác/ }));
    await waitFor(() => expect(requests.some((search) => search.includes("category=OTHER"))).toBe(true));
  });

  it("shows each tab's own unread count, and the total on All", async () => {
    serve({ rows: [notice(1)], unread: 7, byCategory: { PAYMENT: 4, WITHDRAWAL: 2, OTHER: 1 } });
    renderSheet();
    expect(await screen.findByRole("tab", { name: /Tất cả.*7/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Thanh toán.*4/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Rút tiền.*2/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Khác.*1/ })).toBeInTheDocument();
  });

  it("marks an unread order notification read, closes the sheet and opens the order", async () => {
    const user = userEvent.setup();
    serve({ rows: [notice(1, null, { targetType: "ORDER", targetId: base(9) })], unread: 1 });
    const reads = serveRead();
    const onOpenChange = vi.fn();
    renderSheet(onOpenChange);
    await user.click(await screen.findByRole("button", { name: /Đơn DH001/ }));
    await waitFor(() => expect(reads).toEqual([base(1)]));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(push).toHaveBeenCalledWith(`/order?detail=${base(9)}`);
  });

  it("does not navigate for a notification without a destination, but still marks it read", async () => {
    const user = userEvent.setup();
    serve({ rows: [notice(1)], unread: 1 });
    const reads = serveRead();
    renderSheet();
    await user.click(await screen.findByRole("button", { name: /Đơn DH001/ }));
    await waitFor(() => expect(reads).toEqual([base(1)]));
    expect(push).not.toHaveBeenCalled();
  });

  it("opens the destination of an already-read notification without marking it again", async () => {
    const user = userEvent.setup();
    serve({ rows: [notice(1, "2026-10-26T01:00:00Z", { targetType: "ESCROW" })] });
    const reads = serveRead();
    renderSheet();
    await user.click(await screen.findByRole("button", { name: /Đơn DH001/ }));
    expect(push).toHaveBeenCalledWith("/escrow");
    expect(reads).toEqual([]);
  });

  it("disables mark-all when the open tab has nothing unread and posts read-all otherwise", async () => {
    const user = userEvent.setup();
    serve({ rows: [notice(1, "2026-10-26T01:00:00Z")], unread: 0 });
    renderSheet();
    await screen.findByText("Đơn DH001 đã thanh toán");
    expect(screen.getByRole("button", { name: "Đánh dấu tất cả đã đọc" })).toBeDisabled();
    cleanup();

    serve({ rows: [notice(1)], unread: 1 });
    let readAll = 0;
    mswServer.use(http.post(`${list}/read-all`, () => {
      readAll += 1;
      return HttpResponse.json({ updated: 1 });
    }));
    renderSheet();
    const button = await screen.findByRole("button", { name: "Đánh dấu tất cả đã đọc" });
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await waitFor(() => expect(readAll).toBe(1));
  });

  it("marks all read for the open tab only", async () => {
    const user = userEvent.setup();
    serve({ rows: [notice(1)], unread: 3, byCategory: { PAYMENT: 1, WITHDRAWAL: 2, OTHER: 0 } });
    const seen: (string | null)[] = [];
    mswServer.use(http.post(`${list}/read-all`, ({ request }) => {
      seen.push(new URL(request.url).searchParams.get("category"));
      return HttpResponse.json({ updated: 2 });
    }));
    renderSheet();
    await user.click(await screen.findByRole("tab", { name: /Rút tiền/ }));
    const button = screen.getByRole("button", { name: "Đánh dấu tất cả đã đọc" });
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await waitFor(() => expect(seen).toEqual(["WITHDRAWAL"]));
  });

  it("loads more only while there are more", async () => {
    const user = userEvent.setup();
    mswServer.use(
      http.get(list, ({ request }) => {
        const page = new URL(request.url).searchParams.get("page");
        return HttpResponse.json(page === "1" ? { rows: [notice(1)], total: 2 } : { rows: [notice(2)], total: 2 });
      }),
      http.get(`${list}/unread-count`, () => HttpResponse.json({ count: 2, byCategory: { PAYMENT: 2, WITHDRAWAL: 0, OTHER: 0 } })),
    );
    renderSheet();
    await screen.findByText("Đơn DH001 đã thanh toán");
    await user.click(screen.getByRole("button", { name: "Tải thêm" }));
    expect(await screen.findByText("Đơn DH002 đã thanh toán")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tải thêm" })).not.toBeInTheDocument();
  });

  it("leaves room for the browser-push button", async () => {
    serve();
    renderSheet(undefined, <button type="button">Bật thông báo trên trình duyệt</button>);
    expect(await screen.findByRole("button", { name: "Bật thông báo trên trình duyệt" })).toBeInTheDocument();
  });
});
