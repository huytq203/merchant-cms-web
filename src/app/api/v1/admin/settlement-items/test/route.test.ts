import { beforeEach, describe, expect, it, vi } from "vitest";
import { rowFixture, subId, totalsFixture } from "@/features/settlement-items/test/fixtures";

const { getServerSession, listSettlementItems, getSettlementTotals } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listSettlementItems: vi.fn(),
  getSettlementTotals: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/settlement-items/settlement-item.service", () => ({ listSettlementItems, getSettlementTotals }));
import { GET } from "../route";

const valid = `?subMerchantIds=${subId}&paidFrom=2026-10-08&paidTo=2026-10-14&page=2&pageSize=20`;
const request = (query: string) => new Request(`http://localhost/api/v1/admin/settlement-items${query}`);

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: ["VIEW_BALANCE"], merchantIds: ["m"], subMerchantIds: [] });
  listSettlementItems.mockResolvedValue({ success: true, data: { rows: [rowFixture], total: 41 } });
  getSettlementTotals.mockResolvedValue({ success: true, data: totalsFixture });
});

describe("settlement items route", () => {
  it("denies access without VIEW_BALANCE before calling the BE", async () => {
    getServerSession.mockResolvedValue({ permissions: ["VIEW_ORDER"], merchantIds: ["m"], subMerchantIds: [] });
    expect((await GET(request(valid))).status).toBe(403);
    expect(listSettlementItems).not.toHaveBeenCalled();
  });

  it("requires a complete, ordered date range", async () => {
    expect((await GET(request(`?subMerchantId=${subId}&paidFrom=2026-10-08`))).status).toBe(400);
    expect((await GET(request(`?subMerchantId=${subId}&paidFrom=2026-10-14&paidTo=2026-10-08`))).status).toBe(400);
    expect(listSettlementItems).not.toHaveBeenCalled();
  });

  it("returns the page and the totals of the same range", async () => {
    const response = await GET(request(valid));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ rows: [rowFixture], total: 41, totals: totalsFixture });
    const filter = { subMerchantIds: [subId], paidFrom: "2026-10-08", paidTo: "2026-10-14", page: 2, pageSize: 20 };
    expect(listSettlementItems).toHaveBeenCalledWith(filter);
    expect(getSettlementTotals).toHaveBeenCalledWith(filter);
  });

  it("passes a BE failure through without the raw error", async () => {
    getSettlementTotals.mockResolvedValue({ success: false, error: { status: 404, code: "RESOURCE_NOT_FOUND", message: "SubMerchant không tìm thấy" } });
    const response = await GET(request(valid));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "SubMerchant không tìm thấy" });
  });

  // Mục 11: không chọn Sub = mọi Sub trong phạm vi phiên; Terminal và nhóm trạng thái đợt đi tiếp xuống service.
  it("lists every Sub in scope when no Sub is given and passes the Terminal and tranche group on", async () => {
    const terminalId = "22222222-2222-4222-8222-222222222222";
    const response = await GET(request(`?paidFrom=2026-10-08&paidTo=2026-10-14&terminalId=${terminalId}&trancheStatus=IN_WITHDRAWAL&page=1&pageSize=20`));
    expect(response.status).toBe(200);
    expect(listSettlementItems).toHaveBeenCalledWith({ paidFrom: "2026-10-08", paidTo: "2026-10-14", terminalId, trancheStatus: "IN_WITHDRAWAL", page: 1, pageSize: 20 });
  });

  it("rejects an unknown tranche group or a malformed Terminal", async () => {
    expect((await GET(request("?paidFrom=2026-10-08&paidTo=2026-10-14&trancheStatus=LOST"))).status).toBe(400);
    expect((await GET(request("?paidFrom=2026-10-08&paidTo=2026-10-14&terminalId=abc"))).status).toBe(400);
    expect(listSettlementItems).not.toHaveBeenCalled();
  });
});
