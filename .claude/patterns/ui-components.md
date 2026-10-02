# Playbook UI component với Basuicn

## Nguồn và yêu cầu

Nguồn chính thức: <https://github.com/huytq203/core-basuicn>. Theo tài liệu hiện hành, CLI yêu cầu:

- Node.js 18+.
- React 18+/19+.
- Vite hoặc Next.js.
- Tailwind CSS v4.

Luôn tuân theo [quy tắc Basuicn bắt buộc](../rules/BASUICN.md).

## 1. Xác định trạng thái dự án

Kiểm tra trước khi chạy CLI:

- `package.json` và các runtime package liên quan.
- `src/components/ui/`.
- `src/lib/utils/cn.ts`.
- `src/lib/theme/ThemeProvider.tsx` và theme files.
- Stylesheet Tailwind cùng import tại app entry/layout.
- Path aliases trong TypeScript và framework config.

## 2. Dự án chưa khởi tạo Basuicn

Chỉ coi là chưa khởi tạo khi các core files/config ở trên thực sự thiếu. Báo người dùng các file và package CLI dự kiến thay đổi, rồi xin xác nhận trước khi chạy:

```bash
npx basuicn init
npx basuicn doctor
```

Không tự chạy lại `init` trên dự án đã cấu hình.

## 3. Dự án đã có Basuicn

Kiểm tra component local trước. Nếu thiếu, dùng đúng thứ tự:

```bash
npx basuicn list
npx basuicn add <component>
npx basuicn doctor
npm run typecheck
npm run lint
```

CLI copy component vào `src/components/ui/<name>/` và có thể kéo theo package/component phụ thuộc. Luôn review diff sau khi chạy.

## 4. Component đã có local

Đọc API và tái sử dụng source hiện tại. Khi cần so sánh với registry:

```bash
npx basuicn diff <component>
```

Local source có thể đã được tùy chỉnh; không mặc định registry mới hơn là đúng hơn.

## 5. Registry không có component phù hợp

Dừng phần UI. Dùng nguyên mẫu “Basuicn thiếu component” trong [quy tắc Basuicn](../rules/BASUICN.md), nêu component đã kiểm tra, ba phương án và một khuyến nghị. Chờ người dùng quyết định trước khi tạo primitive hoặc cài library khác.

## 6. Thao tác có thể phá hủy local source

Các lệnh sau cần xác nhận rõ mục tiêu:

```bash
npx basuicn update <component>
npx basuicn remove <component>
npx basuicn add <component> --force
```

Trước khi chạy, dùng `diff`, xác định consumer và bảo đảm thay đổi local có thể phục hồi.

## 7. Lưu ý Next.js

CLI tự nhận diện App Router hoặc Pages Router và có thể patch layout/config. Vẫn phải review từng diff và đọc tài liệu phù hợp trong `node_modules/next/dist/docs/`; không suy đoán convention Next.js.

## 8. Báo cáo kết quả

Nêu rõ:

- Component đã kiểm tra hoặc cài.
- Files, dependencies và component phụ thuộc do CLI tạo/thay đổi.
- Kết quả `doctor`, typecheck và lint.
- Lỗi có sẵn không liên quan, nếu có.
