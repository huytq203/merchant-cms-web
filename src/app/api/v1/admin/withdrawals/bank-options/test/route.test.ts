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
const makeAccount = (overrides: Record<string, unknown>) => ({
  id: "55555555-5555-4555-8555-555555555555",
  merchantId,
  subMerchantId: null,
  bankCode: "VCB",
  accountNumber: "******1789",
  accountName: "CONG TY A",
  status: "ACTIVE",
  linkStatus: "LINKED",
  isDefault: true,
  payable: true,
  ...overrides,
});
const call = (query = "") => GET(new Request(`http://localhost/api/v1/admin/withdrawals/bank-options${query}`));

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({
    merchantIds: [merchantId],
    subMerchantIds: [subMerchantId],
    permissions: ["CREATE_WITHDRAWAL"],
  });
  listBankAccounts.mockResolvedValue({ success: true, data: { rows: [makeAccount({})], total: 1 } });
});

describe("withdrawal bank options route", () => {
  it("needs CREATE_WITHDRAWAL and never reads bank accounts without it", async () => {
    getServerSession.mockResolvedValue({ merchantIds: [merchantId], subMerchantIds: [], permissions: ["VIEW_WITHDRAWAL"] });
    expect((await call()).status).toBe(403);
    getServerSession.mockResolvedValue(null);
    expect((await call()).status).toBe(401);
    expect(listBankAccounts).not.toHaveBeenCalled();
  });

  it("returns only payable linked accounts of the session merchant with the BE masked number unchanged", async () => {
    listBankAccounts.mockResolvedValue({
      success: true,
      data: {
        rows: [
          makeAccount({}),
          makeAccount({ id: "66666666-6666-4666-8666-666666666666", linkStatus: "PENDING_VERIFICATION" }),
          makeAccount({ id: "77777777-7777-4777-8777-777777777777", payable: false }),
          makeAccount({ id: "88888888-8888-4888-8888-888888888888", status: "INACTIVE" }),
          makeAccount({ id: "99999999-9999-4999-8999-999999999999", merchantId: foreignId }),
        ],
        total: 5,
      },
    });
    const payload = await (await call()).json();
    expect(payload).toEqual({
      options: [
        {
          id: "55555555-5555-4555-8555-555555555555",
          bankCode: "VCB",
          accountNumberMasked: "******1789",
          accountName: "CONG TY A",
          isDefault: true,
          subMerchantId: null,
        },
      ],
      hasHiddenSubMerchantAccounts: false,
    });
    expect(listBankAccounts).toHaveBeenCalledWith(expect.objectContaining({ merchantId, linkStatus: "LINKED" }));
  });

  it("lists only Master level accounts and flags that sub-merchant ones were left out", async () => {
    listBankAccounts.mockResolvedValue({
      success: true,
      data: {
        rows: [
          makeAccount({ level: "MASTER" }),
          makeAccount({ id: "66666666-6666-4666-8666-666666666666", level: "SUB", subMerchantId }),
          makeAccount({ id: "77777777-7777-4777-8777-777777777777", level: "TERMINAL", subMerchantId }),
        ],
        total: 3,
      },
    });
    const payload = await (await call()).json();
    expect(payload.options.map((option: { id: string }) => option.id)).toEqual(["55555555-5555-4555-8555-555555555555"]);
    expect(payload.hasHiddenSubMerchantAccounts).toBe(true);
  });

  it("refuses a sub-merchant outside the session scope and passes one inside it", async () => {
    expect((await call(`?subMerchantId=${foreignId}`)).status).toBe(403);
    expect(listBankAccounts).not.toHaveBeenCalled();
    expect((await call(`?subMerchantId=${subMerchantId}`)).status).toBe(200);
    expect(listBankAccounts).toHaveBeenCalledWith(expect.objectContaining({ subMerchantId }));
  });

  it("maps a BE 401 to 403", async () => {
    listBankAccounts.mockResolvedValue({ success: false, error: { status: 401, code: "HTTP_401", message: "x" } });
    expect((await call()).status).toBe(403);
  });
});
