import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listOrders, createOrder } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listOrders: vi.fn(),
  createOrder: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/orders/order.service", () => ({ listOrders, createOrder, getOrder: vi.fn() }));
import { GET, POST } from "../route";

const merchantId = "22222222-2222-4222-8222-222222222222";
const foreignId = "44444444-4444-4444-8444-444444444444";
const subMerchantId = "11111111-1111-4111-8111-111111111111";
const body = { orderCode: "INV-1", amount: 150000, bankCode: "VCB" };
const listRequest = (query = "") => new Request(`http://localhost/api/v1/admin/orders${query}`);
const postRequest = (value: unknown) =>
  new Request("http://localhost/api/v1/admin/orders", { method: "POST", body: JSON.stringify(value) });
const session = (permissions: string[]) => ({
  merchantIds: [merchantId],
  subMerchantIds: [subMerchantId],
  permissions,
});

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session(["VIEW_ORDER", "CREATE_ORDER"]));
  listOrders.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
  createOrder.mockResolvedValue({ success: true, data: { id: "x" } });
});

describe("orders list route", () => {
  it("answers 401 without a session and 403 without VIEW_ORDER, never calling the service", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(listRequest())).status).toBe(401);
    getServerSession.mockResolvedValue(session(["CREATE_ORDER"]));
    expect((await GET(listRequest())).status).toBe(403);
    expect(listOrders).not.toHaveBeenCalled();
  });

  it("rejects an oversized page and an unknown status", async () => {
    expect((await GET(listRequest("?pageSize=101"))).status).toBe(400);
    expect((await GET(listRequest("?status=PAID"))).status).toBe(400);
    expect(listOrders).not.toHaveBeenCalled();
  });

  it("forwards only the supported filters and never a client merchantId", async () => {
    expect((await GET(listRequest(`?orderCode=INV&merchantId=${foreignId}`))).status).toBe(200);
    expect(listOrders).toHaveBeenCalledWith({ page: 1, pageSize: 10, orderCode: "INV" });
  });

  it("keeps the BE status and never answers 2xx for a failure", async () => {
    listOrders.mockResolvedValue({ success: false, error: { status: 403, code: "FORBIDDEN", message: "Cấm" } });
    expect((await GET(listRequest())).status).toBe(403);
    listOrders.mockResolvedValue({ success: false, error: { status: 0, code: "NETWORK", message: "Mất kết nối" } });
    expect((await GET(listRequest())).status).toBe(502);
  });
});

describe("orders create route", () => {
  it("answers 403 without CREATE_ORDER and 400 for an invalid amount", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_ORDER"]));
    expect((await POST(postRequest(body))).status).toBe(403);
    getServerSession.mockResolvedValue(session(["CREATE_ORDER"]));
    expect((await POST(postRequest({ ...body, amount: 0 }))).status).toBe(400);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("takes the merchant from the session and ignores a merchantId in the body", async () => {
    const response = await POST(postRequest({ ...body, merchantId: foreignId }));
    expect(response.status).toBe(201);
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ orderCode: "INV-1" }), merchantId);
  });

  it("refuses a sub-merchant outside the session scope", async () => {
    expect((await POST(postRequest({ ...body, subMerchantId: foreignId }))).status).toBe(403);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("forwards BE field errors so the form can show them on the right field", async () => {
    createOrder.mockResolvedValue({
      success: false,
      error: { status: 400, code: "VALIDATION", message: "Dữ liệu không hợp lệ", fieldErrors: { amount: "Vượt hạn mức" } },
    });
    const response = await POST(postRequest(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Dữ liệu không hợp lệ", details: { amount: "Vượt hạn mức" } });
  });
});
