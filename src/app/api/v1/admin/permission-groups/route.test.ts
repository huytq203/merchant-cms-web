import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listPermissionGroups, createPermissionGroup } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listPermissionGroups: vi.fn(),
  createPermissionGroup: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/permissions/permission.service", () => ({ listPermissionGroups, createPermissionGroup }));
import { GET, POST } from "./route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const values = { code: "GROUP_1", name: "Nhóm", description: "", permissions: ["VIEW_ORDER"] };
const request = (query = "") => new Request(`http://localhost/api/v1/admin/permission-groups${query}`);

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId], permissions: ["MANAGE_PERMISSION_GROUP"] });
  listPermissionGroups.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
  createPermissionGroup.mockResolvedValue({ success: true, data: { id: "group" } });
});

describe("permission group collection route", () => {
  it("returns 401 before service without a session", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(401);
    expect(listPermissionGroups).not.toHaveBeenCalled();
  });

  it("returns 403 before service without permission", async () => {
    getServerSession.mockResolvedValue({ merchantIds: [merchantId], permissions: [] });
    expect((await GET(request())).status).toBe(403);
    expect(listPermissionGroups).not.toHaveBeenCalled();
  });

  it.each(["?page=0", "?pageSize=101", "?pageSize=abc", `?keyword=${"x".repeat(101)}`])(
    "rejects invalid list query %s before calling the service",
    async (query) => {
      expect((await GET(request(query))).status).toBe(400);
      expect(listPermissionGroups).not.toHaveBeenCalled();
    },
  );

  it("uses a merchant from the session", async () => {
    expect((await GET(request("?page=2"))).status).toBe(200);
    expect(listPermissionGroups).toHaveBeenCalledWith({ merchantId, page: 2, pageSize: 10 });
  });

  it("rejects a requested merchant outside the session", async () => {
    expect((await GET(request("?merchantId=other"))).status).toBe(403);
    expect(listPermissionGroups).not.toHaveBeenCalled();
  });

  it("creates with the session merchant", async () => {
    const response = await POST(new Request(request().url, { method: "POST", body: JSON.stringify(values) }));
    expect(response.status).toBe(201);
    expect(createPermissionGroup).toHaveBeenCalledWith(values, merchantId);
  });
});
