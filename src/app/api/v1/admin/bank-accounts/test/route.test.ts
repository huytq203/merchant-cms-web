import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listBankAccounts, createBankAccount } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listBankAccounts: vi.fn(),
  createBankAccount: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/bank-accounts/bank-account.service", () => ({
  listBankAccounts,
  createBankAccount,
  getBankAccount: vi.fn(),
}));
import { GET, POST } from "../route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const foreignMerchantId = "22222222-2222-4222-8222-222222222222";
const subMerchantId = "33333333-3333-4333-8333-333333333333";
const session = { merchantIds: [merchantId], subMerchantIds: [subMerchantId], permissions: ["MANAGE_BANK_ACCOUNT"] };
const otp = { otpSessionId: "session-1", otp: "123456" };
const values = { bankCode: "VCB", accountNumber: "1234567890", accountName: "CONG TY A", branchName: "Ha Noi", otp };
const get = (query = "") => new Request(`http://localhost/api/v1/admin/bank-accounts${query}`);
const post = (body: unknown) =>
  new Request("http://localhost/api/v1/admin/bank-accounts", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session);
});

describe("bank account collection route", () => {
  it("answers 401 without a session and 403 without permission, never calling BE", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(get())).status).toBe(401);
    getServerSession.mockResolvedValue({ ...session, permissions: [] });
    expect((await GET(get())).status).toBe(403);
    expect((await POST(post(values))).status).toBe(403);
    expect(listBankAccounts).not.toHaveBeenCalled();
    expect(createBankAccount).not.toHaveBeenCalled();
  });

  it("lets read-only permissions list but never create", async () => {
    listBankAccounts.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
    for (const permission of ["VIEW_BANK_ACCOUNT", "CREATE_WITHDRAWAL"]) {
      getServerSession.mockResolvedValue({ ...session, permissions: [permission] });
      expect((await GET(get())).status).toBe(200);
      expect((await POST(post(values))).status).toBe(403);
    }
    expect(createBankAccount).not.toHaveBeenCalled();
  });

  it("no longer accepts MANAGE_SUB_MERCHANT alone", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["MANAGE_SUB_MERCHANT"] });
    expect((await GET(get())).status).toBe(403);
  });

  it("rejects page sizes above 100", async () => {
    expect((await GET(get("?pageSize=101"))).status).toBe(400);
    expect(listBankAccounts).not.toHaveBeenCalled();
  });

  it("always scopes the list to a Master of the session", async () => {
    listBankAccounts.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
    expect((await GET(get("?linkStatus=LINKED"))).status).toBe(200);
    expect(listBankAccounts).toHaveBeenCalledWith({ page: 1, pageSize: 10, linkStatus: "LINKED", merchantId });
    expect((await GET(get(`?merchantId=${foreignMerchantId}`))).status).toBe(403);
    expect(listBankAccounts).toHaveBeenCalledTimes(1);
  });

  it("rejects a branch outside the session scope", async () => {
    const foreignBranch = "44444444-4444-4444-8444-444444444444";
    expect((await GET(get(`?subMerchantId=${foreignBranch}`))).status).toBe(403);
    expect((await POST(post({ ...values, subMerchantId: foreignBranch }))).status).toBe(403);
    expect(listBankAccounts).not.toHaveBeenCalled();
    expect(createBankAccount).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", undefined],
    ["without the code", { otpSessionId: "session-1" }],
    ["without the session", { otp: "123456" }],
    ["with a short code", { otpSessionId: "session-1", otp: "123" }],
    ["with a blank session", { otpSessionId: " ", otp: "123456" }],
  ])("returns 400 before BE when the OTP is %s", async (_label, badOtp) => {
    expect((await POST(post({ ...values, otp: badOtp }))).status).toBe(400);
    expect(createBankAccount).not.toHaveBeenCalled();
  });

  it("rejects an invalid account number", async () => {
    expect((await POST(post({ ...values, accountNumber: "12ab56" }))).status).toBe(400);
    expect(createBankAccount).not.toHaveBeenCalled();
  });

  it("takes the Master from the session, ignoring nothing the user may not choose", async () => {
    createBankAccount.mockResolvedValue({ success: true, data: { applied: true } });
    const response = await POST(post({ ...values, isDefault: true }));
    expect(response.status).toBe(201);
    expect(createBankAccount).toHaveBeenCalledWith({ ...values, isDefault: true, merchantId });
  });

  it("rejects a foreign Master in the body", async () => {
    expect((await POST(post({ ...values, merchantId: foreignMerchantId }))).status).toBe(403);
    expect(createBankAccount).not.toHaveBeenCalled();
  });

  it("keeps BE status and code so the UI can tell a wrong OTP", async () => {
    createBankAccount.mockResolvedValue({
      success: false,
      error: { status: 400, code: "MERCHANT_SENSITIVE_OTP_INVALID", message: "Mã không đúng" },
    });
    const response = await POST(post(values));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Mã không đúng", code: "MERCHANT_SENSITIVE_OTP_INVALID" });
  });

  it("does not turn a BE 401 into a logout", async () => {
    listBankAccounts.mockResolvedValue({ success: false, error: { status: 401, code: "HTTP_401", message: "x" } });
    expect((await GET(get())).status).toBe(403);
  });
});
