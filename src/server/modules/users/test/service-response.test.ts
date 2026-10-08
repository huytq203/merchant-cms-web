import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/require-permission", () => ({ requirePermission: vi.fn() }));
vi.mock("@/server/modules/permissions/permission.service", () => ({ getPermissionGroup: vi.fn() }));
vi.mock("../user.service", () => ({ getUser: vi.fn() }));
import { serviceResponse } from "../require-user-access";

describe("serviceResponse", () => {
  it("forwards the BE message URI-encoded so Vietnamese text is a legal header", () => {
    const response = serviceResponse({ success: true, data: { id: "1" }, message: "Đã cập nhật" });
    expect(decodeURIComponent(response.headers.get("X-Api-Message") ?? "")).toBe("Đã cập nhật");
  });

  it("adds no header when the BE sent no message", () => {
    expect(serviceResponse({ success: true, data: {} }).headers.has("X-Api-Message")).toBe(false);
  });
});
