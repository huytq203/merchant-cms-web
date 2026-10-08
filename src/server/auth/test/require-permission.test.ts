import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
import { requirePermission } from "../require-permission";

const user = { merchantIds: ["m1"], permissions: ["MANAGE_USER"] };

async function statusOf(promise: ReturnType<typeof requirePermission>) {
  const result = await promise;
  return result.ok ? 200 : result.response.status;
}

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(user);
});

describe("requirePermission", () => {
  it("trả 401 khi chưa đăng nhập", async () => {
    getServerSession.mockResolvedValue(null);
    expect(await statusOf(requirePermission("MANAGE_USER"))).toBe(401);
  });

  it("trả 403 khi thiếu quyền", async () => {
    expect(await statusOf(requirePermission("MANAGE_SUB_MERCHANT"))).toBe(403);
  });

  it("trả user khi đủ quyền", async () => {
    const result = await requirePermission("MANAGE_USER");
    expect(result).toEqual({ ok: true, user });
  });

  it("chỉ cần session khi không truyền quyền", async () => {
    getServerSession.mockResolvedValue({ ...user, permissions: [] });
    expect(await statusOf(requirePermission())).toBe(200);
  });

  it("trả 403 khi yêu cầu merchant mà session không có", async () => {
    getServerSession.mockResolvedValue({ ...user, merchantIds: [] });
    expect(await statusOf(requirePermission("MANAGE_USER", { requireMerchant: true }))).toBe(403);
  });

  it("cho qua session không có merchant khi không yêu cầu", async () => {
    getServerSession.mockResolvedValue({ ...user, merchantIds: [] });
    expect(await statusOf(requirePermission("MANAGE_USER"))).toBe(200);
  });
});
