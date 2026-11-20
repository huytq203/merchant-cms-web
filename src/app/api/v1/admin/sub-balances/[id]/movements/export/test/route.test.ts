import { beforeEach, describe, expect, it, vi } from "vitest";
import { SUB_ID } from "@/features/sub-balances/test/movement-fixtures";

const { getServerSession, exportSubBalanceMovements } = vi.hoisted(() => ({ getServerSession: vi.fn(), exportSubBalanceMovements: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/sub-balances/sub-balance.service", () => ({ exportSubBalanceMovements }));
import { GET } from "../route";

const get = (query = "", id = SUB_ID) =>
  GET(new Request(`http://localhost/api/v1/admin/sub-balances/${id}/movements/export${query}`), { params: Promise.resolve({ id }) });

const csvBody = new TextEncoder().encode("﻿Thời gian\r\n").buffer;

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: ["VIEW_BALANCE", "EXPORT_BALANCE"], merchantIds: ["m"] });
  exportSubBalanceMovements.mockResolvedValue({
    success: true,
    data: { body: csvBody, contentType: "text/csv;charset=UTF-8", contentDisposition: 'attachment; filename="bien-dong-so-du-SUB001-202611191200.csv"' },
  });
});

describe("sub balance movements export route", () => {
  it("needs a session and EXPORT_BALANCE (VIEW_BALANCE alone is 403), never touching the BE", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
    getServerSession.mockResolvedValue({ permissions: ["VIEW_BALANCE"], merchantIds: ["m"] });
    expect((await get()).status).toBe(403);
    expect(exportSubBalanceMovements).not.toHaveBeenCalled();
  });

  it("answers 404 for an id that is not a UUID", async () => {
    expect((await get("", "..%2fx")).status).toBe(404);
    expect(exportSubBalanceMovements).not.toHaveBeenCalled();
  });

  it("exportRouteStreamsCsvWithBackendHeaders: passes bytes, Content-Type and Content-Disposition through unchanged", async () => {
    const response = await get("?fromDate=2026-11-01&toDate=2026-11-10");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv;charset=UTF-8");
    expect(response.headers.get("content-disposition")).toContain("bien-dong-so-du-SUB001-202611191200.csv");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array(csvBody));
  });

  it("lọc tên file BE gửi: tên lạ (đường dẫn, '..') thì dùng tên mặc định", async () => {
    exportSubBalanceMovements.mockResolvedValue({
      success: true,
      data: { body: csvBody, contentType: "text/csv;charset=UTF-8", contentDisposition: 'attachment; filename="../../etc/x.csv"' },
    });
    const response = await get("?fromDate=2026-11-01&toDate=2026-11-10");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="bien-dong-so-du.csv"');
  });

  it("exportRoutePassesFilters", async () => {
    await get("?pocket=OTHER&type=DISBURSEMENT&fromDate=2026-11-01&toDate=2026-11-10");
    expect(exportSubBalanceMovements).toHaveBeenCalledWith(SUB_ID, { type: "DISBURSEMENT", pocket: "OTHER", fromDate: "2026-11-01", toDate: "2026-11-10" });
    await get("?fromDate=2026-11-01&toDate=2026-11-10");
    expect(exportSubBalanceMovements).toHaveBeenLastCalledWith(SUB_ID, { type: "ALL", fromDate: "2026-11-01", toDate: "2026-11-10" });
  });

  it("rejects a malformed date or pocket with 400 and a Vietnamese message", async () => {
    for (const q of ["?fromDate=01/11/2026", "?pocket=ALL"]) {
      const response = await get(q);
      expect(response.status).toBe(400);
      expect((await response.json()).message).toMatch(/không hợp lệ/);
    }
    expect(exportSubBalanceMovements).not.toHaveBeenCalled();
  });

  it("exportBackendErrorKeepsVietnameseMessage: 6334 keeps its status, code and sentence", async () => {
    exportSubBalanceMovements.mockResolvedValue({ success: false, error: { status: 400, code: "6334", message: "Kết quả vượt 10.000 dòng, vui lòng thu hẹp khoảng thời gian" } });
    const response = await get("?fromDate=2026-11-01&toDate=2026-11-10");
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Kết quả vượt 10.000 dòng, vui lòng thu hẹp khoảng thời gian", code: "6334" });
    exportSubBalanceMovements.mockResolvedValue({ success: false, error: { status: 400, code: "VALIDATION_ERROR", message: "Khoảng thời gian xuất tối đa 93 ngày" } });
    expect((await (await get("?fromDate=2026-01-01&toDate=2026-11-10")).json()).message).toBe("Khoảng thời gian xuất tối đa 93 ngày");
  });
});
