import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listOrders, getOrder } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listOrders: vi.fn(),
  getOrder: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/orders/order.service", () => ({ listOrders, getOrder, createOrder: vi.fn() }));
import { GET as list } from "./route";
import { GET as detail } from "./[id]/route";

const unauthorized = { success: false, error: { status: 401, code: "HTTP_401", message: "Phiên đăng nhập đã hết hạn" } };
const id = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId], subMerchantIds: [], permissions: ["VIEW_ORDER"] });
  listOrders.mockResolvedValue(unauthorized);
  getOrder.mockResolvedValue(unauthorized);
});

describe("order routes when the BE chain answers 401", () => {
  it("answers 403, never 401, so the browser does not end the session", async () => {
    const listed = await list(new Request("http://localhost/api/v1/admin/orders"));
    const read = await detail(new Request("http://localhost"), { params: Promise.resolve({ id }) });
    expect([listed.status, read.status]).toEqual([403, 403]);
  });
});
