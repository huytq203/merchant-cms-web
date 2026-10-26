import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listNotifications } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listNotifications: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/notifications/notification.service", () => ({ listNotifications }));
import { GET } from "../route";

const get = (query = "") => new Request(`http://localhost/api/v1/admin/notifications${query}`);

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: [], merchantIds: [] });
  listNotifications.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
});

describe("notification list route", () => {
  it("returns 401 without a session and never touches the BE", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(get())).status).toBe(401);
    expect(listNotifications).not.toHaveBeenCalled();
  });

  it("needs no permission code: any signed-in user reads their own inbox", async () => {
    expect((await GET(get())).status).toBe(200);
  });

  it("defaults to the first page of 20 and reads everything", async () => {
    await GET(get());
    expect(listNotifications).toHaveBeenCalledWith({ page: 1, pageSize: 20, unreadOnly: false });
  });

  it("forwards page, size and unreadOnly", async () => {
    await GET(get("?page=3&pageSize=50&unreadOnly=true"));
    expect(listNotifications).toHaveBeenCalledWith({ page: 3, pageSize: 50, unreadOnly: true });
  });

  it("rejects invalid pagination and unreadOnly values with 400", async () => {
    expect((await GET(get("?pageSize=101"))).status).toBe(400);
    expect((await GET(get("?unreadOnly=maybe"))).status).toBe(400);
    expect(listNotifications).not.toHaveBeenCalled();
  });

  it("returns rows and total", async () => {
    listNotifications.mockResolvedValue({ success: true, data: { rows: [{ id: "x" }], total: 1 } });
    const response = await GET(get());
    expect(await response.json()).toEqual({ rows: [{ id: "x" }], total: 1 });
  });

  it("keeps the BE status and shows a Vietnamese message for a BE failure", async () => {
    listNotifications.mockResolvedValue({ success: false, error: { status: 403, code: "MERCHANT_USER_NOT_ACTIVE", message: "x" } });
    const response = await GET(get());
    expect(response.status).toBe(403);
    expect(typeof (await response.json()).message).toBe("string");
  });
});
