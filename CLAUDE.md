# CLAUDE.md

Tài liệu định hướng cho Claude Code khi làm việc với repo này. Repo là **front-end thuần** (Next.js App Router), không chứa backend — mọi logic nghiệp vụ/DB nằm ở BE bên ngoài, FE chỉ gọi qua `NEXT_PUBLIC_API_LOGIN_URL`.

@AGENTS.md

## Nguyên tắc tối quan trọng
- **Next.js 16**: đây là phiên bản có breaking changes (xem mục "Next.js 16 notes"). Luôn đọc `node_modules/next/dist/docs` trước khi dùng API mới.
<!-- - **Front-end only**: tuyệt đối không thêm DB, password hashing, NextAuth, Prisma hay runtime BE trong repo này. Nếu cần mock, dùng công cụ riêng (MSW) — không commit vào source. -->
- **Wrap lib**: tất cả thư viện ngoài được wrap trong `src/lib` hoặc `src/features/*/api` để cô lập phụ thuộc.
- Tuân theo Rules và Workflow đã tài liệu hóa.

## Rules
@.claude/RULE.md

## Workflow Reference
@.claude/WORKFLOW_NEXTJS.md
@.claude/FE_WORKFLOW.md

## Design
@.claude/DESIGN.md

---

## Kiến trúc thư mục

```
src/
├── app/                     # App Router
│   ├── (auth)/login/        # route group — layout đăng nhập
│   ├── (cms)/dashboard/     # route group — layout CMS (sidebar + header)
│   ├── layout.tsx           # root layout (providers, fonts, metadata)
│   ├── page.tsx             # redirect / → /dashboard | /login
│   ├── error.tsx            # boundary lỗi toàn app
│   └── not-found.tsx
├── components/
│   ├── providers/           # AppProviders, QueryProvider
│   └── shared/
│       ├── ui/              # primitives (Button, Input, Card, ...)
│       └── layout/          # AppSidebar, AppHeader, CmsShell, ...
├── features/
│   └── auth/                # domain feature "auth"
│       ├── api/             # auth-api (wrap apiClient)
│       ├── components/      # LoginForm
│       ├── hooks/           # useLoginMutation, useLogoutMutation, useSessionQuery
│       └── schemas.ts       # Zod schema dùng chung client/server
├── hooks/                   # hooks dùng chéo feature (nếu ≥2 feature dùng)
├── lib/
│   ├── auth/session.ts      # getServerSession() — đọc cookie, gọi BE /auth/me
│   ├── env/public.ts        # Zod-validated NEXT_PUBLIC_* env
│   ├── http/
│   │   ├── api-client.ts    # fetch wrapper + ApiError
│   │   └── result.ts        # Result<T,E> type cho return giá trị
│   └── utils/cn.ts          # clsx + tailwind-merge
├── stores/ui-store.ts       # Zustand (sidebar collapse, persist)
├── config/site.ts           # siteConfig, primaryNav
├── types/auth.ts            # Contract BE (SessionUser, LoginResponse, UserRole)
└── proxy.ts                 # Route guard (Next.js 16 — thay cho middleware.ts)
```

### Quy tắc cấu trúc
- Tối đa 3 cấp thư mục. Đặt file gần nơi dùng; chỉ promote lên `shared/` hoặc `hooks/` khi có ≥2 feature dùng.
- **Named export** bắt buộc (trừ `page.tsx`/`layout.tsx`).
- Component tối đa 200 dòng, vượt là phải tách nhỏ.
- Server Component là mặc định. Chỉ dùng `"use client"` khi cần hook/event/browser API, và đặt càng sâu càng tốt.
- Mỗi component render data phải xử lý đủ 4 state: **Loading (Skeleton) · Error · Empty · Data**.

---

## Stack

| Lớp | Công cụ | Wrapper |
| --- | --- | --- |
| Framework | Next.js 16 App Router (Turbopack) | — |
| Ngôn ngữ | TypeScript strict (`noUncheckedIndexedAccess`) | — |
| Style | Tailwind CSS v4 (`@theme inline`, token OKLCH) | `src/lib/utils/cn.ts` |
| Primitives | Radix `@radix-ui/react-slot`, `@radix-ui/react-label` | `src/components/shared/ui/*` |
| Icon | `lucide-react` | Import trực tiếp — ổn định |
| Variant | `class-variance-authority` | `buttonVariants`, etc. |
| Server cache | TanStack Query v5 | `src/components/providers/query-provider.tsx` |
| Client state | Zustand + `persist` | `src/stores/ui-store.ts` |
| Form | React Hook Form + Zod | `src/components/shared/ui/field.tsx` |
| HTTP | `fetch` | `src/lib/http/api-client.ts` (`apiClient`, `ApiError`) |
| Session | HTTP-only cookie do BE set | `src/lib/auth/session.ts` |

Không có NextAuth, Prisma, hay bất kỳ phụ thuộc BE nào.

---

## Auth FE-only — contract với BE

Cookie phiên (mặc định `beam_session`) do BE set sau khi login thành công. FE chỉ đọc sự tồn tại cookie ở `proxy.ts` và gọi các endpoint:

| Method | Endpoint | Payload | Trả về |
| --- | --- | --- | --- |
| POST | `/auth/login` | `{ email, password }` | `{ user: SessionUser }` + set cookie |
| POST | `/auth/logout` | — | 204 + xoá cookie |
| GET  | `/auth/me` | (gửi cookie) | `SessionUser` hoặc 401 |

`SessionUser` được khai báo trong `src/types/auth.ts` — cập nhật kèm BE nếu đổi.

Mọi request đi qua `apiClient`, luôn `credentials: "include"` để browser gửi cookie kèm.

### Luồng đăng nhập / đăng xuất
1. `LoginForm` (client) → `useLoginMutation` → `authApi.login()` → `POST /auth/login`.
2. BE trả 200 + set cookie HTTP-only. React Query cache lại `SessionUser`.
3. `router.replace(callbackUrl)` + `router.refresh()` để Server Component chạy lại `getServerSession()`.
4. Logout: `useLogoutMutation` → `POST /auth/logout` → xoá cache + redirect `/login`.

### Route guard
- `src/proxy.ts` (matcher loại trừ `api`, `_next/static`, `_next/image`, assets) kiểm tra cookie:
  - Không có cookie và path không public → redirect `/login?callbackUrl=…`.
  - Có cookie và path là `/login` → redirect `/dashboard`.
- `(cms)/layout.tsx` gọi `getServerSession()`. Nếu BE trả 401 → redirect `/login` (phòng trường hợp cookie còn nhưng session hết hạn ở BE).

---

## Next.js 16 notes (phải biết)

- **File `middleware.ts` ĐÃ ĐỔI tên thành `proxy.ts`**. Hàm export là `proxy()` (hoặc default export). Runtime là **Node.js** (không còn edge). Không đặt `runtime` trong proxy.
- **Async Request APIs**: `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams` phải `await`. Ví dụ:
  ```ts
  const cookieStore = await cookies()
  const value = cookieStore.get("key")?.value
  ```
- **Turbopack mặc định** cho `dev` và `build`. Không thêm `--turbopack`. Nếu phải dùng webpack tạm thời: `next build --webpack`.
- **`next lint` đã bị xoá**. Dùng `eslint` CLI trực tiếp — đã cấu hình trong `package.json`.
- **Không dùng `experimental.typedRoutes`** nữa — đã lên top-level `typedRoutes: true`.
- Chi tiết: `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`.

---

## Environment variables

Tất cả env ở FE phải có prefix `NEXT_PUBLIC_` (vì đây là FE thuần). Được validate bằng Zod ở `src/lib/env/public.ts` — build sẽ fail nếu thiếu/sai định dạng.

| Biến | Ý nghĩa |
| --- | --- |
| `NEXT_PUBLIC_API_LOGIN_URL` | Base URL của BE (bắt buộc, URL hợp lệ) |
| `NEXT_PUBLIC_APP_NAME` | Tên app hiển thị |
| `NEXT_PUBLIC_APP_URL` | URL FE (cho metadataBase) |
| `NEXT_PUBLIC_SESSION_COOKIE` | Tên cookie phiên do BE set (mặc định `beam_session`) |

Copy `.env.example` → `.env.local` trước khi chạy dev.

---

## Scripts

```bash
npm run dev         # dev server (Turbopack)
npm run build       # production build
npm run start       # chạy bản build
npm run lint        # ESLint trên src/
npm run typecheck   # tsc --noEmit
npm run check       # typecheck + lint
```

---

## Khi thêm feature mới

1. Tạo thư mục `src/features/<tên-feature>/` với cấu trúc: `api/`, `components/`, `hooks/`, `schemas.ts`, `types.ts`.
2. Đặt gọi API qua `apiClient` trong `api/<tên>-api.ts`.
3. State server (data) → TanStack Query (`useXxxQuery`, `useXxxMutation`).
4. State global UI → `src/stores/*.ts` (Zustand + persist nếu cần cross-tab).
5. Filter/pagination/sort → đồng bộ với `searchParams` (URL is truth).
6. Định nghĩa Zod schema ở `schemas.ts`, share giữa form và API.
7. Lazy load page heavy bằng `next/dynamic` (chart, editor, ...) — không lazy load layout.
8. Viết unit test cho component (Vitest + Testing Library) trước khi coi là xong.

---

## Tiêu chí "xong" cho một UI task
- Type-check sạch (`npm run typecheck`).
- Build qua (`npm run build`).
- Component ≤ 200 dòng, không `any`, không `@ts-ignore`.
- Đủ 4 state (Loading / Error / Empty / Data).
- Đã kiểm tra tay trên Chrome desktop + viewport mobile (320px).
- Keyboard accessible (tab, enter, esc) + `aria-*` đúng vai trò.
- Không vi phạm design system: dùng token CSS của `globals.css`, không hard-code màu.
