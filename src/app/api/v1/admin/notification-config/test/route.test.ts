import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getNotificationConfig } = vi.hoisted(() => ({ getServerSession: vi.fn(), getNotificationConfig: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/notification-config/notification-config.service", () => ({ getNotificationConfig }));
import { GET } from "../route";

const SUB = "00000000-0000-4000-8000-000000000001";
const req = (qs = "") => new Request(`http://localhost/api/v1/admin/notification-config${qs}`);
const DATA = { externalChannelsEnabled: true, externalChannels: [], notificationEmails: ["a@b.vn"] };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: ["MANAGE_NOTIFICATION"], merchantIds: ["m"], subMerchantIds: [] });
  getNotificationConfig.mockResolvedValue({ success: true, data: DATA });
});

describe("notification config route", () => {
  it("returns 401 without a session", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(req())).status).toBe(401);
  });

  it("returns 403 without MANAGE_NOTIFICATION", async () => {
    getServerSession.mockResolvedValue({ permissions: ["VIEW_ORDER"], merchantIds: ["m"], subMerchantIds: [] });
    expect((await GET(req())).status).toBe(403);
    expect(getNotificationConfig).not.toHaveBeenCalled();
  });

  it("forwards the Sub and returns the config", async () => {
    const response = await GET(req(`?subMerchantId=${SUB}`));
    expect(getNotificationConfig).toHaveBeenCalledWith(SUB);
    expect(await response.json()).toEqual(DATA);
  });

  it("calls the BE without a Sub for the Master level", async () => {
    await GET(req());
    expect(getNotificationConfig).toHaveBeenCalledWith(undefined);
  });

  it("rejects a malformed Sub id with 400", async () => {
    expect((await GET(req("?subMerchantId=x"))).status).toBe(400);
  });

  it("keeps a BE 404 and turns a 5xx into 502", async () => {
    getNotificationConfig.mockResolvedValueOnce({ success: false, error: { status: 404, code: "X", message: "x" } });
    expect((await GET(req())).status).toBe(404);
    getNotificationConfig.mockResolvedValueOnce({ success: false, error: { status: 503, code: "X", message: "x" } });
    expect((await GET(req())).status).toBe(502);
  });
});
