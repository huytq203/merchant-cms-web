// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginFormPanel } from "@/features/auth/components/login-form-panel";
import { readChangePasswordTicket } from "@/features/auth/utils/change-password-ticket";
import { makeQueryClient } from "@/lib/query/query-client";

const replace = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: vi.fn() }),
  useSearchParams: () => searchParams,
}));

const verifyOtp = vi.hoisted(() => vi.fn());
vi.mock("@/features/auth/actions/login-action", () => ({
  loginAction: vi.fn().mockResolvedValue({
    success: true,
    data: {
      requestId: "r1",
      maskedRecipient: "a***@shop.vn",
      expiresInSeconds: 300,
      resendAfterSeconds: 60,
      resendRemaining: 3,
    },
  }),
  verifyLoginOtpAction: verifyOtp,
  resendLoginOtpAction: vi.fn(),
}));

function renderPanel() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <LoginFormPanel onForgotPassword={vi.fn()} />
    </QueryClientProvider>,
  );
}

async function reachOtpStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole("textbox", { name: "Email" }), "user@shop.vn");
  await user.type(screen.getByLabelText("Mật khẩu"), "password123");
  await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
  await screen.findByRole("heading", { name: "Nhập mã xác thực" });
}

describe("LoginFormPanel", () => {
  afterEach(() => {
    cleanup();
    replace.mockClear();
    verifyOtp.mockReset();
    searchParams = new URLSearchParams();
    window.sessionStorage.clear();
  });

  it("sends a user on a temporary password to the change-password page, keeping the ticket in sessionStorage", async () => {
    verifyOtp.mockResolvedValue({ success: true, data: { mustChangePassword: true, ticket: "tk-1", ticketExpiresInSeconds: 600 } });
    const user = userEvent.setup();
    renderPanel();
    await reachOtpStep(user);
    await user.paste("123456");
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/auth/change-password"));
    expect(readChangePasswordTicket()?.ticket).toBe("tk-1");
    expect(window.localStorage.length).toBe(0);
  });

  it("tells the user to sign in with the new password after a forced change that issued no session", () => {
    searchParams = new URLSearchParams("reason=password-changed");
    renderPanel();
    expect(screen.getByRole("alert")).toHaveTextContent("Đổi mật khẩu thành công, vui lòng đăng nhập lại bằng mật khẩu mới.");
  });

  it("shows the expired-session notice when sent back from the change-password page", () => {
    searchParams = new URLSearchParams("reason=change-password-expired");
    renderPanel();
    expect(screen.getByRole("alert")).toHaveTextContent("Phiên đổi mật khẩu đã hết hạn, vui lòng đăng nhập lại.");
  });

  it("shows the OTP step after login and returns to credentials with Back", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={makeQueryClient()}>
        <LoginFormPanel onForgotPassword={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { name: "Chào mừng trở lại" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quay lại" })).not.toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Email" }), "user@shop.vn");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("heading", { name: "Nhập mã xác thực" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Quay lại" }));
    expect(screen.getByRole("heading", { name: "Chào mừng trở lại" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quay lại" })).not.toBeInTheDocument();
  });
});
