---
type: Issue
title: Solid 2 documentation errata — 04-stores.md
status: draft
tier: B
findings: ["006"]
code_cases: ["006"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: 04-stores.md

The documented usage differs from the public API below. Suggested corrections identify whether the documentation or implementation should change.

```ts
import { storePath } from "solid-js";

// Build for the browser: the import has no matching export.
```

Build the snippet for the browser.

## 006 — storePath is missing from browser core

**Quote:** “`storePath(...)` is provided as an **opt-in helper**” ([04-stores.md:45](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/04-stores.md#L45)).

**Expected:** The documented helper is available from the browser-facing public API.
**Actual:** Importing storePath from solid-js fails to bundle against the browser entry. The implementation exists in signals and server core, but not browser core/public types.

**Proposed correction:** The browser export and public declarations likely need fixing if this is the intended Solid API. Otherwise document a supported alternative import explicitly; this report does not invent one.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, development and production browser exports; rc.13 also contradicts the same contract. No HEAD-only regression.

**Related upstream:** [#3092](https://github.com/solidjs/solid/issues/3092)

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 006: [minimal failing test and related issues](../../findings/006-storepath-export/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
