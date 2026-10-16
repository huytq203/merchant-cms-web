import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getUser, approveScopeProposal } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getUser: vi.fn(),
  approveScopeProposal: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/users/user.service", () => ({ getUser, approveScopeProposal }));
import { POST } from "../route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const context = { params: Promise.resolve({ id: userId }) };
const request = () => new Request("http://localhost", { method: "POST" });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ userId: "actor", merchantIds: [merchantId], permissions: ["APPROVE_USER_SCOPE"] });
  getUser.mockResolvedValue({ success: true, data: { id: userId, merchantIds: [merchantId] } });
  approveScopeProposal.mockResolvedValue({ success: true, data: { id: userId, status: "APPROVED" } });
});

describe("admin merchant user scope-proposal approve route", () => {
  it("needs APPROVE_USER_SCOPE; MANAGE_USER alone is refused before any BE call", async () => {
    getServerSession.mockResolvedValue({ userId: "actor", merchantIds: [merchantId], permissions: ["MANAGE_USER"] });
    expect((await POST(request(), context)).status).toBe(403);
    expect(getUser).not.toHaveBeenCalled();
    expect(approveScopeProposal).not.toHaveBeenCalled();
  });

  it("approves once the target user is proven in scope", async () => {
    expect((await POST(request(), context)).status).toBe(200);
    expect(approveScopeProposal).toHaveBeenCalledWith(userId);
  });

  it("masks an out-of-scope user as 404", async () => {
    getUser.mockResolvedValue({ success: true, data: { id: userId, merchantIds: ["foreign"] } });
    expect((await POST(request(), context)).status).toBe(404);
    expect(approveScopeProposal).not.toHaveBeenCalled();
  });
});
