import { describe, expect, it } from "vitest";
import { isDocumentType, validateDocumentFile } from "../document-validation";

describe("document validation", () => {
  it("accepts a PDF business license within the limit", () => {
    expect(validateDocumentFile({ size: 1024, type: "application/pdf" }, "BUSINESS_LICENSE")).toBeNull();
  });

  it("rejects a format the document type does not allow", () => {
    expect(validateDocumentFile({ size: 1024, type: "application/pdf" }, "ID_CARD_FRONT")).not.toBeNull();
    expect(validateDocumentFile({ size: 1024, type: "text/html" }, "BUSINESS_LICENSE")).not.toBeNull();
  });

  it("rejects an oversized or empty file", () => {
    expect(validateDocumentFile({ size: 3 * 1024 * 1024, type: "image/png" }, "MERCHANT_LOGO")).not.toBeNull();
    expect(validateDocumentFile({ size: 0, type: "image/png" }, "MERCHANT_LOGO")).not.toBeNull();
  });

  it("recognises only known document types", () => {
    expect(isDocumentType("ID_CARD_BACK")).toBe(true);
    expect(isDocumentType("PASSPORT")).toBe(false);
    expect(isDocumentType(undefined)).toBe(false);
  });
});
