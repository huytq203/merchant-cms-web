import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getBankAccount, updateBankAccount, deleteBankAccount } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getBankAccount: vi.fn(),
  updateBankAccount: vi.fn(),
  deleteBankAccount: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/bank-accounts/bank-account.service", () => ({
  getBankAccount,
  updateBankAccount,
  deleteBankAccount,
}));
import { DELETE, GET, PUT } from "../route";

const id = "55555555-5555-4555-8555-555555555555";
const merchantId = "11111111-1111-4111-8111-111111111111";
const foreignMerchantId = "22222222-2222-4222-8222-222222222222";
const account = {
  id,
  version: 2,
  merchantId,
  bankCode: "VCB",
  accountNumber: "1234567890",
  accountName: "CONG TY A",
  accountStatus: "PENDING_VERIFICATION",
  assignedSubMerchants: [],
  isDefault: false,
};
const subMerchantId = "33333333-3333-4333-8333-333333333333";
const otp = { otpSessionId: "session-1", otp: "123456" };
const context = { params: Promise.resolve({ id }) };
const send = (method: string, body?: unknown) =>
  new Request(`http://localhost/api/v1/admin/bank-accounts/${id}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId], subMerchantIds: [], permissions: ["MANAGE_BANK_ACCOUNT"] });
  getBankAccount.mockResolvedValue({ success: true, data: account });
});

describe("bank account detail route", () => {
  it("answers 404 for an id that is not a UUID without touching BE", async () => {
    const bad = { params: Promise.resolve({ id: "..%2fusers" }) };
    expect((await GET(send("GET"), bad)).status).toBe(404);
    expect((await PUT(send("PUT", { version: 1 }), bad)).status).toBe(404);
    expect((await DELETE(send("DELETE"), bad)).status).toBe(404);
    expect(getBankAccount).not.toHaveBeenCalled();
  });

  it("hides an account of another Master and never writes to it", async () => {
    getBankAccount.mockResolvedValue({ success: true, data: { ...account, merchantId: foreignMerchantId } });
    expect((await GET(send("GET"), context)).status).toBe(404);
    expect((await PUT(send("PUT", { version: 2 }), context)).status).toBe(404);
    expect((await DELETE(send("DELETE"), context)).status).toBe(404);
    expect(updateBankAccount).not.toHaveBeenCalled();
    expect(deleteBankAccount).not.toHaveBeenCalled();
  });

  it("requires a complete OTP when the bank, number or holder changes", async () => {
    expect((await PUT(send("PUT", { version: 2, accountNumber: "9999999999" }), context)).status).toBe(400);
    expect((await PUT(send("PUT", { version: 2, accountNumber: "9999999999", otp: { otpSessionId: "s" } }), context)).status).toBe(400);
    expect(updateBankAccount).not.toHaveBeenCalled();
  });

  it("forwards a branch-only change without an OTP", async () => {
    updateBankAccount.mockResolvedValue({ success: true, data: { applied: true } });
    const response = await PUT(send("PUT", { version: 2, branchName: "Hai Phong" }), context);
    expect(response.status).toBe(200);
    expect(updateBankAccount).toHaveBeenCalledWith(id, { version: 2, branchName: "Hai Phong" });
  });

  it("forwards an identity change with the OTP", async () => {
    updateBankAccount.mockResolvedValue({ success: true, data: { account } });
    const response = await PUT(send("PUT", { version: 2, accountNumber: "9999999999", otp }), context);
    expect(updateBankAccount).toHaveBeenCalledWith(id, { version: 2, accountNumber: "9999999999", otp });
    expect(response.status).toBe(200);
  });

  // SRS v2: đổi danh sách Sub cũng phải có OTP; [] (gỡ hết) cũng là thay đổi.
  it("requires an OTP for a Sub list, forwards it with the OTP, and refuses a Sub outside the session", async () => {
    getServerSession.mockResolvedValue({ merchantIds: [merchantId], subMerchantIds: [subMerchantId], permissions: ["MANAGE_BANK_ACCOUNT"] });
    expect((await PUT(send("PUT", { version: 2, assignSubMerchantIds: [] }), context)).status).toBe(400);
    expect((await PUT(send("PUT", { version: 2, assignSubMerchantIds: ["44444444-4444-4444-8444-444444444444"], otp }), context)).status).toBe(403);
    expect(updateBankAccount).not.toHaveBeenCalled();
    updateBankAccount.mockResolvedValue({ success: true, data: { account } });
    expect((await PUT(send("PUT", { version: 2, assignSubMerchantIds: [subMerchantId, subMerchantId], otp }), context)).status).toBe(200);
    expect(updateBankAccount).toHaveBeenCalledWith(id, { version: 2, assignSubMerchantIds: [subMerchantId], otp });
  });

  it("drops the retired status/reason fields instead of forwarding them", async () => {
    updateBankAccount.mockResolvedValue({ success: true, data: { account } });
    await PUT(send("PUT", { version: 2, branchName: "A", status: "INACTIVE", reason: "x" }), context);
    expect(updateBankAccount).toHaveBeenCalledWith(id, { version: 2, branchName: "A" });
  });

  it("requires the version on update", async () => {
    expect((await PUT(send("PUT", { branchName: "A" }), context)).status).toBe(400);
  });

  it("keeps a stale-version conflict", async () => {
    updateBankAccount.mockResolvedValue({ success: false, error: { status: 409, code: "VERSION_CONFLICT", message: "Dữ liệu đã thay đổi" } });
    const response = await PUT(send("PUT", { version: 1, branchName: "A" }), context);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Dữ liệu đã thay đổi", code: "VERSION_CONFLICT" });
  });

  it("deletes an owned account with an optional reason", async () => {
    deleteBankAccount.mockResolvedValue({ success: true, data: undefined });
    expect((await DELETE(send("DELETE"), context)).status).toBe(204);
    expect(deleteBankAccount).toHaveBeenCalledWith(id, undefined);
    await DELETE(send("DELETE", { reason: "Không còn dùng" }), context);
    expect(deleteBankAccount).toHaveBeenLastCalledWith(id, "Không còn dùng");
  });
});
