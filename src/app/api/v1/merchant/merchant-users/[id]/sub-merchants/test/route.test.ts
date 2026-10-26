import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, assignUserSubMerchants, assignUserMerchants } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  assignUserSubMerchants: vi.fn(),
  assignUserMerchants: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/users/user.service", () => ({
  assignUserSubMerchants,
  assignUserMerchants,
  getUser: vi.fn(),
  listAssignableGroups: vi.fn(),
}));
import { PUT as putSubMerchants } from "../route";
import { PUT as putMerchants } from "../../merchants/route";

const userId = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";
const subId = "33333333-3333-4333-8333-333333333333";
const context = { params: Promise.resolve({ id: userId }) };
const put = (handler: typeof putSubMerchants, body: unknown, ctx = context) =>
  handler(new Request("http://localhost", { method: "PUT", body: JSON.stringify(body) }), ctx);
const session = { userId: "actor", permissions: ["MANAGE_USER"], merchantIds: [merchantId], subMerchantIds: [] };
const result = (status: string, id: string | null) => ({
  success: true,
  data: { id, merchantUserId: userId, status, merchantIds: [], subMerchantIds: [subId] },
  message: "Scope proposal submitted",
});

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session);
  assignUserSubMerchants.mockResolvedValue(result("PENDING_APPROVAL", "44444444-4444-4444-8444-444444444444"));
  assignUserMerchants.mockResolvedValue(result("PENDING_APPROVAL", "44444444-4444-4444-8444-444444444444"));
});

describe("scope assignment routes", () => {
  it("need MANAGE_USER and a valid body, and refuse a self change", async () => {
    getServerSession.mockResolvedValueOnce({ ...session, permissions: [] });
    expect((await put(putSubMerchants, { ids: [subId] })).status).toBe(403);
    expect((await put(putSubMerchants, { ids: ["x"] })).status).toBe(400);
    expect((await put(putSubMerchants, { ids: [subId], reason: "x" })).status).toBe(400);
    expect((await put(putSubMerchants, { ids: [subId] }, { params: Promise.resolve({ id: "actor" }) })).status).toBe(404);
    getServerSession.mockResolvedValue({ ...session, userId });
    expect((await put(putSubMerchants, { ids: [subId] })).status).toBe(403);
    expect(assignUserSubMerchants).not.toHaveBeenCalled();
  });

  it("answers 202 for a pending proposal and 200 with a null id for an applied narrowing", async () => {
    const pending = await put(putSubMerchants, { ids: [subId] });
    expect(pending.status).toBe(202);
    expect(await pending.json()).toMatchObject({ status: "PENDING_APPROVAL" });
    assignUserSubMerchants.mockResolvedValue(result("APPROVED", null));
    const applied = await put(putSubMerchants, { ids: [] });
    expect(applied.status).toBe(200);
    expect(await applied.json()).toMatchObject({ status: "APPROVED", id: null });
    expect(assignUserSubMerchants).toHaveBeenLastCalledWith(userId, []);
  });

  it("passes a BE refusal on without hiding the user behind a local lookup", async () => {
    assignUserSubMerchants.mockResolvedValue({ success: false, error: { status: 404, code: "RESOURCE_NOT_FOUND", message: "Không tìm thấy" } });
    expect((await put(putSubMerchants, { ids: [subId] })).status).toBe(404);
  });

  it("refuses merchants the session does not own, which is every merchant for a Sub-level manager", async () => {
    expect((await put(putMerchants, { ids: ["55555555-5555-4555-8555-555555555555"] })).status).toBe(403);
    getServerSession.mockResolvedValue({ ...session, merchantIds: [] });
    expect((await put(putMerchants, { ids: [merchantId] })).status).toBe(403);
    expect(assignUserMerchants).not.toHaveBeenCalled();
    expect((await put(putMerchants, { ids: [] })).status).toBe(202);
    expect((await put(putMerchants, { ids: [] })).status).toBe(202);
  });
});
