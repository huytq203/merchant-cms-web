import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getDashboardOverview } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getDashboardOverview: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/dashboard/dashboard.service", () => ({ getDashboardOverview, getRevenueChart: vi.fn() }));
import { GET } from "../route";

const merchantId = "22222222-2222-4222-8222-222222222222";
const session = (permissions: string[]) => ({ merchantIds: [merchantId], subMerchantIds: [], permissions });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session([]));
  getDashboardOverview.mockResolvedValue({ success: true, data: { summary: {}, recentTransactions: [] } });
});

describe("dashboard route", () => {
  it("answers 401 without a session, never calling the service", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(getDashboardOverview).not.toHaveBeenCalled();
  });

  it("needs only the session, with no permission", async () => {
    expect((await GET()).status).toBe(200);
    expect(getDashboardOverview).toHaveBeenCalledTimes(1);
  });

  it("keeps 501 for an unsupported module and turns a BE 401 into 403", async () => {
    getDashboardOverview.mockResolvedValue({
      success: false,
      error: { status: 501, code: "NOT_IMPLEMENTED", message: "Chức năng chưa được hỗ trợ" },
    });
    expect((await GET()).status).toBe(501);
    getDashboardOverview.mockResolvedValue({ success: false, error: { status: 401, code: "UNAUTHORIZED", message: "x" } });
    expect((await GET()).status).toBe(403);
    getDashboardOverview.mockResolvedValue({ success: false, error: { status: 0, code: "NETWORK", message: "x" } });
    expect((await GET()).status).toBe(502);
  });
});
