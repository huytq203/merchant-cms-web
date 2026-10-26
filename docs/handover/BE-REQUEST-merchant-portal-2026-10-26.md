# Yêu cầu BE làm bù cho Merchant Portal (26/10/2026)

Tài liệu này liệt kê những chỗ Merchant Portal (`merchant-cms-web`) đang lỗi hoặc chưa nối được vì BE chưa có API. Nguồn: lần chạy thử portal local trên môi trường dev (`https://api.dev.ewallet.flexpay.vn`) ngày 26/10/2026 và đối chiếu route BE `flex.merchant` nhánh `origin/develop`.

## Cách đọc

- **Đã đo** = gọi thật từ portal và nhận được kết quả như ghi.
- **Theo code** = xác định bằng đọc code, chưa gọi (vì sẽ gửi OTP thật hoặc ghi dữ liệu).
- Phần "FE cần" mô tả dữ liệu mà màn hình hiện tại đang dùng. Đây là đề xuất để BE đối chiếu, không phải hợp đồng đã chốt; BE có thể đổi tên trường, miễn báo lại để FE chỉnh schema.
- Quy ước chung FE đang dựa vào (theo các API đã nối): gốc `/api/v1/merchant/...`, phân trang theo trang, tối đa 100 dòng mỗi trang, phạm vi dữ liệu theo Master/Sub của người dùng đang đăng nhập, quyền theo `@RequireMerchantPermission`.

## Tổng quan

| # | Hạng mục | Mức | Cách xác định | Việc của |
|---|---|---|---|---|
| A1 | Số dư có thể rút: `GET /withdrawal-requests/balance` | Lỗi đang xảy ra | Đã đo | BE thêm route (hoặc FE đổi nguồn dữ liệu) |
| A2 | OTP tạo lệnh rút: `POST /withdrawal-requests/otp-challenge` | Lỗi đang xảy ra | Theo code | BE + identity |
| A3 | `GET /sub-balances/{subId}` trả 503 | Lỗi đang xảy ra | Đã đo | BE |
| B1 | Danh sách giao dịch + xuất báo cáo | Chưa có API | Đã đo (FE nhận 501) | BE |
| B2 | Tra soát giao dịch | Chưa có API | Theo code | BE |
| B3 | Yêu cầu hoàn tiền: danh sách, hủy, xuất | Chưa có API | Đã đo (FE nhận 501) | BE + BA chốt |
| B4 | Khiếu nại: danh sách, tạo, trả lời, từ chối, xuất | Chưa có API | Đã đo (FE nhận 501) | BE |
| C1 | Cập nhật hồ sơ tài khoản | Chưa có API | Theo code | BE hoặc BA chốt hướng khác |

Thứ tự đề xuất: A1, A2, A3 trước (đang chặn luồng thật), rồi B và C theo ưu tiên nghiệp vụ.

---

## A. Lỗi đang xảy ra với route FE đã gọi

### A1. Số dư có thể rút

- **FE gọi:** `GET /api/v1/merchant/withdrawal-requests/balance`
- **Hiện tượng (đã đo):** BE trả 500 `HTTP_500`; FE hiển thị 502 "Hệ thống đang gặp sự cố". Màn Rút tiền không đọc được số dư.
- **Nguyên nhân (theo code BE):** `MerchantWithdrawalPortalController` trên `origin/develop` chỉ có `GET /withdrawal-requests`, `GET /withdrawal-requests/{id}` và `POST /withdrawal-requests`. Không có `/balance`, nên chuỗi `balance` rơi vào `/{id}` và lỗi khi đọc thành UUID. Không nhánh nào khác trong `flex.merchant` có route này.
- **Yêu cầu BE:** thêm `GET /api/v1/merchant/withdrawal-requests/balance`, đặt trước `/{id}` để không bị trùng, quyền `VIEW_WITHDRAWAL`, phạm vi theo phiên. FE gọi với `?merchantId=` (FE hiện đã truyền; BE có thể bỏ qua nếu lấy theo phiên).
- **FE cần (đang dùng):**

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `merchantId` | uuid | |
| `availableBalance` | số nguyên ≥ 0 | số dư có thể rút |
| `heldBalance` | số nguyên ≥ 0 | |
| `dailyLimitRemaining` | số nguyên ≥ 0 hoặc null | hạn mức ngày còn lại |
| `minimumAmount` | số nguyên ≥ 0 hoặc null | |
| `maximumAmount` | số nguyên ≥ 0 hoặc null | |

- **Phương án thay thế:** nếu BE không muốn thêm route, có thể dùng `GET /sub-balances/{subId}` (đã có) và FE tự tính. Cần BE và BA chọn một hướng; hiện FE sẽ không tự đoán.

### A2. OTP tạo lệnh rút tiền

- **FE gọi:** `POST /api/v1/merchant/withdrawal-requests/otp-challenge`
- **Hiện tượng (theo code):** BE không có route này (xem A1). Mình chưa gọi vì sẽ phát hành OTP thật.
- **Liên quan:** các màn khác dùng route chung `POST /api/v1/merchant/sensitive-operations/otp-challenge` (tài khoản ngân hàng, KYB) và OTP riêng của hoàn doanh thu. Ngoài ra `FE-API-GAP-merchant-2026-10-22.md` ghi identity chưa hỗ trợ operation `MERCHANT_WITHDRAWAL_CREATE` cho realm Merchant (identity hiện chỉ nhận `BANK_ACCOUNT_CHANGE` và `KYB_SUBMIT` cho Merchant Portal). Nếu đúng, tạo lệnh rút sẽ bị chặn dù có route.
- **Yêu cầu BE:** chọn một trong hai và báo FE:
  1. Thêm `POST /withdrawal-requests/otp-challenge` cho Portal; hoặc
  2. Cho `POST /sensitive-operations/otp-challenge` nhận operation `MERCHANT_WITHDRAWAL_CREATE` và FE đổi path.
  
  Cả hai đều cần identity hỗ trợ operation này cho realm Merchant (nhờ BE identity xác nhận trên môi trường dev đang chạy, vì kết luận trong doc cũ chỉ dựa vào mã nguồn `develop`).
- **Kết quả mong đợi:** thân yêu cầu và phản hồi giống OTP challenge các màn khác (FE đang dùng schema `sensitiveOtpChallengeSchema` dùng chung).

### A3. Số dư Sub-merchant trả 503

- **FE gọi:** `GET /api/v1/merchant/sub-balances/{subMerchantId}` (route có thật).
- **Hiện tượng (đã đo):** BE trả HTTP 503, mã `MERCHANT_ESCROW_BALANCE_UNAVAILABLE`, thông điệp "Chưa đọc được số dư từ sổ cái nên chưa thực hiện được thao tác này; vui lòng thử lại". Xuất hiện 8 lần trong log khi mở màn Số dư Sub-merchant với Sub `nhinty12` (id `1311ae27-4ecb-447d-8c78-f3eb1307684c`, mã `MC000001-S002`).
- **Yêu cầu BE:** kiểm tra vì sao sổ cái không đọc được số dư cho Sub này (dịch vụ sổ cái không phản hồi, hay Sub chưa có tài khoản sổ cái). Nếu Sub chưa có số dư thì nên trả số 0 thay vì 503. Cần BE cho biết 503 là sự cố tạm thời hay là hành vi có chủ đích, để FE hiển thị đúng thông báo.
- **Ghi chú:** các route escrow, hold-calendar, settlement-items cùng nhóm tài chính đều trả 200 trong lần thử này.

---

## B. API còn thiếu hoàn toàn

FE đã có màn và gọi route `/api/v1/admin/merchants/{transaction|refunds|complaints}` của chính app Next.js. Route này hiện trả 501 (theo thiết kế, "Chức năng chưa được hỗ trợ"). Trong `develop` không có controller nào cho các nghiệp vụ này, ở cả Admin lẫn Portal. Chỉ có quyền `VIEW_TRANSACTION`, `EXPORT_TRANSACTION`, `CREATE_DISPUTE`, `REPLY_DISPUTE`, `VIEW_DISPUTE` trong catalog quyền (đã thấy trong `GET /merchant-permissions`), và các thực thể nền như `FinancialTransactionLog`, `MerchantPaymentConfirmation`, `MerchantPaymentAnomaly`.

### B1. Danh sách giao dịch

- **Đề xuất route:** `GET /api/v1/merchant/transactions`, quyền `VIEW_TRANSACTION`, phạm vi Master/Sub theo phiên.
- **Bộ lọc FE đang có:** `page`, `pageSize` (tối đa 100), `keyword`, `customerContact`, `status`, `type`, `paymentMethod`, `subMerchantId`, `bankCode`, `createdFromDate`, `createdToDate`.
- **Dòng dữ liệu FE đang hiển thị:** `id`, `code`, `invoiceCode`, `type`, `cardType`, `cardNumber` (đã che), `cardHolderName`, `amount`, `currency`, `fee`, `netAmount`, `subMerchantId`, `subMerchantName`, `customerId`, `customerName`, `customerPhone`, `createdAt`, `status`, `description`, `referenceCode`, `paymentMethod`, `bankCode`, `responseCode`, `responseMessage`; kèm `total`.
- **Lưu ý quan trọng cho BA/BE:** mẫu dữ liệu FE hiện thiết kế theo giao dịch thẻ (`cardType` visa/mastercard/napas/amex, `cardNumber`). Mô hình thanh toán thật của merchant là đơn hàng QR (VCB/VPB) và `settlement-items`. BE và BA cần xác nhận giao dịch trong màn này là gì (xác nhận thanh toán của đơn? dòng sổ cái?) và FE sẽ bỏ các trường thẻ nếu không có.
- **Xuất báo cáo:** `GET /api/v1/merchant/transactions/export` (cùng bộ lọc, quyền `EXPORT_TRANSACTION`), trả file. Định dạng cần chốt (nút trên màn ghi `.xlsx`; các export Admin hiện có của BE là CSV).

### B2. Tra soát giao dịch

- **Màn:** form "Khởi tạo yêu cầu Tra soát" trên một giao dịch.
- **FE gửi:** mã giao dịch, `reason` (chọn một trong: tính phí nhầm, không được xử lý, trùng lặp, số tiền không khớp, khác), `note` (tối thiểu 10 ký tự), danh sách file đính kèm.
- **Đề xuất route:** `POST /api/v1/merchant/transactions/{id}/inquiries` (multipart nếu có file; có thể tái dùng `POST /documents` để tải file lên trước).
- **Cần BE/BA chốt:** có luồng trạng thái xử lý tra soát không, và có màn xem danh sách/kết quả không. FE hiện chỉ có form gửi đi, chưa có danh sách.
- **Phân biệt:** `merchant-reconciliations` của Admin là đối soát theo Sub, không phải tra soát từng giao dịch.

### B3. Yêu cầu hoàn tiền (màn `/refund`)

- **Hiện trạng:** BE đã có hoàn doanh thu `revenue-refunds` (Portal: tạo, danh sách, duyệt; Admin: duyệt, từ chối, thử lại, chi trả) và FE đã nối ở màn riêng "Hoàn doanh thu" (`/revenue-refunds`).
- **Vấn đề:** màn `/refund` dùng mô hình khác hẳn (số thẻ, `feeMb`, `feeNm`, trạng thái `pending/approved/rejected/success/cancelled`), không khớp `revenue-refunds` (trạng thái `PENDING_APPROVAL`, `PROCESSING`, `ACCOUNTING_QUEUE`, `SUCCEEDED`, `FAILED`, `REJECTED`).
- **Cần BA/BE chốt trước khi làm bất cứ thứ gì:**
  1. `/refund` có còn cần không, hay bỏ và dùng `/revenue-refunds`?
  2. Nếu còn, nó khác hoàn doanh thu ở điểm nào (ví dụ hoàn tiền cho khách từ giao dịch thẻ)?
- **Nếu giữ:** cần `GET /api/v1/merchant/refunds` (danh sách, bộ lọc `keyword`, `invoiceCode`, `transactionCode`, `status` nhiều giá trị, `subMerchantId`, khoảng ngày), `POST /api/v1/merchant/refunds/{id}/cancel` (hủy yêu cầu đang chờ; sau khi hủy số dư tạm giữ về ví) và `GET .../export`. Nếu bỏ: FE xóa màn, BE không cần làm.

### B4. Khiếu nại

- **Đề xuất route (quyền theo catalog đã có):**
  - `GET /api/v1/merchant/complaints`, quyền `VIEW_DISPUTE`. Bộ lọc FE: `page`, `pageSize`, `keyword`, `status`, `source`, `createdFromDate`, `createdToDate`.
  - `POST /api/v1/merchant/complaints`, quyền `CREATE_DISPUTE`. FE gửi mã giao dịch cần khiếu nại, lý do, ghi chú chi tiết.
  - `POST /api/v1/merchant/complaints/{id}/replies`, quyền `REPLY_DISPUTE`. FE gửi nội dung tối đa 500 ký tự.
  - `POST /api/v1/merchant/complaints/{id}/reject`, quyền `REPLY_DISPUTE`. Cần chốt có kèm lý do không.
  - `GET /api/v1/merchant/complaints/export`.
- **Dòng dữ liệu FE đang hiển thị:** `id`, `ticketCode`, `transactionId`, `transactionCode`, `subMerchantName`, `reason`, `source` (`customer` | `gateway` | `merchant`), `content`, `status` (`pending` | `processing` | `resolved` | `rejected`), `deadline`, `note`, `lastUpdatedAt`, `createdAt`, `messages[]` (`id`, `role` admin/merchant, `senderName`, `content`, `time`); kèm `total`.
- **Cần BE/BA chốt:** vòng đời trạng thái, ai được phép "từ chối" (Merchant hay Admin/Cổng), hạn xử lý (`deadline`) tính thế nào, và `source` có đúng ba giá trị trên không.

---

## C. Hồ sơ tài khoản

### C1. Cập nhật hồ sơ

- **FE gọi:** nút "Lưu thông tin" (tab Hồ sơ) gọi `PATCH /api/v1/admin/auth/profile` của chính app, hiện luôn trả 501.
- **BE Portal hiện có:** chỉ `GET /api/v1/merchant/me`. Identity cũng chưa có route cập nhật hồ sơ merchant.
- **FE cần gửi:** `fullName` (2 đến 100 ký tự), `phone` (10 đến 11 chữ số hoặc rỗng).
- **Yêu cầu:** chọn một trong:
  1. BE thêm `PATCH /api/v1/merchant/me` (hoặc tương đương) cho hai trường trên; hoặc
  2. Chốt rằng hồ sơ chỉ xem, không sửa, và FE bỏ tab/nút này; hoặc
  3. Cho tự sửa qua `PUT /merchant-users/{id}` nếu quyền cho phép tự sửa mình (BE cần xác nhận).

---

## Việc FE tự làm, không phụ thuộc BE

- Nối menu Thông báo với 4 route BE đã có: `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/{id}/read`, `POST /notifications/read-all`.
- Đổi path OTP rút tiền và nguồn số dư rút khi BE chốt hướng ở A1 và A2.
- Xóa mã chết: `src/lib/mock/mock-store.ts` và `src/components/ui/login-fullscreen/LoginFullScreen.tsx`.

## Chưa kiểm tra (nói rõ để không hiểu nhầm là đã ổn)

- Các thao tác ghi: tạo/sửa/khóa/mở khóa sub-merchant, terminal, người dùng, nhóm quyền, tài khoản ngân hàng, KYB, hủy đơn, tạo lệnh rút, hoàn doanh thu. Chưa gọi thử trên môi trường dev.
- Giao diện: một số trang (`/merchants`, `/transaction`, `/order`, `/refund`, `/complaint`) bị đứng ở khung loading trong trình duyệt tích hợp của lần thử này. Log server không có lỗi nên chưa xác định nguyên nhân; cần thử lại trên dev server sạch.
- Lần chạy dùng server `main-merchant-cms-web` (cổng 3000), còn tài liệu này đối chiếu code ở `merchant-cms-web`. Hai thư mục có thể lệch nhau.
- Chỉ đọc route các controller trên `origin/develop` và quét tên file ở nhánh khác; API mới nằm sâu trong nhánh chưa merge có thể bị sót.

## Đề nghị BE phản hồi

1. A1, A2: chọn phương án và ngày dự kiến.
2. A3: nguyên nhân 503 và cách xử lý.
3. B1 đến B4: xác nhận có làm không, ưu tiên, và chốt các câu hỏi ghi ở từng mục.
4. C1: chọn phương án.
