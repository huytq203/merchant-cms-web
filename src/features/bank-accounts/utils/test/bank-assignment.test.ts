import { describe, expect, it } from "vitest";
import type { BankAccount } from "../../types";
import { currentAccountLabel, movingSubIds, subAccountMap } from "../bank-assignment";

const account = (id: string, subs: string[], accountStatus: BankAccount["accountStatus"] = "VERIFIED") =>
  ({
    id,
    bankCode: "VCB",
    accountNumber: `****${id}`,
    accountStatus,
    assignedSubMerchants: subs.map((sub) => ({ id: sub, code: sub, name: sub })),
  }) as unknown as BankAccount;

describe("subAccountMap", () => {
  it("ghép mỗi Sub với TK nó đang dùng, bỏ TK đang sửa", () => {
    const map = subAccountMap([account("1", ["a", "b"]), account("2", ["c"])], "1");
    expect([...map.keys()]).toEqual(["c"]);
    expect(map.get("c")?.id).toBe("2");
  });

  it("thêm mới (không có TK đang sửa) thì giữ mọi TK", () => {
    expect(subAccountMap([account("1", ["a"]), account("2", ["c"])]).size).toBe(2);
  });
});

describe("movingSubIds", () => {
  const map = subAccountMap([account("2", ["c", "d"])], "1");

  it("chỉ tính Sub mới chọn đang dùng TK khác", () => {
    expect(movingSubIds(["a", "c", "e"], map, ["a"])).toEqual(["c"]);
  });

  it("Sub đã gán TK này từ trước không bị coi là chuyển", () => {
    expect(movingSubIds(["c"], map, ["c"])).toEqual([]);
  });
});

describe("currentAccountLabel", () => {
  it("ghi rõ TK đang Khóa", () => {
    expect(currentAccountLabel(account("9", [], "LOCKED"))).toContain("(Khóa)");
    expect(currentAccountLabel(account("9", []))).not.toContain("Khóa");
  });
});
