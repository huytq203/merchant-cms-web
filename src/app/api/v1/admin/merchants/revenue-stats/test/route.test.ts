import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getRevenueSeries } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getRevenueSeries: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/revenue-stats/revenue-stats.service", () => ({ getRevenueSeries }));
import { GET } from "../route";

const sub = "5dcda5e6-afd1-4201-a02f-7187164f0f86";
const request = (query = "") => new Request(`http://localhost/api/v1/admin/merchants/revenue-stats${query}`);
const session = (permissions: string[]) => ({ merchantIds: [], subMerchantIds: [sub], permissions });
const series = { granularity: "DAY", from: "2026-10-05", to: "2026-11-03", points: [] };

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  // 23:30 on 2/11 UTC is already 3/11 in Vietnam: the range must end on the Vietnam day.
  vi.setSystemTime(new Date("2026-11-02T23:30:00Z"));
  getServerSession.mockResolvedValue(session(["VIEW_BALANCE"]));
  getRevenueSeries.mockResolvedValue({ success: true, data: series });
});

describe("revenue stats route", () => {
  it("answers 401 without a session and 403 without VIEW_BALANCE", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(request("?granularity=DAY"))).status).toBe(401);
    getServerSession.mockResolvedValue(session(["VIEW_ORDER"]));
    expect((await GET(request("?granularity=DAY"))).status).toBe(403);
    expect(getRevenueSeries).not.toHaveBeenCalled();
  });

  it("rejects an unknown granularity or a malformed Sub id", async () => {
    expect((await GET(request("?granularity=WEEK"))).status).toBe(400);
    expect((await GET(request("?granularity=DAY&subMerchantId=S001"))).status).toBe(400);
    expect(getRevenueSeries).not.toHaveBeenCalled();
  });

  it("asks the BE for the last 30 Vietnam days or 12 months, optionally for one Sub", async () => {
    const response = await GET(request(`?granularity=DAY&subMerchantId=${sub}`));
    expect(response.status).toBe(200);
    expect(getRevenueSeries).toHaveBeenLastCalledWith({ granularity: "DAY", from: "2026-10-05", to: "2026-11-03", subMerchantId: sub });

    await GET(request("?granularity=MONTH"));
    expect(getRevenueSeries).toHaveBeenLastCalledWith({ granularity: "MONTH", from: "2025-12-01", to: "2026-11-03" });
  });

  it("forwards the Vietnamese BE message", async () => {
    getRevenueSeries.mockResolvedValue({
      success: false,
      error: { status: 404, code: "RESOURCE_NOT_FOUND", message: "Không tìm thấy điểm bán" },
    });
    const response = await GET(request("?granularity=DAY"));
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ message: "Không tìm thấy điểm bán" });
  });
});
