import { describe, expect, it } from "vitest";
import { labelOf, nameOf, userStatusOf } from "../user-view";

describe("userStatusOf", () => {
  it("reads the two BE flags, locked first", () => {
    expect(userStatusOf({ active: true, locked: false })).toBe("ACTIVE");
    expect(userStatusOf({ active: false, locked: false })).toBe("PENDING");
    expect(userStatusOf({ active: false, locked: true })).toBe("LOCKED");
    expect(userStatusOf({ active: true, locked: true })).toBe("LOCKED");
  });
});

describe("nameOf and labelOf", () => {
  it("returns the stored name only, and labels fall back to the email without changing the data", () => {
    expect(nameOf({ fullName: " An " })).toBe("An");
    expect(nameOf({ fullName: "  " })).toBeUndefined();
    expect(nameOf({ fullName: undefined })).toBeUndefined();
    expect(labelOf({ fullName: null, email: "a@b.vn" })).toBe("a@b.vn");
    expect(labelOf({ fullName: "An", email: "a@b.vn" })).toBe("An");
  });
});
