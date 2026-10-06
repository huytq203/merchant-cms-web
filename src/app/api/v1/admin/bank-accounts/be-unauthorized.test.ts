import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listBankAccounts, getBankAccount } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listBankAccounts: vi.fn(),
  getBankAccount: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/bank-accounts/bank-account.service", () => ({
  listBankAccounts,
  getBankAccount,
  createBankAccount: vi.fn(),
}));
import { GET as list } from "./route";
import { GET as detail } from "./[id]/route";

const unauthorized = { success: false, error: { status: 401, code: "HTTP_401", message: "Phiên đăng nhập đã hết hạn" } };
const id = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId], subMerchantIds: [], permissions: ["MANAGE_SUB_MERCHANT"] });
  listBankAccounts.mockResolvedValue(unauthorized);
  getBankAccount.mockResolvedValue(unauthorized);
});

describe("bank account routes when the BE chain answers 401", () => {
  it("answers 403 with the BE error code kept, never 401", async () => {
    const listed = await list(new Request("http://localhost/api/v1/admin/bank-accounts"));
    const read = await detail(new Request("http://localhost"), { params: Promise.resolve({ id }) });
    expect([listed.status, read.status]).toEqual([403, 403]);
    expect((await listed.json()).code).toBe("HTTP_401");
  });
});
