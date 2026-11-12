import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getOrder, createOrderDisplay } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getOrder: vi.fn(),
  createOrderDisplay: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/orders/order.service", () => ({ getOrder }));
vi.mock("@/server/modules/customer-display/customer-display.service", () => ({ createOrderDisplay }));
import { POST } from "../route";

const id = "33333333-3333-4333-8333-333333333333";
const merchantId = "22222222-2222-4222-8222-222222222222";
const order = { id, merchantId, status: "ACTIVE", orderCode: "DH-1", amount: 150000 };
const display = { displayToken: "tok", kind: "ORDER", qrPayload: "000201", shop: { name: "Halo", terminalName: null }, amount: 150000 };
const call = (routeId = id) => POST(new Request("http://localhost", { method: "POST" }), { params: Promise.resolve({ id: routeId }) });
const session = (permissions: string[]) => ({ merchantIds: [merchantId], subMerchantIds: [], permissions });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session(["VIEW_ORDER", "CREATE_ORDER"]));
  getOrder.mockResolvedValue({ success: true, data: order });
  createOrderDisplay.mockResolvedValue({ success: true, data: display });
});

describe("order customer-display route", () => {
  it("needs VIEW_ORDER or CREATE_ORDER, like the \"Xem mã QR\" button that opens it", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_REVENUE"]));
    expect((await call()).status).toBe(403);
    expect(createOrderDisplay).not.toHaveBeenCalled();
  });

  it("opens for a session that can only view orders", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_ORDER"]));
    expect((await call()).status).not.toBe(403);
  });

  it("answers 404 for a bad id and for an order of another merchant", async () => {
    expect((await call("..%2Fx")).status).toBe(404);
    getOrder.mockResolvedValue({ success: true, data: { ...order, merchantId: "44444444-4444-4444-8444-444444444444" } });
    expect((await call()).status).toBe(404);
    expect(createOrderDisplay).not.toHaveBeenCalled();
  });

  it.each(["PENDING", "SUCCESS", "EXPIRED", "CANCELLED"])("refuses a %s order", async (status) => {
    getOrder.mockResolvedValue({ success: true, data: { ...order, status } });
    const response = await call();
    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe("ORDER_NOT_PAYABLE");
    expect(createOrderDisplay).not.toHaveBeenCalled();
  });

  it("returns the display data of an owned ACTIVE order", async () => {
    const response = await call();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ displayToken: "tok" });
    expect(createOrderDisplay).toHaveBeenCalledWith(order);
  });

  it("passes a BE failure on with its status", async () => {
    createOrderDisplay.mockResolvedValue({ success: false, error: { status: 404, code: "NOT_FOUND", message: "x" } });
    expect((await call()).status).toBe(404);
  });
});
