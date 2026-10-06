# Module Template (Đợt 2–3)

> Dùng chung cho các plan `2026-10-05-*.md`. Mỗi plan module chỉ nêu phần khác biệt; mọi thứ còn lại theo tài liệu này. Executor đọc **cả hai**. Mẫu đã chạy thật ở `2026-10-02-sub-merchant-module.md` (module Sub-merchant), xem code tại `src/features/sub-merchants`, `src/server/modules/sub-merchants`, `src/app/api/v1/admin/sub-merchants`.

**Spec:** `docs/superpowers/specs/2026-10-02-flexpay-be-integration-design.md`.

## Quy tắc bắt buộc (từ `.claude/`)

- Đọc trước: `.claude/project-context/CONTEXT.md`, `rules/{RULE,STRUCTURE,TESTING,NEXTJS-PERFORMANCE,BASUICN}.md`, `DESIGN.md`, `patterns/{hybrid-query,page-loading}.md`, `steps/new-feature.md`; docs Next.js 16 trong `node_modules/next/dist/docs/` trước khi dùng API framework.
- TypeScript strict, không `any`/`@ts-ignore`/eslint-disable. Component ≤ 200 dòng, function ≤ 50 dòng. **Mỗi câu lệnh/JSX trên dòng riêng, dễ đọc; cấm nhồi cả component trên vài dòng.**
- Code/identifier tiếng Anh; chuỗi hiển thị cho người dùng tiếng Việt.
- Test hành vi theo `TESTING.md`: không assert class Tailwind, không snapshot, không khoá copy mô tả. TDD: test thất bại trước, xác nhận fail đúng lý do.
- UI: dùng `src/components/ui` (Basuicn); thiếu component thì dừng và báo theo mẫu trong `BASUICN.md`. Nút chính teal solid; thao tác trên dòng là icon button + tooltip + `aria-label`; form nhỏ/chi tiết/xác nhận là modal (không thêm route); filter một hàng, nút Tìm kiếm/Xoá lọc hàng riêng căn phải, filter và bảng là hai card; bố cục đối xứng.
- Không chạy `next dev/build/start`; không commit; không đụng `.env*` (chỉ `.env.example` khi plan yêu cầu).

## Hợp đồng BE đã xác minh (đừng đoán lại)

- Envelope `RestApiResponse<T>`; `Page<T>` có `content,totalElements,totalPages,number,size`. BE **bỏ `data` khi null**.
- Phân trang: FE gửi `page` **1-based** (BE tự trừ 1), `size` 1..100.
- Lombok `@Data` với `private boolean isX` serialise thành khoá **`x`** (ví dụ `isDefault` → `default`) trong DTO dạng class; DTO dạng `record` giữ `isX`. Schema Zod nhận cả hai rồi quy về một tên.
- Chuỗi bảo mật BE: `/api/v1/merchant/**` chỉ nhận JWT realm `ewallet-merchant` (`azp=ewallet-merchant-portal`, role `MERCHANT_USER`); `/api/v1/admin/**` chỉ nhận JWT realm admin và bị từ chối 401 với token merchant. **Hiện chuỗi merchant mới có `GET /me` và `GET /sub-merchants`.** Mọi module trong plan này gọi tạm đường dẫn `/admin` làm hợp đồng giả định; chạy thật chỉ được khi BE thêm endpoint `/merchant/**` tương ứng. Mỗi module gom đường dẫn BE vào **một file** `<module>.paths.ts` để đổi một chỗ.
- Khi BE trả 401 cho endpoint nghiệp vụ, **không đăng xuất người dùng** vì lỗi quyền chuỗi: route trả lỗi, UI hiện thông báo trong modal/trang.
- `toHttpStatus` không bao giờ trả 2xx cho lỗi; lỗi `INVALID_RESPONSE` thành 502.
- Người dùng cuối là quản trị phía merchant: **chỉ tạo yêu cầu và theo dõi trạng thái**; không có màn duyệt/từ chối. Trạng thái maker-checker hiển thị chỉ đọc: `Chờ duyệt / Đã duyệt / Từ chối kèm lý do`.

## Chu trình cho mỗi module (6 task)

1. **Schema + mapper (thuần).** Đọc DTO Java được liệt kê trong plan module (đường dẫn gốc `/home/huytq/code/beam/be/flexpay/flex.merchant/src/main/java/com/flexpay/merchant/application/dto/`), viết Zod cho response và form, mapper form → request body, và các hàm quyền/trạng thái (`canX`). Test trước: parse mẫu hợp lệ, enum lạ bị từ chối, field nullable, form invalid, mapper không gửi chuỗi rỗng đè giá trị cũ, trường chỉ đọc không nằm trong body update.
2. **Service (msw).** `src/server/modules/<x>/<x>.service.ts` + `<x>.paths.ts`, mỗi hàm trả `BeResult`. Test msw: query/body đúng, `Page` → `{ rows, total }`, `Page` rỗng, 403 giữ nguyên, response sai schema → `INVALID_RESPONSE`.
3. **Route Handler.** `src/app/api/v1/admin/<x>/**/route.ts` + `require-<x>-access.ts`: 401 khi chưa đăng nhập, 403 thiếu permission (service **không** được gọi), Zod cho query/body (`pageSize ≤ 100`), `merchantId` luôn lấy từ session (`merchantIds`, nhiều Master thì phải thuộc `merchantIds`), thao tác theo `id` phải tải detail và kiểm sở hữu (không thuộc → 404, không gọi BE ghi), lỗi BE giữ status qua `toHttpStatus`.
4. **Query + trang Hybrid.** `<x>-queries.ts` (`queryOptions`, `parse<X>SearchParams`, filter/phân trang trong URL và query key), `page.tsx` Server Component (`prefetchDehydrated` + `unwrapOrRedirect` + `HydrationBoundary`), `loading.tsx` có skeleton khớp, mutation hook invalidate đúng key nhỏ nhất. Container client dùng **component thật của Task 5**, đủ 4 trạng thái loading/error/empty/data.
5. **UI.** Bảng (`columns/`), filter, các modal (xem, thêm/sửa, xác nhận có lý do 10–500 ký tự khi BE yêu cầu), toast tiếng Việt, lỗi BE hiện trong modal và modal không đóng. Test tích hợp trên **container** với msw: mở modal, submit, gọi đúng endpoint, đóng modal; trạng thái không được phép thì nút ẩn/disabled có tooltip.
6. **Dọn dẹp + nghiệm thu.** Xoá mock/Prisma/route cũ của module, sửa breadcrumb/route constants, `npm run check` (test + typecheck + lint) sạch, báo cáo trung thực những gì chưa làm.

## Tiêu chí nghiệm thu chung (controller kiểm độc lập)

- Chạy lại `npm run check`; đọc lại container và các component để chắc chúng **thật sự được nối** (không phải bản tạm HTML thô, không chữ tiếng Anh trong UI).
- Mọi component ≤ 200 dòng, không dòng JSX dài bất thường; không file mock/Prisma còn sót cho module.
- Agent báo "xong" không thay cho bằng chứng: kết quả lệnh thật và danh sách file thật.
