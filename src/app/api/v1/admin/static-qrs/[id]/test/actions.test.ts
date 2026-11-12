import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getStaticQr, disableStaticQr, rotateStaticQr, createStaticQrDisplay } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getStaticQr: vi.fn(),
  disableStaticQr: vi.fn(),
  rotateStaticQr: vi.fn(),
  createStaticQrDisplay: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/customer-display/customer-display.service", () => ({
  getStaticQr,
  disableStaticQr,
  rotateStaticQr,
  createStaticQrDisplay,
}));
import { POST as disable } from "../disable/route";
import { POST as rotate } from "../rotate/route";
import { POST as display } from "../customer-display/route";

const id = "88888888-8888-4888-8888-888888888888";
const sub = "55555555-5555-4555-8555-555555555555";
const qr = { id, subMerchantId: sub, code: "SQABCDEFGHIJ", qrPayload: "000201", status: "ACTIVE" };
const session = (permissions: string[]) => ({ merchantIds: ["m"], subMerchantIds: [sub], permissions });
const ctx = (routeId = id) => ({ params: Promise.resolve({ id: routeId }) });
const post = (body?: unknown) => new Request("http://localhost", { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session(["VIEW_TERMINAL", "MANAGE_TERMINAL"]));
  getStaticQr.mockResolvedValue({ success: true, data: qr });
  disableStaticQr.mockResolvedValue({ success: true, data: { ...qr, status: "DISABLED" } });
  rotateStaticQr.mockResolvedValue({ success: true, data: { ...qr, id: "new" } });
  createStaticQrDisplay.mockResolvedValue({ success: true, data: { displayToken: "t" } });
});

describe("static QR actions", () => {
  it("disable and rotate need MANAGE_TERMINAL; display only needs read", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_TERMINAL"]));
    expect((await disable(post({ reason: "Mã in trên quầy bị lộ" }), ctx())).status).toBe(403);
    expect((await rotate(post(), ctx())).status).toBe(403);
    expect((await display(post(), ctx())).status).toBe(200);
  });

  it.each([["CREATE_ORDER"], ["VIEW_ORDER"], ["MANAGE_TERMINAL"]])("lets %s open the static display without reading the code first", async (permission) => {
    getServerSession.mockResolvedValue(session([permission]));
    expect((await display(post(), ctx())).status).toBe(200);
    expect(getStaticQr).not.toHaveBeenCalled();
    expect(createStaticQrDisplay).toHaveBeenCalledWith(id);
  });

  it("refuses the static display without any order or terminal permission", async () => {
    getServerSession.mockResolvedValue(session(["VIEW_BALANCE"]));
    expect((await display(post(), ctx())).status).toBe(403);
    expect(createStaticQrDisplay).not.toHaveBeenCalled();
  });

  it("passes BE scope (404) and disabled-code (409) refusals of the display on", async () => {
    createStaticQrDisplay.mockResolvedValueOnce({ success: false, error: { status: 404, code: "NOT_FOUND", message: "x" } });
    expect((await display(post(), ctx())).status).toBe(404);
    createStaticQrDisplay.mockResolvedValueOnce({ success: false, error: { status: 409, code: "6314", message: "Mã QR tĩnh đã tắt" } });
    expect((await display(post(), ctx())).status).toBe(409);
  });

  it("hides a code of a Sub outside the scope", async () => {
    getStaticQr.mockResolvedValue({ success: true, data: { ...qr, subMerchantId: "66666666-6666-4666-8666-666666666666" } });
    expect((await rotate(post(), ctx())).status).toBe(404);
    expect(rotateStaticQr).not.toHaveBeenCalled();
  });

  it("answers 404 for a non-UUID id", async () => {
    expect((await display(post(), ctx("..%2Fx"))).status).toBe(404);
    expect(createStaticQrDisplay).not.toHaveBeenCalled();
  });

  it("disable requires a reason", async () => {
    const response = await disable(post({ reason: "  " }), ctx());
    expect(response.status).toBe(400);
    expect(disableStaticQr).not.toHaveBeenCalled();
  });

  it("disables with the reason", async () => {
    expect((await disable(post({ reason: "Mã in trên quầy bị lộ" }), ctx())).status).toBe(200);
    expect(disableStaticQr).toHaveBeenCalledWith(id, "Mã in trên quầy bị lộ");
  });

  it("refuses to act on a disabled code", async () => {
    getStaticQr.mockResolvedValue({ success: true, data: { ...qr, status: "DISABLED" } });
    expect((await rotate(post(), ctx())).status).toBe(409);
    expect((await disable(post({ reason: "Mã in trên quầy bị lộ" }), ctx())).status).toBe(409);
  });

  it("rotates and opens the display for an active code", async () => {
    expect(await (await rotate(post(), ctx())).json()).toMatchObject({ id: "new" });
    expect(await (await display(post(), ctx())).json()).toMatchObject({ displayToken: "t" });
    expect(createStaticQrDisplay).toHaveBeenCalledWith(id);
  });
});
