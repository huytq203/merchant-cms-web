import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getUser, rejectScopeProposal } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getUser: vi.fn(),
  rejectScopeProposal: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/users/user.service", () => ({ getUser, rejectScopeProposal }));
import { POST } from "../route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const context = { params: Promise.resolve({ id: userId }) };
const request = (body: unknown = { reason: "Không phù hợp" }) =>
  new Request("http://localhost", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ userId: "actor", merchantIds: [merchantId], permissions: ["APPROVE_USER_SCOPE"] });
  getUser.mockResolvedValue({ success: true, data: { id: userId, merchantIds: [merchantId] } });
  rejectScopeProposal.mockResolvedValue({ success: true, data: { id: userId, status: "REJECTED" } });
});

describe("admin merchant user scope-proposal reject route", () => {
  it("needs APPROVE_USER_SCOPE; MANAGE_USER alone is refused before any BE call", async () => {
    getServerSession.mockResolvedValue({ userId: "actor", merchantIds: [merchantId], permissions: ["MANAGE_USER"] });
    expect((await POST(request(), context)).status).toBe(403);
    expect(rejectScopeProposal).not.toHaveBeenCalled();
  });

  it("requires a reason", async () => {
    expect((await POST(request({ reason: "" }), context)).status).toBe(400);
    expect(rejectScopeProposal).not.toHaveBeenCalled();
  });

  it("rejects the proposal of an in-scope user", async () => {
    expect((await POST(request(), context)).status).toBe(200);
    expect(rejectScopeProposal).toHaveBeenCalledWith(userId, "Không phù hợp");
  });
});
