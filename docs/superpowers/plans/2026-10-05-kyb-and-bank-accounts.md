# Hồ sơ KYB / ĐVCNTT và Tài khoản ngân hàng (Đợt 2c) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Màn mới cho quản trị merchant **gửi yêu cầu** và theo dõi tiến trình: xác thực KYB (ví doanh nghiệp), đăng ký ĐVCNTT (merchant), liên kết/đổi tài khoản ngân hàng. Đây là các màn FE chưa từng có; mockup mã 3.8, 3.9, 3.10.

**Architecture:** Hai module `kyb` (ví doanh nghiệp + hồ sơ merchant + tài liệu) và `bank-accounts`. Form nhiều bước ghi nháp qua BE (`drafts`), tải tệp qua endpoint staging rồi gửi `*StagingId`, gửi duyệt bằng `submit`. Bước nhạy cảm của ngân hàng dùng OTP xác nhận. Chu trình 6 task của `2026-10-05-module-template.md`.

**Tech Stack:** Next.js 16, TanStack Query v5, Zod 4, React Hook Form, Vitest + msw, Basuicn.

**Spec:** `docs/superpowers/specs/2026-10-02-flexpay-be-integration-design.md` (mục 6, "Hồ sơ KYB / ĐVCNTT" và "Ngân hàng"). **Mẫu chung:** `docs/superpowers/plans/2026-10-05-module-template.md`.

**Mockup tham chiếu UI** (khối có comment mã màn trong `~/Downloads/Giao diện ví doanh nghiệp Flexpay/Flexpay Merchant Portal.dc.html`): 3.8 KYB, 3.9 Liên kết ngân hàng, 3.10 Đăng ký ĐVCNTT. Chỗ mockup khác DTO BE thì bỏ trường đó và ghi vào báo cáo.

## Điều kiện bắt buộc trước khi giao Codex

1. **UI đã có mockup và được người dùng xác nhận (3.8, 3.9, 3.10).** Quyết định đã chốt từ kết quả Task 0 (chạy `npx basuicn list`): registry **không có Stepper**; có sẵn `file-upload`, `timeline`, `tabs`, `datepicker`, `input-otp`, `dialog`, `sheet`. Do đó:
   - Thanh bước (1 Khai báo hồ sơ → 2 Xác thực OTP → 3 Gửi yêu cầu) là **component cục bộ của feature** `src/features/kyb/components/KybSteps.tsx` dựng từ primitive (không thêm vào `src/components/ui`, không sửa Basuicn); tiến trình ĐVCNTT (Đã gửi hồ sơ → Admin đang thẩm định → Kích hoạt/Từ chối) dùng `timeline` Basuicn.
   - Tải tệp dùng `file-upload`; ô OTP dùng `input-otp` với hành vi đã duyệt ở đăng nhập (6 ô, dán đủ tự gửi, đếm ngược gửi lại 60s, che SĐT dạng `0912•••678`).
   - Cột "Doanh thu tháng" không có nguồn BE: bỏ.

2. **BE.** Toàn bộ endpoint dưới đây hiện chỉ ở `/api/v1/admin/**`. Chạy thật chờ BE mở `/merchant/**`.

## BE hợp đồng giả định

| Nghiệp vụ | Endpoint (tạm `/api/v1/admin`) | DTO nguồn (`application/dto/`) |
|---|---|---|
| Kiểm tra email/MST khả dụng | `GET /enterprise-wallets/availability` | `response/merchant/wallet/EnterpriseWalletAvailabilityResponse` |
| Lưu nháp / tạo / sửa ví doanh nghiệp | `POST /enterprise-wallets/drafts`, `POST /enterprise-wallets`, `PUT /enterprise-wallets/{id}` | `request/merchant/wallet/EnterpriseWalletCreateRequest` (`registeredEmail, legalName, taxCode, businessType ENTERPRISE\|HOUSEHOLD, headOfficeAddress, legalRepresentativeName, legalRepresentativeIdNumber, managerName, managerTitle, managerIdNumber, managerIdExpiryDate, otpPhone, businessLicenseStagingId, idCardFrontStagingId, idCardBackStagingId, authorizationLetterStagingId, internalWallet`), `EnterpriseWalletUpdateRequest`, `EnterpriseWalletFieldRules` |
| Gửi duyệt KYB | `POST /enterprise-wallets/{id}/submit` | `response/merchant/wallet/EnterpriseWalletResponse` (`verificationStatus` DRAFT→PENDING_APPROVAL→…, `bankLinkStatus`, `kybRejectedReason/At/By`, các `StoredFileResponse`) |
| Chi tiết, tài liệu | `GET /enterprise-wallets/{id}`, `GET /enterprise-wallets/{id}/documents` | `EnterpriseWalletResponse`, `EnterpriseWalletDocumentResponse` (`documentType, status, originalFilename, contentType, uploadedAt, url, urlExpiresAt`) |
| Tải tệp (staging) | `POST /documents` multipart `documentType`, `file` | `DocumentUploadResponse` |
| Đăng ký ĐVCNTT | `GET /merchants/selectable-wallets`, `POST /merchants`, `PUT /merchants/{id}`, `POST /merchants/{id}/submit` | `response/merchant/MerchantResponse`, `request/merchant/MerchantUpdateRequest` (không gửi `adminPassword`) |
| Tiến trình | `GET /merchants/{id}/status-history`, `GET /merchants/rejection-reasons` | `MerchantStatusHistoryResponse`, `MerchantRejectionReasonResponse` |
| Ngân hàng | `GET/POST /merchant-bank-accounts`, `GET/PUT/DELETE .../{id}`, `PUT .../{id}/default`, `POST .../{id}/link-verification` | `MerchantBankAccountCreateRequest` (`merchantId, subMerchantId, bankCode, accountNumber, accountName, branchName, isDefault, otp`), `MerchantBankAccountUpdateRequest` (`version, bankCode, accountNumber, accountName, branchName, status, reason, otp`), `MerchantBankAccountResponse` (`linkStatus, linkFailureReason, holdMode, payable, version`) |
| Yêu cầu đổi ngân hàng | trạng thái trong `MerchantBankAccountChangeRequestResponse` (`changeType, status PENDING\|APPROVED\|REJECTED, proposed*, requestReason, decisionReason`); **không** có approve/reject trong FE | — |
| OTP nhạy cảm | `POST /sensitive-operations/otp-challenge` → `{ otpSessionId, … }`; xác nhận gửi `{ otpSessionId, otp }` | `SensitiveOtpChallengeResponse`, `SensitiveOtpConfirmation` |

Không đưa vào FE: `approve`/`reject` của merchant/ví/đổi ngân hàng, `hold-mode`, `export`, `audit-logs` của merchant (dùng module Nhật ký).

## Global Constraints

Mục "Quy tắc bắt buộc" và "Hợp đồng BE đã xác minh" của module template. Thêm:
- Tệp tải lên: chỉ gửi `*StagingId` nhận từ endpoint staging; không đọc tệp phía server FE ngoài việc chuyển tiếp multipart; giới hạn loại/kích thước kiểm ở client **và** route (đọc giới hạn từ `EnterpriseWalletFieldRules`/BE, không tự bịa).
- Số CCCD/MST/số tài khoản là dữ liệu nhạy cảm: không ghi vào log, không nằm trong URL/query key; hiển thị che giữa (ví dụ 4 số cuối) trong bảng, đầy đủ chỉ trong modal chi tiết.
- Quyền FE: dùng `permissions` hiện có; nếu BE chưa có permission riêng cho KYB/ngân hàng thì ghi vào báo cáo và tạm yêu cầu `MANAGE_SUB_MERCHANT` cho ngân hàng sub-merchant, các màn hồ sơ merchant yêu cầu session hợp lệ + `merchantIds`.

## Luồng theo mockup và chỗ lệch với DTO BE (Codex đọc `EnterpriseWalletFieldRules` để chốt trường bắt buộc)

- **3.8 KYB** — bước 1 form: Loại hình (mockup có Doanh nghiệp / Hộ kinh doanh / Cá nhân; **BE chỉ có `ENTERPRISE|HOUSEHOLD` → bỏ "Cá nhân"**), Tên pháp nhân (`legalName`), MST (`taxCode`), Địa chỉ trụ sở (`headOfficeAddress`), người đại diện (Họ tên/CCCD → `legalRepresentativeName/IdNumber`; Chức vụ/Số giấy tờ/hết hạn → `managerTitle/managerIdNumber/managerIdExpiryDate`; **mockup ghi "Ngày cấp" nhưng BE là ngày hết hạn `managerIdExpiryDate`**: dùng đúng trường BE và nhãn "Ngày hết hạn", ghi vào báo cáo), SĐT nhận OTP (`otpPhone`), Email đăng ký (`registeredEmail`), tệp Giấy phép ĐKKD, CCCD 2 mặt (và Giấy uỷ quyền nếu BE yêu cầu). **Bỏ:** "Lĩnh vực kinh doanh" và "SĐT liên hệ" (không có trường ví tương ứng). Nút: "Lưu nháp" (→ `drafts`), "Gửi yêu cầu xác thực KYB". Bước 2 OTP gửi tới `otpPhone` rồi xác nhận gửi hồ sơ; bước 3 màn thành công "Chờ duyệt KYB" với nút "Về Dashboard" và "Xem lại hồ sơ".
- **3.9 Ngân hàng** — bảng (Ngân hàng, Chi nhánh, Số TK, Chủ TK, Trạng thái, Thao tác; "Mặc định" là badge) + luồng thêm: form → xác minh (mockup: số tiền micro-deposit **hoặc** OTP; dùng đường BE `link-verification` và `sensitive-operations/otp-challenge`, chỉ dựng những gì BE hỗ trợ và ghi vào báo cáo nếu micro-deposit không có endpoint) → thành công. Chủ TK phải trùng pháp nhân KYB: hiển thị gợi ý, BE là chốt chặn.
- **3.10 ĐVCNTT** — banner điều kiện (đã KYB xác thực, đã liên kết ngân hàng, chưa có hồ sơ ĐVCNTT): thiếu điều kiện thì form bị khoá kèm lý do; khối "Thông tin chủ ví (kế thừa từ KYB, chỉ đọc)"; form: MCC (`mccCode`), Tên hiển thị (`name`), website (`websiteUrl`), Người liên hệ/Hotline (`supportContact`), Mô tả (`productDescription`), Logo (`logoStagingId`), ảnh sản phẩm (`productImageStagingIds`), công tắc hợp đồng riêng (`contractSignedWithSub`) + PDF (`contractStagingId`); nút "Gửi duyệt", "Lưu nháp"; sau gửi là màn trạng thái "Chờ duyệt ĐVCNTT" chỉ đọc kèm `timeline` 3 bước và thông tin đã gửi; bị từ chối thì hiện lý do và cho sửa/gửi lại. Không có `adminPassword` trong body.

## Review Focus

- Hồ sơ `DRAFT`: người dùng thoát giữa chừng rồi quay lại thấy nguyên dữ liệu đã lưu; nút "Gửi duyệt" bị khoá cho tới khi đủ trường bắt buộc và đủ tệp.
- Hồ sơ `PENDING_APPROVAL`: toàn bộ chỉ đọc, hiện "Đang chờ duyệt", không có nút sửa.
- Hồ sơ bị từ chối: hiện `kybRejectedReason` và nút "Chỉnh sửa và gửi lại"; lịch sử trạng thái hiện từng lần từ chối với lý do và thời điểm.
- Tệp quá lớn / sai định dạng / tải lỗi giữa chừng: lỗi hiện cạnh ô tệp, tệp cũ giữ nguyên, không gửi `StagingId` rỗng.
- Email hoặc MST đã tồn tại (`availability` hoặc 409): báo tại đúng ô, không mất dữ liệu bước khác.
- Số tài khoản ngân hàng: đổi tài khoản **mặc định/đã liên kết** tạo yêu cầu chờ duyệt (PENDING), UI nói rõ; hai yêu cầu PENDING cho một tài khoản bị chặn (BE chỉ cho một PENDING).
- OTP sai / hết hạn / hết lượt gửi lại: thông báo đúng, không lộ `otpSessionId`; nhập đủ 6 số tự gửi.
- `version` (khoá lạc quan) lệch khi sửa ngân hàng (BE 409): hiện "Dữ liệu đã thay đổi, vui lòng tải lại" và nút tải lại.
- Mở `url` tài liệu: URL ký hết hạn (`urlExpiresAt`); hết hạn thì tải lại chi tiết, không mở link chết.

---

## Task 0: Quyết định UI còn mở (không code)
- [ ] Chạy `npx basuicn list` kiểm tra có Stepper/Steps/FileUpload/Timeline; ghi kết quả. Thiếu component nào thì **dừng và báo người dùng** theo mẫu `BASUICN.md`, không tự viết primitive.
- [ ] Chốt quyết định (a)(b)(c) ở "Điều kiện bắt buộc" với người dùng trước Task 5.

## Phần A — KYB / ĐVCNTT

### Task 1: Schema + mapper KYB
**Files:** `src/features/kyb/schemas/{enterprise-wallet,merchant-profile}.schema.ts` (+ test), `src/features/kyb/utils/kyb-mapper.ts` (+ test), `src/features/kyb/types.ts`.
**Interfaces — Produces:** `enterpriseWalletSchema`, `merchantProfileSchema`, `kybStepSchemas` (một schema cho mỗi bước: thông tin pháp lý, người đại diện/quản lý, tài liệu), `toWalletRequest(values, stagingIds)`, `kybProgress(wallet)` → `{ stage: 'DRAFT'|'PENDING'|'APPROVED'|'REJECTED', rejectedReason? }`, `canEditKyb(wallet)`, `canSubmitKyb(values, stagingIds)`, `maskIdNumber(value)`.
- [ ] Test (fail trước): enum `ENTERPRISE|HOUSEHOLD`; `managerIdExpiryDate` đã hết hạn bị từ chối; thiếu `businessLicenseStagingId` làm `canSubmitKyb` false; `canEditKyb` chỉ true ở DRAFT/REJECTED; `maskIdNumber("012345678901")` chỉ lộ 4 số cuối; mapper không gửi chuỗi rỗng và không có `adminPassword`.

### Task 2: Service KYB (msw)
**Files:** `src/server/modules/kyb/{kyb.paths,kyb.service}.ts` (+ test).
**Interfaces — Produces:** `checkAvailability({email,taxCode})`, `saveWalletDraft(values)`, `createWallet`, `updateWallet(id, values)`, `submitWallet(id)`, `getWallet(id)`, `listWalletDocuments(id)`, `uploadDocument(file, documentType)` (multipart), `listSelectableWallets()`, `registerMerchant`, `updateMerchant`, `submitMerchant`, `getMerchantStatusHistory(id, page)`, `listRejectionReasons()`.
- [ ] Test msw: multipart gửi đúng `documentType` + `file`; `submit` không có body; `Page` rỗng của lịch sử; 409 email trùng giữ `message`; response sai schema → `INVALID_RESPONSE`.

### Task 3: Route handler KYB
**Files:** `src/app/api/v1/admin/kyb/**`, `require-kyb-access.ts` (+ tests).
- [ ] Theo template; thêm: upload từ chối tệp > giới hạn/MIME lạ (400) **trước** khi chuyển tiếp; ví/merchant không thuộc `merchantIds` của session → 404; không log số CCCD/MST.

### Task 4: Query + trang Hybrid KYB
**Files:** `kyb-queries.ts`, `src/app/(cms)/(merchant-management)/merchants/{page,loading}.tsx` (thay `merchants/page.tsx` mock), container.
- [ ] Trang `merchants` hiển thị trạng thái hồ sơ hiện tại (server prefetch `getWallet`/merchant theo session), tiến trình, lịch sử trạng thái; Hybrid cho phần tiến trình tự làm mới (`refetchInterval` chỉ khi `PENDING_APPROVAL`, tắt khi tab ẩn).

### Task 5: UI KYB (sau khi duyệt Task 0)
**Files:** `components/{KybWizard,KybStepLegal,KybStepRepresentative,KybStepDocuments,KybProgressCard,KybStatusHistory,DocumentUploadField}.tsx`; hook `use-kyb-wizard.ts` (điều phối bước + lưu nháp), hook `use-document-upload.ts`.
- [ ] Wizard nhiều bước nằm trong **modal/sheet rộng** không tạo route mới; mỗi bước lưu nháp khi "Tiếp tục"; test tích hợp: điền bước 1 → lưu nháp (POST drafts đúng body) → quay lại thấy dữ liệu; tải tệp lỗi giữ tệp cũ; submit gọi `submit` rồi chuyển sang trạng thái chờ duyệt chỉ đọc; bị từ chối hiện lý do + "Chỉnh sửa và gửi lại".

## Phần B — Ngân hàng

### Task 6: Schema + mapper ngân hàng
**Files:** `src/features/bank-accounts/schemas/*.ts`, `utils/bank-mapper.ts` (+ tests), `types.ts`.
**Interfaces — Produces:** `bankAccountSchema` (nhận cả `default` và `isDefault`), `bankAccountFormSchema` (`bankCode` bắt buộc, `accountNumber` 6–20 số, `accountName` viết hoa không dấu theo BE nếu `FieldRules` quy định), `toCreateBankRequest(values, otp)`, `toUpdateBankRequest(values, version, reason, otp)`, `bankLinkLabel(account)`, `canChangeBank(account, pendingChange)`, `maskAccountNumber`.
- [ ] Test: `canChangeBank` false khi đã có PENDING; update luôn mang `version`; số tài khoản có chữ bị từ chối; mapper không gửi `otp` khi không có.

### Task 7: Service ngân hàng + OTP (msw)
**Interfaces — Produces:** `listBankAccounts(filter)`, `getBankAccount(id)`, `createBankAccount`, `updateBankAccount`, `deleteBankAccount`, `setDefaultBankAccount`, `verifyBankLink(id)`, `requestSensitiveOtp(operation)` → `{ otpSessionId, expiresAt?, resendAvailableAt? }`.
- [ ] Test msw: tạo/sửa gửi `otp: { otpSessionId, otp }`; `DELETE` trả `RestApiResponse<Void>`; 409 do `version` lệch giữ `message`; OTP sai (400) giữ mã lỗi cho UI phân biệt.

### Task 8: Route handler ngân hàng (+ OTP)
- [ ] Theo template; thêm: không bao giờ trả `otpSessionId` ra log; body có `otp` không đầy đủ → 400 trước khi gọi BE; tài khoản thuộc merchant khác → 404.

### Task 9: Query + trang Hybrid ngân hàng
**Files:** `bank-account-queries.ts`, `src/app/(cms)/(merchant-management)/bank-accounts/{page,loading}.tsx` (route mới) + mục menu có điều kiện permission.
- [ ] Theo template; bảng: ngân hàng, số TK (đã che), chi nhánh, trạng thái liên kết, mặc định, yêu cầu đang chờ (badge).

### Task 10: UI ngân hàng
**Files:** `components/{BankAccountTable,BankAccountFormModal,BankOtpDialog,BankChangeRequestBadge,BankDetailModal}.tsx`, `columns/BankAccountColumn.tsx`.
- [ ] Test tích hợp: thêm TK → hiện OTP dialog → nhập 6 số gọi create kèm `otp` → modal đóng; OTP sai hiện lỗi và giữ dialog; sửa TK đã liên kết tạo yêu cầu và hiện `Chờ duyệt`; 409 `version` hiện nút tải lại; icon button có tooltip.

### Task 11: Dọn dẹp + nghiệm thu
- [ ] Xoá mock `merchants/page.tsx` cũ, dữ liệu `BANK_OPTIONS` hardcode (lấy danh sách ngân hàng từ BE nếu có endpoint, nếu không giữ một file hằng số danh mục có nguồn ghi rõ), cập nhật route constants; `npm run check` sạch; báo cáo trung thực phần phụ thuộc BE.

## Self-Review

- Spec: 3.8 (Task 1–5), 3.10 (Task 1–5), 3.9 (Task 6–10); không có màn duyệt; cột doanh thu bỏ (Task 0).
- Rủi ro mở: BE `/merchant/**` chưa có cho cả hai module; có thể BE chỉ cho merchant gửi yêu cầu ở dạng khác (khi đó chỉ đổi schema/mapper/paths); Stepper/FileUpload có thể thiếu trong Basuicn (Task 0).
