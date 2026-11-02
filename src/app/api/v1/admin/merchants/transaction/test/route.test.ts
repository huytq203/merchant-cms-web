import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listTransactions } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listTransactions: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/transactions/transaction.service", () => ({ listTransactions }));
import { GET } from "../route";

const merchantId = "22222222-2222-4222-8222-222222222222";
const request = (query = "") => new Request(`http://localhost/api/v1/admin/merchants/transaction${query}`);
const session = (permissions: string[]) => ({ merchantIds: [merchantId], subMerchantIds: [], permissions });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session(["VIEW_TRANSACTION"]));
  listTransactions.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
});

describe("transactions route", () => {
  it("answers 401 without a session and 403 without VIEW_TRANSACTION, never calling the service", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(401);
    getServerSession.mockResolvedValue(session(["VIEW_REFUND"]));
    expect((await GET(request())).status).toBe(403);
    expect(listTransactions).not.toHaveBeenCalled();
  });

  it("rejects an oversized page, an unknown status and a reversed time range", async () => {
    expect((await GET(request("?pageSize=101"))).status).toBe(400);
    expect((await GET(request("?status=PAID"))).status).toBe(400);
    expect((await GET(request("?subMerchantId=SM001"))).status).toBe(400);
    const reversed = "?createdFrom=2026-10-05&createdTo=2026-10-01";
    expect((await GET(request(reversed))).status).toBe(400);
    expect(listTransactions).not.toHaveBeenCalled();
  });

  it("passes only the filter to the service: the BE scopes by the session", async () => {
    const response = await GET(request("?page=2&pageSize=20&status=FAILED&keyword=TRX&paymentMethod=QR&createdFrom=2026-11-01"));
    expect(response.status).toBe(200);
    expect(listTransactions).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
      status: "FAILED",
      keyword: "TRX",
      paymentMethod: "QR",
      createdFrom: "2026-11-01",
    });
  });

  it("lets a user assigned to Sub-merchants only (no Master) read the list", async () => {
    getServerSession.mockResolvedValue({ ...session(["VIEW_TRANSACTION"]), merchantIds: [] });
    expect((await GET(request())).status).toBe(200);
    expect(listTransactions).toHaveBeenCalled();
  });

  it("forwards the Vietnamese BE validation message and turns a BE 401 into 403", async () => {
    listTransactions.mockResolvedValue({
      success: false,
      error: { status: 400, code: "VALIDATION_ERROR", message: "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" },
    });
    const invalid = await GET(request());
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ message: "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" });
    listTransactions.mockResolvedValue({
      success: false,
      error: { status: 401, code: "UNAUTHORIZED", message: "x" },
    });
    expect((await GET(request())).status).toBe(403);
    listTransactions.mockResolvedValue({ success: false, error: { status: 0, code: "NETWORK", message: "x" } });
    expect((await GET(request())).status).toBe(502);
  });
});
