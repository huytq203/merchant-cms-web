// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { mswServer } from "@/test/msw";
import { notificationQueries, NOTIFICATION_PAGE_SIZE, UNREAD_COUNT_REFRESH_MS } from "../notification-queries";

const row = (n: number) => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  type: "TRANSACTION_RESULT",
  category: "PAYMENT" as const,
  targetType: "ORDER",
  targetId: null,
  title: `Thông báo ${n}`,
  body: "",
  orderId: null,
  subMerchantId: null,
  createdAt: "2026-10-26T03:00:00Z",
  readAt: null,
});
const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe("notification queries", () => {
  it("refreshes the unread count every 60 seconds", () => {
    expect(UNREAD_COUNT_REFRESH_MS).toBe(60_000);
    expect(notificationQueries.unreadCount().refetchInterval).toBe(UNREAD_COUNT_REFRESH_MS);
  });

  it("keeps the unread-only list and the full list under different keys", () => {
    expect(notificationQueries.list(true).queryKey).not.toEqual(notificationQueries.list(false).queryKey);
  });

  it("shares a prefix so one invalidation reaches the list and the count", () => {
    expect(notificationQueries.unreadCount().queryKey[0]).toBe(notificationQueries.list(false).queryKey[0]);
  });

  it("reads the count from the app route", async () => {
    mswServer.use(http.get("/api/v1/admin/notifications/unread-count", () => HttpResponse.json({ count: 5, byCategory: { PAYMENT: 3, WITHDRAWAL: 1, OTHER: 1 } })));
    expect(await client().fetchQuery(notificationQueries.unreadCount())).toEqual({ count: 5, byCategory: { PAYMENT: 3, WITHDRAWAL: 1, OTHER: 1 } });
  });

  it("asks for page after page and stops when every row is loaded", async () => {
    const pages: string[] = [];
    mswServer.use(http.get("/api/v1/admin/notifications", ({ request }) => {
      const params = new URL(request.url).searchParams;
      pages.push(`${params.get("page")}:${params.get("pageSize")}:${params.get("unreadOnly")}`);
      const first = params.get("page") === "1";
      return HttpResponse.json({ rows: first ? [row(1), row(2)] : [row(3)], total: 3 });
    }));
    const queryClient = client();
    const options = notificationQueries.list(true);
    const first = await queryClient.fetchInfiniteQuery({ ...options, pages: 1 });
    expect(options.getNextPageParam(first.pages[first.pages.length - 1]!, first.pages, 1, first.pageParams)).toBe(2);
    const second = await queryClient.fetchInfiniteQuery({ ...options, pages: 2 });
    const last = second.pages[second.pages.length - 1]!;
    expect(options.getNextPageParam(last, second.pages, 2, second.pageParams)).toBeUndefined();
    expect(pages).toEqual([`1:${NOTIFICATION_PAGE_SIZE}:true`, `1:${NOTIFICATION_PAGE_SIZE}:true`, `2:${NOTIFICATION_PAGE_SIZE}:true`]);
  });

  it("keeps the open list fresh on the same interval as the count", () => {
    expect(notificationQueries.list(false).refetchInterval).toBe(UNREAD_COUNT_REFRESH_MS);
  });

  it("stops asking for pages once a page comes back empty, even if the total says more", () => {
    const options = notificationQueries.list(false);
    const full = { rows: [row(1)], total: 45 };
    const empty = { rows: [], total: 45 };
    expect(options.getNextPageParam(empty, [full, empty], 2, [1, 2])).toBeUndefined();
  });

  it("does not send unreadOnly for the full list", async () => {
    let params: URLSearchParams | undefined;
    mswServer.use(http.get("/api/v1/admin/notifications", ({ request }) => {
      params = new URL(request.url).searchParams;
      return HttpResponse.json({ rows: [], total: 0 });
    }));
    await client().fetchInfiniteQuery(notificationQueries.list(false));
    expect(params?.has("unreadOnly")).toBe(false);
  });

  it("sends the category and keeps each tab under its own key", async () => {
    let params: URLSearchParams | undefined;
    mswServer.use(http.get("/api/v1/admin/notifications", ({ request }) => {
      params = new URL(request.url).searchParams;
      return HttpResponse.json({ rows: [], total: 0 });
    }));
    await client().fetchInfiniteQuery(notificationQueries.list(false, "WITHDRAWAL"));
    expect(params?.get("category")).toBe("WITHDRAWAL");
    expect(notificationQueries.list(false, "PAYMENT").queryKey).not.toEqual(notificationQueries.list(false, "OTHER").queryKey);
    expect(notificationQueries.list(false).queryKey).not.toEqual(notificationQueries.list(false, "PAYMENT").queryKey);
  });
});
