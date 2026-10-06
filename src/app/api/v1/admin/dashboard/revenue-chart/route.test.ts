import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getRevenueChart } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getRevenueChart: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/dashboard/dashboard.service", () => ({ getRevenueChart, getDashboardOverview: vi.fn() }));
import { GET } from "./route";

const merchantId = "22222222-2222-4222-8222-222222222222";
const request = (query = "") => new Request(`http://localhost/api/v1/admin/dashboard/revenue-chart${query}`);

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId], subMerchantIds: [], permissions: [] });
  getRevenueChart.mockResolvedValue({ success: true, data: { points: [], summary: {} } });
});

describe("revenue chart route", () => {
  it("answers 401 without a session, never calling the service", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(401);
    expect(getRevenueChart).not.toHaveBeenCalled();
  });

  it("rejects an unknown period and defaults to seven days", async () => {
    expect((await GET(request("?period=hourly"))).status).toBe(400);
    expect(getRevenueChart).not.toHaveBeenCalled();
    expect((await GET(request())).status).toBe(200);
    expect(getRevenueChart).toHaveBeenCalledWith("7days");
  });

  it("keeps 501 for an unsupported module and never answers 401 for a BE failure", async () => {
    getRevenueChart.mockResolvedValue({
      success: false,
      error: { status: 501, code: "NOT_IMPLEMENTED", message: "Chức năng chưa được hỗ trợ" },
    });
    expect((await GET(request("?period=7days"))).status).toBe(501);
    getRevenueChart.mockResolvedValue({ success: false, error: { status: 401, code: "UNAUTHORIZED", message: "x" } });
    expect((await GET(request())).status).toBe(403);
  });
});
