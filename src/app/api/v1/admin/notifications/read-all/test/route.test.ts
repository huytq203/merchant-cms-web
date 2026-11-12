import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, markAllNotificationsRead } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/notifications/notification.service", () => ({ markAllNotificationsRead }));
import { POST } from "../route";

const post = (query = "") => new Request(`http://localhost/api/v1/admin/notifications/read-all${query}`, { method: "POST" });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: [], merchantIds: [] });
  markAllNotificationsRead.mockResolvedValue({ success: true, data: { updated: 3 } });
});

describe("read-all route", () => {
  it("returns 401 without a session and never writes", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await POST(post())).status).toBe(401);
    expect(markAllNotificationsRead).not.toHaveBeenCalled();
  });

  it("returns how many notifications changed", async () => {
    const response = await POST(post());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ updated: 3 });
  });

  it("keeps the BE status on failure", async () => {
    markAllNotificationsRead.mockResolvedValue({ success: false, error: { status: 403, code: "X", message: "x" } });
    expect((await POST(post())).status).toBe(403);
  });

  it("passes the category of the open tab and rejects an unknown one", async () => {
    await POST(post("?category=WITHDRAWAL"));
    expect(markAllNotificationsRead).toHaveBeenCalledWith("WITHDRAWAL");
    markAllNotificationsRead.mockClear();
    const response = await POST(post("?category=NOPE"));
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe("Nhóm thông báo không hợp lệ.");
    expect(markAllNotificationsRead).not.toHaveBeenCalled();
  });

  it("marks everything when no category is given", async () => {
    await POST(post());
    expect(markAllNotificationsRead).toHaveBeenCalledWith(undefined);
  });
});
