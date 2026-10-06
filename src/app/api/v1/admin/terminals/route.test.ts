import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listTerminals, createTerminal } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listTerminals: vi.fn(),
  createTerminal: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/terminals/terminal.service", () => ({ listTerminals, createTerminal }));
import { GET, POST } from "./route";

const subMerchantId = "11111111-1111-4111-8111-111111111111";
const session = { subMerchantIds: [subMerchantId], permissions: ["MANAGE_SUB_MERCHANT"] };
const values = { subMerchantId, name: "Quầy", terminalType: "POS", address: "Hà Nội", contactPerson: "", inheritContactPhone: true, contactPhone: "", note: "" };
const get = (query = "") => new Request(`http://localhost/api/v1/admin/terminals${query}`);
const post = (body: unknown) => new Request("http://localhost/api/v1/admin/terminals", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session);
});

describe("terminal collection route", () => {
  it("returns 401 without session", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(get())).status).toBe(401);
    expect(listTerminals).not.toHaveBeenCalled();
  });

  it("returns 403 without permission", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: [] });
    expect((await GET(get())).status).toBe(403);
    expect(listTerminals).not.toHaveBeenCalled();
  });

  it("rejects invalid pagination", async () => {
    expect((await GET(get("?pageSize=101"))).status).toBe(400);
    expect(listTerminals).not.toHaveBeenCalled();
  });

  it("rejects another sub merchant", async () => {
    expect((await GET(get("?subMerchantId=22222222-2222-4222-8222-222222222222"))).status).toBe(403);
    expect(listTerminals).not.toHaveBeenCalled();
  });

  it("lists all permitted terminals when sub merchant filter is omitted", async () => {
    listTerminals.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
    expect((await GET(get("?name=Quay"))).status).toBe(200);
    expect(listTerminals).toHaveBeenCalledWith({ page: 1, pageSize: 10, name: "Quay", subMerchantId: undefined });
  });

  it("requires a sub merchant when creating a terminal", async () => {
    expect((await POST(post({ ...values, subMerchantId: undefined }))).status).toBe(400);
    expect(createTerminal).not.toHaveBeenCalled();
  });

  it("validates body and rejects foreign parent", async () => {
    expect((await POST(post({ ...values, address: "" }))).status).toBe(400);
    expect((await POST(post({ ...values, subMerchantId: "22222222-2222-4222-8222-222222222222" }))).status).toBe(403);
    expect(createTerminal).not.toHaveBeenCalled();
  });

  it("preserves a BE conflict", async () => {
    createTerminal.mockResolvedValue({ success: false, error: { status: 409, code: "CONFLICT", message: "Đã tồn tại" } });
    const response = await POST(post(values));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Đã tồn tại" });
  });
});
