# Backlog sửa sau review module 2a–2d (2026-10-05)

Nguồn: báo cáo `code-reviewer` đọc code các module sub-merchants, permission, users, terminals, audit-logs, auth. Mục đã xác minh trong code bởi controller mới được đưa vào đây. Executor đọc kèm `2026-10-05-module-template.md`.

## Đã sửa (controller, đã kiểm `npm run check`: 88 file, 415 test qua)
- Người dùng: trang trừ 1 hai lần làm trang 2 hiện lại dữ liệu trang 1 (BE nhận page 1-based). Đã bỏ phép trừ ở route và `page.tsx`, sửa test.
- `[id]` trên đường dẫn: thêm `src/lib/be/route-id.ts` (`invalidIdResponse`, 404 nếu không phải UUID) và gọi ở mọi route `[id]` của terminals, sub-merchants, merchant-users, permission-groups; `encodeURIComponent(id)` trong các `*.paths.ts` (terminals, sub-merchants, users, permissions, audit-logs).

## Đã làm bởi agent Claude (2026-10-05, controller đã kiểm lại `npm run check`: 110 file, 587 test qua)
P1 mục 1–9 xong: hộp thoại unlock/reset không còn ô lý do; `useUserActions` + `UserDialogs` (UserContainer còn ~90 dòng); `requireOwnedUser` yêu cầu mọi merchant của user nằm trong phạm vi actor; lỗi lưu sub-merchant hiện trong modal; thẻ lọc sub-merchants ẩn; redact audit chuyển `audit-redact.ts` (server-only) kèm che IP ở server; mặc định 7 ngày chỉ khi URL chưa có tham số lọc; trang users/permissions/sub-merchants kiểm quyền và render `AccessDenied`; modal sửa terminal có trạng thái đang tải/lỗi.
**Mới phát hiện, thêm vào P2:** `TerminalsContainer` dùng `mutateAsync` nên `confirmLock`/`confirmUnlock` có promise rejection không được bắt khi BE lỗi (modal vẫn hiện lỗi nhưng rejection rò ra); sửa cùng mục 10 (chuyển điều phối vào hook, bắt lỗi trong hook).

## Cần BE trả lời trước khi sửa (không đoán)
1. **Nhật ký hệ thống có tự lọc theo merchant của session không?** Route chỉ kiểm `VIEW_AUDIT_LOG` và `auditLogSchema` không có `merchantId`. Nếu BE không lọc, user có quyền xem log của merchant khác. Khi BE xác nhận: nếu lọc theo token thì ghi chú rõ trong `audit-log.paths.ts`; nếu không thì thêm `merchantId` vào filter/schema và ép `∈ session.merchantIds` ở list và detail (không thuộc → 404) kèm test "user merchant A không đọc được log merchant B".
2. Danh sách terminal không giới hạn `subMerchantId` khi để trống: BE có lọc theo token không?
3. Scope danh sách sub-merchants: endpoint `/merchant/sub-merchants` đã lọc theo session (đã thấy trong BE); các endpoint còn lại chờ BE.
4. `unlock` và `reset-password` của merchant-user **không nhận body** (đã xác minh trong `AdminMerchantUserController`).

## Việc giao Codex (theo thứ tự ưu tiên)

### P1 — đúng đắn / bảo mật
1. **Lý do giả ở user unlock và reset-password.** UI bắt nhập lý do 10–500 ký tự (`UserUnlockDialog`, `UserResetPasswordDialog`) nhưng BE không nhận. Bỏ ô lý do, đổi thành hộp thoại xác nhận đơn giản; `use-user-mutations.ts` và route không gửi/đọc `reason`. `lock` vẫn giữ lý do (BE có `MerchantUserLockRequest`). Cập nhật test.
2. **Lỗi lưu sub-merchant bị nuốt.** `SubMerchantsContainer.saveForm` có `catch {}` rỗng và `SubMerchantFormSheet` không có prop `error`. Truyền `save.error?.message` xuống form và hiển thị trong `role="alert"`; modal không đóng. Test tích hợp: BE 409 hiện lỗi trong modal.
3. **Audit-logs che dữ liệu ở server chưa đủ.** Che/bỏ `ipAddress` (che octet cuối) ngay trong `redactAuditLog`, bỏ `maskIp` ở client; mở rộng `sensitiveKey` (`pin`, `cvv`, `authorization`, `credential`, `api.?key`, `refresh`, email/số điện thoại); `redactString` phải xử lý chuỗi JSON có dấu `\"`; tách phần redact ra file chỉ chạy ở server.
4. **Trang thiếu kiểm quyền ở server:** `users`, `permissions`, `sub-merchants` phải kiểm `MANAGE_USER` / `MANAGE_PERMISSION_GROUP` / `MANAGE_SUB_MERCHANT` và render `<AccessDenied />` (như `terminals`, `audit-logs`); thay `throw new Error` khi session không có merchant bằng `AccessDenied` hoặc empty state.
5. **`requireOwnedUser`** dùng `some` trên danh sách merchant của user: yêu cầu **mọi** merchant của user nằm trong phạm vi actor (hoặc ghi rõ là chủ ý) + test.
6. **Sửa user chạy 3 bước tuần tự** (update → assign nhóm → đề xuất phạm vi) trong `UserContainer`: chuyển vào hook `useUserActions`, báo bước nào thành công khi lỗi giữa chừng, so sánh `groupIds` đã sắp xếp nhất quán.
7. **Sub-merchants: bộ lọc keyword/status không có tác dụng** (endpoint merchant chỉ phân trang). Ẩn thẻ lọc cho tới khi BE hỗ trợ, hoặc ghi chú rõ; bỏ phần query key đổi theo filter không dùng.
8. **Audit-logs: không xoá được khoảng ngày** (`parseAuditSearchParams` luôn điền lại 7 ngày): chỉ điền mặc định khi URL chưa có tham số; xoá lọc phải cho phép bỏ ngày.
9. **Terminals: bấm "Sửa" khi detail đang tải/lỗi không có phản hồi**: hiện loading/error trong modal.

### P2 — STRUCTURE
10. Mutation/điều phối nằm trong container thay vì hooks: `UserContainer` (~110 dòng), `SubMerchantsContainer`, `PermissionGroupContainer`, `TerminalsContainer`. Chuyển thành hook `useXActions()` trả `save/confirm...` kèm `error`, `isPending`.
11. Hàm > 50 dòng: `UserContainer`, `TerminalsContainer`, `SubMerchantsContainer`, `PermissionGroupContainer`, `TerminalFormModal`, `PermissionForm`, `UserModal`.
12. Chuyển `PermissionGroupContainer` từ `app/(cms)/permissions/_components` sang `features/permission/components/`; chuyển `Permission.column.tsx` vào `columns/`.
13. Đổi tên cho khớp: `SubMerchantFormSheet`/`SubMerchantDetailSheet` (đang là Dialog) → `...Modal`.
14. **Dòng nhồi dài** (template cấm): `SubMerchantFormSheet.tsx` (dòng 11, 17, 18, 25), `SubMerchantColumn.tsx:30`, `SubMerchantDetailSheet.tsx:14`, `DialogActive.tsx:17`, `UserContainer.tsx:163-165`, `UserDetailModal.tsx:73`, `UserModal.tsx:86`, `sub-merchants/loading.tsx:4`, các `route.test.ts` của sub-merchants. Mỗi câu lệnh/JSX một dòng.
15. **Guard trùng 5 bản** (`requireAuditAccess`, `requireTerminalAccess`, `requireSubMerchantAccess`, `requirePermissionGroupAccess`, `requireUserAccess`): gom thành `requirePermission(permission)` ở `src/server/auth/`.
16. **Reason schema trùng nhiều nơi** (lock route của users, `UserLockDialog`, `TerminalLockModal` import từ sub-merchants...): gom về một `reasonSchema` trong `src/lib/`. `listQuerySchema` page/pageSize lặp 5 route: gom một helper.
17. `features/terminals/terminal-api.ts` tự gọi `fetch`: chuyển sang `apiClient` (cùng cơ chế refresh/401).
18. Skeleton: `sub-merchants/loading.tsx` khớp layout thật (header + thẻ filter + thẻ kết quả); container audit-logs, sub-merchants, terminals dùng skeleton thay vì chỉ dòng chữ.

### P3 — UI / a11y / test
19. Nút Tìm kiếm trong `TerminalFilters` và `PermissionGroupContainer` là `type="button"` không có `<form>` nên Enter không tìm: chuyển sang `<form onSubmit>`.
20. Icon button audit-logs thiếu Tooltip; `aria-label` chứa UUID. Dùng nhãn "Xem chi tiết nhật ký lúc HH:mm dd/MM".
21. Chữ/mã thô trong UI: `TerminalDetailModal` (enum `POS/ACTIVE`), `PermissionCategoryGroup`, `PermissionGroupDetailModal`, `UserDetailModal` (UUID nhóm/merchant), `UserFilter` (UUID merchant làm nhãn); nhãn `INACTIVE` không đồng nhất ("Ngừng hoạt động" vs "Đã khóa").
22. `AccessDenied`: `<Button><Link/></Button>` lồng thẻ tương tác không hợp lệ; dùng prop render-as-link của Button nếu có, bỏ `role="alert"` ở trang tĩnh.
23. Test yếu: `AuditLogsContainer.test.tsx` mock `useQuery` (dùng msw thay thế, kiểm query key/hydration thật), test "redacted diff" dùng fixture đã che sẵn; `use-user-mutations.test.tsx` và `use-terminal-mutations.test.tsx` mock `apiClient`/`terminal-api` nội bộ và không assert invalidation; `users/page.test.tsx` mock quá nhiều. Bổ sung test còn thiếu: ownership audit-logs (sau khi BE trả lời), lock/unlock terminals, `permission-groups/[id]/users`, `merchant-users/[id]` GET, `sub-merchants` POST với `merchantId` ngoài session. Bỏ assert chuỗi loading/empty/nhãn trạng thái.
24. Dọn code chết: `SubMerchantDetailModal.tsx` (users), `use-permissions.ts`, `permission/schemas/schema.ts`, `permission/types/type.ts` (phần không dùng), `permission/constants/Permission.constant.ts`, `useUser`/`userQueries.groups`/`useResendActivation` không consumer, `useMemo` thừa trong ba bảng, prop `isLoading` không dùng, file rỗng `merchants/transaction/types/Transaction.type.ts`.
25. Log chẩn đoán dev-only: bỏ hoặc dùng logger có mức (`sub-merchants/route.ts`, `require-sub-merchant-access.ts`, `lib/auth/session.ts`).

## Điều kiện nghiệm thu
`npm run check` sạch; controller đọc lại container/hook của từng module trước khi coi là xong; báo cáo trung thực, không dùng "inferred" cho điều chưa kiểm.
