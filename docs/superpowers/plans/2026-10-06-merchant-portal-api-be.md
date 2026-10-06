# Mở API Merchant Portal ở BE `flex.merchant` (`/api/v1/merchant/**`)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. Đây là **mã phân quyền ở BE**: mỗi giai đoạn do controller review trước khi sang giai đoạn sau.

**Goal:** Cho user Merchant Portal (JWT realm `ewallet-merchant`, role `MERCHANT_USER`) gọi các nghiệp vụ mà FE đã dựng, **chỉ trong phạm vi merchant/sub-merchant được gán**, bằng endpoint riêng dưới `/api/v1/merchant/**`. Không mở chuỗi `/api/v1/admin/**`, không đổi `SecurityConfig`.

**Architecture:** Mỗi miền có controller mới trong `presentation/controller/v1/merchant/` theo mẫu `MerchantSubMerchantController`: `@RequireMerchantPermission` (quyền) + `MerchantAccessPolicy` (phạm vi) **ngay trong cùng một lời gọi**, lọc ở truy vấn bằng `Specification` (không lọc sau). Tái dùng nghiệp vụ của service admin khi service không phụ thuộc vai trò admin; khi có (`AdminAuthorizationPolicy`, `AdminPrincipalResolver`, `AdminPasswordVerifier`) thì thêm phương thức nội bộ không kiểm quyền admin, và controller merchant chịu trách nhiệm kiểm phạm vi. Mỗi miền có DTO phản hồi riêng, bỏ trường chỉ-admin.

**Tech Stack:** Spring Boot 3.5, Java 25 (toolchain), Gradle wrapper 9.0.0, JUnit 5 + Mockito (mẫu `MerchantSubMerchantControllerTest`), Testcontainers/`PostgresTestSupport` cho Specification.

**Khảo sát nguồn:** báo cáo `Explore` ngày 2026-10-06 (trong phiên); tham chiếu code: `MerchantSubMerchantController`, `MerchantAccessPolicy`, `DefaultMerchantAccessPolicy`, `DatabaseMerchantAuthorizationResolver`, `AdminSubMerchantServiceImpl`, `AdminTerminalServiceImpl`, `MerchantWithdrawalRequestServiceImpl`, `MerchantOrderServiceImpl`.

## Quy tắc chung (mọi task)

- Đường dẫn gốc: `/home/huytq/code/beam/be/flexpay/flex.merchant`; package `com.flexpay.merchant`.
- **Không** commit, không đổi `SecurityConfig.java`, không thêm giá trị `MerchantPermission` hay migration trừ khi giai đoạn nói rõ và đã được duyệt.
- Phạm vi dữ liệu: `merchantId`/`subMerchantId` **không bao giờ** tin từ body/query; luôn so với `policy` rồi lọc ở truy vấn. Phạm vi rỗng → trả trang rỗng (không gọi `IN ()` rỗng), không 403 (theo `MerchantSubMerchantController`).
- Ghi tài nguyên theo `id`: tải thực thể, kiểm `requireMerchantScope(masterId)` (dùng cấp Master, **không** dùng `scopedSubMerchantIds()` cho thao tác trên sub đã khoá vì scope chỉ giữ sub `ACTIVE`; xem Phát hiện 0.3), không thuộc phạm vi → `ResourceNotFound` (404, không xác nhận id tồn tại).
- DTO phản hồi riêng cho merchant: bỏ `createdBy`, `updatedBy`, `approvedBy`, `rejectedBy`, `assignedSaleIds`, `journalId`, `payoutInstructionId`, `gatewayStatus`, `reconciliationStage`, `feeCalculationId`, `feePolicy*`, `traceId`, `operationId`, `createdByUserId`, `ipAddress`, `actorUsername`, `actorId` và mọi id hạch toán nội bộ.
- Mỗi endpoint thêm hằng số `MerchantAction.Action.MERCHANT_PORTAL_*` cho `@ActionMapping` theo mẫu (`MerchantAction.java`).
- Test mỗi endpoint: (1) Mockito: phạm vi rỗng → rỗng và repository không bị chạm; (2) phạm vi được đẩy vào truy vấn/kiểm tra; (3) ghi vào tài nguyên ngoài phạm vi bị từ chối và service ghi **không** được gọi; (4) test phản xạ khoá `@RequireMerchantPermission(X)` và `@RequestMapping("/api/v1/merchant/...")`; (5) DTO không chứa trường cấm (kiểm bằng serialize JSON, như `MerchantMeControllerTest`).
- Xác minh trước khi giao agent: chạy được `./gradlew --offline test` (Task 0).

## Phát hiện cần biết (từ khảo sát)

- 0.1 Token merchant gọi service admin: `currentRoles()` rỗng → `scopeFor` = nothing: search trả trang rỗng, getById/update trả 404, **write không tự kiểm scope nên chạy thẳng** (nguy cơ IDOR nếu controller quên kiểm).
- 0.2 `AdminPasswordVerifier` xác thực mật khẩu ở realm admin: không dùng cho merchant.
- 0.3 Scope merchant chỉ giữ Master `ACTIVE` và sub `ACTIVE`: sub đã khoá rơi khỏi `scopedSubMerchantIds()`; merchant `DRAFT/PENDING/REJECTED/LOCKED` có scope rỗng.
- 0.4 `AdminAssignmentScope.restrictedTo(merchantIds, subMerchantIds)` + `SubMerchantSpecification.withinScope`/`TerminalSpecification.withinScope` dùng lại được cho merchant.
- 0.5 Cache scope không bị evict khi tạo sub-merchant mới hoặc `approve` scope-proposal: user có thể chưa thấy dữ liệu mới tới khi hết TTL (Task 3 xử lý cho sub-merchant; scope-proposal để Giai đoạn 2).

## Quyết định cần BA/Sec chốt (chặn các giai đoạn sau, không chặn Giai đoạn 1)

1. `CONFIRM_ORDER` nghĩa là gì? `confirm` là xác nhận thanh toán thủ công (`MANUAL-<id>`), ghi có cho merchant: **kế hoạch này KHÔNG mở**; FE sẽ ẩn nút.
2. Merchant có được tự đổi tài khoản ngân hàng không, và có luôn qua checker admin không? OTP nhạy cảm hiện **không chạy được cho merchant user** (identity tra SĐT qua KYC profile): cần mở rộng identity.
3. Rút tiền cho user chỉ được gán sub-merchant (không gán Master): hiện sẽ không thấy gì (`withdrawals` không có cột sub).
4. Thêm quyền mới cho ngân hàng (`VIEW_BANK_ACCOUNT`, `MANAGE_BANK_ACCOUNT`), hồ sơ merchant/KYB (`MANAGE_MERCHANT_PROFILE`), terminal (`MANAGE_TERMINAL`) hay dùng `MANAGE_SUB_MERCHANT`? Thêm quyền = đổi enum + migration + test seed + nhóm hệ thống.
5. Chiến lược nhật ký: whitelist theo `entity_name` + tập id thuộc scope, hay thêm cột `audit_logs.merchant_id`.

---

## Giai đoạn 1 — Rủi ro thấp/vừa, dùng quyền sẵn có

### Task 0: Xác minh môi trường BE
- [ ] `git -C /home/huytq/code/beam/be/flexpay/flex.merchant status` sạch; đề nghị người dùng tạo nhánh `feat/merchant-portal-api` (không commit).
- [ ] `./gradlew --offline test --tests '*MerchantSubMerchantControllerTest' --tests '*MerchantMeControllerTest' --tests '*MerchantPermissionAspectTest'`: phải qua. Nếu thiếu artifact/mạng thì **dừng và báo**, không sửa `build.gradle`.

### Task 1: Nền dùng chung
**Files:** Create `application/authorization/MerchantScopeSupport.java` (+ test).
**Interfaces — Produces:** `AdminAssignmentScope restrictedScope()` (= `AdminAssignmentScope.restrictedTo(policy.scopedMerchantIds(), policy.scopedSubMerchantIds())`); `void requireOwnedMaster(UUID masterId)` (gọi `policy.requireMerchantScope`, ném `ResourceNotFound` thay vì 403 để không xác nhận id tồn tại); `boolean isEmptyScope()`.
- [ ] Test (fail trước): scope rỗng; `requireOwnedMaster` ngoài scope → `ResourceNotFound`.

### Task 2: Rút tiền (đọc + tạo)
**Files:** Create `domain/specification/…/MerchantWithdrawalRequestSpecification.java` (hoặc theo vị trí `*Specification` hiện có) `withinMerchants(Set<UUID>)`; `presentation/controller/v1/merchant/MerchantWithdrawalController.java`; `application/dto/response/merchant/portal/MerchantWithdrawalResponse.java`; mapper; thêm `MerchantAction`.
- `GET /api/v1/merchant/withdrawal-requests` (`VIEW_WITHDRAWAL`): phạm vi rỗng → trang rỗng; còn lại `findAll(withinMerchants(scope), pageable)`.
- `GET /api/v1/merchant/withdrawal-requests/{id}` (`VIEW_WITHDRAWAL`): kiểm `requireOwnedMaster(entity.merchant.id)`.
- `POST /api/v1/merchant/withdrawal-requests` (`CREATE_WITHDRAWAL`): **hợp đồng mới** — body JSON chỉ gồm `bankAccountId` (UUID, bắt buộc), `amount` (số nguyên VND ≥ 1, bắt buộc), `idempotencyKey` (≤ 100 ký tự, bắt buộc), `reason` (tùy chọn, ≤ 500 ký tự) (`MerchantWithdrawalPortalCreateRequest`). BE tự lấy merchant, `bankCode`, số tài khoản đầy đủ và tên chủ tài khoản từ tài khoản đã lưu rồi kiểm phạm vi (`requireOwnedMaster`; ngoài phạm vi hoặc không tồn tại đều 404); `requestType` luôn MANUAL, `currency` luôn VND. FE **không** gửi `merchantId`, `bankCode`, `accountNumber`, `accountName`, `requestType`, `currency` vì API ngân hàng portal chỉ trả số tài khoản đã che. Gọi `create(request, actorId)` hiện có (đã có kiểm tài khoản/hold/hạn mức/idempotency). **Không** mở approve/reconcile.
- **Hạn chế:** tài khoản cấp sub-merchant (level `SUB`/`TERMINAL`, không có `merchant_id`) hiện chưa rút được: service từ chối bằng `BANK_NOT_FOUND`. FE chỉ liệt kê tài khoản cấp Master trong bước chọn tài khoản và ghi chú "Tài khoản cấp điểm bán chưa dùng được để rút tiền" khi đang ẩn tài khoản cấp thấp hơn.
- DTO: giữ `id, amount, fee, currency, bank info, status, reason, createdAt, bankRefId`; bỏ các trường cấm.
- [ ] Test: Mockito list (rỗng/lọc), getById ngoài phạm vi → 404, create với `merchantId` ngoài phạm vi → từ chối và service không gọi, Specification (Testcontainers) lọc đúng theo merchant, phản xạ khoá quyền + đường dẫn, serialize DTO không có trường cấm.

### Task 3: Sub-merchant (chi tiết, thêm, sửa, khoá, mở khoá)
**Files:** Modify `MerchantSubMerchantController.java` (thêm endpoint) hoặc Create `MerchantSubMerchantManagementController.java`; Create `MerchantSubMerchantDetailResponse` (bỏ `createdBy`, `updatedBy`); Modify `AdminSubMerchantService(Impl)` thêm `getForMerchant(UUID)` không qua `scopeFor` admin (chỉ gọi sau khi controller đã kiểm scope).
- `GET .../sub-merchants/{id}` (`MANAGE_SUB_MERCHANT`): tải sub, `requireOwnedMaster(sub.master.id)`, rồi `getForMerchant`.
- `POST .../sub-merchants` (`MANAGE_SUB_MERCHANT`): `request.merchantId` ∈ phạm vi (`requireOwnedMaster`) rồi gọi `create(request)` (service không tự kiểm scope nên bắt buộc kiểm ở controller); **evict cache scope** của user được gán Master sau khi tạo (gọi `invalidationPublisher` như `MerchantLockServiceImpl`).
- `PUT .../sub-merchants/{id}`: `requireOwnedMaster` rồi `update(id, request)`.
- `POST .../sub-merchants/{id}/lock|unlock` (`MANAGE_SUB_MERCHANT`): `requireOwnedMaster`; gọi `MerchantLockServiceImpl.lockSubMerchant/unlockSubMerchant` (đã sạch phụ thuộc admin, đã cascade terminal, evict, audit, chặn unlock khi Master khoá). **Không** mở lock/unlock cấp Master.
- Mở rộng `MerchantSubMerchantSummaryResponse` thêm `phone`, `lockSource`, `createdAt` nếu FE cần (FE đã dùng 5 trường; thêm có điều kiện).
- [ ] Test: IDOR create với `merchantId` ngoài phạm vi, update/lock/unlock sub của merchant khác → 404 + service không gọi, unlock sub đã khoá vẫn qua (kiểm bằng cấp Master), DTO không có `createdBy/updatedBy`, phản xạ khoá quyền + đường dẫn.

### Task 4: Terminal
**Files:** Create `MerchantTerminalController.java`, `MerchantTerminalResponse`/`SummaryResponse` (bỏ `createdBy`, `updatedBy`); Modify `AdminTerminalService(Impl)` thêm `getForMerchant`, `searchInScope(filters, AdminAssignmentScope, pageable)` dùng `TerminalSpecification.withinScope`.
- list/get/create/update/lock/unlock với `MANAGE_SUB_MERCHANT`; `create` kiểm `requireOwnedMaster(sub.master.id)` từ `request.subMerchantId` (tải sub để lấy Master); `update` thêm kiểm `requireParentUnchanged`; lock/unlock qua `MerchantLockServiceImpl.lockTerminal/unlockTerminal`.
- [ ] Test như Task 3 cho terminal.

### Task 5: Đơn hàng (đọc, tạo, làm mới QR)
**Files:** Create `MerchantOrderPortalController.java`, `MerchantOrderPortalResponse` (bỏ `journalId`, `creditTransactionId`, `feeCalculationId`, `feePolicyId/Version`, `creditFailureReason`, `paymentRef`, `paymentName`), `MerchantOrderSpecification.withinMerchants`.
- `GET list` (`VIEW_ORDER`): bắt buộc `merchant.id IN scope`; `merchantCode` LIKE vẫn cho phép nhưng AND với scope.
- `GET {id}` (`VIEW_ORDER`): kiểm scope **trước** khi gọi service (service sinh QR/VA khi `ACTIVE`: tránh side effect với đơn ngoài phạm vi).
- `POST create` (`CREATE_ORDER`): `merchantId`, `subMerchantId`, `terminalId` phải thuộc phạm vi (kiểm từng cái). `POST {id}/refresh-qr` (`CREATE_ORDER`): kiểm scope rồi gọi `refreshQrCode`.
- **Không mở** `confirm` và `retry-credit` (Quyết định 1).
- [ ] Test: IDOR theo id đơn và `merchantId` body, `getById` ngoài phạm vi không gọi service, `confirm` không tồn tại ở đường merchant, DTO không có trường kế toán nội bộ.

### Task 6: FE khớp (sau khi BE Giai đoạn 1 xong)
- [x] Đổi `*.paths.ts` của sub-merchants, terminals, orders, withdrawals sang `/api/v1/merchant/...` (bỏ nút Xác nhận đơn hàng; kết quả `confirm` cập nhật test); chạy `npm run check`. **Đã làm (FE):**
  - Paths: sub-merchants (detail/create/update/lock/unlock), terminals, orders (list/detail/create/refresh-qr), withdrawals (list/detail/create) đều trỏ `/api/v1/merchant/...`.
  - Gỡ "Xác nhận thanh toán": service `confirmOrder`, route `/api/v1/admin/orders/[id]/confirm`, hook `useConfirmOrder`, `DialogOrderConfirm`, nút ở cột bảng, `canConfirm`/`CONFIRM_ORDER` ở trang đơn hàng, `canConfirmOrder`, test liên quan. Giá trị `CONFIRM_ORDER` còn trong danh mục quyền (module nhóm quyền hiển thị catalog của BE).
  - Schema khớp DTO mới: bỏ `createdBy/updatedBy/parentEditable` (terminal); bỏ `journalId`, `creditTransactionId`, `feeCalculationId`, `feePolicy*`, `creditFailureReason`, `paymentRef`, `paymentName` và thêm `subMerchantId`, `terminalId` (đơn hàng); bỏ các trường kế toán/gateway/người duyệt/`failureReason`/`approvedAt` (rút tiền, kèm UI "Ngày duyệt" và lý do từ chối); số tài khoản rút tiền dùng nguyên giá trị BE đã che.
  - Query: list đơn hàng không gửi `merchantId` (BE chỉ nhận `merchantCode`, `orderCode`, `status`); list rút tiền chỉ phân trang và không còn lọc lại theo merchant ở FE.
  - Tạo rút tiền theo hợp đồng POST mới (Task 2): browser gửi `{bankAccountId, amount, reason?, idempotencyKey}`, FE server validate bằng Zod và chuyển nguyên 4 trường cho BE, không còn tải tài khoản ngân hàng để lấy số đầy đủ; 404 và mã lỗi nghiệp vụ của BE được giữ để UI hiển thị tiếng Việt. Danh sách tài khoản chọn chỉ gồm tài khoản cấp Master (chỉ số đã che); tài khoản cấp sub-merchant chưa rút được.
  - Schema ngân hàng: gỡ alias tạm `owningMerchantId` (đọc `merchantId`, là Master chủ sở hữu); `level` nhận đủ `SYSTEM_DEFAULT|MASTER|SUB|TERMINAL`.
  - **Chưa chạy live:** chưa thử tạo rút tiền với token merchant thật.
- [ ] Kiểm thử thật với token merchant (người dùng tự đăng nhập; không nhập mật khẩu hộ).

---

## Giai đoạn 2 — Cần chống leo thang quyền (sau khi Giai đoạn 1 được duyệt)

### Task 7: Nhóm quyền
`MANAGE_PERMISSION_GROUP`. `requireOwnedMaster(group.merchantId)`; `search` lọc `merchantId IN scope OR merchantId IS NULL` (nhóm hệ thống chỉ đọc); `listUsers` của nhóm hệ thống **không mở** hoặc lọc user theo scope; chặn gán permission mà actor không có (`⊆ context.permissions()`); luôn từ chối sửa/xoá nhóm hệ thống. `GET /merchant-permissions` (catalog) mở nguyên xi.

### Task 8: Người dùng
`MANAGE_USER`. Kiểm `request.merchantIds ⊆ scope` và `subMerchantIds` thuộc merchant trong scope; mọi merchant của user mục tiêu ∈ scope (ghi/khoá); cấm tự sửa/khoá/gán nhóm cho chính mình (so `keycloakUserId` với `context.merchantUserId()`); nhóm gán có permission `⊆` permission của actor; không khoá hết quản trị viên cuối của merchant; `search` ép `merchantId IN scope`; che `merchantIds` ngoài scope trong phản hồi; scope-proposal: merchant chỉ **tạo** đề xuất; kiểm evict cache sau `approve`.

## Giai đoạn 3 — Cần quyết định BA/Sec trước khi code

- **Task 9 Nhật ký** (L): theo Quyết định 5; DTO bỏ `ipAddress, requestId, source, actorId, actorUsername`, che/giảm `oldData/newData`; không mở export.
  - [x] **FE đã làm:** `audit-log.paths.ts` → `/api/v1/merchant/audit-logs` (list, detail; không export, không gửi `sortBy`). Schema theo DTO mới (`id, entityName, entityId, action, reason, occurredAt, actorType MERCHANT|ADMIN|SYSTEM, actorLabel`); cột 'Người thực hiện' hiển thị `actorLabel`; bỏ cột IP, khối so sánh trước/sau (`AuditDiffView`, parse/diff payload) và `audit-redact` phía server (BE không còn trả dữ liệu nhạy cảm; `reason` là văn bản BE trả nguyên); bộ lọc bỏ `actorId`, 'Phân hệ' chỉ còn 6 phân hệ BE ghi log. Chưa kiểm thử live với token merchant.
- **Task 10 Ngân hàng** (L): theo Quyết định 2 và 4; chỉ xem (che số TK) và **đề xuất đổi** qua checker admin; không mở `verifyLink`, `hold-mode`, `delete`, `approve/reject`; cần mở rộng OTP identity cho merchant.
  - [x] **FE đã làm (phần đọc):** `bank-account.paths.ts` list/detail → `/api/v1/merchant/bank-accounts`; schema theo DTO mới (bỏ `holdMode*`, `linkFailureReason`; `merchantId` là Master sở hữu; số tài khoản BE đã che, FE hiển thị nguyên giá trị). Ghi (thêm/sửa/xoá/đặt mặc định/OTP) bị ẩn bằng `BANK_ACCOUNT_WRITES_ENABLED = false` (`src/features/bank-accounts/constants/capabilities.ts`), code ghi giữ nguyên, hiện ghi chú 'Thêm hoặc đổi tài khoản ngân hàng hiện chưa mở trên cổng này'. `bank-options` của rút tiền theo DTO mới (bỏ `holdMode`, dùng `payable/status/linkStatus`).
  - [ ] **Còn chờ BE:** đường merchant cho create/update/delete/default/OTP; luồng tạo rút tiền cần số tài khoản đầy đủ nhưng list/detail merchant luôn trả số đã che.
- **Task 11 KYB/hồ sơ merchant** (L): cần policy "sở hữu" không lọc `ACTIVE` (merchant `DRAFT/REJECTED` có scope rỗng), xác thực lại bằng cơ chế merchant thay `AdminPasswordVerifier`, ràng buộc upload với người gửi và giới hạn `DocumentType`, `statusHistory` có kiểm scope và DTO riêng; tuyệt đối không mở `approveKyb/rejectKyb`, `checkAvailability`, `register` nguyên xi.

## Self-Review

- Phủ: 9 miền trong khảo sát (Giai đoạn 1: rút tiền, sub-merchant, terminal, đơn hàng; Giai đoạn 2: nhóm quyền, người dùng; Giai đoạn 3: nhật ký, ngân hàng, KYB).
- Rủi ro lớn nhất đã có biện pháp: IDOR do service ghi không tự kiểm scope (kiểm bắt buộc ở controller, test khoá), lộ trường nội bộ (DTO riêng + test serialize), `getById` đơn hàng có side effect (kiểm scope trước), unlock sub bị chặn bởi scope `ACTIVE` (kiểm cấp Master).
- Chưa xác minh bằng chạy thật: lệnh Gradle offline (Task 0), OTP identity cho merchant (suy luận từ code).
