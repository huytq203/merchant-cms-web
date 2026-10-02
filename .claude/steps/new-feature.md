# Step: Feature mới

## Đọc trước

- [Bối cảnh dự án](../project-context/CONTEXT.md)
- [Coding rules](../rules/RULE.md)
- [Structure rules](../rules/STRUCTURE.md)
- [Testing rules](../rules/TESTING.md)
- [Next.js performance](../rules/NEXTJS-PERFORMANCE.md)
- [Frontend workflow](../workflows/frontend.md)
- Với Next.js: [Next.js workflow](../workflows/nextjs.md) và tài liệu liên quan trong `node_modules/next/dist/docs/`
- Nếu có UI: [design system](../DESIGN.md), [quy tắc Basuicn](../rules/BASUICN.md) và [playbook UI](../patterns/ui-components.md)

## Checklist

1. Hoàn tất Brainstorming và lệnh Impeccable phù hợp; xác định mục tiêu, actor, flow, states, phạm vi và tiêu chí hoàn thành.
2. Đọc feature tương tự và các boundary hiện có trước khi chọn cấu trúc.
3. Áp dụng domain structure; table config đặt trong `columns/`, logic điều phối đặt trong hooks.
4. Chọn Server-only, Client-only hoặc Hybrid; ghi freshness, cache và invalidation owner.
5. Liệt kê loading, error, empty và data states; mọi route page có `loading.tsx` với skeleton khớp layout.
6. Nếu có UI, kiểm tra local rồi Basuicn registry trước khi viết component.
7. Chọn Server/Client boundary nhỏ nhất và tránh duplicate API calls/waterfalls.
8. Viết failing behavior test theo risk trước khi triển khai.
9. Kiểm tra overengineering: triển khai tối thiểu; không tạo abstraction, cache layer hoặc optimization khi chưa có bằng chứng.
10. Chạy test liên quan, typecheck, lint và build khi phù hợp.
11. Báo file thay đổi, quyết định thiết kế và kết quả kiểm tra thật.
