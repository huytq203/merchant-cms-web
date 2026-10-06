// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
import { SessionUnavailable } from "@/features/auth/components/session-unavailable";

it("offers a retry that refreshes the route", () => {
  render(<SessionUnavailable />);
  expect(screen.getByRole("alert")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
  expect(refresh).toHaveBeenCalledOnce();
});
