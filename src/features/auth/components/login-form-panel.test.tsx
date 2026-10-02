// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginFormPanel } from "@/features/auth/components/login-form-panel";
import { makeQueryClient } from "@/lib/query/query-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

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
  verifyLoginOtpAction: vi.fn(),
  resendLoginOtpAction: vi.fn(),
}));

describe("LoginFormPanel", () => {
  afterEach(cleanup);

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
