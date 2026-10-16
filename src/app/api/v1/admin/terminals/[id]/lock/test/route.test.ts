import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getTerminal, lockTerminal } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getTerminal: vi.fn(),
  lockTerminal: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/terminals/terminal.service", () => ({ getTerminal, lockTerminal }));
import { POST } from "../route";

const id = "33333333-3333-4333-8333-333333333333";
const subMerchantId = "11111111-1111-4111-8111-111111111111";
const foreignId = "22222222-2222-4222-8222-222222222222";
const reason = "Lý do hợp lệ";
const session = { subMerchantIds: [subMerchantId], permissions: ["MANAGE_TERMINAL"] };
const detail = { id, subMerchantId, status: "ACTIVE", lockSource: null };
const context = { params: Promise.resolve({ id }) };
const request = (body: unknown = { reason }) => new Request(`http://localhost/api/v1/admin/terminals/${id}/lock`, {
  method: "POST",
  body: JSON.stringify(body),
});

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session);
  getTerminal.mockResolvedValue({ success: true, data: detail });
  lockTerminal.mockResolvedValue({ success: true, data: { ...detail, status: "CHANGED" } });
});

describe("terminal lock route", () => {
  it("returns 401 without a session and 403 without permission, never touching the BE", async () => {
    getServerSession.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...session, permissions: [] });
    expect((await POST(request(), context)).status).toBe(401);
    expect((await POST(request(), context)).status).toBe(403);
    expect(getTerminal).not.toHaveBeenCalled();
    expect(lockTerminal).not.toHaveBeenCalled();
  });

  it("rejects an invalid reason before loading the terminal", async () => {
    expect((await POST(request({ reason: "short" }), context)).status).toBe(400);
    expect((await POST(request(null), context)).status).toBe(400);
    expect(lockTerminal).not.toHaveBeenCalled();
  });

  it("returns 404 for a malformed id without calling the BE", async () => {
    const response = await POST(request(), { params: Promise.resolve({ id: "not-a-uuid" }) });
    expect(response.status).toBe(404);
    expect(getTerminal).not.toHaveBeenCalled();
    expect(lockTerminal).not.toHaveBeenCalled();
  });

  it("hides a terminal of a sub merchant outside the session", async () => {
    getTerminal.mockResolvedValue({ success: true, data: { ...detail, subMerchantId: foreignId } });
    expect((await POST(request(), context)).status).toBe(404);
    expect(lockTerminal).not.toHaveBeenCalled();
  });

  it("returns 409 when the terminal state does not allow lock", async () => {
    getTerminal.mockResolvedValue({ success: true, data: { ...detail, status: "INACTIVE", lockSource: "DIRECT" } });
    expect((await POST(request(), context)).status).toBe(409);
    expect(lockTerminal).not.toHaveBeenCalled();
  });

  it("forwards the trimmed reason and returns the updated terminal", async () => {
    const response = await POST(request({ reason: `  ${reason}  ` }), context);
    expect(response.status).toBe(200);
    expect(lockTerminal).toHaveBeenCalledWith(id, reason);
    expect(await response.json()).toMatchObject({ id, status: "CHANGED" });
  });

  it("keeps the BE status and message when the BE rejects", async () => {
    lockTerminal.mockResolvedValue({ success: false, error: { status: 409, code: "CONFLICT", message: "Xung đột trạng thái" } });
    const response = await POST(request(), context);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Xung đột trạng thái" });
  });
});
