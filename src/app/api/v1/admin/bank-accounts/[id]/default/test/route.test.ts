import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getBankAccount, setDefaultBankAccount } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getBankAccount: vi.fn(),
  setDefaultBankAccount: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/bank-accounts/bank-account.service", () => ({ getBankAccount, setDefaultBankAccount }));
import { PUT } from "../route";

const id = "55555555-5555-4555-8555-555555555555";
const merchantId = "11111111-1111-4111-8111-111111111111";
const context = { params: Promise.resolve({ id }) };
const request = (body?: unknown) =>
  new Request(`http://localhost/api/v1/admin/bank-accounts/${id}/default`, {
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId], subMerchantIds: [], permissions: ["MANAGE_BANK_ACCOUNT"] });
  getBankAccount.mockResolvedValue({ success: true, data: { id, merchantId: merchantId } });
});

describe("bank account default route", () => {
  it("sets the default of an owned account", async () => {
    setDefaultBankAccount.mockResolvedValue({ success: true, data: { applied: true } });
    expect((await PUT(request(), context)).status).toBe(200);
    expect(setDefaultBankAccount).toHaveBeenCalledWith(id, undefined);
  });

  it("does not touch an account of another Master", async () => {
    getBankAccount.mockResolvedValue({
      success: true,
      data: { id, merchantId: "22222222-2222-4222-8222-222222222222" },
    });
    expect((await PUT(request(), context)).status).toBe(404);
    expect(setDefaultBankAccount).not.toHaveBeenCalled();
  });

  it("rejects an id that is not a UUID", async () => {
    expect((await PUT(request(), { params: Promise.resolve({ id: "x/../y" }) })).status).toBe(404);
    expect(getBankAccount).not.toHaveBeenCalled();
  });

  it("rejects a reason longer than 500 characters", async () => {
    expect((await PUT(request({ reason: "a".repeat(501) }), context)).status).toBe(400);
    expect(setDefaultBankAccount).not.toHaveBeenCalled();
  });
});
