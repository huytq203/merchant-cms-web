import { beforeEach, describe, expect, it, vi } from "vitest";
import { succeededRefund } from "@/features/revenue-refunds/test/fixtures";

const { getServerSession, getRevenueRefund } = vi.hoisted(() => ({ getServerSession: vi.fn(), getRevenueRefund: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/revenue-refunds/revenue-refund.service", () => ({ getRevenueRefund }));
import { GET } from "../[id]/route";

const call = (id: string) => GET(new Request(`http://localhost/api/v1/admin/revenue-refunds/${id}`), { params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: ["VIEW_REFUND"], merchantIds: ["m"], subMerchantIds: [] });
});

describe("refund detail route", () => {
  it("returns the BE detail to a viewer", async () => {
    getRevenueRefund.mockResolvedValue({ success: true, data: { ...succeededRefund, approvedBy: "An" } });
    const response = await call(succeededRefund.id);
    expect(response.status).toBe(200);
    expect((await response.json()).approvedBy).toBe("An");
  });

  it("needs VIEW_REFUND, rejects a non-UUID id and forwards BE 404", async () => {
    expect((await call("../etc")).status).toBe(404);
    getRevenueRefund.mockResolvedValue({ success: false, error: { status: 404, code: "NOT_FOUND", message: "Không tìm thấy lệnh hoàn tiền." } });
    expect((await call(succeededRefund.id)).status).toBe(404);
    getServerSession.mockResolvedValue({ permissions: ["CREATE_REFUND"], merchantIds: ["m"], subMerchantIds: [] });
    expect((await call(succeededRefund.id)).status).toBe(403);
  });
});
