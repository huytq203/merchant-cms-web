// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OtpPanel, type OtpPanelProps } from "@/features/auth/components/otp-panel";

const baseProps: OtpPanelProps = {
  maskedRecipient: "a***@shop.vn",
  expiresInSeconds: 300,
  resendAfterSeconds: 60,
  resendRemaining: 3,
  isSubmitting: false,
  isResending: false,
  errorMessage: null,
  noticeMessage: null,
  onSubmit: vi.fn(),
  onResend: vi.fn(),
};

const confirm = () => screen.getByRole("button", { name: "Xác nhận" });

async function typeCode(code: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
  await user.keyboard(code);
  return user;
}

describe("OtpPanel", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("splits the six digits into two groups of three with a dash between them", () => {
    render(<OtpPanel {...baseProps} />);
    expect(screen.getByText("–")).toBeInTheDocument();
  });

  it("keeps confirm disabled until six digits are entered, then submits the code", async () => {
    const onSubmit = vi.fn();
    render(<OtpPanel {...baseProps} onSubmit={onSubmit} />);
    expect(confirm()).toBeDisabled();

    const user = await typeCode("12345");
    expect(confirm()).toBeDisabled();

    await user.keyboard("6");
    expect(confirm()).toBeEnabled();
    await user.click(confirm());
    expect(onSubmit).toHaveBeenCalledWith("123456");
  });

  it("submits immediately when a complete six-digit code is pasted", async () => {
    const onSubmit = vi.fn();
    render(<OtpPanel {...baseProps} onSubmit={onSubmit} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
    await user.paste("123456");
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("123456");
  });

  it("does not submit a partial or non-numeric paste", async () => {
    const onSubmit = vi.fn();
    render(<OtpPanel {...baseProps} onSubmit={onSubmit} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
    await user.paste("12ab56");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(confirm()).toBeDisabled();
  });

  it("does not offer a clear-code button", () => {
    render(<OtpPanel {...baseProps} />);
    expect(screen.queryByRole("button", { name: "Xóa mã" })).not.toBeInTheDocument();
  });

  it("disables resend during the countdown and enables it afterwards", () => {
    vi.useFakeTimers();
    render(<OtpPanel {...baseProps} resendAfterSeconds={2} />);
    const resend = () => screen.getByRole("button", { name: /Gửi lại/ });
    expect(resend()).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(resend()).toBeEnabled();
  });

  it("disables resend when no resends remain", () => {
    render(<OtpPanel {...baseProps} resendAfterSeconds={0} resendRemaining={0} />);
    expect(screen.getByRole("button", { name: /Gửi lại|hết lượt/ })).toBeDisabled();
  });

  it("shows the error message and keeps the form usable", async () => {
    render(<OtpPanel {...baseProps} errorMessage="Mã OTP không đúng" />);
    expect(screen.getByText("Mã OTP không đúng")).toBeInTheDocument();
    await typeCode("123456");
    expect(confirm()).toBeEnabled();
  });

  it("renders the verification heading and masked recipient", () => {
    render(<OtpPanel {...baseProps} />);
    expect(screen.getByRole("heading", { name: "Nhập mã xác thực" })).toBeInTheDocument();
    expect(screen.getByText("a***@shop.vn")).toBeInTheDocument();
  });

  it("renders a positive notice", () => {
    render(<OtpPanel {...baseProps} noticeMessage="Đã gửi mã mới tới email của bạn." />);
    expect(screen.getByRole("status")).toHaveTextContent("Đã gửi mã mới tới email của bạn.");
  });

  it("disables confirmation when the code expires", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<OtpPanel {...baseProps} expiresInSeconds={2} />);
    await typeCode("123456");
    expect(confirm()).toBeEnabled();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getAllByText(/Mã đã hết hạn/).length).toBeGreaterThan(0);
    expect(confirm()).toBeDisabled();
  });

  it("explains when no resends remain", () => {
    render(<OtpPanel {...baseProps} resendRemaining={0} />);
    expect(screen.getByText("Bạn đã dùng hết lượt gửi lại. Hãy quay lại và đăng nhập lại để nhận mã mới.")).toBeInTheDocument();
  });

  it("prioritizes the server error over expiry and resend messages", () => {
    render(<OtpPanel {...baseProps} expiresInSeconds={0} resendRemaining={0} errorMessage="Mã OTP không đúng" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Mã OTP không đúng");
    expect(screen.queryByText("Bạn đã dùng hết lượt gửi lại. Hãy quay lại và đăng nhập lại để nhận mã mới.")).not.toBeInTheDocument();
    expect(screen.queryByText("Mã đã hết hạn. Gửi lại mã mới để tiếp tục.")).not.toBeInTheDocument();
  });
});
