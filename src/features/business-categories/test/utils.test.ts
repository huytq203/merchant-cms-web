import { describe, expect, it } from "vitest";
import { businessCategoryLabel, businessCategoryOptions, formatBusinessCategory } from "../utils";

const categories = [
  { mccCode: "5812", name: "Nhà hàng, ăn uống" },
  { mccCode: "5411", name: "Siêu thị, tạp hóa" },
];

describe("business category labels", () => {
  it("labels an option as name and MCC code", () => {
    expect(businessCategoryLabel(categories[0]!)).toBe("Nhà hàng, ăn uống (MCC 5812)");
  });

  it("keeps the order of the BE and uses the MCC code as the value", () => {
    expect(businessCategoryOptions(categories).map((option) => option.value)).toEqual(["5812", "5411"]);
  });

  it("keeps a saved code that is outside the catalogue so the form does not silently drop it", () => {
    expect(businessCategoryOptions(categories, "9999").at(-1)).toEqual({ value: "9999", label: "MCC 9999" });
    expect(businessCategoryOptions(categories, "5812")).toHaveLength(2);
  });

  it("returns an empty list while the catalogue is not loaded", () => {
    expect(businessCategoryOptions(undefined)).toEqual([]);
  });

  it("formats a saved industry from its name and code, with fallbacks", () => {
    expect(formatBusinessCategory("Bán lẻ", "5311")).toBe("Bán lẻ (MCC 5311)");
    expect(formatBusinessCategory("Ăn uống tự nhập", null)).toBe("Ăn uống tự nhập");
    expect(formatBusinessCategory(null, "5311")).toBe("MCC 5311");
    expect(formatBusinessCategory(undefined, undefined)).toBe("");
  });
});
