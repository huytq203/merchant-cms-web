import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getUser, lockUser } = vi.hoisted(() => ({ getServerSession: vi.fn(), getUser: vi.fn(), lockUser: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/users/user.service", () => ({ getUser, lockUser }));
import { POST } from "../route";

const id = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";
const request = () => new Request(`http://localhost/api/v1/admin/merchant-users/${id}/lock`, { method: "POST", body: JSON.stringify({ reason: "Valid lock reason" }) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ userId: id, permissions: ["MANAGE_USER"], merchantIds: [merchantId] });
  getUser.mockResolvedValue({ success: true, data: { id, status: "ACTIVE", merchantIds: [merchantId] } });
});

describe("lock route", () => {
  it("rejects self lock without contacting the BE lock endpoint", async () => {
    expect((await POST(request(), { params: Promise.resolve({ id }) })).status).toBe(403);
    expect(lockUser).not.toHaveBeenCalled();
  });

  it("rejects an invalid reason", async () => {
    getServerSession.mockResolvedValue({ userId: "actor", permissions: ["MANAGE_USER"], merchantIds: [merchantId] });
    const invalid = new Request(`http://localhost/api/v1/admin/merchant-users/${id}/lock`, { method: "POST", body: JSON.stringify({ reason: "short" }) });
    expect((await POST(invalid, { params: Promise.resolve({ id }) })).status).toBe(400);
    expect(lockUser).not.toHaveBeenCalled();
  });

  it("translates the last-administrator response into an actionable Vietnamese message", async () => {
    getServerSession.mockResolvedValue({ userId: "actor", permissions: ["MANAGE_USER"], merchantIds: [merchantId] });
    lockUser.mockResolvedValue({
      success: false,
      error: { status: 403, code: "FORBIDDEN", message: "Cannot lock the last merchant administrator" },
    });

    const response = await POST(request(), { params: Promise.resolve({ id }) });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      message: "Không thể khoá quản trị viên cuối cùng. Hãy gán quyền quản trị cho người khác trước.",
    });
  });
});
