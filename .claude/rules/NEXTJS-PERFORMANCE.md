# Quy tắc Next.js rendering và performance

Luôn đọc API/convention liên quan trong `node_modules/next/dist/docs/` trước khi code. Next.js 16 có behavior cache và rendering khác các phiên bản cũ.

## Chọn data pattern trước khi code

- **Server-only:** dữ liệu read-only, không cần browser refetch/mutation; render bằng Server Component.
- **Client-only:** dữ liệu chỉ xuất hiện sau tương tác như autocomplete hoặc modal lazy load.
- **Hybrid:** initial view cần dữ liệu và client tiếp tục filter, pagination, refetch, mutation hoặc sync; dùng [Hybrid Query pattern](../patterns/hybrid-query.md).

Không ép mọi query thành Hybrid. Chọn pattern nhỏ nhất đáp ứng behavior.

## Server và Client boundary

- `page.tsx` và layout là Server Components mặc định.
- Chỉ dùng Client Component cho state, events, custom client hooks hoặc browser APIs.
- Đặt `'use client'` ở lá nhỏ nhất để giảm JavaScript và hydration.
- Props từ server sang client phải nhỏ, cần thiết và serializable.
- Không fetch lại ở client nếu server output đã đáp ứng toàn bộ behavior.

## Phân loại cache

- Public, ít thay đổi: time-based cache/revalidation.
- Public, thay đổi theo domain event: cache tag và targeted invalidation.
- Private hoặc theo user/quyền: không shared cache; authentication/authorization tại server boundary.
- Realtime hoặc bắt buộc fresh: uncached, đặt sau Suspense boundary nếu làm chậm initial shell.

Không chọn cache API theo trí nhớ. Đọc docs local về `use cache`, `cacheLife`, `cacheTag`, `revalidatePath`, `revalidateTag` hoặc `updateTag` trước khi dùng.

## API calls và ownership

- Request độc lập khởi chạy song song bằng `Promise.all` hoặc bắt đầu promise trước khi await.
- Request phụ thuộc mới chạy tuần tự; dependency phải rõ trong code.
- Một dữ liệu có một owner; tránh fetch trùng ở page, hook và component con.
- Server Component gọi trực tiếp server data function; không tạo Route Handler proxy chỉ để gọi nội bộ.
- Query key chứa đầy đủ filters, sort, pagination và identity ảnh hưởng response.
- Mutation update/invalidate browser cache ở phạm vi nhỏ nhất.
- Nếu server response được cache, mutation invalidates đúng tag/path tương ứng.
- TanStack `staleTime` và server cache lifetime là hai lớp độc lập.

## Loading và streaming

- Mỗi route có `page.tsx` phải có `loading.tsx` theo [page-loading pattern](../patterns/page-loading.md).
- Dùng Suspense cho vùng async độc lập; không chia boundary máy móc.
- Tránh runtime/uncached work trong layout làm chặn route-level loading; chuyển xuống page hoặc boundary phù hợp.
- Loading, error, empty và data states phải giữ trải nghiệm liên tục, hạn chế layout shift.

## Navigation và bundle

- Dùng `next/link`, `next/image`, `next/font` và Metadata APIs khi phù hợp.
- Giữ Link prefetch mặc định; chỉ tắt/defer khi có bằng chứng request thừa, ví dụ table có rất nhiều links.
- Chỉ dynamic-import client component nặng và không thiết yếu ban đầu.
- Không thêm memoization, virtualization, debounce, cache layer hoặc custom prefetch nếu chưa có nhu cầu/đo đạc.
- Tối ưu request waterfall và client boundary trước khi thêm abstraction.

## Chống overengineering

Mỗi optimization phải nêu được bottleneck, capability Next.js sẵn có, cách đơn giản nhất, cache invalidation/security owner và bằng chứng. Nếu chưa trả lời được, giữ implementation đơn giản.

