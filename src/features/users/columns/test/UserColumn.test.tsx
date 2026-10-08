// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Table } from "@/components/ui/table/Table";
import type { MerchantUser } from "../../schemas/user.schema";
import { buildUserColumns } from "../UserColumn";

const actorId = "44444444-4444-4444-8444-444444444444";
const base: MerchantUser = {
  id: "55555555-5555-4555-8555-555555555555",
  keycloakUserId: "keycloak-user",
  email: "kien@example.com",
  fullName: "Nguyễn Văn Kiên",
  phone: "0912345678",
  active: true,
  locked: false,
  groups: ["g1", "g2", "g3"],
  merchantIds: [],
  subMerchantIds: [],
  rolesText: "",
  createdAt: "",
};
const flagsOf = { ACTIVE: { active: true, locked: false }, PENDING: { active: false, locked: false }, LOCKED: { active: false, locked: true } } as const;
const names: Record<string, string> = { g1: "CSKH", g2: "Kế toán", g3: "Sale" };

function renderTable(user: MerchantUser, onReset = vi.fn()) {
  const columns = buildUserColumns({
    actorId,
    groupNamesOf: (ids) => ids.flatMap((id) => names[id] ?? []),
    onView: vi.fn(),
    onEdit: vi.fn(),
    onLock: vi.fn(),
    onUnlock: vi.fn(),
    onReset,
  }, 1, 10);
  render(<Table data={[user]} columns={columns} enableSorting={false} framed={false} />);
  return onReset;
}

afterEach(cleanup);

describe("user columns", () => {
  it("shows name, email, two group labels and the remaining count", () => {
    renderTable(base);
    expect(screen.getByText("Nguyễn Văn Kiên")).toBeInTheDocument();
    expect(screen.getByText("kien@example.com")).toBeInTheDocument();
    expect(screen.getByText("CSKH")).toBeInTheDocument();
    expect(screen.getByText("Kế toán")).toBeInTheDocument();
    expect(screen.queryByText("Sale")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("shows a placeholder when the phone number is empty", () => {
    renderTable({ ...base, phone: null });
    expect(screen.getByText("Chưa có")).toBeInTheDocument();
  });

  it("enables reset password for an active user who is not the actor", async () => {
    const onReset = renderTable(base);
    const button = screen.getByRole("button", { name: /Đặt lại mật khẩu Nguyễn Văn Kiên/ });
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onReset).toHaveBeenCalledWith(base);
  });

  it("disables reset password for a locked user and explains why", async () => {
    renderTable({ ...base, ...flagsOf.LOCKED });
    const button = screen.getByRole("button", { name: /Đặt lại mật khẩu/ });
    expect(button).toBeDisabled();
    await userEvent.hover(button.parentElement as HTMLElement);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(/\S/);
  });

  it("offers resend activation instead of reset password for a pending user", async () => {
    const onReset = renderTable({ ...base, ...flagsOf.PENDING });
    expect(screen.queryByRole("button", { name: /Đặt lại mật khẩu/ })).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Gửi lại kích hoạt Nguyễn Văn Kiên/ });
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onReset).toHaveBeenCalledWith({ ...base, ...flagsOf.PENDING });
  });

  it("disables reset password and lock when the row is the actor", () => {
    renderTable({ ...base, id: actorId });
    expect(screen.getByRole("button", { name: /Đặt lại mật khẩu/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Khóa Nguyễn Văn Kiên/ })).toBeDisabled();
  });

  it("offers unlock instead of lock for a locked user", () => {
    renderTable({ ...base, ...flagsOf.LOCKED });
    expect(screen.getByRole("button", { name: /Mở khóa/ })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /^Khóa/ })).not.toBeInTheDocument();
  });

  it("keeps the same number of row actions for every status", () => {
    renderTable(base);
    expect(within(screen.getByRole("table")).getAllByRole("button")).toHaveLength(4);
  });
});
