import { describe, expect, it } from "vitest";
import { userFullNameSchema } from "../user.schema";

describe("userFullNameSchema", () => {
  it("nhận họ tên dạng NFD (dán từ macOS/Excel) và trả về dạng NFC", () => {
    const nfd = "nguyễn văn an".normalize("NFD");
    const result = userFullNameSchema.safeParse(nfd);
    expect(result.success).toBe(true);
    expect(result.data).toBe("Nguyễn Văn An".normalize("NFC"));
  });

  it("vẫn từ chối số và ký tự đặc biệt", () => {
    expect(userFullNameSchema.safeParse("Nguyen Van 1").success).toBe(false);
  });
});
