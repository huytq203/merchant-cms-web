# Hộp thư thông báo Merchant Portal: kế hoạch ghép menu Notifications

Trạng thái: **chờ duyệt, chưa viết code.**

## Mục tiêu

Mục "Notifications" trong menu người dùng ở chân sidebar hiện không có `onClick` (`src/app/(cms)/_layout/SidebarUserMenu.tsx`). Ghép nó với 4 route BE đã có để người dùng thấy số thông báo chưa đọc, xem danh sách và đánh dấu đã đọc.

## Hợp đồng BE (đã đọc `MerchantNotificationPortalController` trên `origin/develop`)

Gốc `/api/v1/merchant/notifications`. Không có `@RequireMerchantPermission` (hộp thư là của từng user); chỉ cần đã đăng nhập và user ở trạng thái dùng được portal (nếu không BE ném `MERCHANT_USER_NOT_ACTIVE`). Người nhận luôn lấy từ phiên, client không truyền được.

| Route | Tham số | Phản hồi (trong envelope `RestApiResponse`) |
|---|---|---|
| `GET /notifications` | `unreadOnly` (mặc định false), `page`, `size` (tối đa 100); thứ tự cố định mới nhất trước | Trang `Page` của thông báo |
| `GET /notifications/unread-count` | không | `{ count }` |
| `POST /notifications/{id}/read` | id | thông báo sau khi cập nhật; id của user khác trả 404 |
| `POST /notifications/read-all` | không | `{ updated }` |

Một thông báo: `id`, `type`, `title`, `body`, `orderId` (null được), `subMerchantId` (null được), `createdAt`, `readAt` (null = chưa đọc).

## Điều cần biết trước khi làm (rủi ro dữ liệu)

- Phía BE, việc **sinh** thông báo giao dịch do một worker chạy nền, cờ `merchant.notification.dispatch.enabled` mặc định `false` (theo plan BE `2026-10-23-merchant-transaction-notifications.md`). Nếu cờ này chưa bật trên môi trường dev thì hộp thư luôn rỗng và mình không có dữ liệu thật để thử đánh dấu đã đọc. Cần hỏi BE trước khi nghiệm thu UI.
- BE chưa công bố danh sách giá trị `type`. FE sẽ hiển thị theo `title` và `body` do BE gửi, không rẽ nhánh theo `type`.

## Quyết định thiết kế (mình chốt, bạn có thể đổi)

1. **Vị trí:** giữ mục "Notifications" trong menu người dùng, thêm số chưa đọc cạnh nhãn; bấm mở một `Sheet` bên phải liệt kê thông báo. Không thêm chuông ở Header và không thêm trang `/notifications` riêng trong lượt này.
2. **Danh sách:** 20 thông báo mỗi lần, nút "Tải thêm", bộ chuyển "Tất cả / Chưa đọc" (dùng `unreadOnly`). Nút "Đánh dấu tất cả đã đọc".
3. **Bấm một thông báo:** đánh dấu đã đọc. Việc chuyển tới đơn hàng (`orderId`) **chưa làm** vì cần xác nhận màn Đơn hàng có mở thẳng theo id được không (xem câu hỏi mở).
4. **Cập nhật số chưa đọc:** truy vấn `unread-count` tự làm mới mỗi 60 giây khi tab đang hiện, và làm mới lại sau mỗi thao tác đọc. Không dùng websocket.
5. **Cache:** dữ liệu riêng của từng user, chỉ ở trình duyệt (TanStack Query), không dùng cache dùng chung phía server. Không prefetch ở server: danh sách chỉ cần khi mở Sheet, số chưa đọc nhẹ và lấy phía client.
6. **Tiền tố route của app:** theo đa số module hiện có, route Next của FE đặt dưới `/api/v1/admin/notifications/...` (đây là quy ước tên của app, không phải route BE).

## Cấu trúc file

Server:

- `src/server/modules/notifications/notification.paths.ts` — 4 đường dẫn BE.
- `src/server/modules/notifications/notification.service.ts` — `listNotifications`, `getUnreadCount`, `markNotificationRead`, `markAllNotificationsRead`, dùng `merchantClient()`, `pageSchema` và `ok()` như `audit-log.service.ts`.
- Guard: dùng `requirePermission()` không truyền quyền (chỉ cần phiên), không thêm quyền mới.

Route handler (mỏng, kiểm đầu vào bằng Zod, đổi lỗi qua `domainErrorMessage`/`toDomainHttpStatus`):

- `src/app/api/v1/admin/notifications/route.ts` (GET)
- `src/app/api/v1/admin/notifications/unread-count/route.ts` (GET)
- `src/app/api/v1/admin/notifications/[id]/read/route.ts` (POST)
- `src/app/api/v1/admin/notifications/read-all/route.ts` (POST)

Feature `src/features/notifications/`:

- `schemas.ts`, `types.ts` — thông báo, số chưa đọc, kết quả đọc tất cả (Zod, kiểm tại biên).
- `notification-queries.ts` — query key chứa `unreadOnly` và trang; `unreadCount` có `refetchInterval`.
- `hooks/use-notification-mutations.ts` — đọc một, đọc tất cả; sau thành công làm mới danh sách và số chưa đọc ở phạm vi nhỏ nhất.
- `components/NotificationSheet.tsx`, `NotificationItem.tsx`, `NotificationEmpty/Error/Skeleton` (chỉ tách khi cần để giữ mỗi file dưới 200 dòng).
- `utils/format-time.ts` — thời gian tương đối bằng `date-fns` (đã có locale `vi`).

Sửa:

- `src/app/(cms)/_layout/SidebarUserMenu.tsx` — nhận `unreadCount` và `onOpenNotifications`, gắn `onClick` và `Badge`.
- `src/app/(cms)/_layout/SideBar.tsx` — giữ state mở Sheet như `accountOpen`, gọi hook số chưa đọc, gắn `NotificationSheet`.

UI dùng component Basuicn đã có local (`sheet`, `badge`, `skeleton`, `button`, `switch` hoặc `tabs`); không cài thư viện UI mới.

## Các bước (TDD, mỗi bước chạy đúng file test liên quan)

Theo `.claude/CLAUDE.md` của repo, trước khi viết UI phải xong Brainstorming và lệnh Impeccable phù hợp (`shape` cho màn mới), và đọc `.claude/DESIGN.md`, `rules/BASUICN.md`, `patterns/ui-components.md`, cùng tài liệu Next.js liên quan trong `node_modules/next/dist/docs/`. Các bước này làm đầu tiên.

1. **Chuẩn bị:** đọc các tài liệu trên; Impeccable `shape` cho Sheet thông báo; kiểm tra `sheet`/`badge` local (không cần `npx basuicn add`).
2. **Service + paths:** test trước (đường dẫn, tham số `unreadOnly/page/size`, ánh xạ `Page` sang `{rows,total}`, `ok`/lỗi), rồi cài đặt. Test đặt trong `src/server/modules/notifications/test/`.
3. **4 route handler:** test trước (chưa đăng nhập → 401; tham số sai → 400; lỗi BE → đúng mã; thành công), rồi cài đặt. Test trong `.../notifications/test/`.
4. **Schemas + queries:** test schema (`readAt` null, `orderId` null) và query key (có `unreadOnly`), rồi cài đặt.
5. **Mutations:** test làm mới đúng key sau thành công và giữ nguyên khi lỗi, rồi cài đặt.
6. **Components:** test hành vi theo `TESTING.md` (loading, lỗi, rỗng, có dữ liệu; bấm thông báo gọi đọc; "đọc tất cả" bị khóa khi không còn chưa đọc; bộ chuyển Tất cả/Chưa đọc; truy cập bằng bàn phím và nhãn đọc được). Không assert câu chữ trang trí.
7. **Nối vào sidebar:** sửa `SidebarUserMenu` và `SideBar`; test mục menu có số chưa đọc và mở Sheet.
8. **Kiểm tra:** chạy từng file test vừa viết (giới hạn 2 đến 3 nhân theo `TESTING.md`), `npm run typecheck`, `npm run lint`; sau đó mở dev server, đăng nhập (cần OTP) và xem Sheet thật: trạng thái rỗng, lỗi, và nếu BE có dữ liệu thì đọc một/đọc tất cả.

## Tiêu chí hoàn thành

- Mục Notifications mở Sheet; số chưa đọc đúng với `unread-count`.
- Đọc một, đọc tất cả cập nhật số và danh sách mà không tải lại trang.
- Mọi trạng thái (loading, lỗi, rỗng, dữ liệu) có xử lý; lỗi BE hiện thông điệp tiếng Việt, không lộ lỗi thô.
- Test liên quan xanh, typecheck và lint sạch (lỗi có sẵn không liên quan được ghi riêng, không sửa lan).

## Ngoài phạm vi (cố ý chưa làm)

- Chuông ở Header, trang `/notifications` đầy đủ, push/websocket.
- Chuyển tới màn đơn hàng khi bấm thông báo.
- Cấu hình thông báo (đang ở nhóm API khác của BE).
- Lỗi cũ không liên quan: route `PATCH /admin/auth/profile` trả 501, các trang bị kẹt loading ở lần thử trước.

## Câu hỏi mở

1. Bạn chấp nhận Sheet từ mục menu (không chuông ở Header, không trang riêng) cho lượt này không?
2. Bấm thông báo có `orderId`: có muốn chuyển tới đơn hàng không? Nếu có, cần xác nhận màn Đơn hàng mở được theo id qua URL.
3. Môi trường dev đã bật worker sinh thông báo chưa (cờ `merchant.notification.dispatch.enabled`)? Nếu chưa, cần BE bật hoặc tạo dữ liệu mẫu để nghiệm thu.
4. Chu kỳ làm mới số chưa đọc 60 giây có phù hợp không?
