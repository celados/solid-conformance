---
type: Issue
id: "020"
status: confirmed
versions: [upstream-next-53ef0e69-observe]
area: frames/diagnostics
upstream: []
found_by: docs
---

# Observe frames do not report a missing slot end marker

A frame with a slot start marker and no matching end marker should report `FRAME_MARKER_CORRUPTED` through the enabled Observe diagnostics channel. The Observe artifact has an active channel but reports zero findings; the identical development artifact reports the corruption.

```sh
BUILD_MODE=observe bun test ./findings/020-observe-frame-corruption/repro.test.ts
```

`BUILD_MODE=development` is a passing positive control. Production explicitly skips because it has no diagnostics channel. rc.13 remains a separate comparison, to be run against the isolated baseline rather than assumed from HEAD.

RFC 08, `documentation/solid-2.0/08-dev-diagnostics.md:625`, explicitly describes this as an error finding in “observe + dev”, and the chapter's diagnostic table repeats that tier contract. The client range check is guarded by the development flag, so this is a documentation/runtime discrepancy. The runtime is likely the wrong side: Observe exists specifically to retain structured production diagnostics, and a damaged transport document is meaningful there.

## Shrinking

A public frame host applies three records: start, one HTML fragment with its end marker removed, and complete. A single text fill makes the range relevant. No server, RPC, source stream, JSX compiler, hydration, async work, router or component tree is involved. The local HTTP server only serves the browser test asset. Removing the missing-end shape makes development stop reporting the diagnostic; the independent `OBSERVE` positive control excludes an inactive channel.

## Dedupe

Searched open and closed issues in solidjs/solid, solidjs/solid-router, and solidjs/solid-start for `FRAME_MARKER_CORRUPTED`, `frame marker corruption`, and `observe slot markers`. Only the broad solid query matched #2830 (adjacent JSX expression DOM migration) and #2871 (SSR Reveal membership and fragment replacement); their reported mechanisms do not concern missing frame diagnostics in Observe. Existing local findings also contain no such case. The raw search summary and the two build results are retained beside this repro.

Wave 4a 独立 rc.13 补验：development 1 pass / 0 fail；observe 0 pass / 1 fail。原始日志在 report/evidence/020-rc13-*-supplement.log；报告版本陈述以此为准。
