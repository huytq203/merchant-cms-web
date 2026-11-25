import { describe, expect, it } from "vitest";
import { getInitials, getLockBlock, getResetPasswordBlock } from "../user-restrictions";

const actorId = "actor";
const active = { active: true, locked: false };
const pending = { active: false, locked: false };
const locked = { active: false, locked: true };

describe("getResetPasswordBlock", () => {
  it("allows an active user other than the actor", () => {
    expect(getResetPasswordBlock({ id: "other", ...active }, actorId)).toBeUndefined();
  });

  it("blocks the actor even when active", () => {
    expect(getResetPasswordBlock({ id: actorId, ...active }, actorId)).toBeTruthy();
  });

  it("allows a pending user: the reset resends the activation mail", () => {
    expect(getResetPasswordBlock({ id: "other", ...pending }, actorId)).toBeUndefined();
  });

  it("blocks a locked user until they are unlocked", () => {
    expect(getResetPasswordBlock({ id: "other", ...locked }, actorId)).toBeTruthy();
  });
});

describe("getLockBlock", () => {
  it("blocks the actor from locking themselves", () => {
    expect(getLockBlock({ id: actorId, ...active }, actorId)).toBeTruthy();
  });

  it("allows locking an active user and unlocking a locked user", () => {
    expect(getLockBlock({ id: "other", ...active }, actorId)).toBeUndefined();
    expect(getLockBlock({ id: "other", ...locked }, actorId)).toBeUndefined();
  });

  it("blocks locking a user who is not active yet", () => {
    expect(getLockBlock({ id: "other", ...pending }, actorId)).toBeTruthy();
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
