// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MerchantUser } from "../../schemas/user.schema";
import { UserResetPasswordDialog } from "../UserResetPasswordDialog";

const actorId = "44444444-4444-4444-8444-444444444444";
const user: MerchantUser = {
  id: "55555555-5555-4555-8555-555555555555",
  keycloakUserId: "keycloak-user",
  email: "kien@example.com",
  fullName: "Nguyễn Văn Kiên",
  phone: null,
  isActive: true,
  isLocked: false,
  groups: [],
  status: "ACTIVE",
  groupIds: [],
  merchantIds: [],
  subMerchantIds: [],
  rolesText: "",
  createdAt: "",
};

function renderDialog(props: Partial<React.ComponentProps<typeof UserResetPasswordDialog>> = {}) {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <UserResetPasswordDialog
      open
      onOpenChange={onOpenChange}
      user={user}
      actorId={actorId}
      isPending={false}
      isSuccess={false}
      onConfirm={onConfirm}
      {...props}
    />,
  );
  return { onConfirm, onOpenChange };
}

afterEach(cleanup);

describe("user reset password dialog", () => {
  it("names the affected user and asks for no OTP", () => {
    renderDialog();
    expect(screen.getByText("Nguyễn Văn Kiên")).toBeInTheDocument();
    expect(screen.getByText("kien@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/OTP/i)).not.toBeInTheDocument();
  });

  it("explains the reset in exactly two safe statements", () => {
    renderDialog();

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Hệ thống gửi liên kết đặt lại mật khẩu tới email của người dùng.")).toBeInTheDocument();
    expect(screen.getByText("Bạn không nhìn thấy mật khẩu mới. Thao tác được ghi vào nhật ký hệ thống.")).toBeInTheDocument();
  });

  it("confirms without any input", async () => {
    const { onConfirm } = renderDialog();
    await userEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("opens after its user is selected from a table row", () => {
    const props = {
      onOpenChange: vi.fn(),
      actorId,
      isPending: false,
      isSuccess: false,
      onConfirm: vi.fn(),
    };
    const { rerender } = render(<UserResetPasswordDialog open={false} user={null} {...props} />);

    rerender(<UserResetPasswordDialog open user={user} {...props} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("disables confirmation while the request is pending", () => {
    renderDialog({ isPending: true });
    expect(screen.getByRole("button", { name: /Đặt lại mật khẩu|Đang gửi/ })).toBeDisabled();
  });

  it("shows the success state with a single Done button", async () => {
    const { onOpenChange } = renderDialog({ isSuccess: true });
    expect(screen.getByRole("status")).toHaveTextContent("Đã gửi yêu cầu đặt lại mật khẩu");
    expect(screen.queryByRole("button", { name: "Hủy" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Đặt lại mật khẩu" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Xong" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows a friendly backend error as an alert and offers a retry", async () => {
    const { onConfirm } = renderDialog({ error: "Hệ thống đang bận" });
    expect(screen.getByRole("alert")).toHaveTextContent("Chưa gửi được yêu cầu. Hệ thống đang gặp sự cố, thử lại sau ít phút.");
    expect(screen.queryByText("Hệ thống đang bận")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["a locked user", { ...user, status: "LOCKED" as const }],
    ["a pending user", { ...user, status: "PENDING" as const }],
    ["the current user", { ...user, id: actorId }],
  ])("blocks %s with an explanation", async (_label, target) => {
    const { onConfirm } = renderDialog({ user: target });
    expect(screen.getByRole("alert")).toHaveTextContent(/\S/);
    const confirm = screen.getByRole("button", { name: "Đặt lại mật khẩu" });
    expect(confirm).toBeDisabled();
    await userEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
