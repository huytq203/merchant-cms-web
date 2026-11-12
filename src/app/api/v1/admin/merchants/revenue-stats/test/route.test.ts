import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  // 17:30 UTC on 9/11 is already 00:30 on 10/11 in Vietnam: the range must follow the Vietnam day.
  vi.setSystemTime(new Date("2026-11-09T17:30:00Z"));
  getServerSession.mockResolvedValue(session(["VIEW_BALANCE"]));
  getRevenueSeries.mockResolvedValue({ success: true, data: series });
});
afterEach(() => vi.useRealTimers());

describe("revenue stats route", () => {
  it("answers 401 without a session and 403 without VIEW_BALANCE", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(request("?preset=DAY_7"))).status).toBe(401);
    getServerSession.mockResolvedValue(session(["VIEW_ORDER"]));
    expect((await GET(request("?preset=DAY_7"))).status).toBe(403);
    expect(getRevenueSeries).not.toHaveBeenCalled();
  });

  it("rejects an unknown preset, a missing preset or a malformed Sub id", async () => {
    expect((await GET(request("?preset=WEEK"))).status).toBe(400);
    expect((await GET(request("?granularity=DAY"))).status).toBe(400);
    expect((await GET(request("?preset=DAY_7&subMerchantIds=S001"))).status).toBe(400);
    expect(getRevenueSeries).not.toHaveBeenCalled();
  });

  it.each([
    ["DAY_7", "2026-11-04", "2026-11-10"],
    ["DAY_15", "2026-10-27", "2026-11-10"],
    ["DAY_30", "2026-10-12", "2026-11-10"],
    ["THIS_MONTH", "2026-11-01", "2026-11-10"],
    ["LAST_MONTH", "2026-10-01", "2026-10-31"],
  ])("turns %s into %s..%s by day, on the Vietnam date", async (preset, from, to) => {
    expect((await GET(request(`?preset=${preset}`))).status).toBe(200);
    expect(getRevenueSeries).toHaveBeenLastCalledWith({ granularity: "DAY", from, to });
  });

  it("passes the Sub filter through", async () => {
    await GET(request(`?preset=DAY_7&subMerchantIds=${sub},${sub}`));
    expect(getRevenueSeries).toHaveBeenLastCalledWith({ granularity: "DAY", from: "2026-11-04", to: "2026-11-10", subMerchantIds: `${sub},${sub}` });
  });

  it("forwards the Vietnamese BE message", async () => {
    getRevenueSeries.mockResolvedValue({
      success: false,
      error: { status: 404, code: "RESOURCE_NOT_FOUND", message: "Không tìm thấy điểm bán" },
    });
    const response = await GET(request("?preset=DAY_7"));
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ message: "Không tìm thấy điểm bán" });
  });
});
