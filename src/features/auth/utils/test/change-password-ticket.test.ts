// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  clearChangePasswordTicket,
  readChangePasswordTicket,
  saveChangePasswordTicket,
} from "@/features/auth/utils/change-password-ticket";

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
});
afterEach(() => window.sessionStorage.clear());

describe("change-password ticket store", () => {
  it("returns the ticket and its expiry until it runs out", () => {
    saveChangePasswordTicket("tk-1", 600, 1_000);
    expect(readChangePasswordTicket(1_000 + 599_000)).toEqual({ ticket: "tk-1", expiresAt: 601_000 });
  });

  it("treats an expired ticket as absent and forgets it", () => {
    saveChangePasswordTicket("tk-1", 600, 1_000);
    expect(readChangePasswordTicket(1_000 + 600_000)).toBeNull();
    expect(readChangePasswordTicket(1_000)).toBeNull();
  });

  it("keeps the ticket in sessionStorage only, never localStorage", () => {
    saveChangePasswordTicket("tk-1", 600);
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(1);
  });

  it("clears the ticket", () => {
    saveChangePasswordTicket("tk-1", 600);
    clearChangePasswordTicket();
    expect(readChangePasswordTicket()).toBeNull();
  });

  it("ignores garbage left in storage", () => {
    window.sessionStorage.setItem("flexpay.change-password-ticket", "{not json");
    expect(readChangePasswordTicket()).toBeNull();
  });
});
