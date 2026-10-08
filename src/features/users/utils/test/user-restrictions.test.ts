import { describe, expect, it } from "vitest";
import { getInitials, getLockBlock, getResetPasswordBlock } from "../user-restrictions";

const actorId = "actor";

describe("getResetPasswordBlock", () => {
  it("allows an active user other than the actor", () => {
    expect(getResetPasswordBlock({ id: "other", status: "ACTIVE" }, actorId)).toBeUndefined();
  });

  it("blocks the actor even when active", () => {
    expect(getResetPasswordBlock({ id: actorId, status: "ACTIVE" }, actorId)).toBeTruthy();
  });

  it("blocks locked and pending users with a reason each", () => {
    const locked = getResetPasswordBlock({ id: "other", status: "LOCKED" }, actorId);
    const pending = getResetPasswordBlock({ id: "other", status: "PENDING" }, actorId);
    expect(locked).toBeTruthy();
    expect(pending).toBeTruthy();
    expect(locked).not.toBe(pending);
  });
});

describe("getLockBlock", () => {
  it("blocks the actor from locking themselves", () => {
    expect(getLockBlock({ id: actorId, status: "ACTIVE" }, actorId)).toBeTruthy();
  });

  it("allows locking an active user and unlocking a locked user", () => {
    expect(getLockBlock({ id: "other", status: "ACTIVE" }, actorId)).toBeUndefined();
    expect(getLockBlock({ id: "other", status: "LOCKED" }, actorId)).toBeUndefined();
  });

  it("blocks locking a user who is not active yet", () => {
    expect(getLockBlock({ id: "other", status: "PENDING" }, actorId)).toBeTruthy();
  });
});

describe("getInitials", () => {
  it("uses the first letters of the last two words", () => {
    expect(getInitials("Nguyễn Văn Kiên")).toBe("VK");
    expect(getInitials("Trần A")).toBe("TA");
  });

  it("handles a single word or an email", () => {
    expect(getInitials("beam@beamewa.com.vn")).toBe("B");
    expect(getInitials("   ")).toBe("?");
  });
});
