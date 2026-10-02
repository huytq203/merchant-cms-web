# React SPA (Vite) Workflow

Chỉ dùng workflow này cho repository React/Vite. Trong repository Next.js hiện tại, ưu tiên [Next.js workflow](nextjs.md).

## Stack kỳ vọng

- React 19, Vite, TypeScript strict và Tailwind CSS v4.
- TanStack Router, TanStack Query, Zustand, React Hook Form và Zod.
- UI dùng Basuicn theo [quy tắc chung](../rules/BASUICN.md).

## Kiến trúc

- Đây là CSR SPA: không dùng Server Component, Server Action hoặc `'use client'`.
- Group theo domain; colocate component, hook, API và test liên quan.
- Giữ hierarchy phẳng; chỉ promote shared logic khi có ít nhất hai consumer.

## Data và state

- Dùng TanStack Query cho API data; không fetch bằng `useEffect`.
- Filter, sort và pagination đồng bộ vào URL search params.
- Zustand dành cho global client UI state; `useState` cho local state.
- Data component phải có loading, error, empty và data states.

## Security và performance

- Không lưu secret trong biến `VITE_*`; chúng là public.
- Không lưu JWT vào `localStorage`; ưu tiên HTTP-only cookie hoặc kiến trúc auth đã duyệt.
- Lazy-load page, không lazy-load layout một cách máy móc.
- Debounce search phù hợp và virtualize danh sách dài khi đo đạc cho thấy cần thiết.
- Static hosting phải có SPA fallback về `index.html`.

## Chất lượng

- Named exports, logic phức tạp nằm ngoài JSX, không prop-drill sâu.
- Kiểm tra responsive, accessibility, test, typecheck và build theo phạm vi.

