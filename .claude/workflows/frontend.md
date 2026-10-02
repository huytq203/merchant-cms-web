---
name: frontend-design
description: Dựng giao diện CMS vận hành (bảng, filter, form, dialog) nhất quán với design system và Basuicn của dự án.
---

# Frontend Design Workflow

Merchant CMS là sản phẩm **vận hành**: người dùng làm việc lặp lại với nhiều dữ liệu. Ưu tiên dễ quét, nhất quán và đúng thói quen thao tác hơn là gây ấn tượng. Thương hiệu thể hiện qua token và chi tiết nhỏ, không qua bố cục lạ.

Đây là bề mặt **Operate** theo Impeccable: scanability, consistency, accessibility và tốc độ hoàn thành tác vụ quan trọng hơn hiệu ứng trang trí.

## Gate trước khi code

Feature/UI task phải đi theo thứ tự:

1. **Brainstorming:** chốt mục tiêu, actor, flow, states, boundaries và acceptance criteria.
2. **Impeccable:** dùng `shape` cho surface/flow mới, `audit` hoặc `critique` cho UI hiện có, và `optimize` cho UI performance.
3. Đọc [design system](../DESIGN.md), [structure rules](../rules/STRUCTURE.md) và kiểm tra [Basuicn](../rules/BASUICN.md).
4. Chọn Server-only, Client-only hoặc Hybrid theo [Next.js performance rules](../rules/NEXTJS-PERFORMANCE.md).
5. Chốt skeleton, error, empty và data states theo [page-loading pattern](../patterns/page-loading.md).
6. Viết failing behavior test theo [testing rules](../rules/TESTING.md).
7. Mới bắt đầu implementation.

Không bỏ qua gate chỉ vì UI trông đơn giản; scale độ sâu theo rủi ro và phạm vi.

### Quy trình nhẹ

Typo, thay copy đơn giản, refactor không đổi behavior hoặc bugfix nhỏ đã có reproduction/expected behavior rõ chỉ cần ghi ngắn mục tiêu, phạm vi và verification. Không tạo spec, abstraction hoặc optimization không cần thiết; bug vẫn theo systematic bugfix step.

## Khi sử dụng

- Xây hoặc sửa page, bảng, filter, form, dialog, sheet, dashboard.
- Nâng cấp giao diện thiếu hierarchy hoặc lệch design system.

## Quy trình

### 1. Xác định tác vụ

Trước khi code, trả lời bằng một câu cho mỗi mục:

- Ai dùng (vai trò) và họ cần hoàn thành tác vụ nào.
- Dữ liệu chính, số lượng điển hình và cột/trường nào quan trọng nhất.
- Hành động chính của màn hình (đúng một CTA `variant="action"`) và hành động phá huỷ nếu có.

### 2. Kiểm tra component

Đọc [quy tắc Basuicn](../rules/BASUICN.md) và [playbook UI](../patterns/ui-components.md). Tìm trong `src/components/ui/` trước, rồi registry, trước khi tạo primitive mới.

### 3. Dùng token, không tạo mới

Màu, radius, shadow và font lấy từ [design system](../DESIGN.md) và `src/styles/index.css`. Không hard-code màu, không dùng palette Tailwind thô, không thêm token khi token hiện có đáp ứng được.

### 4. Bố cục theo mẫu quen thuộc

- Trang danh sách: tiêu đề + CTA chính, thanh filter, bảng, phân trang. Filter và phân trang đồng bộ với `searchParams`.
- Trang form: nhóm trường theo ý nghĩa, nhãn rõ ràng, lỗi hiển thị ngay tại trường, nút lưu cố định vị trí.
- Hành động phá huỷ (khoá, xoá, huỷ): dùng dialog xác nhận, nêu rõ đối tượng bị ảnh hưởng, nút xác nhận dùng màu `danger`.
- Trạng thái (active/locked/pending…) dùng `Badge` với token `success/warning/danger/info`; không chỉ dựa vào màu, luôn kèm chữ.
- Whitespace để tách nhóm; chỉ tăng mật độ khi người dùng cần so sánh nhiều dòng.

### 5. Dữ liệu và định dạng

- Tiền: dùng `Intl.NumberFormat('vi-VN')` kèm đơn vị; căn phải trong bảng, dùng số tabular (`tabular-nums`).
- Ngày giờ: một định dạng thống nhất toàn dự án qua `date-fns`; không tự ghép chuỗi.
- Chuỗi dài (tên, mã giao dịch, email): `truncate` kèm `title`/tooltip, không để vỡ cột.
- Mọi UI dữ liệu có đủ Loading (Skeleton), Error (có nút thử lại), Empty (có hướng dẫn bước tiếp theo) và Data, giữ chiều cao tương đương để tránh layout shift.

### 6. Motion

Chỉ dùng để phản hồi hành động hoặc giải thích chuyển trạng thái (mở sheet, đổi tab). Tôn trọng `prefers-reduced-motion`. Không animation trang trí.

## Anti-patterns

- Hơn một CTA vàng trên cùng màn hình.
- Màu feedback thay thế màu thương hiệu cho điều hướng; trạng thái chỉ thể hiện bằng màu.
- Inline style hoặc CSS-in-JS khi Tailwind token đã đáp ứng.
- Tự tạo primitive trong feature khi Basuicn hoặc `src/components/ui/` đã có.
- Dialog xác nhận chung chung ("Bạn có chắc không?") không nêu đối tượng.
- Hy sinh accessibility, responsive hoặc hiệu năng để lấy hiệu ứng.

## Quality gate (kiểm tra được)

- [ ] Không còn màu hard-code hoặc class palette thô (`grep` trong file đã sửa).
- [ ] Dùng component trong `src/components/ui/`; không có primitive trùng lặp.
- [ ] Đủ 4 state; Skeleton có kích thước gần với dữ liệu thật.
- [ ] Mở thủ công ở viewport **320px** và **1280px**: không cuộn ngang trang, bảng cuộn trong container.
- [ ] Chỉ dùng bàn phím: Tab đi hết các điều khiển theo thứ tự hợp lý, Enter/Esc hoạt động trong dialog, focus ring hiển thị.
- [ ] Kiểm tra dark mode nếu màn hình dùng token nền/viền.
- [ ] Contrast chữ đạt WCAG AA; trạng thái có chữ kèm màu.
- [ ] Brainstorming và Impeccable decision đã được ghi nhận ở mức tương xứng; không overengineering task nhỏ.
- [ ] `npm run typecheck` và `npm run lint` sạch.
