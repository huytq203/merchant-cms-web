# Frontend Architecture Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `.claude/` with enforceable domain structure, Hybrid TanStack Query, Next.js loading/cache performance, behavior-based testing, and Brainstorming/Impeccable gates.

**Architecture:** Keep `.claude/rules/RULE.md` as the compact core and add focused canonical rules for structure, testing, and Next.js performance. Put executable examples in `patterns/`, then route every step and agent to only the documents relevant to its responsibility.

**Tech Stack:** Markdown, Next.js 16.2.4 App Router, React 19.2.4, TanStack Query 5, TanStack Table 8, Testing Library conventions, Basuicn, Impeccable

**Spec:** `docs/superpowers/specs/2026-10-02-frontend-architecture-rules-design.md`

## Global Constraints

- Documentation-only implementation; do not refactor application source.
- Preserve all unrelated user changes in the dirty `main` worktree.
- Do not create commits unless the user explicitly changes the current no-commit instruction.
- Next.js guidance must match `node_modules/next/dist/docs/` for version 16.2.4.
- Feature folders follow the approved domain structure, including `columns/` and `hooks/`.
- Component limit is 200 lines; function limit is 50 lines; limits must not encourage meaningless splits.
- Every route with `page.tsx` requires a layout-matching `loading.tsx` skeleton.
- Hybrid hydration is conditional, not mandatory for read-only server-rendered data.
- Tests verify behavior and semantics; presentation copy is not asserted unless it is a contract.
- Brainstorming and Impeccable run before feature/UI code at a depth proportional to the task.
- Basuicn remains the mandatory first source for reusable UI.
- Avoid abstractions, cache layers, memoization, virtualization, and custom prefetching without demonstrated need.

## Review Focus

- A table feature has complex cell UI: column definitions stay in `columns/`, while interactive cell components move to `components/` and logic to hooks.
- A read-only page does not need browser refetch: rules must allow Server-only rendering instead of forcing Hybrid hydration.
- Hydrated client data becomes stale immediately: rules require shared query options/key and an intentional `staleTime` to prevent accidental duplicate fetches.
- Private user data is considered for caching: rules must forbid shared server caching and require server authorization.
- A test avoids copy assertions by using `data-testid` everywhere: rules must require semantic queries first and limit test IDs to cases with no stable semantic selector.

---

### Task 1: Add domain structure and testing rules

**Files:**
- Create: `.claude/rules/STRUCTURE.md`
- Create: `.claude/rules/TESTING.md`
- Modify: `.claude/rules/RULE.md`

**Interfaces:**
- Consumes: approved feature tree and testing policy from the spec.
- Produces: canonical structure/testing contracts consumed by steps, workflows, patterns, and agents in later tasks.

- [ ] **Step 1: Run RED assertions for missing canonical rules**

Run:

```bash
test -e .claude/rules/STRUCTURE.md && test -e .claude/rules/TESTING.md
```

Expected: FAIL because one or both rule files do not exist.

- [ ] **Step 2: Create `.claude/rules/STRUCTURE.md`**

Include the exact approved tree for `src/features/<feature>/` and `src/app/(cms)/<route>/`. Define responsibilities for `components/`, `columns/`, `hooks/`, `schemas/`, `constants/`, `utils/`, `types.ts`, route `_components/`, `page.tsx`, `loading.tsx`, and `error.tsx`.

The rule must state:

- Component ≤ 200 lines and function ≤ 50 lines.
- One describable responsibility per file.
- JSX in components; state/event/query orchestration in hooks; pure transforms in utils.
- Complex interactive cells move from column definitions into feature components.
- Column factories receive typed callbacks/options rather than reaching into mutable global state.
- No empty convention folders, speculative barrels, or shared abstraction before two real consumers.
- Existing services are not moved merely for symmetry.

- [ ] **Step 3: Create `.claude/rules/TESTING.md`**

Use these canonical sections:

```md
# Quy tắc testing

## Logic thuần
## Hooks
## UI behavior và accessibility
## Text và selectors
## Integration và E2E
## TDD và verification
```

Require logic boundary cases, hook transitions and cleanup, user interactions, keyboard/focus, semantic roles/states, four data states, and critical Hybrid integration tests.

Explicitly forbid assertions against decorative copy, unstable placeholders, full-component snapshots, exact Tailwind classes, internal state, and implementation details. Allow text assertions only for validation, security warnings, required errors, user data values, and i18n contracts. Require semantic selectors before `data-testid`.

- [ ] **Step 4: Make `RULE.md` delegate to specialized rules**

Keep core constraints in `.claude/rules/RULE.md`, but replace duplicated detail with direct Markdown links:

```md
- Cấu trúc và giới hạn file: [STRUCTURE.md](STRUCTURE.md).
- Testing behavior: [TESTING.md](TESTING.md).
- Next.js rendering/cache/performance: [NEXTJS-PERFORMANCE.md](NEXTJS-PERFORMANCE.md).
```

Do not remove Basuicn or design-system links.

- [ ] **Step 5: Run GREEN assertions**

Run:

```bash
test -s .claude/rules/STRUCTURE.md
test -s .claude/rules/TESTING.md
rg -n "columns/|hooks/|200 dòng|50 dòng|hai consumer|overengineering" .claude/rules/STRUCTURE.md
rg -n "Logic thuần|Hooks|UI behavior|accessibility|getByRole|data-testid|validation|snapshot|presentation|copy" .claude/rules/TESTING.md
rg -n "STRUCTURE.md|TESTING.md|NEXTJS-PERFORMANCE.md" .claude/rules/RULE.md
```

Expected: all commands exit `0`; structure and testing safeguards are present.

### Task 2: Add Next.js performance, Hybrid Query, and page-loading guidance

**Files:**
- Create: `.claude/rules/NEXTJS-PERFORMANCE.md`
- Create: `.claude/patterns/hybrid-query.md`
- Create: `.claude/patterns/page-loading.md`
- Modify: `.claude/workflows/nextjs.md`

**Interfaces:**
- Consumes: structure/testing rules from Task 1 and Next.js 16 local documentation.
- Produces: rendering, cache, hydration, skeleton, and page-load contracts consumed by steps and agents.

- [ ] **Step 1: Run RED assertions for missing performance guidance**

Run:

```bash
test -e .claude/rules/NEXTJS-PERFORMANCE.md && test -e .claude/patterns/hybrid-query.md && test -e .claude/patterns/page-loading.md
```

Expected: FAIL because the performance rule and patterns do not exist.

- [ ] **Step 2: Create `.claude/rules/NEXTJS-PERFORMANCE.md`**

The rule must cover:

- Server Components by default and the smallest possible client boundary.
- Server-only, Client-only query, and Hybrid selection criteria.
- Public/time-revalidated, public/tag-invalidated, private/user-scoped, and realtime/fresh cache classifications.
- Parallel independent requests; sequential dependent requests only.
- No duplicate page/hook/child fetch ownership.
- No Route Handler proxy for server-internal calls.
- Query-key completeness and scoped invalidation.
- Separate TanStack `staleTime` and server cache lifetime.
- `next/link`, `next/image`, `next/font`, metadata, native prefetch defaults, and measured exceptions.
- No speculative memoization, dynamic import, virtualization, debounce, cache layer, or custom prefetch.

Require the agent to read relevant local Next.js docs before selecting concrete cache/revalidation APIs.

- [ ] **Step 3: Create `.claude/patterns/hybrid-query.md`**

Describe the flow:

```text
Server Component → request-scoped QueryClient → prefetchQuery → dehydrate
→ HydrationBoundary → same queryOptions/query key in Client Component
→ TanStack Query owns browser refetch/mutations
```

Include compact TypeScript examples for a shared query contract, server hydration, and client `useQuery`/`useSuspenseQuery`. Examples must use matching keys, intentional `staleTime`, URL-derived filter/pagination inputs, and a stable browser QueryClient.

Document when not to use Hybrid: read-only server output or data introduced only after interaction. Forbid combining manual `initialData` and HydrationBoundary for the same query, hydrating secrets, and serializing oversized data.

- [ ] **Step 4: Create `.claude/patterns/page-loading.md`**

Require every route containing `page.tsx` to contain `loading.tsx`. Provide structure guidance for table, form, and detail skeletons. Require route skeletons to match toolbar, columns, rows, pagination, labels, controls, headers, and content sections as applicable.

Describe granular Suspense only for independently useful or independently slow regions. State that skeletons should be lightweight Server Components without fetch/effect and should minimize layout shift.

- [ ] **Step 5: Update the Next.js workflow**

Add direct links to:

- `../rules/NEXTJS-PERFORMANCE.md`
- `../patterns/hybrid-query.md`
- `../patterns/page-loading.md`
- `../rules/TESTING.md`

Make the workflow explicitly require choosing Server-only, Client-only, or Hybrid before implementation.

- [ ] **Step 6: Run GREEN assertions**

Run:

```bash
rg -n "Server-only|Client-only|Hybrid|private|shared cache|Promise.all|waterfall|prefetch|overengineering" .claude/rules/NEXTJS-PERFORMANCE.md
rg -n "QueryClient|prefetchQuery|dehydrate|HydrationBoundary|queryOptions|staleTime|initialData" .claude/patterns/hybrid-query.md
rg -n "loading.tsx|table|form|detail|Suspense|layout shift" .claude/patterns/page-loading.md
rg -n "NEXTJS-PERFORMANCE.md|hybrid-query.md|page-loading.md|TESTING.md" .claude/workflows/nextjs.md
```

Expected: all required patterns and links are present.

### Task 3: Add Brainstorming and Impeccable gates to frontend workflow

**Files:**
- Modify: `.claude/workflows/frontend.md`
- Modify: `.claude/CLAUDE.md`

**Interfaces:**
- Consumes: canonical rules and patterns from Tasks 1–2, Basuicn policy, and existing `.claude/DESIGN.md`.
- Produces: the mandatory pre-code decision sequence used by all UI-capable agents.

- [ ] **Step 1: Run RED assertion for missing gates**

Run:

```bash
rg -n "Brainstorming.*Impeccable|Impeccable.*Brainstorming" .claude/CLAUDE.md .claude/workflows/frontend.md
```

Expected: FAIL because both gates are not yet defined together.

- [ ] **Step 2: Add the pre-code gate to the frontend workflow**

Require this order:

1. Brainstorm goal, actor, flow, states, boundaries, and acceptance criteria.
2. Use Impeccable `shape` for new surfaces, `audit`/`critique` for existing UI, or `optimize` for UI performance.
3. Read `.claude/DESIGN.md` and check Basuicn.
4. Choose Server/Client/Hybrid ownership.
5. Define skeleton, error, empty, and data states.
6. Write a failing behavior test.
7. Implement.

State that Merchant CMS is an Impeccable **Operate** surface: scanability, consistency, accessibility, and task completion outrank decorative novelty.

- [ ] **Step 3: Add proportional-process exceptions**

Allow typo, simple copy, behavior-preserving refactor, and small fully-reproduced bugfix to use a short goal/scope/verification note instead of a full design artifact. Preserve the requirement to use the systematic bugfix step where applicable.

- [ ] **Step 4: Update `.claude/CLAUDE.md` canonical routes**

Add canonical links for `STRUCTURE.md`, `TESTING.md`, `NEXTJS-PERFORMANCE.md`, `hybrid-query.md`, and `page-loading.md`. Add a mandatory line that feature/UI tasks complete Brainstorming and the appropriate Impeccable command before implementation.

- [ ] **Step 5: Run GREEN assertions**

Run:

```bash
rg -n "Brainstorm|Impeccable|shape|audit|critique|optimize|Operate|typo|overengineering" .claude/workflows/frontend.md
rg -n "STRUCTURE.md|TESTING.md|NEXTJS-PERFORMANCE.md|hybrid-query.md|page-loading.md|Brainstorm|Impeccable" .claude/CLAUDE.md
```

Expected: router and frontend workflow contain every gate and canonical link.

### Task 4: Route task steps through the new architecture

**Files:**
- Modify: `.claude/steps/new-feature.md`
- Modify: `.claude/steps/new-component.md`
- Modify: `.claude/steps/add-api-query.md`
- Modify: `.claude/steps/bugfix.md`

**Interfaces:**
- Consumes: rules/patterns from Tasks 1–3.
- Produces: task-specific checklists that agent definitions invoke.

- [ ] **Step 1: Run RED assertion for incomplete step coverage**

Run:

```bash
for file in .claude/steps/*.md; do rg -q "TESTING.md" "$file" || exit 1; done
```

Expected: FAIL because current steps do not all link the testing rule.

- [ ] **Step 2: Update `new-feature.md`**

Require:

- Brainstorming and appropriate Impeccable command.
- Approved domain structure and `columns/` for tables.
- Server-only/Client-only/Hybrid decision.
- Cache/freshness/invalidation owner.
- `loading.tsx` and layout-matching skeleton.
- Behavior-first tests and anti-overengineering check.

- [ ] **Step 3: Update `new-component.md`**

Require structure and testing rules, Basuicn check, Impeccable visual/UX decision, behavior/a11y tests, semantic selectors, four states when data-driven, and skeleton structure when used as a page fallback.

- [ ] **Step 4: Update `add-api-query.md`**

Require Server-only/Client-only/Hybrid choice, query contract shared between server/client, URL/query-key completeness, `staleTime`, private-cache safety, parallelization, invalidation scope, and Hybrid integration tests for critical flows.

- [ ] **Step 5: Update `bugfix.md`**

Require the testing rule, smallest appropriate regression level, and performance/cache investigation only when evidence points there. Explicitly forbid introducing a new abstraction or cache layer as an unproven bugfix.

- [ ] **Step 6: Run GREEN assertions**

Run:

```bash
for file in .claude/steps/*.md; do rg -q "TESTING.md" "$file" || exit 1; done
rg -n "STRUCTURE.md|columns/|Hybrid|loading.tsx|Brainstorm|Impeccable|overengineering" .claude/steps/new-feature.md
rg -n "getByRole|semantic|accessibility|Basuicn|Impeccable" .claude/steps/new-component.md
rg -n "Server-only|Client-only|Hybrid|staleTime|query key|private|parallel" .claude/steps/add-api-query.md
rg -n "regression|abstraction|cache layer|bằng chứng" .claude/steps/bugfix.md
```

Expected: each step contains only its relevant mandatory decisions and links.

### Task 5: Update agent enforcement and validate the documentation graph

**Files:**
- Modify: `.claude/agents/frontend-builder.md`
- Modify: `.claude/agents/ui-implementer.md`
- Modify: `.claude/agents/code-reviewer.md`
- Modify: `.claude/agents/codex-implementer.md`

**Interfaces:**
- Consumes: the complete canonical documentation graph from Tasks 1–4.
- Produces: agents that enforce the new structure, performance, loading, testing, and design gates.

- [ ] **Step 1: Run RED assertion for missing agent enforcement**

Run:

```bash
for file in .claude/agents/frontend-builder.md .claude/agents/ui-implementer.md .claude/agents/code-reviewer.md .claude/agents/codex-implementer.md; do
  rg -q "STRUCTURE.md" "$file" && rg -q "TESTING.md" "$file" || exit 1
done
```

Expected: FAIL because the agent definitions do not yet reference both new rules.

- [ ] **Step 2: Update frontend and UI implementers**

`frontend-builder.md` must require Brainstorming, appropriate Impeccable use, structure/data-pattern/loading/testing decisions, and Basuicn before code.

`ui-implementer.md` must enforce Impeccable Operate priorities, page skeleton continuity, semantic interaction tests, and the existing Basuicn absence gate.

- [ ] **Step 3: Update reviewer**

Add review items for:

- Feature placement and `columns/` purity.
- 200/50-line limits without meaningless splits.
- Server/Client/Hybrid selection.
- Query-key/staleTime/hydration consistency.
- Private cache safety and invalidation ownership.
- Every page route's skeleton.
- Behavioral/semantic tests without presentation-copy coupling.
- Overengineering and speculative optimization.

- [ ] **Step 4: Update delegated Codex prompts**

Make `codex-implementer.md` include `STRUCTURE.md`, `TESTING.md`, and `NEXTJS-PERFORMANCE.md` in delegated prompts when relevant. UI/feature prompts must require Brainstorming/Impeccable decisions already approved by the controller; the implementer must not invent a new visual direction.

- [ ] **Step 5: Validate all local Markdown links and literal `.claude/*.md` paths**

Run:

```bash
node <<'NODE'
const fs = require('fs');
const path = require('path');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory()
      ? walk(full)
      : entry.name.endsWith('.md')
        ? [full]
        : [];
  });
}

const failures = [];
for (const file of walk('.claude')) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+\.md(?:#[^)]+)?)\)/g)) {
    const target = match[1].split('#')[0];
    if (/^(?:https?:)?\/\//.test(target)) continue;
    if (!fs.existsSync(path.resolve(path.dirname(file), target))) {
      failures.push(`${file} -> ${target}`);
    }
  }
  for (const match of source.matchAll(/`(\.claude\/[^`]+\.md)`/g)) {
    if (!fs.existsSync(match[1])) failures.push(`${file} -> ${match[1]}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('All local Markdown links and .claude paths are valid.');
NODE
```

Expected: `All local Markdown links and .claude paths are valid.`

- [ ] **Step 6: Validate policy coverage and contradictions**

Run:

```bash
rg -n "STRUCTURE.md|TESTING.md|NEXTJS-PERFORMANCE.md" .claude/agents
rg -n "Brainstorm|Impeccable" .claude/agents/frontend-builder.md .claude/agents/ui-implementer.md
rg -n "columns/|HydrationBoundary|staleTime|loading.tsx|presentation.*text|data-testid|overengineering" .claude/rules .claude/patterns .claude/agents/code-reviewer.md
if rg -n "mọi.*query.*Hybrid|Hybrid.*mọi|cache mọi|test mọi text|data-testid.*ưu tiên" .claude; then exit 1; fi
```

Expected: all required coverage is present and no absolute rule forces Hybrid/cache/text coupling.

- [ ] **Step 7: Run final formatting and scope checks**

Run:

```bash
git diff --check -- .claude docs/superpowers/specs/2026-10-02-frontend-architecture-rules-design.md docs/superpowers/plans/2026-10-02-frontend-architecture-rules.md
git status --short -- .claude docs/superpowers
```

Expected: no whitespace errors; only intended documentation paths from this task and preserved pre-existing user changes are reported.
