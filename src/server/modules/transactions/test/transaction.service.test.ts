import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { BE_TRANSACTION } from "@/features/transactions/test/transaction.fixtures";
import { listTransactions } from "../transaction.service";

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));

const base = "https://merchant.test";
const requests: URL[] = [];

beforeEach(() => {
  requests.length = 0;
  vi.stubEnv("MERCHANT_BASE_URL", base);
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  mswServer.use(
    http.get(`${base}/api/v1/merchant/transactions`, ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json({
        success: true,
        data: { content: [BE_TRANSACTION], totalElements: 1, totalPages: 1, number: 0, size: 10 },
      });
    }),
  );
});

afterEach(() => vi.unstubAllEnvs());

describe("listTransactions", () => {
  it("reads the merchant portal BE list and maps the page to rows and total", async () => {
    const result = await listTransactions({ page: 2, pageSize: 10 });

    expect(result).toEqual({ success: true, data: { rows: [BE_TRANSACTION], total: 1 } });
    expect(requests[0]!.searchParams.get("page")).toBe("2");
    expect(requests[0]!.searchParams.get("size")).toBe("10");
  });

  it("sends only the BE filters, never a merchant id: the BE scopes by the session", async () => {
    await listTransactions({
      page: 1,
      pageSize: 20,
      keyword: "FM26",
      status: "SUCCESS",
      paymentMethod: "QR",
      subMerchantId: BE_TRANSACTION.subMerchantId ?? undefined,
      createdFrom: "2026-11-01",
      createdTo: "2026-11-02",
    });

    const params = requests[0]!.searchParams;
    expect(Object.fromEntries(params)).toEqual({
      page: "1",
      size: "20",
      keyword: "FM26",
      status: "SUCCESS",
      paymentMethod: "QR",
      subMerchantId: BE_TRANSACTION.subMerchantId,
      createdFrom: "2026-11-01",
      createdTo: "2026-11-02",
    });
  });

  it("is never served from fixtures, even in fixture mode", async () => {
    vi.stubEnv("MERCHANT_API_MODE", "fixture");

    await listTransactions({ page: 1, pageSize: 10 });

    expect(requests).toHaveLength(1);
  });
});
