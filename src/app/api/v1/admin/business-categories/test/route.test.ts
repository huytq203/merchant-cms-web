import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listBusinessCategories } = vi.hoisted(() => ({ getServerSession: vi.fn(), listBusinessCategories: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/business-categories/business-category.service", () => ({ listBusinessCategories }));
import { GET } from "../route";

const data = [{ mccCode: "5812", name: "Nhà hàng, ăn uống" }];

beforeEach(() => {
  vi.clearAllMocks();
  listBusinessCategories.mockResolvedValue({ success: true, data });
});

describe("GET /api/v1/admin/business-categories", () => {
  it("returns 401 without a session and does not call the BE", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(listBusinessCategories).not.toHaveBeenCalled();
  });

  it("needs only a signed-in session, no specific permission", async () => {
    getServerSession.mockResolvedValue({ merchantIds: [], permissions: [] });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(data);
  });

  it("passes a BE failure through with its message", async () => {
    getServerSession.mockResolvedValue({ merchantIds: ["m"], permissions: [] });
    listBusinessCategories.mockResolvedValue({ success: false, error: { status: 500, message: "Lỗi hệ thống", code: "X" } });
    const response = await GET();
    expect(response.status).toBeGreaterThanOrEqual(500);
    expect((await response.json()).message).toBe("Lỗi hệ thống");
  });
});
