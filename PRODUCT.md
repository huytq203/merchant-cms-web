# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Quản trị viên phía merchant (confirmed): người của đơn vị chấp nhận thanh toán (ĐVCNTT) dùng Merchant Portal để tự quản trị tài khoản của đơn vị mình.
Họ làm việc lặp lại trên desktop với nhiều dữ liệu, và mỗi người chỉ làm được những việc nằm trong nhóm quyền được gán (BE có 27 quyền, 7 nhóm).
Họ chỉ **tạo yêu cầu** và theo dõi trạng thái; việc phê duyệt do Flexpay làm ở admin portal riêng, không nằm trong sản phẩm này.
Nhân viên Flexpay không phải người dùng của app này (confirmed).

## Product Purpose

Merchant Portal cho merchant tự đăng ký hồ sơ ĐVCNTT/KYB, liên kết ngân hàng, quản lý sub-merchant, terminal (chi nhánh/cửa hàng), nhóm quyền và user,
rồi vận hành giao dịch, đơn hàng, hoàn tiền, khiếu nại và rút tiền/quyết toán. Thành công là merchant tự hoàn thành các việc này mà không cần nhờ Flexpay thao tác hộ.
Nguồn yêu cầu chức năng: `Ewallet_merchant quản trị tài khoản_v2` (SRS mục 3.1–3.29) và mockup *Flexpay Merchant Portal*.

## Positioning

[Chưa được người dùng xác nhận.] Dữ kiện có bằng chứng trong BE/SRS, chưa được xác nhận là điểm khác biệt:
cấu trúc Merchant → Sub-merchant → Terminal; maker-checker (gửi yêu cầu rồi chờ Flexpay duyệt); thao tác nhạy cảm cần OTP; phân quyền theo nhóm quyền cộng phạm vi sub-merchant; mọi thay đổi có audit log.

## Operating Context

- Tài khoản do Flexpay cấp và kích hoạt qua email; đăng nhập có bước OTP.
- Hồ sơ KYB/ĐVCNTT và đổi ngân hàng đi qua duyệt của Flexpay; merchant theo dõi trạng thái chờ duyệt, đã duyệt, bị từ chối kèm lý do.
- Tiền tệ VND; giao diện tiếng Việt.

## Capabilities and Constraints

- BE chỉ có sẵn cho merchant: `/merchant/auth/*`, `/merchant/me`, `GET /merchant/sub-merchants`. Phần còn lại phụ thuộc BE mở API cho token merchant (xem spec).
- Chưa có API trong hai service BE: transactions, refund, dispute, dashboard, nạp tiền, chi hộ.
- Đăng ký tài khoản tự phục vụ chưa có endpoint (undecided).

## Brand Commitments

Token và quy tắc trong `.claude/DESIGN.md` (Flexpay Design System v2) là bắt buộc; mockup là tham chiếu bố cục. Giao diện tiếng Việt.

## Evidence on Hand

- Mockup: `Flexpay Merchant Portal.dc.html`, `Cấu hình phí.dc.html`, thư mục `screenshots/` trong `~/Downloads/Giao diện ví doanh nghiệp Flexpay`.
- SRS: hai tệp PDF trong thư mục `uploads/` cùng thư mục trên; bản text ở `scraps/`.
- Không có dữ liệu thật của merchant; mọi số liệu trong mockup là mẫu.

## Product Principles

1. Merchant chỉ thấy và làm được điều quyền của họ cho phép; giao diện không gợi ý hành động bị cấm.
2. Mọi yêu cầu cần duyệt hiển thị trạng thái và lý do rõ ràng; không bao giờ để merchant đoán hồ sơ đang ở đâu.
3. Thao tác khoá, đặt lại mật khẩu và đổi thông tin tài chính phải nêu rõ đối tượng bị ảnh hưởng.
4. Dữ liệu nhiều, làm lặp lại: ưu tiên dễ quét, nhất quán và đúng thói quen thao tác hơn là gây ấn tượng.

## Accessibility & Inclusion

Điều hướng bàn phím đầy đủ, focus rõ, tương phản đạt WCAG AA, trạng thái không chỉ dựa vào màu; hiển thị tốt từ 320px (theo `.claude/workflows/frontend.md`).
