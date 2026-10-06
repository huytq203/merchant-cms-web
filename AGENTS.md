<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## UI implementation

Before implementing a feature or UI change, read `.claude/CLAUDE.md` and follow
the matching step, rules, patterns, and workflow it routes to.

For UI work specifically:

1. Read the global Taste Skill at
   `~/.agents/skills/design-taste-frontend/SKILL.md` in full before editing UI
   code. Follow its brief-inference, scope, and pre-flight instructions where
   they apply.
2. Complete Brainstorming and the appropriate Impeccable command before editing
   UI code. Use `shape` for a new surface or flow, `audit` or `critique` for an
   existing UI, and `optimize` for UI performance work.
3. Treat the approved Brainstorming and Impeccable outcome as the visual direction;
   do not change it during implementation without asking.
4. Read `.claude/workflows/frontend.md`, `.claude/DESIGN.md`,
   `.claude/rules/BASUICN.md`, and `.claude/patterns/ui-components.md`.
5. Use Basuicn as the first source for UI components. If its registry does not
   provide the required component, stop the dependent UI work and ask for a
   decision as described in `.claude/rules/BASUICN.md`.

The Taste Skill explicitly excludes dashboards, dense product UI, data tables,
and multi-step product flows. For those Merchant CMS surfaces, use its applicable
quality checks only; Impeccable Operate, `.claude/DESIGN.md`, and Basuicn remain
authoritative. Never install or substitute another design system because the Taste
Skill mentions one.

Typo, copy-only, and behavior-preserving refactors may use the lightweight path
defined in `.claude/workflows/frontend.md`.
