# solid-conformance

Find as many real defects in Solid 2 (currently `2.0.0-rc.13` on npm `next`, and
upstream HEAD) as possible, each proven by a minimal executable reproduction, so
they can be reported upstream in one batch. Fixing is upstream's job; finding is
ours.

This is a standalone project. It is not part of the celados workspace and not
part of Delta. Do not copy Delta code here; read it for context only.

## Rules

- **A finding exists only as a failing test.** Every finding has a minimal
  repro in `findings/<id>/` that fails on the version it names and that anyone
  can run with one command. A claim without a red test is not a finding.
- **Never file, comment on, or open anything upstream.** Reporting is a later,
  human-confirmed batch step. Read upstream issues and code freely.
- **Dedupe before recording.** Check open and closed issues in solidjs/solid,
  solidjs/solid-router, and solidjs/solid-start, and the existing ledger. A
  duplicate of a known upstream issue is recorded as `duplicate` with the link,
  only if it adds a new repro shape.
- **Shrink.** A finding's repro is the smallest program that still fails:
  remove components, props, and timing until removing anything makes it pass.
- **Spec vs implementation.** When the docs and the runtime disagree, record it;
  say which side you believe is wrong and why. Both are reportable.
- **Toolchain:** bun / bunx (never npm or npx). Browser runs use the system
  Google Chrome (Playwright `channel: 'chrome'`); never download Playwright
  Chromium or Puppeteer browsers.

## Layout

- `harness/` — shared test infrastructure: client render, SSR render,
  SSR → hydrate in a real browser, timing control (deferred promises / async
  iterables whose settle order the test chooses), invariant checks.
- `tracks/<name>/` — exploration tracks (spec-to-test, fuzzer, bug-class
  mining, …). Tests here may be broad; passing ones stay as a regression net.
- `findings/<id>-<slug>/` — one directory per finding: `README.md` (ledger
  entry, format below) and the minimal repro test.
- `LEDGER.md` — the index: one line per finding with id, status, title.

## Finding entry (`findings/<id>/README.md`)

Frontmatter: `id`, `status` (`candidate` | `confirmed` | `duplicate` |
`not-a-bug` | `fixed-upstream`), `versions` (fails on), `area` (reactivity,
async/Loading, SSR, hydration, store, optimistic/action, router, …), `upstream`
(related issue links), `found_by` (track). Body: expected vs actual in two
sentences, the run command, why it is a bug (docs quote or invariant), and the
shrinking notes.

## Context worth reading

- Solid 2 docs: `documentation/solid-2.0/` in solidjs/solid (branch `next`).
- Known bug classes we already hit in production, all now fixed upstream:
  solidjs/solid#3764, #3734, #3687, #3338, #3762. Their siblings are likely.
- Our field notes on Solid 2 behavior: `~/.claude/skills/solid2-celados/`
  (`SKILL.md`, `references/*.md`) and Delta's `lib/solid/README.md`
  ("Known limitations") at `~/workspace/projects/delta/lib/solid/`.
