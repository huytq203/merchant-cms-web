import { describe, expect, it } from "vitest";
import {
  parseOrderSearchParams,
  toExportBody,
  toOrderSearchParams,
  toSearchBody,
} from "../disbursement-filter-mapper";

const SUB_A = "11111111-1111-4111-8111-111111111111";
const SUB_B = "22222222-2222-4222-8222-222222222222";
const BATCH = "55555555-5555-4555-8555-555555555555";

describe("filtersMapToSearchBody", () => {
  it("maps every UI filter to the field the BE search expects", () => {
    const body = toSearchBody({
      page: 3,
      pageSize: 20,
      code: "  P261119  ",
      subMerchantIds: [SUB_A, SUB_B],
      channel: "BATCH",
      status: "PENDING_APPROVAL",
      bankCode: "VCB",
      amountFrom: 1_000,
      amountTo: 9_000,
      createdFrom: "2026-11-01",
      createdTo: "2026-11-19",
      succeededFrom: "2026-11-02",
      succeededTo: "2026-11-18",
      batchId: BATCH,
    });
    expect(body).toEqual({
      subIds: [SUB_A, SUB_B],
      filter: {
        code: "P261119",
        channels: ["BATCH"],
        statuses: ["PENDING_APPROVAL"],
        bankCodes: ["VCB"],
        amountFrom: 1_000,
        amountTo: 9_000,
        createdFrom: "2026-11-01",
        createdTo: "2026-11-19",
        succeededFrom: "2026-11-02",
        succeededTo: "2026-11-18",
        batchId: BATCH,
      },
      // URL đánh số trang từ 1, BE từ 0.
      page: 2,
      size: 20,
    });
  });

  it("omits everything that is not set, so BE scopes the list by the session alone", () => {
    expect(toSearchBody({ page: 1, pageSize: 10 })).toEqual({ filter: {}, page: 0, size: 10 });
  });

  it("exportSendsSameFilters: the export body is the search body without paging", () => {
    const filter = { page: 4, pageSize: 50, code: "X1", status: "SUCCEEDED" as const, subMerchantIds: [SUB_A] };
    const { page: _page, size: _size, ...search } = toSearchBody(filter);
    void _page;
    void _size;
    expect(toExportBody(filter)).toEqual(search);
  });
});

describe("URL round trip", () => {
  it("parses and rebuilds the page URL", () => {
    const raw = {
      page: "2", pageSize: "20", code: "P1", subMerchantIds: `${SUB_A},${SUB_B}`, channel: "API", status: "FAILED",
      bankCode: "VPB", amountFrom: "100", amountTo: "500", createdFrom: "2026-11-01", createdTo: "2026-11-05", batchId: BATCH,
    };
    const filter = parseOrderSearchParams(raw);
    expect(filter).toMatchObject({
      page: 2, pageSize: 20, code: "P1", subMerchantIds: [SUB_A, SUB_B], channel: "API", status: "FAILED",
      bankCode: "VPB", amountFrom: 100, amountTo: 500, createdFrom: "2026-11-01", createdTo: "2026-11-05", batchId: BATCH,
    });
    expect(Object.fromEntries(toOrderSearchParams(filter))).toMatchObject({ page: "2", status: "FAILED", channel: "API", amountFrom: "100" });
  });

  it("drops unknown or malformed values instead of forwarding them", () => {
    const filter = parseOrderSearchParams({
      page: "-1", pageSize: "9999", status: "HACKED", channel: "FAX", amountFrom: "abc", createdFrom: "yesterday",
      batchId: "../x", subMerchantIds: "not-a-uuid", code: "x".repeat(300),
    });
    expect(filter).toEqual({ page: 1, pageSize: 10, code: "x".repeat(100) });
  });

  it("keeps a reversed amount range so the form can report it", () => {
    expect(parseOrderSearchParams({ amountFrom: "900", amountTo: "100" })).toMatchObject({ amountFrom: 900, amountTo: 100 });
  });
});
