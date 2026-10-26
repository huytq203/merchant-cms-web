import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listAssignableGroups } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listAssignableGroups: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/users/user.service", () => ({ listAssignableGroups, getUser: vi.fn() }));
import { GET } from "../route";

const groups = [{ id: "11111111-1111-4111-8111-111111111111", code: "OPS", name: "Vận hành", system: true, permissions: ["VIEW_ORDER"] }];
const session = { userId: "actor", permissions: ["MANAGE_USER"], merchantIds: [], subMerchantIds: [] };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session);
  listAssignableGroups.mockResolvedValue({ success: true, data: groups });
});

describe("assignable groups route", () => {
  it("needs only MANAGE_USER, not MANAGE_PERMISSION_GROUP, and no merchant of its own", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(groups);
  });

  it("answers 401 without a session and 403 without MANAGE_USER", async () => {
    getServerSession.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...session, permissions: ["MANAGE_PERMISSION_GROUP"] });
    expect((await GET()).status).toBe(401);
    expect((await GET()).status).toBe(403);
    expect(listAssignableGroups).not.toHaveBeenCalled();
  });

  it("passes an empty list through", async () => {
    listAssignableGroups.mockResolvedValue({ success: true, data: [] });
    expect(await (await GET()).json()).toEqual([]);
  });
});
