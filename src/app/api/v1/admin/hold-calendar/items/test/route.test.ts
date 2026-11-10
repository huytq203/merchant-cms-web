import { beforeEach, describe, expect, it, vi } from "vitest";
import { holdItemFixture, subId } from "@/features/hold-calendar/test/fixtures";

const { getServerSession, listHoldItems } = vi.hoisted(() => ({ getServerSession: vi.fn(), listHoldItems: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/hold-calendar/hold-calendar.service", () => ({ listHoldItems }));
import { GET } from "../route";

const request = (query: string) => new Request(`http://localhost/api/v1/admin/hold-calendar/items${query}`);

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: ["VIEW_HOLD"], merchantIds: ["m"], subMerchantIds: [] });
  listHoldItems.mockResolvedValue({ success: true, data: { rows: [holdItemFixture], total: 1 } });
});

describe("hold items route", () => {
  it("denies access without VIEW_HOLD before calling the BE", async () => {
    getServerSession.mockResolvedValue({ permissions: ["VIEW_BALANCE"], merchantIds: ["m"], subMerchantIds: [] });
    expect((await GET(request(""))).status).toBe(403);
    expect(listHoldItems).not.toHaveBeenCalled();
  });

  it("lists the holding items of every Sub by default", async () => {
    const response = await GET(request(""));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ rows: [holdItemFixture], total: 1 });
    expect(listHoldItems).toHaveBeenCalledWith({ state: "HOLDING", page: 1, pageSize: 10 });
  });

  it("passes a Sub, a state and a range on", async () => {
    await GET(request(`?subMerchantId=${subId}&state=ALL&from=2026-10-07&to=2026-10-13&page=2&pageSize=50`));
    expect(listHoldItems).toHaveBeenCalledWith({ subMerchantId: subId, state: "ALL", from: "2026-10-07", to: "2026-10-13", page: 2, pageSize: 50 });
  });

  it("rejects an unknown state or a reversed range", async () => {
    expect((await GET(request("?state=LOST"))).status).toBe(400);
    expect((await GET(request("?from=2026-10-13&to=2026-10-07"))).status).toBe(400);
    expect(listHoldItems).not.toHaveBeenCalled();
  });
});
