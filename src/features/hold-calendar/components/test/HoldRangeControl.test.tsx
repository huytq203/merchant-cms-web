// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/hold-calendar",
  useSearchParams: () => new URLSearchParams("subMerchantId=a"),
}));
import { HoldRangeControl } from "../HoldRangeControl";

afterEach(cleanup);

describe("HoldRangeControl", () => {
  it("marks the current range and keeps the Sub when another range is chosen", async () => {
    render(<HoldRangeControl value="DAYS_30" />);
    expect(screen.getByRole("button", { name: "30 ngày" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tất cả" })).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(screen.getByRole("button", { name: "Tất cả" }));
    expect(push).toHaveBeenCalledWith("/hold-calendar?subMerchantId=a&range=ALL");
  });
});
