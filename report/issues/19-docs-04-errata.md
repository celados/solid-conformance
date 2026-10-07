---
type: Issue
title: Solid 2 documentation errata — 04-stores.md
status: draft
tier: B
findings: ["006"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: 04-stores.md

The following published contracts disagree with the public API. Each item identifies the side we think needs correction.

## 006 — storePath is missing from browser core

**Quote:** “`storePath(...)` is provided as an **opt-in helper**” ([04-stores.md:45](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/04-stores.md#L45)).

**Observed:** Importing storePath from solid-js fails to bundle against the browser entry. The implementation exists in signals and server core, but not browser core/public types.

**Proposed correction:** The browser export and public declarations likely need fixing if this is the intended Solid API. Otherwise document a supported alternative import explicitly; this report does not invent one.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, development and production browser exports; rc.13 also contradicts the same contract. HEAD-only regression: no.

**Evidence:** [minimal failing test and related issues](../../findings/006-storepath-export/README.md).
