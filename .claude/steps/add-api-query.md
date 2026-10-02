# Step: API hoặc query hook

## Đọc trước

- [Bối cảnh dự án](../project-context/CONTEXT.md)
- [Coding rules](../rules/RULE.md)
- [Testing rules](../rules/TESTING.md)
- [Next.js performance](../rules/NEXTJS-PERFORMANCE.md)
- [Hybrid Query pattern](../patterns/hybrid-query.md)
- [Next.js workflow](../workflows/nextjs.md)

## Checklist

1. Tìm service, query hook, query-key factory và schema tương tự đang dùng trong repo.
2. Xác định trust boundary, authentication/authorization và Zod validation.
3. Định nghĩa typed input, success result và error result; không leak raw error.
4. Chọn rõ Server-only, Client-only hoặc Hybrid; Hybrid dùng cùng query key/options và `staleTime` có chủ đích.
5. Đưa filter, sort và pagination vào URL cùng query key; không fetch bằng `useEffect`.
6. Phân loại public/private/freshness; private data không dùng shared cache.
7. Khởi chạy request độc lập song song; giữ tuần tự chỉ khi có dependency.
8. Với mutation, update/invalidate browser cache và server tag/path ở phạm vi nhỏ nhất.
9. Consumer UI phải xử lý loading, error, empty và data states.
10. Viết failing contract test; critical Hybrid flow có integration test hydration → client ownership.

Nếu task phát sinh UI mới, chuyển sang [component step](new-component.md) trước khi quyết định component.
