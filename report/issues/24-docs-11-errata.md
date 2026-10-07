---
type: "Issue"
title: "[2.0 rc.13 + next] Solid 2 documentation errata — 11-server-components.md"
status: "draft"
tier: "B"
findings: ["027","038"]
head: "3086f1b77cd7b0431d3a7f768c2984c335758633"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

# [2.0 rc.13 + next] Solid 2 documentation errata — 11-server-components.md

### Your Example Website or App

Executable examples: [027](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/027-server-write-all-builds), [038](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/038-frame-call-state-doc-reset).

The documented usage differs from the public API below. Suggested corrections identify whether the documentation or implementation should change.

## 027 — SERVER_WRITE guidance is development-only

**Quote:** “in all server builds” ([11-server-components.md:171](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/11-server-components.md#L171)).

**Expected:** The warning is emitted in every server build.
**Actual:** A server signal setter renders 1 in both tiers, but SERVER_WRITE prints only in development.

**Proposed correction:** Documentation is likely wrong: change the warning claim to development server builds. RFC08 classifies this as dev-only guidance.

**Builds/comparison:** 3086f1b77cd7b0431d3a7f768c2984c335758633, production; development positive control passes; rc.13 also contradicts the same contract. No HEAD-only regression.

## 038 — Client state follows the mount, not argument address

**Quote:** “toggles reset per story — story 1’s collapse state never bleeds into story 2” ([11-server-components.md:116](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/11-server-components.md#L116)).

**Expected:** Changing the story argument resets client state inside the server component.
**Actual:** Changing server-function argument 1 → 2 updates server content but retains the client counter inside the mount. The outside counter also survives.

**Proposed correction:** Documentation is likely wrong: client-state identity belongs to the consumption site; argument changes deliver a new content binding. This agrees with the chapter’s derivation pass at L151.

**Builds/comparison:** 3086f1b77cd7b0431d3a7f768c2984c335758633, development and production; rc.13 also contradicts the same contract. No HEAD-only regression.

The same RFC11 paragraph needs the companion [optimistic no-op clarification](22-docs-08-errata.md).

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds and rc.13 comparisons are listed per item above. The instrumented production export (observe) is used only where specified.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 027: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/027-server-write-all-builds/README.md).
- 038: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/038-frame-call-state-doc-reset/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
