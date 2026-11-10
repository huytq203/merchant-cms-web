// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SettlementTotalsBar } from "../SettlementTotalsBar";

afterEach(cleanup);

const open = "11111111-1111-4111-8111-111111111111";
const locked = "22222222-2222-4222-8222-222222222222";
const totals = {
  count: 2, grossAmount: 300_000, feeAmount: 0, recognisedAmount: 300_000, firstTrancheAmount: 300_000, heldAmount: 0,
  byTrancheStatus: {},
  bySub: [
    { subMerchantId: open, subMerchantCode: "S01", subMerchantName: "Cửa hàng A", grossAmount: 100_000, recognisedAmount: 100_000 },
    { subMerchantId: locked, subMerchantCode: "S02", subMerchantName: "Cửa hàng B", grossAmount: 200_000, recognisedAmount: 200_000 },
  ],
} as unknown as Parameters<typeof SettlementTotalsBar>[0]["totals"];

describe("SettlementTotalsBar · Theo Sub", () => {
  it("filters by a Sub that is still in the picker", () => {
    const onPickSub = vi.fn();
    render(<SettlementTotalsBar totals={totals} onPickSub={onPickSub} pickableSubIds={new Set([open])} />);
    fireEvent.click(screen.getByRole("button", { name: "Lọc theo Cửa hàng A" }));
    expect(onPickSub).toHaveBeenCalledWith(open);
  });

  it("still shows the revenue of a locked Sub but does not let it be picked", () => {
    // Sub bị khóa không còn trong ô chọn (/choices chỉ gồm Sub đang hoạt động): bấm vào sẽ lọc một Sub không chọn được.
    const onPickSub = vi.fn();
    render(<SettlementTotalsBar totals={totals} onPickSub={onPickSub} pickableSubIds={new Set([open])} />);
    const lockedChip = screen.getByText("Cửa hàng B").closest("button")!;
    expect(lockedChip.getAttribute("aria-disabled")).toBe("true");
    expect(lockedChip.getAttribute("title")).toBe("Sub-merchant đã khóa");
    fireEvent.click(lockedChip);
    expect(onPickSub).not.toHaveBeenCalled();
  });

  it("keeps every Sub clickable when the picker list is not known", () => {
    const onPickSub = vi.fn();
    render(<SettlementTotalsBar totals={totals} onPickSub={onPickSub} />);
    fireEvent.click(screen.getByText("Cửa hàng B").closest("button")!);
    expect(onPickSub).toHaveBeenCalledWith(locked);
  });
});
