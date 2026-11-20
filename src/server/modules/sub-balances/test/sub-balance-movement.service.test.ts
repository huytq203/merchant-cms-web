import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import {
  SUB_ID, OP_ORDER, movementPage, movementTotals, orderDetail, orderMovement, setoffWithdrawalMovement,
} from "@/features/sub-balances/test/movement-fixtures";
import { exportSubBalanceMovements, getSubBalanceMovement, listSubBalanceMovements } from "../sub-balance.service";

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
    // A BE without period totals yet: no summary, the strip stays hidden.
    expect(result).toEqual({ success: true, data: { rows: [orderMovement], total: 37, summary: null } });
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

describe("listSubBalanceMovements period totals", () => {
  it("passes the period totals and the setoff of a withdrawal row through", async () => {
    mswServer.use(http.get(`${base}/api/v1/merchant/sub-balances/:id/movements`,
      () => HttpResponse.json(movementPage([setoffWithdrawalMovement], 1, 0, movementTotals))));
    const result = await listSubBalanceMovements(SUB_ID, { type: "ALL", page: 1, size: 20 });
    expect(result.success && result.data.summary).toEqual(movementTotals);
    expect(result.success && result.data.rows[0]?.setoffAmount).toBe(1_000_000);
  });

  it("keeps the opening and closing balance when the period is too long to add up", async () => {
    mswServer.use(http.get(`${base}/api/v1/merchant/sub-balances/:id/movements`, () => HttpResponse.json(movementPage([], 0, 0,
      { openingBalance: 10, totalIn: null, totalOut: null, closingBalance: 99, totalsComplete: false }))));
    const result = await listSubBalanceMovements(SUB_ID, { type: "ALL", page: 1, size: 20 });
    expect(result.success && result.data.summary).toEqual({ openingBalance: 10, totalIn: null, totalOut: null, closingBalance: 99, totalsComplete: false });
  });
});

describe("getSubBalanceMovement", () => {
  it("parses the detail with its generic lines and link", async () => {
    const result = await getSubBalanceMovement(SUB_ID, OP_ORDER);
    expect(result.success && result.data.lines).toHaveLength(5);
    expect(result.success && result.data.link?.type).toBe("ORDER");
  });
});

describe("pocket (thu-chi hộ khác)", () => {
  it("listPassesPocket: sends pocket to the BE only when chosen", async () => {
    await listSubBalanceMovements(SUB_ID, { type: "DISBURSEMENT", pocket: "OTHER", page: 1, size: 20 });
    expect(requests[0]!.searchParams.get("pocket")).toBe("OTHER");
    expect(requests[0]!.searchParams.get("type")).toBe("DISBURSEMENT");
    await listSubBalanceMovements(SUB_ID, { type: "ALL", page: 1, size: 20 });
    expect(requests[1]!.searchParams.has("pocket")).toBe(false);
  });

  it("detailPassesPocket", async () => {
    const seen: URL[] = [];
    mswServer.use(http.get(`${base}/api/v1/merchant/sub-balances/:id/movements/:op`, ({ request }) => {
      seen.push(new URL(request.url));
      return HttpResponse.json({ success: true, data: orderDetail });
    }));
    await getSubBalanceMovement(SUB_ID, OP_ORDER, "OTHER");
    await getSubBalanceMovement(SUB_ID, OP_ORDER);
    expect(seen[0]!.searchParams.get("pocket")).toBe("OTHER");
    expect(seen[1]!.searchParams.has("pocket")).toBe(false);
  });
});

describe("exportSubBalanceMovements", () => {
  const csv = "\uFEFFThời gian,Loại\r\n10/11/2026 07:05,Chi hộ\r\n";
  const exportUrl = `${base}/api/v1/merchant/sub-balances/:id/movements/export`;

  it("exportRoutePassesFilters: forwards pocket, type and the date range to the BE export and keeps its bytes and headers", async () => {
    const seen: URL[] = [];
    mswServer.use(http.get(exportUrl, ({ request }) => {
      seen.push(new URL(request.url));
      return new HttpResponse(csv, { headers: { "Content-Type": "text/csv;charset=UTF-8", "Content-Disposition": 'attachment; filename="bien-dong-thu-chi-ho-khac-SUB001-202611191200.csv"' } });
    }));
    const result = await exportSubBalanceMovements(SUB_ID, { type: "DISBURSEMENT", pocket: "OTHER", fromDate: "2026-11-01", toDate: "2026-11-10" });
    const query = seen[0]!.searchParams;
    expect(seen[0]!.pathname).toBe(`/api/v1/merchant/sub-balances/${SUB_ID}/movements/export`);
    expect([query.get("pocket"), query.get("type"), query.get("fromDate"), query.get("toDate")]).toEqual(["OTHER", "DISBURSEMENT", "2026-11-01", "2026-11-10"]);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(new TextDecoder("utf-8", { ignoreBOM: true }).decode(result.data.body)).toBe(csv);
    expect(result.data.contentType).toContain("text/csv");
    expect(result.data.contentDisposition).toContain("bien-dong-thu-chi-ho-khac-SUB001");
  });

  it("exportBackendErrorKeepsVietnameseMessage: 6334 and the 93-day rule come back as failures with the BE sentence", async () => {
    mswServer.use(http.get(exportUrl, () => HttpResponse.json(
      { success: false, errorCode: "6334", message: "Kết quả vượt 10.000 dòng, vui lòng thu hẹp khoảng thời gian" }, { status: 400 })));
    const tooLarge = await exportSubBalanceMovements(SUB_ID, { type: "ALL", fromDate: "2026-11-01", toDate: "2026-11-10" });
    expect(!tooLarge.success && tooLarge.error).toMatchObject({ status: 400, code: "6334", message: "Kết quả vượt 10.000 dòng, vui lòng thu hẹp khoảng thời gian" });
    mswServer.use(http.get(exportUrl, () => HttpResponse.json(
      { success: false, errorCode: "VALIDATION_ERROR", message: "Khoảng thời gian xuất tối đa 93 ngày" }, { status: 400 })));
    const range = await exportSubBalanceMovements(SUB_ID, { type: "ALL", fromDate: "2026-01-01", toDate: "2026-11-10" });
    expect(!range.success && range.error.message).toBe("Khoảng thời gian xuất tối đa 93 ngày");
  });
});
