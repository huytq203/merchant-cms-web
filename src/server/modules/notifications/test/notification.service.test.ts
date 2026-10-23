import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import {
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../notification.service";

const base = "https://merchant.test/api/v1/merchant/notifications";
const id = "7d0c1f0e-3b1a-4a55-9a52-0c6d1d0b9a11";
const envelope = (data: unknown) => ({ success: true, status: "1000", message: "ok", data });
const row = {
  id,
  type: "TRANSACTION_RESULT",
  title: "Giao dịch thành công",
  body: "Đơn ORD-1",
  orderId: null,
  subMerchantId: null,
  createdAt: "2026-10-20T08:00:00Z",
  readAt: null,
};

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
});

describe("notification service", () => {
  it("sends only unreadOnly, page and size, and maps the Spring Page", async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(base, ({ request }) => {
      query = new URL(request.url).searchParams;
      return HttpResponse.json(envelope({ content: [row], totalElements: 1, totalPages: 1, number: 1, size: 5 }));
    }));
    const result = await listNotifications({ unreadOnly: true, page: 2, pageSize: 5 });
    expect(result).toEqual({ success: true, data: { rows: [row], total: 1 } });
    expect(Object.fromEntries(query!)).toEqual({ unreadOnly: "true", page: "2", size: "5" });
  });

  it("reads the unread count", async () => {
    mswServer.use(http.get(`${base}/unread-count`, () => HttpResponse.json(envelope({ count: 4 }))));
    expect(await countUnreadNotifications()).toMatchObject({ success: true, data: { count: 4 } });
  });

  it("posts mark-read to the encoded id and returns the read row", async () => {
    let method: string | undefined;
    mswServer.use(http.post(`${base}/${id}/read`, ({ request }) => {
      method = request.method;
      return HttpResponse.json(envelope({ ...row, readAt: "2026-10-20T09:00:00Z" }));
    }));
    const result = await markNotificationRead(id);
    expect(method).toBe("POST");
    expect(result).toMatchObject({ success: true, data: { id, readAt: "2026-10-20T09:00:00Z" } });
  });

  it("keeps the BE 404 message for a notification of someone else", async () => {
    mswServer.use(http.post(`${base}/${id}/read`, () => HttpResponse.json(
      { success: false, status: "404", message: "Không tìm thấy thông báo." },
      { status: 404 },
    )));
    expect(await markNotificationRead(id)).toMatchObject({ success: false, error: { status: 404, message: "Không tìm thấy thông báo." } });
  });

  it("marks everything read and returns how many rows changed", async () => {
    mswServer.use(http.post(`${base}/read-all`, () => HttpResponse.json(envelope({ updated: 2 }))));
    expect(await markAllNotificationsRead()).toMatchObject({ success: true, data: { updated: 2 } });
  });

  it("preserves a locked-account 403", async () => {
    mswServer.use(http.get(`${base}/unread-count`, () => HttpResponse.json({ success: false, message: "Tài khoản đã bị khóa" }, { status: 403 })));
    expect(await countUnreadNotifications()).toMatchObject({ success: false, error: { status: 403 } });
  });
});
