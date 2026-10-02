# Next.js App Router Workflow

## Nhận diện

- Next.js 16.x App Router, React 19.x và TypeScript strict (phiên bản chính xác xem `package.json`).
- Tailwind CSS v4, Basuicn, Base UI, TanStack Query, React Hook Form và Zod.
- Đây không phải phiên bản Next.js có thể suy đoán từ kiến thức cũ.

## Bắt buộc trước khi code

Đọc tài liệu liên quan trong `node_modules/next/dist/docs/`. Tôn trọng API hiện hành và deprecation notice. UI phải tuân theo [quy tắc Basuicn](../rules/BASUICN.md).

Đồng thời đọc:

- [Next.js performance](../rules/NEXTJS-PERFORMANCE.md).
- [Hybrid Query pattern](../patterns/hybrid-query.md).
- [Page loading pattern](../patterns/page-loading.md).
- [Testing rules](../rules/TESTING.md).

Trước implementation, chọn rõ **Server-only**, **Client-only** hoặc **Hybrid** và ghi lý do ngắn.

## Component boundaries

- Server Component là mặc định cho initial fetch và server-only logic.
- Chỉ thêm `'use client'` cho interactivity, hooks hoặc browser API; giữ client boundary nhỏ và ở lá.
- Dùng named export, trừ `page`, `layout` và các convention file yêu cầu default export.
- Đặt Props interface ngay trên component.
- UI dữ liệu phải có loading, error, empty và data states.

## Data và mutation

- Initial fetch đơn giản thực hiện ở Server Component.
- TanStack Query dùng cho polling, caching phức tạp hoặc client refetch.
- Không dùng `useEffect` để fetch dữ liệu.
- Validate mutation input bằng Zod và kiểm tra authentication/authorization tại server boundary.
- Trả typed result; không leak raw error ra client.
- Revalidate bằng API đúng với tài liệu local khi mutation ảnh hưởng cache.

## Security và performance

- Không expose secret, API key, DB call hoặc sensitive logic cho client.
- Không tin client-side validation; luôn revalidate trên server.
- Không nối chuỗi raw SQL; dùng Prisma parameterized APIs.
- Dùng `next/image`, `next/font` và dynamic import khi đúng trường hợp theo docs local.
- Không memo hóa theo thói quen; chỉ dùng khi chi phí tính toán hoặc referential equality thực sự cần.

## Chất lượng

- Naming tự mô tả, early return, semantic HTML và keyboard navigation.
- Chạy test liên quan, typecheck, lint và build theo phạm vi.
