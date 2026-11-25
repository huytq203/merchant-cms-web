import { toast } from "sonner";
import type { PasswordResetMode, PasswordResetResult } from "../schemas/password-reset.schema";

const MAIL_FAILED_MESSAGE =
  "Đặt lại mật khẩu thành công nhưng email gửi thất bại. Vui lòng thử gửi lại hoặc thông báo trực tiếp User.";

const SENT_MESSAGES: Record<PasswordResetMode, (email: string) => string> = {
  TEMP_PASSWORD: (email) => `Đã đặt lại mật khẩu. Mật khẩu tạm (hiệu lực 24 giờ) đã được gửi tới ${email}.`,
  RESET_LINK: (email) => `Đã gửi liên kết đặt lại mật khẩu tới ${email}.`,
  ACTIVATION_RESENT: (email) => `Đã gửi lại email kích hoạt tới ${email}`,
};

/**
 * The reset itself worked either way; the toast tells the admin whether the mail went out. A failed
 * mail is yellow, not red, because the password is already changed and they must tell the user themselves.
 */
export function notifyPasswordReset(result: PasswordResetResult, email: string): void {
  if (result.emailSent) toast.success(SENT_MESSAGES[result.mode](email));
  else toast.warning(MAIL_FAILED_MESSAGE);
}
