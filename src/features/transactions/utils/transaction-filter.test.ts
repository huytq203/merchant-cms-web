import { describe, expect, it } from "vitest";
import { filterToFormValues, formValuesToFilter } from "./transaction-filter";

describe("formValuesToFilter", () => {
  it("drops empty values, trims text and restarts at the first page", () => {
    const filter = formValuesToFilter(
      { keyword: "  TRX-1 ", customerContact: "", status: "", bankCode: "VCB", createdFrom: null },
      20,
    );
    expect(filter).toEqual({ page: 1, pageSize: 20, keyword: "TRX-1", bankCode: "VCB" });
  });

  it("covers the whole end day for the upper time bound", () => {
    const filter = formValuesToFilter(
      { createdFrom: new Date(2026, 8, 1), createdTo: new Date(2026, 8, 3) },
      10,
    );
    expect(new Date(filter.createdFromDate ?? "").getHours()).toBe(0);
    const to = new Date(filter.createdToDate ?? "");
    expect([to.getDate(), to.getHours(), to.getMinutes()]).toEqual([3, 23, 59]);
  });

  it("ignores values outside the known options", () => {
    const filter = formValuesToFilter({ status: "unknown", paymentMethod: "cash" }, 10);
    expect(filter).toEqual({ page: 1, pageSize: 10 });
  });
});

describe("filterToFormValues", () => {
  it("restores the form from the URL filter", () => {
    const values = filterToFormValues({
      page: 2,
      pageSize: 10,
      status: "failed",
      createdFromDate: "2026-09-01T00:00:00.000Z",
    });
    expect(values.status).toBe("failed");
    expect(values.createdFrom).toBeInstanceOf(Date);
    expect(values.createdTo).toBeNull();
    expect(values.keyword).toBe("");
  });
});
