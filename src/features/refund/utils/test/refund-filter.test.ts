import { describe, expect, it } from "vitest";
import { filterToFormValues, formValuesToFilter } from "../refund-filter";

const empty = { keyword: "", status: [], subMerchantId: "" };

describe("formValuesToFilter", () => {
  it("drops empty values, trims text and restarts at the first page", () => {
    const filter = formValuesToFilter({ ...empty, keyword: " REF-1 ", status: ["pending"] }, 20);
    expect(filter).toEqual({ page: 1, pageSize: 20, keyword: "REF-1", status: ["pending"] });
  });

  it("covers the whole end day for the upper time bound and ignores unknown statuses", () => {
    const filter = formValuesToFilter(
      { ...empty, status: ["cancelled"], createdFromDate: new Date(2026, 8, 1), createdToDate: new Date(2026, 8, 3) },
      10,
    );
    expect(filter.status).toEqual(["cancelled"]);
    const to = new Date(filter.createdToDate ?? "");
    expect([to.getDate(), to.getHours(), to.getMinutes()]).toEqual([3, 23, 59]);
  });
});

describe("filterToFormValues", () => {
  it("restores the form from the URL filter", () => {
    const values = filterToFormValues({ page: 1, pageSize: 10, status: ["success"], createdFromDate: "2026-09-01T00:00:00.000Z" });
    expect(values.status).toEqual(["success"]);
    expect(values.createdFromDate).toBeInstanceOf(Date);
    expect(values.createdToDate).toBeNull();
    expect(values.keyword).toBe("");
  });
});
