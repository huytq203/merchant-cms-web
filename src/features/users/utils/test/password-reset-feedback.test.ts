import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { notifyPasswordReset } from "../password-reset-feedback";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }));

const email = "kien@example.com";

beforeEach(() => vi.clearAllMocks());

describe("notifyPasswordReset", () => {
  it.each([
    ["TEMP_PASSWORD", "Đã đặt lại mật khẩu. Mật khẩu tạm (hiệu lực 24 giờ) đã được gửi tới kien@example.com."],
    ["RESET_LINK", "Đã gửi liên kết đặt lại mật khẩu tới kien@example.com."],
    ["ACTIVATION_RESENT", "Đã gửi lại email kích hoạt tới kien@example.com"],
  ] as const)("shows a green toast naming the email for %s when the mail went out", (mode, text) => {
    notifyPasswordReset({ mode, emailSent: true }, email);
    expect(toast.success).toHaveBeenCalledWith(text);
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it.each(["TEMP_PASSWORD", "RESET_LINK", "ACTIVATION_RESENT"] as const)("shows the yellow toast for %s when the mail failed", (mode) => {
    notifyPasswordReset({ mode, emailSent: false }, email);
    expect(toast.warning).toHaveBeenCalledWith(
      "Đặt lại mật khẩu thành công nhưng email gửi thất bại. Vui lòng thử gửi lại hoặc thông báo trực tiếp User.",
    );
    expect(toast.success).not.toHaveBeenCalled();
  });
});
