import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, markNotificationRead } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  markNotificationRead: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/notifications/notification.service", () => ({ markNotificationRead }));
import { POST } from "../route";

const id = "11111111-1111-4111-8111-111111111111";
const call = (value = id) => POST(new Request(`http://localhost/api/v1/admin/notifications/${value}/read`, { method: "POST" }), {
  params: Promise.resolve({ id: value }),
});

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: [], merchantIds: [] });
  markNotificationRead.mockResolvedValue({ success: true, data: { id, readAt: "2026-10-26T03:00:00Z" } });
});

describe("mark one notification read route", () => {
  it("returns 401 without a session and never writes", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await call()).status).toBe(401);
    expect(markNotificationRead).not.toHaveBeenCalled();
  });

  it("answers 404 for an id that is not a UUID before reaching the BE", async () => {
    expect((await call("..%2Fread-all")).status).toBe(404);
    expect(markNotificationRead).not.toHaveBeenCalled();
  });

  it("marks the notification and returns it", async () => {
    const response = await call();
    expect(response.status).toBe(200);
    expect(markNotificationRead).toHaveBeenCalledWith(id);
    expect(await response.json()).toMatchObject({ id });
  });

  it("keeps the BE 404 for a notification that is not the caller's", async () => {
    markNotificationRead.mockResolvedValue({ success: false, error: { status: 404, code: "NOT_FOUND", message: "x" } });
    expect((await call()).status).toBe(404);
  });
});
