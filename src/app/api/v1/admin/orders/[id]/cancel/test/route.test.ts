import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getOrder, cancelOrder } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getOrder: vi.fn(),
  cancelOrder: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/orders/order.service", () => ({ getOrder, cancelOrder }));
import { POST } from "../route";

const id = "33333333-3333-4333-8333-333333333333";
const merchantId = "22222222-2222-4222-8222-222222222222";
const order = { id, merchantId, status: "ACTIVE", orderCode: "INV-1", amount: 150000 };
const context = { params: Promise.resolve({ id }) };
const call = () => POST(new Request("http://localhost", { method: "POST" }), context);
const session = (permissions: string[]) => ({ merchantIds: [merchantId], subMerchantIds: [], permissions });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session(["VIEW_ORDER", "CANCEL_ORDER"]));
  getOrder.mockResolvedValue({ success: true, data: order });
  cancelOrder.mockResolvedValue({ success: true, data: { ...order, status: "CANCELLED" } });
});

describe("order cancel route", () => {
  it("needs CANCEL_ORDER", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_ORDER", "CREATE_ORDER"]));
    expect((await call()).status).toBe(403);
    expect(cancelOrder).not.toHaveBeenCalled();
  });

  it("answers 404 for a non-UUID id and for an order of another merchant", async () => {
    const bad = await POST(new Request("http://localhost", { method: "POST" }), { params: Promise.resolve({ id: "..%2Fx" }) });
    expect(bad.status).toBe(404);
    getOrder.mockResolvedValue({ success: true, data: { ...order, merchantId: "44444444-4444-4444-8444-444444444444" } });
    expect((await call()).status).toBe(404);
    expect(cancelOrder).not.toHaveBeenCalled();
  });

  it.each(["PENDING", "SUCCESS", "EXPIRED", "CANCELLED"])("refuses a %s order before calling the BE", async (status) => {
    getOrder.mockResolvedValue({ success: true, data: { ...order, status } });
    const response = await call();
    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe("ORDER_NOT_CANCELLABLE");
    expect(cancelOrder).not.toHaveBeenCalled();
  });

  it("cancels an owned ACTIVE order", async () => {
    const response = await call();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "CANCELLED" });
    expect(cancelOrder).toHaveBeenCalledWith(id);
  });

  it("passes a bank refusal on as a possibly-paid warning", async () => {
    cancelOrder.mockResolvedValue({ success: false, error: { status: 409, code: "MERCHANT_ORDER_BANK_CANCEL_REJECTED", message: "x" } });
    const response = await call();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "BANK_CANCEL_REJECTED" });
  });
});
