import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getTerminal, updateTerminal } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getTerminal: vi.fn(),
  updateTerminal: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/terminals/terminal.service", () => ({ getTerminal, updateTerminal }));
import { GET, PUT } from "../route";

const id = "33333333-3333-4333-8333-333333333333";
const subMerchantId = "11111111-1111-4111-8111-111111111111";
const foreignId = "22222222-2222-4222-8222-222222222222";
const detail = { id, subMerchantId, status: "ACTIVE", lockSource: null };
const values = { subMerchantId, name: "Quầy", terminalType: "POS", address: "Hà Nội", contactPerson: "", inheritContactPhone: true, contactPhone: "", note: "" };
const context = { params: Promise.resolve({ id }) };
const request = (body: unknown) => new Request(`http://localhost/api/v1/admin/terminals/${id}`, { method: "PUT", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ subMerchantIds: [subMerchantId], permissions: ["MANAGE_TERMINAL"] });
  getTerminal.mockResolvedValue({ success: true, data: detail });
});

describe("terminal detail route", () => {
  it("rejects a foreign terminal without writing", async () => {
    getTerminal.mockResolvedValue({ success: true, data: { ...detail, subMerchantId: foreignId } });
    expect((await PUT(request(values), context)).status).toBe(404);
    expect(updateTerminal).not.toHaveBeenCalled();
  });

  it("rejects a changed parent", async () => {
    expect((await PUT(request({ ...values, subMerchantId: foreignId }), context)).status).toBe(400);
    expect(updateTerminal).not.toHaveBeenCalled();
  });

  it("rejects invalid body", async () => {
    expect((await PUT(request({ ...values, name: "" }), context)).status).toBe(400);
    expect(updateTerminal).not.toHaveBeenCalled();
  });

  it("reads an owned terminal", async () => {
    const response = await GET(new Request("http://localhost"), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(detail);
  });
});
