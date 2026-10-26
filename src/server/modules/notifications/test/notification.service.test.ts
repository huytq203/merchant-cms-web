import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../notification.service";

const base = "https://merchant.test/api/v1/merchant/notifications";
const id = "11111111-1111-4111-8111-111111111111";
const envelope = (data: unknown) => ({ success: true, data });
const page = (content: unknown[], totalElements = content.length) => ({ content, totalElements, totalPages: 1, number: 0, size: 20 });
const notice = {
  id,
  type: "TRANSACTION_RESULT",
  title: "Đơn DH001 đã thanh toán",
  body: "Số tiền 150.000 ₫",
  orderId: null,
  subMerchantId: null,
  createdAt: "2026-10-26T03:00:00Z",
  readAt: null,
};

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
});

describe("notification service", () => {
  it("maps the BE page to rows and total and sends page, size and unreadOnly", async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(base, ({ request }) => {
      query = new URL(request.url).searchParams;
      return HttpResponse.json(envelope(page([notice], 41)));
    }));
    const result = await listNotifications({ page: 2, pageSize: 20, unreadOnly: true });
    expect(result).toEqual({ success: true, data: { rows: [notice], total: 41 } });
    expect(Object.fromEntries(query!)).toEqual({ page: "2", size: "20", unreadOnly: "true" });
  });

  it("omits unreadOnly when it is false", async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(base, ({ request }) => {
      query = new URL(request.url).searchParams;
      return HttpResponse.json(envelope(page([])));
    }));
    await listNotifications({ page: 1, pageSize: 20, unreadOnly: false });
    expect(query?.has("unreadOnly")).toBe(false);
  });

  it("rejects a notification the contract does not allow", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json(envelope(page([{ ...notice, id: "bad" }])))));
    expect(await listNotifications({ page: 1, pageSize: 20, unreadOnly: false })).toMatchObject({ success: false, error: { code: "INVALID_RESPONSE" } });
  });

  it("reads the unread count", async () => {
    mswServer.use(http.get(`${base}/unread-count`, () => HttpResponse.json(envelope({ count: 7 }))));
    expect(await getUnreadCount()).toEqual({ success: true, data: { count: 7 } });
  });

  it("marks one notification read and returns it", async () => {
    const read = { ...notice, readAt: "2026-10-26T03:05:00Z" };
    mswServer.use(http.post(`${base}/${id}/read`, () => HttpResponse.json(envelope(read))));
    expect(await markNotificationRead(id)).toEqual({ success: true, data: read });
  });

  it("keeps a 404 for another user's notification", async () => {
    mswServer.use(http.post(`${base}/${id}/read`, () => HttpResponse.json({ success: false, message: "Không tìm thấy" }, { status: 404 })));
    expect(await markNotificationRead(id)).toMatchObject({ success: false, error: { status: 404 } });
  });

  it("marks everything read and returns how many changed", async () => {
    mswServer.use(http.post(`${base}/read-all`, () => HttpResponse.json(envelope({ updated: 3 }))));
    expect(await markAllNotificationsRead()).toEqual({ success: true, data: { updated: 3 } });
  });

  it("preserves a not-active user error", async () => {
    mswServer.use(http.get(`${base}/unread-count`, () => HttpResponse.json({ success: false, message: "Tài khoản chưa hoạt động" }, { status: 403 })));
    expect(await getUnreadCount()).toMatchObject({ success: false, error: { status: 403 } });
  });
});
