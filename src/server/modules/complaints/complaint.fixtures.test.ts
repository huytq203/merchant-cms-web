import { describe, expect, it } from "vitest";
import { complaintSchema } from "@/features/complaints/schemas/complaint.schema";
import { COMPLAINT_FIXTURES } from "./complaint.fixtures";

describe("complaint fixtures", () => {
  it("all parse with the module schema and have unique ids", () => {
    for (const row of COMPLAINT_FIXTURES) {
      expect(complaintSchema.safeParse(row).success).toBe(true);
    }
    expect(new Set(COMPLAINT_FIXTURES.map((row) => row.id)).size).toBe(COMPLAINT_FIXTURES.length);
  });

  it("only carry the allowed keys", () => {
    const allowed = Object.keys(complaintSchema.shape).sort();
    for (const row of COMPLAINT_FIXTURES) {
      expect(Object.keys(row).sort()).toEqual(allowed);
    }
  });

  it("contain no real personal data: sample wording only, no emails or phone numbers", () => {
    for (const row of COMPLAINT_FIXTURES) {
      const text = JSON.stringify(row);
      expect(text).not.toMatch(/@/);
      expect(text).not.toMatch(/\d{9,}/);
      expect(row.ticketCode).toMatch(/^TRS-SAMPLE-\d+$/);
      for (const message of row.messages) {
        expect(message.senderName).toMatch(/^(Cổng Thanh Toán \(mẫu\)|Merchant \(mẫu\))$/);
      }
    }
  });

  it("covers every status and source, and at least one thread of messages", () => {
    expect([...new Set(COMPLAINT_FIXTURES.map((row) => row.status))].sort()).toEqual([
      "pending",
      "processing",
      "rejected",
      "resolved",
    ]);
    expect([...new Set(COMPLAINT_FIXTURES.map((row) => row.source))].sort()).toEqual([
      "customer",
      "gateway",
      "merchant",
    ]);
    expect(COMPLAINT_FIXTURES.some((row) => row.messages.length > 0)).toBe(true);
  });
});
