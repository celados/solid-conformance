---
type: Review
title: Solid 2 report batch triage
status: draft
head: dafad1db34626feb5f154e98e599f65be1802c6c
description: User impact, severity, regression evidence and build scope for every ledger finding.
---

# Triage

Refreshed and rebuilt Solid next at `dafad1db34626feb5f154e98e599f65be1802c6c`. All 47 previously confirmed findings were rerun, including named failing builds and green controls: 99 isolated Bun invocations, 12 passing control tests and 91 desired-behavior failures (some invocations contain multiple tests). No process timeout or build/import failure was accepted as a discrepancy. **None of the 47 became fixed-upstream.** The existing 001–003 remain historical fixed-upstream; 005 and 050 are known duplicates and are not proposed for filing.

Active counts: **A 16, B 16, C 15**. A covers runtime and protocol failures; B covers contested prose, example and public declaration/export contracts, including types (018) rather than calling a type error a runtime fault; C covers warning/observation/tooling contracts even when the likely remedy is prose. Each active finding appears in exactly one proposed issue. Severity is local triage, not an upstream priority assignment. HEAD-only means rc.13 passes the same code; 017 has no comparable rc.13 positive-control hook, so its regression status is not established.

| Finding | Tier | User impact | Severity | HEAD-only regression? | Failing current build(s) | Status | Proposed issue |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [001](../findings/001-streamed-store-keyed/README.md) | A | Streamed keyed store content can stall hydration on rc.13. | low | no | historical target only | fixed-upstream | not proposed |
| [002](../findings/002-iterable-discovery/README.md) | A | A new async-iterable child can prevent SSR convergence on rc.13. | low | no | historical target only | fixed-upstream | not proposed |
| [003](../findings/003-tsrx-asi/README.md) | A | Native TSX setup declarations can compile incorrectly on rc.13. | low | no | historical target only | fixed-upstream | not proposed |
| [004](../findings/004-derived-store-rejection/README.md) | A | Replacement derived-store failures leave stale UI instead of reaching Errored. | high | yes | development, production | confirmed | [01-store-rejection.md](issues/01-store-rejection.md) |
| [005](../findings/005-keyed-reconcile-identity/README.md) | B | Readers may expect identity retention for nodes that were never subscribed. | low | no | historical target only | duplicate | not proposed |
| [006](../findings/006-storepath-export/README.md) | B | The documented storePath import cannot be used in a browser project. | med | no | development, production | confirmed | [19-docs-04-errata.md](issues/19-docs-04-errata.md) |
| [007](../findings/007-loading-on-accessor/README.md) | B | Following the zero-argument Loading on example never rearms its fallback. | med | no | development, production | confirmed | [20-docs-05-errata.md](issues/20-docs-05-errata.md) |
| [008](../findings/008-production-refresh/README.md) | A | Awaiting refresh can hang forever in production. | high | yes | production | confirmed | [02-production-refresh.md](issues/02-production-refresh.md) |
| [009](../findings/009-frame-nested-region-stale/README.md) | A | Nested server regions show stale data after their parent refetches. | med | no | development, production | confirmed | [08-nested-server-region.md](issues/08-nested-server-region.md) |
| [010](../findings/010-leaf-signal-diagnostic/README.md) | C | Forbidden leaf-scope signal creation receives no documented warning. | low | no | development | confirmed | [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) |
| [011](../findings/011-frame-multisite-hydration/README.md) | A | The second mount of one server-component factory fails hydration. | high | no | development, production | confirmed | [03-multisite-hydration.md](issues/03-multisite-hydration.md) |
| [012](../findings/012-attribution-audience-gate/README.md) | C | Development attribution allocates fold history without an audience. | med | no | development | confirmed | [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) |
| [013](../findings/013-pinned-source-retake/README.md) | B | The documented pinned-input example keeps an override after unpinning. | med | no | development, production | confirmed | [17-docs-02-errata.md](issues/17-docs-02-errata.md) |
| [014](../findings/014-live-drop-completes/README.md) | A | A dropped live response is treated as completed and never reconnects. | high | no | development, production | confirmed | [04-live-decoder-stream-lifetime.md](issues/04-live-decoder-stream-lifetime.md) |
| [015](../findings/015-untrack-owned-write/README.md) | B | The documented untrack workaround still throws an owned-write error. | med | no | development | confirmed | [16-docs-01-errata.md](issues/16-docs-01-errata.md) |
| [016](../findings/016-production-store-affects/README.md) | A | Production affects(store,key) throws after tree shaking. | high | yes | production | confirmed | [05-production-store-affects.md](issues/05-production-store-affects.md) |
| [017](../findings/017-initial-render-error-record/README.md) | C | Initial render failures are absent from structured diagnostics and render records. | med | not established | development, observe | confirmed | [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) |
| [018](../findings/018-nested-refresh-types/README.md) | B | Supported nested-store refresh usage is rejected by public types. | med | no | development | confirmed | [21-docs-06-errata.md](issues/21-docs-06-errata.md) |
| [019](../findings/019-action-await-origin/README.md) | C | After-await action writes receive misleading external origin metadata. | low | no | development, observe | confirmed | [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) |
| [020](../findings/020-observe-frame-corruption/README.md) | C | Observe builds miss a corrupted frame end marker. | med | no | observe | confirmed | [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) |
| [021](../findings/021-recovery-boundary-outcome/README.md) | C | The documented server recovery outcome differs from the emitted enum. | low | no | development, observe | confirmed | [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) |
| [022](../findings/022-refresh-optimistic-authority/README.md) | A | Refresh reports the caller optimistic guess as authoritative data. | med | yes | development, production | confirmed | [09-refresh-optimistic-authority.md](issues/09-refresh-optimistic-authority.md) |
| [023](../findings/023-returned-helper-diagnostic/README.md) | C | The promised after-await diagnostic exemption omits returned async helpers. | low | no | development | confirmed | [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) |
| [024](../findings/024-single-typed-array-encoding/README.md) | B | A lone typed-array argument works without the documented rich opt-in. | low | no | development, production | confirmed | [23-docs-10-errata.md](issues/23-docs-10-errata.md) |
| [025](../findings/025-async-fanout-classification/README.md) | C | Async fan-out records misclassify the trigger as an ordinary write. | low | no | development, observe | confirmed | [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) |
| [026](../findings/026-cookie-proto-key/README.md) | A | Parsing cookies loses a valid __proto__ key. | low | no | development, production | confirmed | [13-cookie-proto-key.md](issues/13-cookie-proto-key.md) |
| [027](../findings/027-server-write-all-builds/README.md) | B | Applications relying on all-build server-write warnings receive none in production. | low | no | production | confirmed | [24-docs-11-errata.md](issues/24-docs-11-errata.md) |
| [028](../findings/028-artifact-format-version/README.md) | C | Artifact consumers are told the wrong public format version. | low | no | development, observe | confirmed | [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) |
| [029](../findings/029-latest-loading-convergence/README.md) | A | Loading keeps showing fallback after every async source has settled. | high | yes | development, production | confirmed | [06-loading-nonconvergence.md](issues/06-loading-nonconvergence.md) |
| [030](../findings/030-effect-error-signature/README.md) | B | The documented effect error-handler signature fails type checking. | med | no | development | confirmed | [18-docs-03-errata.md](issues/18-docs-03-errata.md) |
| [031](../findings/031-direct-error-hook-tier/README.md) | B | A direct-call error hook is missing outside a request scope. | low | no | development, production | confirmed | [25-docs-12-errata.md](issues/25-docs-12-errata.md) |
| [032](../findings/032-sync-lazy-resolver/README.md) | A | A synchronous lazy asset resolver error aborts otherwise renderable SSR. | low | no | development, production | confirmed | [10-sync-asset-resolver.md](issues/10-sync-asset-resolver.md) |
| [033](../findings/033-symbol-insert-diagnostic/README.md) | C | Invalid symbol children produce no promised server diagnostic. | low | no | development | confirmed | [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) |
| [034](../findings/034-mixed-insert-object/README.md) | A | Adding adjacent text turns a skipped object child into a DOM exception. | low | no | development, production | confirmed | [14-mixed-object-insert.md](issues/14-mixed-object-insert.md) |
| [035](../findings/035-decoder-iterator-body-death/README.md) | A | A body error or premature EOF leaves an iterator pull pending. | high | no | development, production, observe | confirmed | [04-live-decoder-stream-lifetime.md](issues/04-live-decoder-stream-lifetime.md) |
| [036](../findings/036-conditional-cache-format/README.md) | A | A conditional GET yields undefined instead of the browser cached result. | low | no | development, production, observe | confirmed | [11-conditional-get-format.md](issues/11-conditional-get-format.md) |
| [038](../findings/038-frame-call-state-doc-reset/README.md) | B | The server-component state-reset prose disagrees with consumption-site identity. | low | no | development, production | confirmed | [24-docs-11-errata.md](issues/24-docs-11-errata.md) |
| [039](../findings/039-missing-resource-timing-fallback/README.md) | C | The promised resource-less ServerTiming fallback produces no entry. | med | no | development, observe | confirmed | [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) |
| [040](../findings/040-initial-binding-console/README.md) | C | Initial binding diagnostic console arguments omit the actual element. | low | no | development | confirmed | [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) |
| [041](../findings/041-dynamic-source-tracking/README.md) | B | The documented async dynamic source callback still runs during hydration tracking. | low | no | development, production | confirmed | [18-docs-03-errata.md](issues/18-docs-03-errata.md) |
| [042](../findings/042-malformed-preload-crossorigin/README.md) | C | Malformed preload crossorigin values lack the documented warning. | low | no | development | confirmed | [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) |
| [044](../findings/044-literal-spread-hydration/README.md) | A | Valid literal-spread children produce hydration tag mismatches. | low | no | development | confirmed | [15-spread-children-hydration.md](issues/15-spread-children-hydration.md) |
| [045](../findings/045-server-optimistic-write-wording/README.md) | B | The server-write example describes data writes for inert optimistic setters. | low | no | development, production | confirmed | [22-docs-08-errata.md](issues/22-docs-08-errata.md) |
| [046](../findings/046-held-derived-store-seed/README.md) | B | The hold-invariance prose ignores pending backing reads in store drafts. | med | no | development, production | confirmed | [17-docs-02-errata.md](issues/17-docs-02-errata.md) |
| [047](../findings/047-derived-store-accessor-example/README.md) | B | The migration example calls a derived store as a function. | med | no | development, production | confirmed | [26-docs-migration-errata.md](issues/26-docs-migration-errata.md) |
| [048](../findings/048-first-loading-held-signal/README.md) | B | The first held plain-signal read shows committed data rather than the claimed fallback. | med | no | development, production | confirmed | [20-docs-05-errata.md](issues/20-docs-05-errata.md) |
| [049](../findings/049-document-live-channel-abort/README.md) | A | Aborting a document and finishing its live source throws a double-close error. | high | no | development, observe, production | confirmed | [07-document-live-abort.md](issues/07-document-live-abort.md) |
| [050](../findings/050-literal-handler-attribution/README.md) | C | Bare native literal event handlers have no promised interaction attribution. | low | no | historical target only | duplicate | not proposed |
| [051](../findings/051-unnamed-attribution-owner-id/README.md) | C | Unnamed attribution nodes do not receive the documented owner-id fallback. | low | no | development | confirmed | [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) |
| [052](../findings/052-transparent-ssr-slot/README.md) | B | Transparent memos omit SSR hydration slots despite the ignores-option claim. | low | no | development, production | confirmed | [20-docs-05-errata.md](issues/20-docs-05-errata.md) |
| [053](../findings/053-await-send-until-context/README.md) | A | An async action times out after a real live acknowledgement on HEAD. | med | yes | development, production | confirmed | [12-async-action-live-ack.md](issues/12-async-action-live-ack.md) |
| [054](../findings/054-prearrived-recovery-wait/README.md) | C | Recovery wait metrics include scheduling time after the error arrived. | low | no | development, observe | confirmed | [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) |

## Grouping decisions

Only 014 and 035 share a proposed runtime issue. The decoder classifies JSON-decoded streams using `__SEROVAL_STREAM__`; the decoded Seroval Stream lacks that property. This same classification feeds abort cleanup and open-stream counting, and the live client reconnects only while decoded streams remain open. This is a **suspected shared cause supported by source**, not a patch-proven diagnosis. Their separate TCP-drop and iterator-pull counterexamples remain inline. The working live server-component path is not claimed to fail.

009 and 011 remain separate: nested region refetch caching and consumption-site hydration identity have different failure triggers. 008 and 022 remain separate: promise completion and authoritative-versus-optimistic return values are not the same defect. 053 remains A because it regresses relative to rc.13; a bare-yield workaround does not establish that the new behavior is intended.

B is grouped once per source chapter; 018 is assigned to RFC06 and cross-references the repeated RFC05 guarantee. C is one issue with per-item side-of-disagreement recommendations. Quotes were checked against the refreshed documentation: no implicated statement was removed or corrected by this HEAD refresh.

## Evidence and boundary

[Raw rechecks](evidence/recheck-results.json), [build log](evidence/upstream-build.log), and the individual logs retain positive controls and exact failures. The rc.13 comparison is inherited from the versioned Wave 3 evidence, not newly rerun in this refresh. Report drafts are English and local only. No upstream issue, comment or PR has been created.
