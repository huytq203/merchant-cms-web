import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listReceivingAccounts } = vi.hoisted(() => ({ getServerSession: vi.fn(), listReceivingAccounts: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/disbursements/disbursement.service", () => ({ listReceivingAccounts }));
import { GET } from "../receiving-accounts/route";

const SUB = "11111111-1111-4111-8111-111111111111";
const REFUND = "33333333-3333-4333-8333-333333333333";
const session = { merchantIds: ["m"], subMerchantIds: [], permissions: ["VIEW_DISBURSEMENT"] };
const get = (query: string) => new Request(`http://localhost/api/v1/admin/disbursements/receiving-accounts?${query}`);

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session);
  listReceivingAccounts.mockResolvedValue({ success: true, data: [] });
});

describe("GET /disbursements/receiving-accounts", () => {
  it("passes purpose and refundId through to BE", async () => {
    expect((await GET(get(`subId=${SUB}&purpose=HOAN&refundId=${REFUND}`))).status).toBe(200);
    expect(listReceivingAccounts).toHaveBeenCalledWith(SUB, "HOAN", REFUND);
  });

  it("rejects an unknown purpose before reaching BE", async () => {
    expect((await GET(get(`subId=${SUB}&purpose=TRA_LAI`))).status).toBe(400);
    expect(listReceivingAccounts).not.toHaveBeenCalled();
  });
});
