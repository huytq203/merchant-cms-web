# Terminal và Nhật ký hệ thống (Đợt 2d) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Hai màn mới cho quản trị merchant: quản lý Terminal (xem, thêm, sửa, khoá/mở khoá; mockup 3.24–3.29) và Nhật ký hệ thống (xem và lọc, cần quyền `VIEW_AUDIT_LOG`).

**Architecture:** Hai module độc lập `terminals` và `audit-logs`, làm theo chu trình 6 task của `2026-10-05-module-template.md`. Terminal giống Sub-merchant (cùng `MerchantNodeStatus`, `LockSource`, trường "Kế thừa") nên tái dùng mẫu và component trạng thái của `sub-merchants`. Audit log là bảng chỉ đọc có lọc theo thời gian và xem chi tiết dữ liệu trước/sau.

**Tech Stack:** Next.js 16, TanStack Query v5, Zod 4, Vitest + msw, Basuicn.

**Spec:** `docs/superpowers/specs/2026-10-02-flexpay-be-integration-design.md` (mục 6, Terminal và Audit log). **Mẫu chung:** `docs/superpowers/plans/2026-10-05-module-template.md`.

**Mockup tham chiếu UI** (khối có comment mã màn trong `~/Downloads/Giao diện ví doanh nghiệp Flexpay/Flexpay Merchant Portal.dc.html`): 3.24 DS Terminal, 3.25/3.26 Thêm/Cập nhật, 3.27 Chi tiết, 3.28 Khoá, 3.29 Mở khoá, và màn **Nhật ký hệ thống (Audit Log)** (menu "Nhật ký hệ thống" → "Audit Log"; khối có tiêu đề "Nhật ký hệ thống (Audit Log)" trong cùng file).

## Điều kiện bắt buộc trước khi giao Codex

1. **UI đã có mockup và được người dùng xác nhận** (Terminal 3.24–3.29; Audit Log). Bố cục Audit Log theo mockup: tiêu đề + badge trạng thái; thẻ filter một hàng gồm **User thực hiện** (ô email/tên), **Phân hệ** (select, mặc định "Tất cả"), **Từ ngày**, **Đến ngày** và nút **Tìm kiếm** teal; thẻ bảng riêng với cột **Thời gian, User, Hành động, Phân hệ, Địa chỉ IP, Kết quả**; dòng chú thích dưới bảng "Ghi nhận toàn bộ thao tác nhạy cảm của mọi user thuộc Merchant". Dựng theo mockup nhưng áp quy ước template (filter và bảng hai card; nút Tìm kiếm/Xoá lọc theo quy ước đã duyệt: hàng riêng căn phải).
   - **Ánh xạ mockup → DTO:** User thực hiện → `actorUsername`; Phân hệ → `entityName` (nhãn tiếng Việt theo bảng ánh xạ do Task 7 định nghĩa từ các giá trị thực tế BE ghi; giá trị lạ hiển thị nguyên mã); Hành động → `action` (+ `reason` nếu có); Địa chỉ IP → `ipAddress` (hiển thị che octet cuối như mockup); Thời gian → `occurredAt`.
   - **Cột "Kết quả" không có trường BE tương ứng.** Task 7 đọc `AuditLogAction` để xem có hành động nào mang nghĩa thất bại (ví dụ đăng nhập thất bại); nếu có thì suy ra "Thành công/Thất bại" từ `action`, nếu không thì **bỏ cột** và ghi vào báo cáo. Không tự bịa trạng thái.
   - **Modal chi tiết trước/sau** (từ `oldData`/`newData`) **không có trong mockup**: là bổ sung nhỏ, mở khi bấm dòng; giữ vì DTO có sẵn và hữu ích cho kiểm toán, báo cáo rõ đây là phần thêm để người dùng quyết giữ hay bỏ.
2. **BE.** Endpoint chỉ ở `/api/v1/admin/**`; chạy thật chờ BE mở `/merchant/**`. Audit log của merchant phải **chỉ trả bản ghi thuộc merchant của session**; nếu BE dùng chung endpoint, đây là điều kiện bảo mật phải được BE xác nhận (không thể ép ở FE).

## BE hợp đồng giả định

| Module | Endpoint (tạm `/api/v1/admin`) | DTO nguồn (`application/dto/`) |
|---|---|---|
| Terminal | `GET/POST /terminals`, `GET/PUT /terminals/{id}`, `POST .../{id}/lock|unlock` | `request/merchant/terminal/TerminalCreateRequest` & `TerminalUpdateRequest` (`subMerchantId, name, terminalType POS\|ONLINE\|QR, address, contactPerson, inheritContactPhone, contactPhone, note`), `response/merchant/terminal/AdminTerminalSummaryResponse` (record: `id, tid, name, terminalType, address, status, lockSource, subMerchantId/Code/Name, merchantId, contactPhone: InheritedField, createdAt`), `AdminTerminalResponse` (+ `contactPerson, note, merchantCode/Name, typeChangeWarning, updatedAt, createdBy, updatedBy`), `MerchantLockRequest` (`reason` 10–500) |
| Audit log | `GET /audit-logs`, `GET /audit-logs/{id}` | `request/merchant/AuditLogSearchRequest` (`actorId, actorUsername, action, entityName, entityId, occurredFrom, occurredTo`; sắp xếp mặc định `occurredAt`), `response/merchant/AuditLogResponse` (`id, entityName, entityId, action, actorType, actorId, actorUsername, source, ipAddress, requestId, reason, oldData, newData, occurredAt`), enum `common/enums/AuditLogAction` |

Không đưa vào FE: `GET /audit-logs/export` (xuất tệp: bổ sung sau nếu người dùng yêu cầu).

## Global Constraints

Mục "Quy tắc bắt buộc" và "Hợp đồng BE đã xác minh" của module template. Thêm:
- Quyền FE: `MANAGE_SUB_MERCHANT` cho Terminal (terminal thuộc sub-merchant; xác nhận với BE nếu có quyền riêng), `VIEW_AUDIT_LOG` cho Audit log (đã có trong `permissions.ts`).
- Audit log là **chỉ đọc** tuyệt đối: không có hành động ghi, không có nút xoá/sửa.
- `oldData`/`newData` là chuỗi JSON do BE ghi: parse an toàn (lỗi parse → hiển thị chuỗi thô trong khối code, không throw); **che** các khoá nhạy cảm (`password`, `otp`, `token`, `secret`, `accessKey`, số thẻ/tài khoản chỉ lộ 4 số cuối) trước khi hiển thị; không log dữ liệu này ra console.

## Review Focus

- Terminal `POS` bắt buộc `address`, `ONLINE` không áp dụng địa chỉ: form ẩn/khoá ô địa chỉ theo loại và không gửi địa chỉ khi `ONLINE`.
- Đổi `terminalType` khi sửa: hiện `typeChangeWarning` của BE trước khi lưu; không đổi ngầm.
- `lockSource = CASCADE` ("Khóa theo Sub-merchant/Master"): nút mở khoá disabled kèm tooltip giải thích; `TERMINATED`: chỉ đọc.
- `inheritContactPhone` tick: không gửi `contactPhone`; bỏ tick bắt buộc nhập (cùng quy tắc sub-merchant).
- Terminal của sub-merchant không thuộc phạm vi user: 404, không gọi BE ghi (route kiểm qua detail như module template).
- Audit log: lọc "Phân hệ" gửi `entityName` đúng giá trị BE (không gửi nhãn tiếng Việt); chọn "Tất cả" thì không gửi tham số; khoảng thời gian `occurredFrom > occurredTo` bị chặn ở client; khoảng quá rộng không làm treo (phân trang bắt buộc, `size ≤ 100`); danh sách rỗng là empty state.
- `oldData`/`newData` rất lớn hoặc không phải JSON hợp lệ: modal cuộn, không vỡ layout, không chạy script (render dạng văn bản).
- `actorType` lạ (ví dụ `SYSTEM`): hiển thị nhãn dự phòng, không crash.

---

## Phần A — Terminal

### Task 1: Schema + mapper Terminal
**Files:** `src/features/terminals/schemas.ts` (+ test), `utils/terminal-mapper.ts` (+ test), `types.ts`.
**Interfaces — Produces:** `terminalSummarySchema`, `terminalDetailSchema` (dùng lại `inheritedFieldSchema`, `subMerchantStatusSchema`, `lockSourceSchema` từ `src/features/sub-merchants/schemas.ts` — nếu cần dùng chung thì **chuyển** hai schema đó vào `src/lib/be/node-schemas.ts` và cập nhật import của sub-merchants, vì đây là consumer thứ hai thực tế), `terminalTypeSchema`, `terminalFormSchema` (cùng quy tắc kế thừa, thêm quy tắc địa chỉ theo loại), `toCreateTerminalRequest`, `toUpdateTerminalRequest`, `canLockTerminal`, `canUnlockTerminal`.
- [ ] Test (fail trước): POS thiếu địa chỉ bị từ chối; ONLINE có địa chỉ vẫn hợp lệ nhưng mapper bỏ địa chỉ; kế thừa giống sub-merchant; enum loại lạ bị từ chối; `canLockTerminal`/`canUnlockTerminal` như sub-merchant.

### Task 2: Service Terminal (msw)
**Files:** `src/server/modules/terminals/{terminal.paths,terminal.service}.ts` (+ test).
**Interfaces — Produces (`BeResult`):** `listTerminals(filter)` (query `page,size,subMerchantId?,name?,status?`), `getTerminal(id)`, `createTerminal`, `updateTerminal`, `lockTerminal(id, reason)`, `unlockTerminal`.
- [ ] Test msw theo template.

### Task 3: Route handler Terminal
**Files:** `src/app/api/v1/admin/terminals/**`, `require-terminal-access.ts` (+ tests).
- [ ] Theo template; thêm: `subMerchantId` trong body/query phải thuộc phạm vi session (kiểm bằng danh sách sub-merchant của session hoặc `subMerchantIds`), khác → 403.

### Task 4: Query + trang Hybrid Terminal
**Files:** `terminal-queries.ts`, `src/app/(cms)/(merchant-management)/terminals/{page,loading}.tsx` (route mới) + mục menu `MANAGE_SUB_MERCHANT`.
- [ ] Theo template; filter: tên, trạng thái, sub-merchant (dùng `useSubMerchantOptions`).

### Task 5: UI Terminal
**Files:** `components/{TerminalsContainer,TerminalTable,TerminalFilters,TerminalFormModal,TerminalDetailModal}.tsx`, `columns/TerminalColumn.tsx`; tái dùng `LockReasonDialog`/`statusBadge` của sub-merchants bằng cách chuyển sang `src/components/shared` **chỉ khi** thành consumer thứ hai thật.
- [ ] Test tích hợp container: thêm POS (địa chỉ bắt buộc) → POST đúng body; đổi loại hiện cảnh báo; khoá/mở khoá với lý do; CASCADE disabled; lỗi 409 trong modal.

### Task 6: Dọn dẹp Terminal
- [ ] `npm run check` sạch; không còn mock.

---

## Phần B — Nhật ký hệ thống

### Task 7: Schema + mapper Audit log
**Files:** `src/features/audit-logs/schemas.ts` (+ test), `utils/audit-mapper.ts` (+ test), `types.ts`.
**Interfaces — Produces:** `auditLogSchema` (`oldData`/`newData` nullable string), `auditFilterSchema` (`occurredFrom ≤ occurredTo`), `parseAuditPayload(raw): { ok: true; value: unknown } | { ok: false; raw: string }`, `redactAuditPayload(value)`, `diffAuditPayload(oldValue, newValue)` → danh sách `{ path, before, after }`, `actionLabel(action)` (nhãn tiếng Việt, mặc định dùng mã gốc cho action lạ).
- [ ] Test (fail trước): JSON hỏng trả `ok:false` với chuỗi thô; redact che `password`, `otp`, `token`, số tài khoản dài (chỉ 4 số cuối) ở mọi độ sâu và trong mảng; diff liệt kê trường thêm/xoá/đổi; `actionLabel('UNKNOWN_ACTION')` không throw; filter ngược thời gian bị từ chối.

### Task 8: Service Audit log (msw)
**Interfaces — Produces:** `listAuditLogs(filter)` (query gồm các trường `AuditLogSearchRequest`, `page,size`, ngày dạng ISO local `yyyy-MM-ddTHH:mm:ss` đúng định dạng `LocalDateTime` của BE), `getAuditLog(id)`.
- [ ] Test msw: ngày gửi đúng định dạng `LocalDateTime` (không có `Z`); `Page` rỗng; 403 giữ nguyên.

### Task 9: Route handler Audit log
**Files:** `src/app/api/v1/admin/audit-logs/**`, `require-audit-access.ts` (+ tests).
- [ ] Theo template; yêu cầu `VIEW_AUDIT_LOG` (thiếu → 403, không gọi service); **áp dụng `redactAuditPayload` ở server trước khi trả cho browser** (dữ liệu thô không bao giờ xuống client); test khẳng định response không chứa giá trị `password`.

### Task 10: Query + trang Hybrid Audit log
**Files:** `audit-log-queries.ts`, `src/app/(cms)/audit-logs/{page,loading}.tsx` (route mới) + menu `VIEW_AUDIT_LOG`.
- [ ] Theo template; filter trong URL (actor, action, entityName, entityId, từ/đến); mặc định 7 ngày gần nhất.

### Task 11: UI Audit log
**Files:** `components/{AuditLogsContainer,AuditLogTable,AuditLogFilters,AuditLogDetailModal,AuditDiffView}.tsx`, `columns/AuditLogColumn.tsx`.
- [ ] Test tích hợp: lọc theo thời gian cập nhật URL và gọi đúng query; mở chi tiết hiển thị diff đã che; payload không phải JSON hiện chuỗi thô trong khối code; không có nút ghi nào.

### Task 12: Dọn dẹp + nghiệm thu
- [ ] `npm run check` sạch; báo cáo trung thực, kèm điều kiện bảo mật phạm vi audit log cần BE xác nhận.

## Self-Review

- Spec mục 6: Terminal (3.24–3.29) Task 1–6; Audit log Task 7–12. Xuất tệp không làm (ghi rõ).
- Bảo mật: payload audit được che ở server; phạm vi audit log là yêu cầu BE (điều kiện 2).
- Chia sẻ code chỉ khi có consumer thứ hai thật (Task 1, 5) theo `STRUCTURE.md`.
