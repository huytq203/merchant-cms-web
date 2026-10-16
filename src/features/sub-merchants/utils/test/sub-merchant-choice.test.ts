import { describe, expect, it } from "vitest";
import { pickSubMerchantId } from "../sub-merchant-choice";

const choices = [
  { id: "a", label: "SUB001 · A" },
  { id: "b", label: "SUB002 · B" },
];

describe("pickSubMerchantId", () => {
  it("keeps a requested Sub that the session can choose", () => {
    expect(pickSubMerchantId(choices, "b")).toBe("b");
  });

  it("falls back to the first choice for a missing or foreign Sub", () => {
    expect(pickSubMerchantId(choices, undefined)).toBe("a");
    expect(pickSubMerchantId(choices, "foreign")).toBe("a");
  });

  it("returns null when there is nothing to choose", () => {
    expect(pickSubMerchantId([], "a")).toBeNull();
  });
});
