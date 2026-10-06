# Đơn hàng, Rút tiền, dữ liệu mẫu và gỡ Prisma (Đợt 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Nối module Đơn hàng và Rút tiền với BE; chuyển 4 module không có API BE (giao dịch, hoàn tiền, khiếu nại, dashboard) sang dữ liệu mẫu tĩnh qua cùng giao diện service; gỡ hoàn toàn Prisma và phụ thuộc đăng nhập cục bộ.

**Architecture:** Đơn hàng và Rút tiền theo chu trình 6 task của `2026-10-05-module-template.md`. Bốn module không có API dùng **cùng ranh giới service** (`src/server/modules/<x>/<x>.service.ts` trả `BeResult`), nhưng nguồn là fixture tĩnh chọn qua `MERCHANT_API_MODE`, để khi BE có API chỉ đổi file service. Sau cùng gỡ Prisma.

**Tech Stack:** Next.js 16, TanStack Query v5, Zod 4, Vitest + msw, Basuicn.

**Spec:** `docs/superpowers/specs/2026-10-02-flexpay-be-integration-design.md` (mục 6, dòng "Fixture 4 màn thiếu API" và "Dọn mock"). **Mẫu chung:** `docs/superpowers/plans/2026-10-05-module-template.md`.

**Mockup tham chiếu UI** (khối có comment mã màn trong `~/Downloads/Giao diện ví doanh nghiệp Flexpay/Flexpay Merchant Portal.dc.html`): 3.1 DS giao dịch, 3.5 DS hoàn tiền, 3.7 Dashboard, 3.8 DS khiếu nại/tra soát, 3.10 Tạo đơn hàng thanh toán, 3.11 DS đơn hàng, 3.13 DS rút tiền/quyết toán.

## Điều kiện bắt buộc

1. **Chỉ làm sau khi plan 2a–2d xong**, vì Task cuối gỡ Prisma phải chắc chắn không còn consumer (`users`, `permissions`, `sub-merchants` đã được các plan trước thay).
2. **BE.** Đơn hàng và Rút tiền chỉ ở `/api/v1/admin/**` (`merchant-orders`, `merchant-withdrawal-requests`); chạy thật chờ BE mở `/merchant/**`.
3. **Rút tiền cần dữ liệu ngân hàng.** Màn tạo yêu cầu rút tiền (`WithdrawalNewStep*`) đã bị gỡ phần ngân hàng ở plan 2a (hiện "Thông tin tài khoản ngân hàng chưa có sẵn"). Khôi phục bằng dữ liệu tài khoản ngân hàng của plan 2c (`listBankAccounts`); nếu 2c chưa xong thì giữ thông báo hiện tại.

## BE hợp đồng giả định (Đơn hàng, Rút tiền)

| Module | Endpoint (tạm `/api/v1/admin`) | Ghi chú |
|---|---|---|
| Đơn hàng | `GET/POST /merchant-orders`, `GET /merchant-orders/{id}`, `POST .../{id}/confirm`, `POST .../{id}/refresh-qr` | Task 1 đọc DTO trong `MerchantOrderController` và các request/response liên quan (`application/dto/**/*Order*`), liệt kê trường vào schema trước khi viết mapper. `retry-credit` là thao tác vận hành: **không** đưa vào FE. |
| Rút tiền | `GET/POST /merchant-withdrawal-requests`, `GET /merchant-withdrawal-requests/{id}` | Như trên với `*Withdrawal*`. `approve` và `reconcile` là duyệt/đối soát của admin: **không** đưa vào FE. |

## Global Constraints

Mục "Quy tắc bắt buộc" và "Hợp đồng BE đã xác minh" của module template. Thêm:
- Quyền FE: `VIEW_ORDER`/`CREATE_ORDER`/`CANCEL_ORDER`/`CONFIRM_ORDER`, `VIEW_WITHDRAWAL`/`CREATE_WITHDRAWAL`/`EXPORT_WITHDRAWAL` (đã có trong `permissions.ts`); nút theo hành động chỉ hiện khi có quyền tương ứng (kiểm ở server **và** ẩn ở UI).
- Fixture chỉ dùng khi `MERCHANT_API_MODE=fixture`; `live` mà module không có API BE trả lỗi rõ ràng "Chưa hỗ trợ", **không** lặng lẽ trả dữ liệu mẫu ở production.
- Không dữ liệu thật trong fixture (không tên/số tài khoản/email thật); nhãn rõ ràng là dữ liệu minh hoạ trong UI khi chạy fixture (banner dev-only).
- Gỡ Prisma phải là thay đổi **chỉ xoá** kèm bằng chứng không còn import (`grep` trống), không đổi hành vi.

## Review Focus

- Tạo đơn: số tiền ≤ 0, vượt hạn mức hoặc sai định dạng bị chặn ở client và hiển thị lỗi BE đúng ô; bấm gửi hai lần không tạo hai đơn (disable khi đang gửi; BE nên có idempotency, nếu có header/khoá thì gửi).
- Đơn đã `PAID/EXPIRED/CANCELLED`: không còn nút xác nhận/làm mới QR; QR hết hạn có nút "Làm mới QR" và không hiển thị mã cũ.
- Rút tiền vượt số dư hoặc tài khoản chưa liên kết: lỗi BE hiển thị rõ, không mất dữ liệu form.
- Chế độ fixture ở production: bị chặn (xem Global Constraints).
- Danh sách rỗng, phân trang `size ≤ 100`, lọc theo thời gian ngược khoảng bị chặn.

---

## Phần A — Đơn hàng

### Task 1: Schema + mapper Đơn hàng
**Files:** `src/features/orders/schemas/*.ts`, `utils/order-mapper.ts` (+ tests), cập nhật `types/types.ts`.
- [ ] Đọc DTO Java, liệt kê trường vào schema (nhận cả khoá `default`-kiểu Lombok nếu có `isX`), test: parse mẫu, enum trạng thái lạ bị từ chối, `canConfirmOrder`/`canRefreshQr` theo trạng thái, form số tiền, mapper không gửi chuỗi rỗng.

### Task 2–4: Service, route, query/trang Hybrid Đơn hàng
- [ ] Theo template (Task 2, 3, 4): `order.paths.ts`, `order.service.ts` (+ msw), `src/app/api/v1/admin/orders/**` (kiểm quyền hành động, sở hữu qua detail), `order-queries.ts`, `src/app/(cms)/order/{page,loading}.tsx`.

### Task 5: UI Đơn hàng
**Files:** tái dùng `OrderTable`, `OrderFilter`, `OrderForm`, `DialogOrderDetail`, `DialogOderQR` (viết lại theo schema mới); `OrderAddNew` dùng `useSubMerchantOptions`; xoá route `order/new` và chuyển thành modal.
- [ ] Test tích hợp container: tạo đơn → POST đúng body → hiện QR; confirm/refresh-qr theo trạng thái; hai lần bấm gửi chỉ một request.

## Phần B — Rút tiền

### Task 6: Schema + mapper Rút tiền
- [ ] Như Task 1 cho `withdrawals`; thêm `canCancelWithdrawal` nếu BE có (đọc DTO), mapper form → request, `maskAccountNumber` dùng chung với plan 2c.

### Task 7–9: Service, route, query/trang, UI Rút tiền
- [ ] Theo template; `src/app/(cms)/withdrawal/{page,loading}.tsx`; luồng `WithdrawalNewStep1/2/Preview` chuyển thành **modal nhiều bước** (không route `withdrawal/new`, `withdrawal/[id]`); bước 1 chọn sub-merchant (`useSubMerchantOptions`) và tài khoản ngân hàng (plan 2c); chi tiết là modal chỉ đọc.
- [ ] Test tích hợp: tạo yêu cầu qua hai bước gọi POST đúng body; vượt số dư hiện lỗi BE và giữ dữ liệu; chi tiết hiển thị trạng thái chờ duyệt chỉ đọc.

## Phần C — Fixture cho 4 module không có API

### Task 10: Ranh giới service + fixture
**Files:** `src/server/modules/{transactions,refund,complaints,dashboard}/<x>.service.ts` (viết lại), `<x>.fixtures.ts` (+ test), `src/lib/be/api-mode.ts` (+ test).
**Interfaces — Produces:** `resolveModuleSource(module): 'fixture' | 'unsupported'` — `fixture` khi `MERCHANT_API_MODE=fixture` và `NODE_ENV !== 'production'`; mọi trường hợp khác `unsupported`; mỗi service trả `ok(fixtureData)` hoặc `fail(UNSUPPORTED)` (mã `NOT_IMPLEMENTED`, status 501).
- [ ] Test: fixture trả đúng schema Zod của module; production ép `unsupported` kể cả khi env sai; `live` trả 501; fixture không chứa dữ liệu thật (kiểm bằng danh sách khoá cho phép).
- [ ] Route handler của bốn module giữ nguyên đường dẫn, lọc quyền (`VIEW_TRANSACTION`, `VIEW_REFUND`, `VIEW_DISPUTE`, dashboard theo session), chuyển 501 thành thông báo "Chưa hỗ trợ" ở UI.

### Task 11: UI bốn module
- [ ] Giữ UI hiện có, đổi nguồn dữ liệu sang service mới; banner dev-only "Dữ liệu minh hoạ" khi fixture; trang đủ 4 trạng thái kể cả "Chưa hỗ trợ"; mọi `page.tsx` có `loading.tsx`.

## Phần D — Gỡ Prisma và đăng nhập cục bộ

### Task 12: Gỡ Prisma
**Files (xoá):** `prisma/`, `src/lib/db/prisma.ts`, mọi `*.repository.ts` và `*.entity.ts` dùng `@prisma/client` trong `src/server/modules/**`, script/seed liên quan trong `package.json`, `.env.example` biến `DATABASE_URL` nếu còn.
- [ ] Bằng chứng trước khi xoá: `grep -rn "@prisma/client\|lib/db/prisma\|bcryptjs\|jsonwebtoken" src` chỉ còn file sắp xoá.
- [ ] Gỡ dependency: `@prisma/client`, `prisma`, `bcryptjs`, `jsonwebtoken`, `@types/jsonwebtoken` (chỉ khi grep xác nhận không còn dùng; `src/lib/auth/jwt.ts` dùng decode thủ công, kiểm trước), cập nhật lockfile bằng `npm install`.
- [ ] `npm run check` sạch; `npm run build` **do người dùng chạy** (agent không chạy build).

### Task 13: Nghiệm thu Đợt 3
- [ ] Chạy `npm run check`; đọc lại các container và route; kiểm không còn chuỗi tiếng Anh trong UI, không còn mock/Prisma; báo cáo trung thực phần chờ BE.
- [ ] Cập nhật `.claude/project-context/CONTEXT.md` mô tả trạng thái dữ liệu (live/fixture/unsupported) và danh sách endpoint BE còn chờ mở.

## Self-Review

- Spec mục 6: Fixture 4 màn (Task 10–11), Dọn mock (Task 12), Đợt 3 transactions/finance (Đơn hàng, Rút tiền).
- Rủi ro mở: DTO đơn hàng/rút tiền chưa được liệt kê chi tiết (Task 1/6 đọc Java); phụ thuộc plan 2c cho dữ liệu ngân hàng; phụ thuộc BE `/merchant/**`.
