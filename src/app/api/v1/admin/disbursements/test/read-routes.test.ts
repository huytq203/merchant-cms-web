import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, searchDisbursements, getDisbursementOrder, exportDisbursements, listDisbursementBatches } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  searchDisbursements: vi.fn(),
  getDisbursementOrder: vi.fn(),
  exportDisbursements: vi.fn(),
  listDisbursementBatches: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/disbursements/disbursement.service", () => ({
  searchDisbursements,
  getDisbursementOrder,
  exportDisbursements,
  listDisbursementBatches,
}));
import { POST as searchRoute } from "../search/route";
import { GET as orderRoute } from "../orders/[id]/route";
import { POST as exportRoute } from "../export/route";
import { GET as batchesRoute } from "../batches/route";

const SUB = "11111111-1111-4111-8111-111111111111";
const OTHER_SUB = "22222222-2222-4222-8222-222222222222";
const ORDER = "66666666-6666-4666-8666-666666666666";
const session = { merchantIds: ["m"], subMerchantIds: [], permissions: ["VIEW_DISBURSEMENT", "EXPORT_DISBURSEMENT"] };
const post = (path: string, body: unknown) => new Request(`http://localhost/api/v1/admin/disbursements/${path}`, { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session);
});

describe("POST /disbursements/search", () => {
  it("is refused without VIEW_DISBURSEMENT and never reaches BE", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["EXPORT_DISBURSEMENT"] });
    expect((await searchRoute(post("search", {}))).status).toBe(403);
    expect(searchDisbursements).not.toHaveBeenCalled();
  });

  it("forwards the filter and returns the page", async () => {
    searchDisbursements.mockResolvedValue({ success: true, data: { items: [], total: 0, page: 0, size: 10 } });
    const response = await searchRoute(post("search", { subIds: [SUB], filter: { code: "P1" }, page: 0, size: 10 }));
    expect(response.status).toBe(200);
    expect(searchDisbursements).toHaveBeenCalledWith({ subIds: [SUB], filter: { code: "P1" }, page: 0, size: 10 });
  });

  it("subFilterLimitedToUserScope: a Sub the session is not assigned to is refused before BE", async () => {
    getServerSession.mockResolvedValue({ ...session, subMerchantIds: [SUB] });
    expect((await searchRoute(post("search", { subIds: [SUB, OTHER_SUB] }))).status).toBe(403);
    expect(searchDisbursements).not.toHaveBeenCalled();
    searchDisbursements.mockResolvedValue({ success: true, data: { items: [], total: 0, page: 0, size: 10 } });
    expect((await searchRoute(post("search", { subIds: [SUB] }))).status).toBe(200);
  });

  it("rejects a malformed body with 400", async () => {
    expect((await searchRoute(post("search", { filter: { statuses: ["NOPE"] } }))).status).toBe(400);
    expect((await searchRoute(new Request("http://localhost/x", { method: "POST", body: "not json" }))).status).toBe(400);
    expect(searchDisbursements).not.toHaveBeenCalled();
  });

  it("error503ShowsRetryMessage: keeps the 503 and the Vietnamese retry sentence of BE (6323)", async () => {
    searchDisbursements.mockResolvedValue({
      success: false,
      error: { status: 503, code: "MERCHANT_DISBURSEMENT_UNAVAILABLE", message: "Chưa đọc được dữ liệu chi hộ từ hệ thống chi, vui lòng thử lại sau ít phút" },
    });
    const response = await searchRoute(post("search", {}));
    expect(response.status).toBe(503);
    expect((await response.json()).message).toMatch(/thử lại/);
  });

  it("turns a timeout or lost connection into the same 503 retry message instead of a generic 502", async () => {
    searchDisbursements.mockResolvedValue({ success: false, error: { status: 0, code: "TIMEOUT", message: "Hệ thống phản hồi quá lâu" } });
    const response = await searchRoute(post("search", {}));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "6323", message: expect.stringMatching(/thử lại sau ít phút/) });
  });
});

describe("GET /disbursements/orders/[id]", () => {
  const call = (id: string) => orderRoute(new Request("http://localhost/x"), { params: Promise.resolve({ id }) });

  it("answers 404 for an id that is not a UUID without calling BE", async () => {
    expect((await call("..%2fx")).status).toBe(404);
    expect(getDisbursementOrder).not.toHaveBeenCalled();
  });

  it("foreignOrder404: passes BE 404 for an order of a Sub outside the session scope", async () => {
    getDisbursementOrder.mockResolvedValue({ success: false, error: { status: 404, code: "NOT_FOUND", message: "Không tìm thấy lệnh chi hộ" } });
    const response = await call(ORDER);
    expect(response.status).toBe(404);
    expect((await response.json()).message).toBe("Không tìm thấy lệnh chi hộ");
  });

  it("returns the detail", async () => {
    getDisbursementOrder.mockResolvedValue({ success: true, data: { operationId: ORDER } });
    expect((await (await call(ORDER)).json()).operationId).toBe(ORDER);
  });
});

describe("POST /disbursements/export", () => {
  it("exportButtonHiddenWithoutExportPermission: refuses a viewer who lacks EXPORT_DISBURSEMENT", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["VIEW_DISBURSEMENT"] });
    expect((await exportRoute(post("export", {}))).status).toBe(403);
    expect(exportDisbursements).not.toHaveBeenCalled();
  });

  it("relays the CSV bytes (BOM included) with BE's file name and no caching", async () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x4d]).buffer;
    exportDisbursements.mockResolvedValue({
      success: true,
      data: { body: bytes, contentType: "text/csv; charset=UTF-8", contentDisposition: 'attachment; filename="chi-ho.csv"' },
    });
    const response = await exportRoute(post("export", { filter: { statuses: ["SUCCEEDED"] } }));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="chi-ho.csv"');
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(new Uint8Array(await response.arrayBuffer())[0]).toBe(0xef);
    expect(exportDisbursements).toHaveBeenCalledWith({ filter: { statuses: ["SUCCEEDED"] } });
  });

  it.each([
    ['attachment; filename="chi-ho 2026.csv"', "chi-ho.csv"],
    ['attachment; filename="../../etc/passwd"', "chi-ho.csv"],
    ['attachment; filename="a\r\nSet-Cookie: x=1.csv"', "chi-ho.csv"],
    ['attachment; filename="chi-ho_2026-11-18.csv"', "chi-ho_2026-11-18.csv"],
    [null, "chi-ho.csv"],
  ])("never trusts the file name BE sent (%s)", async (disposition, expected) => {
    exportDisbursements.mockResolvedValue({ success: true, data: { body: new ArrayBuffer(1), contentType: "text/csv", contentDisposition: disposition } });
    const response = await exportRoute(post("export", {}));
    expect(response.headers.get("content-disposition")).toBe(`attachment; filename="${expected}"`);
  });

  it("applies the same Sub scope rule as the list", async () => {
    getServerSession.mockResolvedValue({ ...session, subMerchantIds: [SUB] });
    expect((await exportRoute(post("export", { subIds: [OTHER_SUB] }))).status).toBe(403);
    expect(exportDisbursements).not.toHaveBeenCalled();
  });
});

describe("GET /disbursements/batches", () => {
  const call = (query: string) => batchesRoute(new Request(`http://localhost/api/v1/admin/disbursements/batches${query}`));

  it("maps the 1-based page of the UI to the 0-based page of BE", async () => {
    listDisbursementBatches.mockResolvedValue({ success: true, data: { items: [], total: 0, page: 2, size: 10 } });
    expect((await call(`?page=3&pageSize=10&subId=${SUB}&status=SUBMITTING`)).status).toBe(200);
    expect(listDisbursementBatches).toHaveBeenCalledWith({ page: 2, size: 10, subId: SUB, status: "SUBMITTING" });
  });

  it("rejects a bad Sub id or status before BE, and a Sub outside the session scope", async () => {
    expect((await call("?subId=nope")).status).toBe(400);
    expect((await call("?status=HACKED")).status).toBe(400);
    getServerSession.mockResolvedValue({ ...session, subMerchantIds: [SUB] });
    expect((await call(`?subId=${OTHER_SUB}`)).status).toBe(403);
    expect(listDisbursementBatches).not.toHaveBeenCalled();
  });
});
