import { describe, expect, it } from "vitest";
import { orderFilterFormSchema, orderSearchBodySchema } from "../disbursement-filter.schema";

const message = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? "" : result.error?.issues[0]?.message;

describe("orderFilterFormSchema", () => {
  it("accepts an empty filter and a full valid one", () => {
    expect(orderFilterFormSchema.safeParse({}).success).toBe(true);
    expect(orderFilterFormSchema.safeParse({ amountFrom: 1, amountTo: 2, createdFrom: "2026-11-01", createdTo: "2026-11-02" }).success).toBe(true);
  });

  it("explains a reversed amount or date range in Vietnamese", () => {
    expect(message(orderFilterFormSchema.safeParse({ amountFrom: 9, amountTo: 1 }))).toBe("Số tiền từ phải nhỏ hơn hoặc bằng số tiền đến");
    expect(message(orderFilterFormSchema.safeParse({ createdFrom: "2026-11-05", createdTo: "2026-11-01" }))).toBe(
      "Ngày tạo từ phải trước hoặc bằng ngày tạo đến",
    );
    expect(message(orderFilterFormSchema.safeParse({ succeededFrom: "2026-11-05", succeededTo: "2026-11-01" }))).toBe(
      "Ngày thành công từ phải trước hoặc bằng ngày thành công đến",
    );
  });
});

describe("orderSearchBodySchema (BFF input)", () => {
  it("strips masterId / subIds smuggled into the filter, so scope only travels in subIds", () => {
    const parsed = orderSearchBodySchema.parse({
      subIds: ["11111111-1111-4111-8111-111111111111"],
      filter: { code: "A", masterId: "99999999-9999-4999-8999-999999999999", subIds: ["x"] },
      page: 0,
      size: 20,
    });
    expect(parsed.filter).toEqual({ code: "A" });
  });

  it("refuses more than 200 Subs, a bad status and an oversized page", () => {
    const sub = "11111111-1111-4111-8111-111111111111";
    expect(orderSearchBodySchema.safeParse({ subIds: Array.from({ length: 201 }, () => sub) }).success).toBe(false);
    expect(orderSearchBodySchema.safeParse({ filter: { statuses: ["NOPE"] } }).success).toBe(false);
    expect(orderSearchBodySchema.safeParse({ size: 101 }).success).toBe(false);
  });
});
