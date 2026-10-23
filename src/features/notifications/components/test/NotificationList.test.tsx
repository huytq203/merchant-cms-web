// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { notificationRow } from "../../test/fixtures";
import type { NotificationFilter } from "../../types";
import { NotificationList } from "../NotificationList";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/notifications" }));

const base = "/api/v1/merchant/notifications";
const unreadRow = notificationRow(1);
const readRow = notificationRow(2, { readAt: "2026-10-20T09:00:00Z" });
let listQueries: URLSearchParams[] = [];
let posted: string[] = [];

function renderList(filter: NotificationFilter) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <NotificationList filter={filter} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  listQueries = [];
  posted = [];
  mswServer.use(
    http.get(`${base}/unread-count`, () => HttpResponse.json({ count: 1 })),
    http.get(base, ({ request }) => {
      const query = new URL(request.url).searchParams;
      listQueries.push(query);
      const rows = query.get("unreadOnly") === "true" ? [unreadRow] : [unreadRow, readRow];
      return HttpResponse.json({ rows, total: rows.length });
    }),
    http.post(`${base}/read-all`, () => {
      posted.push("read-all");
      return HttpResponse.json({ updated: 1 });
    }),
    http.post(`${base}/:id/read`, ({ params }) => {
      posted.push(String(params.id));
      return HttpResponse.json({ ...unreadRow, readAt: "2026-10-20T10:00:00Z" });
    }),
  );
});

afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("notifications page list", () => {
  it("switches to the unread filter through the URL, back to page 1", async () => {
    const user = userEvent.setup();
    renderList({ unreadOnly: false, page: 3, pageSize: 20 });
    await screen.findByText(readRow.title);
    await user.click(screen.getByRole("tab", { name: "Chưa đọc" }));
    expect(push).toHaveBeenCalledWith("/notifications?unreadOnly=true&page=1&pageSize=20");
  });

  it("asks the BFF for unread rows only when the filter is on", async () => {
    renderList({ unreadOnly: true, page: 1, pageSize: 20 });
    await screen.findByText(unreadRow.title);
    expect(listQueries.at(-1)?.get("unreadOnly")).toBe("true");
    expect(screen.queryByText(readRow.title)).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Chưa đọc" })).toHaveAttribute("aria-selected", "true");
  });

  it("marks one row read and lets the user mark everything read", async () => {
    const user = userEvent.setup();
    renderList({ unreadOnly: false, page: 1, pageSize: 20 });
    await screen.findByText(unreadRow.title);
    await user.click(screen.getByRole("button", { name: `Đánh dấu đã đọc ${unreadRow.title}` }));
    await waitFor(() => expect(posted).toContain(unreadRow.id));
    const markAll = screen.getByRole("button", { name: "Đánh dấu tất cả đã đọc" });
    await waitFor(() => expect(markAll).toBeEnabled());
    await user.click(markAll);
    await waitFor(() => expect(posted).toContain("read-all"));
  });

  it("shows an empty state when there is nothing unread", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [], total: 0 })));
    renderList({ unreadOnly: true, page: 1, pageSize: 20 });
    expect(await screen.findByText("Không có thông báo chưa đọc.")).toBeInTheDocument();
  });
});
