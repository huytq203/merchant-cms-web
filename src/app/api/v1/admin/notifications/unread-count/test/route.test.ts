import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getUnreadCount } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getUnreadCount: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/notifications/notification.service", () => ({ getUnreadCount }));
import { GET } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: [], merchantIds: [] });
  getUnreadCount.mockResolvedValue({ success: true, data: { count: 4, byCategory: { PAYMENT: 2, WITHDRAWAL: 1, OTHER: 1 } } });
});

describe("unread count route", () => {
  it("returns 401 without a session", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(getUnreadCount).not.toHaveBeenCalled();
  });

  it("returns the count for any signed-in user", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ count: 4, byCategory: { PAYMENT: 2, WITHDRAWAL: 1, OTHER: 1 } });
  });

  it("keeps a BE 4xx status and turns a BE 5xx into 502", async () => {
    getUnreadCount.mockResolvedValueOnce({ success: false, error: { status: 403, code: "X", message: "x" } });
    expect((await GET()).status).toBe(403);
    getUnreadCount.mockResolvedValueOnce({ success: false, error: { status: 503, code: "X", message: "x" } });
    expect((await GET()).status).toBe(502);
  });
});
