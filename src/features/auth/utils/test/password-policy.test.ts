import { describe, expect, it } from "vitest";

import { isPasswordPolicyCode } from "../password-policy";

describe("isPasswordPolicyCode", () => {
  it("recognises the identity codes of a password the policy rejected", () => {
    for (const code of ["20009", "20010", "20011", "20012", "20013", "20014", "20015", "20016", "20017", "20018", "20019"]) {
      expect(isPasswordPolicyCode(code)).toBe(true);
    }
  });

  it("does not treat an OTP, link or network failure as a policy rejection", () => {
    for (const code of ["22105", "23015", "HTTP_502", "VALIDATION", undefined]) {
      expect(isPasswordPolicyCode(code)).toBe(false);
    }
  });
});
