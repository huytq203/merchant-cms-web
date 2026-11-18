import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listBankAccounts } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listBankAccounts: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/bank-accounts/bank-account.service", () => ({ listBankAccounts }));
import { GET } from "../route";

const merchantId = "22222222-2222-4222-8222-222222222222";
const foreignId = "44444444-4444-4444-8444-444444444444";
const subMerchantId = "11111111-1111-4111-8111-111111111111";
const otherSubId = "33333333-3333-4333-8333-333333333333";
const makeAccount = (overrides: Record<string, unknown> = {}) => ({
  id: "55555555-5555-4555-8555-555555555555",
  merchantId,
  bankCode: "VCB",
  accountNumber: "******1789",
  accountName: "CONG TY A",
  accountStatus: "PENDING_VERIFICATION",
  isDefault: true,
  payable: true,
  assignedSubMerchants: [{ id: subMerchantId, code: "SUB1", name: "Cửa hàng A" }, { id: otherSubId, code: "SUB2", name: "B" }],
  ...overrides,
});
const call = (query = `?subMerchantId=${subMerchantId}`) =>
  GET(new Request(`http://localhost/api/v1/admin/withdrawals/receiving-account${query}`));

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId], subMerchantIds: [subMerchantId], permissions: ["CREATE_WITHDRAWAL"] });
  listBankAccounts.mockResolvedValue({ success: true, data: { rows: [makeAccount()], total: 1 } });
});

describe("withdrawal receiving account route (SRS v2: one account per Sub)", () => {
  it("needs CREATE_WITHDRAWAL and never reads bank accounts without it", async () => {
    getServerSession.mockResolvedValue({ merchantIds: [merchantId], subMerchantIds: [], permissions: ["VIEW_WITHDRAWAL"] });
    expect((await call()).status).toBe(403);
    getServerSession.mockResolvedValue(null);
    expect((await call()).status).toBe(401);
    expect(listBankAccounts).not.toHaveBeenCalled();
  });

  it("needs a valid Sub", async () => {
    expect((await call("")).status).toBe(400);
    expect((await call("?subMerchantId=abc")).status).toBe(400);
    expect(listBankAccounts).not.toHaveBeenCalled();
  });

  it("returns the account assigned to the Sub, shared or pending, with the BE masked number unchanged", async () => {
    const payload = await (await call()).json();
    expect(payload).toEqual({
      account: {
        id: "55555555-5555-4555-8555-555555555555",
        bankCode: "VCB",
        accountNumberMasked: "******1789",
        accountName: "CONG TY A",
        accountStatus: "PENDING_VERIFICATION",
      },
    });
    expect(listBankAccounts).toHaveBeenCalledWith({ page: 1, pageSize: 10, subMerchantIds: [subMerchantId] });
  });

  it("still returns a locked account so the screen can say so (BE refuses the payout with 5738)", async () => {
    listBankAccounts.mockResolvedValue({ success: true, data: { rows: [makeAccount({ accountStatus: "LOCKED", payable: false })], total: 1 } });
    expect((await (await call()).json()).account).toMatchObject({ accountStatus: "LOCKED" });
  });

  it("answers null for a Sub with no account, and ignores rows not assigned to it", async () => {
    listBankAccounts.mockResolvedValue({
      success: true,
      data: {
        rows: [makeAccount({ id: "66666666-6666-4666-8666-666666666666", assignedSubMerchants: [{ id: otherSubId, code: "SUB2", name: "B" }] })],
        total: 1,
      },
    });
    expect(await (await call()).json()).toEqual({ account: null });
  });

  it("finds the account of a Sub of the second Master of the session (BE scopes the list, not the first Master)", async () => {
    getServerSession.mockResolvedValue({ merchantIds: [foreignId, merchantId], subMerchantIds: [subMerchantId], permissions: ["CREATE_WITHDRAWAL"] });
    expect((await (await call()).json()).account).toMatchObject({ id: "55555555-5555-4555-8555-555555555555" });
  });

  it("serves a session limited to Subs, which has no Master of its own", async () => {
    getServerSession.mockResolvedValue({ merchantIds: [], subMerchantIds: [subMerchantId], permissions: ["CREATE_WITHDRAWAL"] });
    expect((await (await call()).json()).account).toMatchObject({ id: "55555555-5555-4555-8555-555555555555" });
  });

  it("refuses a sub-merchant outside the session scope", async () => {
    expect((await call(`?subMerchantId=${foreignId}`)).status).toBe(403);
    expect(listBankAccounts).not.toHaveBeenCalled();
  });

  it("maps a BE 401 to 403", async () => {
    listBankAccounts.mockResolvedValue({ success: false, error: { status: 401, code: "HTTP_401", message: "x" } });
    expect((await call()).status).toBe(403);
  });
});
