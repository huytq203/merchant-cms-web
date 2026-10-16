import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listTerminals, getTerminal } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listTerminals: vi.fn(),
  getTerminal: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/terminals/terminal.service", () => ({ listTerminals, getTerminal }));
import { GET as list } from "../route";
import { GET as detail } from "../[id]/route";

const unauthorized = { success: false, error: { status: 401, code: "HTTP_401", message: "Phiên đăng nhập đã hết hạn" } };
const id = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [], subMerchantIds: [], permissions: ["MANAGE_TERMINAL"] });
  listTerminals.mockResolvedValue(unauthorized);
  getTerminal.mockResolvedValue(unauthorized);
});

describe("terminal routes when the BE chain answers 401", () => {
  it("answers 403, never 401, so the browser does not end the session", async () => {
    const listed = await list(new Request("http://localhost/api/v1/admin/terminals"));
    const read = await detail(new Request("http://localhost"), { params: Promise.resolve({ id }) });
    expect(listed.status).toBe(403);
    expect(read.status).toBe(403);
    expect((await read.json()).message).not.toBe("Phiên đăng nhập đã hết hạn");
  });
});
