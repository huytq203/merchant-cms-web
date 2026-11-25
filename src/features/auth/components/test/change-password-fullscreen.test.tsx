// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChangePasswordFullScreen } from "@/features/auth/components/change-password-fullscreen";
import { saveChangePasswordTicket, readChangePasswordTicket } from "@/features/auth/utils/change-password-ticket";
import { makeQueryClient } from "@/lib/query/query-client";

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh, push: vi.fn() }) }));

const action = vi.hoisted(() => ({ changeFirstLoginPasswordAction: vi.fn() }));
vi.mock("@/features/auth/actions/change-password-action", () => action);

const PASSWORD = "MatKhau@2026x";
const EXPIRED_URL = "/login?reason=change-password-expired";

function renderPage() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <ChangePasswordFullScreen />
    </QueryClientProvider>,
  );
}

async function submit(user: ReturnType<typeof userEvent.setup>, value = PASSWORD, again = value) {
  await user.type(screen.getByLabelText("Mật khẩu mới"), value);
  await user.type(screen.getByLabelText("Nhập lại mật khẩu"), again);
  await user.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
}

beforeEach(() => {
  window.sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("ChangePasswordFullScreen", () => {
  it("goes back to the login page with the expired notice when there is no ticket", async () => {
    renderPage();
    await waitFor(() => expect(replace).toHaveBeenCalledWith(EXPIRED_URL));
  });

  it("goes back to the login page when the stored ticket has already expired", async () => {
    saveChangePasswordTicket("tk", 60, Date.now() - 120_000);
    renderPage();
    await waitFor(() => expect(replace).toHaveBeenCalledWith(EXPIRED_URL));
  });

  it("shows only the change-password form with the password rules, and no navigation", () => {
    saveChangePasswordTicket("tk", 600);
    renderPage();
    expect(screen.getByRole("heading", { name: "Đổi mật khẩu" })).toBeInTheDocument();
    expect(screen.getByLabelText("Mật khẩu mới")).toBeInTheDocument();
    expect(screen.getByLabelText("Nhập lại mật khẩu")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Yêu cầu mật khẩu" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("sends the ticket with both passwords, clears it and opens the dashboard on success", async () => {
    saveChangePasswordTicket("tk-9", 600);
    action.changeFirstLoginPasswordAction.mockResolvedValue({ success: true, data: { redirectTo: "/dashboard" } });
    const user = userEvent.setup();
    renderPage();
    await submit(user);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(action.changeFirstLoginPasswordAction).toHaveBeenCalledWith({ ticket: "tk-9", newPassword: PASSWORD, confirmPassword: PASSWORD });
    expect(readChangePasswordTicket()).toBeNull();
    expect(refresh).toHaveBeenCalled();
  });

  it("does not call the BE when the two passwords differ", async () => {
    saveChangePasswordTicket("tk", 600);
    const user = userEvent.setup();
    renderPage();
    await submit(user, PASSWORD, "Khac@2026xyz");
    expect(await screen.findByText("Mật khẩu nhập lại không khớp")).toBeInTheDocument();
    expect(action.changeFirstLoginPasswordAction).not.toHaveBeenCalled();
  });

  it("keeps the form and shows the BE message when the new password is refused", async () => {
    saveChangePasswordTicket("tk", 600);
    action.changeFirstLoginPasswordAction.mockResolvedValue({ success: false, error: "Mật khẩu mới phải khác mật khẩu tạm.", code: "20020" });
    const user = userEvent.setup();
    renderPage();
    await submit(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Mật khẩu mới phải khác mật khẩu tạm.");
    expect(replace).not.toHaveBeenCalled();
    expect(readChangePasswordTicket()).not.toBeNull();
  });

  it("returns to the login page with the expired notice when the BE rejects the ticket", async () => {
    saveChangePasswordTicket("tk", 600);
    action.changeFirstLoginPasswordAction.mockResolvedValue({ success: false, error: "Phiên đổi mật khẩu đã hết hạn, vui lòng đăng nhập lại.", code: "CHANGE_PASSWORD_TICKET_INVALID" });
    const user = userEvent.setup();
    renderPage();
    await submit(user);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(EXPIRED_URL));
    expect(readChangePasswordTicket()).toBeNull();
  });

  it("shows a retry message and keeps the form when the request itself throws", async () => {
    saveChangePasswordTicket("tk", 600);
    action.changeFirstLoginPasswordAction.mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    renderPage();
    await submit(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Không đổi được mật khẩu, vui lòng thử lại.");
    expect(replace).not.toHaveBeenCalled();
    expect(readChangePasswordTicket()).not.toBeNull();
  });

  it("drops the ticket and goes to login with the BE message when the password changed but no session could be issued", async () => {
    saveChangePasswordTicket("tk", 600);
    action.changeFirstLoginPasswordAction.mockResolvedValue({ success: false, error: "Đổi mật khẩu thành công, vui lòng đăng nhập lại bằng mật khẩu mới.", code: "SESSION_ISSUE_FAILED" });
    const user = userEvent.setup();
    renderPage();
    await submit(user);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?reason=password-changed"));
    expect(readChangePasswordTicket()).toBeNull();
  });

  it("returns to the login page when the ticket runs out while the form is open", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    saveChangePasswordTicket("tk", 5);
    renderPage();
    expect(replace).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5_500);
    expect(replace).toHaveBeenCalledWith(EXPIRED_URL);
  });
});
