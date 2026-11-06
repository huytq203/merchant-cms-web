import { beforeEach, describe, expect, it, vi } from "vitest";

const { listAssignableGroups } = vi.hoisted(() => ({ listAssignableGroups: vi.fn() }));
vi.mock("../user.service", () => ({ getUser: vi.fn(), listAssignableGroups }));
import { requireGroupScope } from "../require-user-access";

const groupId = "11111111-1111-4111-8111-111111111111";

beforeEach(() => vi.clearAllMocks());

describe("requireGroupScope", () => {
  it("does not call the BE for an empty list, so groups can be cleared while the list is down", async () => {
    expect(await requireGroupScope([])).toBeNull();
    expect(listAssignableGroups).not.toHaveBeenCalled();
  });

  it("allows only ids the BE lists as assignable", async () => {
    listAssignableGroups.mockResolvedValue({ success: true, data: [{ id: groupId }] });
    expect(await requireGroupScope([groupId])).toBeNull();
    expect((await requireGroupScope(["22222222-2222-4222-8222-222222222222"]))?.status).toBe(403);
  });
});
