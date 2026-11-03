import { describe, expect, it } from "vitest";
import { filterToFormValues, formValuesToFilter, toBeComplaintQuery } from "../complaint-filter";

const SUB = "44444444-4444-4444-8444-444444444444";

describe("formValuesToFilter", () => {
  it("drops empty and unknown values and restarts at the first page", () => {
    expect(formValuesToFilter({ status: "pending", waitingOn: "", reporterType: "BANK", subMerchantId: "SM01" }, 20)).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it("keeps every BE filter with its contract value", () => {
    expect(
      formValuesToFilter({ status: "PROCESSING", waitingOn: "MERCHANT", reporterType: "ADMIN", subMerchantId: SUB }, 10),
    ).toEqual({ page: 1, pageSize: 10, status: "PROCESSING", waitingOn: "MERCHANT", reporterType: "ADMIN", subMerchantId: SUB });
  });

  it("keeps a trimmed complaint or transaction code search", () => {
    expect(formValuesToFilter({ keyword: "  KN2611  " }, 10)).toMatchObject({ keyword: "KN2611" });
  });

  it("writes the picked calendar days as yyyy-MM-dd", () => {
    const filter = formValuesToFilter({ createdFrom: new Date(2026, 8, 1), createdTo: new Date(2026, 8, 3, 23, 30) }, 10);
    expect(filter).toMatchObject({ createdFrom: "2026-09-01", createdTo: "2026-09-03" });
  });
});

describe("filterToFormValues", () => {
  it("restores the form from the URL filter", () => {
    const values = filterToFormValues({ page: 1, pageSize: 10, reporterType: "USER", createdFrom: "2026-09-01" });
    expect(values.reporterType).toBe("USER");
    expect(values.createdFrom).toEqual(new Date(2026, 8, 1));
    expect(values.createdTo).toBeNull();
    expect(values.status).toBe("");
  });
});

describe("toBeComplaintQuery", () => {
  const filter = { page: 3, pageSize: 50, keyword: "KN", status: "CLOSED" as const, createdTo: "2026-11-03" };

  it("sends page from 1 and size for the list", () => {
    expect(toBeComplaintQuery(filter, { paged: true })).toMatchObject({ page: 3, size: 50, keyword: "KN", status: "CLOSED", createdTo: "2026-11-03" });
  });

  it("sends no paging for the export", () => {
    const query = toBeComplaintQuery(filter, { paged: false });
    expect(query).not.toHaveProperty("page");
    expect(query).not.toHaveProperty("size");
    expect(query).toMatchObject({ keyword: "KN", status: "CLOSED" });
  });
});
