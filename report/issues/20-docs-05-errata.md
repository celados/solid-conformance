---
type: "Issue"
title: "[2.0 rc.13 + next] Solid 2 documentation errata — 05-async-data.md"
status: "draft"
tier: "B"
findings: ["007","048","052"]
code_cases: ["007"]
head: "3086f1b77cd7b0431d3a7f768c2984c335758633"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

# [2.0 rc.13 + next] Solid 2 documentation errata — 05-async-data.md

### Your Example Website or App

Executable examples: [007](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/007-loading-on-accessor), [048](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/048-first-loading-held-signal), [052](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/052-transparent-ssr-slot).

The documented usage differs from the public API below. Suggested corrections identify whether the documentation or implementation should change.

Excerpt from the component below: change `id` after its first value resolves. The old content stays visible while the replacement is pending.

```tsx
<Loading
  on={() => {
    id(); // Change this dependency while the next request is pending.
    return 1;
  }}
  fallback={<b>fallback</b>}
>
  <span>{value()}</span>
</Loading>
// The fallback is not shown.
```

## 007 — Loading.on does not call a function-valued JSX prop

**Quote:** “A zero-argument function is a tracked accessor, not a callback.” ([05-async-data.md:96](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/05-async-data.md#L96)).

**Expected:** Changing the dependency read by the accessor resets the Loading boundary.
**Actual:** With the function-valued prop above, changing id while a replacement request is pending retains prior content. `on={id()}` supplies a reactive dependency instead.

**Proposed correction:** The immediate example correction is on={id()}, matching current compiled value-prop behavior. The quoted zero-argument-accessor definition is normative, so restoring accessor unwrapping is another valid implementation-side resolution; the repro does not establish that the present behavior is intentional.

**Related upstream:** [#3728](https://github.com/solidjs/solid/issues/3728), [#3524](https://github.com/solidjs/solid/issues/3524)

## 048 — A new Loading can read a held committed value

**Quote:** “the boundary shows its fallback now, and the content appears when the change commits.” ([05-async-data.md:50](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/05-async-data.md#L50)).

**Expected:** A newly mounted boundary shows fallback for a held update.
**Actual:** A newly mounted Loading reads a held plain signal as committed value 0, with isPending true, without showing fallback. It reaches 1 at action commit; an unready async-source control shows fallback.

**Proposed correction:** Documentation should limit the fallback rule to reads that cannot provide a committed answer, rather than all held writes.

## 052 — transparent also changes SSR slots

**Quote:** “SSR ignores the option (server-side nodes always allocate their id slot)” ([05-async-data.md:227](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/05-async-data.md#L227)).

**Expected:** Changing transparent has no effect on server source slots.
**Actual:** The same async memo serializes source record 0=42 with transparent false; true omits it and consumes one fewer hydration slot.

**Proposed correction:** Documentation is likely stale: transparent skips its slot on both sides. Document consistent node creation; this repro does not establish a hydration mismatch.

**Related upstream:** [#3012](https://github.com/solidjs/solid/issues/3012), [#3609](https://github.com/solidjs/solid/issues/3609)

**Builds/comparison:** `3086f1b77cd7b0431d3a7f768c2984c335758633`, development and production (052 is SSR); rc.13 also reproduces all three. No HEAD-only regression.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds and rc.13 comparisons are listed per item above. The instrumented production export (observe) is used only where specified.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 007: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/007-loading-on-accessor/README.md).
- 048: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/048-first-loading-held-signal/README.md).
- 052: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/052-transparent-ssr-slot/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
