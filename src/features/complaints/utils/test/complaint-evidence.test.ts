import { describe, expect, it } from "vitest";

import { checkEvidenceFiles } from "../complaint-evidence";

const file = (name: string, size = 1024) => new File([new Uint8Array(size)], name);

describe("checkEvidenceFiles", () => {
  it("keeps .pdf, .jpg, .jpeg and .png files whatever the case of the extension", () => {
    const result = checkEvidenceFiles([], [file("a.pdf"), file("b.JPG"), file("c.jpeg"), file("d.png")]);
    expect(result.files.map((item) => item.name)).toEqual(["a.pdf", "b.JPG", "c.jpeg", "d.png"]);
    expect(result.error).toBeNull();
  });

  it("refuses other formats with the BE wording", () => {
    const result = checkEvidenceFiles([], [file("a.docx"), file("b.heic")]);
    expect(result.files).toEqual([]);
    expect(result.error).toContain("Định dạng file không hỗ trợ");
  });

  it("refuses a file over 10MB and accepts exactly 10MB", () => {
    const limit = 10 * 1024 * 1024;
    const result = checkEvidenceFiles([], [file("big.pdf", limit + 1), file("ok.pdf", limit)]);
    expect(result.files.map((item) => item.name)).toEqual(["ok.pdf"]);
    expect(result.error).toContain("Dung lượng file vượt quá 10MB");
  });

  it("stops at ten files per send", () => {
    const current = Array.from({ length: 9 }, (_, index) => file(`${index}.png`));
    const result = checkEvidenceFiles(current, [file("x.png"), file("y.png")]);
    expect(result.files).toHaveLength(10);
    expect(result.files.at(-1)?.name).toBe("x.png");
    expect(result.error).toBe("Chỉ được đính kèm tối đa 10 tệp");
  });
});
