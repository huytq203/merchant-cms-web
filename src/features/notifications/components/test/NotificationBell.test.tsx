// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { notificationRow } from "../../test/fixtures";
import { NotificationBell } from "../NotificationBell";

const base = "/api/v1/merchant/notifications";

function renderBell() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <NotificationBell />
    </QueryClientProvider>,
  );
}

afterEach(cleanup);

describe("NotificationBell", () => {
  it("caps the badge at 99+", async () => {
    mswServer.use(http.get(`${base}/unread-count`, () => HttpResponse.json({ count: 120 })));
    renderBell();
    expect(await screen.findByText("99+")).toBeInTheDocument();
  });

  it("hides the badge when nothing is unread", async () => {
    let asked = false;
    mswServer.use(http.get(`${base}/unread-count`, () => {
      asked = true;
      return HttpResponse.json({ count: 0 });
    }));
    renderBell();
    await waitFor(() => expect(asked).toBe(true));
    expect(screen.getByRole("button", { name: "Thông báo" })).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("opens the five latest rows and marks a clicked row read, lowering the badge", async () => {
    let unread = 3;
    let listQuery: URLSearchParams | undefined;
    const rows = [1, 2, 3, 4, 5].map((index) => notificationRow(index));
    const readIds: string[] = [];
    mswServer.use(
      http.get(`${base}/unread-count`, () => HttpResponse.json({ count: unread })),
      http.get(base, ({ request }) => {
        listQuery = new URL(request.url).searchParams;
        return HttpResponse.json({ rows, total: 12 });
      }),
      http.post(`${base}/:id/read`, ({ params }) => {
        readIds.push(String(params.id));
        unread -= 1;
        return HttpResponse.json({ ...rows[0], readAt: "2026-10-20T09:00:00Z" });
      }),
    );
    const user = userEvent.setup();
    renderBell();
    expect(await screen.findByText("3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Thông báo/ }));
    const first = await screen.findByRole("button", { name: /Giao dịch thành công 1\b/ });
    expect(listQuery?.get("pageSize")).toBe("5");
    expect(screen.getByRole("link", { name: "Xem tất cả" })).toHaveAttribute("href", "/notifications");

    await user.click(first);
    await waitFor(() => expect(readIds).toEqual([rows[0]!.id]));
    expect(await screen.findByText("2")).toBeInTheDocument();
  });
});
