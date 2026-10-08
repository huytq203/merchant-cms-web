# Quy tắc testing

Test xác minh behavior và contract; không khóa implementation hoặc presentation copy ngoài chủ đích.

## Vị trí file test

- Test nằm trong thư mục `test/` đặt ngay cạnh thư mục nguồn nó kiểm, không đặt `*.test.ts(x)` rải cạnh từng file nguồn.
- Một scope (một thư mục nguồn) có đúng một thư mục `test/`; không lồng thêm thư mục con trừ khi scope quá lớn.
- Tên file test giữ theo file nguồn: `src/lib/be/errors.ts` → `src/lib/be/test/errors.test.ts`; `src/features/users/components/UserDialogs.tsx` → `src/features/users/components/test/UserDialogs.test.tsx`; `src/app/api/v1/admin/terminals/route.ts` → `src/app/api/v1/admin/terminals/test/route.test.ts`.
- Test import nguồn bằng đường dẫn tương đối lên một cấp (`../errors`) hoặc alias `@/`; mock cũng dùng cùng đường dẫn đó.
- Helper, fixture và `setup.ts` dùng chung đặt ở `src/test/`; fixture chỉ một scope dùng đặt trong `test/` của scope đó.
- Next.js chỉ coi `page`, `route`, `layout`... là file đặc biệt, nên `test/` trong `src/app` không tạo route; xác nhận bằng `next build` sau khi di chuyển.
- Cấu hình `vitest` include `src/**/*.test.{ts,tsx}` đã bao phủ cả `test/`.

## Tài nguyên khi chạy test (bắt buộc cho mọi agent)

Máy dev chỉ có 8 nhân và đang chạy nhiều tiến trình nặng khác (dev server, trình duyệt, IDE). Chạy test không giới hạn làm tràn CPU, RAM và làm máy lag. Mọi agent và mọi lệnh chạy test phải giới hạn ở **tối đa 2 đến 3 nhân**:

- FE (Vitest): `taskset -c 0-2 nice -n 10 npx vitest run --maxWorkers=2 <đường dẫn>`. Cấu hình repo đã có `maxWorkers: 2`; không tăng. Ưu tiên chạy đúng file/thư mục liên quan, chỉ chạy cả bộ khi cần nghiệm thu.
- FE (`npm run check`, `npm run build`): bọc bằng `taskset -c 0-2 nice -n 10`.
- BE (Gradle): `taskset -c 0-2 nice -n 10 ./gradlew --offline --no-daemon --max-workers=2 -Dorg.gradle.jvmargs=-Xmx1g test ...`. Không để Gradle daemon chạy nền, không chạy nhiều lệnh Gradle song song.
- Không chạy hai bộ test (FE và BE) cùng lúc; tuần tự.
- Không bật watch mode (`vitest` không kèm `run`).

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

