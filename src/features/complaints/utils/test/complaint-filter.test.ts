import { describe, expect, it } from "vitest";
import { filterToFormValues, formValuesToFilter } from "../complaint-filter";

describe("formValuesToFilter", () => {
  it("drops empty and unknown values and restarts at the first page", () => {
    expect(formValuesToFilter({ source: "", status: "unknown" }, 20)).toEqual({ page: 1, pageSize: 20 });
    expect(formValuesToFilter({ source: "gateway", status: "pending" }, 10)).toEqual({
      page: 1,
      pageSize: 10,
      source: "gateway",
      status: "pending",
    });
  });

  it("preserves a trimmed complaint or transaction code search", () => {
    expect(formValuesToFilter({ keyword: "  TRX-SAMPLE-001  " }, 10)).toMatchObject({ keyword: "TRX-SAMPLE-001" });
  });

  it("covers the whole end day for the upper time bound", () => {
    const filter = formValuesToFilter({ fromDate: new Date(2026, 8, 1), toDate: new Date(2026, 8, 3) }, 10);
    const to = new Date(filter.createdToDate ?? "");
    expect([to.getDate(), to.getHours(), to.getMinutes()]).toEqual([3, 23, 59]);
  });
});

describe("filterToFormValues", () => {
  it("restores the form from the URL filter", () => {
    const values = filterToFormValues({ page: 1, pageSize: 10, source: "customer", createdFromDate: "2026-09-01T00:00:00.000Z" });
    expect(values.source).toBe("customer");
    expect(values.fromDate).toBeInstanceOf(Date);
    expect(values.toDate).toBeNull();
    expect(values.status).toBe("");
  });
});
