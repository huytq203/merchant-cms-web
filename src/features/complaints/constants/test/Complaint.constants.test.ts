import { describe, expect, it } from "vitest";

import { complaintSchema } from "../../schemas/complaint.schema";
import { BE_COMPLAINT, BE_COMPLAINT_ROW } from "../../test/complaint.fixtures";
import {
  COMPLAINT_REASON_OPTIONS,
  COMPLAINT_REQUEST_SOURCE_LABELS,
  describeComplaintStatus,
  reasonLabel,
  waitingOnLabel,
} from "../Complaint.constants";

describe("describeComplaintStatus", () => {
  it("labels the four BE statuses", () => {
    expect(describeComplaintStatus({ status: "WAITING" }).label).toBe("Chờ tiếp nhận");
    expect(describeComplaintStatus({ status: "PROCESSING" }).label).toBe("Đang xử lý");
    expect(describeComplaintStatus({ status: "CANCELLED" }).label).toBe("Đã hủy");
    expect(describeComplaintStatus({ status: "CLOSED" }).label).toBe("Đã kết thúc");
  });

  it("joins the verdict to a closed complaint", () => {
    expect(describeComplaintStatus({ status: "CLOSED", verdict: "ACCEPTED" })).toEqual({ label: "Đã kết thúc – Chấp nhận", tone: "success" });
    expect(describeComplaintStatus({ status: "CLOSED", verdict: "REJECTED" })).toEqual({ label: "Đã kết thúc – Từ chối", tone: "danger" });
  });
});

describe("labels", () => {
  it("has the seven reasons of the BE and shows an unknown code as is", () => {
    expect(COMPLAINT_REASON_OPTIONS.map((option) => option.value)).toEqual([
      "NOT_RECEIVED",
      "FRAUD",
      "WRONG_FEE",
      "NOT_PROCESSED",
      "DUPLICATE",
      "AMOUNT_MISMATCH",
      "OTHER",
    ]);
    expect(reasonLabel("WRONG_FEE")).toBe("Tính phí nhầm");
    expect(reasonLabel("NEW_CODE")).toBe("NEW_CODE");
    expect(reasonLabel(null)).toBe("—");
  });

  it("names who a complaint waits on and where a request came from", () => {
    expect(waitingOnLabel("ADMIN")).toBe("Chờ Admin");
    expect(waitingOnLabel(undefined)).toBeNull();
    expect(COMPLAINT_REQUEST_SOURCE_LABELS.INTERNAL).toBe("Nội bộ điều soát");
  });
});

describe("complaintSchema", () => {
  it("reads a detail and a list row without messages", () => {
    expect(complaintSchema.parse(BE_COMPLAINT)).toEqual(BE_COMPLAINT);
    expect(complaintSchema.parse(BE_COMPLAINT_ROW).messages).toBeUndefined();
  });

  it("accepts a merchant-created complaint without request source and with an unknown reason code", () => {
    const { requestSource: _source, ...own } = BE_COMPLAINT_ROW;
    void _source;
    expect(complaintSchema.safeParse({ ...own, reporterType: "MERCHANT", reasonCode: "LATER_CODE" }).success).toBe(true);
  });

  it("rejects a status outside the contract", () => {
    expect(complaintSchema.safeParse({ ...BE_COMPLAINT_ROW, status: "RESOLVED" }).success).toBe(false);
  });
});
