---
type: Reference
title: Wave 4b maintainer-facing report revision
status: verified
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Wave 4b receipt

All proposals 01–27 were revised. A proposals 01–15 now place actual readable source immediately after the summary, then steps, expected/actual and build scope; automated setup is last in a collapsed section. The existing standalone files were kept and formatted. B/C usage fragments and references were reorganized similarly, with a short comparison table for the aggregate diagnostics proposal. Every visible body is at most 60 lines. No upstream action was taken.

Seven client-only proposals (01,02,05,06,09,12,14) gained a pasteable App.tsx and a separate browser test that clicks the displayed button or mounts that exact App. Both artifact conditions were executed. The cookie parser (13) is a server utility, so its small module is used directly rather than wrapping it in unrelated UI.

## Necessary full-context cases

| Proposal | Why the visible source cannot trigger the failure by itself |
| --- | --- |
| 03 | Two server-component consumption sites must be SSR-rendered and hydrated; CSR is the passing comparison. |
| 04 | An unfinished decoded iterable and a real response/TCP termination are required; swapping promises is a different mechanism. |
| 07 | The document must be aborted before its server producer finishes. |
| 08 | Nested server content must refetch through the HTTP server-component response and then change arguments. |
| 10 | The small server sample needs SSR compilation and an asset resolver; it cannot be pasted into a client-only playground. |
| 11 | The browser must perform an actual conditional HTTP-cache request and merge the 304 response headers. |
| 15 | The same JSX must be compiled for SSR and DOM, then hydrated; CSR alone cannot expose the tag mismatch. |

All seven lead with small tested source excerpts, but their complete execution workflow remains in the linked standalone folder. B/C snippets are type/API/diagnostic usage fragments in their original executable contexts, not advertised as self-contained client apps; the final section links those contexts rather than inventing nonexistent standalone chapter folders.

## Verification

- A: 46 isolated standalone invocations across development and production; 47 desired-behavior failures and five passing controls. All reached their checks; no timeout, missing import or compiler failure was accepted. This includes 14 invocations of the seven displayed Apps: 12 desired-behavior failures and two development controls.
- B/C: 12 original executable contexts corresponding to displayed code or expressions rerun on HEAD; all remain red, including two runtime/type assertions in 047 (13 failed tests total).
- Layout/source validation: all 27 proposals preserve the 47-case coverage without duplication, exact displayed A source matches the executed file, final details and local links valid.
- TypeScript check passed. System Chrome only; no browser download.

Raw results: [A executions](wave4b-standalone-results.json), [B/C contexts](wave4b-doc-code-results.json), [layout validation](wave4b-layout-validation.json).
