---
type: Issue
id: '006'
status: confirmed
versions: [2.0.0-rc.13, 53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712]
area: store
upstream: [https://github.com/solidjs/solid/issues/3092]
found_by: docs
---

# Documented storePath helper is absent from browser solid-js

Expected: a browser import of the documented opt-in storePath helper builds.
Actual: Bun reports no matching export from solid-js's browser entry.

## Run

```sh
bun test ./findings/006-storepath-export/repro.test.ts
```

Fails on HEAD and RC13. The repro explicitly resolves the production browser
export; the development browser doc test also receives an absent function.
[RFC 04, storePath](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md#storepath-compat-helper-for-1x-style-path-setters)
says the helper is provided for setter adaptation. It exists in @solidjs/signals
and the server core, but not the client core/types. The public export appears wrong;
otherwise the docs must name the alternative package explicitly.

## Dedupe and shrinking

Open/closed searches for storePath and storePath export across Solid, Router and
Start found no exact export discrepancy. #3092 proposes a branded path API.
Reduced to a single named import and use; no renderer execution or app is needed.

## Wave 5 re-baseline

Published comparator: Solid `2.0.0-rc.15`, Router `2.0.0-next.39`. Development: still fails; inspect retained assertion and controls; production: still fails; inspect retained assertion and controls. Raw results: [rc.15 matrix](../../report/evidence/wave5-rc15-matrix.json). HEAD at `e3716454129f8438b65257c95db5c383622494ba` is independently re-run in the [HEAD matrix](../../report/evidence/wave5-head-matrix.json); use its individual rows rather than assuming every red assertion is a runtime defect.

## Wave 5 filing bar

**fileable**: Documented public migration helper fails to import in a browser app.
