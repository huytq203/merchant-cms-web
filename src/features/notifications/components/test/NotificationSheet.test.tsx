// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { NotificationSheet } from "../NotificationSheet";

const list = "/api/v1/admin/notifications";
const base = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const notice = (n: number, readAt: string | null = null) => ({
  id: base(n),
  type: "TRANSACTION_RESULT",
  title: `Đơn DH00${n} đã thanh toán`,
  body: `Nội dung ${n}`,
  orderId: null,
  subMerchantId: null,
  createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  readAt,
});

type Server = { rows?: ReturnType<typeof notice>[]; total?: number; unread?: number; failList?: boolean };

function serve({ rows = [], total = rows.length, unread = 0, failList = false }: Server = {}) {
  const requests: string[] = [];
  mswServer.use(
    http.get(list, ({ request }) => {
      requests.push(new URL(request.url).search);
      return failList ? HttpResponse.json({ message: "Hệ thống bận" }, { status: 502 }) : HttpResponse.json({ rows, total });
    }),
    http.get(`${list}/unread-count`, () => HttpResponse.json({ count: unread })),
  );
  return requests;
}

function renderSheet() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <NotificationSheet open onOpenChange={() => undefined} />
    </QueryClientProvider>,
  );
}

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

  it("asks only for unread notifications on the unread tab", async () => {
    const user = userEvent.setup();
    const requests = serve({ rows: [notice(1)], unread: 1 });
    renderSheet();
    await screen.findByText("Đơn DH001 đã thanh toán");
    await user.click(screen.getByRole("tab", { name: "Chưa đọc" }));
    await waitFor(() => expect(requests.some((search) => search.includes("unreadOnly=true"))).toBe(true));
    expect(requests[0]).not.toContain("unreadOnly");
  });

  it("marks an unread notification read when it is clicked, and leaves a read one alone", async () => {
    const user = userEvent.setup();
    serve({ rows: [notice(1), notice(2, "2026-10-26T01:00:00Z")], unread: 1 });
    const reads: string[] = [];
    mswServer.use(http.post(`${list}/:id/read`, ({ params }) => {
      reads.push(String(params.id));
      return HttpResponse.json(notice(1, "2026-10-26T02:00:00Z"));
    }));
    renderSheet();
    await user.click(await screen.findByRole("button", { name: /Đơn DH001/ }));
    await waitFor(() => expect(reads).toEqual([base(1)]));
    await user.click(screen.getByRole("button", { name: /Đơn DH002/ }));
    expect(reads).toEqual([base(1)]);
  });

  it("disables mark-all when nothing is unread and posts read-all otherwise", async () => {
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

  it("loads more only while there are more", async () => {
    const user = userEvent.setup();
    mswServer.use(
      http.get(list, ({ request }) => {
        const page = new URL(request.url).searchParams.get("page");
        return HttpResponse.json(page === "1" ? { rows: [notice(1)], total: 2 } : { rows: [notice(2)], total: 2 });
      }),
      http.get(`${list}/unread-count`, () => HttpResponse.json({ count: 2 })),
    );
    renderSheet();
    await screen.findByText("Đơn DH001 đã thanh toán");
    await user.click(screen.getByRole("button", { name: "Tải thêm" }));
    expect(await screen.findByText("Đơn DH002 đã thanh toán")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tải thêm" })).not.toBeInTheDocument();
  });
});
