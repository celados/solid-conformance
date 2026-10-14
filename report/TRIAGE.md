---
type: Review
title: Wave 5 per-finding filing bar
head: e3716454129f8438b65257c95db5c383622494ba
---

# Finding review

Statuses describe conformance evidence; filing decisions describe app reachability. A still-confirmed diagnostic or internal contract is not automatically fileable.

| ID | Status | Filing | Reason |
| --- | --- | --- | --- |
| [001](../findings/001-streamed-store-keyed/README.md) | fixed-upstream | excluded-fixed | Desired-behavior repro passes in the latest tested runtime; historical failing versions retained. |
| [002](../findings/002-iterable-discovery/README.md) | fixed-upstream | excluded-fixed | Desired-behavior repro passes in the latest tested runtime; historical failing versions retained. |
| [003](../findings/003-tsrx-asi/README.md) | fixed-upstream | excluded-fixed | Desired-behavior repro passes in the latest tested runtime; historical failing versions retained. |
| [004](../findings/004-derived-store-rejection/README.md) | fixed-upstream | excluded-fixed | Desired-behavior repro passes in the latest tested runtime; historical failing versions retained. |
| [005](../findings/005-keyed-reconcile-identity/README.md) | duplicate | held | Known subscription-boundary identity design; no new app break. |
| [006](../findings/006-storepath-export/README.md) | confirmed | fileable | Documented public migration helper fails to import in a browser app. |
| [007](../findings/007-loading-on-accessor/README.md) | confirmed | fileable | Documented Loading prop prevents app fallback rearming. |
| [008](../findings/008-production-refresh/README.md) | fixed-upstream | excluded-fixed | Desired-behavior repro passes in the latest tested runtime; historical failing versions retained. |
| [009](../findings/009-frame-nested-region-stale/README.md) | fixed-upstream | excluded-fixed | Desired-behavior repro passes in the latest tested runtime; historical failing versions retained. |
| [010](../findings/010-leaf-signal-diagnostic/README.md) | confirmed | held | Primitive-scope diagnostic wording only. |
| [011](../findings/011-frame-multisite-hydration/README.md) | fixed-upstream | excluded-fixed | Desired-behavior repro passes in the latest tested runtime; historical failing versions retained. |
| [012](../findings/012-attribution-audience-gate/README.md) | confirmed | held | Attribution audience/cost tooling contract, no app malfunction. |
| [013](../findings/013-pinned-source-retake/README.md) | confirmed | fileable | Documented pinned local-state recipe fails to resume server data. |
| [014](../findings/014-live-drop-completes/README.md) | fixed-upstream | excluded-fixed | Desired-behavior repro passes in the latest tested runtime; historical failing versions retained. |
| [015](../findings/015-untrack-owned-write/README.md) | confirmed | fileable | Documented untrack remedy fails in owned app scopes. |
| [016](../findings/016-production-store-affects/README.md) | fixed-upstream | excluded-fixed | Desired-behavior repro passes in the latest tested runtime; historical failing versions retained. |
| [017](../findings/017-initial-render-error-record/README.md) | confirmed | held | Structured SSR error record omission; integration/tooling-only path. |
| [018](../findings/018-nested-refresh-types/README.md) | confirmed | fileable | Documented nested store refresh fails public TypeScript. |
| [019](../findings/019-action-await-origin/README.md) | confirmed | held | Post-await diagnostic origin metadata only. |
| [020](../findings/020-observe-frame-corruption/README.md) | confirmed | held | Malformed frame-marker diagnostics in observe; integration-only corruption path. |
| [021](../findings/021-recovery-boundary-outcome/README.md) | confirmed | held | Recovery record outcome naming only. |
| [022](../findings/022-refresh-optimistic-authority/README.md) | fixed-upstream | excluded-fixed | Desired-behavior repro passes in the latest tested runtime; historical failing versions retained. |
| [023](../findings/023-returned-helper-diagnostic/README.md) | confirmed | held | Warning-exclusion wording for a returned async helper; runtime warning is useful. |
| [024](../findings/024-single-typed-array-encoding/README.md) | confirmed | held | Typed-array transport works; opt-in wording only. |
| [025](../findings/025-async-fanout-classification/README.md) | confirmed | held | Diagnostic invalidation-classification metadata only. |
| [026](../findings/026-cookie-proto-key/README.md) | confirmed | held | Withdrawn low-impact cookie-name edge; do not refile. |
| [027](../findings/027-server-write-all-builds/README.md) | confirmed | held | Production deprecation warning for invalid server setter; no valid app path. |
| [028](../findings/028-artifact-format-version/README.md) | confirmed | held | Artifact schema-version wording only. |
| [029](../findings/029-latest-loading-convergence/README.md) | fixed-upstream | excluded-fixed | Desired-behavior repro passes in the latest tested runtime; historical failing versions retained. |
| [030](../findings/030-effect-error-signature/README.md) | confirmed | fileable | Documented effect error signature fails public TypeScript. |
| [031](../findings/031-direct-error-hook-tier/README.md) | confirmed | held | Direct invocation error-hook tier; integration-only. |
| [032](../findings/032-sync-lazy-resolver/README.md) | confirmed | held | Withdrawn integration asset-resolver failure path; do not refile. |
| [033](../findings/033-symbol-insert-diagnostic/README.md) | confirmed | held | Invalid SSR insert diagnostic; no valid app content. |
| [034](../findings/034-mixed-insert-object/README.md) | confirmed | held | Withdrawn non-renderable object insertion/type bypass; do not refile. |
| [035](../findings/035-decoder-iterator-body-death/README.md) | fixed-upstream | excluded-fixed | Desired-behavior repro passes in the latest tested runtime; historical failing versions retained. |
| [036](../findings/036-conditional-cache-format/README.md) | fixed-upstream | excluded-fixed | Desired-behavior repro passes in the latest tested runtime; historical failing versions retained. |
| [038](../findings/038-frame-call-state-doc-reset/README.md) | confirmed | held | Integration frame-call identity wording; no app-visible incorrect state. |
| [039](../findings/039-missing-resource-timing-fallback/README.md) | confirmed | held | Performance-track fallback span omission only. |
| [040](../findings/040-initial-binding-console/README.md) | confirmed | held | Diagnostic console element metadata only. |
| [041](../findings/041-dynamic-source-tracking/README.md) | confirmed | held | Hydration tracking callback count; no duplicate request or bad DOM. |
| [042](../findings/042-malformed-preload-crossorigin/README.md) | confirmed | held | Malformed external preload manifest/type bypass. |
| [044](../findings/044-literal-spread-hydration/README.md) | confirmed | held | Withdrawn uncommon literal-spread shape; no new draft. |
| [045](../findings/045-server-optimistic-write-wording/README.md) | confirmed | held | Intentionally invalid server optimistic write. |
| [046](../findings/046-held-derived-store-seed/README.md) | confirmed | held | Artificial additive draft derivation; ordinary app failure not established. |
| [047](../findings/047-derived-store-accessor-example/README.md) | confirmed | fileable | Literal migration recipe fails TypeScript without any type bypass. |
| [048](../findings/048-first-loading-held-signal/README.md) | confirmed | held | Old committed value in a newly mounted plain-signal boundary; semantics wording, not tearing. |
| [049](../findings/049-document-live-channel-abort/README.md) | fixed-upstream | excluded-fixed | Desired-behavior repro passes in the latest tested runtime; historical failing versions retained. |
| [050](../findings/050-literal-handler-attribution/README.md) | duplicate | held | Known literal-handler attribution family. |
| [051](../findings/051-unnamed-attribution-owner-id/README.md) | confirmed | held | Unnamed diagnostic labels only. |
| [052](../findings/052-transparent-ssr-slot/README.md) | confirmed | held | Internal SSR source-slot allocation; no hydration mismatch. |
| [053](../findings/053-await-send-until-context/README.md) | fixed-upstream | excluded-fixed | Desired-behavior repro passes in the latest tested runtime; historical failing versions retained. |
| [054](../findings/054-prearrived-recovery-wait/README.md) | confirmed | held | Recovery-clock accounting only. |
| [055](../findings/055-held-navigation-feedback/README.md) | confirmed | fileable | Ordinary delayed navigation indicator is absent under a held route. |
| [056](../findings/056-latest-mounted-boundary/README.md) | duplicate | held | Duplicate of #3851 with compiled JSX repro; hold a repeated report. |
| [057](../findings/057-loading-lazy-hydration-order/README.md) | confirmed | fileable | An ordinary typed SSR layout changes visible static/lazy child order during hydration. |
