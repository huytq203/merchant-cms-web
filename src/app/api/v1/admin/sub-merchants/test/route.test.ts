import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listSubMerchants, createSubMerchant } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listSubMerchants: vi.fn(),
  createSubMerchant: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/sub-merchants/sub-merchant.service", () => ({
  listSubMerchants,
  createSubMerchant,
}));
import { GET, POST } from "../route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const session = { merchantIds: [merchantId], permissions: ["MANAGE_SUB_MERCHANT"] };
const values = {
  name: "Sub-merchant",
  businessField: "",
  inheritPhone: true,
  phone: "",
  inheritAddress: true,
  address: "",
};
const request = (query = "") => new Request(`http://localhost/api/v1/admin/sub-merchants${query}`);
const post = (body: unknown) => new Request("http://localhost/api/v1/admin/sub-merchants", {
  method: "POST",
  body: JSON.stringify(body),
});

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session);
});

describe("sub merchant collection route", () => {
  it("returns 401 without a session", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(401);
    expect(listSubMerchants).not.toHaveBeenCalled();
  });

  it("returns 403 without permission and skips the service", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: [] });
    expect((await GET(request())).status).toBe(403);
    expect(listSubMerchants).not.toHaveBeenCalled();
  });

  it.each(["?page=0", "?pageSize=101", "?pageSize=abc"])(
    "rejects invalid pagination %s",
    async (query) => {
      expect((await GET(request(query))).status).toBe(400);
      expect(listSubMerchants).not.toHaveBeenCalled();
    },
  );

  it("passes the filter and returns rows", async () => {
    listSubMerchants.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
    const response = await GET(request("?page=2&pageSize=20&code=S1&name=A&status=ACTIVE"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ rows: [], total: 0 });
    expect(listSubMerchants).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
      code: "S1",
      name: "A",
      status: "ACTIVE",
    });
  });

  it("narrows the list to a merchant of the session when one is asked for", async () => {
    listSubMerchants.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
    expect((await GET(request(`?merchantId=${merchantId}`))).status).toBe(200);
    expect(listSubMerchants).toHaveBeenCalledWith(expect.objectContaining({ merchantId }));
  });

  it("does not narrow the list when no merchant is asked for", async () => {
    listSubMerchants.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
    await GET(request());
    expect(listSubMerchants.mock.calls[0]?.[0]).not.toHaveProperty("merchantId");
  });

  it("rejects a merchant ID outside the session", async () => {
    expect((await GET(request("?merchantId=other"))).status).toBe(403);
    expect(listSubMerchants).not.toHaveBeenCalled();
  });

  it("rejects invalid create body", async () => {
    expect((await POST(post({ name: "" }))).status).toBe(400);
    expect(createSubMerchant).not.toHaveBeenCalled();
  });

  it("rejects creating under a merchant ID outside the session", async () => {
    const response = await POST(post({ ...values, merchantId: "other" }));
    expect(response.status).toBe(403);
    expect(createSubMerchant).not.toHaveBeenCalled();
  });

  it("returns BE conflict message", async () => {
    createSubMerchant.mockResolvedValue({
      success: false,
      error: { status: 409, code: "CONFLICT", message: "Đã tồn tại" },
    });
    const response = await POST(post(values));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Đã tồn tại" });
  });

  it("creates with session merchant ID and returns 201", async () => {
    createSubMerchant.mockResolvedValue({ success: true, data: { id: "new" } });
    const response = await POST(post(values));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "new" });
    expect(createSubMerchant).toHaveBeenCalledWith(values, merchantId);
  });
});
