import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getWithdrawalBalance } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getWithdrawalBalance: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/withdrawals/withdrawal.service", () => ({ getWithdrawalBalance }));
import { GET } from "../route";

const merchantId = "22222222-2222-4222-8222-222222222222";
const subMerchantId = "11111111-1111-4111-8111-111111111111";
const foreignSubId = "99999999-9999-4999-8999-999999999999";
const session = (permissions: string[], subMerchantIds = [subMerchantId]) => ({ merchantIds: [merchantId], subMerchantIds, permissions });
const call = (query = `?subMerchantId=${subMerchantId}`) =>
  GET(new Request(`http://localhost/api/v1/admin/withdrawals/balance${query}`));

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session(["VIEW_WITHDRAWAL"]));
  getWithdrawalBalance.mockResolvedValue({ success: true, data: { subMerchantId, availableBalance: 5 } });
});

describe("withdrawal balance route", () => {
  it("answers 401 without a session and 403 without VIEW_WITHDRAWAL, never reading the balance", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await call()).status).toBe(401);
    getServerSession.mockResolvedValue(session(["CREATE_WITHDRAWAL"]));
    expect((await call()).status).toBe(403);
    expect(getWithdrawalBalance).not.toHaveBeenCalled();
  });

  it("forwards the Sub from the query and no merchant", async () => {
    const response = await call();
    expect(response.status).toBe(200);
    expect(getWithdrawalBalance).toHaveBeenCalledWith(subMerchantId);
    expect(getWithdrawalBalance.mock.calls[0]).toHaveLength(1);
  });

  it("answers 400 when the Sub is missing or not a UUID", async () => {
    expect((await call("")).status).toBe(400);
    expect((await call("?subMerchantId=abc")).status).toBe(400);
    expect(getWithdrawalBalance).not.toHaveBeenCalled();
  });

  it("refuses a Sub outside a limited session, but lets a session without a Sub limit through to BE", async () => {
    expect((await call(`?subMerchantId=${foreignSubId}`)).status).toBe(403);
    expect(getWithdrawalBalance).not.toHaveBeenCalled();
    getServerSession.mockResolvedValue(session(["VIEW_WITHDRAWAL"], []));
    expect((await call(`?subMerchantId=${foreignSubId}`)).status).toBe(200);
    expect(getWithdrawalBalance).toHaveBeenCalledWith(foreignSubId);
  });

  it("never answers 2xx when the balance could not be read, and keeps the code the browser branches on", async () => {
    getWithdrawalBalance.mockResolvedValue({ success: false, error: { status: 503, code: "HTTP_503", message: "x" } });
    const response = await call();
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ code: "HTTP_503" });
    getWithdrawalBalance.mockResolvedValue({ success: false, error: { status: 0, code: "NETWORK", message: "x" } });
    expect((await call()).status).toBe(502);
  });
});
