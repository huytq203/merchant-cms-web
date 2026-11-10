import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { SUB_ID, OP_ORDER, movementPage, orderDetail, orderMovement } from "@/features/sub-balances/test/movement-fixtures";
import { getSubBalanceMovement, listSubBalanceMovements } from "../sub-balance.service";

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));

const base = "https://merchant.test";
const requests: URL[] = [];

beforeEach(() => {
  requests.length = 0;
  vi.stubEnv("MERCHANT_BASE_URL", base);
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  mswServer.use(
    http.get(`${base}/api/v1/merchant/sub-balances/:id/movements`, ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json(movementPage([orderMovement], 37));
    }),
    http.get(`${base}/api/v1/merchant/sub-balances/:id/movements/:op`, () => HttpResponse.json({ success: true, data: orderDetail })),
  );
});
afterEach(() => vi.unstubAllEnvs());

describe("listSubBalanceMovements", () => {
  it("maps the Spring page to rows and total and forwards the filters", async () => {
    const result = await listSubBalanceMovements(SUB_ID, { type: "ORDER", fromDate: "2026-11-04", toDate: "2026-11-10", page: 1, size: 20 });
    expect(result).toEqual({ success: true, data: { rows: [orderMovement], total: 37 } });
    const query = requests[0]!.searchParams;
    expect([query.get("type"), query.get("fromDate"), query.get("toDate"), query.get("page"), query.get("size")]).toEqual(["ORDER", "2026-11-04", "2026-11-10", "1", "20"]);
  });

  it("leaves out an unset date instead of sending an empty value", async () => {
    await listSubBalanceMovements(SUB_ID, { type: "ALL", page: 1, size: 20 });
    expect(requests[0]!.searchParams.has("fromDate")).toBe(false);
    expect(requests[0]!.searchParams.has("toDate")).toBe(false);
  });

  it("returns the BE failure as a result, not a throw", async () => {
    mswServer.use(http.get(`${base}/api/v1/merchant/sub-balances/:id/movements`, () => HttpResponse.json({ success: false, message: "x" }, { status: 503 })));
    const result = await listSubBalanceMovements(SUB_ID, { type: "ALL", page: 1, size: 20 });
    expect(result.success).toBe(false);
  });
});

describe("getSubBalanceMovement", () => {
  it("parses the detail with its generic lines and link", async () => {
    const result = await getSubBalanceMovement(SUB_ID, OP_ORDER);
    expect(result.success && result.data.lines).toHaveLength(5);
    expect(result.success && result.data.link?.type).toBe("ORDER");
  });
});
