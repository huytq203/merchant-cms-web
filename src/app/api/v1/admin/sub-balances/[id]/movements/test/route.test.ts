import { beforeEach, describe, expect, it, vi } from "vitest";
import { SUB_ID } from "@/features/sub-balances/test/movement-fixtures";

const { getServerSession, listSubBalanceMovements } = vi.hoisted(() => ({ getServerSession: vi.fn(), listSubBalanceMovements: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/sub-balances/sub-balance.service", () => ({ listSubBalanceMovements }));
import { GET } from "../route";

const get = (query = "", id = SUB_ID) =>
  GET(new Request(`http://localhost/api/v1/admin/sub-balances/${id}/movements${query}`), { params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: ["VIEW_BALANCE"], merchantIds: ["m"] });
  listSubBalanceMovements.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
});

describe("sub balance movements list route", () => {
  it("returns 401 without a session and 403 without VIEW_BALANCE, never touching the BE", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
    getServerSession.mockResolvedValue({ permissions: [], merchantIds: ["m"] });
    expect((await get()).status).toBe(403);
    expect(listSubBalanceMovements).not.toHaveBeenCalled();
  });

  it("answers 404 for an id that is not a UUID", async () => {
    expect((await get("", "..%2fx")).status).toBe(404);
    expect(listSubBalanceMovements).not.toHaveBeenCalled();
  });

  it("defaults to ALL, first page of 20", async () => {
    await get();
    expect(listSubBalanceMovements).toHaveBeenCalledWith(SUB_ID, { type: "ALL", page: 1, size: 20 });
  });

  it("forwards type, dates and paging", async () => {
    await get("?type=REFUND&fromDate=2026-11-01&toDate=2026-11-10&page=2&size=50");
    expect(listSubBalanceMovements).toHaveBeenCalledWith(SUB_ID, { type: "REFUND", fromDate: "2026-11-01", toDate: "2026-11-10", page: 2, size: 50 });
  });

  it("rejects bad parameters with 400 and a Vietnamese message", async () => {
    // ESCROW: the "Ký quỹ" chip is gone (10/11/2026); escrow returns are listed under "Tất cả".
    for (const q of ["?type=OTHER", "?type=ESCROW", "?fromDate=10/11/2026", "?size=101", "?page=-1"]) {
      const response = await get(q);
      expect(response.status).toBe(400);
      expect((await response.json()).message).toMatch(/không hợp lệ|tối đa/);
    }
    expect(listSubBalanceMovements).not.toHaveBeenCalled();
  });

  it("returns rows and total; a BE outage is a 502 with a Vietnamese message (the repo maps 5xx to 502)", async () => {
    listSubBalanceMovements.mockResolvedValue({ success: true, data: { rows: [{ id: "x" }], total: 1 } });
    expect(await (await get()).json()).toEqual({ rows: [{ id: "x" }], total: 1 });
    listSubBalanceMovements.mockResolvedValue({ success: false, error: { status: 503, code: "X", message: "x" } });
    const failed = await get();
    expect(failed.status).toBe(502);
    expect((await failed.json()).message).toContain("sổ cái");
  });
});
