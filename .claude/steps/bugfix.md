# Step: Bugfix

## Đọc trước

- [Bối cảnh dự án](../project-context/CONTEXT.md)
- [Coding rules](../rules/RULE.md)
- [Testing rules](../rules/TESTING.md)
- Workflow hoặc pattern liên quan tới khu vực bị lỗi.

## Checklist

1. Đọc đầy đủ error, stack trace và import trace.
2. Reproduce ổn định và ghi command/kết quả hiện tại.
3. Kiểm tra diff gần đây, call chain và working example tương tự.
4. Nêu một giả thuyết root cause dựa trên bằng chứng.
5. Viết regression test thất bại ở level nhỏ nhất chứng minh đúng nguyên nhân đó.
6. Sửa nhỏ nhất tại nguồn gây lỗi; không gộp refactor ngoài phạm vi.
7. Chạy regression test, suite liên quan, typecheck và lint.
8. Báo root cause, thay đổi và kết quả xác minh thật.

Chỉ điều tra performance/cache khi bằng chứng chỉ tới đó. Không thêm abstraction, cache layer hoặc optimization như một bugfix chưa được chứng minh.

Nếu bug chạm shared UI, đọc [quy tắc Basuicn](../rules/BASUICN.md) và [playbook UI](../patterns/ui-components.md); không dùng bugfix để ghi đè component bằng `update` hoặc `--force`.
