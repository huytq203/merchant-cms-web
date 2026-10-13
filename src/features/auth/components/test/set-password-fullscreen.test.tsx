// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SetPasswordFullScreen } from "@/features/auth/components/set-password-fullscreen";
import { makeQueryClient } from "@/lib/query/query-client";

const replace = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push }) }));

const challenge = { requestId: "r1", maskedRecipient: "a***@shop.vn", expiresInSeconds: 300, resendAfterSeconds: 60, resendRemaining: 3 };
const actions = vi.hoisted(() => ({
  requestSetPasswordOtpAction: vi.fn(),
  confirmSetPasswordOtpAction: vi.fn(),
  resendSetPasswordOtpAction: vi.fn(),
  checkSetPasswordLink: vi.fn(),
  retrySetPasswordAction: vi.fn(),
}));
vi.mock("@/features/auth/actions/set-password-action", () => actions);

const PASSWORD = "MatKhau@2026x";

function renderPage(link: { valid: true; maskedEmail: string | null } | { valid: false } = { valid: true, maskedEmail: "a***@shop.vn" }) {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <SetPasswordFullScreen token="tok" link={link} />
    </QueryClientProvider>,
  );
}

async function fillPassword(user: ReturnType<typeof userEvent.setup>, value = PASSWORD, again = value, submit = "Tiếp tục") {
  await user.type(screen.getByLabelText("Mật khẩu mới"), value);
  await user.type(screen.getByLabelText("Nhập lại mật khẩu"), again);
  await user.click(screen.getByRole("button", { name: submit }));
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SetPasswordFullScreen", () => {
  it("says the link cannot be used and offers the login page, without a form", async () => {
    const user = userEvent.setup();
    renderPage({ valid: false });
    expect(screen.getByRole("heading", { name: "Liên kết không dùng được" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Mật khẩu mới")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Về trang đăng nhập" }));
    expect(push).toHaveBeenCalledWith("/login");
  });

  it("shows which password rules are met while typing", async () => {
    const user = userEvent.setup();
    renderPage();
    const rules = screen.getByRole("list", { name: "Yêu cầu mật khẩu" });
    expect(rules).toHaveTextContent("Ít nhất 10 ký tự, chưa đạt");
    await user.type(screen.getByLabelText("Mật khẩu mới"), PASSWORD);
    expect(rules).toHaveTextContent("Ít nhất 10 ký tự, đã đạt");
    expect(rules).toHaveTextContent("Có chữ hoa, đã đạt");
  });

  it("does not call BE for a password that breaks a rule or does not match", async () => {
    const user = userEvent.setup();
    renderPage();
    await fillPassword(user, "short", "short");
    expect(await screen.findByText("Mật khẩu tối thiểu 10 ký tự")).toBeInTheDocument();
    cleanup();
    renderPage();
    await fillPassword(user, PASSWORD, PASSWORD + "y");
    expect(await screen.findByText("Mật khẩu nhập lại không khớp")).toBeInTheDocument();
    expect(actions.requestSetPasswordOtpAction).not.toHaveBeenCalled();
  });

  it("goes password, then the code, then done, and sends the link token with the password", async () => {
    const user = userEvent.setup();
    actions.requestSetPasswordOtpAction.mockResolvedValue({ success: true, data: challenge });
    actions.confirmSetPasswordOtpAction.mockResolvedValue({ success: true, data: true });
    renderPage();
    await fillPassword(user);
    expect(await screen.findByRole("heading", { name: "Nhập mã xác thực" })).toBeInTheDocument();
    expect(actions.requestSetPasswordOtpAction).toHaveBeenCalledWith({ token: "tok", newPassword: PASSWORD, confirmPassword: PASSWORD });
    await user.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
    await user.keyboard("123456");
    await user.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(await screen.findByRole("heading", { name: "Đã đặt mật khẩu" })).toBeInTheDocument();
    expect(actions.confirmSetPasswordOtpAction).toHaveBeenCalledWith({ requestId: "r1", otp: "123456" });
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("shows the BE message when the link was spent, and stays on the password step", async () => {
    const user = userEvent.setup();
    actions.requestSetPasswordOtpAction.mockResolvedValue({ success: false, error: "Liên kết đã hết hạn", code: "X" });
    renderPage();
    await fillPassword(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Liên kết đã hết hạn");
    expect(screen.getByLabelText("Mật khẩu mới")).toBeInTheDocument();
  });

  it("keeps a wrong code on the code step and brings the password back with Quay lại", async () => {
    const user = userEvent.setup();
    actions.requestSetPasswordOtpAction.mockResolvedValue({ success: true, data: challenge });
    actions.confirmSetPasswordOtpAction.mockResolvedValue({ success: false, error: "Mã OTP không đúng", code: "X" });
    renderPage();
    await fillPassword(user);
    await screen.findByRole("heading", { name: "Nhập mã xác thực" });
    await user.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
    await user.keyboard("000000");
    await user.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Mã OTP không đúng");
    await user.click(screen.getByRole("button", { name: "Quay lại" }));
    await waitFor(() => expect(screen.getByLabelText("Mật khẩu mới")).toHaveValue(PASSWORD));
  });

  describe("when the policy rejects the password after the code was accepted", () => {
    async function reachRejection(user: ReturnType<typeof userEvent.setup>) {
      actions.requestSetPasswordOtpAction.mockResolvedValue({ success: true, data: challenge });
      actions.confirmSetPasswordOtpAction.mockResolvedValue({
        success: false,
        error: "Mật khẩu mới không được trùng với các mật khẩu đã sử dụng gần đây",
        code: "20010",
      });
      renderPage();
      await fillPassword(user);
      await screen.findByRole("heading", { name: "Nhập mã xác thực" });
      await user.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
      await user.keyboard("123456");
      await user.click(screen.getByRole("button", { name: "Xác nhận" }));
    }

    it("asks for another password with the reason, without asking for a new code", async () => {
      const user = userEvent.setup();
      await reachRejection(user);
      expect(await screen.findByRole("heading", { name: "Chọn mật khẩu khác" })).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent("đã sử dụng gần đây");
      expect(screen.getByLabelText("Mật khẩu mới")).toHaveValue("");
      expect(actions.requestSetPasswordOtpAction).toHaveBeenCalledTimes(1);
    });

    it("finishes with the same code session once an acceptable password is sent", async () => {
      const user = userEvent.setup();
      actions.retrySetPasswordAction.mockResolvedValue({ success: true, data: true });
      await reachRejection(user);
      await screen.findByRole("heading", { name: "Chọn mật khẩu khác" });
      await fillPassword(user, "KhacHan@2026y", "KhacHan@2026y", "Đặt mật khẩu");
      expect(await screen.findByRole("heading", { name: "Đã đặt mật khẩu" })).toBeInTheDocument();
      expect(actions.retrySetPasswordAction).toHaveBeenCalledWith({
        requestId: "r1",
        newPassword: "KhacHan@2026y",
        confirmPassword: "KhacHan@2026y",
      });
      expect(actions.requestSetPasswordOtpAction).toHaveBeenCalledTimes(1);
    });

    it("keeps asking while the policy keeps rejecting, with the new reason", async () => {
      const user = userEvent.setup();
      actions.retrySetPasswordAction.mockResolvedValue({ success: false, error: "Mật khẩu không được trùng với email", code: "20018" });
      await reachRejection(user);
      await screen.findByRole("heading", { name: "Chọn mật khẩu khác" });
      await fillPassword(user, "KhacHan@2026y", "KhacHan@2026y", "Đặt mật khẩu");
      expect(await screen.findByRole("alert")).toHaveTextContent("trùng với email");
      expect(screen.getByRole("heading", { name: "Chọn mật khẩu khác" })).toBeInTheDocument();
    });

    it("starts over with a new code when the retry session has expired", async () => {
      const user = userEvent.setup();
      actions.retrySetPasswordAction.mockResolvedValue({ success: false, error: "Phiên OTP đã hết hạn", code: "22105" });
      await reachRejection(user);
      await screen.findByRole("heading", { name: "Chọn mật khẩu khác" });
      await fillPassword(user, "KhacHan@2026y", "KhacHan@2026y", "Đặt mật khẩu");
      expect(await screen.findByRole("heading", { name: "Đặt mật khẩu" })).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent(/mã OTP mới/);
      actions.requestSetPasswordOtpAction.mockResolvedValue({ success: true, data: challenge });
      await fillPassword(user, "KhacHan@2026y");
      expect(await screen.findByRole("heading", { name: "Nhập mã xác thực" })).toBeInTheDocument();
      expect(actions.requestSetPasswordOtpAction).toHaveBeenCalledTimes(2);
    });
  });
});
