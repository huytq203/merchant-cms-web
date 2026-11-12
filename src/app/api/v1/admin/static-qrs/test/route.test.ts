import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listStaticQrs, createStaticQr } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listStaticQrs: vi.fn(),
  createStaticQr: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/customer-display/customer-display.service", () => ({ listStaticQrs, createStaticQr }));
import { GET, POST } from "../route";

const sub = "55555555-5555-4555-8555-555555555555";
const otherSub = "66666666-6666-4666-8666-666666666666";
const terminal = "77777777-7777-4777-8777-777777777777";
const session = (permissions: string[]) => ({ merchantIds: ["m"], subMerchantIds: [sub], permissions });
const list = (query: string) => GET(new NextRequest(`http://localhost/api/v1/admin/static-qrs?${query}`));
const create = (body: unknown) => POST(new Request("http://localhost", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session(["VIEW_TERMINAL", "MANAGE_TERMINAL"]));
  listStaticQrs.mockResolvedValue({ success: true, data: [] });
  createStaticQr.mockResolvedValue({ success: true, data: { id: "x" } });
});

describe("GET static-qrs", () => {
  it("needs a terminal read permission", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_ORDER"]));
    expect((await list(`subMerchantId=${sub}`)).status).toBe(403);
  });

  it("needs a Sub inside the session scope", async () => {
    expect((await list("")).status).toBe(400);
    expect((await list(`subMerchantId=${otherSub}`)).status).toBe(403);
    expect(listStaticQrs).not.toHaveBeenCalled();
  });

  it("lists by Sub and optional Terminal", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_TERMINAL"]));
    expect((await list(`subMerchantId=${sub}&terminalId=${terminal}`)).status).toBe(200);
    expect(listStaticQrs).toHaveBeenCalledWith({ subMerchantId: sub, terminalId: terminal });
  });
});

describe("POST static-qrs", () => {
  it("needs MANAGE_TERMINAL", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_TERMINAL"]));
    expect((await create({ subMerchantId: sub })).status).toBe(403);
    expect(createStaticQr).not.toHaveBeenCalled();
  });

  it("refuses a Sub outside the scope and a bad body", async () => {
    expect((await create({ subMerchantId: otherSub })).status).toBe(403);
    expect((await create({ subMerchantId: "nope" })).status).toBe(400);
    expect(createStaticQr).not.toHaveBeenCalled();
  });

  it("creates a code for a Sub or a Terminal of it", async () => {
    const response = await create({ subMerchantId: sub, terminalId: terminal });
    expect(response.status).toBe(201);
    expect(createStaticQr).toHaveBeenCalledWith({ subMerchantId: sub, terminalId: terminal });
  });
});
