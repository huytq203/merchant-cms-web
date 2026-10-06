import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getWithdrawal } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getWithdrawal: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/withdrawals/withdrawal.service", () => ({ getWithdrawal }));
import { GET } from "./route";

const merchantId = "22222222-2222-4222-8222-222222222222";
const id = "33333333-3333-4333-8333-333333333333";
const call = (value: string) => GET(new Request("http://localhost"), { params: Promise.resolve({ id: value }) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId], subMerchantIds: [], permissions: ["VIEW_WITHDRAWAL"] });
  getWithdrawal.mockResolvedValue({ success: true, data: { id, merchantId } });
});

describe("withdrawal detail route", () => {
  it("answers 401, then 403 without VIEW_WITHDRAWAL, before reading the BE", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await call(id)).status).toBe(401);
    getServerSession.mockResolvedValue({ merchantIds: [merchantId], subMerchantIds: [], permissions: [] });
    expect((await call(id)).status).toBe(403);
    expect(getWithdrawal).not.toHaveBeenCalled();
  });

  it("answers 404 for an id that is not a UUID without reaching the BE", async () => {
    expect((await call("..%2fadmin")).status).toBe(404);
    expect(getWithdrawal).not.toHaveBeenCalled();
  });

  it("returns the record of the session merchant and 404 for a foreign one", async () => {
    expect((await call(id)).status).toBe(200);
    getWithdrawal.mockResolvedValue({ success: true, data: { id, merchantId: "44444444-4444-4444-8444-444444444444" } });
    expect((await call(id)).status).toBe(404);
  });

  it("maps a BE 401 to 403", async () => {
    getWithdrawal.mockResolvedValue({ success: false, error: { status: 401, code: "HTTP_401", message: "x" } });
    expect((await call(id)).status).toBe(403);
  });
});
