import { describe, expect, it } from "vitest";
import { hasSubMerchantFilter, matchesSubMerchantFilter } from "../sub-merchant-filter";

const row = { code: "MC000001-S001", name: "Cửa hàng Điện máy", status: "ACTIVE" as const };

describe("hasSubMerchantFilter", () => {
  it("is true only when a filter has a value", () => {
    expect(hasSubMerchantFilter({})).toBe(false);
    expect(hasSubMerchantFilter({ code: "", name: "" })).toBe(false);
    expect(hasSubMerchantFilter({ status: "ACTIVE" })).toBe(true);
  });
});

describe("matchesSubMerchantFilter", () => {
  it("matches a part of the code or name, ignoring case and accents", () => {
    expect(matchesSubMerchantFilter(row, { code: "s001" })).toBe(true);
    expect(matchesSubMerchantFilter(row, { name: "dien may" })).toBe(true);
    expect(matchesSubMerchantFilter(row, { name: "ĐIỆN" })).toBe(true);
    expect(matchesSubMerchantFilter(row, { code: "S002" })).toBe(false);
    expect(matchesSubMerchantFilter(row, { name: "thời trang" })).toBe(false);
  });

  it("matches the status exactly and combines every filter with AND", () => {
    expect(matchesSubMerchantFilter(row, { status: "ACTIVE" })).toBe(true);
    expect(matchesSubMerchantFilter(row, { status: "INACTIVE" })).toBe(false);
    expect(matchesSubMerchantFilter(row, { code: "S001", name: "cửa hàng", status: "ACTIVE" })).toBe(true);
    expect(matchesSubMerchantFilter(row, { code: "S001", status: "INACTIVE" })).toBe(false);
  });

  it("matches everything when no filter is set", () => {
    expect(matchesSubMerchantFilter(row, {})).toBe(true);
  });
});
