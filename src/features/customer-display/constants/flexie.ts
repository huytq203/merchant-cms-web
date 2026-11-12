import type { StaticImageData } from "next/image";
import cappy01 from "../../../../public/customer-display/cappy-01.webp";
import cappy03 from "../../../../public/customer-display/cappy-03.webp";
import cappy07 from "../../../../public/customer-display/cappy-07.webp";
import cappy09 from "../../../../public/customer-display/cappy-09-cut.webp";
import cappy13 from "../../../../public/customer-display/cappy-13-cut.webp";
import cappy15 from "../../../../public/customer-display/cappy-15.webp";
import cappyPolice from "../../../../public/customer-display/cappy-police-cut.webp";
import logoMini from "../../../../public/customer-display/ic_logo_mini.svg";
import logoOnDark from "../../../../public/customer-display/ic_logo_on_dark.svg";

/**
 * Linh vật Flexie và câu chào của màn "Hiển thị cho khách", lấy nguyên từ mock up đã duyệt 12/11/2026
 * (ảnh từ assets app mobile, đặt ở `public/customer-display/`). Mỗi tư thế đi kèm một câu chào riêng.
 */
export type FlexiePose = { image: StaticImageData; say: string; sub: string };

// Import tĩnh (đi qua /_next/static, proxy bỏ qua) thay vì đường /public: bộ tối ưu ảnh của Next tự fetch đường
// /public mà không kèm cookie, proxy chuyển request đó sang trang đăng nhập nên ảnh hỏng (gặp khi chụp màn 12/11).

export const FLEXIE_POSES: readonly FlexiePose[] = [
  { image: cappy01, say: "Flexie chờ bạn quét mã nè", sub: "Mở app FlexPay, chọn Quét QR là thanh toán được ngay." },
  { image: cappy09, say: "Giơ máy lên, quét cái là xong", sub: "Không cần tiền mặt, không cần thẻ." },
  { image: cappy03, say: "Mua sắm thả ga, thanh toán một chạm", sub: "Trả thẳng từ số dư ví FlexPay của bạn." },
  { image: cappy07, say: "Đi chơi nhẹ tênh, khỏi mang ví", sub: "Chỉ cần chiếc điện thoại có FlexPay." },
  { image: cappy13, say: "Thanh toán nhẹ nhàng, chill thôi", sub: "Tiền tới cửa hàng ngay lập tức." },
  { image: cappyPolice, say: "Flexie gác cổng từng giao dịch", sub: "Luôn xác thực OTP trước khi trừ tiền." },
];

export const FLEXIE_THANKS: FlexiePose = {
  image: cappy15,
  say: "Cảm ơn bạn đã dùng FlexPay",
  sub: "Hẹn gặp lại bạn ở lần mua sắm tới nhé.",
};

export const DISPLAY_LOGOS = {
  onDark: logoOnDark,
  mini: logoMini,
} as const;

/** Hỏi trạng thái mỗi 3 giây; QR tĩnh báo thành công 5 giây rồi quay lại mã (yêu cầu 12/11/2026). */
export const STATUS_POLL_MS = 3_000;
export const STATIC_PAID_FLASH_MS = 5_000;
