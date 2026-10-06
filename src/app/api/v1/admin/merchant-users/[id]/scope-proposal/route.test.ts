import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getUser, getScopeProposal } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getUser: vi.fn(),
  getScopeProposal: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/users/user.service", () => ({ getUser, getScopeProposal }));

import { GET } from "./route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const context = { params: Promise.resolve({ id: userId }) };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ userId: "actor", merchantIds: [merchantId], permissions: ["MANAGE_USER"] });
  getUser.mockResolvedValue({ success: true, data: { id: userId, merchantIds: [merchantId] } });
  getScopeProposal.mockResolvedValue({ success: true, data: { id: userId, status: "PENDING_APPROVAL" } });
});

describe("admin merchant user scope-proposal route", () => {
  it("returns the pending proposal only after the target user is proven in scope", async () => {
    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: userId, status: "PENDING_APPROVAL" });
    expect(getScopeProposal).toHaveBeenCalledWith(userId);
  });

  it("masks an out-of-scope user as 404 without loading their proposal", async () => {
    getUser.mockResolvedValue({ success: true, data: { id: userId, merchantIds: ["foreign"] } });
    expect((await GET(new Request("http://localhost"), context)).status).toBe(404);
    expect(getScopeProposal).not.toHaveBeenCalled();
  });
});
