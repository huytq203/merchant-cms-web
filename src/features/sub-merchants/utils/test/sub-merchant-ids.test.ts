import { describe, expect, it } from "vitest";
import { formatSubMerchantIds, parseSubMerchantIds, subMerchantIdsParam } from "../sub-merchant-ids";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("parseSubMerchantIds", () => {
  it("tách chuỗi nối dấu phẩy và bỏ phần tử không phải UUID", () => {
    expect(parseSubMerchantIds(`${A},bad, ${B} ,`)).toEqual([A, B]);
  });

  it("bỏ trùng và giữ thứ tự xuất hiện đầu tiên", () => {
    expect(parseSubMerchantIds(`${B},${A},${B}`)).toEqual([B, A]);
  });

  it("nhận mảng (param lặp) và gộp lại", () => {
    expect(parseSubMerchantIds([A, `${B},${A}`])).toEqual([A, B]);
  });

  it("trả mảng rỗng khi thiếu giá trị", () => {
    expect(parseSubMerchantIds(undefined)).toEqual([]);
    expect(parseSubMerchantIds("")).toEqual([]);
  });

  it("chấp nhận subMerchantId cũ trên URL đã lưu khi không có subMerchantIds", () => {
    expect(parseSubMerchantIds(undefined, A)).toEqual([A]);
    expect(parseSubMerchantIds(B, A)).toEqual([B]);
  });
});

describe("formatSubMerchantIds", () => {
  it("nối bằng dấu phẩy; rỗng thì không gửi", () => {
    expect(formatSubMerchantIds([A, B])).toBe(`${A},${B}`);
    expect(formatSubMerchantIds([])).toBeUndefined();
    expect(formatSubMerchantIds(undefined)).toBeUndefined();
  });
});

describe("subMerchantIdsParam", () => {
  it("chuyển chuỗi thành mảng UUID", () => {
    expect(subMerchantIdsParam.parse(`${A},${B}`)).toEqual([A, B]);
    expect(subMerchantIdsParam.parse(undefined)).toBeUndefined();
  });

  it("từ chối phần tử không phải UUID", () => {
    expect(subMerchantIdsParam.safeParse(`${A},bad`).success).toBe(false);
  });
});
