---
type: "Issue"
title: "[2.0 rc.13 + next] Solid 2 documentation errata — 03-control-flow.md"
status: "draft"
tier: "B"
findings: ["030","041"]
code_cases: ["030","041"]
head: "3086f1b77cd7b0431d3a7f768c2984c335758633"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

# [2.0 rc.13 + next] Solid 2 documentation errata — 03-control-flow.md

### Your Example Website or App

Executable examples: [030](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/030-effect-error-signature), [041](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/041-dynamic-source-tracking).

The documented usage differs from the public API below. Suggested corrections identify whether the documentation or implementation should change.

```ts
import { createEffect } from "solid-js";

// Type-check the documented three-callback signature.
createEffect(
  () => 1,
  () => {},
  () => {},
);
// TS2559: the third argument must be EffectOptions.
```

Type-check the snippet against the public declarations.

## 030 — Effect error arm is not a third callback

**Quote:** “`createEffect(compute, effect, onError)`” ([03-control-flow.md:169](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/03-control-flow.md#L169)).

**Expected:** The documented three-callback signature type-checks.
**Actual:** The public third argument is EffectOptions; a callback there fails TypeScript with TS2559. The runtime error arm belongs in the second-argument bundle.

**Proposed correction:** Documentation signature is wrong: write `createEffect(compute, { effect, error: onError })`. The surrounding rule that handled errors bypass the client error hook is correct.

**Builds/comparison:** 3086f1b77cd7b0431d3a7f768c2984c335758633, public types; rc.13 also contradicts the same contract. No HEAD-only regression.

## 041 — Hydration still evaluates the dynamic callback

**Quote:** “the source is not re-run” ([03-control-flow.md:202](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/03-control-flow.md#L202)).

**Expected:** Hydration adopts the result without invoking the dynamic callback.
**Actual:** A dynamic source returning Promise.resolve("article") runs once during hydration. Server DOM is adopted correctly, with no hydration warnings or network request in this repro.

**Proposed correction:** Documentation is likely wrong: distinguish dependency-tracking evaluation during hydration from another real source request. Adoption does not guarantee zero callback invocations.

**Builds/comparison:** 3086f1b77cd7b0431d3a7f768c2984c335758633, development and production; rc.13 also contradicts the same contract. No HEAD-only regression.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds and rc.13 comparisons are listed per item above. The instrumented production export (observe) is used only where specified.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 030: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/030-effect-error-signature/README.md).
- 041: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/041-dynamic-source-tracking/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
