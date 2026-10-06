# Page loading và skeleton pattern

Mọi route có `page.tsx` phải có `loading.tsx`. File này tạo instant loading state và Suspense boundary cho route segment theo Next.js App Router. `loading.tsx` trong route group bao phủ mọi route con của group đó.

## Nguyên tắc

- Skeleton phản ánh layout thật; không chỉ spinner hoặc text “Loading”.
- Skeleton nhẹ, ưu tiên Server Component, không fetch và không effect.
- Kích thước fallback gần content thật để giảm layout shift.
- Dùng Basuicn `Skeleton` và design tokens; không hard-code palette.
- Reuse skeleton component khi page và nested Suspense cần cùng một shape.

## Table skeleton

Giữ footprint của:

- Page header và primary action.
- Filter/search toolbar.
- Column widths, header height và số hàng đại diện.
- Row height/action column.
- Pagination hoặc result summary.

Không render random widths làm table nhảy mạnh khi data xuất hiện.

## Form skeleton

Giữ section headings, label/control pairs, helper/error space và action row. Multi-step form phải giữ step indicator.

## Detail skeleton

Giữ title/actions, summary fields, tabs hoặc section boundaries, và các content blocks quan trọng.

## Granular Suspense

- Tách boundary cho vùng chậm hoặc có giá trị hiển thị độc lập.
- Giữ interactive shell bên ngoài boundary khi có thể.
- Không chia từng widget nhỏ nếu tất cả phụ thuộc cùng request hoặc xuất hiện cùng nhau.
- Background refetch giữ data cũ và hiển thị feedback nhẹ; không quay lại full-page skeleton.

## Error và empty

Skeleton không thay thế error/empty states. Route thêm `error.tsx` khi cần recovery riêng; component dữ liệu vẫn phải xử lý loading, error, empty và data.

