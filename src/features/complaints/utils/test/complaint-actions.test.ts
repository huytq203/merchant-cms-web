import { describe, expect, it } from "vitest";

import { complaintDetailActions } from "../complaint-actions";

describe("complaintDetailActions", () => {
  it("offers reply and reject only on a PROCESSING complaint with REPLY_DISPUTE", () => {
    expect(complaintDetailActions({ status: "PROCESSING" }, true)).toEqual({ canAct: true, note: null });
    expect(complaintDetailActions({ status: "PROCESSING" }, false)).toEqual({ canAct: false, note: null });
  });

  it("says a waiting complaint has not been accepted yet, whatever the permission", () => {
    expect(complaintDetailActions({ status: "WAITING" }, true)).toEqual({ canAct: false, note: "Đang chờ tiếp nhận" });
    expect(complaintDetailActions({ status: "WAITING" }, false).note).toBe("Đang chờ tiếp nhận");
  });

  it("closes the conversation of a closed or cancelled complaint", () => {
    expect(complaintDetailActions({ status: "CLOSED" }, true)).toMatchObject({ canAct: false, note: expect.stringMatching(/đã kết thúc/) });
    expect(complaintDetailActions({ status: "CANCELLED" }, true)).toMatchObject({ canAct: false, note: expect.stringMatching(/đã bị hủy/) });
  });
});
