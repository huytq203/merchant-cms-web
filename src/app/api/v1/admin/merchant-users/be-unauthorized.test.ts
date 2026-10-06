import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listUsers, getUser } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listUsers: vi.fn(),
  getUser: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/users/user.service", () => ({ listUsers, getUser, createUser: vi.fn(), updateUser: vi.fn() }));
vi.mock("@/server/modules/permissions/permission.service", () => ({ getPermissionGroup: vi.fn() }));
import { GET as list } from "./route";
import { GET as detail } from "./[id]/route";

const unauthorized = { success: false, error: { status: 401, code: "HTTP_401", message: "Phiên đăng nhập đã hết hạn" } };
const id = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ userId: "actor", merchantIds: [merchantId], subMerchantIds: [], permissions: ["MANAGE_USER"] });
  listUsers.mockResolvedValue(unauthorized);
  getUser.mockResolvedValue(unauthorized);
});

describe("merchant user routes when the BE chain answers 401", () => {
  it("answers 403, never 401, so the browser does not end the session", async () => {
    const listed = await list(new Request("http://localhost/api/v1/admin/merchant-users"));
    const read = await detail(new Request("http://localhost"), { params: Promise.resolve({ id }) });
    expect([listed.status, read.status]).toEqual([403, 403]);
  });
});
