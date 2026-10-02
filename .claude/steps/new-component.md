# Step: Component mới

## Đọc trước

- [Bối cảnh dự án](../project-context/CONTEXT.md)
- [Coding rules](../rules/RULE.md)
- [Structure rules](../rules/STRUCTURE.md)
- [Testing rules](../rules/TESTING.md)
- [Design system](../DESIGN.md)
- [Quy tắc Basuicn](../rules/BASUICN.md)
- [Playbook UI component](../patterns/ui-components.md)

## Checklist

1. Hoàn tất Brainstorming và Impeccable decision tương xứng; mô tả behavior, states, props, accessibility và responsive behavior.
2. Kiểm tra `src/components/ui/<name>/`.
3. Nếu chưa có local, chạy `npx basuicn list`.
4. Nếu có trong registry, cài bằng `npx basuicn add <name>` và review diff.
5. Nếu không có trong registry, **dừng** phần UI và báo người dùng theo mẫu trong `../rules/BASUICN.md`; trình bày phương án và khuyến nghị, không tự tạo primitive thay thế.
6. Compose component tại feature theo structure rule; chỉ sửa shared primitive khi task yêu cầu và đã đánh giá consumer.
7. Viết test UI behavior/a11y bằng semantic queries như `getByRole`; không khóa presentation text hoặc lạm dụng `data-testid`.
8. Nếu component có data, test loading, error, empty và data; nếu làm page fallback, skeleton phải giữ đúng structure.
9. Chạy `npx basuicn doctor`, test liên quan, typecheck và lint.
