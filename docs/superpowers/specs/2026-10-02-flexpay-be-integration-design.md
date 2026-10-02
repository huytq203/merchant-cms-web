# Flexpay Merchant Portal — Nối BE thật & ghép mockup (Đợt 1–2)

Ngày: 2026-10-02 · Phiên bản 2 (viết lại sau khi xác định đối tượng) · Trạng thái: chờ review · Đường: Architectural

## 0. Thay đổi so với phiên bản 1

Phiên bản 1 coi app là CMS của nhân viên Flexpay. **Sai.** Đối chiếu SRS và mockup cho thấy:

- `srs2` (mục 3.1–3.29) khớp từng mã màn với mockup *Flexpay Merchant Portal*. Đây là **Merchant Portal**, chính là app này.
- `srs` (mục 2.5–2.6: phê duyệt/từ chối ĐVCNTT, key kết nối, hình thức thanh toán) thuộc **admin portal riêng** của Flexpay, không nằm trong repo này.
- Người dùng app này là **quản trị viên phía merchant**. Họ **chỉ tạo yêu cầu** (KYB, đăng ký ĐVCNTT, liên kết ngân hàng…) và theo dõi trạng thái; **không có màn duyệt**.

Vì vậy bỏ: route group admin/merchant, màn duyệt KYB, nav theo `PERMISSION_EWALLET`. App có một vai trò (merchant user) và phân quyền theo `MerchantPermission`.

## 1. Mục tiêu và phạm vi

Biến app từ Prisma + mock thành client của `flexpay.identity` và `flex.merchant`, ghép giao diện mockup vào các màn đã có, bổ sung màn còn thiếu.

| Đợt | Phạm vi |
|---|---|
| 1 | Nền tảng: nền test, client BE, đăng nhập merchant thật, session + menu theo quyền, hạ tầng Hybrid |
| 2 | Quản trị tài khoản (SRS2 3.8–3.29): hồ sơ KYB/ĐVCNTT/ngân hàng (gửi yêu cầu + theo dõi), sub-merchant, nhóm quyền, user, terminal, cập nhật tài khoản, audit log |
| 3 | Giao dịch & tài chính: đơn hàng, rút tiền/quyết toán, số dư/sổ phụ, cấu hình phí, key/webhook; gỡ Prisma |

Ngoài phạm vi: màn mockup có nhưng BE chưa có API và SRS chưa chốt (nạp tiền, rút tiền từ ví, chi hộ).
Đăng ký tài khoản (3.1–3.3): BE chưa có endpoint đăng ký; tài khoản do Flexpay cấp và kích hoạt qua email. Ghi vào backlog; chỉ làm lại trang kích hoạt/đặt mật khẩu bằng endpoint `reset-password/validate` đã có.

**Gỡ Prisma (đã duyệt)**: bỏ Prisma, `DATABASE_URL`, bcrypt/JWT cục bộ, mock store, `database/seed.sql`, và cập nhật `CLAUDE.md` gốc, `CONTEXT.md`, `.env.example`.
Bốn màn chưa có API (transactions, refund, complaints, dashboard) chuyển sang fixture tĩnh, không DB (đã duyệt); tác vụ ghi của chúng chạy trong bộ nhớ.
Task gỡ Prisma nằm cuối đợt 3, khi `grep "@/lib/db"` không còn consumer.

## 2. Hiện trạng đã xác minh

- Auth **đang là mock**: `auth-service.ts` đăng nhập bằng Prisma + bcrypt, ký JWT cục bộ (`JWT_SECRET` mặc định). Các route `/api/v1/admin/merchants/*` của FE gọi `src/server/modules/*` (Prisma).
- `.env.local` có `IDENTITY_BASE_URL` và `MERCHANT_BASE_URL`, hiện trỏ namespace `/admin` (sẽ phải đổi).
- BE `flex.merchant` có **ba filter chain**: `/api/v1/admin/**` (Admin JWT), `/api/v1/merchant/**` (JWT realm merchant, role `MERCHANT_USER`), nội bộ.
- API dành cho merchant đã có: identity `/merchant/auth/*` (login, `login/verify-otp`, `otp/resend`, `refresh`, `logout`, `change-password`, `forgot-password`, `reset-password*`);
  merchant `GET /merchant/me` (userId, email, status, merchantIds, subMerchantIds, permissions), `GET /merchant/sub-merchants`.
- BE có enum `MerchantPermission` (27 quyền, 7 nhóm: transaction, refund, dispute, order, finance, administration, wallet), khớp mockup "27 quyền · 7 nhóm". Mới áp dụng cho `/me` và `/sub-merchants`.
- Phần còn lại của API quản trị (merchants, sub-merchants CRUD, merchant-users, permission-groups, terminals, audit-logs, bank-accounts, scope-proposals, change-requests…) nằm ở `/admin/**` dành cho Admin portal.
- BE trả `RestApiResponse<T>` = `{ data, message, detail, success, status }`; danh sách là `Page<T>` của Spring.
- Repo chưa có test runner. Pattern Hybrid ở `.claude/patterns/hybrid-query.md`.
  Docs Next.js 16 đã đối chiếu: `backend-for-frontend.md` (Route Handler công khai, phải tự authn/authz), `authentication.md` (Proxy chỉ kiểm tra lạc quan, kiểm tra thật ở DAL), `data-security.md` (DAL `server-only`, trả DTO).
  Mỗi task Codex phải đọc lại phần docs liên quan trước khi dùng API Next.js.

## 3. Phụ thuộc BE (việc của BE, ngoài repo này)

Quyết định đã chọn: **cho token merchant gọi các endpoint `/admin`**. BE hiện chặn điều này theo thiết kế (khác realm JWT). Cần BE:

1. Cho chain `/api/v1/admin/**` chấp nhận JWT realm merchant ở tập endpoint Portal cần.
2. Phân quyền các endpoint đó bằng `MerchantAccessPolicy`/`MerchantPermission` thay vì `PERMISSION_EWALLET:*`.
3. Lọc **mọi** list/get/ghi theo `merchantIds` và `subMerchantIds` của user. Thiếu bước này merchant này đọc/ghi được dữ liệu merchant khác.

Rủi ro đã nêu: endpoint admin không được thiết kế cho merchant. Phương án thay thế vẫn mở: BE thêm `/merchant/*` tương ứng. Lớp service của FE cô lập đường dẫn BE nên đổi sang phương án này chỉ sửa service, không sửa UI.

Cho đến khi BE xong, FE chạy theo **chế độ fixture**: biến môi trường server `MERCHANT_API_MODE=live|fixture`. `live` gọi BE thật; `fixture` trả dữ liệu mẫu đúng Zod schema. Mặc định `fixture` cho module chưa có API dùng được; `live` cho auth, `/me`, `GET /merchant/sub-merchants`.
Mỗi module có contract (Zod schema DTO) và test bằng msw; việc bật `live` cho module nào do BE xong phần 1–3.

## 4. Kiến trúc dữ liệu: Hybrid

```
src/server/modules/<x>/<x>.service.ts    Data Access Layer, server-only. Gọi BE qua createAuthClient (hoặc trả fixture theo MERCHANT_API_MODE),
                                         Zod parse envelope + DTO, trả Result<T, AppError>
src/features/<x>/schemas/                Zod schema DTO của BE và input form
src/features/<x>/utils/                  mapper thuần DTO → type FE, normalize filter
src/app/api/v1/<x>/route.ts              mỏng: kiểm session + MerchantPermission, parse input (Zod), gọi service, trả JSON cho browser
src/features/<x>/hooks/<x>-queries.ts    queryOptions dùng chung (key + queryFn browser-safe qua src/lib/api) và use*Mutation
src/app/.../page.tsx (Server)            prefetchQuery (override queryFn gọi service trực tiếp) → dehydrate → HydrationBoundary
```

Cấu trúc theo `.claude/rules/STRUCTURE.md`: không tạo `server/` trong feature, không di chuyển `src/lib/api/*` chỉ để đối xứng, table config trong `columns/`, JSX trong `components/`, điều phối trong `hooks/`.

1. Route handler và page gọi cùng một service; page không gọi lại route nội bộ. Route handler tồn tại vì browser cần endpoint để refetch/mutate.
   Là endpoint công khai nên mỗi handler tự kiểm session và quyền; không dựa vào `proxy.ts`.
2. Query key giống hệt server/client; filter normalize bằng Zod và nằm trong key; filter/sort/phân trang lấy từ `searchParams`.
3. Mutation dùng `useMutation` gọi route handler, invalidate key nhỏ nhất. Không dùng Server Action. Không `unstable_cache` (dữ liệu theo user).
4. Không trộn `initialData` với `HydrationBoundary` cho cùng một query (`users/[id]/page.tsx` hiện dùng `initialData`, phải chuyển).
5. Prefetch gặp 401: `redirect('/login')`. Lỗi khác: client refetch và hiển thị Error state có nút thử lại.
6. Mapper loại trường không cần ở client; secret không vào payload hydrate.
7. `staleTime`: danh sách 30 s, chi tiết 60 s, audit log 0.
8. Mỗi route có `loading.tsx` (Skeleton giữ footprint) và `error.tsx` khi cần. Request độc lập chạy song song (`Promise.all`).
9. Loại màn → cách fetch: danh sách filter/phân trang và chi tiết có thao tác = Hybrid; dữ liệu chỉ cần sau tương tác = Client-only; trang chỉ đọc = Server thuần.

Service không throw; lỗi BE chuẩn hoá thành mã lỗi FE, không lộ raw error. Mọi file service có `import "server-only"`.
Thao tác nhạy cảm cần OTP gọi `POST /sensitive-operations/otp-challenge` trước khi gọi API đích (xác nhận phạm vi cho merchant với BE).

## 5. Đợt 1 — Nền tảng

| Task | Nội dung |
|---|---|
| 1.0 | Nền test: Vitest, `@testing-library/react`, `user-event`, `jest-dom`, jsdom, msw (đã duyệt); script `test`; alias `@/*` |
| 1.1 | `src/lib/be/`: client cho `IDENTITY_BASE_URL`/`MERCHANT_BASE_URL` (đổi sang namespace `/merchant`), Zod envelope, `Page<T>`, chuẩn hoá lỗi, cờ `MERCHANT_API_MODE`; test |
| 1.2 | Đăng nhập merchant qua identity `/merchant/auth/*`: login, `verify-otp`, `otp/resend`, `refresh`, `logout`, `change-password`, `forgot-password`, `reset-password`. Bỏ bcrypt/JWT cục bộ và `JWT_SECRET` mặc định |
| 1.3 | Session: `GET /merchant/me` cho quyền, merchantIds, subMerchantIds; refresh token ở server; `proxy.ts` chỉ kiểm tra cookie (lạc quan) |
| 1.4 | Menu và nút theo `MerchantPermission` (ẩn mục khi thiếu quyền); trạng thái user `PENDING`/`LOCKED` hiển thị lý do thay vì lỗi 403 |
| 1.5 | Hạ tầng Hybrid: `queryOptions` mẫu, helper prefetch + redirect 401, QueryProvider ổn định |

## 6. Đợt 2 — Quản trị tài khoản

Màn lấy từ mockup (mã SRS2). "Có" = màn đã tồn tại trong FE (ghép mockup + đổi nguồn dữ liệu); "Mới" = chưa từng có.

| Module | Màn | Nguồn | Nguồn dữ liệu BE |
|---|---|---|---|
| Hồ sơ KYB / ĐVCNTT | 3.8 Xác thực KYB, 3.10 Đăng ký ĐVCNTT: **gửi yêu cầu** và theo dõi tiến trình, xem hồ sơ đã gửi (chỉ đọc) | Mới | `merchants` (create, update, submit, status-history), `enterprise-wallets`, `documents` |
| Ngân hàng | 3.9 Liên kết ngân hàng: yêu cầu thêm/đổi, trạng thái | Mới | `merchant-bank-accounts` (+ change-requests) |
| Sub-merchant | 3.11–3.16 danh sách, thêm, sửa, chi tiết, khoá/mở khoá | Có | `GET /merchant/sub-merchants` (live); ghi qua `sub-merchants` |
| Nhóm quyền | 3.17–3.19 | Có (`permissions`) | `merchant-permission-groups`, `merchant-permissions` |
| User | 3.20–3.22 + 3.23 cập nhật tài khoản | Có (`users`, `account`) | `merchant-users` (gồm lock, reset-password, groups, scope-proposals), `auth/profile` |
| Terminal | 3.24–3.29 | Mới | `terminals` |
| Audit log | Nhật ký hệ thống (cần quyền `VIEW_AUDIT_LOG`) | Mới | `audit-logs` |
| Fixture 4 màn thiếu API | transactions, refund, complaints, dashboard | Có (đổi nguồn) | Fixture tĩnh |
| Dọn mock | — | Cuối đợt 2 | Xoá mock/Prisma của sub-merchants, users, permissions và auth cục bộ |

Không có màn "duyệt": các thao tác có maker-checker (hồ sơ, đổi ngân hàng, đề xuất phạm vi user) hiển thị trạng thái `Chờ duyệt / Đã duyệt / Từ chối kèm lý do` ở dạng chỉ đọc.

Mỗi module là một task Codex theo thứ tự: schema + mapper (test trước) → service → route handler → `<x>-queries.ts` → page Hybrid + `loading.tsx` → ghép UI.
Với module đã có UI, giữ component, chỉ đổi nguồn dữ liệu và chỉnh theo mockup. Trường DTO lấy từ Java DTO của controller tương ứng; task đầu mỗi module liệt kê trường vào schema trước khi viết mapper.

### Màn cần artifact review trước khi giao Codex

Mockup đã có hình, nhưng FE chưa từng dựng và mockup chưa phủ hết trạng thái nên cần bạn duyệt bản áp dụng token/Basuicn thực tế:

1. Hồ sơ KYB + đăng ký ĐVCNTT + liên kết ngân hàng: form nhiều bước, tiến trình xử lý, hồ sơ đã gửi chỉ đọc, trạng thái bị từ chối.
2. Terminal: danh sách, form tạo/sửa, chi tiết, hộp thoại khoá/mở khoá.
3. Audit log: bảng, bộ lọc, chi tiết bản ghi, xuất file.

Các màn còn lại ghép trực tiếp theo mockup và `DESIGN.md`.

## 7. Quy tắc áp dụng

- Component ≤ 200 dòng, hàm ≤ 50 dòng; đủ Loading, Error, Empty, Data; không `any`, không `@ts-ignore`.
- Trước mỗi màn UI: hoàn tất Brainstorming và lệnh Impeccable (bề mặt Operate); Codex không tự đổi visual direction.
- UI dùng Basuicn: kiểm `src/components/ui/<name>/`, rồi `npx basuicn list`; registry thiếu thì dừng phần UI và báo theo mẫu "Basuicn thiếu component". Không tự tạo primitive.
- Token CSS, không hard-code màu; một CTA `variant="action"` mỗi màn; hành động phá huỷ có dialog nêu rõ đối tượng. Tiền `Intl.NumberFormat('vi-VN')`, ngày giờ `date-fns`.
- Test theo `.claude/rules/TESTING.md`: schema, mapper, filter, permission (thuần); query key/invalidation (hook); integration Server → `HydrationBoundary` → TanStack Query cho luồng chính; không assert copy mô tả hay Tailwind class.
- Mỗi task: test viết trước và thấy fail rồi mới sửa; chạy test liên quan, `npm run typecheck`, `npm run lint`; build khi cần. Kiểm tra tay 320px và 1280px.

## 8. Quy trình thi công

Plan chia task nhỏ, tiêu đề đúng mẫu `## Task N:` (agent `codex-implementer` trích task bằng mẫu này). Mỗi task: `codex-implementer` giao Codex (sandbox, Codex không commit; model `gpt-6-sol`, effort `low`)
→ agent chạy lại lint/test → `code-reviewer` review → tôi xác minh. Tôi chỉ commit khi bạn yêu cầu. Brief phải ghi rõ dùng Vitest (script mẫu của agent nhắc jest/docker của repo khác), và task 1.0 tạo script `test`.

## 9. Rủi ro và giả định

- **BE chưa sẵn sàng** cho token merchant trên `/admin` (mục 3). Rủi ro bảo mật cross-tenant nằm ở BE; FE không thay thế được.
- Màn chạy `fixture` không phản ánh hành vi BE thật; rủi ro lệch contract. Giảm bằng cách lấy schema từ DTO Java và test msw.
- Working tree đang có nhiều thay đổi chưa commit và `.claude/*` đang được sắp xếp lại; cần commit/stash trước khi Codex làm việc.
- `.env`, `.env.local` chứa `DATABASE_URL` có mật khẩu thật và đã hiển thị trong phiên này; kiểm tra không bị commit và cân nhắc đổi mật khẩu.
- Gỡ Prisma xoá seed demo; không quay lại được nếu không dựng lại.
- Số bước OTP của login merchant và phạm vi thao tác nhạy cảm cho merchant cần xác nhận với BE ở task 1.2.
- Mỗi dependency mới ngoài danh sách đã duyệt và mỗi component Basuicn thêm cần bạn duyệt riêng.
