# Thiết kế quy tắc kiến trúc frontend, Next.js và testing

## 1. Mục tiêu

Mở rộng hệ thống tài liệu `.claude/` để mọi AI agent xây frontend Merchant CMS theo cùng một kiến trúc: feature theo domain, table column configuration tách riêng, logic tách khỏi UI, Server Components và Hybrid TanStack Query được dùng đúng trường hợp, route có skeleton phù hợp, caching có chủ đích, test theo behavior và tránh overengineering.

Trước khi code feature/UI, agent phải làm rõ thiết kế bằng Brainstorming và áp dụng Impeccable ở mức tương xứng với task.

## 2. Phạm vi

### Trong phạm vi

- Thêm quy tắc cấu trúc feature và trách nhiệm file.
- Chuẩn hóa `columns/` cho TanStack Table column definitions.
- Chuẩn hóa việc tách state/orchestration logic thành hooks.
- Thêm quy tắc Server/Client/Hybrid rendering và data ownership.
- Thêm quy tắc API calls, Next.js cache, TanStack Query cache và invalidation.
- Bắt buộc `loading.tsx` và skeleton phù hợp với từng page.
- Thêm quy tắc testing logic, hook, UI behavior và accessibility.
- Cấm test copy/text trình bày trừ khi text là business contract.
- Bắt buộc Brainstorming và Impeccable trước task feature/UI, với ngoại lệ nhẹ cho task nhỏ.
- Cập nhật router, steps, workflows và agents để dẫn tới các rule mới.

### Ngoài phạm vi

- Không refactor source hiện tại theo cấu trúc mới trong task tài liệu này.
- Không bổ sung test runner hoặc dependency mới.
- Không bật `cacheComponents` hay thay đổi `next.config.ts`.
- Không tạo `PRODUCT.md` hoặc thay đổi visual direction hiện tại.
- Không chạy Basuicn mutation command.

## 3. Nguồn kỹ thuật

Rule Next.js phải dựa trên tài liệu local của phiên bản đang cài trong `node_modules/next/dist/docs/`, đặc biệt:

- Server and Client Components.
- Fetching Data.
- Caching và Revalidating.
- Streaming và `loading.tsx`.
- Prefetching.
- TanStack Query client-side data fetching và server-provided hydration.

Rule không được cố định API Next.js theo trí nhớ. Khi source nâng version, agent phải đọc lại docs local trước khi dùng API cache/revalidation.

Impeccable xác định sản phẩm này ở chế độ **Operate**: scanability, consistency, loading continuity, accessibility và tốc độ hoàn thành tác vụ quan trọng hơn hiệu ứng trang trí. `.claude/DESIGN.md` tiếp tục là visual authority.

## 4. Cấu trúc feature theo domain

```text
src/features/<feature>/
├── components/
│   ├── <Feature>Table.tsx
│   ├── <Feature>Filter.tsx
│   └── <Feature>Form.tsx
├── columns/
│   ├── <Feature>.columns.tsx
│   └── index.ts
├── hooks/
│   ├── use-<feature>-query.ts
│   ├── use-<feature>-mutations.ts
│   └── use-<feature>-filters.ts
├── schemas/
├── constants/
├── utils/
├── types.ts
└── index.ts
```

Route giữ phần thuộc Next.js:

```text
src/app/(cms)/<route>/
├── page.tsx
├── loading.tsx
├── error.tsx
└── _components/
```

`_components/` chỉ chứa component gắn chặt với route và không có giá trị tái sử dụng ở feature. `app/` không trở thành nơi chứa business logic.

## 5. Quy tắc trách nhiệm và tách file

- Component tối đa 200 dòng; function tối đa 50 dòng.
- Giới hạn dòng là tín hiệu thiết kế, không phải mục tiêu cơ học. Không tách file vô nghĩa chỉ để đạt số dòng.
- Mỗi file có một trách nhiệm có thể mô tả bằng một câu.
- JSX rendering nằm trong `components/`.
- State transitions, event orchestration, query/mutation coordination và reusable client behavior nằm trong `hooks/`.
- Pure transformations như map, sort, filter, normalize và format nằm trong `utils/`.
- Zod schemas nằm trong `schemas/`; static options/query defaults nằm trong `constants/`; shared domain types nằm trong `types.ts`.
- Không tạo `hooks/`, `utils/`, barrel hoặc abstraction khi feature chưa cần.
- Chỉ promote shared abstraction khi có ít nhất hai consumer thực tế.
- Không di chuyển API/service hiện có chỉ để làm cấu trúc nhìn đồng đều; refactor phải phục vụ task thực tế.

## 6. Quy tắc `columns/`

- Mọi table có column configuration không tầm thường phải đặt tại `src/features/<feature>/columns/`.
- Column file chỉ định nghĩa `ColumnDef`, header/cell composition, sorting/filtering metadata và table-specific presentation.
- Column configuration không fetch dữ liệu, không sở hữu modal state và không chứa mutation orchestration.
- Cell renderer nhỏ có thể đặt trong column file; cell có interaction hoặc JSX phức tạp phải tách sang `components/`.
- Columns nhận callback/permission/options qua typed factory khi cần; không đọc global mutable state trực tiếp.
- `columns/index.ts` chỉ export public column factories thực sự được dùng; không tạo barrel chỉ vì convention.

## 7. Server, Client và Hybrid Pattern

### Server-only

Dùng Server Component khi dữ liệu chỉ đọc, không cần browser cache/refetch và UI có thể render hoàn toàn từ server. Server Components là mặc định cho `page.tsx` và layout.

### Client-only query

Dùng client query khi dữ liệu chỉ xuất hiện sau tương tác, ví dụ autocomplete, dependent field hoặc modal lazy-loaded. Initial page không bị chặn bởi dữ liệu này.

### Hybrid

Hybrid là pattern mặc định khi initial view cần dữ liệu và client phải tiếp tục quản lý refetch, filter, pagination, mutation hoặc synchronization:

```text
Server Component
  → create request-scoped QueryClient
  → prefetchQuery
  → dehydrate
  → HydrationBoundary
  → Client Component dùng cùng query contract
  → TanStack Query tiếp quản browser cache/refetch/mutation
```

Bắt buộc:

- Server và client dùng cùng query-key factory và `queryOptions` contract.
- Browser dùng một QueryClient ổn định; mỗi server render/request dùng QueryClient riêng.
- `staleTime` phải ngăn refetch tức thì sau hydration, với giá trị dựa trên freshness thực tế.
- Filter, sort và pagination ảnh hưởng dữ liệu phải nằm trong URL và query key.
- Không dùng đồng thời `initialData` thủ công và `HydrationBoundary` cho cùng query.
- Không hydrate dữ liệu nhạy cảm hoặc dataset lớn không cần cho viewport đầu tiên.
- Props từ Server sang Client nhỏ và serializable.
- Không fetch lại cùng dữ liệu ở page, hook và component con khi có thể dùng một data owner.

## 8. API calls và cache

Mỗi read phải được phân loại:

- Public, ít thay đổi: cache và time-based revalidation.
- Public/domain-invalidated: cache tag kết hợp invalidation theo domain.
- Private hoặc theo user/quyền: không shared-cache; auth và authorization ở server boundary.
- Realtime hoặc cần fresh tuyệt đối: uncached và đặt sau Suspense boundary khi ảnh hưởng initial render.

Quy tắc:

- Các request độc lập khởi chạy song song; request phụ thuộc mới tuần tự.
- Không tạo Route Handler proxy chỉ để Server Component gọi code server nội bộ.
- Query key ổn định và chứa đầy đủ input ảnh hưởng response.
- Mutation invalidate/update browser cache ở phạm vi nhỏ nhất.
- Nếu server data được cache, mutation đồng thời invalidates tag/path tương ứng theo API Next.js local.
- Browser `staleTime` và server cache lifetime là hai lớp độc lập; không giả định chúng phải bằng nhau.
- Không cache dữ liệu private bằng shared cache directive.
- Không thêm cache layer nếu chưa xác định freshness, owner và invalidation.

## 9. Loading, streaming và skeleton

Mỗi route có `page.tsx` phải có `loading.tsx`.

- `loading.tsx` dùng skeleton phản ánh layout thật, không chỉ spinner hoặc text “Loading”.
- Table skeleton giữ toolbar, column widths, row heights và pagination footprint.
- Form skeleton giữ label, control và action layout.
- Detail skeleton giữ header và content sections.
- Skeleton ưu tiên Server Component, nhẹ, không fetch và không effect.
- Các vùng async độc lập có thể dùng Suspense boundary riêng để stream.
- Chỉ tách Suspense khi vùng có thời gian tải hoặc giá trị hiển thị độc lập; không chia nhỏ máy móc.
- Runtime/uncached access trong layout phải được chuyển xuống page hoặc bọc Suspense phù hợp để không chặn route-level loading.
- Fallback và content phải có kích thước gần nhau để tránh layout shift.
- `error.tsx` hoặc error boundary được thêm khi route cần recovery riêng; loading/error/empty/data states vẫn phải rõ ở component dữ liệu.

## 10. Navigation và page-load performance

- Dùng `next/link`, `next/image`, `next/font` và Metadata APIs khi phù hợp.
- Giữ Link prefetch mặc định; chỉ tắt/defer khi có bằng chứng request thừa, ví dụ table rất nhiều links.
- Dynamic import chỉ cho client component nặng và không thiết yếu ban đầu.
- Giữ `'use client'` ở lá nhỏ nhất để giảm bundle/hydration.
- Tránh request waterfall trước khi thêm caching hoặc abstraction.
- Không thêm memoization, virtualization, debounce hoặc prefetch strategy tùy chỉnh nếu chưa có nhu cầu hoặc đo đạc.
- Optimization phải nêu bottleneck, capability Next.js sẵn có, cách đơn giản nhất, invalidation/security và bằng chứng.

## 11. Testing strategy

### Logic thuần

- Test schema, parser, formatter, mapper, filter, pagination và permission logic.
- Bao phủ happy path, boundary, empty input và invalid input.
- Không render React để test pure function.

### Hooks

- Test state transition, query parameters, callback, success/error và cleanup.
- Mock tại system boundary như HTTP, timer hoặc browser API.
- Không mock implementation nội bộ của hook.

### UI

- Test behavior người dùng: click, input, select, submit, keyboard và focus.
- Query ưu tiên `getByRole`, accessible name, label và semantic state.
- Assert `disabled`, `checked`, `expanded`, `selected`, dialog visibility, callback và navigation outcome.
- Test loading, error, empty và data states.
- Page/route quan trọng có assertion rằng skeleton giữ đúng structure cần thiết.

### Text và selector

Không assert heading/copy trang trí, placeholder dễ thay đổi, toàn bộ snapshot HTML, Tailwind class chi tiết hoặc internal state.

Text chỉ được assert khi là contract: validation, security warning, required error, user-visible data value hoặc i18n contract. Không thay text assertion bằng `data-testid` máy móc; chỉ dùng test id khi không có semantic selector ổn định.

### Mức test

- Nhiều unit tests cho logic có nhánh/rủi ro.
- Component tests cho interaction và accessibility quan trọng.
- Integration tests cho Server → HydrationBoundary → TanStack Query ở critical flows.
- E2E chỉ cho critical journeys, không lặp lại toàn bộ lower-level tests.
- Bugfix luôn có regression test thất bại trước khi sửa.
- Không theo đuổi coverage 100% máy móc; coverage theo risk và behavior.

## 12. Brainstorming và Impeccable gate

Trước feature/UI task:

1. Brainstorm mục tiêu, actor, flow, states, boundary và acceptance criteria.
2. Dùng Impeccable theo mục tiêu:
   - `shape` cho flow/surface mới.
   - `audit` hoặc `critique` cho UI hiện có.
   - `optimize` cho UI performance.
3. Kiểm tra Basuicn.
4. Chọn Server/Client/Hybrid pattern.
5. Chốt loading skeleton, error và empty states.
6. Viết failing test.
7. Mới implementation.

Quy trình nhẹ được phép cho typo, copy đơn giản, refactor không đổi behavior hoặc bugfix nhỏ có reproduction/expected behavior rõ. Agent vẫn phải ghi mục tiêu, phạm vi và verification, nhưng không tạo spec/abstraction không cần thiết.

## 13. Tài liệu sẽ thay đổi

### Tạo mới

- `.claude/rules/STRUCTURE.md`
- `.claude/rules/TESTING.md`
- `.claude/rules/NEXTJS-PERFORMANCE.md`
- `.claude/patterns/hybrid-query.md`
- `.claude/patterns/page-loading.md`

### Cập nhật

- `.claude/CLAUDE.md`: thêm canonical links và mandatory gates.
- `.claude/rules/RULE.md`: giữ core constraints, dẫn tới rule chuyên biệt.
- `.claude/workflows/nextjs.md`: trỏ tới performance/hybrid/loading patterns.
- `.claude/workflows/frontend.md`: thêm Impeccable Operate gate và skeleton continuity.
- `.claude/steps/new-feature.md`: bắt buộc structure, data-pattern, skeleton và testing decisions.
- `.claude/steps/new-component.md`: bắt buộc UI behavior/a11y tests.
- `.claude/steps/add-api-query.md`: chọn Server/Client/Hybrid và cache ownership.
- `.claude/steps/bugfix.md`: chọn regression level phù hợp.
- `.claude/agents/frontend-builder.md`: enforce structure/testing/performance gates.
- `.claude/agents/ui-implementer.md`: enforce Impeccable, skeleton và UI behavior tests.
- `.claude/agents/code-reviewer.md`: review structure, hydration/cache, skeleton và test quality.
- `.claude/agents/codex-implementer.md`: truyền các rule mới vào delegated prompts.

## 14. Verification

- Mọi canonical Markdown link tồn tại.
- Router dẫn tới ba rule và hai pattern mới.
- Cả bốn steps đọc đúng rule liên quan.
- `new-feature` và `add-api-query` buộc chọn Server/Client/Hybrid.
- Rule structure có `columns/`, hooks, 200/50 lines và anti-overengineering.
- Rule testing có logic/hooks/UI/a11y, không test presentation text và ngoại lệ contract text.
- Rule performance có route `loading.tsx`, skeleton, cache classification, parallel requests và no-double-fetch.
- Các UI-capable agents yêu cầu Brainstorming + Impeccable trước implementation.
- Không còn rule cũ mâu thuẫn với Hybrid hoặc cấu trúc domain.
- Chạy Markdown graph validation, stale-reference scan và `git diff --check`.

## 15. Tiêu chí hoàn thành

- Agent biết đặt table columns, hooks, schemas, utils và components ở đâu.
- Agent chọn đúng Server-only, Client-only hoặc Hybrid pattern.
- Không xảy ra immediate refetch sau hydration do thiếu `staleTime` hoặc query-key mismatch.
- Mọi route page có loading skeleton tương ứng.
- Cache được lựa chọn theo freshness và security, có invalidation owner rõ ràng.
- Tests kiểm tra behavior/semantics thay vì copy trình bày hoặc implementation details.
- Brainstorming, Impeccable và Basuicn được áp dụng trước code ở mức tương xứng.
- Rules ngăn cả monolith component lẫn abstraction quá sớm.
