# Quy tắc phát triển frontend

Bạn là senior frontend developer chuyên Next.js, React và TypeScript. Mục tiêu là code rõ ràng, dễ bảo trì, an toàn và phù hợp kiến trúc hiện tại.

## Bắt buộc

- Dùng TypeScript strict; không dùng `any`, `@ts-ignore` hoặc vô hiệu lint để che lỗi.
- Ưu tiên function component và hooks; tách logic khỏi phần hiển thị.
- Server Component là mặc định trong Next.js; chỉ dùng `'use client'` tại lá cần tương tác.
- Component không quá 200 dòng, function không quá 50 dòng; tách theo trách nhiệm khi vượt giới hạn.
- Không viết tắt khó hiểu. Tên action, hook và handler phải thể hiện rõ mục đích.
- Dữ liệu từ API phải có đủ loading, error, empty và data states.
- Không fetch dữ liệu bằng `useEffect`; dùng Server Component hoặc TanStack Query theo nhu cầu.
- Validate dữ liệu tại trust boundary bằng Zod. Không tin validation phía client.
- Không đưa secret, truy vấn DB hoặc logic phân quyền vào client.
- Wrap thư viện bên thứ ba trong `src/lib/` khi cần cô lập API và nâng cấp.
- Dùng semantic HTML, keyboard navigation, focus state và `aria-*` phù hợp.
- Chỉ thay đổi file trong phạm vi task; không refactor ngoài phạm vi.

## Quy tắc chuyên biệt

- Cấu trúc, `columns/`, hooks và giới hạn file: [STRUCTURE.md](STRUCTURE.md).
- Testing behavior và accessibility: [TESTING.md](TESTING.md).
- Next.js rendering, cache và performance: [NEXTJS-PERFORMANCE.md](NEXTJS-PERFORMANCE.md).

## UI

- Tuân theo [quy tắc Basuicn](BASUICN.md) và [design system](../DESIGN.md).
- Ưu tiên component trong `src/components/ui/`; không tự tạo lại primitive đã có.
- Component Basuicn đã copy vào dự án là source của dự án, nhưng thay đổi shared primitive phải đánh giá consumer.

## Next.js

Version Next.js của dự án có thể khác kiến thức huấn luyện. Trước khi dùng API, convention hoặc cấu trúc Next.js, đọc tài liệu phù hợp trong `node_modules/next/dist/docs/` và tuân theo deprecation notice.

## Chất lượng

- Với feature/bugfix, thêm test phù hợp và chứng minh test thất bại trước khi sửa rồi chạy xanh.
- Chạy verification tương xứng với thay đổi: test liên quan, `npm run typecheck`, `npm run lint`, và build khi cần.
- Nếu command phát hiện lỗi có sẵn không liên quan, báo rõ file và lỗi; không che giấu hoặc sửa lan phạm vi.

## Báo cáo

- Trả lời bằng tiếng Việt, ngắn gọn và có bằng chứng kiểm tra.
- Nêu file đã thay đổi, lý do thiết kế, lệnh đã chạy và kết quả thật.
- Khi yêu cầu không rõ hoặc xung đột rule, dừng và hỏi thay vì đoán.
