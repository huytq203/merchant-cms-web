# Sub-merchant Module (Đợt 2a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay luồng Sub-merchant dùng Prisma/mock bằng dữ liệu BE thật (danh sách, chi tiết, thêm, sửa, khoá/mở khoá) theo Hybrid pattern, và làm module mẫu cho các module Đợt 2 còn lại.

**Architecture:** Service layer `src/server/modules/sub-merchants` gọi `merchantClient()` và trả `BeResult`. Route Handler `/api/v1/admin/sub-merchants*` là endpoint cho browser. `sub-merchant-queries.ts` là query contract dùng chung server (prefetch trực tiếp service) và client (gọi route). Trang `sub-merchants/page.tsx` là Server Component bọc `HydrationBoundary`; UI hiện có giữ lại, thêm/sửa/chi tiết/khoá chuyển thành modal.

**Tech Stack:** Next.js 16, TanStack Query v5, Zod 4, Vitest + msw 2 + Testing Library, Basuicn UI.

**Spec:** `docs/superpowers/specs/2026-10-02-flexpay-be-integration-design.md` (mục 6, dòng Sub-merchant). Nền tảng: `docs/superpowers/plans/2026-10-02-foundation-be-integration.md` (đã xong).

**Mockup tham chiếu UI:** 3.11 DS Sub-merchant, 3.12/3.13 Thêm/Cập nhật (mockup có 4 tab: thông tin chung, key kết nối, tài khoản ngân hàng, thông báo/hoá đơn điện tử), 3.14 Chi tiết, 3.15/3.16 Khoá/Mở khoá. **Khác biệt đã chấp nhận:** DTO BE của sub-merchant chỉ có `name, businessField, phone, address` (+ KYB đọc từ Master); ba tab còn lại (key kết nối, ngân hàng, thông báo) **không có nguồn BE** nên không dựng ở đây; tab ngân hàng quay lại ở plan 2c.

**Phân tách Đợt 2:** mỗi module một plan riêng, viết sau khi plan trước xong để dùng lại mẫu của plan này:
2a Sub-merchant (plan này) → 2b Nhóm quyền + User → 2c KYB/ĐVCNTT + Ngân hàng (cần artifact duyệt UI trước) → 2d Terminal + Audit log.

## Quyết định về endpoint BE

Theo quyết định của người dùng, **tạm dùng chung chuỗi admin** cho mọi thao tác: `GET/POST /api/v1/admin/sub-merchants`, `GET/PUT /api/v1/admin/sub-merchants/{id}`, `POST .../{id}/lock|unlock`, gọi bằng token merchant. Không chờ BE tách endpoint riêng cho merchant. Hai hệ quả phải có trong code:

- `merchantId` **luôn do server lấy từ session** (`merchantIds`), không tin giá trị client gửi, vì endpoint admin không tự giới hạn theo phạm vi merchant.
- Mọi đường dẫn BE nằm ở một file (`sub-merchant.paths.ts`), để đổi sang `/api/v1/merchant/...` bằng một thay đổi khi BE tách.

Rủi ro đã được người dùng chấp nhận: nếu BE chưa cho token merchant qua `@PreAuthorize` của chuỗi admin thì gọi live trả 403; code và test (msw) không bị ảnh hưởng.

## Global Constraints

- Code/identifier tiếng Anh; chuỗi hiển thị cho người dùng tiếng Việt.
- `MerchantPermission.MANAGE_SUB_MERCHANT` bắt buộc cho mọi route handler của module (kiểm tra ở server qua `getServerSession()`); thiếu quyền → 403.
- Một màu nút chính teal; thao tác trên dòng là icon button + tooltip; form nhỏ/chi tiết là modal, không tạo route mới (xoá `sub-merchants/new` và `sub-merchants/[id]/edit`).
- Filter một hàng; nút Tìm kiếm/Xoá lọc hàng riêng căn phải; filter và bảng là hai card.
- Component ≤ 200 dòng, function ≤ 50 dòng; không `any`; không `useEffect` để fetch.
- Mọi `page.tsx` có `loading.tsx`; query key chứa đủ filter/phân trang; server và client dùng cùng `queryOptions`.
- Không chạy `next dev/build/start`; không commit (người dùng commit).
- Test theo `.claude/rules/TESTING.md`: assert behavior/contract, không snapshot, không class Tailwind.

## Review Focus

- Sub-merchant của merchant khác (đoán `id`): route trả 404, không gọi BE ghi.
- Danh sách rỗng khi user không được gán sub-merchant nào (BE trả `Page` rỗng, không phải lỗi): hiển thị empty state, không error.
- BE `status = TERMINATED`: hàng chỉ đọc, không có nút khoá/mở khoá.
- `lockSource = CASCADE`: hiển thị "Khóa theo Master", nút mở khoá bị vô hiệu kèm tooltip giải thích (BE từ chối mở khoá khi Master đang khoá).
- Lý do khoá/mở khoá dưới 10 hoặc quá 500 ký tự: chặn ở client, và lỗi BE 400 vẫn hiển thị được.
- `taxCode`, `legalName`, `legalRepresentativeName` của KYB chỉ đọc (`taxCodeEditable=false`): form sửa không có input cho các trường này.
- Trường "Kế thừa" (phone/address): tick = gửi `inheritPhone: true` và không gửi `phone`; bỏ tick bắt buộc nhập giá trị; không tick và không gõ không được gửi chuỗi rỗng đè lên giá trị đang lưu.

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `src/features/sub-merchants/schemas.ts` (sửa) | Zod: DTO BE (summary, detail, inherited field), form values, lock form, filter |
| `src/features/sub-merchants/types.ts` (viết lại) | Kiểu domain suy ra từ schema |
| `src/features/sub-merchants/utils/sub-merchant-mapper.ts` | BE DTO → view model; form values → request body |
| `src/features/sub-merchants/constants/SubMerchant.constants.ts` (sửa) | Nhãn trạng thái; bỏ `BANK_OPTIONS`, `BUSINESS_TYPE_OPTIONS` nếu không còn dùng |
| `src/server/modules/sub-merchants/sub-merchant.paths.ts` | Đường dẫn BE tập trung |
| `src/server/modules/sub-merchants/sub-merchant.service.ts` (viết lại) | list/get/create/update/lock/unlock → `BeResult` |
| `src/features/sub-merchants/sub-merchant-queries.ts` | `subMerchantQueries.list/detail`, fetcher cho browser |
| `src/app/api/v1/admin/sub-merchants/**/route.ts` | Route Handler cho browser (thay thư mục `merchants/sub-merchants`) |
| `src/app/(cms)/(merchant-management)/sub-merchants/{page,loading}.tsx` | Server prefetch + skeleton |
| `src/features/sub-merchants/components/*` | Container client, bảng, filter, các modal |
| `src/features/sub-merchants/hooks/*` | Mutation + điều phối modal |

---

### Task 1: Schema, kiểu và mapper (logic thuần)

**Files:**
- Modify: `src/features/sub-merchants/schemas.ts`, `src/features/sub-merchants/types.ts`
- Create: `src/features/sub-merchants/utils/sub-merchant-mapper.ts`
- Test: `src/features/sub-merchants/schemas.test.ts`, `src/features/sub-merchants/utils/sub-merchant-mapper.test.ts`

**Interfaces:**
- Produces:
  - `subMerchantSummarySchema`, `subMerchantDetailSchema`, `inheritedFieldSchema(valueSchema)`
  - `subMerchantFormSchema`, `lockReasonSchema`
  - `type SubMerchantStatus = "ACTIVE" | "INACTIVE" | "TERMINATED"`, `type LockSource = "DIRECT" | "CASCADE"`
  - `toSubMerchantRow(dto): SubMerchantRow`, `toSubMerchantDetail(dto): SubMerchantDetail`
  - `toCreateRequest(values, merchantId)`, `toUpdateRequest(values)`
  - `canLock(row)`, `canUnlock(row)`

- [ ] **Step 0: Xác nhận tham số phân trang BE**

Đọc `@PageableDefaults` và `PaginationRequest` trong `flex.merchant` (tìm bằng `grep -rn "class PageableDefaults\|PageableDefaults" /home/huytq/code/beam/be/flexpay`), ghi tên tham số thật (`page` 0-based hay 1-based, `size`, `sort`) vào comment đầu `sub-merchant.paths.ts` ở Task 2. Dùng cho Task 2.

- [ ] **Step 1: Viết test schema thất bại**

```ts
// src/features/sub-merchants/schemas.test.ts
import { describe, expect, it } from "vitest";

import { lockReasonSchema, subMerchantFormSchema, subMerchantSummarySchema } from "./schemas";

describe("subMerchantSummarySchema", () => {
  it("parses the BE summary, including isDefault", () => {
    const parsed = subMerchantSummarySchema.safeParse({
      id: "11111111-1111-4111-8111-111111111111",
      code: "MC01-001",
      name: "Cửa hàng Quận 1",
      status: "ACTIVE",
      isDefault: false,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an unknown status", () => {
    const parsed = subMerchantSummarySchema.safeParse({
      id: "11111111-1111-4111-8111-111111111111",
      code: "c",
      name: "n",
      status: "LOCKED",
      isDefault: false,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("lockReasonSchema", () => {
  it.each(["", "ngắn quá", "x".repeat(501)])("rejects %j", (reason) => {
    expect(lockReasonSchema.safeParse({ reason }).success).toBe(false);
  });
  it("accepts 10 to 500 characters", () => {
    expect(lockReasonSchema.safeParse({ reason: "đủ mười ký tự" }).success).toBe(true);
  });
});

describe("subMerchantFormSchema", () => {
  const base = { name: "Điểm bán A", businessField: "", inheritPhone: true, phone: "", inheritAddress: true, address: "" };

  it("accepts inherited phone/address without values", () => {
    expect(subMerchantFormSchema.safeParse(base).success).toBe(true);
  });
  it("requires an own phone once inheritance is switched off", () => {
    const parsed = subMerchantFormSchema.safeParse({ ...base, inheritPhone: false });
    expect(parsed.success).toBe(false);
  });
  it("requires an own address once inheritance is switched off", () => {
    expect(subMerchantFormSchema.safeParse({ ...base, inheritAddress: false }).success).toBe(false);
  });
  it("rejects a name over 255 characters", () => {
    expect(subMerchantFormSchema.safeParse({ ...base, name: "a".repeat(256) }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/sub-merchants/schemas.test.ts`
Expected: FAIL (export chưa tồn tại).

- [ ] **Step 3: Viết `schemas.ts` (thay toàn bộ nội dung cũ)**

```ts
import { z } from "zod";

export const subMerchantStatusSchema = z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]);
export const lockSourceSchema = z.enum(["DIRECT", "CASCADE"]);

export const inheritedFieldSchema = <T extends z.ZodType>(value: T) =>
  z.object({
    value: value.nullish(),
    source: z.string().nullish(),
    inherited: z.boolean(),
    suspended: z.boolean(),
  });

/** `AdminSubMerchantSummaryResponse` of `GET /api/v1/admin/sub-merchants`. */
export const subMerchantSummarySchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  status: subMerchantStatusSchema,
  isDefault: z.boolean(),
  lockSource: lockSourceSchema.nullish(),
  merchantId: z.uuid().nullish(),
  merchantCode: z.string().nullish(),
  merchantName: z.string().nullish(),
  phone: inheritedFieldSchema(z.string()).nullish(),
  createdAt: z.string().nullish(),
});

/** `AdminSubMerchantResponse` (detail). */
export const subMerchantDetailSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  businessField: z.string().nullish(),
  status: subMerchantStatusSchema,
  isDefault: z.boolean(),
  lockSource: lockSourceSchema.nullish(),
  merchantId: z.uuid(),
  merchantCode: z.string().nullish(),
  merchantName: z.string().nullish(),
  legalName: z.string().nullish(),
  taxCode: z.string().nullish(),
  legalRepresentativeName: z.string().nullish(),
  taxCodeEditable: z.boolean(),
  phone: inheritedFieldSchema(z.string()),
  address: inheritedFieldSchema(z.string()),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
});

export const lockReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Lý do phải từ 10 đến 500 ký tự")
    .max(500, "Lý do phải từ 10 đến 500 ký tự"),
});

export const subMerchantFilterSchema = z.object({
  keyword: z.string().max(100).optional(),
  status: subMerchantStatusSchema.optional(),
});

export const subMerchantFormSchema = z
  .object({
    name: z.string().trim().min(1, "Tên điểm bán là bắt buộc").max(255, "Tối đa 255 ký tự"),
    businessField: z.string().trim().max(100, "Tối đa 100 ký tự"),
    inheritPhone: z.boolean(),
    phone: z.string().trim().max(15, "Tối đa 15 ký tự"),
    inheritAddress: z.boolean(),
    address: z.string().trim().max(500, "Tối đa 500 ký tự"),
  })
  .superRefine((value, ctx) => {
    if (!value.inheritPhone && value.phone === "") {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Nhập số điện thoại hoặc chọn kế thừa" });
    }
    if (!value.inheritAddress && value.address === "") {
      ctx.addIssue({ code: "custom", path: ["address"], message: "Nhập địa chỉ hoặc chọn kế thừa" });
    }
  });

export type SubMerchantFilterValues = z.infer<typeof subMerchantFilterSchema>;
export type SubMerchantFormValues = z.infer<typeof subMerchantFormSchema>;
export type LockReasonValues = z.infer<typeof lockReasonSchema>;
```

- [ ] **Step 4: Chạy lại test schema, xác nhận PASS**

Run: `npx vitest run src/features/sub-merchants/schemas.test.ts`

- [ ] **Step 5: Viết test mapper thất bại**

```ts
// src/features/sub-merchants/utils/sub-merchant-mapper.test.ts
import { describe, expect, it } from "vitest";

import { canLock, canUnlock, toCreateRequest, toUpdateRequest } from "./sub-merchant-mapper";

const values = { name: " Điểm A ", businessField: "", inheritPhone: true, phone: "", inheritAddress: false, address: "1 Lê Lợi" };

describe("toCreateRequest", () => {
  it("sends inherit flags instead of blank values and omits empty optional fields", () => {
    expect(toCreateRequest(values, "m-1")).toEqual({
      merchantId: "m-1",
      name: "Điểm A",
      inheritPhone: true,
      inheritAddress: false,
      address: "1 Lê Lợi",
    });
  });
});

describe("toUpdateRequest", () => {
  it("never sends merchantId or KYB fields", () => {
    const body = toUpdateRequest(values);
    expect(body).not.toHaveProperty("merchantId");
    expect(body).not.toHaveProperty("taxCode");
  });
});

describe("lock rules", () => {
  const row = { status: "ACTIVE", lockSource: null } as const;
  it("allows locking an active node only", () => {
    expect(canLock(row)).toBe(true);
    expect(canLock({ status: "INACTIVE", lockSource: "DIRECT" })).toBe(false);
    expect(canLock({ status: "TERMINATED", lockSource: null })).toBe(false);
  });
  it("allows unlocking a directly locked node only", () => {
    expect(canUnlock({ status: "INACTIVE", lockSource: "DIRECT" })).toBe(true);
    expect(canUnlock({ status: "INACTIVE", lockSource: "CASCADE" })).toBe(false);
    expect(canUnlock(row)).toBe(false);
  });
});
```

- [ ] **Step 6: Chạy, xác nhận FAIL; rồi viết mapper**

```ts
// src/features/sub-merchants/utils/sub-merchant-mapper.ts
import type { z } from "zod";

import type { SubMerchantFormValues, subMerchantStatusSchema, lockSourceSchema } from "../schemas";

type Status = z.infer<typeof subMerchantStatusSchema>;
type Source = z.infer<typeof lockSourceSchema>;
type LockState = { status: Status; lockSource?: Source | null };

function optionalText(value: string): string | undefined {
  return value === "" ? undefined : value;
}

function contactFields(values: SubMerchantFormValues) {
  return {
    inheritPhone: values.inheritPhone,
    ...(values.inheritPhone ? {} : { phone: values.phone }),
    inheritAddress: values.inheritAddress,
    ...(values.inheritAddress ? {} : { address: values.address }),
  };
}

export function toCreateRequest(values: SubMerchantFormValues, merchantId: string) {
  return { merchantId, name: values.name.trim(), businessField: optionalText(values.businessField), ...contactFields(values) };
}

export function toUpdateRequest(values: SubMerchantFormValues) {
  return { name: values.name.trim(), businessField: optionalText(values.businessField), ...contactFields(values) };
}

export const canLock = (node: LockState): boolean => node.status === "ACTIVE";

export const canUnlock = (node: LockState): boolean =>
  node.status === "INACTIVE" && node.lockSource === "DIRECT";
```

Sửa test nếu `toEqual` cần `businessField: undefined` (dùng `toStrictEqual` sai; `toEqual` bỏ qua `undefined`, giữ `toEqual`).

- [ ] **Step 7: Viết lại `types.ts`**

```ts
import type { z } from "zod";

import type { subMerchantDetailSchema, subMerchantSummarySchema } from "./schemas";

export type SubMerchantRow = z.infer<typeof subMerchantSummarySchema>;
export type SubMerchantDetail = z.infer<typeof subMerchantDetailSchema>;

export interface SubMerchantListFilter {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: SubMerchantRow["status"];
}

export interface SubMerchantListResult {
  rows: SubMerchantRow[];
  total: number;
}
```

- [ ] **Step 8: Chạy test mapper + `npm run typecheck`**

Expected: test PASS. Typecheck sẽ báo lỗi ở file cũ còn import kiểu cũ — chấp nhận ở bước này, các task sau sửa hết; ghi lại danh sách file lỗi.

---

### Task 2: Service layer (live) với msw

**Files:**
- Create: `src/server/modules/sub-merchants/sub-merchant.paths.ts`
- Modify (viết lại): `src/server/modules/sub-merchants/sub-merchant.service.ts`
- Delete: `sub-merchant.entity.ts`, `sub-merchant.repository.ts` (cùng thư mục)
- Test: `src/server/modules/sub-merchants/sub-merchant.service.test.ts`

**Interfaces:**
- Consumes: `merchantClient()`, `pageSchema`, schemas Task 1, `toSubMerchantRow` không cần (summary đã khớp `SubMerchantRow`).
- Produces (tất cả trả `Promise<BeResult<…>>`):
  - `listSubMerchants(filter: SubMerchantListFilter, merchantId: string): BeResult<SubMerchantListResult>` (query: `merchantId, name, status, page, size`)
  - `getSubMerchant(id)`: `SubMerchantDetail`
  - `createSubMerchant(values: SubMerchantFormValues, merchantId: string)`: `SubMerchantDetail`
  - `updateSubMerchant(id, values)`: `SubMerchantDetail`
  - `lockSubMerchant(id, reason)`, `unlockSubMerchant(id, reason)`: `SubMerchantDetail`
  - `sub-merchant.paths.ts`: `subMerchantPaths = { list, detail(id), create, update(id), lock(id), unlock(id) }`

- [ ] **Step 1: Viết `sub-merchant.paths.ts`**

```ts
// Phân trang BE: `page` 1-based, `size` 1..100, `sortBy`, `sortDirection` (mặc định createdAt/DESC).
// Tạm dùng chuỗi admin cho mọi thao tác (quyết định của người dùng); đổi tại đây khi BE tách.
const ADMIN = "/api/v1/admin/sub-merchants";

export const subMerchantPaths = {
  list: ADMIN,
  detail: (id: string) => `${ADMIN}/${id}`,
  create: ADMIN,
  update: (id: string) => `${ADMIN}/${id}`,
  lock: (id: string) => `${ADMIN}/${id}/lock`,
  unlock: (id: string) => `${ADMIN}/${id}/unlock`,
} as const;
```

- [ ] **Step 2: Viết test service thất bại** (msw `http.get/post/put` trên `MERCHANT_BASE_URL` test env; mẫu xem `merchant-session.service.test.ts`). Các case bắt buộc:
  1. `listSubMerchants` gửi đúng query phân trang theo Step 0 và map `Page` → `{ rows, total: totalElements }`.
  2. `listSubMerchants` với `Page` rỗng trả `{ rows: [], total: 0 }` (Review Focus 1).
  3. `listSubMerchants` khi BE trả 403 → `success: false`, `error.status === 403`.
  4. `createSubMerchant` gửi body đúng `toCreateRequest` (kiểm bằng cách đọc `request.json()` trong handler msw).
  5. `updateSubMerchant` dùng `PUT` và không gửi `merchantId`.
  6. `lockSubMerchant`/`unlockSubMerchant` gửi `{ reason }` tới đúng đường dẫn.
  7. Response sai schema (thiếu `status`) → lỗi `INVALID_RESPONSE`.

- [ ] **Step 3: Chạy test, xác nhận FAIL** (`npx vitest run src/server/modules/sub-merchants`)

- [ ] **Step 4: Viết service**

```ts
import "server-only";

import { z } from "zod";

import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import {
  subMerchantDetailSchema,
  subMerchantSummarySchema,
  type SubMerchantFormValues,
} from "@/features/sub-merchants/schemas";
import type {
  SubMerchantDetail,
  SubMerchantListFilter,
  SubMerchantListResult,
} from "@/features/sub-merchants/types";
import { toCreateRequest, toUpdateRequest } from "@/features/sub-merchants/utils/sub-merchant-mapper";

import { subMerchantPaths } from "./sub-merchant.paths";

export async function listSubMerchants(
  filter: SubMerchantListFilter,
  merchantId: string,
): Promise<BeResult<SubMerchantListResult>> {
  const result = await merchantClient().get({
    path: subMerchantPaths.list,
    schema: pageSchema(subMerchantSummarySchema),
    // BE nhận `page` 1-based (PaginationRequest.toPageable tự trừ 1) — KHÔNG trừ 1 ở FE; `size` tối đa 100.
    query: { merchantId, name: filter.keyword, status: filter.status, page: filter.page, size: filter.pageSize },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

export const getSubMerchant = (id: string): Promise<BeResult<SubMerchantDetail>> =>
  merchantClient().get({ path: subMerchantPaths.detail(id), schema: subMerchantDetailSchema });

export const createSubMerchant = (values: SubMerchantFormValues, merchantId: string) =>
  merchantClient().post({
    path: subMerchantPaths.create,
    schema: subMerchantDetailSchema,
    body: toCreateRequest(values, merchantId),
  });

export const updateSubMerchant = (id: string, values: SubMerchantFormValues) =>
  merchantClient().put({
    path: subMerchantPaths.update(id),
    schema: subMerchantDetailSchema,
    body: toUpdateRequest(values),
  });

export const lockSubMerchant = (id: string, reason: string) =>
  merchantClient().post({ path: subMerchantPaths.lock(id), schema: subMerchantDetailSchema, body: { reason } });

export const unlockSubMerchant = (id: string, reason: string) =>
  merchantClient().post({ path: subMerchantPaths.unlock(id), schema: subMerchantDetailSchema, body: { reason } });
```

Bỏ import `z` nếu không dùng. Test case 1 phải kiểm `page` gửi đúng bằng `filter.page` (không trừ 1) và query gửi đủ `merchantId`, `name`, `status`.

- [ ] **Step 5: Xoá `sub-merchant.entity.ts`, `sub-merchant.repository.ts`; chạy test PASS.**

---

### Task 3: Route Handler cho browser

**Files:**
- Create: `src/app/api/v1/admin/sub-merchants/route.ts` (GET list, POST create), `.../[id]/route.ts` (GET, PUT), `.../[id]/lock/route.ts`, `.../[id]/unlock/route.ts`
- Create: `src/server/modules/sub-merchants/require-sub-merchant-access.ts` (kiểm session + `MANAGE_SUB_MERCHANT`)
- Delete: `src/app/api/v1/admin/merchants/sub-merchants/**`
- Test: `route.test.ts` cạnh mỗi route (gọi trực tiếp `GET/POST/...` với `Request`, mock `getServerSession` ở ranh giới session)

**Interfaces:**
- Consumes: service Task 2, `getServerSession`, `toHttpStatus`, schemas Task 1.
- Produces: JSON `{ rows, total }` (list), `SubMerchantDetail` (detail/create/update/lock/unlock), lỗi `{ message }` với `toHttpStatus`.

- [ ] **Step 1: Test thất bại.** Case bắt buộc: chưa đăng nhập → 401; thiếu `MANAGE_SUB_MERCHANT` → 403 (service **không** được gọi); query `page`/`pageSize` không hợp lệ → 400 (parse bằng Zod, `pageSize` tối đa 100); body create sai schema → 400; lỗi BE 409 → 409 kèm `message`; thành công → 200/201 với payload đúng.
- [ ] **Step 2: Chạy FAIL.**
- [ ] **Step 3: Viết `requireSubMerchantAccess()`** trả `{ ok: true } | { ok: false; response: NextResponse }`, dùng `getServerSession()` và `hasPermission` (kiểm tra `session.user.permissions.includes("MANAGE_SUB_MERCHANT")`; đọc `src/types/auth.ts` lấy đúng tên field), rồi viết các route theo mẫu `auth/forgot-password/route.ts` (parse Zod → service → `NextResponse.json`). `GET list` và `POST create` lấy `merchantId` từ `session.user.merchantIds[0]`; nếu user có nhiều Master thì nhận `merchantId` từ query/body nhưng bắt buộc thuộc `merchantIds`, ngược lại 403. Với `GET/PUT/lock/unlock {id}`, trước khi gọi BE phải tải detail và kiểm `detail.merchantId ∈ merchantIds` (không thuộc → 404), vì endpoint admin không tự giới hạn phạm vi; thêm test "id của merchant khác → 404, không gọi PUT/lock".
- [ ] **Step 4: Chạy test PASS; `npm run typecheck`.**

---

### Task 4: Query contract, hook và Hybrid page

**Files:**
- Create: `src/features/sub-merchants/sub-merchant-queries.ts`, `src/features/sub-merchants/hooks/use-sub-merchant-mutations.ts` (viết lại), `use-sub-merchants-query.ts` (xoá, thay bằng `useQuery(subMerchantQueries.list(...))` trực tiếp trong container)
- Create: `src/app/(cms)/(merchant-management)/sub-merchants/loading.tsx`
- Modify (viết lại): `.../sub-merchants/page.tsx` (Server Component)
- Create: `src/features/sub-merchants/components/SubMerchantsContainer.tsx` (client; sở hữu filter/trang từ URL search params, modal state)
- Test: `sub-merchant-queries.test.ts`, `use-sub-merchant-mutations.test.tsx`, `SubMerchantsContainer.test.tsx`

**Interfaces:**
- Produces: `subMerchantQueries.list(filter)` (key `["sub-merchants","list",filter]`), `subMerchantQueries.detail(id)` (key `["sub-merchants","detail",id]`); `parseSubMerchantSearchParams(raw): SubMerchantListFilter`; `useLockSubMerchant`, `useUnlockSubMerchant`, `useSaveSubMerchant(id?)` — mỗi mutation invalidate `["sub-merchants"]` và `setQueryData` cho detail.

- [ ] **Step 1: Filter.** Giữ thẻ lọc: ô `keyword` (gửi thành `name`) và `status`; một hàng, nút Tìm kiếm/Xoá lọc ở hàng riêng căn phải, thẻ lọc và thẻ bảng tách riêng. Filter nằm trong URL search params và trong query key. Giữ `SubMerchantFilters.tsx` (sửa theo schema mới) thay vì xoá ở Task 5.
- [ ] **Step 2: Test thất bại** cho query contract (key chứa đủ `page`/`pageSize`), `parseSubMerchantSearchParams` (mặc định `page=1,pageSize=10`; giá trị lạ → mặc định), mutation (lock thành công invalidate list; lỗi giữ nguyên cache), và container (loading/error/empty/data; bấm icon khoá mở dialog nhập lý do; nút khoá disabled khi `!canLock`).
- [ ] **Step 3: Chạy FAIL.**
- [ ] **Step 4: Viết `sub-merchant-queries.ts`** — `queryFn` gọi `fetch("/api/v1/admin/sub-merchants?...")` qua `apiClient` (đã có refresh/retry); server override trong `page.tsx` gọi `listSubMerchants` + `unwrapOrRedirect`.
- [ ] **Step 5: `page.tsx`** — `await searchParams`, `parseSubMerchantSearchParams`, `prefetchDehydrated`, `<HydrationBoundary>` bọc `<SubMerchantsContainer filter={filter} />`. Thêm `loading.tsx` có skeleton khớp: tiêu đề, một card bảng 10 dòng.
- [ ] **Step 6: Chạy test PASS, typecheck, lint.**

---

### Task 5: UI — bảng, modal chi tiết, form thêm/sửa, khoá/mở khoá

**Files:**
- Modify: `components/SubMerchantTable.tsx`, `columns/SubMerchantColumn.tsx` (cột: Mã, Tên, Trạng thái, Mặc định, thao tác; thao tác = icon button + tooltip: Xem, Sửa, Khoá/Mở khoá)
- Modify (viết lại): `components/SubMerchantDetailSheet.tsx` → modal chi tiết (KYB chỉ đọc, phone/address kèm badge "Kế thừa từ Master" theo `inherited`/`suspended`)
- Modify (viết lại): `components/SubMerchantFormSheet.tsx` → modal thêm/sửa dùng `subMerchantFormSchema`; hai checkbox "Kế thừa"; KYB hiển thị chỉ đọc khi sửa
- Modify: `components/DialogActive.tsx`, `DialogUnActive.tsx` → modal nhập lý do (`lockReasonSchema`), nút xác nhận teal; hiển thị lỗi BE
- Delete: `NewSubMerchantForm.tsx`, `BankAccountSection.tsx`, `NotificationSection.tsx`, route `sub-merchants/new`, `sub-merchants/[id]/edit`, `src/lib/api/SubMerchant.ts`
- Test: `SubMerchantTable.test.tsx`, `SubMerchantFormModal.test.tsx`, `LockReasonDialog.test.tsx`

- [ ] **Step 1: Test thất bại.** Bảng: hàng `TERMINATED` không có nút khoá/mở khoá; hàng `CASCADE` có nút mở khoá `disabled` (có `aria-label`); mỗi icon button có accessible name. Form: tick "Kế thừa" làm input phone bị `disabled` và submit gửi `inheritPhone: true` không kèm `phone`; bỏ tick để trống → hiện lỗi bắt buộc; tên >255 ký tự → lỗi; sửa không có input tax code. Dialog lý do: dưới 10 ký tự → nút xác nhận không gọi mutation, hiện lỗi; lỗi BE hiển thị trong dialog, dialog không đóng.
- [ ] **Step 2: Chạy FAIL.**
- [ ] **Step 3: Triển khai** theo `.claude/DESIGN.md` (teal solid, đối xứng, tooltip cho icon). Mỗi component ≤ 200 dòng; logic mở/đóng modal ở hook `use-sub-merchant-dialogs.ts`.
- [ ] **Step 4: Chạy test liên quan PASS.**

---

### Task 6: Consumer dùng danh sách sub-merchant (orders, refund, withdrawal)

Các nơi này (module Đợt 3, dữ liệu fixture) chỉ cần danh sách sub-merchant làm lựa chọn; hiện import `lib/api/SubMerchant` và kiểu `SubMerchant` cũ.

**Files:**
- Create: `src/features/sub-merchants/hooks/use-sub-merchant-options.ts`, test cạnh nó
- Modify: `src/features/orders/hooks/use-sub-merchants.ts`, `src/features/refund/hooks/use-sub-merchants.ts` (xoá, hai file trùng nhau), `src/features/orders/components/OrderAddNew.tsx`, `src/features/refund/components/RefundFilter.tsx`, `src/features/withdrawals/components/{WithdrawalNewStep1,WithdrawalNewStep2,WithdrawalPreviewSection}.tsx`, `src/app/(cms)/withdrawal/new/page.tsx`

**Interfaces:**
- Produces: `useSubMerchantOptions(): UseQueryResult<{ id: string; name: string; code: string }[]>` — dùng `subMerchantQueries.list({ page: 1, pageSize: 100 })` và map `rows`; key trùng query list để dùng chung cache.

- [ ] **Step 1:** Test hook: trả đúng `{id,name,code}` từ route; lỗi → `isError`. Chạy FAIL, rồi viết hook.
- [ ] **Step 2:** Thay hai hook trùng nhau bằng `useSubMerchantOptions`; sửa component dùng `rows`/`name`/`id` thay cho `data.data`/trường cũ; trong withdrawal đổi kiểu `SubMerchant` thành `SubMerchantOption` (export từ hook) chỉ gồm trường thực sự dùng (grep trường đang đọc trước khi định nghĩa).
- [ ] **Step 3:** `npm run typecheck` phải sạch ở các file này. Module `users` (`SubMerchantSelection`, `SubMerchantDetailModal`, ...) có kiểu `SubMerchant` cục bộ riêng và thuộc plan 2b: không sửa.

---

### Task 7: Dọn dẹp và nghiệm thu

- [ ] **Step 1:** `grep -rn "sub-merchant" src --include=*.ts --include=*.tsx -il` xác nhận không còn import tới `@prisma/client`, `lib/api/SubMerchant`, `merchants/sub-merchants`; xoá `SUB_MERCHANT_STATUS_OPTIONS` cũ nếu thay bằng bảng nhãn mới (`ACTIVE`→"Đang hoạt động", `INACTIVE`+`DIRECT`→"Đã khóa", `INACTIVE`+`CASCADE`→"Khóa theo Master", `TERMINATED`→"Đã đóng"); cập nhật `route.constants.tsx` nếu có link tới `/sub-merchants/new`.
- [ ] **Step 2:** Chạy `npm run check` (test + typecheck + lint). Expected: toàn bộ xanh, không cảnh báo mới. Không chạy build/dev.
- [ ] **Step 3:** Báo cáo cho người dùng: danh sách file, kết quả lệnh thật, rủi ro còn mở: BE có cho token merchant qua `@PreAuthorize` của chuỗi admin hay chưa (403 khi gọi thật).

## Self-Review

- Spec §6 Sub-merchant: danh sách (T4), thêm/sửa/chi tiết (T5), khoá/mở khoá (T5), nguồn BE (T2); dọn mock phần sub-merchant (T6). Phần dọn Prisma toàn hệ thống và 3 module còn lại thuộc plan 2b–2d/3.
- Tên nhất quán: `subMerchantQueries`, `SubMerchantRow`, `SubMerchantDetail`, `subMerchantPaths`, `canLock/canUnlock` dùng đồng nhất ở T1→T5.
- Rủi ro đã nêu: BE chưa mở endpoint ghi cho token merchant; tham số phân trang BE cần xác nhận ở T1 Step 0.
