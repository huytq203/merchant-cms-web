import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listWithdrawals, createWithdrawal } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listWithdrawals: vi.fn(),
  createWithdrawal: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/withdrawals/withdrawal.service", () => ({
  listWithdrawals,
  createWithdrawal,
  getWithdrawal: vi.fn(),
}));
import { GET, POST } from "./route";

const merchantId = "22222222-2222-4222-8222-222222222222";
const foreignId = "44444444-4444-4444-8444-444444444444";
const bankAccountId = "55555555-5555-4555-8555-555555555555";
const body = { bankAccountId, amount: 250000, idempotencyKey: "key-1" };
const listRequest = (query = "") => new Request(`http://localhost/api/v1/admin/withdrawals${query}`);
const postRequest = (value: unknown) =>
  new Request("http://localhost/api/v1/admin/withdrawals", { method: "POST", body: JSON.stringify(value) });
const session = (permissions: string[]) => ({ merchantIds: [merchantId], subMerchantIds: [], permissions });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session(["VIEW_WITHDRAWAL", "CREATE_WITHDRAWAL"]));
  listWithdrawals.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
  createWithdrawal.mockResolvedValue({ success: true, data: { id: "x" } });
});

describe("withdrawals list route", () => {
  it("answers 401 without a session and 403 without VIEW_WITHDRAWAL, never calling the service", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(listRequest())).status).toBe(401);
    getServerSession.mockResolvedValue(session(["CREATE_WITHDRAWAL"]));
    expect((await GET(listRequest())).status).toBe(403);
    expect(listWithdrawals).not.toHaveBeenCalled();
  });

  it("rejects an oversized page and does not pass filters to the service", async () => {
    expect((await GET(listRequest("?pageSize=101"))).status).toBe(400);
    expect(listWithdrawals).not.toHaveBeenCalled();
    expect((await GET(listRequest("?status=PENDING&transactionCode=WD"))).status).toBe(200);
    expect(listWithdrawals).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
  });

  it("never forwards a merchantId from the client because BE scopes by session", async () => {
    expect((await GET(listRequest(`?merchantId=${foreignId}`))).status).toBe(200);
    expect(listWithdrawals).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
  });

  it("turns a BE 401 into 403 and never answers 2xx for a failure", async () => {
    listWithdrawals.mockResolvedValue({ success: false, error: { status: 401, code: "HTTP_401", message: "Hết hạn" } });
    expect((await GET(listRequest())).status).toBe(403);
    listWithdrawals.mockResolvedValue({ success: false, error: { status: 0, code: "NETWORK", message: "Mất kết nối" } });
    expect((await GET(listRequest())).status).toBe(502);
  });
});

describe("withdrawals create route", () => {
  it("answers 403 without CREATE_WITHDRAWAL and 400 for an invalid amount or missing key", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_WITHDRAWAL"]));
    expect((await POST(postRequest(body))).status).toBe(403);
    getServerSession.mockResolvedValue(session(["CREATE_WITHDRAWAL"]));
    expect((await POST(postRequest({ ...body, amount: 0 }))).status).toBe(400);
    expect((await POST(postRequest({ bankAccountId, amount: 5 }))).status).toBe(400);
    expect(createWithdrawal).not.toHaveBeenCalled();
  });

  it("forwards only the four contract fields and drops a merchantId or account number from the body", async () => {
    const response = await POST(postRequest({ ...body, reason: "Rút", merchantId: foreignId, bankAccountNumber: "9999", bankCode: "VCB" }));
    expect(response.status).toBe(201);
    expect(createWithdrawal).toHaveBeenCalledWith({ bankAccountId, amount: 250000, idempotencyKey: "key-1", reason: "Rút" });
  });

  it("validates the contract limits before calling the BE", async () => {
    const invalid = [
      { ...body, bankAccountId: "not-a-uuid" },
      { ...body, amount: 1.5 },
      { ...body, idempotencyKey: "k".repeat(101) },
      { ...body, reason: "r".repeat(501) },
    ];
    for (const value of invalid) expect((await POST(postRequest(value))).status).toBe(400);
    expect(createWithdrawal).not.toHaveBeenCalled();
  });

  it("keeps the 404 and the business code BE answers so the UI can explain them", async () => {
    createWithdrawal.mockResolvedValue({ success: false, error: { status: 404, code: "HTTP_404", message: "Không tìm thấy" } });
    expect((await POST(postRequest(body))).status).toBe(404);
    createWithdrawal.mockResolvedValue({
      success: false,
      error: { status: 400, code: "BUSINESS_ERROR", message: "Withdrawal bank account is on hold" },
    });
    const response = await POST(postRequest(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "BUSINESS_ERROR", message: "Withdrawal bank account is on hold" });
  });

  it("keeps the BE message so an amount above the balance is visible, and maps a BE 401 to 403", async () => {
    createWithdrawal.mockResolvedValue({
      success: false,
      error: { status: 400, code: "BUSINESS_ERROR", message: "Số dư không đủ" },
    });
    const response = await POST(postRequest(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ message: "Số dư không đủ" });
    createWithdrawal.mockResolvedValue({ success: false, error: { status: 401, code: "HTTP_401", message: "x" } });
    expect((await POST(postRequest(body))).status).toBe(403);
  });
});
