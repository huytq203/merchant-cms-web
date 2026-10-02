# Merchant Portal — Đợt 1: Nền tảng nối BE Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Dispatch via `codex-implementer`:** each task heading is `## Task N:` exactly (the agent extracts a task by that pattern). Codex never runs `git commit`; the controller runs the "Commit" step after verifying. Commit message trailer (controller appends): `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01RL64f4EPQSmpz5DSAgwhW9`.

**Goal:** Replace the Prisma/mock login and session with the real Flexpay merchant identity (`/merchant/auth/*`, `/merchant/me`), and build the shared BE client, Hybrid-query infrastructure and permission-aware shell that every later module plan depends on.

**Architecture:** Server-only Data Access Layer under `src/server/modules/*` calls the BE through one typed client (`src/lib/be`) that Zod-parses the `RestApiResponse` envelope and never throws (`Result<T, BeError>`). Auth is a 2-step login (password → email OTP) with HTTP-only access/refresh cookies, auto-refresh in `proxy.ts` and on browser 401. The `(cms)` layout becomes a Server Component that loads the session via `/me` and hands it to a client `SessionProvider`; the sidebar hides items the user's `MerchantPermission`s do not allow. Hybrid helpers (`prefetch` + `unwrapOrRedirect`) are added but no module uses them yet.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict (`noUncheckedIndexedAccess`), Zod 4, TanStack Query 5, react-hook-form, Basuicn (`src/components/ui`), Tailwind v4. New dev deps (approved): `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `msw`.

**Spec:** `docs/superpowers/specs/2026-10-02-flexpay-be-integration-design.md` (v2). Context: `PRODUCT.md`, `.claude/CLAUDE.md`, UI artifact `https://claude.ai/artifact/4Nzgx2Uu3L3rxTSLaDF7w5`.

**Scope of this plan:** spec §5 (Đợt 1). Plans for Đợt 2 (KYB/ĐVCNTT/bank, sub-merchant, groups, users, terminal, audit log) are written after this plan lands, because they consume `src/lib/be`, `session`, permissions and the Hybrid helpers defined here. Out of scope here: Prisma removal (Đợt 3), `MERCHANT_API_MODE=fixture` data for non-auth modules (Đợt 2 plans).

## Global Constraints

- TypeScript strict; **no `any`, no `@ts-ignore`**, no disabling lint to hide errors.
- Component ≤ 200 lines, function ≤ 50 lines. Named exports (except `page`/`layout`/route handlers). Server Component default; `'use client'` only on leaves.
- All code (identifiers, comments, logs, test names) in **English**; user-facing UI copy in **Vietnamese**.
- UI uses Basuicn from `src/components/ui/`; do not create primitives or add UI libraries. Tokens only (`bg-primary`, `text-muted-foreground`…), no hard-coded colors, no raw Tailwind palette.
- Button convention (this plan updates the docs in Task 12): one primary action per screen/modal = `Button` default `solid` (teal); secondary = `variant="outline"`; light actions (Back, Clear) = `variant="ghost"`; destructive confirm = `variant="danger"`. No yellow buttons.
- Private data is never shared-cached: no `unstable_cache` / `use cache` for session or BE data.
- Services never throw to callers; they return `Result<T, BeError>`. Raw BE errors/stacks never reach the client; 5xx use a generic Vietnamese message.
- Every Route Handler checks the session itself (they are public endpoints). `proxy.ts` only does optimistic cookie checks.
- Read the relevant `node_modules/next/dist/docs/` page before using a Next API (`proxy.md`, `cookies.md`, `redirect`, `route.md`); if the local docs contradict this plan, stop and report.
- Tests: Vitest; test behavior via accessible queries; no snapshot, no Tailwind-class or decorative-copy assertions. Mock only system boundaries (HTTP via msw, `next/headers`, `next/navigation`).
- Do not touch `.env`/`.env.local` (secrets). Do not run `npx basuicn update|remove|init` or `--force`. Do not add dependencies other than those listed in Task 1.
- Work only on files named in the task. Do not refactor outside scope.

## Review Focus

1. **Parallel refresh race.** Two requests with the same refresh token (prefetch + navigation) must trigger one BE call; a rotated token must not log the user out. → Task 6 `refreshTokensOnce` test.
2. **Redirect loop when `/me` fails while cookies exist** (revoked token): layout → `/login` → proxy sends authenticated users back to `/dashboard`. Must go through the cookie-clearing `session-expired` route. → Task 8 route test, Task 10 layout.
3. **Wrong, expired or exhausted OTP.** Wrong code shows the BE message and keeps the form usable; resend is disabled during countdown and when `resendRemaining` is 0. → Task 9 OtpPanel tests.
4. **Open redirect via `callbackUrl`** (`//evil.com`, `https://evil.com`, `/\evil.com`). → Task 9 `safeCallback` test.
5. **Unknown values from BE:** a permission name or user status the FE does not know must not crash the session; unknown permissions are dropped, unknown status is treated as `LOCKED`. → Task 5 mapper tests.

## Assumptions (defaults applied; controller confirms with the user)

- Primary button color is teal (matches existing `Button`, 82 of ~99 usages). `DESIGN.md` and `workflows/frontend.md` currently say yellow; Task 12 aligns them. **Do not dispatch Task 12 until the user confirms.**
- `AuthenticationResponse.expiresIn`/`refreshExpiresIn` and OTP `expiresIn`/`canResendAfter` are **seconds** (OAuth convention). The access cookie lifetime is derived from the JWT `exp` instead, so only the refresh cookie and OTP countdown depend on this. Verify against the dev BE during Task 8's manual check.
- BE env names: `IDENTITY_BASE_URL` and `MERCHANT_BASE_URL` already exist in the user's `.env.local` (values currently end in `/api/v1/admin`); `parseServerEnv` strips that suffix so the code chooses `/api/v1/merchant/...`. `MERCHANT_API_MODE` is optional (defaults to `fixture`). `USE_PROXY` and `JWT_SECRET` are unused after Task 8 and left alone.
- Login uses **email** + password (BE `MerchantLoginRequest`), not username.

## File Structure

| File | Responsibility |
|---|---|
| `vitest.config.ts`, `src/test/{setup,msw,server-only,jwt}.ts` | Test harness (alias `@`, `server-only` stub, msw lifecycle, fake JWT helper) |
| `src/lib/env/server.ts` | Zod-validated server env (`getServerEnv`, `parseServerEnv`) |
| `src/lib/be/envelope.ts` | `envelopeSchema`, `pageSchema`, `emptySchema`, `Page<T>` |
| `src/lib/be/errors.ts` | `BeError`, `toBeError`, `classifyFetchError`, `toHttpStatus` |
| `src/lib/be/client.ts` | `createBeClient` → `get/post/put/patch/delete` returning `BeResult<T>` |
| `src/lib/be/services.ts` | `identityClient()`, `merchantClient()` (server-only factories) |
| `src/lib/auth/session-cookies.ts` | Cookie read/write/clear + pure `buildSessionCookies` |
| `src/lib/auth/auth-routing.ts` | Pure `decideAuthAction`, `mergeCookieHeader` for `proxy.ts` |
| `src/lib/auth/session.ts` | `getServerSession()` (via `/me`), re-export `getAccessToken` |
| `src/server/modules/auth/merchant-auth.{dto,service}.ts` | Login/OTP/refresh/logout calls |
| `src/server/modules/auth/merchant-password.service.ts` | change/forgot/validate/reset password calls |
| `src/server/modules/auth/merchant-session.service.ts` | `/me` → `SessionUser` |
| `src/features/auth/{schemas.ts,permissions.ts,utils/*}` | Form + DTO schemas, `MerchantPermission`, mapper, `safeCallback` |
| `src/features/auth/components/{otp-panel,credentials-step,login-form-panel,login-brand-panel,session-provider,account-status-notice}.tsx` | Login UI + session context |
| `src/lib/query/{query-client,prefetch}.ts` | Shared QueryClient factory, Hybrid prefetch + `unwrapOrRedirect` |

---

## Task 1: Vitest test harness

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`, `src/test/msw.ts`, `src/test/server-only.ts`, `src/test/jwt.ts`, `src/test/harness.test.ts`
- Modify: `package.json` (scripts + devDependencies via npm)

**Interfaces:**
- Produces: `npm test` (= `vitest run`), `mswServer` from `@/test/msw`, `fakeJwt(payload)` from `@/test/jwt`, alias `@/*` and a `server-only` stub inside Vitest.

- [ ] **Step 1: Install dev dependencies**

Run: `npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom msw`
Expected: installs without peer errors. Do not install anything else.

- [ ] **Step 2: Write the failing harness test**

`src/test/harness.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { cn } from "@/lib/utils/cn";
import { mswServer } from "@/test/msw";

describe("test harness", () => {
  it("resolves the @ alias", () => {
    expect(cn("a", false, "b")).toBe("a b");
  });

  it("stubs the server-only package", async () => {
    await expect(import("server-only")).resolves.toBeDefined();
  });

  it("intercepts fetch with msw", async () => {
    mswServer.use(
      http.get("https://example.test/ping", () => HttpResponse.json({ ok: true })),
    );
    const response = await fetch("https://example.test/ping");
    expect(await response.json()).toEqual({ ok: true });
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/test/harness.test.ts`
Expected: FAIL — cannot resolve `@/lib/utils/cn` / `@/test/msw` (no config yet).

- [ ] **Step 4: Add the harness files**

`vitest.config.ts`:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": fromRoot("./src"),
      "server-only": fromRoot("./src/test/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
    unstubEnvs: true,
  },
});
```

`src/test/server-only.ts`:

```ts
export {};
```

`src/test/msw.ts`:

```ts
import { setupServer } from "msw/node";

export const mswServer = setupServer();
```

`src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";

import { mswServer } from "@/test/msw";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());
```

`src/test/jwt.ts`:

```ts
const encode = (value: unknown): string =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

/** Builds an unsigned JWT-shaped string for tests that only read the payload. */
export function fakeJwt(payload: Record<string, unknown>): string {
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.signature`;
}
```

`package.json` scripts: add `"test": "vitest run"` and `"test:watch": "vitest"`; change `"check"` to `"npm run typecheck && npm run lint && npm run test"`.

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run src/test/harness.test.ts && npm run typecheck`
Expected: 3 tests PASS; typecheck clean.

- [ ] **Step 6: Commit (controller)**

```bash
git add vitest.config.ts src/test package.json package-lock.json
git commit -m "test: add Vitest, Testing Library and msw harness" -- vitest.config.ts src/test package.json package-lock.json
```

---

## Task 2: BE core (env, envelope, errors, client)

**Files:**
- Create: `src/lib/env/server.ts`, `src/lib/env/server.test.ts`, `src/lib/be/envelope.ts`, `src/lib/be/errors.ts`, `src/lib/be/errors.test.ts`, `src/lib/be/client.ts`, `src/lib/be/client.test.ts`, `src/lib/be/services.ts`, `src/lib/auth/session-cookies.ts`, `.env.example`
- Modify: `.gitignore` (add `!.env.example` below the existing `.env*` line)

**Interfaces:**
- Consumes: `Result`, `ok`, `fail` from `@/lib/http/result`; `AUTH_COOKIES` from `@/lib/auth/cookies`.
- Produces (exact):
  - `getServerEnv(): ServerEnv`, `parseServerEnv(source): ServerEnv` where `ServerEnv = { IDENTITY_BASE_URL: string; MERCHANT_BASE_URL: string; MERCHANT_API_MODE: "live" | "fixture" }`.
  - `envelopeSchema`, `emptySchema`, `pageSchema(item)`, `type Page<T> = { content: T[]; totalElements: number; totalPages: number; number: number; size: number }`.
  - `type BeError = { status: number; code: string; message: string; fieldErrors?: Record<string, string> }`; `toBeError(status, body)`, `classifyFetchError(error)`, `invalidResponseError(status)`, `toHttpStatus(error)`; constants `NETWORK_ERROR`, `TIMEOUT_ERROR`.
  - `type BeResult<T> = Result<T, BeError>`; `createBeClient({ baseUrl, getAccessToken?, timeoutMs? })` returning `{ get, post, put, patch, delete }`, each `(req: { path; schema; query?; body?; auth? }) => Promise<BeResult<z.infer<schema>>>`; `type BeClient`.
  - `identityClient()`, `merchantClient()` (server-only) from `@/lib/be/services`.
  - `readAccessToken()`, `readRefreshToken()` from `@/lib/auth/session-cookies`.

Read first: `.claude/rules/RULE.md`, `.claude/rules/TESTING.md`, `src/lib/http/result.ts`.

- [ ] **Step 1: Write failing tests**

`src/lib/env/server.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env/server";

describe("parseServerEnv", () => {
  it("trims trailing slashes and defaults the mode to fixture", () => {
    const env = parseServerEnv({
      IDENTITY_BASE_URL: "https://identity.test/",
      MERCHANT_BASE_URL: "https://merchant.test//",
    });
    expect(env).toEqual({
      IDENTITY_BASE_URL: "https://identity.test",
      MERCHANT_BASE_URL: "https://merchant.test",
      MERCHANT_API_MODE: "fixture",
    });
  });

  it("drops a legacy /api/v1/admin or /api/v1/merchant suffix", () => {
    const env = parseServerEnv({
      IDENTITY_BASE_URL: "https://host.test/identity/api/v1/admin",
      MERCHANT_BASE_URL: "https://host.test/merchant/api/v1/merchant/",
    });
    expect(env.IDENTITY_BASE_URL).toBe("https://host.test/identity");
    expect(env.MERCHANT_BASE_URL).toBe("https://host.test/merchant");
  });

  it("accepts live mode", () => {
    const env = parseServerEnv({
      IDENTITY_BASE_URL: "https://identity.test",
      MERCHANT_BASE_URL: "https://merchant.test",
      MERCHANT_API_MODE: "live",
    });
    expect(env.MERCHANT_API_MODE).toBe("live");
  });

  it("names the invalid keys without echoing their values", () => {
    expect(() =>
      parseServerEnv({ IDENTITY_BASE_URL: "not-a-url-secret", MERCHANT_BASE_URL: undefined }),
    ).toThrowError(/IDENTITY_BASE_URL.*MERCHANT_BASE_URL/);
    expect(() => parseServerEnv({ IDENTITY_BASE_URL: "not-a-url-secret" })).not.toThrowError(
      /not-a-url-secret/,
    );
  });
});
```

`src/lib/be/errors.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { classifyFetchError, toBeError, toHttpStatus } from "@/lib/be/errors";

describe("toBeError", () => {
  it("reads code and detail from a RestApiResponse error", () => {
    const error = toBeError(401, {
      success: false,
      message: "INVALID_CREDENTIALS",
      detail: "Email hoặc mật khẩu không đúng",
      status: "4001",
    });
    expect(error).toEqual({
      status: 401,
      code: "INVALID_CREDENTIALS",
      message: "Email hoặc mật khẩu không đúng",
    });
  });

  it("reads errorCode, message and field details from an ErrorResponse", () => {
    const error = toBeError(400, {
      status: 400,
      message: "Dữ liệu không hợp lệ",
      errorCode: "VALIDATION_ERROR",
      details: { email: "Email không hợp lệ", ignored: 5 },
    });
    expect(error).toEqual({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Dữ liệu không hợp lệ",
      fieldErrors: { email: "Email không hợp lệ" },
    });
  });

  it("never exposes the body of a 5xx response", () => {
    const error = toBeError(500, { message: "NullPointerException at X", detail: "stack..." });
    expect(error.message).toBe("Hệ thống đang gặp sự cố, vui lòng thử lại sau");
    expect(JSON.stringify(error)).not.toContain("NullPointerException");
  });

  it("falls back to a status message when the body is not JSON", () => {
    expect(toBeError(403, undefined)).toEqual({
      status: 403,
      code: "HTTP_403",
      message: "Bạn không có quyền thực hiện thao tác này",
    });
  });
});

describe("classifyFetchError", () => {
  it("maps a TimeoutError to TIMEOUT and anything else to NETWORK", () => {
    expect(classifyFetchError(new DOMException("slow", "TimeoutError")).code).toBe("TIMEOUT");
    expect(classifyFetchError(new TypeError("fetch failed")).code).toBe("NETWORK");
  });
});

describe("toHttpStatus", () => {
  it("passes 4xx through and turns network and 5xx failures into 502", () => {
    expect(toHttpStatus({ status: 422, code: "X", message: "m" })).toBe(422);
    expect(toHttpStatus({ status: 0, code: "NETWORK", message: "m" })).toBe(502);
    expect(toHttpStatus({ status: 503, code: "X", message: "m" })).toBe(502);
  });
});
```

`src/lib/be/client.test.ts`:

```ts
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createBeClient } from "@/lib/be/client";
import { emptySchema } from "@/lib/be/envelope";
import { mswServer } from "@/test/msw";

const BASE = "https://be.test";
const client = createBeClient({ baseUrl: BASE, getAccessToken: async () => "tok-1" });
const envelope = (data: unknown) => ({
  success: true,
  status: "1000",
  message: "success",
  detail: "ok",
  data,
});
const userSchema = z.object({ id: z.string(), name: z.string() });

describe("createBeClient", () => {
  it("parses a successful envelope through the schema", async () => {
    mswServer.use(
      http.get(`${BASE}/u`, () => HttpResponse.json(envelope({ id: "1", name: "An", extra: 1 }))),
    );
    const result = await client.get({ path: "/u", schema: userSchema });
    expect(result).toEqual({ success: true, data: { id: "1", name: "An" } });
  });

  it("sends the bearer token by default and omits it when auth is false", async () => {
    const seen: (string | null)[] = [];
    mswServer.use(
      http.get(`${BASE}/ping`, ({ request }) => {
        seen.push(request.headers.get("authorization"));
        return HttpResponse.json(envelope(null));
      }),
    );
    await client.get({ path: "/ping", schema: emptySchema });
    await client.get({ path: "/ping", schema: emptySchema, auth: false });
    expect(seen).toEqual(["Bearer tok-1", null]);
  });

  it("serialises query params and skips undefined and null", async () => {
    let url = "";
    mswServer.use(
      http.get(`${BASE}/list`, ({ request }) => {
        url = request.url;
        return HttpResponse.json(envelope(null));
      }),
    );
    await client.get({
      path: "/list",
      schema: emptySchema,
      query: { page: 2, q: "an", skip: undefined, none: null, flag: false },
    });
    expect(new URL(url).searchParams.toString()).toBe("page=2&q=an&flag=false");
  });

  it("maps an HTTP error body to a BeError", async () => {
    mswServer.use(
      http.post(`${BASE}/login`, () =>
        HttpResponse.json(
          { success: false, message: "INVALID_CREDENTIALS", detail: "Sai mật khẩu", status: "4001" },
          { status: 401 },
        ),
      ),
    );
    const result = await client.post({ path: "/login", schema: emptySchema, body: {} });
    expect(result).toMatchObject({
      success: false,
      error: { status: 401, code: "INVALID_CREDENTIALS", message: "Sai mật khẩu" },
    });
  });

  it("treats a 200 whose envelope says success=false as an error", async () => {
    mswServer.use(
      http.get(`${BASE}/x`, () =>
        HttpResponse.json({ success: false, message: "LOCKED", detail: "Tài khoản bị khóa" }),
      ),
    );
    const result = await client.get({ path: "/x", schema: emptySchema });
    expect(result).toMatchObject({ success: false, error: { code: "LOCKED", message: "Tài khoản bị khóa" } });
  });

  it("returns INVALID_RESPONSE when data does not match the schema", async () => {
    mswServer.use(http.get(`${BASE}/u`, () => HttpResponse.json(envelope({ id: 1 }))));
    const result = await client.get({ path: "/u", schema: userSchema });
    expect(result).toMatchObject({ success: false, error: { code: "INVALID_RESPONSE" } });
  });

  it("returns NETWORK when the connection fails", async () => {
    mswServer.use(http.get(`${BASE}/down`, () => HttpResponse.error()));
    const result = await client.get({ path: "/down", schema: emptySchema });
    expect(result).toMatchObject({ success: false, error: { status: 0, code: "NETWORK" } });
  });

  it("accepts an empty 204 body for emptySchema", async () => {
    mswServer.use(http.post(`${BASE}/logout`, () => new HttpResponse(null, { status: 204 })));
    const result = await client.post({ path: "/logout", schema: emptySchema });
    expect(result).toEqual({ success: true, data: undefined });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib`
Expected: FAIL — modules `@/lib/env/server`, `@/lib/be/*` not found.

- [ ] **Step 3: Implement**

`src/lib/env/server.ts`:

```ts
import "server-only";
import { z } from "zod";

/** Trims slashes and drops a trailing `/api/v1/admin|merchant`: the namespace is chosen in code, not in env. */
const normalizeBaseUrl = (value: string) =>
  value
    .replace(/\/+$/, "")
    .replace(/\/api\/v1\/(?:admin|merchant)$/, "")
    .replace(/\/+$/, "");

const serverEnvSchema = z.object({
  IDENTITY_BASE_URL: z.url().transform(normalizeBaseUrl),
  MERCHANT_BASE_URL: z.url().transform(normalizeBaseUrl),
  MERCHANT_API_MODE: z.enum(["live", "fixture"]).default("fixture"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const parsed = serverEnvSchema.safeParse(source);
  if (!parsed.success) {
    const keys = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Invalid server environment: ${keys.join(", ")}`);
  }
  return parsed.data;
}

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
```

`src/lib/be/envelope.ts`:

```ts
import { z } from "zod";

/** Loose `RestApiResponse<T>` envelope; `data` is validated separately by each caller. */
export const envelopeSchema = z.object({
  success: z.boolean(),
  status: z.string().nullish(),
  message: z.string().nullish(),
  detail: z.string().nullish(),
  data: z.unknown(),
});

/** For endpoints that return no payload. */
export const emptySchema = z.union([z.undefined(), z.null()]).transform(() => undefined);

/** Spring `Page<T>` (flat serialisation; `number` is 0-based). */
export const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    content: z.array(item),
    totalElements: z.number(),
    totalPages: z.number(),
    number: z.number(),
    size: z.number(),
  });

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};
```

`src/lib/be/errors.ts`:

```ts
export type BeError = {
  /** HTTP status; 0 for network and timeout failures. */
  status: number;
  /** BE error code name, or NETWORK | TIMEOUT | INVALID_RESPONSE | HTTP_<status>. */
  code: string;
  /** Safe to show to the user. */
  message: string;
  fieldErrors?: Record<string, string>;
};

const SERVER_MESSAGE = "Hệ thống đang gặp sự cố, vui lòng thử lại sau";

const STATUS_MESSAGES: Record<number, string> = {
  400: "Dữ liệu không hợp lệ",
  401: "Phiên đăng nhập đã hết hạn",
  403: "Bạn không có quyền thực hiện thao tác này",
  404: "Không tìm thấy dữ liệu",
  409: "Dữ liệu đã thay đổi, vui lòng tải lại",
  429: "Thao tác quá nhanh, vui lòng thử lại sau",
};

export const NETWORK_ERROR: BeError = {
  status: 0,
  code: "NETWORK",
  message: "Không kết nối được tới hệ thống, vui lòng thử lại",
};

export const TIMEOUT_ERROR: BeError = {
  status: 0,
  code: "TIMEOUT",
  message: "Hệ thống phản hồi quá lâu, vui lòng thử lại",
};

export function invalidResponseError(status: number): BeError {
  return { status, code: "INVALID_RESPONSE", message: SERVER_MESSAGE };
}

export function classifyFetchError(error: unknown): BeError {
  const timedOut = error instanceof DOMException && error.name === "TimeoutError";
  return timedOut ? TIMEOUT_ERROR : NETWORK_ERROR;
}

const CODE_PATTERN = /^[A-Z][A-Z0-9_]+$/;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function readString(record: Record<string, unknown> | null, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readFieldErrors(record: Record<string, unknown> | null): Record<string, string> | undefined {
  const details = asRecord(record?.["details"]);
  if (!details) return undefined;
  const entries = Object.entries(details).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function toBeError(status: number, body: unknown): BeError {
  if (status >= 500) {
    return { status, code: readString(asRecord(body), "errorCode") ?? `HTTP_${status}`, message: SERVER_MESSAGE };
  }
  const record = asRecord(body);
  const message = readString(record, "message");
  const messageIsCode = message !== undefined && CODE_PATTERN.test(message);
  const code = readString(record, "errorCode") ?? (messageIsCode ? message : `HTTP_${status}`);
  const text =
    readString(record, "detail") ??
    (messageIsCode ? undefined : message) ??
    STATUS_MESSAGES[status] ??
    "Yêu cầu không thành công";
  const fieldErrors = readFieldErrors(record);
  return fieldErrors ? { status, code, message: text, fieldErrors } : { status, code, message: text };
}

/** HTTP status a Route Handler should answer with for a BE failure. */
export function toHttpStatus(error: BeError): number {
  return error.status === 0 || error.status >= 500 ? 502 : error.status;
}
```

`src/lib/be/client.ts`:

```ts
import type { z } from "zod";

import { envelopeSchema } from "@/lib/be/envelope";
import {
  classifyFetchError,
  invalidResponseError,
  toBeError,
  type BeError,
} from "@/lib/be/errors";
import { fail, ok, type Result } from "@/lib/http/result";

export type BeResult<T> = Result<T, BeError>;

type Query = Record<string, string | number | boolean | null | undefined>;

export interface BeRequest<S extends z.ZodType> {
  /** Path including the API prefix, e.g. `/api/v1/merchant/me`. */
  path: string;
  schema: S;
  query?: Query;
  body?: unknown;
  /** Attach the bearer token (default true). */
  auth?: boolean;
}

export interface BeClientOptions {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null>;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;

function buildUrl(baseUrl: string, path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) params.append(key, String(value));
  }
  const suffix = params.toString();
  return `${baseUrl}${path}${suffix ? `?${suffix}` : ""}`;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export function createBeClient(options: BeClientOptions) {
  const { baseUrl, getAccessToken, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  async function buildHeaders(req: BeRequest<z.ZodType>): Promise<Headers> {
    const headers = new Headers({ Accept: "application/json" });
    if (req.body !== undefined) headers.set("Content-Type", "application/json");
    if (req.auth !== false && getAccessToken) {
      const token = await getAccessToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  }

  async function request<S extends z.ZodType>(
    method: string,
    req: BeRequest<S>,
  ): Promise<BeResult<z.infer<S>>> {
    let response: Response;
    try {
      response = await fetch(buildUrl(baseUrl, req.path, req.query), {
        method,
        headers: await buildHeaders(req),
        body: req.body === undefined ? undefined : JSON.stringify(req.body),
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      const failure = classifyFetchError(error);
      return fail(failure, failure.code);
    }

    const json = await readJson(response);
    if (!response.ok) {
      const error = toBeError(response.status, json);
      return fail(error, error.code);
    }

    const envelope = envelopeSchema.safeParse(json === undefined ? { success: true } : json);
    if (!envelope.success) {
      const error = invalidResponseError(response.status);
      return fail(error, error.code);
    }
    if (!envelope.data.success) {
      const error = toBeError(response.status, json);
      return fail(error, error.code);
    }

    const data = req.schema.safeParse(envelope.data.data);
    if (!data.success) {
      const error = invalidResponseError(response.status);
      return fail(error, error.code);
    }
    return ok(data.data as z.infer<S>);
  }

  return {
    get: <S extends z.ZodType>(req: BeRequest<S>) => request("GET", req),
    post: <S extends z.ZodType>(req: BeRequest<S>) => request("POST", req),
    put: <S extends z.ZodType>(req: BeRequest<S>) => request("PUT", req),
    patch: <S extends z.ZodType>(req: BeRequest<S>) => request("PATCH", req),
    delete: <S extends z.ZodType>(req: BeRequest<S>) => request("DELETE", req),
  };
}

export type BeClient = ReturnType<typeof createBeClient>;
```

`src/lib/auth/session-cookies.ts`:

```ts
import "server-only";
import { cookies } from "next/headers";

import { AUTH_COOKIES } from "@/lib/auth/cookies";

export async function readAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIES.ACCESS_TOKEN)?.value ?? null;
}

export async function readRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIES.REFRESH_TOKEN)?.value ?? null;
}
```

`src/lib/be/services.ts`:

```ts
import "server-only";

import { createBeClient, type BeClient } from "@/lib/be/client";
import { readAccessToken } from "@/lib/auth/session-cookies";
import { getServerEnv } from "@/lib/env/server";

export function identityClient(): BeClient {
  return createBeClient({
    baseUrl: getServerEnv().IDENTITY_BASE_URL,
    getAccessToken: readAccessToken,
  });
}

export function merchantClient(): BeClient {
  return createBeClient({
    baseUrl: getServerEnv().MERCHANT_BASE_URL,
    getAccessToken: readAccessToken,
  });
}
```

`.env.example` (no secrets):

```
# Service roots of the Flexpay BE (paths such as /api/v1/merchant/* are in code)
IDENTITY_BASE_URL=https://api.dev.ewallet.flexpay.vn/identity
MERCHANT_BASE_URL=https://api.dev.ewallet.flexpay.vn/merchant
# live = call the BE; fixture = serve sample data for modules without usable BE APIs yet
MERCHANT_API_MODE=live
```

`.gitignore`: add a line `!.env.example` directly after `.env*`.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib && npm run typecheck && npm run lint`
Expected: all tests PASS (env 4, errors 6, client 8); typecheck and lint clean.

- [ ] **Step 5: Commit (controller)**

```bash
git add src/lib/env src/lib/be src/lib/auth/session-cookies.ts .env.example .gitignore
git commit -m "feat(be): add typed BE client, envelope and server env" -- src/lib/env src/lib/be src/lib/auth/session-cookies.ts .env.example .gitignore
```

---

## Task 3: Merchant login service and form schemas

**Files:**
- Create: `src/server/modules/auth/merchant-auth.dto.ts`, `src/server/modules/auth/merchant-auth.service.ts`, `src/server/modules/auth/merchant-auth.service.test.ts`, `src/features/auth/schemas.test.ts`
- Modify: `src/features/auth/schemas.ts` (full replacement below)

**Interfaces:**
- Consumes: `createBeClient`, `BeClient`, `BeResult` (`@/lib/be/client`); `emptySchema` (`@/lib/be/envelope`); `identityClient` (`@/lib/be/services`).
- Produces (exact):
  - DTO: `otpChallengeSchema`, `loginChallengeSchema`, `tokenPairSchema`, types `OtpChallenge`, `LoginChallenge`, `TokenPair`.
  - Service (each takes an optional trailing `client: BeClient = identityClient()`): `requestLoginOtp(email, password)`, `verifyLoginOtp(requestId, otp)`, `resendOtp(requestId)`, `refreshTokens(refreshToken)`, `logoutSession(refreshToken)`.
  - Form schemas: `loginSchema` (`email`, `password`), `otpSchema`, `forgotPasswordSchema`, `newPasswordSchema`, `PASSWORD_RULE`; types `LoginInput`, `ForgotPasswordInput`.

Read first: BE contract — login body `{ email, password }`; verify body `{ requestId, otp }` (6 digits); refresh/logout body `{ refreshToken }`.

- [ ] **Step 1: Write failing tests**

`src/features/auth/schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  newPasswordSchema,
  otpSchema,
} from "@/features/auth/schemas";

describe("loginSchema", () => {
  it("trims and lower-cases the email", () => {
    const parsed = loginSchema.parse({ email: "  An@Shop.VN ", password: "x" });
    expect(parsed.email).toBe("an@shop.vn");
  });

  it("rejects a malformed email and an empty password", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain("Email không hợp lệ");
      expect(messages).toContain("Vui lòng nhập mật khẩu");
    }
  });
});

describe("otpSchema", () => {
  it("accepts exactly six digits", () => {
    expect(otpSchema.safeParse({ otp: "123456" }).success).toBe(true);
    expect(otpSchema.safeParse({ otp: "12345" }).success).toBe(false);
    expect(otpSchema.safeParse({ otp: "12a456" }).success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.vn" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "a@" }).success).toBe(false);
  });
});

describe("newPasswordSchema", () => {
  it.each([
    ["Short1!a", false],
    ["alllowercase1!x", false],
    ["ALLUPPERCASE1!X", false],
    ["NoDigitsHere!!", false],
    ["NoSpecial12345", false],
    ["Has Space1!abc", false],
    ["Valid-Pass1!x", false],
    ["ValidPass12!x", true],
  ])("validates %s", (value, expected) => {
    expect(newPasswordSchema.safeParse(value).success).toBe(expected);
  });
});
```

`src/server/modules/auth/merchant-auth.service.test.ts`:

```ts
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createBeClient } from "@/lib/be/client";
import {
  logoutSession,
  refreshTokens,
  requestLoginOtp,
  resendOtp,
  verifyLoginOtp,
} from "@/server/modules/auth/merchant-auth.service";
import { mswServer } from "@/test/msw";

const BASE = "https://identity.test";
const AUTH = `${BASE}/api/v1/merchant/auth`;
const client = createBeClient({ baseUrl: BASE });
const envelope = (data: unknown) => ({ success: true, status: "1000", message: "success", detail: "ok", data });

const challenge = {
  requestId: "req-1",
  maskedRecipient: "a***@shop.vn",
  expiresIn: 300,
  canResendAfter: 60,
  resendRemaining: 3,
};
const tokens = { accessToken: "a.b.c", expiresIn: 300, refreshToken: "r-1", refreshExpiresIn: 86400 };

describe("merchant auth service", () => {
  it("posts email and password and returns the OTP challenge", async () => {
    let body: unknown;
    mswServer.use(
      http.post(`${AUTH}/login`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(envelope({ otpRequired: true, ...challenge }));
      }),
    );
    const result = await requestLoginOtp("a@shop.vn", "Secret123!", client);
    expect(body).toEqual({ email: "a@shop.vn", password: "Secret123!" });
    expect(result).toEqual({ success: true, data: { otpRequired: true, ...challenge } });
  });

  it("surfaces the BE message for wrong credentials", async () => {
    mswServer.use(
      http.post(`${AUTH}/login`, () =>
        HttpResponse.json(
          { success: false, message: "INVALID_CREDENTIALS", detail: "Email hoặc mật khẩu không đúng" },
          { status: 401 },
        ),
      ),
    );
    const result = await requestLoginOtp("a@shop.vn", "bad", client);
    expect(result).toMatchObject({
      success: false,
      error: { code: "INVALID_CREDENTIALS", message: "Email hoặc mật khẩu không đúng" },
    });
  });

  it("exchanges requestId and otp for a token pair", async () => {
    let body: unknown;
    mswServer.use(
      http.post(`${AUTH}/login/verify-otp`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(envelope(tokens));
      }),
    );
    const result = await verifyLoginOtp("req-1", "123456", client);
    expect(body).toEqual({ requestId: "req-1", otp: "123456" });
    expect(result).toEqual({ success: true, data: tokens });
  });

  it("rejects a token pair with an empty access token", async () => {
    mswServer.use(
      http.post(`${AUTH}/login/verify-otp`, () => HttpResponse.json(envelope({ ...tokens, accessToken: "" }))),
    );
    const result = await verifyLoginOtp("req-1", "123456", client);
    expect(result).toMatchObject({ success: false, error: { code: "INVALID_RESPONSE" } });
  });

  it("resends an OTP for a request id", async () => {
    mswServer.use(http.post(`${AUTH}/otp/resend`, () => HttpResponse.json(envelope(challenge))));
    expect(await resendOtp("req-1", client)).toEqual({ success: true, data: challenge });
  });

  it("refreshes with the refresh token in the body and never sends a bearer", async () => {
    let auth: string | null = "unset";
    let body: unknown;
    mswServer.use(
      http.post(`${AUTH}/refresh`, async ({ request }) => {
        auth = request.headers.get("authorization");
        body = await request.json();
        return HttpResponse.json(envelope(tokens));
      }),
    );
    const result = await refreshTokens("r-0", client);
    expect(body).toEqual({ refreshToken: "r-0" });
    expect(auth).toBeNull();
    expect(result).toEqual({ success: true, data: tokens });
  });

  it("logs out with the refresh token", async () => {
    let body: unknown;
    mswServer.use(
      http.post(`${AUTH}/logout`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(envelope(null));
      }),
    );
    expect(await logoutSession("r-1", client)).toEqual({ success: true, data: undefined });
    expect(body).toEqual({ refreshToken: "r-1" });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/features/auth src/server/modules/auth`
Expected: FAIL — `merchant-auth.service` not found; schema exports missing.

- [ ] **Step 3: Implement**

`src/features/auth/schemas.ts` (replace entire file):

```ts
import { z } from "zod";

/** Mirrors the BE password rule (10–128 chars, upper, lower, digit, one of @$!%*?&, no other characters). */
export const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

const emailField = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập email")
  .pipe(z.email("Email không hợp lệ"))
  .transform((value) => value.toLowerCase());

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .max(128, "Mật khẩu tối đa 128 ký tự"),
});

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Mã OTP gồm 6 chữ số"),
});

export const forgotPasswordSchema = z.object({ email: emailField });

export const newPasswordSchema = z
  .string()
  .min(10, "Mật khẩu tối thiểu 10 ký tự")
  .max(128, "Mật khẩu tối đa 128 ký tự")
  .regex(
    PASSWORD_RULE,
    "Mật khẩu cần chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&), không dùng ký tự khác",
  );

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
```

`src/server/modules/auth/merchant-auth.dto.ts`:

```ts
import { z } from "zod";

export const otpChallengeSchema = z.object({
  requestId: z.string().min(1),
  maskedRecipient: z.string(),
  /** Seconds until the OTP expires. */
  expiresIn: z.number(),
  /** Seconds until a resend is allowed. */
  canResendAfter: z.number(),
  resendRemaining: z.number(),
});

export const loginChallengeSchema = otpChallengeSchema.extend({ otpRequired: z.boolean() });

export const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number(),
  refreshToken: z.string().min(1),
  refreshExpiresIn: z.number(),
});

export type OtpChallenge = z.infer<typeof otpChallengeSchema>;
export type LoginChallenge = z.infer<typeof loginChallengeSchema>;
export type TokenPair = z.infer<typeof tokenPairSchema>;
```

`src/server/modules/auth/merchant-auth.service.ts`:

```ts
import "server-only";

import type { BeClient, BeResult } from "@/lib/be/client";
import { emptySchema } from "@/lib/be/envelope";
import { identityClient } from "@/lib/be/services";
import {
  loginChallengeSchema,
  otpChallengeSchema,
  tokenPairSchema,
  type LoginChallenge,
  type OtpChallenge,
  type TokenPair,
} from "@/server/modules/auth/merchant-auth.dto";

export const MERCHANT_AUTH_PATH = "/api/v1/merchant/auth";

/** Step 1: checks the password and emails an OTP. */
export function requestLoginOtp(
  email: string,
  password: string,
  client: BeClient = identityClient(),
): Promise<BeResult<LoginChallenge>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/login`,
    body: { email, password },
    schema: loginChallengeSchema,
    auth: false,
  });
}

/** Step 2: exchanges a correct OTP for tokens. */
export function verifyLoginOtp(
  requestId: string,
  otp: string,
  client: BeClient = identityClient(),
): Promise<BeResult<TokenPair>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/login/verify-otp`,
    body: { requestId, otp },
    schema: tokenPairSchema,
    auth: false,
  });
}

/** Shared by login and password reset. */
export function resendOtp(
  requestId: string,
  client: BeClient = identityClient(),
): Promise<BeResult<OtpChallenge>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/otp/resend`,
    body: { requestId },
    schema: otpChallengeSchema,
    auth: false,
  });
}

export function refreshTokens(
  refreshToken: string,
  client: BeClient = identityClient(),
): Promise<BeResult<TokenPair>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/refresh`,
    body: { refreshToken },
    schema: tokenPairSchema,
    auth: false,
  });
}

export function logoutSession(
  refreshToken: string,
  client: BeClient = identityClient(),
): Promise<BeResult<undefined>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/logout`,
    body: { refreshToken },
    schema: emptySchema,
    auth: false,
  });
}
```

Note: existing consumers of the old `loginSchema` (`username`) — `login-action.ts` and `login-fullscreen.tsx` — are rewritten in Tasks 8–9; until then `npm run typecheck` is expected to fail only in those two files. Do not edit them here.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/features/auth src/server/modules/auth`
Expected: schemas 12 tests PASS, service 7 tests PASS. (Skip full typecheck; it fails only in the two files named above.)

- [ ] **Step 5: Commit (controller)**

```bash
git add src/features/auth/schemas.ts src/features/auth/schemas.test.ts src/server/modules/auth
git commit -m "feat(auth): add merchant login service and form schemas" -- src/features/auth/schemas.ts src/features/auth/schemas.test.ts src/server/modules/auth
```

---

## Task 4: Merchant password services

**Files:**
- Create: `src/server/modules/auth/merchant-password.service.ts`, `src/server/modules/auth/merchant-password.service.test.ts`

**Interfaces:**
- Consumes: `BeClient`, `BeResult`; `emptySchema`; `identityClient`; `otpChallengeSchema`, `OtpChallenge`; `MERCHANT_AUTH_PATH`.
- Produces (exact, each with optional trailing `client: BeClient = identityClient()`):
  - `changePassword(input: { currentPassword: string; newPassword: string; confirmPassword: string })` → `BeResult<undefined>` (sends bearer).
  - `forgotPassword(email: string)` → `BeResult<undefined>`.
  - `validateResetToken(token: string)` → `BeResult<{ valid: boolean; maskedEmail?: string | null }>`.
  - `requestResetOtp(input: { token: string; newPassword: string; confirmPassword: string })` → `BeResult<OtpChallenge>`.
  - `confirmResetOtp(requestId: string, otp: string)` → `BeResult<undefined>`.
  - `FORGOT_PASSWORD_MESSAGE` constant (generic, non-enumerating).

- [ ] **Step 1: Write the failing test**

`src/server/modules/auth/merchant-password.service.test.ts`:

```ts
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createBeClient } from "@/lib/be/client";
import {
  changePassword,
  confirmResetOtp,
  forgotPassword,
  requestResetOtp,
  validateResetToken,
} from "@/server/modules/auth/merchant-password.service";
import { mswServer } from "@/test/msw";

const BASE = "https://identity.test";
const AUTH = `${BASE}/api/v1/merchant/auth`;
const client = createBeClient({ baseUrl: BASE, getAccessToken: async () => "tok-1" });
const envelope = (data: unknown) => ({ success: true, status: "1000", message: "success", detail: "ok", data });

describe("merchant password service", () => {
  it("changes the password with the bearer token", async () => {
    let auth: string | null = null;
    let body: unknown;
    mswServer.use(
      http.post(`${AUTH}/change-password`, async ({ request }) => {
        auth = request.headers.get("authorization");
        body = await request.json();
        return HttpResponse.json(envelope(null));
      }),
    );
    const input = { currentPassword: "Old-pass1!", newPassword: "NewPass12!x", confirmPassword: "NewPass12!x" };
    expect(await changePassword(input, client)).toEqual({ success: true, data: undefined });
    expect(auth).toBe("Bearer tok-1");
    expect(body).toEqual(input);
  });

  it("surfaces the BE message when the current password is wrong", async () => {
    mswServer.use(
      http.post(`${AUTH}/change-password`, () =>
        HttpResponse.json(
          { success: false, message: "INVALID_PASSWORD", detail: "Mật khẩu hiện tại không đúng" },
          { status: 400 },
        ),
      ),
    );
    const result = await changePassword(
      { currentPassword: "bad", newPassword: "NewPass12!x", confirmPassword: "NewPass12!x" },
      client,
    );
    expect(result).toMatchObject({ success: false, error: { message: "Mật khẩu hiện tại không đúng" } });
  });

  it("requests a reset link without a bearer token", async () => {
    let auth: string | null = "unset";
    mswServer.use(
      http.post(`${AUTH}/forgot-password`, ({ request }) => {
        auth = request.headers.get("authorization");
        return HttpResponse.json({ success: true, message: "success", detail: "Nếu email tồn tại..." });
      }),
    );
    expect(await forgotPassword("a@shop.vn", client)).toEqual({ success: true, data: undefined });
    expect(auth).toBeNull();
  });

  it("validates a reset token through the query string", async () => {
    let token: string | null = null;
    mswServer.use(
      http.get(`${AUTH}/reset-password/validate`, ({ request }) => {
        token = new URL(request.url).searchParams.get("token");
        return HttpResponse.json(envelope({ valid: true, maskedEmail: "a***@shop.vn" }));
      }),
    );
    const result = await validateResetToken("tkn 1", client);
    expect(token).toBe("tkn 1");
    expect(result).toEqual({ success: true, data: { valid: true, maskedEmail: "a***@shop.vn" } });
  });

  it("starts a reset and confirms it with the OTP", async () => {
    const challenge = { requestId: "r-9", maskedRecipient: "a***@shop.vn", expiresIn: 300, canResendAfter: 60, resendRemaining: 3 };
    mswServer.use(
      http.post(`${AUTH}/reset-password`, () => HttpResponse.json(envelope(challenge))),
      http.post(`${AUTH}/reset-password/verify-otp`, () => HttpResponse.json(envelope(null))),
    );
    const started = await requestResetOtp(
      { token: "t", newPassword: "NewPass12!x", confirmPassword: "NewPass12!x" },
      client,
    );
    expect(started).toEqual({ success: true, data: challenge });
    expect(await confirmResetOtp("r-9", "123456", client)).toEqual({ success: true, data: undefined });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/server/modules/auth/merchant-password.service.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/server/modules/auth/merchant-password.service.ts`:

```ts
import "server-only";
import { z } from "zod";

import type { BeClient, BeResult } from "@/lib/be/client";
import { emptySchema } from "@/lib/be/envelope";
import { identityClient } from "@/lib/be/services";
import {
  otpChallengeSchema,
  type OtpChallenge,
} from "@/server/modules/auth/merchant-auth.dto";
import { MERCHANT_AUTH_PATH } from "@/server/modules/auth/merchant-auth.service";

/** Shown after a forgot-password request whether or not the email exists. */
export const FORGOT_PASSWORD_MESSAGE =
  "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu.";

const resetTokenSchema = z.object({
  valid: z.boolean(),
  maskedEmail: z.string().nullish(),
});

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export function changePassword(
  input: ChangePasswordInput,
  client: BeClient = identityClient(),
): Promise<BeResult<undefined>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/change-password`,
    body: input,
    schema: emptySchema,
  });
}

export function forgotPassword(
  email: string,
  client: BeClient = identityClient(),
): Promise<BeResult<undefined>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/forgot-password`,
    body: { email },
    schema: emptySchema,
    auth: false,
  });
}

export function validateResetToken(
  token: string,
  client: BeClient = identityClient(),
): Promise<BeResult<z.infer<typeof resetTokenSchema>>> {
  return client.get({
    path: `${MERCHANT_AUTH_PATH}/reset-password/validate`,
    query: { token },
    schema: resetTokenSchema,
    auth: false,
  });
}

export function requestResetOtp(
  input: ResetPasswordInput,
  client: BeClient = identityClient(),
): Promise<BeResult<OtpChallenge>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/reset-password`,
    body: input,
    schema: otpChallengeSchema,
    auth: false,
  });
}

export function confirmResetOtp(
  requestId: string,
  otp: string,
  client: BeClient = identityClient(),
): Promise<BeResult<undefined>> {
  return client.post({
    path: `${MERCHANT_AUTH_PATH}/reset-password/verify-otp`,
    body: { requestId, otp },
    schema: emptySchema,
    auth: false,
  });
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/server/modules/auth`
Expected: 12 tests PASS (7 + 5).

- [ ] **Step 5: Commit (controller)**

```bash
git add src/server/modules/auth/merchant-password.service.ts src/server/modules/auth/merchant-password.service.test.ts
git commit -m "feat(auth): add merchant password services" -- src/server/modules/auth/merchant-password.service.ts src/server/modules/auth/merchant-password.service.test.ts
```

---

## Task 5: Session model, permissions and `/me`

**Files:**
- Create: `src/features/auth/permissions.ts`, `src/features/auth/permissions.test.ts`, `src/features/auth/utils/session-mapper.ts`, `src/features/auth/utils/session-mapper.test.ts`, `src/server/modules/auth/merchant-session.service.ts`, `src/server/modules/auth/merchant-session.service.test.ts`, `src/lib/auth/session-cookies.test.ts`
- Modify: `src/features/auth/schemas.ts` (append `meResponseSchema`), `src/types/auth.ts`, `src/features/auth/types.ts`, `src/lib/auth/jwt.ts`, `src/lib/auth/session-cookies.ts`, `src/lib/auth/session.ts`

**Interfaces:**
- Consumes: `merchantClient`, `BeClient`, `BeResult`; `decodeJwtPayload`, `isTokenExpired`; `TokenPair` (Task 3); `fakeJwt` (Task 1).
- Produces (exact):
  - `MERCHANT_PERMISSIONS` (27-name readonly tuple), `type MerchantPermission`, `isMerchantPermission(value: string): value is MerchantPermission`, `hasPermission(permissions: readonly MerchantPermission[], required: MerchantPermission): boolean`, `hasAnyPermission(permissions, required: readonly MerchantPermission[]): boolean`.
  - `type MerchantUserStatus = "PENDING" | "ACTIVE" | "LOCKED"`.
  - `SessionUser` (see Step 3) and `toSessionUser(me: MeResponse): SessionUser`; `meResponseSchema`, `type MeResponse`.
  - `fetchMerchantSession(client?: BeClient): Promise<BeResult<SessionUser>>`.
  - `type CookieSpec`, `buildSessionCookies(tokens: TokenPair, opts: { secure: boolean; nowMs?: number }): CookieSpec[]`, `writeSessionCookies(tokens: TokenPair): Promise<void>`, `clearSessionCookies(): Promise<void>`.
  - `getServerSession(): Promise<SessionUser | null>` and re-exported `getAccessToken`.

Read first: `src/lib/auth/jwt.ts`, `src/lib/auth/session.ts`, `src/types/auth.ts`; Next docs `cookies.md`.

- [ ] **Step 1: Write failing tests**

`src/features/auth/permissions.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  MERCHANT_PERMISSIONS,
  hasAnyPermission,
  hasPermission,
  isMerchantPermission,
} from "@/features/auth/permissions";

describe("merchant permissions", () => {
  it("lists the 27 permissions the BE defines", () => {
    expect(MERCHANT_PERMISSIONS).toHaveLength(27);
    expect(new Set(MERCHANT_PERMISSIONS).size).toBe(27);
  });

  it("recognises known names and rejects unknown ones", () => {
    expect(isMerchantPermission("VIEW_AUDIT_LOG")).toBe(true);
    expect(isMerchantPermission("FUTURE_PERMISSION")).toBe(false);
  });

  it("checks single and any-of permissions", () => {
    const granted = ["VIEW_ORDER", "MANAGE_USER"] as const;
    expect(hasPermission(granted, "MANAGE_USER")).toBe(true);
    expect(hasPermission(granted, "VIEW_REFUND")).toBe(false);
    expect(hasAnyPermission(granted, ["VIEW_REFUND", "VIEW_ORDER"])).toBe(true);
    expect(hasAnyPermission([], ["VIEW_ORDER"])).toBe(false);
  });
});
```

`src/features/auth/utils/session-mapper.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { meResponseSchema } from "@/features/auth/schemas";
import { toSessionUser } from "@/features/auth/utils/session-mapper";

const base = {
  merchantUserId: "u-1",
  email: "an@shop.vn",
  fullName: "Nguyễn An",
  status: "ACTIVE",
  merchantIds: ["m-1"],
  subMerchantIds: ["s-1", "s-2"],
  permissions: ["VIEW_ORDER", "MANAGE_USER"],
  authorizationVersion: 7,
};

describe("toSessionUser", () => {
  it("maps the /me payload to a session user", () => {
    const session = toSessionUser(meResponseSchema.parse(base));
    expect(session).toMatchObject({
      userId: "u-1",
      username: "Nguyễn An",
      fullName: "Nguyễn An",
      email: "an@shop.vn",
      status: "ACTIVE",
      merchantIds: ["m-1"],
      subMerchantIds: ["s-1", "s-2"],
      permissions: ["VIEW_ORDER", "MANAGE_USER"],
      authorizationVersion: 7,
    });
  });

  it("drops permission names the frontend does not know", () => {
    const session = toSessionUser(
      meResponseSchema.parse({ ...base, permissions: ["VIEW_ORDER", "FUTURE_PERMISSION"] }),
    );
    expect(session.permissions).toEqual(["VIEW_ORDER"]);
  });

  it("treats an unknown status as LOCKED", () => {
    const session = toSessionUser(meResponseSchema.parse({ ...base, status: "SUSPENDED" }));
    expect(session.status).toBe("LOCKED");
  });

  it("falls back to the email, then the id, for the display name", () => {
    expect(
      toSessionUser(meResponseSchema.parse({ ...base, fullName: "  " })).username,
    ).toBe("an@shop.vn");
    expect(
      toSessionUser(meResponseSchema.parse({ ...base, fullName: null, email: null })).username,
    ).toBe("u-1");
  });
});
```

`src/lib/auth/session-cookies.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { buildSessionCookies } from "@/lib/auth/session-cookies";
import { fakeJwt } from "@/test/jwt";

const NOW_MS = 1_700_000_000_000;
const nowSeconds = NOW_MS / 1000;

describe("buildSessionCookies", () => {
  it("expires the access cookie with the JWT exp and the refresh cookie with refreshExpiresIn", () => {
    const accessToken = fakeJwt({ exp: nowSeconds + 300 });
    const [access, refresh] = buildSessionCookies(
      { accessToken, expiresIn: 9999, refreshToken: "r-1", refreshExpiresIn: 86_400 },
      { secure: true, nowMs: NOW_MS },
    );
    expect(access).toMatchObject({
      name: "access_token",
      value: accessToken,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true, maxAge: 300 },
    });
    expect(refresh).toMatchObject({
      name: "refresh_token",
      value: "r-1",
      options: { httpOnly: true, secure: true, maxAge: 86_400 },
    });
  });

  it("never produces a negative maxAge for an already expired token", () => {
    const [access] = buildSessionCookies(
      { accessToken: fakeJwt({ exp: nowSeconds - 10 }), expiresIn: 300, refreshToken: "r", refreshExpiresIn: 60 },
      { secure: false, nowMs: NOW_MS },
    );
    expect(access?.options.maxAge).toBe(0);
  });

  it("falls back to expiresIn when the token has no readable exp", () => {
    const [access] = buildSessionCookies(
      { accessToken: "opaque-token", expiresIn: 120, refreshToken: "r", refreshExpiresIn: 60 },
      { secure: false, nowMs: NOW_MS },
    );
    expect(access?.options.maxAge).toBe(120);
  });
});
```

`src/server/modules/auth/merchant-session.service.test.ts`:

```ts
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createBeClient } from "@/lib/be/client";
import { fetchMerchantSession } from "@/server/modules/auth/merchant-session.service";
import { mswServer } from "@/test/msw";

const BASE = "https://merchant.test";
const client = createBeClient({ baseUrl: BASE, getAccessToken: async () => "tok-1" });

describe("fetchMerchantSession", () => {
  it("loads /merchant/me with the bearer token and maps it", async () => {
    let auth: string | null = null;
    mswServer.use(
      http.get(`${BASE}/api/v1/merchant/me`, ({ request }) => {
        auth = request.headers.get("authorization");
        return HttpResponse.json({
          success: true,
          message: "success",
          data: {
            merchantUserId: "u-1",
            email: "an@shop.vn",
            fullName: "An",
            status: "ACTIVE",
            merchantIds: [],
            subMerchantIds: [],
            permissions: ["VIEW_ORDER"],
            authorizationVersion: 1,
          },
        });
      }),
    );
    const result = await fetchMerchantSession(client);
    expect(auth).toBe("Bearer tok-1");
    expect(result).toMatchObject({ success: true, data: { userId: "u-1", permissions: ["VIEW_ORDER"] } });
  });

  it("returns the BE error for an expired token", async () => {
    mswServer.use(
      http.get(`${BASE}/api/v1/merchant/me`, () => HttpResponse.json({ message: "UNAUTHORIZED" }, { status: 401 })),
    );
    const result = await fetchMerchantSession(client);
    expect(result).toMatchObject({ success: false, error: { status: 401 } });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/features/auth src/lib/auth src/server/modules/auth/merchant-session.service.test.ts`
Expected: FAIL — new modules/exports missing.

- [ ] **Step 3: Implement**

`src/features/auth/permissions.ts`:

```ts
/** Mirrors the BE `MerchantPermission` enum (27 names, 7 groups). */
export const MERCHANT_PERMISSIONS = [
  "VIEW_TRANSACTION",
  "EXPORT_TRANSACTION",
  "CREATE_REFUND",
  "CANCEL_REFUND",
  "APPROVE_REFUND",
  "VIEW_REFUND",
  "CREATE_DISPUTE",
  "REPLY_DISPUTE",
  "VIEW_DISPUTE",
  "CREATE_ORDER",
  "CANCEL_ORDER",
  "VIEW_ORDER",
  "CONFIRM_ORDER",
  "CREATE_WITHDRAWAL",
  "VIEW_WITHDRAWAL",
  "EXPORT_WITHDRAWAL",
  "VIEW_BALANCE",
  "EXPORT_BALANCE",
  "VIEW_AUDIT_LOG",
  "MANAGE_USER",
  "MANAGE_SUB_MERCHANT",
  "MANAGE_PERMISSION_GROUP",
  "VIEW_WALLET",
  "TOPUP_WALLET",
  "WITHDRAW_WALLET",
  "TRANSFER_WALLET",
  "EXPORT_WALLET_STATEMENT",
] as const;

export type MerchantPermission = (typeof MERCHANT_PERMISSIONS)[number];

const KNOWN = new Set<string>(MERCHANT_PERMISSIONS);

export function isMerchantPermission(value: string): value is MerchantPermission {
  return KNOWN.has(value);
}

export function hasPermission(
  permissions: readonly MerchantPermission[],
  required: MerchantPermission,
): boolean {
  return permissions.includes(required);
}

export function hasAnyPermission(
  permissions: readonly MerchantPermission[],
  required: readonly MerchantPermission[],
): boolean {
  return required.some((permission) => permissions.includes(permission));
}
```

`src/types/auth.ts` (replace entire file):

```ts
import type { MerchantPermission } from "@/features/auth/permissions";

export type UserRole = "ACCOUNTANT" | "OPERATOR" | "SUPER_ADMIN" | string;

export type MerchantUserStatus = "PENDING" | "ACTIVE" | "LOCKED";

export interface SessionUser {
  /** BE `merchantUserId`. */
  userId: string;
  /** Display name: full name, falling back to email, then id. */
  username: string;
  fullName?: string;
  email?: string;
  phone?: string;
  status: MerchantUserStatus;
  merchantIds: string[];
  subMerchantIds: string[];
  permissions: MerchantPermission[];
  authorizationVersion: number;
  /** Legacy fields kept optional until the Đợt 2 account/user plans remove their consumers. */
  permissionGroupId?: string;
  permissionName?: string;
  subMerchantScope?: string;
  assignedSubMerchantsIds?: string[];
  createdAt?: string;
}

/** Claims the frontend reads from the access token (never used to authenticate). */
export interface JwtPayload {
  exp: number;
  iat?: number;
  sub?: string;
}
```

`src/features/auth/types.ts` (replace entire file):

```ts
export type { LoginInput } from "@/features/auth/schemas";
export type { SessionUser, UserRole, MerchantUserStatus } from "@/types/auth";
```

`src/lib/auth/jwt.ts`: keep both functions; in `decodeJwtPayload`, replace the final guard with a check that `exp` is a number:

```ts
    if (typeof payload !== "object" || !payload || typeof payload.exp !== "number") return null;
    return payload;
```

Append to `src/features/auth/schemas.ts`:

```ts
export const meResponseSchema = z.object({
  merchantUserId: z.string(),
  email: z.string().nullish(),
  fullName: z.string().nullish(),
  status: z.enum(["PENDING", "ACTIVE", "LOCKED"]).catch("LOCKED"),
  merchantIds: z.array(z.string()),
  subMerchantIds: z.array(z.string()),
  permissions: z.array(z.string()),
  authorizationVersion: z.number(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;
```

`src/features/auth/utils/session-mapper.ts`:

```ts
import { isMerchantPermission } from "@/features/auth/permissions";
import type { MeResponse } from "@/features/auth/schemas";
import type { SessionUser } from "@/types/auth";

export function toSessionUser(me: MeResponse): SessionUser {
  const fullName = me.fullName?.trim() || undefined;
  const email = me.email ?? undefined;
  return {
    userId: me.merchantUserId,
    username: fullName ?? email ?? me.merchantUserId,
    fullName,
    email,
    status: me.status,
    merchantIds: me.merchantIds,
    subMerchantIds: me.subMerchantIds,
    permissions: me.permissions.filter(isMerchantPermission),
    authorizationVersion: me.authorizationVersion,
  };
}
```

`src/server/modules/auth/merchant-session.service.ts`:

```ts
import "server-only";

import { meResponseSchema } from "@/features/auth/schemas";
import { toSessionUser } from "@/features/auth/utils/session-mapper";
import type { BeClient, BeResult } from "@/lib/be/client";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { SessionUser } from "@/types/auth";

export async function fetchMerchantSession(
  client: BeClient = merchantClient(),
): Promise<BeResult<SessionUser>> {
  const result = await client.get({ path: "/api/v1/merchant/me", schema: meResponseSchema });
  return result.success ? ok(toSessionUser(result.data)) : result;
}
```

`src/lib/auth/session-cookies.ts` (replace entire file):

```ts
import "server-only";
import { cookies } from "next/headers";

import { AUTH_COOKIES, COOKIE_OPTIONS } from "@/lib/auth/cookies";
import { decodeJwtPayload } from "@/lib/auth/jwt";
import type { TokenPair } from "@/server/modules/auth/merchant-auth.dto";

export interface CookieSpec {
  name: string;
  value: string;
  options: { httpOnly: true; sameSite: "lax"; path: string; secure: boolean; maxAge: number };
}

export async function readAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIES.ACCESS_TOKEN)?.value ?? null;
}

export async function readRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIES.REFRESH_TOKEN)?.value ?? null;
}

function accessMaxAge(tokens: TokenPair, nowMs: number): number {
  const payload = decodeJwtPayload(tokens.accessToken);
  if (!payload) return tokens.expiresIn;
  return Math.max(0, Math.floor(payload.exp - nowMs / 1000));
}

/** Pure: the cookies to set after a login or refresh. The access cookie lives exactly as long as the token. */
export function buildSessionCookies(
  tokens: TokenPair,
  options: { secure: boolean; nowMs?: number },
): CookieSpec[] {
  const base = { ...COOKIE_OPTIONS, httpOnly: true as const, secure: options.secure };
  return [
    {
      name: AUTH_COOKIES.ACCESS_TOKEN,
      value: tokens.accessToken,
      options: { ...base, maxAge: accessMaxAge(tokens, options.nowMs ?? Date.now()) },
    },
    {
      name: AUTH_COOKIES.REFRESH_TOKEN,
      value: tokens.refreshToken,
      options: { ...base, maxAge: tokens.refreshExpiresIn },
    },
  ];
}

export async function writeSessionCookies(tokens: TokenPair): Promise<void> {
  const store = await cookies();
  const specs = buildSessionCookies(tokens, { secure: process.env.NODE_ENV === "production" });
  for (const spec of specs) store.set(spec.name, spec.value, spec.options);
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIES.ACCESS_TOKEN);
  store.delete(AUTH_COOKIES.REFRESH_TOKEN);
}
```

`src/lib/auth/session.ts` (replace entire file):

```ts
import "server-only";
import { cache } from "react";

import { decodeJwtPayload, isTokenExpired } from "@/lib/auth/jwt";
import { readAccessToken } from "@/lib/auth/session-cookies";
import { fetchMerchantSession } from "@/server/modules/auth/merchant-session.service";

import type { SessionUser } from "@/types/auth";

export { readAccessToken as getAccessToken } from "@/lib/auth/session-cookies";

/**
 * The signed-in merchant user, loaded from the BE `/me` once per request.
 * Returns null when there is no usable token or the BE rejects it.
 */
export const getServerSession = cache(async (): Promise<SessionUser | null> => {
  const token = await readAccessToken();
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload || isTokenExpired(payload)) return null;

  const result = await fetchMerchantSession();
  if (!result.success) {
    console.error("[session] /merchant/me failed", result.error.code);
    return null;
  }
  return result.data;
});
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/features/auth src/lib/auth src/server/modules/auth && npm run typecheck`
Expected: all new tests PASS. Typecheck may still fail only in `login-action.ts`, `login-fullscreen.tsx`, `lib/auth/services/auth-service.ts` and routes that import the old mock auth (rewritten in Tasks 8–9). If it fails anywhere else, fix before continuing.

- [ ] **Step 5: Commit (controller)**

```bash
git add src/features/auth src/types/auth.ts src/lib/auth src/server/modules/auth
git commit -m "feat(auth): load the merchant session from /me with permission model" -- src/features/auth src/types/auth.ts src/lib/auth src/server/modules/auth
```

---

## Task 6: Auto-refresh in `proxy.ts`

**Files:**
- Create: `src/lib/auth/auth-routing.ts`, `src/lib/auth/auth-routing.test.ts`, `src/proxy.test.ts`
- Modify: `src/server/modules/auth/merchant-auth.service.ts` (add `refreshTokensOnce`), `src/server/modules/auth/merchant-auth.service.test.ts` (add test), `src/proxy.ts`

**Interfaces:**
- Consumes: `refreshTokens`, `TokenPair`; `buildSessionCookies`, `CookieSpec`; `AUTH_COOKIES`.
- Produces (exact):
  - `type AuthAction = "allow" | "redirect-login" | "redirect-dashboard" | "refresh"`; `decideAuthAction(input: { pathname: string; hasAccessToken: boolean; hasRefreshToken: boolean }): AuthAction`; `mergeCookieHeader(existing: string | null, updates: ReadonlyArray<{ name: string; value: string }>): string`.
  - `refreshTokensOnce(refreshToken: string, client?: BeClient): Promise<BeResult<TokenPair>>` — concurrent calls with the same token share one BE request.
  - `proxy(request: NextRequest): Promise<NextResponse>` (named export, unchanged name).

Read first: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` (locate the real path with `ls`/`find`; confirm `NextResponse.next({ request: { headers } })` and that `proxy` may be async). Existing `src/proxy.ts` CORS handling must be preserved.

- [ ] **Step 1: Write failing tests**

`src/lib/auth/auth-routing.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { decideAuthAction, mergeCookieHeader } from "@/lib/auth/auth-routing";

describe("decideAuthAction", () => {
  it.each([
    ["/dashboard", true, false, "allow"],
    ["/dashboard", true, true, "allow"],
    ["/login", true, false, "redirect-dashboard"],
    ["/dashboard", false, true, "refresh"],
    ["/login", false, true, "refresh"],
    ["/dashboard", false, false, "redirect-login"],
    ["/login", false, false, "allow"],
  ])("%s access=%s refresh=%s → %s", (pathname, hasAccessToken, hasRefreshToken, expected) => {
    expect(decideAuthAction({ pathname, hasAccessToken, hasRefreshToken })).toBe(expected);
  });
});

describe("mergeCookieHeader", () => {
  it("replaces existing cookies, appends new ones and keeps the rest", () => {
    const merged = mergeCookieHeader("theme=dark; refresh_token=old; a=b", [
      { name: "refresh_token", value: "new" },
      { name: "access_token", value: "tok" },
    ]);
    expect(merged.split("; ").sort()).toEqual(
      ["a=b", "access_token=tok", "refresh_token=new", "theme=dark"].sort(),
    );
  });

  it("works with no existing header", () => {
    expect(mergeCookieHeader(null, [{ name: "a", value: "1" }])).toBe("a=1");
  });
});
```

Append to `src/server/modules/auth/merchant-auth.service.test.ts` (add `refreshTokensOnce` to the import list):

```ts
describe("refreshTokensOnce", () => {
  it("shares one BE call between concurrent refreshes of the same token", async () => {
    let calls = 0;
    mswServer.use(
      http.post(`${AUTH}/refresh`, async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json(envelope(tokens));
      }),
    );
    const [first, second] = await Promise.all([
      refreshTokensOnce("r-same", client),
      refreshTokensOnce("r-same", client),
    ]);
    expect(calls).toBe(1);
    expect(first).toEqual(second);

    await refreshTokensOnce("r-same", client);
    expect(calls).toBe(2);
  });
});
```

`src/proxy.test.ts`:

```ts
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mswServer } from "@/test/msw";
import { fakeJwt } from "@/test/jwt";

const AUTH = "https://identity.test/api/v1/merchant/auth";
const accessToken = fakeJwt({ exp: Math.floor(Date.now() / 1000) + 300 });
const tokens = { accessToken, expiresIn: 300, refreshToken: "r-new", refreshExpiresIn: 86_400 };
const envelope = (data: unknown) => ({ success: true, message: "success", data });

function request(path: string, cookie?: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

async function loadProxy() {
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.resetModules();
  return (await import("@/proxy")).proxy;
}

describe("proxy", () => {
  beforeEach(() => vi.resetModules());

  it("redirects anonymous users to /login with a callback", async () => {
    const proxy = await loadProxy();
    const response = await proxy(request("/orders?page=2"));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("callbackUrl")).toBe("/orders?page=2");
  });

  it("refreshes silently when only the refresh cookie is present", async () => {
    mswServer.use(http.post(`${AUTH}/refresh`, () => HttpResponse.json(envelope(tokens))));
    const proxy = await loadProxy();
    const response = await proxy(request("/dashboard", "refresh_token=r-old"));
    expect(response.status).toBe(200);
    expect(response.cookies.get("access_token")?.value).toBe(accessToken);
    expect(response.cookies.get("refresh_token")?.value).toBe("r-new");
  });

  it("clears the cookies and redirects when the refresh is rejected", async () => {
    mswServer.use(
      http.post(`${AUTH}/refresh`, () =>
        HttpResponse.json({ success: false, message: "INVALID_TOKEN" }, { status: 401 }),
      ),
    );
    const proxy = await loadProxy();
    const response = await proxy(request("/dashboard", "refresh_token=r-old"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/login");
    expect(response.cookies.get("refresh_token")?.value).toBe("");
  });

  it("sends a user with a refresh cookie on /login to the dashboard after refreshing", async () => {
    mswServer.use(http.post(`${AUTH}/refresh`, () => HttpResponse.json(envelope(tokens))));
    const proxy = await loadProxy();
    const response = await proxy(request("/login", "refresh_token=r-old"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/dashboard");
    expect(response.cookies.get("access_token")?.value).toBe(accessToken);
  });

  it("answers CORS preflight for API routes without touching auth", async () => {
    const proxy = await loadProxy();
    const response = await proxy(
      new NextRequest("http://localhost:3000/api/v1/anything", {
        method: "OPTIONS",
        headers: { origin: "http://localhost:3000" },
      }),
    );
    expect(response.status).toBe(204);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/auth/auth-routing.test.ts src/proxy.test.ts src/server/modules/auth/merchant-auth.service.test.ts`
Expected: FAIL — `auth-routing` missing, `refreshTokensOnce` not exported, proxy still sync/old.

- [ ] **Step 3: Implement**

`src/lib/auth/auth-routing.ts`:

```ts
export type AuthAction = "allow" | "redirect-login" | "redirect-dashboard" | "refresh";

export const LOGIN_PATH = "/login";
export const DASHBOARD_PATH = "/dashboard";

const PUBLIC_PATHS: ReadonlySet<string> = new Set([LOGIN_PATH]);

export function decideAuthAction(input: {
  pathname: string;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
}): AuthAction {
  if (input.hasAccessToken) {
    return input.pathname === LOGIN_PATH ? "redirect-dashboard" : "allow";
  }
  if (input.hasRefreshToken) return "refresh";
  return PUBLIC_PATHS.has(input.pathname) ? "allow" : "redirect-login";
}

/** Returns a `Cookie` header with `updates` applied over `existing`. */
export function mergeCookieHeader(
  existing: string | null,
  updates: ReadonlyArray<{ name: string; value: string }>,
): string {
  const jar = new Map<string, string>();
  for (const part of (existing ?? "").split(";")) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator > 0) jar.set(trimmed.slice(0, separator), trimmed.slice(separator + 1));
  }
  for (const update of updates) jar.set(update.name, update.value);
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}
```

Append to `src/server/modules/auth/merchant-auth.service.ts`:

```ts
const inflightRefreshes = new Map<string, Promise<BeResult<TokenPair>>>();

/**
 * Refresh tokens may rotate, so two parallel requests (prefetch + navigation) must not both spend
 * the same token. Concurrent calls with the same token share one BE request.
 */
export function refreshTokensOnce(
  refreshToken: string,
  client: BeClient = identityClient(),
): Promise<BeResult<TokenPair>> {
  const pending = inflightRefreshes.get(refreshToken);
  if (pending) return pending;
  const started = refreshTokens(refreshToken, client).finally(() => {
    inflightRefreshes.delete(refreshToken);
  });
  inflightRefreshes.set(refreshToken, started);
  return started;
}
```

`src/proxy.ts` (replace entire file; keep the original `handleCors` body exactly as it is today and paste it where marked):

```ts
import { NextResponse, type NextRequest } from "next/server";

import {
  DASHBOARD_PATH,
  LOGIN_PATH,
  decideAuthAction,
  mergeCookieHeader,
} from "@/lib/auth/auth-routing";
import { AUTH_COOKIES } from "@/lib/auth/cookies";
import { buildSessionCookies, type CookieSpec } from "@/lib/auth/session-cookies";
import { refreshTokensOnce } from "@/server/modules/auth/merchant-auth.service";

// handleCors(request): keep the existing implementation from the current src/proxy.ts unchanged.

function redirectTo(request: NextRequest, pathname: string, callbackUrl?: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (callbackUrl) url.searchParams.set("callbackUrl", callbackUrl);
  return NextResponse.redirect(url);
}

function applyCookies(response: NextResponse, specs: CookieSpec[]): NextResponse {
  for (const spec of specs) response.cookies.set(spec.name, spec.value, spec.options);
  return response;
}

function clearCookies(response: NextResponse): NextResponse {
  response.cookies.delete(AUTH_COOKIES.ACCESS_TOKEN);
  response.cookies.delete(AUTH_COOKIES.REFRESH_TOKEN);
  return response;
}

async function handleRefresh(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const refreshToken = request.cookies.get(AUTH_COOKIES.REFRESH_TOKEN)?.value ?? "";
  const result = await refreshTokensOnce(refreshToken);

  if (!result.success) {
    const response =
      pathname === LOGIN_PATH ? NextResponse.next() : redirectTo(request, LOGIN_PATH, pathname + search);
    return clearCookies(response);
  }

  const specs = buildSessionCookies(result.data, { secure: process.env.NODE_ENV === "production" });
  if (pathname === LOGIN_PATH) return applyCookies(redirectTo(request, DASHBOARD_PATH), specs);

  const headers = new Headers(request.headers);
  headers.set("cookie", mergeCookieHeader(request.headers.get("cookie"), specs));
  return applyCookies(NextResponse.next({ request: { headers } }), specs);
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return handleCors(request) ?? NextResponse.next();
  }

  const action = decideAuthAction({
    pathname,
    hasAccessToken: Boolean(request.cookies.get(AUTH_COOKIES.ACCESS_TOKEN)?.value),
    hasRefreshToken: Boolean(request.cookies.get(AUTH_COOKIES.REFRESH_TOKEN)?.value),
  });

  switch (action) {
    case "allow":
      return NextResponse.next();
    case "redirect-dashboard":
      return redirectTo(request, DASHBOARD_PATH);
    case "redirect-login":
      return redirectTo(request, LOGIN_PATH, pathname + search);
    case "refresh":
      return handleRefresh(request);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/auth src/proxy.test.ts src/server/modules/auth && npm run lint`
Expected: PASS (routing 9, proxy 5, auth service 8). If `proxy.test.ts` cannot decode `response.cookies` for `NextResponse.next({ request })`, keep the assertions but read the cookie via `response.headers.getSetCookie()` instead; do not weaken what is asserted.

- [ ] **Step 5: Commit (controller)**

```bash
git add src/lib/auth/auth-routing.ts src/lib/auth/auth-routing.test.ts src/proxy.ts src/proxy.test.ts src/server/modules/auth
git commit -m "feat(auth): refresh the session silently in proxy" -- src/lib/auth/auth-routing.ts src/lib/auth/auth-routing.test.ts src/proxy.ts src/proxy.test.ts src/server/modules/auth
```

---

## Task 7: Browser 401 → refresh → retry

**Files:**
- Create: `src/lib/http/api-client.test.ts`
- Modify: `src/lib/http/api-client.ts`

**Interfaces:**
- Produces: `apiClient` unchanged API; new export `setSessionExpiredHandler(handler: () => void): void` (default handler: `window.location.assign("/api/v1/admin/auth/session-expired")`).
- Behavior: in the browser, a `401` on any path except `/v1/admin/auth/*` triggers one shared `POST /api/v1/admin/auth/refresh`; on success the original request is retried once; on failure the session-expired handler runs and an `ApiError(401)` is thrown. Server-side behavior is unchanged.

Read first: current `src/lib/http/api-client.ts` (shown in repo).

- [ ] **Step 1: Write the failing test**

`src/lib/http/api-client.test.ts`:

```ts
// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiClient, setSessionExpiredHandler } from "@/lib/http/api-client";
import { mswServer } from "@/test/msw";

const ORIGIN = window.location.origin;

describe("apiClient 401 handling in the browser", () => {
  const expired = vi.fn();

  beforeEach(() => {
    expired.mockReset();
    setSessionExpiredHandler(expired);
  });

  it("refreshes once and retries the original request", async () => {
    let attempts = 0;
    let refreshes = 0;
    mswServer.use(
      http.get(`${ORIGIN}/api/v1/things`, () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json({ message: "Unauthorized" }, { status: 401 })
          : HttpResponse.json({ ok: true });
      }),
      http.post(`${ORIGIN}/api/v1/admin/auth/refresh`, () => {
        refreshes += 1;
        return HttpResponse.json({ userId: "u" });
      }),
    );
    await expect(apiClient.get("/v1/things")).resolves.toEqual({ ok: true });
    expect(refreshes).toBe(1);
    expect(attempts).toBe(2);
    expect(expired).not.toHaveBeenCalled();
  });

  it("shares one refresh between parallel 401s", async () => {
    let refreshes = 0;
    const seen = new Set<string>();
    mswServer.use(
      http.get(`${ORIGIN}/api/v1/a`, ({ request }) =>
        seen.has(request.url) ? HttpResponse.json({ ok: "a" }) : (seen.add(request.url), HttpResponse.json({}, { status: 401 })),
      ),
      http.get(`${ORIGIN}/api/v1/b`, ({ request }) =>
        seen.has(request.url) ? HttpResponse.json({ ok: "b" }) : (seen.add(request.url), HttpResponse.json({}, { status: 401 })),
      ),
      http.post(`${ORIGIN}/api/v1/admin/auth/refresh`, async () => {
        refreshes += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({});
      }),
    );
    await Promise.all([apiClient.get("/v1/a"), apiClient.get("/v1/b")]);
    expect(refreshes).toBe(1);
  });

  it("signals session expiry and throws when the refresh fails", async () => {
    mswServer.use(
      http.get(`${ORIGIN}/api/v1/things`, () => HttpResponse.json({}, { status: 401 })),
      http.post(`${ORIGIN}/api/v1/admin/auth/refresh`, () => HttpResponse.json({}, { status: 401 })),
    );
    await expect(apiClient.get("/v1/things")).rejects.toBeInstanceOf(ApiError);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("does not try to refresh for auth endpoints", async () => {
    mswServer.use(
      http.post(`${ORIGIN}/api/v1/admin/auth/change-password`, () =>
        HttpResponse.json({ message: "Mật khẩu hiện tại không đúng" }, { status: 401 }),
      ),
    );
    await expect(apiClient.post("/v1/admin/auth/change-password", {})).rejects.toMatchObject({
      status: 401,
      message: "Mật khẩu hiện tại không đúng",
    });
    expect(expired).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/http/api-client.test.ts`
Expected: FAIL — `setSessionExpiredHandler` is not exported.

- [ ] **Step 3: Implement**

In `src/lib/http/api-client.ts`, keep `ApiError`, `RequestOptions`, `buildUrl`, `parseError` and the `apiClient` export. Replace the `request` function with the code below and add the helpers above it.

```ts
const REFRESH_PATH = "/v1/admin/auth/refresh";
const AUTH_PATH_PREFIX = "/v1/admin/auth/";
const SESSION_EXPIRED_URL = "/api/v1/admin/auth/session-expired";

let onSessionExpired: () => void = () => {
  window.location.assign(SESSION_EXPIRED_URL);
};

export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

let inflightRefresh: Promise<boolean> | null = null;

/** One shared refresh for all parallel 401s. */
function refreshSessionOnce(): Promise<boolean> {
  inflightRefresh ??= fetch(buildUrl(REFRESH_PATH), { method: "POST", credentials: "include" })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      inflightRefresh = null;
    });
  return inflightRefresh;
}

function buildInit(method: string, options: RequestOptions): RequestInit {
  const { body, query: _query, serverCookie, headers, ...rest } = options;
  void _query;
  const finalHeaders = new Headers(headers);
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders.set("Content-Type", "application/json");
  }
  finalHeaders.set("Accept", "application/json");
  if (serverCookie) finalHeaders.set("Cookie", serverCookie);
  return {
    ...rest,
    method,
    headers: finalHeaders,
    credentials: "include",
    body:
      body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  };
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(path, options.query);
  let res = await fetch(url, buildInit(method, options));

  const canRefresh =
    res.status === 401 && typeof window !== "undefined" && !path.startsWith(AUTH_PATH_PREFIX);
  if (canRefresh) {
    if (await refreshSessionOnce()) {
      res = await fetch(url, buildInit(method, options));
    }
    if (res.status === 401) {
      onSessionExpired();
    }
  }

  if (!res.ok) throw await parseError(res);

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return undefined as T;
  return (await res.json()) as T;
}
```

If the original destructuring in the old `request` used `query`, ensure `query` is no longer passed to `fetch` (it is stripped in `buildInit`). The `void _query` line exists only to satisfy `noUnusedLocals`-style lint; if lint accepts a cleaner pattern, use it.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/http && npm run lint`
Expected: 4 tests PASS; lint clean.

- [ ] **Step 5: Commit (controller)**

```bash
git add src/lib/http/api-client.ts src/lib/http/api-client.test.ts
git commit -m "feat(http): refresh the session on 401 and retry once" -- src/lib/http/api-client.ts src/lib/http/api-client.test.ts
```

---

## Task 8: Server actions and auth Route Handlers

**Files:**
- Create: `src/features/auth/actions/login-action.test.ts`, `src/app/api/v1/admin/auth/session-expired/route.ts`, `src/app/api/v1/admin/auth/auth-routes.test.ts`
- Modify: `src/features/auth/actions/login-action.ts`, `src/features/auth/actions/logout-action.ts`, `src/app/api/v1/admin/auth/refresh/route.ts`, `src/app/api/v1/admin/auth/change-password/route.ts`, `src/app/api/v1/admin/auth/forgot-password/route.ts`, `src/app/api/v1/admin/auth/profile/route.ts`, `src/lib/api/auth-api.ts`, `src/features/auth/hooks/use-forgot-password-mutation.ts`, `src/features/account/schemas.ts`
- Delete: `src/lib/auth/services/auth-service.ts`, `src/lib/http/server-client.ts`, `src/app/api/v1/admin/auth/login/route.ts`, `src/app/api/v1/admin/auth/logout/route.ts`, `src/app/api/v1/admin/auth/me/route.ts`, `src/features/auth/hooks/use-session-query.ts` (after Task 10 stops importing it — see Step 7)

**Interfaces:**
- Consumes: Task 3/4/5/6 services (`requestLoginOtp`, `verifyLoginOtp`, `resendOtp`, `refreshTokens`/`refreshTokensOnce`, `logoutSession`, `changePassword`, `forgotPassword`, `FORGOT_PASSWORD_MESSAGE`), `writeSessionCookies`, `clearSessionCookies`, `readRefreshToken`, `getServerSession`, `toHttpStatus`, `loginSchema`, `otpSchema`, `forgotPasswordSchema`, `newPasswordSchema`.
- Produces (exact):
  - `type OtpChallengeView = { requestId: string; maskedRecipient: string; expiresInSeconds: number; resendAfterSeconds: number; resendRemaining: number }`.
  - Server actions: `loginAction(input: LoginInput): Promise<Result<OtpChallengeView>>`, `verifyLoginOtpAction(input: { requestId: string; otp: string }): Promise<Result<{ redirectTo: string }>>`, `resendLoginOtpAction(input: { requestId: string }): Promise<Result<OtpChallengeView>>`, `logoutAction(): Promise<void>`. `Result` is `@/lib/http/result` (`error` is a user-facing Vietnamese string, `code` the BE code).
  - Route handlers: `POST /api/v1/admin/auth/refresh` (writes cookies, returns session JSON), `POST /api/v1/admin/auth/change-password` (`{ currentPassword, newPassword }`), `POST /api/v1/admin/auth/forgot-password` (`{ email }` → `{ success: true, message }`), `GET /api/v1/admin/auth/session-expired` (clears cookies, redirects to `/login`), `PATCH /api/v1/admin/auth/profile` → 501.
  - `authApi = { forgotPassword(input: { email: string }) }` only.

Read first: Next docs `cookies.md`, `redirect`/`redirecting.md`, Route Handlers `route.md`; the current files listed above.

- [ ] **Step 1: Confirm dead code**

Run: `grep -rn "authApi.login\|authApi.logout\|authApi.me\|useSessionQuery\|server-client\|auth-service\|LoginResponse\|BeLoginResponse" src --include=*.ts --include=*.tsx | grep -v "\.test\."`
Expected: only the files listed in this task's Modify/Delete lists plus `SideBar.tsx` (migrated in Task 10) and `features/dashboard` (its own unrelated `useSessionQuery` in `use-dashboard-query.ts` — leave it). If anything else appears, stop and report.

- [ ] **Step 2: Write failing tests**

`src/features/auth/actions/login-action.test.ts`:

```ts
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mswServer } from "@/test/msw";
import { fakeJwt } from "@/test/jwt";

const AUTH = "https://identity.test/api/v1/merchant/auth";
const envelope = (data: unknown) => ({ success: true, message: "success", data });
const challenge = { requestId: "req-1", maskedRecipient: "a***@shop.vn", expiresIn: 300, canResendAfter: 60, resendRemaining: 3 };

const cookieStore = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

async function load() {
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.resetModules();
  return import("@/features/auth/actions/login-action");
}

describe("login actions", () => {
  beforeEach(() => {
    cookieStore.set.mockReset();
    cookieStore.delete.mockReset();
  });

  it("rejects an invalid email before calling the BE", async () => {
    const { loginAction } = await load();
    const result = await loginAction({ email: "nope", password: "x" });
    expect(result).toMatchObject({ success: false, code: "VALIDATION" });
  });

  it("returns the OTP challenge and sets no cookies after step 1", async () => {
    mswServer.use(http.post(`${AUTH}/login`, () => HttpResponse.json(envelope({ otpRequired: true, ...challenge }))));
    const { loginAction } = await load();
    const result = await loginAction({ email: "a@shop.vn", password: "Secret123!" });
    expect(result).toEqual({
      success: true,
      data: { requestId: "req-1", maskedRecipient: "a***@shop.vn", expiresInSeconds: 300, resendAfterSeconds: 60, resendRemaining: 3 },
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("shows the BE message for wrong credentials", async () => {
    mswServer.use(
      http.post(`${AUTH}/login`, () =>
        HttpResponse.json({ success: false, message: "INVALID_CREDENTIALS", detail: "Email hoặc mật khẩu không đúng" }, { status: 401 }),
      ),
    );
    const { loginAction } = await load();
    const result = await loginAction({ email: "a@shop.vn", password: "bad" });
    expect(result).toMatchObject({ success: false, error: "Email hoặc mật khẩu không đúng", code: "INVALID_CREDENTIALS" });
  });

  it("sets both session cookies after a correct OTP", async () => {
    const accessToken = fakeJwt({ exp: Math.floor(Date.now() / 1000) + 300 });
    mswServer.use(
      http.post(`${AUTH}/login/verify-otp`, () =>
        HttpResponse.json(envelope({ accessToken, expiresIn: 300, refreshToken: "r-1", refreshExpiresIn: 86_400 })),
      ),
    );
    const { verifyLoginOtpAction } = await load();
    const result = await verifyLoginOtpAction({ requestId: "req-1", otp: "123456" });
    expect(result).toEqual({ success: true, data: { redirectTo: "/dashboard" } });
    const names = cookieStore.set.mock.calls.map((call) => call[0]);
    expect(names).toEqual(["access_token", "refresh_token"]);
  });

  it("keeps the user on the form and sets no cookies after a wrong OTP", async () => {
    mswServer.use(
      http.post(`${AUTH}/login/verify-otp`, () =>
        HttpResponse.json({ success: false, message: "INVALID_OTP", detail: "Mã OTP không đúng" }, { status: 400 }),
      ),
    );
    const { verifyLoginOtpAction } = await load();
    const result = await verifyLoginOtpAction({ requestId: "req-1", otp: "000000" });
    expect(result).toMatchObject({ success: false, error: "Mã OTP không đúng" });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("rejects a malformed OTP locally", async () => {
    const { verifyLoginOtpAction } = await load();
    expect(await verifyLoginOtpAction({ requestId: "req-1", otp: "12" })).toMatchObject({ success: false, code: "VALIDATION" });
  });

  it("logs out by clearing cookies even when the BE call fails, then redirects to /login", async () => {
    cookieStore.get.mockReturnValue({ value: "r-1" });
    mswServer.use(http.post(`${AUTH}/logout`, () => HttpResponse.error()));
    vi.resetModules();
    vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
    vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
    const { logoutAction } = await import("@/features/auth/actions/logout-action");
    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(cookieStore.delete).toHaveBeenCalledWith("access_token");
    expect(cookieStore.delete).toHaveBeenCalledWith("refresh_token");
  });
});
```

`src/app/api/v1/admin/auth/auth-routes.test.ts`:

```ts
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mswServer } from "@/test/msw";

const AUTH = "https://identity.test/api/v1/merchant/auth";
const cookieStore = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
const getServerSession = vi.fn();

vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));

function jsonRequest(url: string, body: unknown): Request {
  return new Request(`http://localhost:3000${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function setup() {
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.resetModules();
}

describe("auth route handlers", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    cookieStore.delete.mockReset();
    cookieStore.get.mockReset();
  });

  it("session-expired clears both cookies and redirects to /login", async () => {
    await setup();
    const { GET } = await import("@/app/api/v1/admin/auth/session-expired/route");
    const response = await GET(new Request("http://localhost:3000/api/v1/admin/auth/session-expired") as never);
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/login");
    expect(cookieStore.delete).toHaveBeenCalledWith("access_token");
    expect(cookieStore.delete).toHaveBeenCalledWith("refresh_token");
  });

  it("change-password requires a session", async () => {
    await setup();
    getServerSession.mockResolvedValue(null);
    const { POST } = await import("@/app/api/v1/admin/auth/change-password/route");
    const response = await POST(jsonRequest("/x", { currentPassword: "a", newPassword: "ValidPass12!x" }));
    expect(response.status).toBe(401);
  });

  it("change-password rejects a weak new password before calling the BE", async () => {
    await setup();
    getServerSession.mockResolvedValue({ userId: "u" });
    const { POST } = await import("@/app/api/v1/admin/auth/change-password/route");
    const response = await POST(jsonRequest("/x", { currentPassword: "a", newPassword: "weak" }));
    expect(response.status).toBe(400);
  });

  it("change-password forwards the BE message and status", async () => {
    await setup();
    getServerSession.mockResolvedValue({ userId: "u" });
    cookieStore.get.mockReturnValue({ value: "tok" });
    mswServer.use(
      http.post(`${AUTH}/change-password`, () =>
        HttpResponse.json({ success: false, message: "INVALID_PASSWORD", detail: "Mật khẩu hiện tại không đúng" }, { status: 400 }),
      ),
    );
    const { POST } = await import("@/app/api/v1/admin/auth/change-password/route");
    const response = await POST(jsonRequest("/x", { currentPassword: "bad", newPassword: "ValidPass12!x" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ message: "Mật khẩu hiện tại không đúng" });
  });

  it("forgot-password answers with the generic message and validates the email", async () => {
    await setup();
    mswServer.use(http.post(`${AUTH}/forgot-password`, () => HttpResponse.json({ success: true, message: "success" })));
    const { POST } = await import("@/app/api/v1/admin/auth/forgot-password/route");
    const ok = await POST(jsonRequest("/x", { email: "a@shop.vn" }));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ success: true });
    const bad = await POST(jsonRequest("/x", { email: "nope" }));
    expect(bad.status).toBe(400);
  });

  it("refresh answers 401 and clears cookies when there is no refresh token", async () => {
    await setup();
    cookieStore.get.mockReturnValue(undefined);
    const { POST } = await import("@/app/api/v1/admin/auth/refresh/route");
    const response = await POST();
    expect(response.status).toBe(401);
    expect(cookieStore.delete).toHaveBeenCalledWith("refresh_token");
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run src/features/auth/actions src/app/api/v1/admin/auth`
Expected: FAIL — actions/routes still use the mock auth service.

- [ ] **Step 4: Implement actions**

`src/features/auth/actions/login-action.ts` (replace entire file):

```ts
"use server";

import { loginSchema, otpSchema, type LoginInput } from "@/features/auth/schemas";
import { writeSessionCookies } from "@/lib/auth/session-cookies";
import { fail, ok, type Result } from "@/lib/http/result";
import type { OtpChallenge } from "@/server/modules/auth/merchant-auth.dto";
import {
  requestLoginOtp,
  resendOtp,
  verifyLoginOtp,
} from "@/server/modules/auth/merchant-auth.service";

export type OtpChallengeView = {
  requestId: string;
  maskedRecipient: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
  resendRemaining: number;
};

const DEFAULT_REDIRECT = "/dashboard";

function toView(challenge: OtpChallenge): OtpChallengeView {
  return {
    requestId: challenge.requestId,
    maskedRecipient: challenge.maskedRecipient,
    expiresInSeconds: challenge.expiresIn,
    resendAfterSeconds: challenge.canResendAfter,
    resendRemaining: challenge.resendRemaining,
  };
}

/** Step 1: password check, emails an OTP. Sets no cookies. */
export async function loginAction(input: LoginInput): Promise<Result<OtpChallengeView>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ", "VALIDATION");
  }
  const result = await requestLoginOtp(parsed.data.email, parsed.data.password);
  if (!result.success) return fail(result.error.message, result.error.code);
  if (!result.data.otpRequired) {
    return fail("Không thể bắt đầu xác thực OTP, vui lòng thử lại", "OTP_NOT_REQUIRED");
  }
  return ok(toView(result.data));
}

/** Step 2: a correct OTP yields tokens, stored in HTTP-only cookies. */
export async function verifyLoginOtpAction(input: {
  requestId: string;
  otp: string;
}): Promise<Result<{ redirectTo: string }>> {
  const parsed = otpSchema.safeParse({ otp: input.otp });
  if (!parsed.success || !input.requestId) {
    return fail(parsed.success ? "Phiên xác thực không hợp lệ" : "Mã OTP gồm 6 chữ số", "VALIDATION");
  }
  const result = await verifyLoginOtp(input.requestId, parsed.data.otp);
  if (!result.success) return fail(result.error.message, result.error.code);
  await writeSessionCookies(result.data);
  return ok({ redirectTo: DEFAULT_REDIRECT });
}

export async function resendLoginOtpAction(input: {
  requestId: string;
}): Promise<Result<OtpChallengeView>> {
  if (!input.requestId) return fail("Phiên xác thực không hợp lệ", "VALIDATION");
  const result = await resendOtp(input.requestId);
  return result.success ? ok(toView(result.data)) : fail(result.error.message, result.error.code);
}
```

`src/features/auth/actions/logout-action.ts` (replace entire file):

```ts
"use server";

import { redirect } from "next/navigation";

import { clearSessionCookies, readRefreshToken } from "@/lib/auth/session-cookies";
import { logoutSession } from "@/server/modules/auth/merchant-auth.service";

export async function logoutAction(): Promise<void> {
  const refreshToken = await readRefreshToken();
  if (refreshToken) {
    // A BE failure must not block signing out locally.
    await logoutSession(refreshToken);
  }
  await clearSessionCookies();
  redirect("/login");
}
```

- [ ] **Step 5: Implement route handlers and client API**

`src/app/api/v1/admin/auth/session-expired/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";

import { clearSessionCookies } from "@/lib/auth/session-cookies";

/** Landing point when a cookie exists but the BE no longer accepts it; breaks the /login ↔ /dashboard loop. */
export async function GET(request: NextRequest) {
  await clearSessionCookies();
  return NextResponse.redirect(new URL("/login", request.url));
}
```

`src/app/api/v1/admin/auth/refresh/route.ts` (replace):

```ts
import { NextResponse } from "next/server";

import { clearSessionCookies, readRefreshToken, writeSessionCookies } from "@/lib/auth/session-cookies";
import { toHttpStatus } from "@/lib/be/errors";
import { refreshTokensOnce } from "@/server/modules/auth/merchant-auth.service";

export async function POST() {
  const refreshToken = await readRefreshToken();
  if (!refreshToken) {
    await clearSessionCookies();
    return NextResponse.json({ message: "Phiên đăng nhập đã hết hạn" }, { status: 401 });
  }

  const result = await refreshTokensOnce(refreshToken);
  if (!result.success) {
    await clearSessionCookies();
    return NextResponse.json({ message: result.error.message }, { status: toHttpStatus(result.error) === 502 ? 502 : 401 });
  }

  await writeSessionCookies(result.data);
  return NextResponse.json({ success: true });
}
```

`src/app/api/v1/admin/auth/change-password/route.ts` (replace):

```ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { newPasswordSchema } from "@/features/auth/schemas";
import { getServerSession } from "@/lib/auth/session";
import { toHttpStatus } from "@/lib/be/errors";
import { changePassword } from "@/server/modules/auth/merchant-password.service";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: newPasswordSchema,
});

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Phiên đăng nhập đã hết hạn" }, { status: 401 });
  }

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(
      { message: body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  const result = await changePassword({
    currentPassword: body.data.currentPassword,
    newPassword: body.data.newPassword,
    confirmPassword: body.data.newPassword,
  });
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.message, code: result.error.code },
      { status: toHttpStatus(result.error) },
    );
  }
  return NextResponse.json({ success: true });
}
```

`src/app/api/v1/admin/auth/forgot-password/route.ts` (replace):

```ts
import { NextResponse } from "next/server";

import { forgotPasswordSchema } from "@/features/auth/schemas";
import { toHttpStatus } from "@/lib/be/errors";
import {
  FORGOT_PASSWORD_MESSAGE,
  forgotPassword,
} from "@/server/modules/auth/merchant-password.service";

export async function POST(request: Request) {
  const body = forgotPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(
      { message: body.error.issues[0]?.message ?? "Email không hợp lệ" },
      { status: 400 },
    );
  }

  const result = await forgotPassword(body.data.email);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.message },
      { status: toHttpStatus(result.error) },
    );
  }
  return NextResponse.json({ success: true, message: FORGOT_PASSWORD_MESSAGE });
}
```

`src/app/api/v1/admin/auth/profile/route.ts` (replace entire file):

```ts
import { NextResponse } from "next/server";

/** Profile editing returns in Đợt 2 (SRS 3.23) once the BE exposes a merchant profile endpoint. */
export async function PATCH() {
  return NextResponse.json(
    { message: "Chức năng cập nhật thông tin tài khoản chưa được hỗ trợ", success: false },
    { status: 501 },
  );
}
```

`src/lib/api/auth-api.ts` (replace entire file):

```ts
import { apiClient } from "@/lib/http/api-client";

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export const authApi = {
  forgotPassword: (input: { email: string }) =>
    apiClient.post<ForgotPasswordResponse>("/v1/admin/auth/forgot-password", input),
};
```

`src/features/auth/hooks/use-forgot-password-mutation.ts` (replace entire file):

```ts
import { useMutation } from "@tanstack/react-query";

import { authApi } from "@/lib/api/auth-api";

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (payload: { email: string }) => authApi.forgotPassword(payload),
  });
}
```

`src/features/account/schemas.ts`: in `changePasswordSchema`, replace the `newPassword` definition with `newPassword: newPasswordSchema,` and add `import { newPasswordSchema } from "@/features/auth/schemas";` at the top. Leave `updateProfileSchema` unchanged.

Delete: `src/lib/auth/services/auth-service.ts`, `src/lib/http/server-client.ts`, `src/app/api/v1/admin/auth/login/route.ts`, `src/app/api/v1/admin/auth/logout/route.ts`, `src/app/api/v1/admin/auth/me/route.ts`. Do **not** delete `use-session-query.ts` yet (Task 10).

- [ ] **Step 6: Run to verify pass**

Run: `npx vitest run src/features src/app src/lib && npm run lint`
Expected: actions 7 tests PASS, routes 6 tests PASS; schemas still PASS. Typecheck remains red only in `login-fullscreen.tsx`, `forgot-password-dialog.tsx`, `SecurityTab.tsx` copy-only items and `use-login-mutation.ts` (Task 9). List any other error and fix it.

- [ ] **Step 7: Commit (controller)**

```bash
git add -A src/features/auth/actions src/features/account/schemas.ts src/features/auth/hooks/use-forgot-password-mutation.ts src/app/api/v1/admin/auth src/lib/api/auth-api.ts src/lib/auth src/lib/http
git commit -m "feat(auth): wire login, logout and password routes to the merchant BE" -- src/features/auth/actions src/features/account/schemas.ts src/features/auth/hooks/use-forgot-password-mutation.ts src/app/api/v1/admin/auth src/lib/api/auth-api.ts src/lib/auth src/lib/http
```

**Manual check (controller, with `.env.local` containing the three env vars and a dev merchant account):** run `npm run dev`, then confirm the real BE responds to step 1 (an OTP email is sent) and that `expiresIn`/`canResendAfter`/`refreshExpiresIn` are seconds. Record the result in the PR description; if they are milliseconds, stop and report so Task 5's refresh cookie `maxAge` and Task 9's countdown are adjusted.

---

## Task 9: Login UI (credentials → OTP) and forgot-password

**Files:**
- Create: `src/features/auth/utils/safe-callback.ts`, `src/features/auth/utils/safe-callback.test.ts`, `src/features/auth/hooks/use-countdown.ts`, `src/features/auth/hooks/use-countdown.test.tsx`, `src/features/auth/hooks/use-login-mutations.ts`, `src/features/auth/components/otp-panel.tsx`, `src/features/auth/components/otp-panel.test.tsx`, `src/features/auth/components/credentials-step.tsx`, `src/features/auth/components/login-form-panel.tsx`, `src/features/auth/components/login-brand-panel.tsx`, `src/features/account/schemas.test.ts`
- Modify: `src/features/auth/components/login-fullscreen.tsx`, `src/features/auth/components/forgot-password-dialog.tsx`, `src/features/account/components/SecurityTab.tsx`
- Delete: `src/features/auth/hooks/use-login-mutation.ts`

**Interfaces:**
- Consumes: `loginAction`, `verifyLoginOtpAction`, `resendLoginOtpAction`, `OtpChallengeView` (Task 8); `loginSchema`, `forgotPasswordSchema`, `LoginInput`, `ForgotPasswordInput`; Basuicn `InputOTP`, `Input`, `Button`, `Form`, `FormField`, `Checkbox`, `Dialog*`.
- Produces (exact):
  - `safeCallback(url: string | null): string` (`/dashboard` fallback).
  - `useCountdown(initialSeconds: number): { secondsLeft: number }`.
  - `OtpPanel(props: OtpPanelProps)` with `interface OtpPanelProps { maskedRecipient: string; resendAfterSeconds: number; resendRemaining: number; isSubmitting: boolean; isResending: boolean; errorMessage: string | null; onSubmit: (otp: string) => void; onResend: () => void; onBack: () => void }`.
  - Hooks `useLoginMutation`, `useVerifyOtpMutation`, `useResendOtpMutation` from `use-login-mutations.ts`.

Read first: `.claude/rules/BASUICN.md`, `.claude/patterns/ui-components.md`, `.claude/workflows/frontend.md`, UI artifact (OTP card design: icon badge, title, masked recipient, six slots with a dash after the third, meta row with countdown and a ghost "Xóa mã", full-width primary confirm, ghost "Quay lại"). `src/components/ui/input-otp/InputOtp.tsx` (props: `length`, `value`, `onChange`, `error`, `errorMessage`, `separatorAfter`, `separator`, `size`, `autoFocus`, `disabled`; each slot is a `textbox` named `Digit N of 6`). If a lucide icon named below does not exist in the installed `lucide-react`, use the closest existing one.

- [ ] **Step 1: Write failing tests**

`src/features/auth/utils/safe-callback.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { safeCallback } from "@/features/auth/utils/safe-callback";

describe("safeCallback", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeCallback("/orders?page=2")).toBe("/orders?page=2");
  });

  it.each([null, "", "orders", "//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)"])(
    "falls back to the dashboard for %s",
    (value) => {
      expect(safeCallback(value)).toBe("/dashboard");
    },
  );
});
```

`src/features/auth/hooks/use-countdown.test.tsx`:

```tsx
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCountdown } from "@/features/auth/hooks/use-countdown";

describe("useCountdown", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts down once per second and stops at zero", () => {
    const { result } = renderHook(() => useCountdown(3));
    expect(result.current.secondsLeft).toBe(3);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.secondsLeft).toBe(1);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.secondsLeft).toBe(0);
  });
});
```

`src/features/auth/components/otp-panel.test.tsx`:

```tsx
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OtpPanel, type OtpPanelProps } from "@/features/auth/components/otp-panel";

const baseProps: OtpPanelProps = {
  maskedRecipient: "a***@shop.vn",
  resendAfterSeconds: 60,
  resendRemaining: 3,
  isSubmitting: false,
  isResending: false,
  errorMessage: null,
  onSubmit: vi.fn(),
  onResend: vi.fn(),
  onBack: vi.fn(),
};

const confirm = () => screen.getByRole("button", { name: "Xác nhận" });

async function typeCode(code: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
  await user.keyboard(code);
  return user;
}

describe("OtpPanel", () => {
  afterEach(() => vi.useRealTimers());

  it("keeps confirm disabled until six digits are entered, then submits the code", async () => {
    const onSubmit = vi.fn();
    render(<OtpPanel {...baseProps} onSubmit={onSubmit} />);
    expect(confirm()).toBeDisabled();

    const user = await typeCode("12345");
    expect(confirm()).toBeDisabled();

    await user.keyboard("6");
    expect(confirm()).toBeEnabled();
    await user.click(confirm());
    expect(onSubmit).toHaveBeenCalledWith("123456");
  });

  it("clears the entered code with the clear button", async () => {
    render(<OtpPanel {...baseProps} />);
    const user = await typeCode("123456");
    expect(confirm()).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Xóa mã" }));
    expect(confirm()).toBeDisabled();
  });

  it("disables resend during the countdown and enables it afterwards", () => {
    vi.useFakeTimers();
    render(<OtpPanel {...baseProps} resendAfterSeconds={2} />);
    const resend = () => screen.getByRole("button", { name: /Gửi lại/ });
    expect(resend()).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(resend()).toBeEnabled();
  });

  it("disables resend when no resends remain", () => {
    render(<OtpPanel {...baseProps} resendAfterSeconds={0} resendRemaining={0} />);
    expect(screen.getByRole("button", { name: /Gửi lại|hết lượt/ })).toBeDisabled();
  });

  it("shows the error message and keeps the form usable", async () => {
    render(<OtpPanel {...baseProps} errorMessage="Mã OTP không đúng" />);
    expect(screen.getByText("Mã OTP không đúng")).toBeInTheDocument();
    await typeCode("123456");
    expect(confirm()).toBeEnabled();
  });

  it("calls onBack from the back button", async () => {
    const onBack = vi.fn();
    render(<OtpPanel {...baseProps} onBack={onBack} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Quay lại" }));
    expect(onBack).toHaveBeenCalled();
  });
});
```

`src/features/account/schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { changePasswordSchema } from "@/features/account/schemas";

describe("changePasswordSchema", () => {
  const valid = { currentPassword: "Old-pass1!", newPassword: "ValidPass12!x", confirmPassword: "ValidPass12!x" };

  it("accepts a password that satisfies the BE rule", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a password shorter than 10 characters", () => {
    const result = changePasswordSchema.safeParse({ ...valid, newPassword: "Abcdef1!", confirmPassword: "Abcdef1!" });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirmation on the confirm field", () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: "Different12!x" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/features/auth src/features/account`
Expected: FAIL — new modules missing.

- [ ] **Step 3: Implement utilities and hooks**

`src/features/auth/utils/safe-callback.ts`:

```ts
const DEFAULT_REDIRECT = "/dashboard";

/** Accepts only same-origin relative paths so a login link cannot redirect off-site. */
export function safeCallback(url: string | null): string {
  if (!url) return DEFAULT_REDIRECT;
  if (!url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) return DEFAULT_REDIRECT;
  return url;
}
```

`src/features/auth/hooks/use-countdown.ts`:

```ts
"use client";

import * as React from "react";

export function useCountdown(initialSeconds: number): { secondsLeft: number } {
  const [secondsLeft, setSecondsLeft] = React.useState(Math.max(0, initialSeconds));

  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  return { secondsLeft };
}
```

`src/features/auth/hooks/use-login-mutations.ts`:

```ts
"use client";

import { useMutation } from "@tanstack/react-query";

import {
  loginAction,
  resendLoginOtpAction,
  verifyLoginOtpAction,
} from "@/features/auth/actions/login-action";
import type { LoginInput } from "@/features/auth/schemas";

export function useLoginMutation() {
  return useMutation({ mutationFn: (input: LoginInput) => loginAction(input) });
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: (input: { requestId: string; otp: string }) => verifyLoginOtpAction(input),
  });
}

export function useResendOtpMutation() {
  return useMutation({
    mutationFn: (input: { requestId: string }) => resendLoginOtpAction(input),
  });
}
```

Delete `src/features/auth/hooks/use-login-mutation.ts`.

- [ ] **Step 4: Implement `OtpPanel`**

`src/features/auth/components/otp-panel.tsx`:

```tsx
"use client";

import * as React from "react";
import { ArrowLeft, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button/Button";
import { InputOTP } from "@/components/ui/input-otp/InputOtp";
import { useCountdown } from "@/features/auth/hooks/use-countdown";

const OTP_LENGTH = 6;

export interface OtpPanelProps {
  maskedRecipient: string;
  resendAfterSeconds: number;
  resendRemaining: number;
  isSubmitting: boolean;
  isResending: boolean;
  errorMessage: string | null;
  onSubmit: (otp: string) => void;
  onResend: () => void;
  onBack: () => void;
}

function resendLabel(secondsLeft: number, resendRemaining: number): string {
  if (secondsLeft > 0) return `Gửi lại sau ${secondsLeft} giây`;
  return resendRemaining > 0 ? "Gửi lại mã" : "Đã hết lượt gửi lại";
}

export function OtpPanel(props: OtpPanelProps) {
  const { maskedRecipient, resendRemaining, isSubmitting, isResending, errorMessage } = props;
  const [code, setCode] = React.useState("");
  const { secondsLeft } = useCountdown(props.resendAfterSeconds);
  const canResend = secondsLeft === 0 && resendRemaining > 0 && !isResending;

  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center gap-5 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
        <ShieldCheck className="size-7" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Xác thực OTP</h1>
        <p className="text-sm text-muted-foreground">
          Nhập mã 6 số đã gửi tới <strong className="text-foreground">{maskedRecipient}</strong>
        </p>
      </div>

      <InputOTP
        length={OTP_LENGTH}
        size="lg"
        separatorAfter={3}
        separator="dash"
        value={code}
        onChange={setCode}
        error={Boolean(errorMessage)}
        errorMessage={errorMessage ?? undefined}
        disabled={isSubmitting}
        autoFocus
      />

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        <Button type="button" variant="link" disabled={!canResend} onClick={props.onResend}>
          {resendLabel(secondsLeft, resendRemaining)}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={<X className="size-4" aria-hidden />}
          onClick={() => setCode("")}
        >
          Xóa mã
        </Button>
      </div>

      <div className="grid w-full gap-2">
        <Button
          type="button"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
          disabled={code.length !== OTP_LENGTH || isSubmitting}
          onClick={() => props.onSubmit(code)}
        >
          Xác nhận
        </Button>
        <Button
          type="button"
          variant="ghost"
          leftIcon={<ArrowLeft className="size-4" aria-hidden />}
          onClick={props.onBack}
        >
          Quay lại
        </Button>
      </div>
    </section>
  );
}
```

If `Button` has no `size="sm"` or `leftIcon`, check `src/components/ui/button/Button.tsx` and use the props it actually exposes; do not modify the shared Button.

- [ ] **Step 5: Split and update the login screen**

1. Create `src/features/auth/components/login-brand-panel.tsx`: `"use client"` is not needed. Move the JSX block of the left panel verbatim — from the comment `{/* Left: Color panel */}` through the closing `</div>` that precedes `{/* Right: Form panel */}` in the current `login-fullscreen.tsx` — into `export function LoginBrandPanel() { return (<>…</>); }`, together with the imports it uses (`Image`, `AppImage`, `EarthImage`, `LogoImage`). Change nothing else in that JSX.

2. Create `src/features/auth/components/credentials-step.tsx`:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button/Button";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Form, FormField } from "@/components/ui/form/Form";
import { Input } from "@/components/ui/input/Input";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";

interface CredentialsStepProps {
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (values: LoginInput) => void;
  onForgotPassword: () => void;
}

export function CredentialsStep({
  isSubmitting,
  errorMessage,
  onSubmit,
  onForgotPassword,
}: CredentialsStepProps) {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Chào mừng trở lại</h1>
        <p className="text-sm text-muted-foreground">Đăng nhập để tiếp tục sử dụng dịch vụ</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Input
                label="Email"
                type="email"
                autoComplete="username"
                placeholder="ten@congty.vn"
                icon={<Mail className="size-4" />}
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Input
                label="Mật khẩu"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                icon={<Lock className="size-4" />}
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Checkbox id="remember" label="Ghi nhớ đăng nhập" />
            </div>
            <Button variant="link" type="button" className="px-0 text-sm" onClick={onForgotPassword}>
              Quên mật khẩu?
            </Button>
          </div>

          {errorMessage && (
            <p
              className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting} disabled={isSubmitting}>
            Đăng nhập
          </Button>
        </form>
      </Form>
    </div>
  );
}
```

3. Create `src/features/auth/components/login-form-panel.tsx`:

```tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import LogoImage from "../../../../public/images/logo.png";
import type { OtpChallengeView } from "@/features/auth/actions/login-action";
import { CredentialsStep } from "@/features/auth/components/credentials-step";
import { OtpPanel } from "@/features/auth/components/otp-panel";
import {
  useLoginMutation,
  useResendOtpMutation,
  useVerifyOtpMutation,
} from "@/features/auth/hooks/use-login-mutations";
import type { LoginInput } from "@/features/auth/schemas";
import { safeCallback } from "@/features/auth/utils/safe-callback";

interface LoginFormPanelProps {
  onForgotPassword: () => void;
}

export function LoginFormPanel({ onForgotPassword }: LoginFormPanelProps) {
  const router = useRouter();
  const callbackUrl = safeCallback(useSearchParams().get("callbackUrl"));

  const login = useLoginMutation();
  const verify = useVerifyOtpMutation();
  const resend = useResendOtpMutation();

  const [challenge, setChallenge] = React.useState<OtpChallengeView | null>(null);
  const [otpVersion, setOtpVersion] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  async function handleLogin(values: LoginInput) {
    setError(null);
    const result = await login.mutateAsync(values);
    if (!result.success) return setError(result.error);
    setChallenge(result.data);
  }

  async function handleVerify(otp: string) {
    if (!challenge) return;
    setError(null);
    const result = await verify.mutateAsync({ requestId: challenge.requestId, otp });
    if (!result.success) return setError(result.error);
    router.replace(callbackUrl);
    router.refresh();
  }

  async function handleResend() {
    if (!challenge) return;
    setError(null);
    const result = await resend.mutateAsync({ requestId: challenge.requestId });
    if (!result.success) return setError(result.error);
    setChallenge(result.data);
    setOtpVersion((version) => version + 1);
  }

  function handleBack() {
    setChallenge(null);
    setError(null);
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-background">
      <div className="flex items-center p-8 md:invisible">
        <Image src={LogoImage} alt="Flexpay Logo" width={180} height={60} className="mb-2 h-12 w-auto object-contain" />
      </div>
      <div className="flex flex-1 items-center justify-center px-8 pb-12">
        {challenge ? (
          <OtpPanel
            key={otpVersion}
            maskedRecipient={challenge.maskedRecipient}
            resendAfterSeconds={challenge.resendAfterSeconds}
            resendRemaining={challenge.resendRemaining}
            isSubmitting={verify.isPending}
            isResending={resend.isPending}
            errorMessage={error}
            onSubmit={handleVerify}
            onResend={handleResend}
            onBack={handleBack}
          />
        ) : (
          <CredentialsStep
            isSubmitting={login.isPending}
            errorMessage={error}
            onSubmit={handleLogin}
            onForgotPassword={onForgotPassword}
          />
        )}
      </div>
    </div>
  );
}
```

4. Replace `src/features/auth/components/login-fullscreen.tsx` entirely:

```tsx
"use client";

import * as React from "react";

import { ForgotPasswordDialog } from "@/features/auth/components/forgot-password-dialog";
import { LoginBrandPanel } from "@/features/auth/components/login-brand-panel";
import { LoginFormPanel } from "@/features/auth/components/login-form-panel";

export function LoginFullScreen() {
  const [forgotPasswordOpen, setForgotPasswordOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-full">
      <LoginBrandPanel />
      <LoginFormPanel onForgotPassword={() => setForgotPasswordOpen(true)} />
      <ForgotPasswordDialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen} />
    </div>
  );
}
```

5. `forgot-password-dialog.tsx`: replace the local `forgotPasswordSchema`/`ForgotPasswordInput` with imports from `@/features/auth/schemas`; rename the form field `username` → `email`; the mutate call becomes `forgotMutation.mutate({ email: values.email }, …)`; label `"Email"`, placeholder `"ten@congty.vn"`; `DialogDescription` text: `"Nhập email đăng nhập. Nếu email tồn tại, chúng tôi sẽ gửi liên kết đặt lại mật khẩu."`; submit button label `"Gửi liên kết"`. Keep the rest (messages, toast, auto-close) as is.

6. `SecurityTab.tsx`: update only the helper text to `"Để đảm bảo an toàn, mật khẩu cần từ 10 đến 128 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)."` and the new-password placeholder to `"Tối thiểu 10 ký tự"`.

- [ ] **Step 6: Run to verify pass**

Run: `npx vitest run src/features && npm run typecheck && npm run lint`
Expected: all tests PASS (safe-callback 8, countdown 1, OtpPanel 6, account schema 3, plus earlier); typecheck and lint clean except `SideBar.tsx` still importing `useSessionQuery` (resolved in Task 10; it must still compile because the hook file is not deleted yet). Every touched component ≤ 200 lines.

- [ ] **Step 7: Manual check (controller)**

At 1280px and 320px: login screen shows credentials step; after a valid login the OTP card replaces the form; wrong code shows the BE message; Back returns to credentials; resend shows the countdown. Keyboard only: Tab order is logical and focus rings are visible.

- [ ] **Step 8: Commit (controller)**

```bash
git add -A src/features/auth src/features/account
git commit -m "feat(auth): two-step login with OTP and email-based password reset" -- src/features/auth src/features/account
```

---

## Task 10: Session provider, `(cms)` layout and permission-aware menu

**Files:**
- Create: `src/features/auth/components/session-provider.tsx`, `src/features/auth/components/session-provider.test.tsx`, `src/features/auth/components/account-status-notice.tsx`, `src/app/(cms)/_layout/CmsShell.tsx`, `src/app/(cms)/_layout/constants/route.constants.test.ts`
- Modify: `src/app/(cms)/layout.tsx`, `src/app/(cms)/_layout/constants/route.constants.tsx`, `src/app/(cms)/_layout/SideBar.tsx`
- Delete: `src/features/auth/hooks/use-session-query.ts`

**Interfaces:**
- Consumes: `getServerSession`, `SessionUser`, `MerchantPermission`, `hasPermission`, `logoutAction`.
- Produces (exact):
  - `SessionProvider({ session: SessionUser; children })`, `useSession(): SessionUser` (throws `Error("useSession must be used within SessionProvider")` outside), `useHasPermission(permission: MerchantPermission): boolean`.
  - `filterRoutesByPermissions(sections: SidebarSection[], permissions: readonly MerchantPermission[]): SidebarSection[]` exported from `route.constants.tsx`; `SidebarItem` gains optional `permission?: MerchantPermission`; `SidebarSection` and `SidebarItem` become exported types.
  - `CmsShell({ children })` — the current layout body moved unchanged.

Read first: Next docs `redirect`, layouts; current `src/app/(cms)/layout.tsx` and `SideBar.tsx`.

- [ ] **Step 1: Write failing tests**

`src/app/(cms)/_layout/constants/route.constants.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { filterRoutesByPermissions, routesConfig } from "@/app/(cms)/_layout/constants/route.constants";

const titles = (sections: ReturnType<typeof filterRoutesByPermissions>) =>
  sections.flatMap((section) => section.items.map((item) => item.title));

describe("filterRoutesByPermissions", () => {
  it("always keeps items that need no permission", () => {
    expect(titles(filterRoutesByPermissions(routesConfig, []))).toEqual(["Tổng quan"]);
  });

  it("shows an item only when its permission is granted", () => {
    const visible = titles(filterRoutesByPermissions(routesConfig, ["MANAGE_USER", "VIEW_ORDER"]));
    expect(visible).toContain("Quản lý nhân sự");
    expect(visible).toContain("Quản lý Đơn hàng");
    expect(visible).not.toContain("Hoàn tiền");
    expect(visible).not.toContain("Quản lý quyền hạn");
  });

  it("removes sections that end up empty", () => {
    const sections = filterRoutesByPermissions(routesConfig, []);
    expect(sections.every((section) => section.items.length > 0)).toBe(true);
    expect(sections).toHaveLength(1);
  });
});
```

`src/features/auth/components/session-provider.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  SessionProvider,
  useHasPermission,
  useSession,
} from "@/features/auth/components/session-provider";
import type { SessionUser } from "@/types/auth";

const session: SessionUser = {
  userId: "u-1",
  username: "An",
  status: "ACTIVE",
  merchantIds: [],
  subMerchantIds: [],
  permissions: ["VIEW_ORDER"],
  authorizationVersion: 1,
};

describe("SessionProvider", () => {
  it("exposes the session and permission checks to descendants", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider session={session}>{children}</SessionProvider>
    );
    expect(renderHook(() => useSession(), { wrapper }).result.current.username).toBe("An");
    expect(renderHook(() => useHasPermission("VIEW_ORDER"), { wrapper }).result.current).toBe(true);
    expect(renderHook(() => useHasPermission("MANAGE_USER"), { wrapper }).result.current).toBe(false);
  });

  it("throws when used outside the provider", () => {
    expect(() => renderHook(() => useSession())).toThrow("useSession must be used within SessionProvider");
  });

  it("renders its children", () => {
    render(
      <SessionProvider session={session}>
        <p>content</p>
      </SessionProvider>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/features/auth/components/session-provider.test.tsx "src/app/(cms)"`
Expected: FAIL — modules/exports missing.

- [ ] **Step 3: Implement session provider and status notice**

`src/features/auth/components/session-provider.tsx`:

```tsx
"use client";

import * as React from "react";

import { hasPermission, type MerchantPermission } from "@/features/auth/permissions";
import type { SessionUser } from "@/types/auth";

const SessionContext = React.createContext<SessionUser | null>(null);

interface SessionProviderProps {
  session: SessionUser;
  children: React.ReactNode;
}

export function SessionProvider({ session, children }: SessionProviderProps) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionUser {
  const session = React.useContext(SessionContext);
  if (!session) throw new Error("useSession must be used within SessionProvider");
  return session;
}

export function useHasPermission(permission: MerchantPermission): boolean {
  return hasPermission(useSession().permissions, permission);
}
```

`src/features/auth/components/account-status-notice.tsx`:

```tsx
import { Button } from "@/components/ui/button/Button";
import { logoutAction } from "@/features/auth/actions/logout-action";
import type { MerchantUserStatus } from "@/types/auth";

const COPY: Record<Exclude<MerchantUserStatus, "ACTIVE">, { title: string; body: string }> = {
  PENDING: {
    title: "Tài khoản chưa được kích hoạt",
    body: "Hãy hoàn tất kích hoạt qua email Flexpay đã gửi. Nếu chưa nhận được, liên hệ quản trị viên của đơn vị bạn.",
  },
  LOCKED: {
    title: "Tài khoản đã bị khóa",
    body: "Bạn không thể sử dụng Merchant Portal lúc này. Liên hệ quản trị viên của đơn vị để được mở khóa.",
  },
};

export function AccountStatusNotice({ status }: { status: Exclude<MerchantUserStatus, "ACTIVE"> }) {
  const copy = COPY[status];
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-md space-y-4 text-center" role="alert">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.body}</p>
        <form action={logoutAction}>
          <Button type="submit" variant="outline">
            Đăng xuất
          </Button>
        </form>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Move the shell and make the layout a Server Component**

Create `src/app/(cms)/_layout/CmsShell.tsx` by moving the **entire current content** of `src/app/(cms)/layout.tsx` into it, with exactly these edits: rename `export default function Layout({ children }: Props)` to `export function CmsShell({ children }: Props)`; keep `"use client"`, `LayoutBody`, `Props` and all imports unchanged; import paths `./_layout/SideBar` and `./_layout/Header` become `./SideBar` and `./Header`.

Replace `src/app/(cms)/layout.tsx` entirely:

```tsx
import { redirect } from "next/navigation";

import { AccountStatusNotice } from "@/features/auth/components/account-status-notice";
import { SessionProvider } from "@/features/auth/components/session-provider";
import { getServerSession } from "@/lib/auth/session";

import { CmsShell } from "./_layout/CmsShell";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  // A cookie the BE no longer accepts must be cleared first, or /login bounces back to /dashboard.
  if (!session) redirect("/api/v1/admin/auth/session-expired");

  return (
    <SessionProvider session={session}>
      {session.status === "ACTIVE" ? (
        <CmsShell>{children}</CmsShell>
      ) : (
        <AccountStatusNotice status={session.status} />
      )}
    </SessionProvider>
  );
}
```

- [ ] **Step 5: Permission-aware menu**

In `src/app/(cms)/_layout/constants/route.constants.tsx`:

1. `import type { MerchantPermission } from "@/features/auth/permissions";`
2. Export the types: `export interface SidebarItem { … permission?: MerchantPermission; }` and `export interface SidebarSection { … }` (add `export`, add the `permission` field).
3. Add `permission` to the items: "Quản lý quyền hạn" → `"MANAGE_PERMISSION_GROUP"`; "Quản lý nhân sự" → `"MANAGE_USER"`; "Danh sách Sub Merchant" → `"MANAGE_SUB_MERCHANT"`; "Danh sách giao dịch" → `"VIEW_TRANSACTION"`; "Quản lý Đơn hàng" → `"VIEW_ORDER"`; "Hoàn tiền" → `"VIEW_REFUND"`; "Khiếu nại" → `"VIEW_DISPUTE"`; "Lịch sử Rút Tiền" → `"VIEW_WITHDRAWAL"`. "Tổng quan" has no permission.
4. Append:

```ts
export function filterRoutesByPermissions(
  sections: SidebarSection[],
  permissions: readonly MerchantPermission[],
): SidebarSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || permissions.includes(item.permission)),
    }))
    .filter((section) => section.items.length > 0);
}
```

In `SideBar.tsx`:
- remove `import { useSessionQuery } from "@/features/auth/hooks/use-session-query";`; add `import { useSession } from "@/features/auth/components/session-provider";`, `import { filterRoutesByPermissions, routesConfig } from "./constants/route.constants";` (merge with the existing `routesConfig` import) and add `useMemo` to the existing `react` import.
- replace `const { data: session } = useSessionQuery();` with `const session = useSession();` and `const displayName = session?.username ?? "";` / `displayEmail` with `session.username` / `session.email ?? ""`.
- add `const visibleRoutes = useMemo(() => filterRoutesByPermissions(routesConfig, session.permissions), [session.permissions]);` and change `routesConfig.map((section) => {` to `visibleRoutes.map((section) => {`.

Delete `src/features/auth/hooks/use-session-query.ts`. Run `grep -rn "use-session-query\|sessionQueryKey" src` — the only remaining match must be the unrelated dashboard hook; otherwise fix.

- [ ] **Step 6: Run to verify pass**

Run: `npx vitest run && npm run typecheck && npm run lint && npm run build`
Expected: every test PASSES (route filter 3, provider 3, plus earlier); typecheck, lint and build clean. Build requires `IDENTITY_BASE_URL`/`MERCHANT_BASE_URL` only at request time, so it must succeed without them.

- [ ] **Step 7: Manual check (controller)**

Sign in as a user whose permissions lack `VIEW_REFUND`: the sidebar must hide "Hoàn tiền" and show the rest granted. Sign in as a `LOCKED` user: the status notice replaces the shell and "Đăng xuất" works. Delete the access cookie while keeping the refresh cookie and reload: the page loads (silent refresh). Corrupt the access token value: `/dashboard` lands on `/login` without a redirect loop.

- [ ] **Step 8: Commit (controller)**

```bash
git add -A "src/app/(cms)" src/features/auth
git commit -m "feat(auth): server-load the session and hide menu items without permission" -- "src/app/(cms)" src/features/auth
```

---

## Task 11: Hybrid query infrastructure

**Files:**
- Create: `src/lib/query/query-client.ts`, `src/lib/query/prefetch.ts`, `src/lib/query/prefetch.test.ts`, `src/lib/query/hybrid.integration.test.tsx`
- Modify: `src/components/providers/query-provider.tsx`

**Interfaces:**
- Consumes: `BeResult`; `@tanstack/react-query` (`QueryClient`, `dehydrate`, `HydrationBoundary`, `isServer`).
- Produces (exact):
  - `makeQueryClient(): QueryClient` — shared defaults (`staleTime: 60_000`, `refetchOnWindowFocus: false`, queries `retry: 1`, mutations `retry: 0`).
  - `unwrapOrRedirect<T>(result: BeResult<T>): T` — returns data; a `401` redirects to `/api/v1/admin/auth/session-expired`; any other error throws `Error(code)` so `prefetchQuery` swallows it and the client refetches.
  - `prefetchDehydrated(prefetch: (client: QueryClient) => Promise<void>): Promise<DehydratedState>` — creates a request-scoped client, runs the prefetch, returns `dehydrate(client)`.

Read first: `.claude/patterns/hybrid-query.md`, `.claude/rules/NEXTJS-PERFORMANCE.md`.

- [ ] **Step 1: Write failing tests**

`src/lib/query/prefetch.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import { fail, ok } from "@/lib/http/result";
import type { BeError } from "@/lib/be/errors";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

const error = (status: number, code: string): BeError => ({ status, code, message: "m" });

describe("unwrapOrRedirect", () => {
  it("returns the data of a successful result", async () => {
    const { unwrapOrRedirect } = await import("@/lib/query/prefetch");
    expect(unwrapOrRedirect(ok({ id: 1 }))).toEqual({ id: 1 });
  });

  it("redirects to the session-expired route on 401", async () => {
    const { unwrapOrRedirect } = await import("@/lib/query/prefetch");
    expect(() => unwrapOrRedirect(fail(error(401, "UNAUTHORIZED"), "UNAUTHORIZED"))).toThrow(
      "NEXT_REDIRECT:/api/v1/admin/auth/session-expired",
    );
  });

  it("throws the error code for other failures so the client can refetch", async () => {
    const { unwrapOrRedirect } = await import("@/lib/query/prefetch");
    expect(() => unwrapOrRedirect(fail(error(500, "HTTP_500"), "HTTP_500"))).toThrow("HTTP_500");
  });
});
```

`src/lib/query/hybrid.integration.test.tsx`:

```tsx
// @vitest-environment jsdom
import { HydrationBoundary, QueryClientProvider, queryOptions, useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeQueryClient } from "@/lib/query/query-client";

const clientFetch = vi.fn(async () => ({ items: ["from-client"] }));

const listQueries = {
  list: (filters: { page: number }) =>
    queryOptions({
      queryKey: ["things", filters] as const,
      queryFn: clientFetch,
      staleTime: 30_000,
    }),
};

function ThingList({ filters }: { filters: { page: number } }) {
  const query = useQuery(listQueries.list(filters));
  if (query.isPending) return <p>loading</p>;
  if (query.isError) return <p role="alert">error</p>;
  return <ul>{query.data.items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

describe("Hybrid: server prefetch → HydrationBoundary → useQuery", () => {
  it("renders prefetched data without an immediate client refetch", async () => {
    const { dehydrate } = await import("@tanstack/react-query");
    const serverClient = makeQueryClient();
    await serverClient.prefetchQuery({
      ...listQueries.list({ page: 1 }),
      queryFn: async () => ({ items: ["from-server"] }),
    });
    const state = dehydrate(serverClient);

    render(
      <QueryClientProvider client={makeQueryClient()}>
        <HydrationBoundary state={state}>
          <ThingList filters={{ page: 1 }} />
        </HydrationBoundary>
      </QueryClientProvider>,
    );

    expect(screen.getByText("from-server")).toBeInTheDocument();
    expect(clientFetch).not.toHaveBeenCalled();
  });

  it("falls back to the client fetch when the server prefetch failed", async () => {
    const { dehydrate } = await import("@tanstack/react-query");
    const serverClient = makeQueryClient();
    await serverClient.prefetchQuery({
      ...listQueries.list({ page: 2 }),
      queryFn: async () => {
        throw new Error("HTTP_500");
      },
    });

    render(
      <QueryClientProvider client={makeQueryClient()}>
        <HydrationBoundary state={dehydrate(serverClient)}>
          <ThingList filters={{ page: 2 }} />
        </HydrationBoundary>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("from-client")).toBeInTheDocument();
    expect(clientFetch).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/query`
Expected: FAIL — modules missing.

- [ ] **Step 3: Implement**

`src/lib/query/query-client.ts`:

```ts
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
```

`src/lib/query/prefetch.ts`:

```ts
import "server-only";
import { dehydrate, type DehydratedState, type QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";

import type { BeResult } from "@/lib/be/client";
import { makeQueryClient } from "@/lib/query/query-client";

const SESSION_EXPIRED_PATH = "/api/v1/admin/auth/session-expired";

/**
 * For a server `queryFn` override: returns the data, sends an expired session to the
 * cookie-clearing route, and turns any other failure into a thrown error that
 * `prefetchQuery` swallows so the client refetches and renders its Error state.
 */
export function unwrapOrRedirect<T>(result: BeResult<T>): T {
  if (result.success) return result.data;
  if (result.error.status === 401) redirect(SESSION_EXPIRED_PATH);
  throw new Error(result.error.code);
}

/** Creates a request-scoped client, runs the prefetches and returns the state for `HydrationBoundary`. */
export async function prefetchDehydrated(
  prefetch: (client: QueryClient) => Promise<void>,
): Promise<DehydratedState> {
  const client = makeQueryClient();
  await prefetch(client);
  return dehydrate(client);
}
```

`src/components/providers/query-provider.tsx`: delete the local `makeQueryClient` function and import it instead: `import { makeQueryClient } from "@/lib/query/query-client";`. Keep `getQueryClient`, `QueryProvider` and the `isServer` logic unchanged (remove the now-unused `QueryClient` import if lint requires).

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: prefetch 3 tests PASS, hybrid 2 tests PASS; all earlier tests still PASS; typecheck and lint clean.

- [ ] **Step 5: Commit (controller)**

```bash
git add src/lib/query src/components/providers/query-provider.tsx
git commit -m "feat(query): add shared QueryClient factory and Hybrid prefetch helpers" -- src/lib/query src/components/providers/query-provider.tsx
```

---

## Task 12: Align project docs with the implemented conventions

> **Controller: do not dispatch until the user confirms teal as the single primary button color.** This task edits `.claude/` documentation only.

**Files:**
- Modify: `.claude/DESIGN.md`, `.claude/workflows/frontend.md`, `.claude/project-context/CONTEXT.md`, `.claude/patterns/hybrid-query.md`

**Interfaces:** none (documentation).

- [ ] **Step 1: `.claude/DESIGN.md`**

Replace the bullet starting `- CTA chính dùng \`Button variant="action"\` (vàng)…` with:

```
- CTA chính dùng `Button` mặc định `variant="solid"` (teal đặc); CTA phụ dùng `outline`; hành động nhẹ (Quay lại, Xóa mã, Xóa bộ lọc) dùng `ghost`; xác nhận phá huỷ dùng `danger`. Mỗi màn hình và mỗi modal tối đa một CTA chính. Màu `action` (vàng) không dùng cho nút.
```

Append these bullets to the same "Quy tắc" list:

```
- Trang danh sách: card bộ lọc (các ô cùng một hàng, hai nút Xóa bộ lọc và Tìm kiếm ở hàng dưới, căn phải) tách khỏi card bảng; phân trang nằm trong card bảng.
- Thao tác trong dòng bảng là icon button (`ghost`) kèm tooltip và `aria-label` nêu hành động và đối tượng; các dòng dùng chung số khe icon cố định để icon thẳng cột. Nút chính ở đầu trang có chữ kèm icon.
- Form ít trường hoặc chỉ xem dùng modal; form nhiều bước hoặc nhiều nhóm trường dùng trang riêng.
- Lưới form luôn đều cột (2 cột, 3 cột khi đúng 3 trường); mục lẻ cuối hàng trải hết hàng; badge trạng thái trong bảng cùng chiều rộng.
```

- [ ] **Step 2: `.claude/workflows/frontend.md`**

Replace `- Hành động chính của màn hình (đúng một CTA \`variant="action"\`) và hành động phá huỷ nếu có.` with `- Hành động chính của màn hình (đúng một CTA \`variant="solid"\`, teal) và hành động phá huỷ nếu có.` and replace the anti-pattern `- Hơn một CTA vàng trên cùng màn hình.` with `- Hơn một CTA chính (teal đặc) trên cùng màn hình hoặc modal.`. In "Bố cục theo mẫu quen thuộc", replace the first bullet (Trang danh sách) with: `- Trang danh sách: tiêu đề + CTA chính, card bộ lọc, card bảng (phân trang trong card). Filter và phân trang đồng bộ với \`searchParams\`.`

- [ ] **Step 3: `.claude/project-context/CONTEXT.md`**

In "Lệnh kiểm tra" add `npm run test` after `npm run lint`. In "Vị trí quan trọng" replace the `server-client.ts` line with: `- BE client: \`src/lib/be/\` (typed, Zod-parsed \`Result<T, BeError>\`); server env \`IDENTITY_BASE_URL\`, \`MERCHANT_BASE_URL\`, \`MERCHANT_API_MODE\` (xem \`.env.example\`); session \`src/lib/auth/session.ts\` (\`getServerSession\` đọc \`/merchant/me\`).` and add `- Test: Vitest + Testing Library + msw (\`npm run test\`).`

- [ ] **Step 4: `.claude/patterns/hybrid-query.md`**

Append before "Cấm":

```
## Helper trong repo

- `src/lib/query/query-client.ts` — `makeQueryClient()` dùng chung cho browser provider và request-scoped client ở server.
- `src/lib/query/prefetch.ts` — `prefetchDehydrated(prefetch)` tạo client riêng cho request và trả state cho `HydrationBoundary`; `unwrapOrRedirect(result)` dùng trong `queryFn` override ở server: 401 chuyển tới `/api/v1/admin/auth/session-expired`, lỗi khác ném `Error(code)` để client refetch.
- Ví dụ kiểm thử luồng Server → Hydration → Query: `src/lib/query/hybrid.integration.test.tsx`.
```

- [ ] **Step 5: Verify**

Run: `grep -rn 'variant="action"' .claude` → expected: no match. Run `npm run check` → expected PASS.

- [ ] **Step 6: Commit (controller)**

```bash
git add .claude/DESIGN.md .claude/workflows/frontend.md .claude/project-context/CONTEXT.md .claude/patterns/hybrid-query.md
git commit -m "docs: align design and workflow docs with teal primary and card layout" -- .claude/DESIGN.md .claude/workflows/frontend.md .claude/project-context/CONTEXT.md .claude/patterns/hybrid-query.md
```

---

## Self-Review

**Spec coverage (spec §5, Đợt 1):**
- 1.0 test infra → Task 1. 1.1 BE client + env + `MERCHANT_API_MODE` flag → Task 2 (flag parsed and exposed; consumed by Đợt 2 plans). 1.2 merchant login/OTP/refresh/logout/password flows → Tasks 3, 4, 8, 9. 1.3 session via `/me`, server refresh, optimistic `proxy` → Tasks 5, 6, 7. 1.4 menu/buttons by permission and `PENDING`/`LOCKED` handling → Task 10 (menu + status notice; per-button gating is applied per module in Đợt 2 via `useHasPermission`). 1.5 Hybrid infrastructure → Task 11. UI conventions and docs alignment → Task 12.
- Spec §3 (BE dependency) and §6 (Đợt 2 modules) are intentionally not in this plan.

**Placeholder scan:** no TBD/TODO; every code step has code. The two places that say "keep the existing implementation" (`handleCors` in Task 6, the left-panel JSX in Task 9) name exact source blocks to preserve verbatim, not behavior to invent.

**Type consistency:** `TokenPair`, `OtpChallenge`, `LoginChallenge` (Task 3) are consumed unchanged in Tasks 5, 6, 8. `BeClient`/`BeResult` (Task 2) used in Tasks 3–5, 11. `SessionUser` (Task 5) used in Tasks 10 and the provider test. `OtpChallengeView` (Task 8) is consumed by Task 9 `LoginFormPanel`. `refreshTokensOnce` (Task 6) is used by Task 8's refresh route and proxy. `session-expired` route (Task 8) is the target in Tasks 7, 10, 11. `useSessionQuery` is removed only in Task 10, after Task 8 confirmed no other consumer.

**Known deviations to watch (controller):** the assumption that BE durations are seconds (Task 8 manual check); `Button` props `size="sm"`/`leftIcon` in Task 9; msw/`NextResponse.cookies` behaviour in the proxy test (Step 4 note). Any deviation from the plan must be reported in Codex's answer.
