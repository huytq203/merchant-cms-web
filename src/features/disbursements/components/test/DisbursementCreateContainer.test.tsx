// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SUB_ID } from "../../test/fixtures";
import { unconfirmedOrderKey } from "../../utils/unconfirmed-order-store";

vi.mock("../BatchUpload", () => ({ BatchUpload: () => <div>batch-upload</div> }));

import { DisbursementCreateContainer } from "../DisbursementCreateContainer";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const renderContainer = () => render(
  <QueryClientProvider client={new QueryClient()}>
    <DisbursementCreateContainer subId={SUB_ID} modes={{ single: true, batch: true }} />
  </QueryClientProvider>,
);

describe("DisbursementCreateContainer", () => {
  it("lets the user switch to batch when no order is unconfirmed", () => {
    renderContainer();
    expect(screen.getByRole("button", { name: "Theo lô" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Theo lô" }));
    expect(screen.getByText("batch-upload")).toBeInTheDocument();
  });

  it("locks the Đơn lẻ/Theo lô switch while an unconfirmed order is pending (restored after reload)", async () => {
    localStorage.setItem(unconfirmedOrderKey("anonymous", SUB_ID), JSON.stringify({
      values: { merchantRequestCode: "MA-01", bankCode: "VCB", accountNumber: "0123456789", accountName: "", amount: "1000000", description: "" },
      inquiry: { status: "VERIFIED", bankAccountName: "NGUYEN VAN A" },
      mismatchAccepted: false,
      savedAt: 1,
    }));
    renderContainer();
    await waitFor(() => expect(screen.getByRole("button", { name: "Theo lô" })).toBeDisabled());
    expect(screen.getByRole("button", { name: "Đơn lẻ" })).toBeDisabled();
    expect(screen.getByLabelText("Mã yêu cầu")).toHaveValue("MA-01");
  });
});
