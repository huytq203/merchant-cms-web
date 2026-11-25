// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MerchantUser } from "../../schemas/user.schema";
import { UserResetPasswordDialog } from "../UserResetPasswordDialog";

const actorId = "44444444-4444-4444-8444-444444444444";
const merchantId = "66666666-6666-4666-8666-666666666666";
const user: MerchantUser = {
  id: "55555555-5555-4555-8555-555555555555",
  keycloakUserId: "keycloak-user",
  email: "kien@example.com",
  fullName: "Nguyễn Văn Kiên",
  phone: null,
  active: true,
  locked: false,
  groups: [],
  merchantIds: [merchantId],
  subMerchantIds: [],
  rolesText: "",
  createdAt: "",
};
const merchants = [{ id: merchantId, code: "MC000001", name: "Halo tech" }];

function renderDialog(props: Partial<React.ComponentProps<typeof UserResetPasswordDialog>> = {}) {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <UserResetPasswordDialog
      open
      onOpenChange={onOpenChange}
      user={user}
      actorId={actorId}
      merchants={merchants}
      isPending={false}
      onConfirm={onConfirm}
      {...props}
    />,
  );
  return { onConfirm, onOpenChange };
}

afterEach(cleanup);

describe("user reset password dialog", () => {
  it("names the user, the email and the Merchant, and asks for no OTP", () => {
    renderDialog();
    expect(screen.getByText("Nguyễn Văn Kiên")).toBeInTheDocument();
    expect(screen.getAllByText(/kien@example\.com/).length).toBeGreaterThan(0);
    expect(screen.getByText("MC000001 · Halo tech")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/OTP/i)).not.toBeInTheDocument();
  });

  it("describes the temporary password for an active user, with the email and the sign-out", () => {
    renderDialog();
    expect(
      screen.getByText(
        "Hệ thống sẽ tạo mật khẩu tạm (hiệu lực 24 giờ) và gửi tới email kien@example.com. User phải đổi mật khẩu ở lần đăng nhập đầu tiên. Mọi phiên đăng nhập hiện tại của User sẽ bị đăng xuất.",
      ),
    ).toBeInTheDocument();
  });

  it("describes the activation mail for a pending user", async () => {
    const { onConfirm } = renderDialog({ user: { ...user, active: false } });
    expect(screen.getByText("Hệ thống sẽ gửi lại email kích hoạt tới kien@example.com.")).toBeInTheDocument();
    expect(screen.queryByText(/mật khẩu tạm/)).not.toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Đặt lại mật khẩu" });
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("confirms without any input", async () => {
    const { onConfirm } = renderDialog();
    await userEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("opens after its user is selected from a table row", () => {
    const props = { onOpenChange: vi.fn(), actorId, isPending: false, onConfirm: vi.fn() };
    const { rerender } = render(<UserResetPasswordDialog open={false} user={null} {...props} />);

    rerender(<UserResetPasswordDialog open user={user} {...props} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("disables confirmation while the request is pending", () => {
    renderDialog({ isPending: true });
    expect(screen.getByRole("button", { name: /Đặt lại mật khẩu|Đang gửi/ })).toBeDisabled();
  });

  it("keeps the dialog open with an alert and a retry when the request failed", async () => {
    const { onConfirm } = renderDialog({ error: "Chưa đặt lại được mật khẩu. Vui lòng thử lại." });
    expect(screen.getByRole("alert")).toHaveTextContent("Chưa gửi được yêu cầu. Hệ thống đang gặp sự cố, thử lại sau ít phút.");
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["a locked user", { ...user, active: false, locked: true }],
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
