import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getWithdrawalBalance } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getWithdrawalBalance: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/withdrawals/withdrawal.service", () => ({ getWithdrawalBalance }));
import { GET } from "../route";

const merchantId = "22222222-2222-4222-8222-222222222222";
const session = (permissions: string[]) => ({ merchantIds: [merchantId], subMerchantIds: [], permissions });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session(["VIEW_WITHDRAWAL"]));
  getWithdrawalBalance.mockResolvedValue({ success: true, data: { merchantId, availableBalance: 5 } });
});

describe("withdrawal balance route", () => {
  it("answers 401 without a session and 403 without VIEW_WITHDRAWAL, never reading the balance", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    getServerSession.mockResolvedValue(session(["CREATE_WITHDRAWAL"]));
    expect((await GET()).status).toBe(403);
    expect(getWithdrawalBalance).not.toHaveBeenCalled();
  });

  it("reads the balance of the merchant in the session", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(getWithdrawalBalance).toHaveBeenCalledWith(merchantId);
  });

  it("refuses a session without a merchant instead of guessing one", async () => {
    getServerSession.mockResolvedValue({ merchantIds: [], subMerchantIds: [], permissions: ["VIEW_WITHDRAWAL"] });
    expect((await GET()).status).toBe(403);
    expect(getWithdrawalBalance).not.toHaveBeenCalled();
  });

  it("never answers 2xx when the balance could not be read", async () => {
    getWithdrawalBalance.mockResolvedValue({ success: false, error: { status: 503, code: "HTTP_503", message: "x" } });
    expect((await GET()).status).toBe(502);
  });
});
