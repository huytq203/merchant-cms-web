// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/revenue-freezes",
  useSearchParams: () => new URLSearchParams("subMerchantId=a&status=ACTIVE"),
}));
import { FreezeStatusControl } from "../FreezeStatusControl";

afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("FreezeStatusControl", () => {
  it("marks the current status and keeps the Sub when another status is chosen", async () => {
    render(<FreezeStatusControl value="ACTIVE" />);
    expect(screen.getByRole("button", { name: "Đang đóng băng" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Đã gỡ băng" }));
    expect(push).toHaveBeenCalledWith("/revenue-freezes?subMerchantId=a&status=RELEASED");
  });

  it("drops the status from the URL when all states are chosen", async () => {
    render(<FreezeStatusControl value="ACTIVE" />);
    await userEvent.click(screen.getByRole("button", { name: "Tất cả" }));
    expect(push).toHaveBeenCalledWith("/revenue-freezes?subMerchantId=a");
  });
});
