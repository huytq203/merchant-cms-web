import { describe, expect, it } from "vitest";
import { freezeListSchema, freezeStatusSchema, freezeStatusFilterSchema } from "../schemas";
import { activeFreeze, releasedFreeze } from "./fixtures";

describe("revenue freeze schema", () => {
  it("parses the Portal freezes with their releases", () => {
    const parsed = freezeListSchema.parse([activeFreeze, releasedFreeze]);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.releases).toHaveLength(2);
    expect(parsed[0]?.releases[0]?.completedAt).toBeNull();
  });

  it("accepts a freeze without a scheduled release, order code or reason, and releases left out", () => {
    const { releases: _releases, ...rest } = releasedFreeze;
    void _releases;
    const parsed = freezeListSchema.parse([{ ...rest, orderCode: null, reason: null, scheduledReleaseAt: null }]);
    expect(parsed[0]?.releases).toEqual([]);
    expect(parsed[0]?.orderCode).toBeNull();
  });

  it("knows the four statuses the BE stores, and the filter also allows all of them", () => {
    expect(freezeStatusSchema.options).toEqual(["PROCESSING", "ACTIVE", "RELEASED", "FAILED"]);
    expect(freezeStatusFilterSchema.catch("ALL").parse("WHATEVER")).toBe("ALL");
    expect(freezeStatusFilterSchema.parse("ACTIVE")).toBe("ACTIVE");
  });
});
