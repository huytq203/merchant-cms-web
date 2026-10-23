import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listNotifications, countUnreadNotifications, markNotificationRead, markAllNotificationsRead } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listNotifications: vi.fn(),
  countUnreadNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/notifications/notification.service", () => ({
  listNotifications,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
}));
import { GET as list } from "../route";
import { GET as unreadCount } from "../unread-count/route";
import { POST as markRead } from "../[id]/read/route";
import { POST as markAllRead } from "../read-all/route";

const id = "7d0c1f0e-3b1a-4a55-9a52-0c6d1d0b9a11";
const base = "http://localhost/api/v1/merchant/notifications";
const params = (value: string) => ({ params: Promise.resolve({ id: value }) });
const unauthorized = { success: false, error: { status: 401, code: "HTTP_401", message: "Phiên đăng nhập đã hết hạn" } };

beforeEach(() => {
  vi.clearAllMocks();
  // No business permission: the inbox only needs a signed-in merchant user.
  getServerSession.mockResolvedValue({ userId: "session-user", permissions: [], merchantIds: [], subMerchantIds: [] });
});

describe("notification routes", () => {
  it("answer 401 without a session and never reach the BE", async () => {
    getServerSession.mockResolvedValue(null);
    const statuses = [
      (await list(new Request(base))).status,
      (await unreadCount()).status,
      (await markRead(new Request(`${base}/${id}/read`, { method: "POST" }), params(id))).status,
      (await markAllRead()).status,
    ];
    expect(statuses).toEqual([401, 401, 401, 401]);
    for (const service of [listNotifications, countUnreadNotifications, markNotificationRead, markAllNotificationsRead]) {
      expect(service).not.toHaveBeenCalled();
    }
  });

  it("lists with the URL filter and never forwards a client userId", async () => {
    listNotifications.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
    const response = await list(new Request(`${base}?unreadOnly=true&page=2&pageSize=5&userId=someone-else`));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ rows: [], total: 0 });
    expect(listNotifications).toHaveBeenCalledWith({ unreadOnly: true, page: 2, pageSize: 5 });
  });

  it("returns the unread count", async () => {
    countUnreadNotifications.mockResolvedValue({ success: true, data: { count: 7 } });
    const response = await unreadCount();
    expect(await response.json()).toEqual({ count: 7 });
  });

  it("marks one notification read and rejects a non-UUID id before the BE", async () => {
    markNotificationRead.mockResolvedValue({ success: true, data: { id, readAt: "2026-10-20T09:00:00Z" } });
    const ok = await markRead(new Request(`${base}/${id}/read`, { method: "POST" }), params(id));
    expect(ok.status).toBe(200);
    expect(markNotificationRead).toHaveBeenCalledWith(id);
    const bad = await markRead(new Request(`${base}/..%2fx/read`, { method: "POST" }), params("..%2fx"));
    expect(bad.status).toBe(404);
    expect(markNotificationRead).toHaveBeenCalledTimes(1);
  });

  it("passes the BE 404 message through", async () => {
    markNotificationRead.mockResolvedValue({ success: false, error: { status: 404, code: "HTTP_404", message: "Không tìm thấy thông báo." } });
    const response = await markRead(new Request(`${base}/${id}/read`, { method: "POST" }), params(id));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Không tìm thấy thông báo." });
  });

  it("marks all read", async () => {
    markAllNotificationsRead.mockResolvedValue({ success: true, data: { updated: 2 } });
    expect(await (await markAllRead()).json()).toEqual({ updated: 2 });
  });

  it("answers 403, never 401, when the BE chain refuses so the browser keeps the session", async () => {
    countUnreadNotifications.mockResolvedValue(unauthorized);
    expect((await unreadCount()).status).toBe(403);
  });
});
