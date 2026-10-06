# Bối cảnh dự án Merchant CMS

## Stack

- Next.js 16.x, App Router; React 19.x; TypeScript 6.x (phiên bản chính xác xem `package.json`).
- Tailwind CSS v4.
- Basuicn components tại `src/components/ui/<name>/`.
- Base UI, TanStack Query, React Hook Form và Zod.

## Ranh giới kiến trúc

- Server Component là mặc định; chỉ thêm `'use client'` ở lá cần tương tác.
- UI dùng component Basuicn trước khi cân nhắc giải pháp khác.
- Không đoán API Next.js; đọc `node_modules/next/dist/docs/`.
- Không đưa secret, truy vấn DB hoặc logic đặc quyền vào Client Component.

## Lệnh kiểm tra

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Chỉ chạy mức kiểm tra phù hợp với phạm vi thay đổi và báo rõ lỗi có sẵn không liên quan.

## Ràng buộc phiên bản đã biết

- **TypeScript 6.x, chưa lên 7**: `typescript-eslint` (qua `eslint-config-next`) chưa hỗ trợ TS 7 nên `npm run lint` sẽ hỏng.
- **ESLint 9.x, chưa lên 10**: `eslint-plugin-react` trong `eslint-config-next` bị crash với ESLint 10.
- Chỉ nâng hai gói trên khi `eslint-config-next` công bố hỗ trợ.
- Prisma đang ở 6.x; lên 7 cần migrate cấu hình client, làm riêng.
- `tsconfig.json` không dùng `baseUrl`; alias `@/*` khai báo qua `paths`.
- `npm run dev` giới hạn heap Node 2GB (`NODE_OPTIONS=--max-old-space-size=2048`); tăng trong `package.json` nếu dev crash vì hết bộ nhớ.

## Vị trí quan trọng

- Design token (CSS variables, `@theme`): `src/styles/index.css`, `src/lib/theme/themes.ts`.
- BE client: `src/lib/be/` (typed, Zod-parsed `Result<T, BeError>`); server env `IDENTITY_BASE_URL`, `MERCHANT_BASE_URL`, `MERCHANT_API_MODE` (xem `.env.example`); session `src/lib/auth/session.ts` (`getServerSession` đọc `/merchant/me`).
- Test: Vitest + Testing Library + msw (`npm run test`).
- Baseline kiểm tra: `npm run typecheck` và `npm run lint` hiện sạch lỗi và cảnh báo; mọi cảnh báo mới đều là hồi quy.
