// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TerminalLockModal } from "../TerminalLockModal";
import type { TerminalRow } from "../../types";

afterEach(cleanup);

const target = {
  id: "33333333-3333-4333-8333-333333333333",
  tid: "TML000001",
  name: "Quầy 1",
  terminalType: "POS",
  address: "Hà Nội",
  status: "ACTIVE",
  lockSource: null,
  subMerchantId: "11111111-1111-4111-8111-111111111111",
  subMerchantCode: "SM001",
  subMerchantName: "Halo Tech",
  merchantId: "22222222-2222-4222-8222-222222222222",
  contactPhone: null,
  createdAt: null,
} as TerminalRow;

function renderModal(action: "lock" | "unlock", onConfirm = vi.fn().mockResolvedValue(undefined)) {
  render(<TerminalLockModal open onOpenChange={vi.fn()} target={target} action={action} onConfirm={onConfirm} isSubmitting={false} />);
  return onConfirm;
}

describe("terminal lock modal", () => {
  it("names the terminal, warns it stops working, and counts the reason", async () => {
    renderModal("lock");
    expect(screen.getByText("Quầy 1")).toBeInTheDocument();
    expect(screen.getByText(/TML000001/)).toHaveTextContent("Halo Tech");
    expect(screen.getByRole("note")).toHaveTextContent("Terminal ngừng hoạt động cho đến khi được mở khóa.");
    await userEvent.type(screen.getByRole("textbox", { name: /Lý do khóa/ }), "Máy bị mất");
    expect(screen.getByText("10/500")).toBeInTheDocument();
  });

  it("only enables the danger button once the reason is long enough, then sends it trimmed", async () => {
    const onConfirm = renderModal("lock");
    const confirm = screen.getByRole("button", { name: "Khóa Terminal" });
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByRole("textbox", { name: /Lý do khóa/ }), "  Máy bị mất cần khóa  ");
    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith("Máy bị mất cần khóa");
  });

  it("uses a plain confirm and no warning when unlocking", async () => {
    const onConfirm = renderModal("unlock");
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox", { name: /Lý do mở khóa/ }), "Đã tìm lại được máy");
    await userEvent.click(screen.getByRole("button", { name: "Mở khóa" }));
    expect(onConfirm).toHaveBeenCalledWith("Đã tìm lại được máy");
  });
});
