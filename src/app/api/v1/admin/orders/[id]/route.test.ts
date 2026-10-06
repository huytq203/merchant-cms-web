import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getOrder, refreshOrderQr } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getOrder: vi.fn(),
  refreshOrderQr: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/orders/order.service", () => ({ getOrder, refreshOrderQr }));
import { GET } from "./route";
import { POST as refreshQr } from "./refresh-qr/route";

const id = "33333333-3333-4333-8333-333333333333";
const merchantId = "22222222-2222-4222-8222-222222222222";
const foreignId = "44444444-4444-4444-8444-444444444444";
const order = { id, merchantId, status: "ACTIVE", amount: 150000 };
const context = { params: Promise.resolve({ id }) };
const request = () => new Request("http://localhost", { method: "POST" });
const session = (permissions: string[]) => ({ merchantIds: [merchantId], subMerchantIds: [], permissions });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session(["VIEW_ORDER", "CONFIRM_ORDER", "CREATE_ORDER"]));
  getOrder.mockResolvedValue({ success: true, data: order });
  refreshOrderQr.mockResolvedValue({ success: true, data: order });
});

describe("order detail route", () => {
  it("reads an owned order and hides a foreign one as 404", async () => {
    expect((await GET(new Request("http://localhost"), context)).status).toBe(200);
    getOrder.mockResolvedValue({ success: true, data: { ...order, merchantId: foreignId } });
    expect((await GET(new Request("http://localhost"), context)).status).toBe(404);
  });

  it("answers 404 for a non-UUID id without calling BE", async () => {
    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: "..%2Fx" }) });
    expect(response.status).toBe(404);
    expect(getOrder).not.toHaveBeenCalled();
  });
});

describe("order refresh-qr route", () => {
  it("needs CREATE_ORDER", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_ORDER"]));
    expect((await refreshQr(request(), context)).status).toBe(403);
    expect(refreshOrderQr).not.toHaveBeenCalled();
  });

  it.each(["SUCCESS", "EXPIRED", "CANCELLED"])("refuses a %s order", async (status) => {
    getOrder.mockResolvedValue({ success: true, data: { ...order, status } });
    expect((await refreshQr(request(), context)).status).toBe(409);
    expect(refreshOrderQr).not.toHaveBeenCalled();
  });

  it("refreshes an owned ACTIVE order and refuses a foreign one", async () => {
    expect((await refreshQr(request(), context)).status).toBe(200);
    getOrder.mockResolvedValue({ success: true, data: { ...order, merchantId: foreignId } });
    expect((await refreshQr(request(), context)).status).toBe(404);
    expect(refreshOrderQr).toHaveBeenCalledTimes(1);
  });
});
