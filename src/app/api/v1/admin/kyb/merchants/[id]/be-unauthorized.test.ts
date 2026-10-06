import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getMerchant } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getMerchant: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/kyb/kyb.service", () => ({ getMerchant, updateMerchant: vi.fn() }));
import { GET } from "./route";

const unauthorized = { success: false, error: { status: 401, code: "HTTP_401", message: "Phiên đăng nhập đã hết hạn" } };
const id = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [id], subMerchantIds: [], permissions: [] });
  getMerchant.mockResolvedValue(unauthorized);
});

describe("kyb merchant route when the BE chain answers 401", () => {
  it("answers 403, never 401, so the browser does not end the session", async () => {
    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(403);
  });
});
