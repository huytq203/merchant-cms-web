import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { post, get } = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));
vi.mock("@/lib/be/services", () => ({ merchantClient: () => ({ post, get }) }));
import {
  createOrderDisplay,
  createStaticQr,
  createStaticQrDisplay,
  getDisplayStatus,
  rotateStaticQr,
} from "../customer-display.service";

const order = {
  id: "33333333-3333-4333-8333-333333333333",
  merchantId: "22222222-2222-4222-8222-222222222222",
  orderCode: "DH-1",
  amount: 150000,
  currency: "VND",
  status: "ACTIVE",
  subMerchantName: "Halo tech",
  terminalName: "Quầy 01",
  qrCode: "000201VCB",
  expiredAt: "2026-11-12T10:15:00",
} as const;
const sub = "55555555-5555-4555-8555-555555555555";

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("live mode", () => {
  beforeEach(() => vi.stubEnv("MERCHANT_API_MODE", "live"));

  it("fills kind from the endpoint until the BE sends it", async () => {
    post.mockResolvedValue({ success: true, data: { displayToken: "t", shop: { merchantName: "M" } } });
    expect(await createStaticQrDisplay("88888888-8888-4888-8888-888888888888")).toMatchObject({ data: { kind: "STATIC_QR" } });
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ path: "/api/v1/merchant/static-qrs/88888888-8888-4888-8888-888888888888/customer-display" }));
  });

  it("calls the BE order and public status paths", async () => {
    post.mockResolvedValue({ success: true, data: {} });
    get.mockResolvedValue({ success: true, data: {} });
    await createOrderDisplay(order);
    await getDisplayStatus("tok.1");
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ path: `/api/v1/merchant/orders/${order.id}/customer-display` }));
    expect(get).toHaveBeenCalledWith(expect.objectContaining({ path: "/public/v1/customer-display/tok.1/status", auth: false }));
  });
});

describe("fixture mode", () => {
  beforeEach(() => {
    vi.stubEnv("MERCHANT_API_MODE", "fixture");
    vi.stubEnv("NODE_ENV", "development");
  });

  it("never calls the BE and adds the customer fee to the payable amount", async () => {
    vi.stubEnv("CUSTOMER_DISPLAY_FIXTURE_FEE", "2200");
    const result = await createOrderDisplay(order);
    expect(post).not.toHaveBeenCalled();
    expect(result.success && result.data).toMatchObject({ kind: "ORDER", amount: 150000, fee: 2200, feeBearer: "SENDER", payableAmount: 152200, qrPayload: "000201VCB" });
  });

  it("turns an order paid after the configured delay", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-12T03:00:00Z") });
    vi.stubEnv("CUSTOMER_DISPLAY_FIXTURE_PAY_AFTER_MS", "5000");
    const created = await createOrderDisplay(order);
    const token = created.success ? created.data.displayToken : "";
    expect(await getDisplayStatus(token)).toMatchObject({ data: { status: "WAITING" } });
    vi.advanceTimersByTime(5000);
    expect(await getDisplayStatus(token)).toMatchObject({ data: { status: "PAID", paidAmount: 150000 } });
  });

  it("answers 404 for an unknown token", async () => {
    expect(await getDisplayStatus("unknown")).toMatchObject({ success: false, error: { status: 404 } });
  });

  it("keeps one active static code per scope and rotates to a new version", async () => {
    const first = await createStaticQr({ subMerchantId: sub });
    expect(first.success && first.data.qrPayload).toMatch(/VN\.FLEXPAY.*6304[0-9A-F]{4}$/);
    const id = first.success ? first.data.id : "";
    const rotated = await rotateStaticQr(id);
    expect(rotated.success && rotated.data).toMatchObject({ status: "ACTIVE", version: 2 });
    expect(await rotateStaticQr(id)).toMatchObject({ success: false });
  });

  it("reports a static payment inside the 10 second window only", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-12T03:00:00Z") });
    const qr = await createStaticQr({ subMerchantId: sub });
    const display = await createStaticQrDisplay(qr.success ? qr.data.id : "");
    const token = display.success ? display.data.displayToken : "";
    expect(await getDisplayStatus(token)).toMatchObject({ data: { status: "WAITING" } });
    vi.advanceTimersByTime(16_000);
    expect(await getDisplayStatus(token)).toMatchObject({ data: { status: "PAID" } });
    vi.advanceTimersByTime(10_000);
    expect(await getDisplayStatus(token)).toMatchObject({ data: { status: "WAITING" } });
  });
});
