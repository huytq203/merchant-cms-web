import { describe, expect, it } from "vitest";
import { safeCsvDisposition } from "../safe-csv-disposition";

describe("safeCsvDisposition", () => {
  it("giữ tên file hợp lệ của BE", () => {
    expect(
      safeCsvDisposition(
        'attachment; filename="bien-dong-so-du-SUB001-202611191200.csv"',
        "x.csv",
      ),
    ).toBe('attachment; filename="bien-dong-so-du-SUB001-202611191200.csv"');
  });
  it("dùng tên mặc định khi thiếu header, sai đuôi, có '..', đường dẫn hay ký tự xuống dòng", () => {
    for (const header of [
      null,
      undefined,
      "",
      "attachment",
      'attachment; filename="a.exe"',
      'attachment; filename="..csv"',
      'attachment; filename="../a.csv"',
      'attachment; filename="a b.csv"',
    ]) {
      expect(safeCsvDisposition(header, "mac-dinh.csv")).toBe(
        'attachment; filename="mac-dinh.csv"',
      );
    }
  });
});
