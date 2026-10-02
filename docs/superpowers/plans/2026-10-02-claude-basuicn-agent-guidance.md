# Claude and Basuicn Agent Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `.claude/` into a navigable agent documentation system that requires Basuicn-first UI development and stops for user direction when the registry lacks a suitable component.

**Architecture:** `.claude/CLAUDE.md` becomes the single entry point. Canonical content is split by responsibility into `project-context/`, `rules/`, `workflows/`, `steps/`, and `patterns/`; legacy root-level Markdown files remain as small compatibility shims. Agent definitions reference only canonical, existing paths.

**Tech Stack:** Markdown, Claude agent definitions, Next.js 16, React 19, Tailwind CSS v4, Basuicn CLI

**Spec:** `docs/superpowers/specs/2026-10-02-claude-basuicn-agent-guidance-design.md`

## Global Constraints

- Preserve `.claude/DESIGN.md` as the current design-system source of truth.
- Preserve `.claude/RULE.md`, `.claude/FE_WORKFLOW.md`, `.claude/WORKFLOW_NEXTJS.md`, and `.claude/REACT-VITE-WORKFLOW.md` as compatibility shims.
- Do not run any Basuicn mutation command while implementing this documentation-only plan.
- Do not modify application source, package configuration, Next.js configuration, or Tailwind configuration.
- Basuicn is the required first source for reusable UI components.
- If Basuicn has no suitable component, agents must stop before implementing alternative UI and request a user decision.
- `npx basuicn init`, `update`, `remove`, and `--force` require explicit user confirmation.
- Do not overwrite or revert unrelated user changes in the dirty worktree.
- Use Vietnamese for agent-facing project guidance, matching the existing files.

## Review Focus

- A legacy prompt opens a root-level `.claude/*.md` file: it must reach the canonical document through a valid relative link.
- An agent needs a component absent locally but present in Basuicn: it must use `list` then `add`, without asking to invent a replacement.
- An agent needs a component absent from Basuicn: it must stop and present the prescribed decision template before writing UI.
- An existing Basuicn component has local edits: guidance must forbid destructive `update` or `--force` without explicit confirmation.
- A Next.js task uses a potentially changed framework API: guidance must require reading `node_modules/next/dist/docs/` before coding.

---

### Task 1: Create the canonical router and project context

**Files:**
- Create: `.claude/CLAUDE.md`
- Create: `.claude/project-context/CONTEXT.md`

**Interfaces:**
- Consumes: `AGENTS.md`, `package.json`, `.claude/DESIGN.md`, and the approved spec.
- Produces: the canonical entry point and project facts referenced by all later steps and agent definitions.

- [ ] **Step 1: Verify the canonical files do not already exist**

Run:

```bash
test ! -e .claude/CLAUDE.md && test ! -e .claude/project-context/CONTEXT.md
```

Expected: exit code `0`. If either file now exists, inspect it and merge deliberately instead of overwriting it.

- [ ] **Step 2: Create `.claude/CLAUDE.md` as the routing document**

Write these sections with valid relative Markdown links:

```md
# AI Agent Router

## Bắt buộc trước khi làm việc

1. Đọc [bối cảnh dự án](project-context/CONTEXT.md).
2. Chọn đúng hướng dẫn trong `steps/` theo loại task.
3. Đọc các rule, pattern và workflow được step đó dẫn tới.
4. Với task UI, luôn đọc [quy tắc Basuicn](rules/BASUICN.md) và [quy trình UI component](patterns/ui-components.md).
5. Với Next.js, đọc tài liệu phù hợp trong `node_modules/next/dist/docs/` trước khi dùng API hoặc convention của framework.

## Chọn step

- Feature mới: [new-feature.md](steps/new-feature.md)
- Component mới: [new-component.md](steps/new-component.md)
- API hoặc query hook: [add-api-query.md](steps/add-api-query.md)
- Bugfix: [bugfix.md](steps/bugfix.md)

## Nguồn canonical

- Coding rules: [rules/RULE.md](rules/RULE.md)
- Basuicn: [rules/BASUICN.md](rules/BASUICN.md)
- Design system: [DESIGN.md](DESIGN.md)
- Frontend workflow: [workflows/frontend.md](workflows/frontend.md)
- Next.js workflow: [workflows/nextjs.md](workflows/nextjs.md)
- React/Vite workflow: [workflows/react-vite.md](workflows/react-vite.md)
```

- [ ] **Step 3: Create `.claude/project-context/CONTEXT.md` from repository facts**

Include exactly these facts and boundaries:

````md
# Bối cảnh dự án Merchant CMS

## Stack

- Next.js 16.2.4, App Router
- React 19.2.4 và TypeScript
- Tailwind CSS v4
- Basuicn components tại `src/components/ui/<name>/`
- Base UI, TanStack Query, React Hook Form và Zod

## Ranh giới kiến trúc

- Server Component là mặc định; chỉ thêm `'use client'` ở lá cần tương tác.
- UI dùng component Basuicn trước khi cân nhắc giải pháp khác.
- Không đoán API Next.js; đọc `node_modules/next/dist/docs/`.
- Không đưa secret, truy vấn DB hoặc logic đặc quyền vào Client Component.

## Lệnh kiểm tra

```bash
npm run typecheck
npm run lint
npm run build
```

Chỉ chạy mức kiểm tra phù hợp với phạm vi thay đổi và báo rõ lỗi có sẵn không liên quan.
````

- [ ] **Step 4: Verify routing targets are declared and project versions match**

Run:

```bash
rg -n "project-context/CONTEXT.md|steps/new-feature.md|rules/BASUICN.md|patterns/ui-components.md|node_modules/next/dist/docs" .claude/CLAUDE.md .claude/project-context/CONTEXT.md
node -e "const p=require('./package.json'); if(p.dependencies.next!=='16.2.4'||p.dependencies.react!=='19.2.4') process.exit(1)"
```

Expected: all routing terms are found and the Node command exits `0`.

- [ ] **Step 5: Commit the router and context only**

```bash
git add .claude/CLAUDE.md .claude/project-context/CONTEXT.md
git commit -m "docs: add claude agent router and project context"
```

Do not stage unrelated worktree changes.

### Task 2: Add canonical rules, workflows, and compatibility shims

**Files:**
- Create: `.claude/rules/RULE.md`
- Create: `.claude/rules/BASUICN.md`
- Create: `.claude/workflows/frontend.md`
- Create: `.claude/workflows/nextjs.md`
- Create: `.claude/workflows/react-vite.md`
- Modify: `.claude/RULE.md`
- Modify: `.claude/FE_WORKFLOW.md`
- Modify: `.claude/WORKFLOW_NEXTJS.md`
- Modify: `.claude/REACT-VITE-WORKFLOW.md`

**Interfaces:**
- Consumes: the current contents of the four legacy files, `.claude/DESIGN.md`, and the Basuicn source links in the spec.
- Produces: canonical rule/workflow documents and stable legacy entry points consumed by steps and agents.

- [ ] **Step 1: Capture the legacy content before replacing files**

Run:

```bash
for file in .claude/RULE.md .claude/FE_WORKFLOW.md .claude/WORKFLOW_NEXTJS.md .claude/REACT-VITE-WORKFLOW.md; do test -s "$file" || exit 1; done
```

Expected: exit code `0`. Read every source file completely before moving its content.

- [ ] **Step 2: Move existing content into canonical locations**

Copy and normalize content as follows without weakening existing requirements:

- `.claude/RULE.md` → `.claude/rules/RULE.md`
- `.claude/FE_WORKFLOW.md` → `.claude/workflows/frontend.md`
- `.claude/WORKFLOW_NEXTJS.md` → `.claude/workflows/nextjs.md`
- `.claude/REACT-VITE-WORKFLOW.md` → `.claude/workflows/react-vite.md`

Within canonical files, replace stale references such as `rules/RULE.md` from the wrong base path with valid relative links. Remove only duplicated prose that is now a direct link to another canonical file.

- [ ] **Step 3: Create `.claude/rules/BASUICN.md` with mandatory policy**

The file must contain these sections and rules:

```md
# Quy tắc Basuicn bắt buộc

## Nguồn chính thức

- Repository: https://github.com/huytq203/core-basuicn
- README: https://github.com/huytq203/core-basuicn/blob/main/README.md
- CLI: https://github.com/huytq203/core-basuicn/blob/main/README_CLI.md
- Registry: https://github.com/huytq203/core-basuicn/blob/main/registry.json

## Quy trình bắt buộc

1. Kiểm tra `src/components/ui/<name>/`.
2. Nếu chưa có local, chạy `npx basuicn list`.
3. Nếu registry có component, chạy `npx basuicn add <name>`.
4. Kiểm tra diff do CLI tạo ra.
5. Chạy `npx basuicn doctor`, typecheck và lint.

## Không được tự ý

- Không viết lại primitive đã có trong Basuicn.
- Không cài UI library khác để thay thế.
- Không chạy `init`, `update`, `remove` hoặc `--force` khi chưa có xác nhận phù hợp.

## Khi registry không có component

Dừng trước khi viết UI thay thế. Báo nhu cầu, component đã kiểm tra, kết quả, ba phương án và một khuyến nghị; yêu cầu người dùng chọn trước khi tiếp tục phần UI.
```

Expand the missing-component section with the exact decision template from spec section 7. State explicitly that non-UI work may continue only when it does not commit the project to a UI choice.

- [ ] **Step 4: Replace each legacy file with a compatibility shim**

Use the following exact pattern, with the appropriate canonical target:

```md
# Đã chuyển tài liệu

Nguồn canonical: [tên tài liệu](relative/path.md).

AI agent phải đọc và tuân theo file canonical; không duy trì rule tại file này.
```

Targets from each legacy file:

- `.claude/RULE.md` → `rules/RULE.md`
- `.claude/FE_WORKFLOW.md` → `workflows/frontend.md`
- `.claude/WORKFLOW_NEXTJS.md` → `workflows/nextjs.md`
- `.claude/REACT-VITE-WORKFLOW.md` → `workflows/react-vite.md`

- [ ] **Step 5: Verify policy safeguards and legacy links**

Run:

```bash
rg -n "npx basuicn (list|add|doctor)|không có component|dừng|--force|update|remove|core-basuicn" .claude/rules/BASUICN.md
for target in .claude/rules/RULE.md .claude/workflows/frontend.md .claude/workflows/nextjs.md .claude/workflows/react-vite.md; do test -s "$target" || exit 1; done
rg -n "rules/RULE.md|workflows/frontend.md|workflows/nextjs.md|workflows/react-vite.md" .claude/RULE.md .claude/FE_WORKFLOW.md .claude/WORKFLOW_NEXTJS.md .claude/REACT-VITE-WORKFLOW.md
```

Expected: safeguards, official source, and all four compatibility targets are present.

- [ ] **Step 6: Commit canonical documents and shims**

```bash
git add .claude/rules .claude/workflows .claude/RULE.md .claude/FE_WORKFLOW.md .claude/WORKFLOW_NEXTJS.md .claude/REACT-VITE-WORKFLOW.md
git commit -m "docs: organize claude rules and workflows"
```

Do not stage unrelated worktree changes.

### Task 3: Add task steps and the Basuicn installation playbook

**Files:**
- Create: `.claude/steps/new-feature.md`
- Create: `.claude/steps/new-component.md`
- Create: `.claude/steps/add-api-query.md`
- Create: `.claude/steps/bugfix.md`
- Create: `.claude/patterns/ui-components.md`

**Interfaces:**
- Consumes: `.claude/rules/RULE.md`, `.claude/rules/BASUICN.md`, `.claude/workflows/*.md`, and `.claude/DESIGN.md`.
- Produces: task-specific entry points used by `.claude/CLAUDE.md` and the agent definitions.

- [ ] **Step 1: Create the four step documents**

Each step must begin with links to `../project-context/CONTEXT.md` and `../rules/RULE.md`, then add only relevant guidance:

- `new-feature.md`: read `../workflows/frontend.md`; if UI is involved, read `../DESIGN.md`, `../rules/BASUICN.md`, and `../patterns/ui-components.md`; require scope, states, implementation, and proportional verification.
- `new-component.md`: always read `../DESIGN.md`, `../rules/BASUICN.md`, and `../patterns/ui-components.md`; check local and registry before implementation; stop when missing.
- `add-api-query.md`: require existing service/query patterns, typed inputs/results, authentication boundary, validation, loading/error/empty/data states, and no UI library decision unless UI changes.
- `bugfix.md`: require reproduction, root cause, smallest fix, regression verification, and Basuicn checks when the bug touches shared UI.

Keep each file below 80 lines and avoid duplicating full rule text.

- [ ] **Step 2: Create `.claude/patterns/ui-components.md` as an operational playbook**

Include these ordered sections:

1. Prerequisites from the official repository: Node.js 18+, React 18+/19+, Vite or Next.js, Tailwind CSS v4.
2. Detection checklist for `package.json`, `src/components/ui`, `src/lib/utils/cn.ts`, theme files, stylesheet import, and aliases.
3. Uninitialized-project flow: report intended changes, obtain confirmation, run `npx basuicn init`, then `npx basuicn doctor`.
4. Initialized-project flow:

```bash
npx basuicn list
npx basuicn add <component>
npx basuicn doctor
npm run typecheck
npm run lint
```

5. Existing-local-component flow: inspect and reuse; use `npx basuicn diff <component>` for comparison.
6. Missing-registry-component flow: use the exact stop-and-decide template from `../rules/BASUICN.md` rather than coding an alternative.
7. Destructive-operation warning for `update`, `remove`, and `--force`.
8. Next.js note: CLI detects App Router/Pages Router, but agents must still review CLI diffs and local Next.js docs.
9. Success report: installed component, generated dependencies/files, verification commands and any pre-existing failures.

- [ ] **Step 3: Verify every step references existing canonical documents**

Run:

```bash
for file in .claude/steps/*.md; do rg -q "project-context/CONTEXT.md" "$file" || exit 1; rg -q "rules/RULE.md" "$file" || exit 1; done
rg -n "Node.js 18\+|React 18\+/19\+|Tailwind CSS v4|npx basuicn init|npx basuicn list|npx basuicn add|npx basuicn diff|npx basuicn doctor|--force" .claude/patterns/ui-components.md
```

Expected: every step has the base links and every required CLI/safety term is present.

- [ ] **Step 4: Pin the missing-component behavior**

Run:

```bash
rg -n "dừng|người dùng|phương án|khuyến nghị" .claude/rules/BASUICN.md .claude/steps/new-component.md .claude/patterns/ui-components.md
```

Expected: all three documents tell the agent to stop, inform the user, present options, and recommend one.

- [ ] **Step 5: Commit steps and pattern**

```bash
git add .claude/steps .claude/patterns
git commit -m "docs: add basuicn task playbooks"
```

Do not stage unrelated worktree changes.

### Task 4: Repair agent definitions and validate the documentation graph

**Files:**
- Modify: `.claude/agents/frontend-builder.md`
- Modify: `.claude/agents/ui-implementer.md`
- Modify: `.claude/agents/code-reviewer.md`
- Modify: `.claude/agents/codex-implementer.md`

**Interfaces:**
- Consumes: all canonical documents created in Tasks 1–3.
- Produces: agent definitions with valid routing and consistent Basuicn behavior.

- [ ] **Step 1: Update every agent entry sequence**

For each agent, require `.claude/CLAUDE.md` as the first project instruction. Replace nonexistent or ambiguous paths with exact canonical paths.

Apply role-specific routing:

- `frontend-builder.md`: choose the matching `.claude/steps/*.md`; for UI, require `.claude/rules/BASUICN.md` and `.claude/patterns/ui-components.md`.
- `ui-implementer.md`: always require `.claude/DESIGN.md`, `.claude/rules/BASUICN.md`, `.claude/steps/new-component.md`, and `.claude/patterns/ui-components.md`.
- `code-reviewer.md`: review against `.claude/rules/RULE.md`; for UI changes, verify Basuicn provenance and missing-component approval.
- `codex-implementer.md`: preserve its task-execution mechanics while correcting documentation paths and ensuring delegated UI work includes Basuicn instructions.

- [ ] **Step 2: Correct the shared-component ownership rule**

Replace any absolute prohibition such as “không sửa `components/ui/`” with this policy:

```md
Component do Basuicn copy vào `src/components/ui/` thuộc source của dự án. Chỉ sửa khi task yêu cầu và đã đánh giá consumer; không dùng thay đổi shared primitive để vá riêng một feature. Không chạy `update` hoặc `--force` nếu chưa được xác nhận.
```

- [ ] **Step 3: Add the Basuicn absence gate to UI-capable agents**

Ensure `frontend-builder.md` and `ui-implementer.md` explicitly state:

```md
Nếu component chưa có local và không có trong `npx basuicn list`, DỪNG phần UI, báo người dùng theo mẫu trong `.claude/rules/BASUICN.md`, rồi chờ quyết định. Không tự cài thư viện UI khác hoặc tự tạo primitive thay thế.
```

- [ ] **Step 4: Validate all local Markdown links under `.claude/`**

Run this read-only checker:

```bash
node <<'NODE'
const fs = require('fs');
const path = require('path');

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(full) : entry.name.endsWith('.md') ? [full] : [];
  });
}

const broken = [];
for (const file of files('.claude')) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+\.md(?:#[^)]+)?)\)/g)) {
    const target = match[1].split('#')[0];
    if (/^(?:https?:)?\/\//.test(target)) continue;
    const resolved = path.resolve(path.dirname(file), target);
    if (!fs.existsSync(resolved)) broken.push(`${file} -> ${target}`);
  }
}
if (broken.length) {
  console.error(broken.join('\n'));
  process.exit(1);
}
console.log('All local Markdown links under .claude are valid.');
NODE
```

Expected: `All local Markdown links under .claude are valid.`

- [ ] **Step 5: Search for stale paths and policy contradictions**

Run:

```bash
rg -n "rules/RULE.md|project-context/CONTEXT.md|steps/|patterns/ui-components.md" .claude/agents
if rg -n "không sửa .*components/ui|không được sửa .*components/ui" .claude/agents; then exit 1; fi
rg -n "BASUICN.md|basuicn list|DỪNG" .claude/agents/frontend-builder.md .claude/agents/ui-implementer.md
```

Expected: canonical paths are present, no absolute shared-component prohibition remains, and both UI-capable agents contain the Basuicn gate.

- [ ] **Step 6: Review the final diff for scope and formatting**

Run:

```bash
git diff --check -- .claude docs/superpowers/specs/2026-10-02-claude-basuicn-agent-guidance-design.md docs/superpowers/plans/2026-10-02-claude-basuicn-agent-guidance.md
git diff --stat -- .claude docs/superpowers/specs/2026-10-02-claude-basuicn-agent-guidance-design.md docs/superpowers/plans/2026-10-02-claude-basuicn-agent-guidance.md
```

Expected: no whitespace errors; only intended documentation files appear in the scoped diff.

- [ ] **Step 7: Commit agent repairs**

```bash
git add .claude/agents
git commit -m "docs: align agents with basuicn workflow"
```

Do not stage unrelated worktree changes. If commits are intentionally disabled for this dirty worktree, report the exact uncommitted files instead of staging them.
