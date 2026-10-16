import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getUser, createScopeProposal } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getUser: vi.fn(),
  createScopeProposal: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/users/user.service", () => ({ getUser, createScopeProposal }));
import { POST } from "../route";

const userId = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";
const subMerchantId = "33333333-3333-4333-8333-333333333333";
const session = { userId: "actor", permissions: ["MANAGE_USER"], merchantIds: [merchantId], subMerchantIds: [subMerchantId] };
const context = { params: Promise.resolve({ id: userId }) };
const post = (body: unknown) => POST(new Request("http://localhost/x", { method: "POST", body: JSON.stringify(body) }), context);
const valid = { subMerchantIds: [subMerchantId], reason: "Phụ trách thêm cửa hàng mới" };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session);
  getUser.mockResolvedValue({ success: true, data: { id: userId, merchantIds: [merchantId] } });
  createScopeProposal.mockResolvedValue({ success: true, data: { id: "p-1" }, message: "Create scope proposal success" });
});

describe("scope proposal create route (POST)", () => {
  it("returns 401 without a session and 403 without MANAGE_USER", async () => {
    getServerSession.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...session, permissions: [] });
    expect((await post(valid)).status).toBe(401);
    expect((await post(valid)).status).toBe(403);
    expect(createScopeProposal).not.toHaveBeenCalled();
  });

  it("rejects a short reason with 400 before touching the BE", async () => {
    const response = await post({ ...valid, reason: "ngắn" });
    expect(response.status).toBe(400);
    expect(createScopeProposal).not.toHaveBeenCalled();
  });

  it("hides a user outside the actor's merchants as 404", async () => {
    getUser.mockResolvedValue({ success: true, data: { id: userId, merchantIds: ["99999999-9999-4999-8999-999999999999"] } });
    expect((await post(valid)).status).toBe(404);
    expect(createScopeProposal).not.toHaveBeenCalled();
  });

  it("refuses sub-merchants outside the actor's scope", async () => {
    const response = await post({ ...valid, subMerchantIds: ["44444444-4444-4444-8444-444444444444"] });
    expect(response.status).toBe(403);
    expect(createScopeProposal).not.toHaveBeenCalled();
  });

  it("creates the proposal and forwards the BE message", async () => {
    const response = await post(valid);
    expect(response.status).toBe(201);
    expect(createScopeProposal).toHaveBeenCalledWith(userId, valid);
    expect(response.headers.get("X-Api-Message")).toBe(encodeURIComponent("Create scope proposal success"));
  });

  it("answers 200 and keeps the null id when the change only narrows the scope and is applied at once", async () => {
    createScopeProposal.mockResolvedValue({ success: true, data: { id: null, status: "APPROVED" }, message: "Scope narrowing applied" });
    const response = await post(valid);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: null, status: "APPROVED" });
  });

  it("still answers 201 for a proposal that waits for approval", async () => {
    createScopeProposal.mockResolvedValue({ success: true, data: { id: "p-1", status: "PENDING_APPROVAL" } });
    expect((await post(valid)).status).toBe(201);
  });
});
