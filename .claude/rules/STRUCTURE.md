# Quy tắc cấu trúc frontend

## Cấu trúc feature theo domain

```text
src/features/<feature>/
├── components/              # UI riêng của feature
├── columns/                 # TanStack Table column configuration
├── hooks/                   # State, events, query/mutation orchestration
├── schemas/                 # Zod schemas
├── constants/               # Static options và defaults
├── utils/                   # Pure transformations
├── types.ts                 # Shared domain types
└── index.ts                 # Public API thực sự cần thiết
```

Route chỉ giữ phần thuộc Next.js:

```text
src/app/(cms)/<route>/
├── page.tsx                 # Server Component và composition
├── loading.tsx              # Skeleton khớp layout thật
├── error.tsx                # Route recovery khi cần
└── _components/             # Chỉ UI gắn chặt với route
```

Không đặt business logic trong `app/`. Chỉ dùng `_components/` khi component không có giá trị tái sử dụng trong feature.

## Giới hạn và trách nhiệm

- Component không quá 200 dòng; function không quá 50 dòng.
- Giới hạn dòng là tín hiệu cần xem lại trách nhiệm, không phải lý do tách file vô nghĩa.
- Mỗi file có một trách nhiệm mô tả được bằng một câu.
- JSX rendering đặt trong `components/`.
- State transition, event handler có logic, query/mutation coordination và reusable client behavior đặt trong `hooks/`.
- Pure map, sort, filter, normalize và format đặt trong `utils/`.
- Zod schema đặt trong `schemas/`; static options và defaults đặt trong `constants/`.
- Logic chỉ dùng một lần và còn đơn giản có thể colocate; không tách hook/helper máy móc.

## Quy tắc `columns/`

- Table có column configuration không tầm thường phải đặt trong `src/features/<feature>/columns/`.
- Column file chỉ chứa `ColumnDef`, header/cell composition, sorting/filtering metadata và table-specific presentation.
- Column configuration không fetch dữ liệu, không sở hữu modal state và không điều phối mutation.
- Cell renderer nhỏ có thể ở column file; cell có interaction hoặc JSX phức tạp phải tách sang `components/`.
- Column factory nhận typed callbacks, permissions và options qua tham số; không đọc mutable global state trực tiếp.
- Chỉ tạo `columns/index.ts` khi cần public export; không tạo barrel chỉ vì convention.

## Chống overengineering

- Không tạo folder rỗng, wrapper một dòng hoặc abstraction chưa có nhu cầu.
- Không tạo shared abstraction trước khi có ít nhất hai consumer thực tế.
- Không di chuyển API/service hiện có chỉ để làm cấu trúc đối xứng.
- Không tách file nếu việc tách làm luồng đọc khó hơn mà không tạo boundary rõ ràng.
- Ưu tiên solution nhỏ nhất đáp ứng behavior, testability và khả năng bảo trì hiện tại.

