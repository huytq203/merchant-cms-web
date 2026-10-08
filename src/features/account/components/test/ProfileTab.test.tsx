// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProfileTab } from "../ProfileTab";

vi.mock("../../hooks/use-update-profile-mutation", () => ({
  useUpdateProfileMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
afterEach(cleanup);

it("offers only full name and phone as profile form fields", () => {
  render(<ProfileTab user={{ userId: "user-1", username: "Test User", email: "user@example.com", phone: "0912345678", status: "ACTIVE", merchantIds: [], subMerchantIds: [], permissions: [], authorizationVersion: 1 }} />);
  expect(screen.getAllByRole("textbox")).toHaveLength(2);
  expect(screen.getByRole("textbox", { name: /Họ và tên/ })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /Số điện thoại/ })).toBeInTheDocument();
});
