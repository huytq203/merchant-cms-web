// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/sub-balances",
  useSearchParams: () => new URLSearchParams("page=3&range=DAYS_7"),
}));
import { SubMerchantPicker } from "../SubMerchantPicker";

const choices = [
  { id: "a", label: "SUB001 · Cửa hàng A" },
  { id: "b", label: "SUB002 · Cửa hàng B" },
];

afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("SubMerchantPicker", () => {
  it("puts the chosen Sub in the URL, keeps other filters and goes back to the first page", async () => {
    render(<SubMerchantPicker choices={choices} value="a" />);
    await userEvent.click(screen.getByRole("combobox", { name: /Sub-merchant/ }));
    await userEvent.click(await screen.findByRole("option", { name: "SUB002 · Cửa hàng B" }));
    expect(push).toHaveBeenCalledWith("/sub-balances?range=DAYS_7&subMerchantId=b");
  });

  it("does not navigate when the same Sub is chosen again", async () => {
    render(<SubMerchantPicker choices={choices} value="a" />);
    await userEvent.click(screen.getByRole("combobox", { name: /Sub-merchant/ }));
    await userEvent.click(await screen.findByRole("option", { name: "SUB001 · Cửa hàng A" }));
    expect(push).not.toHaveBeenCalled();
  });

  // Mục 14: màn có hỗ trợ xem mọi Sub truyền allLabel; chọn "Tất cả" bỏ subMerchantId khỏi URL.
  it("offers an all-Subs choice when asked and drops the Sub from the URL", async () => {
    render(<SubMerchantPicker choices={choices} value="a" allLabel="Tất cả sub-merchant" />);
    await userEvent.click(screen.getByRole("combobox", { name: /Sub-merchant/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Tất cả sub-merchant" }));
    expect(push).toHaveBeenCalledWith("/sub-balances?range=DAYS_7");
  });
});
