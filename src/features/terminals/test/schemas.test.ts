import { describe, expect, it } from "vitest";
import { terminalFormSchema, terminalFormSchemaFor, terminalTypeSchema } from "../schemas";
import { terminalProvinces } from "../constants/terminal.constants";
import { toCreateTerminalRequest, canLockTerminal, canUnlockTerminal } from "../utils/terminal-mapper";
import type { TerminalDetail } from "../types";

const form = {
  subMerchantId: "11111111-1111-4111-8111-111111111111",
  name: "Quầy số 1",
  terminalType: "POS",
  address: "1 Nguyễn Huệ",
  province: "TP. Hồ Chí Minh",
  contactPerson: "",
  inheritContactPhone: true,
  contactPhone: "",
  note: "",
};

const messagesOf = (result: { error?: { issues: { message: string }[] } }) => result.error?.issues.map((issue) => issue.message);

describe("terminal contract", () => {
  it("requires an address for POS", () => {
    expect(terminalFormSchema.safeParse({ ...form, address: "" }).success).toBe(false);
  });

  it("accepts an ONLINE address but omits address and province from the request", () => {
    const value = terminalFormSchema.parse({ ...form, terminalType: "ONLINE" });
    expect(toCreateTerminalRequest(value)).not.toHaveProperty("address");
    expect(toCreateTerminalRequest(value)).not.toHaveProperty("province");
  });

  it("does not require address or province for ONLINE", () => {
    expect(terminalFormSchema.safeParse({ ...form, terminalType: "ONLINE", address: "", province: "" }).success).toBe(true);
  });

  it.each(["POS", "QR"])("requires address and province for %s with the contract messages", (terminalType) => {
    const messages = messagesOf(terminalFormSchema.safeParse({ ...form, terminalType, address: " ", province: "" }));
    expect(messages).toContain("Terminal POS/QR cần địa chỉ điểm bán");
    expect(messages).toContain("Vui lòng chọn Tỉnh/Thành phố");
  });

  it("sends address and province for POS and QR", () => {
    const value = terminalFormSchema.parse({ ...form, terminalType: "QR" });
    expect(toCreateTerminalRequest(value)).toMatchObject({ address: "1 Nguyễn Huệ", province: "TP. Hồ Chí Minh" });
  });

  it("caps the address at 200 characters", () => {
    expect(terminalFormSchema.safeParse({ ...form, address: "a".repeat(200) }).success).toBe(true);
    expect(messagesOf(terminalFormSchema.safeParse({ ...form, address: "a".repeat(201) }))).toContain("Địa chỉ tối đa 200 ký tự");
  });

  it("rejects a province outside the 34-province catalog", () => {
    expect(terminalProvinces).toHaveLength(34);
    expect(terminalProvinces.slice(0, 6)).toEqual(["Hà Nội", "Huế", "Hải Phòng", "Đà Nẵng", "TP. Hồ Chí Minh", "Cần Thơ"]);
    expect(messagesOf(terminalFormSchema.safeParse({ ...form, province: "Hà Đông" }))).toContain("Tỉnh/Thành phố không hợp lệ");
    for (const province of terminalProvinces) expect(terminalFormSchema.safeParse({ ...form, province }).success).toBe(true);
  });

  it("sends an override only when inheritance is off", () => {
    const inherited = terminalFormSchema.parse(form);
    expect(toCreateTerminalRequest(inherited)).not.toHaveProperty("contactPhone");
    const ownPhone = terminalFormSchema.parse({ ...form, inheritContactPhone: false, contactPhone: "0901234567" });
    expect(toCreateTerminalRequest(ownPhone)).toMatchObject({ inheritContactPhone: false, contactPhone: "0901234567" });
    expect(terminalFormSchema.safeParse({ ...form, inheritContactPhone: false, contactPhone: "" }).success).toBe(false);
  });

  it("accepts only a 10-digit phone starting with 0 when it is entered by hand", () => {
    const message = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0";
    for (const contactPhone of ["123456789", "09123456789", "1912345678", "09123abcde"]) {
      expect(messagesOf(terminalFormSchema.safeParse({ ...form, inheritContactPhone: false, contactPhone }))).toContain(message);
    }
    expect(terminalFormSchema.safeParse({ ...form, inheritContactPhone: false, contactPhone: "0912345678" }).success).toBe(true);
  });

  it("ignores a stale phone while inheritance is on", () => {
    expect(terminalFormSchema.safeParse({ ...form, inheritContactPhone: true, contactPhone: "abc" }).success).toBe(true);
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

describe("terminal cũ chưa có tỉnh", () => {
  const legacyAddress = `Địa chỉ cũ ${"x".repeat(250)}`;
  const legacy = { terminalType: "POS", address: legacyAddress, province: null } as TerminalDetail;
  const legacyForm = { ...form, address: legacyAddress, province: "" };

  it("lets an untouched legacy terminal save other fields without a province or the 200-character cap", () => {
    expect(terminalFormSchemaFor(legacy).safeParse({ ...legacyForm, name: "Tên mới" }).success).toBe(true);
  });

  it("requires a province once the address changes, and applies the 200-character cap again", () => {
    expect(messagesOf(terminalFormSchemaFor(legacy).safeParse({ ...legacyForm, address: "Số 2 Lê Lợi" }))).toEqual(["Vui lòng chọn Tỉnh/Thành phố"]);
    expect(messagesOf(terminalFormSchemaFor(legacy).safeParse({ ...legacyForm, address: "b".repeat(201), province: "Hà Nội" }))).toEqual(["Địa chỉ tối đa 200 ký tự"]);
  });

  it("requires a province when an ONLINE terminal becomes POS or QR", () => {
    const online = { terminalType: "ONLINE", address: null, province: null } as TerminalDetail;
    expect(messagesOf(terminalFormSchemaFor(online).safeParse({ ...form, terminalType: "QR", province: "" }))).toEqual(["Vui lòng chọn Tỉnh/Thành phố"]);
  });

  it("keeps requiring a province on create", () => {
    expect(terminalFormSchemaFor(null).safeParse({ ...form, province: "" }).success).toBe(false);
  });
});
