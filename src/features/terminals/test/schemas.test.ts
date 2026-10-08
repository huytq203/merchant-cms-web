import { describe, expect, it } from "vitest";
import { terminalFormSchema, terminalTypeSchema } from "../schemas";
import { toCreateTerminalRequest, canLockTerminal, canUnlockTerminal } from "../utils/terminal-mapper";

const form = {
  subMerchantId: "11111111-1111-4111-8111-111111111111",
  name: "Quầy số 1",
  terminalType: "POS",
  address: "1 Nguyễn Huệ",
  contactPerson: "",
  inheritContactPhone: true,
  contactPhone: "",
  note: "",
};

describe("terminal contract", () => {
  it("requires an address for POS", () => {
    expect(terminalFormSchema.safeParse({ ...form, address: "" }).success).toBe(false);
  });

  it("accepts an ONLINE address but omits it from the request", () => {
    const value = terminalFormSchema.parse({ ...form, terminalType: "ONLINE" });
    expect(toCreateTerminalRequest(value)).not.toHaveProperty("address");
  });

  it("sends an override only when inheritance is off", () => {
    const inherited = terminalFormSchema.parse(form);
    expect(toCreateTerminalRequest(inherited)).not.toHaveProperty("contactPhone");
    const ownPhone = terminalFormSchema.parse({ ...form, inheritContactPhone: false, contactPhone: "0901234567" });
    expect(toCreateTerminalRequest(ownPhone)).toMatchObject({ inheritContactPhone: false, contactPhone: "0901234567" });
    expect(terminalFormSchema.safeParse({ ...form, inheritContactPhone: false, contactPhone: "" }).success).toBe(false);
  });

  it("rejects an unknown terminal type", () => {
    expect(terminalTypeSchema.safeParse("QR_DYNAMIC").success).toBe(false);
  });

  it("uses the shared direct lock lifecycle", () => {
    expect(canLockTerminal({ status: "ACTIVE", lockSource: null })).toBe(true);
    expect(canUnlockTerminal({ status: "INACTIVE", lockSource: "DIRECT" })).toBe(true);
    expect(canUnlockTerminal({ status: "INACTIVE", lockSource: "CASCADE" })).toBe(false);
  });
});
