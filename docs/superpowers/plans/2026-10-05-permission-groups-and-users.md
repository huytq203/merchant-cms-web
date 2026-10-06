# Nhóm quyền và Người dùng (Đợt 2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Thay hai module mock/Prisma `permission` và `users` (cùng cập nhật tài khoản `account`) bằng dữ liệu BE thật, dùng chu trình 6 task của `2026-10-05-module-template.md`.

**Architecture:** Hai module độc lập, làm tuần tự: nhóm quyền trước (người dùng cần danh sách nhóm để gán). Service → route handler → query → trang Hybrid → modal, như module Sub-merchant.

**Tech Stack:** Next.js 16, TanStack Query v5, Zod 4, Vitest + msw, Basuicn.

**Spec:** `docs/superpowers/specs/2026-10-02-flexpay-be-integration-design.md` (mục 6, dòng Nhóm quyền và User). **Mẫu chung:** `docs/superpowers/plans/2026-10-05-module-template.md`.

**Mockup tham chiếu UI** (đọc đúng khối HTML có comment mã màn trong `~/Downloads/Giao diện ví doanh nghiệp Flexpay/Flexpay Merchant Portal.dc.html`, ảnh trong `~/Downloads/Giao diện ví doanh nghiệp Flexpay/screenshots/`): 3.17 Quản lý nhóm quyền, 3.18/3.19 Thêm/Cập nhật nhóm quyền, 3.20 Thêm/Cập nhật User, 3.21 DS User, 3.22 Reset mật khẩu User. Dựng theo bố cục mockup nhưng áp dụng token/Basuicn thật và quy ước trong template; chỗ mockup khác BE (trường không có trong DTO) thì **bỏ trường đó và ghi vào báo cáo**, không tự bịa dữ liệu.

## Global Constraints

Toàn bộ mục "Quy tắc bắt buộc" và "Hợp đồng BE đã xác minh" của module template. Thêm:
- Permission FE: `MANAGE_PERMISSION_GROUP` cho module nhóm quyền, `MANAGE_USER` cho module người dùng (đã có trong `src/features/auth/permissions.ts`).
- Sidebar đã lọc theo permission; không đổi.

## BE hợp đồng giả định (đường dẫn gom trong `.paths.ts`)

| Module | Endpoint (tạm `/api/v1/admin`) | DTO nguồn (thư mục `application/dto/`) |
|---|---|---|
| Danh mục quyền | `GET /merchant-permissions` → `List<{code, category}>` | `response/merchant/user/MerchantPermissionResponse` |
| Nhóm quyền | `GET/POST /merchant-permission-groups`, `GET/PUT/DELETE /merchant-permission-groups/{id}`, `PUT .../{id}/permissions`, `GET .../{id}/users` | `request/merchant/user/MerchantPermissionGroupRequest` (`merchantId, code, name, description, permissions: Set<String>`), `MerchantPermissionGroupResponse` (+ `id, system, createdAt, updatedAt`), `MerchantPermissionUpdateRequest`, `MerchantPermissionGroupSearchRequest`, `response/.../MerchantPermissionGroupUserResponse` |
| Người dùng | `GET/POST /merchant-users`, `GET/PUT /merchant-users/{id}`, `POST .../{id}/lock|unlock|reset-password|resend-activation`, `PUT .../{id}/groups|merchants|sub-merchants`, `POST .../{id}/scope-proposals` | `MerchantUserCreateRequest` (`email, fullName, phone, groupIds, merchantIds, subMerchantIds`), `MerchantUserUpdateRequest` (`fullName, phone`), `MerchantUserSearchRequest` (`query, merchantId, status`), `MerchantUserResponse` (`id,email,fullName,phone,status,groupIds,merchantIds,subMerchantIds,createdAt,updatedAt`), `MerchantUserLockRequest`, `MerchantUserAssignmentRequest`, `MerchantUserScopeProposalRequest/Response` (`status: MakerCheckerStatus`, `requestReason`, `decisionReason`) |

Không đưa vào FE: `approve/reject` của scope-proposals (màn duyệt thuộc admin portal), `merchant-system-permission-groups` (nhóm hệ thống do admin quản), `export`.

## Review Focus

- Nhóm `system = true`: chỉ đọc; không có nút sửa/xoá.
- Xoá nhóm đang có người dùng: BE từ chối, UI hiện lý do trong dialog xác nhận, nhóm không biến mất khỏi bảng.
- Quyền không thuộc 27 giá trị của `MERCHANT_PERMISSIONS` (BE thêm quyền mới): form vẫn hiển thị theo `category` và không làm hỏng parse (đưa vào nhóm "Khác").
- Người dùng tự khoá chính mình hoặc tự gỡ nhóm có `MANAGE_USER`: nút bị chặn ở UI; BE vẫn là chốt chặn cuối.
- Đổi phạm vi (`merchants`/`sub-merchants`) là **yêu cầu chờ duyệt** (scope-proposal), không áp dụng ngay: UI nói rõ "Đã gửi yêu cầu", hiện trạng thái `Chờ duyệt/Đã duyệt/Từ chối` kèm lý do, không có nút duyệt.
- Reset mật khẩu / gửi lại kích hoạt: không bao giờ hiện mật khẩu hay token trong UI hoặc log.
- Danh sách người dùng rỗng và user chưa có nhóm nào: empty state, không crash.
- Email trùng khi tạo (BE 409): lỗi hiện đúng trong form tại ô email.

---

## Phần A — Nhóm quyền

### Task 1: Schema + mapper nhóm quyền
**Files:** Create `src/features/permission/schemas/permission-group.schema.ts` (+ test), `src/features/permission/utils/permission-group-mapper.ts` (+ test); Modify `src/features/permission/types/type.ts`.
**Interfaces — Produces:** `permissionCatalogSchema`, `permissionGroupSchema`, `permissionGroupFormSchema` (`code` bắt buộc, chỉ `A-Z0-9_`, ≤ 50; `name` ≤ 255; `description` ≤ 500; `permissions` ≥ 1), `groupPermissionsByCategory(catalog)`, `toGroupRequest(values, merchantId)`, `canEditGroup(group)` (false khi `system`).
- [ ] Test (fail trước): parse nhóm hợp lệ; `system` mặc định false khi BE bỏ; `code` thường bị từ chối; không có quyền nào bị từ chối; `groupPermissionsByCategory` giữ thứ tự category và đưa quyền lạ vào "Khác"; `toGroupRequest` gắn `merchantId`; `canEditGroup({system:true}) === false`.
- [ ] Triển khai, chạy test, typecheck chỉ báo lỗi file cũ của module này.

### Task 2: Service nhóm quyền (msw)
**Files:** Create `src/server/modules/permissions/permission-group.paths.ts`, rewrite `permission.service.ts` (+ test); delete `permission.entity.ts`, `permission.repository.ts` khi hết consumer.
**Interfaces — Produces (đều `BeResult`):** `listPermissionCatalog()`, `listPermissionGroups(filter)`, `getPermissionGroup(id)`, `createPermissionGroup(values, merchantId)`, `updatePermissionGroup(id, values)`, `deletePermissionGroup(id)` (204 → `undefined`), `listGroupUsers(id, page)`.
- [ ] Test msw theo template, thêm: `DELETE` trả 204 không có body thành công; xoá bị 409 giữ nguyên `message`.

### Task 3: Route handler nhóm quyền
**Files:** `src/app/api/v1/admin/permission-groups/**` (xoá thư mục `permissions`, `permission-categories` cũ khi hết consumer), `require-permission-group-access.ts` (+ tests).
- [ ] Test theo template; thêm: nhóm của merchant khác (`merchantId` không thuộc session) → 404; `DELETE` nhóm `system` → 403 không gọi BE.

### Task 4: Query + trang Hybrid nhóm quyền
**Files:** `src/features/permission/permission-group-queries.ts`, hooks mutation, `src/app/(cms)/permissions/{page,loading}.tsx`, container; xoá route `permissions/new` và `permissions/[id]`.
- [ ] Theo template Task 4. Query key: `['permission-groups','list',filter]`, `['permission-groups','catalog']` (`staleTime` dài vì danh mục hiếm đổi), `['permission-groups','detail',id]`.

### Task 5: UI nhóm quyền
**Files:** tái dùng `PermissionCategoryGroup`, `PermissionForm`, `PermissionTable`, `Permission.column.tsx`, viết lại cho schema mới; modal thêm/sửa với lưới checkbox theo `category` (chọn tất cả theo nhóm), modal chi tiết (danh sách người dùng của nhóm), dialog xoá.
- [ ] Test tích hợp container: tạo nhóm (chọn quyền → POST đúng body → modal đóng), sửa, xoá bị 409 hiện lý do, nhóm `system` không có nút sửa/xoá.

### Task 6: Dọn dẹp nhóm quyền
- [ ] Xoá `src/lib/api/Permission.api.ts`, mock/Prisma của permissions, route constants trỏ `/permissions/new`; `npm run check` sạch.

---

## Phần B — Người dùng (+ cập nhật tài khoản)

### Task 7: Schema + mapper người dùng
**Files:** `src/features/users/schemas/user.schema.ts` (+ test), `src/features/users/utils/user-mapper.ts` (+ test); Modify `types/type.ts`.
**Interfaces — Produces:** `merchantUserSchema`, `merchantUserStatusSchema` (đọc enum từ `MerchantUserStatus.java`), `scopeProposalSchema` (`MakerCheckerStatus` đọc từ Java), `userFormSchema` (`email` hợp lệ, `fullName` bắt buộc, `phone` tuỳ chọn đúng định dạng, `groupIds` ≥ 1), `toCreateUserRequest`, `toUpdateUserRequest` (chỉ `fullName`, `phone`; **không** có email), `canLockUser(user, actorId)`, `canUnlockUser`.
- [ ] Test: email không nằm trong body update; `canLockUser` false với chính mình hoặc trạng thái không phù hợp; scope-proposal parse đủ 3 trạng thái và `decisionReason` nullable.

### Task 8: Service người dùng (msw)
**Interfaces — Produces:** `listUsers(filter)`, `getUser(id)`, `createUser`, `updateUser`, `lockUser(id, reason)`, `unlockUser`, `resetUserPassword(id)`, `resendActivation(id)`, `assignUserGroups(id, groupIds)`, `createScopeProposal(id, body)`, `listScopeProposals(id)` **nếu** BE có (đọc `AdminMerchantUserController`; nếu chưa có thì hiển thị trạng thái từ `MerchantUserResponse` và ghi vào báo cáo).
- [ ] Test msw theo template; thêm: reset-password chỉ trả `success`, không có trường mật khẩu trong kiểu trả về.

### Task 9: Route handler người dùng
- [ ] Theo template; thêm: tự khoá chính mình → 403 không gọi BE; `groupIds`/`merchantIds` trong body phải thuộc phạm vi của session (khác → 403).

### Task 10: Query + trang Hybrid người dùng
**Files:** `user-queries.ts`, `src/app/(cms)/(merchant-management)/users/{page,loading}.tsx`, container; xoá `users/new`, `users/[id]`.
- [ ] Theo template; filter: `query`, `status`, `merchantId` (chỉ khi nhiều Master).

### Task 11: UI người dùng + cập nhật tài khoản
**Files:** tái dùng `UserTable`, `UserFilter`, `DialogLock/Unlock/Reset` (thành modal có lý do), thay `FormUser` bằng modal thêm/sửa (chọn nhóm từ `useQuery` danh mục nhóm, chọn sub-merchant từ `useSubMerchantOptions`), modal chi tiết, `SubMerchantDetailModal` đã sửa tối thiểu ở plan 2a giữ nguyên. Cập nhật tài khoản cá nhân (`src/features/account`, `/api/v1/admin/auth/profile` đang trả 501): form đổi `fullName`, `phone`; gọi endpoint profile của identity khi BE xác nhận đường dẫn, nếu chưa có thì giữ 501 và ghi vào báo cáo.
- [ ] Test tích hợp container: tạo user hợp lệ gọi POST, email trùng 409 hiện tại ô email, khoá/mở khoá có lý do, đổi phạm vi chỉ gửi yêu cầu và hiện `Chờ duyệt`, reset mật khẩu không hiển thị bí mật.

### Task 12: Dọn dẹp + nghiệm thu
- [ ] Xoá `src/lib/api/User.api.ts`, `src/server/modules/users/*` Prisma, `src/app/api/v1/admin/merchants/users/**`, hook `refund/hooks/use-sub-merchants.ts` khi hết consumer; `npm run check` sạch.

## Self-Review

- Spec mục 6: Nhóm quyền (Task 1–6), User + 3.23 (Task 7–12); không có màn duyệt (Review Focus 5).
- Phụ thuộc: Task 11 cần danh mục nhóm (Task 4) và `useSubMerchantOptions` (plan 2a).
- Rủi ro mở: mọi gọi live chờ BE mở `/merchant/**`; DTO có thể đổi khi BE tách endpoint, chỉ ảnh hưởng schema/mapper/paths.
