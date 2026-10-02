# Quy tắc testing

Test xác minh behavior và contract; không khóa implementation hoặc presentation copy ngoài chủ đích.

## Logic thuần

- Test schema, parser, formatter, mapper, filter, pagination và permission logic.
- Bao phủ happy path, boundary, empty input và invalid input theo rủi ro.
- Không render React để test pure function.

## Hooks

- Test state transitions, query parameters, callbacks, mutation success/error và cleanup.
- Mock tại system boundary như HTTP, timer hoặc browser API.
- Không mock implementation nội bộ của hook.
- Query/mutation hooks phải test query key, enabled condition và invalidation/update behavior quan trọng.

## UI behavior và accessibility

- Test hành vi người dùng: click, input, select, submit, keyboard và focus.
- Query ưu tiên `getByRole`, accessible name, label và semantic state.
- Assert behavior như `disabled`, `checked`, `expanded`, `selected`, dialog visibility, callback hoặc navigation outcome.
- Component dữ liệu phải test loading, error, empty và data states.
- Test skeleton theo structure quan trọng của page, không theo class trang trí.

## Text và selectors

Không assert presentation text hoặc implementation detail:

- Heading/copy mô tả có thể thay đổi.
- Placeholder không phải contract.
- Snapshot toàn bộ HTML/component.
- Exact Tailwind classes, internal state hoặc tên function nội bộ.

Chỉ assert text khi chính text là contract: validation message, security warning, required error, user-visible data value hoặc i18n contract.

Không thay text assertion bằng `data-testid` máy móc. Chỉ dùng test id khi không có semantic selector ổn định; ghi rõ lý do trong test.

## Integration và E2E

- Integration test cho Server → `HydrationBoundary` → TanStack Query ở critical flows.
- E2E chỉ cho critical journeys; không lặp lại toàn bộ unit/component tests.
- Không theo đuổi coverage 100% máy móc; coverage theo risk và behavior.

## TDD và verification

- Feature và bugfix viết failing test mô tả behavior trước implementation.
- Xác nhận test fail vì behavior còn thiếu, không phải typo hoặc setup lỗi.
- Chạy test liên quan sau thay đổi, rồi suite phù hợp, typecheck và lint.
- Báo kết quả thật và phân biệt lỗi có sẵn không liên quan.

