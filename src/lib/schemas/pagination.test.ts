import { describe, expect, it } from "vitest";
import { paginationQuerySchema } from "./pagination";

describe("paginationQuerySchema", () => {
  it("dùng mặc định page 1, pageSize 10 khi thiếu", () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 10 });
  });

  it("ép chuỗi query thành số", () => {
    expect(paginationQuerySchema.parse({ page: "3", pageSize: "50" })).toEqual({ page: 3, pageSize: 50 });
  });

  it("từ chối page nhỏ hơn 1 hoặc không nguyên", () => {
    expect(paginationQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ page: "1.5" }).success).toBe(false);
  });

  it("từ chối pageSize ngoài 1–100", () => {
    expect(paginationQuerySchema.safeParse({ pageSize: "0" }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ pageSize: "101" }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ pageSize: "100" }).success).toBe(true);
  });

  it("cho phép mở rộng thêm filter", () => {
    const schema = paginationQuerySchema.extend({ keyword: paginationQuerySchema.shape.page.optional() });
    expect(schema.parse({ page: "2" }).page).toBe(2);
  });
});
