# Quy tắc Basuicn bắt buộc

## Nguồn chính thức

- Repository: <https://github.com/huytq203/core-basuicn>
- README: <https://github.com/huytq203/core-basuicn/blob/main/README.md>
- CLI: <https://github.com/huytq203/core-basuicn/blob/main/README_CLI.md>
- Registry: <https://github.com/huytq203/core-basuicn/blob/main/registry.json>

Basuicn là nguồn UI component bắt buộc đầu tiên của dự án. Không tự ý thay bằng shadcn/ui hoặc UI library khác.

## Quy trình bắt buộc

1. Xác định component và khả năng UI cần dùng.
2. Kiểm tra `src/components/ui/<name>/`.
3. Nếu chưa có local, chạy `npx basuicn list` để kiểm tra registry hiện hành.
4. Nếu registry có component, chạy `npx basuicn add <name>`.
5. Kiểm tra toàn bộ diff do CLI tạo ra, bao gồm dependency và component phụ thuộc.
6. Chạy `npx basuicn doctor`, `npm run typecheck` và `npm run lint`.
7. Import và compose component đã cài trong feature; không sao chép primitive vào feature.

## Không được tự ý

- Không viết lại primitive đã có trong Basuicn.
- Không cài UI library khác để thay thế.
- Không chạy `npx basuicn init` trên dự án đã cấu hình khi chưa có xác nhận.
- Không chạy `update`, `remove` hoặc dùng `--force` khi chưa có xác nhận; các thao tác này có thể ghi đè hoặc xóa source local.
- Không sửa shared component chỉ để vá riêng một feature mà chưa đánh giá consumer.

## Khi registry không có component

Dừng trước khi viết UI thay thế và báo người dùng theo mẫu:

```md
## Basuicn thiếu component

- Nhu cầu UI: <mô tả ngắn>
- Component đã kiểm tra: <tên hoặc nhóm component>
- Kết quả: không có component phù hợp trong Basuicn
- Phương án:
  1. Compose từ các primitive Basuicn hiện có.
  2. Tạo component mới trong dự án.
  3. Bổ sung component vào core-basuicn trước rồi cài qua CLI.
- Khuyến nghị: <một phương án và lý do>

Vui lòng chọn phương án trước khi agent tiếp tục phần UI.
```

Agent có thể tiếp tục phần không phụ thuộc quyết định UI nếu việc đó không tạo code tạm và không mặc định trước một phương án UI.

