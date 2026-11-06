import { describe, expect, it } from "vitest";
import { filterToFormValues, formValuesToFilter } from "../transaction-filter";

describe("formValuesToFilter", () => {
  it("drops empty values, trims text and restarts at the first page", () => {
    const filter = formValuesToFilter({ keyword: "  FM26 ", status: "", paymentMethod: "QR", createdFrom: null }, 20);
    expect(filter).toEqual({ page: 1, pageSize: 20, keyword: "FM26", paymentMethod: "QR" });
  });

  it("sends the chosen calendar days, the BE covers the whole last day", () => {
    const filter = formValuesToFilter(
      { createdFrom: new Date(2026, 10, 1, 23, 30), createdTo: new Date(2026, 10, 2, 0, 10) },
      10,
    );
    expect(filter.createdFrom).toBe("2026-11-01");
    expect(filter.createdTo).toBe("2026-11-02");
  });

  it("ignores values outside the known options", () => {
    const filter = formValuesToFilter({ status: "unknown", paymentMethod: "cash", subMerchantId: "SM001" }, 10);
    expect(filter).toEqual({ page: 1, pageSize: 10 });
  });
});

describe("filterToFormValues", () => {
  it("restores the form from the URL filter", () => {
    const values = filterToFormValues({ page: 2, pageSize: 10, status: "EXPIRED", createdFrom: "2026-11-01" });
    expect(values.status).toBe("EXPIRED");
    expect(values.createdFrom).toEqual(new Date(2026, 10, 1));
    expect(values.createdTo).toBeNull();
    expect(values.keyword).toBe("");
  });
});
