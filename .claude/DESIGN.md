# Design System — Flexpay (Design System v2)

Nguồn: `flexpay-ewa-landing-color-guide`. Token khai báo ở `src/styles/index.css` (CSS variables + `@theme`) và `src/lib/theme/themes.ts`. Không hard-code màu; dùng class token (`bg-primary`, `bg-action`, `text-muted-foreground`, …).

## Màu
| Token | Light | Vai trò |
|---|---|---|
| `page` | `#F4F7F6` | Nền canvas |
| `background` | `#FFFFFF` | Surface: card, input, header, sidebar |
| `foreground` | `#1C2120` | Ink — heading, nội dung chính |
| `primary` | `#008175` | Brand deep — nút primary, link, điều hướng active |
| `brand` / `ring` | `#02CCBB` | Viền active, focus ring |
| `brand-ink` | `#005045` | Chữ và nền trên hero tối |
| `secondary` | `#D9F0EE` | Brand field — input đã điền, chọn active |
| `muted` / `accent` | `#EAF6F4` | Brand tint — hover, nền nhẹ |
| `action` | `#FFCD03` (hover `#F0BF00`) | Màu nhấn phụ (huy hiệu, điểm nhấn nhỏ). Không dùng cho nút |
| `success` | `#1F9A5B` (soft `#DCF3E5`) | Thành công |
| `warning` | `#8A6A00` (soft `#FFE07D`) | Cảnh báo |
| `danger` | `#DD1327` (soft `#FCE0E6`) | Lỗi, hành động phá huỷ |
| `info` | `#1E6FD9` (soft `#DCEBFB`) | Thông tin |
| `border` / `input` | `#CEE0E1` | Viền (divider `#DDEBEA`) |
| `muted-foreground` | `#5F5F5F` | Chữ diễn giải (caption `#738B8C`, placeholder `#8FA9AA`) |

Dark mode suy ra từ brand-ink: nền `#0B1413`, primary là teal `#02CCBB`, vàng giữ nguyên.

## Quy tắc
- CTA chính dùng `Button` mặc định `variant="solid"` (teal đặc); CTA phụ dùng `outline`; hành động nhẹ (Quay lại, Xóa bộ lọc) dùng `ghost`; xác nhận phá huỷ dùng `danger`. Mỗi màn hình và mỗi modal tối đa một CTA chính. Màu `action` (vàng) không dùng cho nút.
- Teal đảm nhiệm điều hướng và focus; màu feedback không thay thế màu thương hiệu.
- Nền `secondary` chỉ dùng cho trạng thái đã chọn hoặc đã điền.
- Radius: 6px (badge), 8px (popover), 12px (button, input, card), 16px (modal). Button không dùng pill.
- Shadow nhẹ: `shadow-subtle`, `shadow-micro` (tông teal).
- Không dùng tím/violet và không dùng palette Tailwind thô (`red-500`, `gray-600`, …).
- Trang danh sách: card bộ lọc (các ô cùng một hàng, hai nút Xóa bộ lọc và Tìm kiếm ở hàng dưới, căn phải) tách khỏi card bảng; phân trang nằm trong card bảng.
- Thao tác trong dòng bảng là icon button (`ghost`) kèm tooltip và `aria-label` nêu hành động và đối tượng; các dòng dùng chung số khe icon cố định để icon thẳng cột. Nút chính ở đầu trang có chữ kèm icon.
- Form ít trường hoặc chỉ xem dùng modal; form nhiều bước hoặc nhiều nhóm trường dùng trang riêng.
- Lưới form luôn đều cột (2 cột, 3 cột khi đúng 3 trường); mục lẻ cuối hàng trải hết hàng; badge trạng thái trong bảng cùng chiều rộng.

## Typography
Một họ chữ duy nhất: Be Vietnam Pro cho cả display và UI/Body (đầy đủ dấu tiếng Việt), tải bằng `next/font/google` với subset `latin` và `vietnamese`, độ đậm 400/500/600/700. Heading 700 với letter-spacing âm nhẹ; body 14–16px, 400–500.

## Responsive
Breakpoints: 375, 425, 640, 768, 1024, 1280, 1536px.
