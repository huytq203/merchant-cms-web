// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DisbursementCreateFlow } from "../../hooks/use-disbursement-create-flow";
import { verifiedInquiry } from "../../test/fixtures";
import { DisbursementCreateForm } from "../DisbursementCreateForm";

afterEach(cleanup);

function flowStub(outcomeUnknown: boolean): DisbursementCreateFlow {
  return {
    step: "form",
    values: { merchantRequestCode: "MA-01", bankCode: "VCB", accountNumber: "0123456789", accountName: "", amount: "1000000", description: "" },
    errors: {},
    inquiry: verifiedInquiry,
    mismatchAccepted: false,
    outcomeUnknown,
    canAbandon: false,
    failure: null,
    isInquiring: false,
    isPreviewing: false,
    isLookingUp: false,
    change: vi.fn(),
    inquire: vi.fn(),
    review: vi.fn(),
    acceptMismatch: vi.fn(),
    checkExisting: vi.fn(),
    abandonUnconfirmed: vi.fn(),
  } as unknown as DisbursementCreateFlow;
}

describe("DisbursementCreateForm while the order is unconfirmed", () => {
  it("disables the request code, the receiver, the amount, the description and the name lookup", () => {
    render(<DisbursementCreateForm flow={flowStub(true)} />);
    for (const label of ["Mã yêu cầu", "Số tài khoản nhận", "Tên người nhận (không bắt buộc)", "Số tiền chi (VND)", "Nội dung chi"]) {
      expect(screen.getByLabelText(label)).toBeDisabled();
    }
    expect(screen.getByRole("button", { name: "Tra tên người nhận" })).toBeDisabled();
    expect(screen.getByText(/Lệnh có thể đã được tạo/)).toBeInTheDocument();
  });

  it("keeps the fields editable when nothing is unconfirmed", () => {
    render(<DisbursementCreateForm flow={flowStub(false)} />);
    expect(screen.getByLabelText("Mã yêu cầu")).toBeEnabled();
    expect(screen.getByLabelText("Số tiền chi (VND)")).toBeEnabled();
    expect(screen.queryByText(/Lệnh có thể đã được tạo/)).not.toBeInTheDocument();
  });
});
