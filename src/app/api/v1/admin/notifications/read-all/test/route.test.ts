import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, markAllNotificationsRead } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/notifications/notification.service", () => ({ markAllNotificationsRead }));
import { POST } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: [], merchantIds: [] });
  markAllNotificationsRead.mockResolvedValue({ success: true, data: { updated: 3 } });
});

describe("read-all route", () => {
  it("returns 401 without a session and never writes", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await POST()).status).toBe(401);
    expect(markAllNotificationsRead).not.toHaveBeenCalled();
  });

  it("returns how many notifications changed", async () => {
    const response = await POST();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ updated: 3 });
  });

  it("keeps the BE status on failure", async () => {
    markAllNotificationsRead.mockResolvedValue({ success: false, error: { status: 403, code: "X", message: "x" } });
    expect((await POST()).status).toBe(403);
  });
});
